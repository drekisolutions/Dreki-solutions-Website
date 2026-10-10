import {createHash} from 'node:crypto';
import {claim,finish} from './store.mjs';

export async function jsonRequest(url,options={},request=fetch) {
  const res=await request(url,{...options,redirect:'error',signal:AbortSignal.timeout(8000)});
  if(!res.ok || !res.body) throw new Error('Provider request rejected or empty');
  const reader=res.body.getReader();let length=0;const chunks=[];
  for(;;) {const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>262144){await reader.cancel();throw new Error('Provider response too large');}chunks.push(value);}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function recordText(r) {
  return [`Type: ${r.kind}`,`Call reference: ${r.call_id}`,`Name: ${r.name||'Not provided'}`,
    `Callback: ${r.callback_number||'Not provided'}`,`Callback confirmed by caller: ${r.callback_confirmed?'Yes':'No'}`,
    '',r.message].join('\n');
}
export async function sendReport(channel,r,c,key,request=fetch) {
  const ref=createHash('sha256').update(key+':'+channel).digest('hex');
  const text=recordText(r)+'\n\nDelivery reference: '+ref;
  const post=(url,token,body)=>jsonRequest(url,{method:'POST',headers:{Authorization:token,'Content-Type':'application/json'},body:JSON.stringify(body)},request);
  let receipt;
  if(channel==='clickup') receipt=await post(`https://api.clickup.com/api/v2/list/${c.list}/task`,c.clickupToken,{name:`Voice ${r.kind}: ${r.call_id}`,description:text});
  else {
    const credentials=c.gmail;
    let token;
    try {
      if(credentials.scope!=='https://www.googleapis.com/auth/gmail.send' || credentials.sender!==c.email) throw new Error('Wrong Gmail identity');
      token=await jsonRequest('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',client_id:credentials.client_id,client_secret:credentials.client_secret,refresh_token:credentials.refresh_token})},request);
      if(typeof token.access_token!=='string'||!token.access_token)throw new Error('Missing token');
    }catch { const error=new Error('Gmail authorization unavailable');error.definitelyNotSent=true;throw error; }
    const encoded=Buffer.from(text,'utf8').toString('base64').match(/.{1,76}/g).join('\r\n');
    const mime=[`From: ${c.email}`,`To: ${c.email}`,`Subject: Voice ${r.kind}: ${r.call_id}`,
      `Message-ID: <voice-${ref}@dreki-solutions.com>`,'MIME-Version: 1.0','Content-Type: text/plain; charset=utf-8','Content-Transfer-Encoding: base64','',encoded].join('\r\n');
    receipt=await post('https://gmail.googleapis.com/gmail/v1/users/me/messages/send','Bearer '+token.access_token,{raw:Buffer.from(mime).toString('base64url')});
  }
  if(typeof receipt.id!=='string'||!receipt.id||receipt.id.length>500) throw new Error('Missing provider receipt');
  return receipt.id;
}
export async function deliver(pool,c,key,send=sendReport) {
  const results=await Promise.allSettled(['clickup','email'].map(async channel=>{
    const item=await claim(pool,key,channel);if(!item)return;
    let state='uncertain',remote=null;
    try {remote=await send(channel,item.record,c,key);state='sent';}
    catch(error){if(error.definitelyNotSent)state=item.attempts<3?'pending':'failed';}
    await finish(pool,key,channel,item.id,state,remote);
  }));
  const failures=results.filter(result=>result.status==='rejected');
  if(failures.length)throw new AggregateError(failures.map(result=>result.reason),'Delivery persistence unavailable');
}
export async function drain(pool,c,send=sendReport) {
  // An interrupted function may have sent before dying. Never automatically resend it.
  await pool.query("UPDATE voice_delivery SET state='uncertain',updated_at=now() WHERE state='inflight' AND updated_at<now()-interval '5 minutes'");
  const {rows}=await pool.query("SELECT DISTINCT record_key FROM voice_delivery WHERE state='pending' AND attempts<3 ORDER BY record_key LIMIT 3");
  for(const {record_key} of rows) await deliver(pool,c,record_key,send);
  const result=await pool.query('SELECT state,count(*)::int AS count FROM voice_delivery GROUP BY state');
  return result.rows;
}
