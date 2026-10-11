import twilio from 'twilio';
import {verifyBlandCall} from './bland.mjs';
import {jsonRequest} from './delivery.mjs';
import {validSid,transferOpen} from './transfer.mjs';

const unavailable={handoff_requested:false,available:false,next_action:'take_message'};
const connected={handoff_requested:true,available:true,next_action:'connected'};
const auth=c=>({Authorization:'Basic '+Buffer.from(c.account+':'+c.twilioToken).toString('base64')});
const calls=c=>`https://api.twilio.com/2010-04-01/Accounts/${c.account}/Calls`;
const callback=(c,id,action)=>`${c.origin}/api/voice/consult/${id}/${action}`;
const stopped=()=>{const r=new twilio.twiml.VoiceResponse();r.hangup();return r.toString();};
const post=(url,c,body,request)=>jsonRequest(url,{method:'POST',headers:{...auth(c),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body)},request);
export function bridgeXml(c,id,human=false) {
  const r=new twilio.twiml.VoiceResponse();
  r.dial({timeLimit:300,record:'do-not-record'}).conference({beep:false,record:'do-not-record',maxParticipants:2,
    startConferenceOnEnter:!human,endConferenceOnExit:true,waitUrl:'',participantLabel:human?'brett':'caller',
    ...(human?{statusCallback:callback(c,id,'conference'),statusCallbackMethod:'POST',statusCallbackEvent:'join leave'}:{})},'dreki-'+id);
  r.hangup();return r.toString();
}
async function rootCall(c,sid,request,now) {
  if(!validSid(sid))throw new Error('Missing provider call binding');
  const leg=await jsonRequest(`${calls(c)}/${sid}.json`,{headers:auth(c)},request);
  const created=Date.parse(leg.date_created);
  if(leg.sid!==sid || leg.account_sid!==c.account || leg.to!==c.caller || leg.direction!=='inbound' ||
      leg.status!=='in-progress' || leg.parent_call_sid || !Number.isFinite(created) || created>now+5000 || now-created>300000)throw new Error('Unapproved inbound leg');
  return leg;
}
async function read(pool,id) {return (await pool.query('SELECT * FROM voice_consults WHERE bland_call_id=$1',[id])).rows[0];}
async function abandon(pool,id) {
  await pool.query("UPDATE voice_consults SET phase='unavailable',cleanup_needed=(target_sid IS NOT NULL) WHERE bland_call_id=$1 AND (phase IN ('calling','ready') OR (phase='connecting' AND NOT redirect_started))",[id]);
}
// The original Bland session stays connected until Brett has pressed one and joined.
// A claim precedes call creation. No retry can originate a second screening call.
export async function handoff(pool,c,callId,request=fetch,now=Date.now(),pause=ms=>new Promise(r=>setTimeout(r,ms)),getNow=null) {
  const started=Date.now();
  const clock=getNow??(()=>now+Date.now()-started);
  const call=await verifyBlandCall(callId,c,request,now);
  await rootCall(c,call.sid,request,now);
  if(!transferOpen(new Date(clock())))return unavailable;
  const claim=await pool.query("INSERT INTO voice_consults(bland_call_id,root_sid,phase,deadline) VALUES($1,$2,'calling',$3) ON CONFLICT DO NOTHING RETURNING bland_call_id",[callId,call.sid,new Date(now+45000)]);
  if(claim.rows.length) {
    try {
      if(!transferOpen(new Date(clock()))) {await abandon(pool,callId);return unavailable;}
      const leg=await post(calls(c)+'.json',c,{To:c.target,From:c.caller,Url:callback(c,callId,'screen'),Method:'POST',
        Timeout:'20',TimeLimit:'300',Record:'false',StatusCallback:callback(c,callId,'status'),StatusCallbackMethod:'POST',StatusCallbackEvent:'completed'},request);
      if(!validSid(leg.sid)||leg.account_sid!==c.account)throw new Error('Missing screening receipt');
      const bound=await pool.query("UPDATE voice_consults SET target_sid=$2,cleanup_needed=(phase='unavailable') WHERE bland_call_id=$1 AND (target_sid IS NULL OR target_sid=$2) RETURNING bland_call_id",[callId,leg.sid]);
      if(!bound.rows.length)throw new Error('Conflicting screening receipt');
    } catch {await abandon(pool,callId);}
  }
  // Bounded wait; only a confirmed connection may stop the assistant's message flow.
  for(;;) {
    const state=await read(pool,callId);
    if(!state || state.root_sid!==call.sid)throw new Error('Missing handoff state');
    if(state.phase==='connected')return connected;
    if(state.phase==='unavailable'){await cleanupConsults(pool,c,request,callId).catch(()=>{});return unavailable;}
    if(state.phase==='uncertain')throw new Error('Connection outcome uncertain');
    if(Date.parse(state.deadline)<=clock()) {
      await abandon(pool,callId);
      const final=await read(pool,callId);
      if(final.phase==='connected')return connected;
      if(final.phase!=='unavailable')throw new Error('Connection outcome unconfirmed');
      await cleanupConsults(pool,c,request,callId).catch(()=>{});
      return unavailable;
    }
    await pause(Math.max(1,Math.min(1000,Date.parse(state.deadline)-clock())));
  }
}
async function targetCall(pool,c,id,p,request,now) {
  const row=await read(pool,id);
  if(!row || !validSid(p.CallSid) || (row.target_sid && row.target_sid!==p.CallSid))throw new Error('Unrelated screening call');
  const leg=await jsonRequest(`${calls(c)}/${p.CallSid}.json`,{headers:auth(c)},request);
  const created=Date.parse(leg.date_created);
  if(leg.sid!==p.CallSid || leg.account_sid!==c.account || leg.to!==c.target || leg.from!==c.caller ||
      leg.direction!=='outbound-api' || !Number.isFinite(created) || created<Date.parse(row.created_at)-5000 || created>now+5000)throw new Error('Unapproved screening leg');
  const bound=await pool.query("UPDATE voice_consults SET target_sid=$2,cleanup_needed=(phase='unavailable') WHERE bland_call_id=$1 AND (target_sid IS NULL OR target_sid=$2) RETURNING bland_call_id",[id,p.CallSid]);
  if(!bound.rows.length)throw new Error('Screening already bound');
  return {row,leg};
}
async function callerConference(pool,c,id,p,row,request,now) {
  if(p.ConferenceSid!==row.conference_sid || !row.redirect_started)throw new Error('Unrelated caller conference');
  if(p.StatusCallbackEvent==='participant-leave') {
    await pool.query("UPDATE voice_consults SET root_departed=true,phase=CASE WHEN phase='connecting' THEN 'uncertain' ELSE phase END WHERE bland_call_id=$1",[id]);
    return '';
  }
  if(p.StatusCallbackEvent!=='participant-join' || !['connecting','uncertain'].includes(row.phase))return '';
  await rootCall(c,row.root_sid,request,now);
  const base=`https://api.twilio.com/2010-04-01/Accounts/${c.account}/Conferences/${row.conference_sid}/Participants/`;
  for(const sid of [row.root_sid,row.target_sid]) {
    const member=await jsonRequest(base+sid+'.json',{headers:auth(c)},request);
    if(member.call_sid!==sid || member.conference_sid!==row.conference_sid)throw new Error('Bridge participant missing');
  }
  await pool.query("UPDATE voice_consults SET phase='connected' WHERE bland_call_id=$1 AND phase IN ('connecting','uncertain') AND redirect_started AND NOT target_departed AND NOT root_departed",[id]);
  return '';
}
async function screeningReply(pool,c,id,leg,clock) {
  const latest=await read(pool,id);
  if(!latest || latest.target_departed || latest.root_departed || leg.status!=='in-progress')return stopped();
  if(latest.redirect_started && ['connecting','connected','uncertain'].includes(latest.phase))return bridgeXml(c,id,true);
  if(['ready','connecting'].includes(latest.phase) && transferOpen(new Date(clock())) && Date.parse(latest.deadline)>clock())return bridgeXml(c,id,true);
  return stopped();
}
// Invoked only after official Twilio signature/account validation in http.mjs.
export async function consultEvent(pool,c,id,action,p,request=fetch,now=Date.now()) {
  const started=Date.now();
  const clock=()=>now+Date.now()-started;
  if(action==='conference') {
    const bound=await read(pool,id);
    if(bound && p.CallSid===bound.root_sid)return callerConference(pool,c,id,p,bound,request,now);
  }
  const {row,leg}=await targetCall(pool,c,id,p,request,now);
  if(action==='status' || (action==='conference' && p.StatusCallbackEvent==='participant-leave')) {
    await pool.query("UPDATE voice_consults SET target_departed=true,phase=CASE WHEN phase='connecting' AND redirect_started THEN 'uncertain' ELSE phase END WHERE bland_call_id=$1",[id]);
    await abandon(pool,id);return '';
  }
  if(action==='conference' && p.StatusCallbackEvent!=='participant-join')return '';
  if(['unavailable','uncertain'].includes(row.phase))return action==='conference'?'':screeningReply(pool,c,id,leg,clock);
  // A replay after entry returns the same fixed conference for the same CallSid.
  // It never creates another leg or restarts screening, and does not end an
  // already accepted call merely because office hours have since ended.
  if(['connecting','connected'].includes(row.phase) && ['screen','accept'].includes(action))return screeningReply(pool,c,id,leg,clock);
  if(row.phase==='connected')return '';
  if(!transferOpen(new Date(clock())) || Date.parse(row.deadline)<=clock() || leg.status!=='in-progress') {
    await abandon(pool,id);await cleanupConsults(pool,c,request,id).catch(()=>{});return action==='conference'?'':screeningReply(pool,c,id,leg,clock);
  }
  if(row.phase==='ready' && ['screen','accept'].includes(action))return screeningReply(pool,c,id,leg,clock);
  if(action==='screen') {
    const r=new twilio.twiml.VoiceResponse();
    r.gather({input:'dtmf',numDigits:1,timeout:5,actionOnEmptyResult:true,action:callback(c,id,'accept'),method:'POST'})
      .say({voice:'alice'},'Dreki Solutions caller requesting Brett. Press one to accept, or any other key to decline.');
    r.hangup();return r.toString();
  }
  if(action==='accept') {
    if(p.Digits!=='1'){await abandon(pool,id);return screeningReply(pool,c,id,leg,clock);}
    await pool.query("UPDATE voice_consults SET phase='ready' WHERE bland_call_id=$1 AND phase IN ('calling','ready') AND deadline>$2 RETURNING bland_call_id",[id,new Date(clock())]);
    return screeningReply(pool,c,id,leg,clock);
  }
  if(action!=='conference' || !/^CF[0-9a-f]{32}$/i.test(p.ConferenceSid??''))throw new Error('Invalid conference event');
  const claim=await pool.query("UPDATE voice_consults SET phase='connecting',conference_sid=$2 WHERE bland_call_id=$1 AND phase='ready' AND deadline>$3 RETURNING bland_call_id",[id,p.ConferenceSid,new Date(now)]);
  if(!claim.rows.length)return '';
  try {
    const original=await verifyBlandCall(id,c,request,now);
    if(original.sid!==row.root_sid)throw new Error('Original call changed');
    await rootCall(c,row.root_sid,request,clock());
    const target=await jsonRequest(`${calls(c)}/${p.CallSid}.json`,{headers:auth(c)},request);
    const member=await jsonRequest(`https://api.twilio.com/2010-04-01/Accounts/${c.account}/Conferences/${p.ConferenceSid}/Participants/${p.CallSid}.json`,{headers:auth(c)},request);
    if(target.status!=='in-progress' || member.call_sid!==p.CallSid || member.conference_sid!==p.ConferenceSid)throw new Error('Target has left');
    if(!transferOpen(new Date(clock())) || Date.parse(row.deadline)<=clock()) {
      await abandon(pool,id);await cleanupConsults(pool,c,request,id).catch(()=>{});return '';
    }
    const allowed=await pool.query("UPDATE voice_consults SET redirect_started=true WHERE bland_call_id=$1 AND phase='connecting' AND NOT target_departed AND NOT redirect_started AND deadline>$2 RETURNING bland_call_id",[id,new Date(clock())]);
    if(!allowed.rows.length){await cleanupConsults(pool,c,request,id).catch(()=>{});return '';}
    const receipt=await post(`${calls(c)}/${row.root_sid}.json`,c,{Twiml:bridgeXml(c,id),TimeLimit:'300'},request);
    if(receipt.sid!==row.root_sid || receipt.account_sid!==c.account)throw new Error('Unconfirmed bridge');
    // REST acknowledgement is not proof of a bridge. The root participant's
    // signed join callback must observe both persisted participants first.
  } catch {
    await pool.query("UPDATE voice_consults SET phase=CASE WHEN redirect_started THEN 'uncertain' ELSE 'unavailable' END,cleanup_needed=NOT redirect_started WHERE bland_call_id=$1 AND phase='connecting'",[id]).catch(()=>{});
    await cleanupConsults(pool,c,request,id).catch(()=>{});
    throw new Error('Connection outcome uncertain');
  }
  return '';
}

