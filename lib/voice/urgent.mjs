import {claimUrgentText} from './store.mjs';

const SMS_LIMIT = 319;
const MESSAGE_LIMIT = 200;
const DAILY_CAP = 10;

function oneLine(value) {
  return String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/ +/g,' ').trim();
}
function sliceChars(value, max) {
  return Array.from(value).slice(0, Math.max(0, max)).join('');
}
export function isUrgent(record) {
  if (!record || typeof record !== 'object') return false;
  if (record.urgent === true) return true;
  return typeof record.message === 'string' && /^urgent\b/i.test(record.message.trim());
}
export function detroitClock(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Detroit', weekday: 'short', hour: '2-digit', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now).map(part => [part.type, part.value]));
  const open = ['Mon','Tue','Wed','Thu','Fri'].includes(parts.weekday) && +parts.hour >= 9 && +parts.hour < 17;
  return {open, date: `${parts.year}-${parts.month}-${parts.day}`};
}
export function urgentBody(record) {
  const callback = typeof record.callback_number === 'string' && record.callback_number ? oneLine(record.callback_number) : 'no number';
  let name = oneLine(record.name) || 'no name';
  let message = sliceChars(oneLine(record.message), MESSAGE_LIMIT);
  const text = () => `URGENT Sofia msg: ${name}, ${callback}: ${message}`;
  if (text().length > SMS_LIMIT) {
    const room = SMS_LIMIT - `URGENT Sofia msg: ${name}, ${callback}: `.length;
    if (room >= 0) message = sliceChars(message, room);
    else {
      message = '';
      name = sliceChars(name, SMS_LIMIT - `URGENT Sofia msg: , ${callback}: `.length);
    }
  }
  const body = text();
  return body.length > SMS_LIMIT ? sliceChars(body, SMS_LIMIT) : body;
}

function clean(value) {
  return typeof value === 'string' && value && !/[\r\n]/.test(value) ? value : '';
}
export function twilioSmsRequest(env, body) {
  const account = clean(env.VOICE_TWILIO_ACCOUNT_SID) || clean(env.TWILIO_ACCOUNT_SID);
  if (!/^AC[0-9a-f]{32}$/i.test(account)) return null;
  const token = clean(env.VOICE_TWILIO_AUTH_TOKEN) || clean(env.TWILIO_AUTH_TOKEN);
  const key = clean(env.TWILIO_API_KEY_SID);
  const secret = clean(env.TWILIO_API_KEY_SECRET);
  const user = token ? account : key;
  const pass = token || (key && secret ? secret : '');
  if (!user || !pass) return null;
  const to = clean(env.VOICE_URGENT_SMS_TO);
  if (!/^\+[1-9]\d{7,14}$/.test(to)) return null;
  const params = new URLSearchParams();
  params.set('To', to);
  const messaging = clean(env.TWILIO_MESSAGING_SERVICE_SID);
  if (messaging) {
    if (!/^MG[0-9a-f]{32}$/i.test(messaging)) return null;
    params.set('MessagingServiceSid', messaging);
  } else {
    const from = clean(env.TWILIO_FROM_NUMBER);
    if (!/^\+[1-9]\d{7,14}$/.test(from)) return null;
    params.set('From', from);
  }
  params.set('Body', body);
  return {
    url: `https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`,
    init: {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      redirect: 'error',
    },
  };
}

export async function notifyUrgentCapture(pool, record, env = process.env, request = fetch, now = new Date(), claim = claimUrgentText) {
  try {
    if (!isUrgent(record)) return {sent: false, reason: 'not-urgent'};
    const clock = detroitClock(now);
    if (clock.open) return {sent: false, reason: 'open'};
    const sms = twilioSmsRequest(env, urgentBody(record));
    if (!sms) {
      console.error('Urgent SMS skipped: required SMS configuration is missing.');
      return {sent: false, reason: 'config'};
    }
    const claimed = await claim(pool, record.call_id, clock.date, DAILY_CAP);
    if (!claimed) {
      console.error('Urgent SMS skipped: this call already texted or the daily cap was reached.');
      return {sent: false, reason: 'suppressed'};
    }
    const res = await request(sms.url, {...sms.init, signal: AbortSignal.timeout(8000)});
    if (!res?.ok) {
      console.error('Urgent SMS was not accepted.');
      return {sent: false, reason: 'twilio'};
    }
    return {sent: true};
  } catch {
    console.error('Urgent SMS failed.');
    return {sent: false, reason: 'error'};
  }
}
