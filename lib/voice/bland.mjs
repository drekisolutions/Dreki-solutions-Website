import {jsonRequest} from './delivery.mjs';
import {validateRecord} from './store.mjs';

export async function verifyBlandCall(callId,c,request=fetch,now=Date.now()) {
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(callId))throw new Error('Provider call ID required');
  const fields='call_id,inbound,to,created_at,completed,queue_status,agent_id,persona_id,pathway_id,agent_version_id,sid';
  const call=await jsonRequest(`https://api.bland.ai/v1/calls/${callId}?fields=${fields}`,{headers:{authorization:c.blandToken}},request);
  const created=Date.parse(call.created_at);
  if(call.call_id!==callId || call.inbound!==true || call.to!==c.caller ||
      call.persona_id!==c.personaId || call.pathway_id!==c.pathwayId ||
      (call.agent_id!=null && call.agent_id!==c.agentId) ||
      !/^[0-9a-f-]{36}$/i.test(call.agent_version_id??'') ||
      !Number.isFinite(created) || created>now+5000 || now-created>600000 ||
      call.completed!==false || call.queue_status!=='started')throw new Error('Call identity not verified');
  return call;
}
export function captureRecord(body) {
  if(!body || body.message_confirmed!==true)throw new Error('Caller message approval required');
  const {message_confirmed,...record}=body;
  if(typeof record.callback_number==='string') {
    const value=record.callback_number.trim().replace(/[ ()-]/g,'');
    record.callback_number=/^\d{10}$/.test(value)?'+1'+value:/^1\d{10}$/.test(value)?'+'+value:value;
    if(record.callback_confirmed!==true)throw new Error('Callback confirmation required');
  }
  validateRecord(record);
  return record;
}
export async function verifiedBlandRecord(body,c,request=fetch,now=Date.now()) {
  validateRecord(body);
  await verifyBlandCall(body.call_id,c,request,now);
  return body;
}
