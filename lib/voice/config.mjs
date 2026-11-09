const SOFIA_AGENT_ID = 'a14c385f-e975-454f-a6f3-01d334da0d59';
const AGENT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function config(env = process.env) {
  const required = key => {
    const value = env[key];
    if (typeof value !== 'string' || !value || /[\r\n]/.test(value)) throw new Error('Voice configuration unavailable');
    return value;
  };
  const origin = required('VOICE_PUBLIC_ORIGIN');
  if (new URL(origin).origin !== origin || !origin.startsWith('https://')) throw new Error('Fixed HTTPS origin required');
  const account = required('VOICE_TWILIO_ACCOUNT_SID');
  const caller = required('VOICE_INBOUND_NUMBER'), target = required('VOICE_TRANSFER_NUMBER');
  if (!/^AC[0-9a-f]{32}$/i.test(account) || ![caller,target].every(n=>/^\+[1-9]\d{7,14}$/.test(n)) || caller===target) throw new Error('Invalid voice identity');
  const applicationSid=required('VOICE_TWILIO_APP_SID');
  if(!/^AP[0-9a-f]{32}$/i.test(applicationSid))throw new Error('Invalid application identity');
  const list = env.VOICE_CLICKUP_LIST_ID;
  if (typeof list !== 'string' || !/^\d+$/.test(list)) throw new Error('Voice configuration error: VOICE_CLICKUP_LIST_ID must be a digits-only ClickUp list id');
  const email = env.VOICE_NOTIFY_EMAIL;
  if (typeof email !== 'string' || email.length>254 || /[\s]/.test(email) || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) throw new Error('Voice configuration error: VOICE_NOTIFY_EMAIL must be a single email address');
  const configuredAgent = env.VOICE_BLAND_AGENT_ID;
  const agentId = configuredAgent == null || configuredAgent === '' ? SOFIA_AGENT_ID : configuredAgent;
  if (typeof agentId !== 'string' || /[\r\n]/.test(agentId) || !AGENT_UUID.test(agentId)) throw new Error('Voice configuration error: VOICE_BLAND_AGENT_ID must be a UUID');
  return { origin, account, caller, target, applicationSid, twilioToken: required('VOICE_TWILIO_AUTH_TOKEN'),
    clickupToken: required('VOICE_CLICKUP_TOKEN'), gmail: JSON.parse(required('VOICE_GMAIL_CREDENTIALS')),
    workerSecret: required('VOICE_WORKER_SECRET'), blandToken: required('VOICE_BLAND_TOKEN'),
    blandWebhookSecret: required('VOICE_BLAND_WEBHOOK_SECRET'),
    agentId, list, email };
}
