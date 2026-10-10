import {verifyBlandCall} from './bland.mjs';
import {jsonRequest} from './delivery.mjs';
import {validSid} from './transfer.mjs';

// Redirect the existing inbound leg. Never originate another call here.
// A durable claim precedes the provider mutation; ambiguous outcomes never retry.
export async function handoff(pool,c,callId,request=fetch,now=Date.now()) {
  const call=await verifyBlandCall(callId,c,request,now);
  if(!validSid(call.sid))throw new Error('Missing provider call binding');
  const url=`https://api.twilio.com/2010-04-01/Accounts/${c.account}/Calls/${call.sid}.json`;
  const headers={Authorization:'Basic '+Buffer.from(c.account+':'+c.twilioToken).toString('base64')};
  const leg=await jsonRequest(url,{headers},request);
  const created=Date.parse(leg.date_created);
  if(leg.sid!==call.sid || leg.account_sid!==c.account || leg.to!==c.caller ||
      leg.direction!=='inbound' || leg.status!=='in-progress' || leg.parent_call_sid ||
      !Number.isFinite(created) || created>now+5000 || now-created>300000)throw new Error('Unapproved inbound leg');
  const claim=await pool.query("INSERT INTO voice_redirects(bland_call_id,twilio_call_sid,state) VALUES($1,$2,'claimed') ON CONFLICT DO NOTHING RETURNING bland_call_id",[callId,call.sid]);
  if(!claim.rows.length) {
    const prior=await pool.query('SELECT twilio_call_sid,state FROM voice_redirects WHERE bland_call_id=$1',[callId]);
    if(prior.rows[0]?.twilio_call_sid===call.sid && prior.rows[0].state==='requested')return {handoff_requested:true};
    throw new Error('Handoff already attempted or uncertain');
  }
  try {
    const receipt=await jsonRequest(url,{method:'POST',headers:{...headers,'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({Url:c.origin+'/api/voice/twilio/start',Method:'POST',TimeLimit:'300'})},request);
    if(receipt.sid!==call.sid || receipt.account_sid!==c.account)throw new Error('Unconfirmed redirect');
    await pool.query("UPDATE voice_redirects SET state='requested' WHERE bland_call_id=$1",[callId]);
    return {handoff_requested:true};
  } catch {
    await pool.query("UPDATE voice_redirects SET state='uncertain' WHERE bland_call_id=$1 AND state='claimed'",[callId]).catch(()=>{});
    throw new Error('Handoff outcome uncertain');
  }
}
