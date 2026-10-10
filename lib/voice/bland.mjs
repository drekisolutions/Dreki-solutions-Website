import {jsonRequest} from './delivery.mjs';
import {validateRecord} from './store.mjs';

export async function verifyBlandCall(callId,c,request=fetch,now=Date.now()) {
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(callId))throw new Error('Provider call ID required');
  const fields='call_id,inbound,to,created_at,completed,queue_status,agent_id,request_data';
  const call=await jsonRequest(`https://api.bland.ai/v1/calls/${callId}?fields=${fields}`,{headers:{authorization:c.blandToken}},request);
  const created=Date.parse(call.created_at);
  if(call.call_id!==callId || call.inbound!==true || call.to!==c.caller ||
      (call.agent_id??call.request_data?.agent_id)!==c.agentId || !Number.isFinite(created) || created>now+5000 || now-created>600000 ||
      call.completed!==false || call.queue_status!=='started')throw new Error('Call identity not verified');
  return call;
}
export async function verifiedBlandRecord(body,c,request=fetch,now=Date.now()) {
  validateRecord(body);
  await verifyBlandCall(body.call_id,c,request,now);
  return body;
}