// Ending a known, abandoned screening leg is idempotent. Persist cleanup for cron.
export async function cleanupConsults(pool,c,request=fetch,id=null) {
  await pool.query("UPDATE voice_consults SET phase=CASE WHEN redirect_started THEN 'uncertain' ELSE 'unavailable' END,cleanup_needed=(NOT redirect_started AND target_sid IS NOT NULL) WHERE phase IN ('calling','ready','connecting') AND deadline<=now() AND ($1::text IS NULL OR bland_call_id=$1)",[id]);
  const rows=(await pool.query("SELECT * FROM voice_consults WHERE phase='unavailable' AND cleanup_needed AND target_sid IS NOT NULL AND ($1::text IS NULL OR bland_call_id=$1) LIMIT 3",[id])).rows;
  let failed=0;
  for(const row of rows) {
    try {
    const leg=await jsonRequest(`${calls(c)}/${row.target_sid}.json`,{headers:auth(c)},request);
    if(leg.sid!==row.target_sid || leg.account_sid!==c.account || leg.to!==c.target || leg.from!==c.caller || leg.direction!=='outbound-api')throw new Error('Unapproved cleanup leg');
    if(['queued','ringing','in-progress'].includes(leg.status))await post(`${calls(c)}/${row.target_sid}.json`,c,{Status:'completed'},request);
    await pool.query("UPDATE voice_consults SET cleanup_needed=false WHERE bland_call_id=$1 AND phase='unavailable'",[row.bland_call_id]);
    }catch{failed++;}
  }
  if(failed)throw new Error('Screening cleanup pending');
  return rows.length;
}
