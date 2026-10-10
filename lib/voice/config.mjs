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
  return { origin, account, caller, target, applicationSid, twilioToken: required('VOICE_TWILIO_AUTH_TOKEN'),
    clickupToken: required('VOICE_CLICKUP_TOKEN'), gmail: JSON.parse(required('VOICE_GMAIL_CREDENTIALS')),
    workerSecret: required('VOICE_WORKER_SECRET'), blandToken: required('VOICE_BLAND_TOKEN'),
    blandWebhookSecret: required('VOICE_BLAND_WEBHOOK_SECRET'),
    agentId: 'a14c385f-e975-454f-a6f3-01d334da0d59',
    personaId: '02c4f5ea-9ffe-4aed-a666-68b9045dc304',
    pathwayId: 'a21a4d6b-0226-49e9-9800-3e63b0471048',
    list: '901421122364', email: 'brett@dreki-solutions.com' };
}
