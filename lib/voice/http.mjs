import twilio from 'twilio';
import {timingSafeEqual} from 'node:crypto';
import {advance,transaction,enqueue,validateRecord} from './store.mjs';
import {verifiedBlandRecord,verifyBlandCall,captureRecord} from './bland.mjs';
import {handoff,consultEvent,cleanupConsults} from './handoff.mjs';
import {transition,validSid} from './transfer.mjs';
import {deliver,drain,jsonRequest} from './delivery.mjs';

export function equalSecret(a,b) {
  return typeof a==='string' && typeof b==='string' && a.length>=32 && Buffer.byteLength(a)===Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a),Buffer.from(b));
}
export async function boundedBody(request) {
  const length=request.headers.get('content-length');
  if(length && (!/^\d+$/.test(length)||+length>65536))throw new Error('Invalid body size');
  if(request.headers.get('content-encoding'))throw new Error('Encoding not supported');
  if(!request.body)return '';
  const reader=request.body.getReader();let size=0;const chunks=[];
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();throw new Error('Body too large');}chunks.push(value);}
  return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks));
}
export async function twilioParams(request,c) {
  const url=new URL(request.url);
  if(request.method!=='POST'||url.search||!/^application\/x-www-form-urlencoded(?:;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')??''))throw new Error('Invalid Twilio request');
  const params=Object.create(null);let count=0;
  for(const [key,value] of new URLSearchParams(await boundedBody(request))) {
    if(Object.hasOwn(params,key)||++count>150||key.length>100||value.length>8000)throw new Error('Invalid Twilio fields');
    params[key]=value;
  }
  const signature=request.headers.get('x-twilio-signature');
  if(!signature || !/^[A-Za-z0-9+/]{27}=$/.test(signature) || !twilio.validateRequest(c.twilioToken,signature,c.origin+url.pathname,params) || params.AccountSid!==c.account || !validSid(params.CallSid))throw new Error('Unauthenticated Twilio request');
  return params;
}

export async function verifyActiveCall(c,sid,request=fetch,params={}) {
  const auth='Basic '+Buffer.from(c.account+':'+c.twilioToken).toString('base64');
  const call=await jsonRequest(`https://api.twilio.com/2010-04-01/Accounts/${c.account}/Calls/${sid}.json`,{headers:{Authorization:auth}},request);
  const created=Date.parse(call.date_created);
  if(call.sid!==sid||call.account_sid!==c.account||!['ringing','in-progress'].includes(call.status)||call.direction!=='inbound'||!Number.isFinite(created)||created>Date.now()+5000||Date.now()-created>600000)throw new Error('Call is not an active approved inbound call');
  if(call.to===c.caller)return null; // Direct, signed inbound fallback on our existing number.
  if(call.to!==c.applicationSid)throw new Error('Unapproved receiving application');
  const blandCallId=params.Param_bland_call_id;
  await verifyBlandCall(blandCallId,c,request);
  return blandCallId;
}

const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function handle(request,{pool,c,after=(_job)=>{},verifyCall=verifyActiveCall}) {
  const url=new URL(request.url);
  if(url.pathname==='/api/voice/health'&&request.method==='GET')return reply({service:'dreki-voice',version:1});
  if(url.pathname==='/api/voice/worker') {
    if(request.method!=='GET'||url.search||!equalSecret(request.headers.get('authorization'),'Bearer '+c.workerSecret))return reply({error:'Unauthorized'},401);
    const [cleanup,delivery]=await Promise.allSettled([cleanupConsults(pool,c),drain(pool,c)]);
    if(delivery.status==='rejected')return reply({error:'Delivery recovery unavailable',cleanup_pending:cleanup.status==='rejected'},503);
    return reply({delivery:delivery.value,cleanup_pending:cleanup.status==='rejected'},cleanup.status==='rejected'?503:200);
  }
  if(url.pathname==='/api/voice/handoff') {
    if(request.method!=='POST'||url.search||!equalSecret(request.headers.get('authorization'),'Bearer '+c.blandWebhookSecret))return reply({error:'Unauthorized'},401);
    if(!/^application\/json(?:;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')??''))return reply({error:'Invalid content type'},415);
    let body;
    try {body=JSON.parse(await boundedBody(request));if(!body || Object.keys(body).join()!=='call_id' || typeof body.call_id!=='string')throw new Error();}
    catch{return reply({error:'Invalid handoff'},422);}
    try{return reply(await handoff(pool,c,body.call_id));}
    catch{return reply({error:'Handoff unconfirmed. Do not retry; offer message capture.'},503);}
  }
  if(url.pathname==='/api/voice/capture') {
    if(request.method!=='POST'||url.search||!equalSecret(request.headers.get('authorization'),'Bearer '+c.blandWebhookSecret))return reply({error:'Unauthorized'},401);
    if(!/^application\/json(?:;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')??''))return reply({error:'Invalid content type'},415);
    let record;
    try {record=captureRecord(JSON.parse(await boundedBody(request)));}
    catch{return reply({saved:false,error:'Invalid report'},422);}
    try {
      const existing=await pool.query('SELECT payload = $2::jsonb AS same FROM voice_records WHERE record_key=$1',[record.call_id+':'+record.kind,record]);
      if(existing.rows.length) {
        if(!existing.rows[0].same)return reply({error:'Conflicting report replay'},409);
        after(()=>deliver(pool,c,record.call_id+':'+record.kind));
        return reply({saved:true,delivery:'queued'});
      }
      await verifiedBlandRecord(record,c);
      const key=await transaction(pool,client=>enqueue(client,record));
      after(()=>deliver(pool,c,key));
      return reply({saved:true,delivery:'queued'});
    } catch {return reply({error:'Report verification or persistence unavailable; retry the same report'},503);}
  }
  const consult=/^\/api\/voice\/consult\/([0-9a-f-]{36})\/(screen|accept|status|conference)$/.exec(url.pathname);
  if(consult) {
    let params;
    try {params=await twilioParams(request,c);}catch{return reply({error:'Invalid request'},403);}
    try {
      const xml=await consultEvent(pool,c,consult[1],consult[2],params);
      return new Response(xml,{headers:{'Content-Type':'text/xml; charset=utf-8','Cache-Control':'no-store'}});
    }catch{return reply({error:'Screening could not be processed'},503);}
  }
  const match=/^\/api\/voice\/twilio\/(start|CA[0-9a-fA-F]{32}\/(?:screen|accept|result|callback|confirm|message|send)\/\d{1,4})$/.exec(url.pathname);
  if(!match)return reply({error:'Not found'},404);
  let params;
  try{params=await twilioParams(request,c);}catch{return reply({error:'Invalid request'},403);}
  const [root,action,generation]=match[1]==='start'?[params.CallSid,'start',null]:match[1].split('/');
  try {
    const blandCallId=action==='start'?await verifyCall(c,root,fetch,params):null;
    const result=await advance(pool,root,state=>transition(c,root,action,params,state,new Date(),generation===null?null:Number(generation)),blandCallId);
    if(result.record) after(()=>deliver(pool,c,result.record.call_id+':'+result.record.kind));
    return new Response(result.xml,{headers:{'Content-Type':'text/xml; charset=utf-8','Cache-Control':'no-store'}});
  } catch {return reply({error:'Call could not be processed'},503);}
}
