import twilio from 'twilio';

export function transferOpen(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error('Trusted clock unavailable');
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
  return ['Mon','Tue','Wed','Thu','Fri'].includes(parts.weekday) && +parts.hour>=9 && +parts.hour<16;
}
export const validSid = value => typeof value==='string' && /^CA[0-9a-f]{32}$/i.test(value);
const response=()=>new twilio.twiml.VoiceResponse();
export function end(message) { const r=response(); if(message) r.say({voice:'alice'},message);r.hangup();return r.toString(); }

export function transition(config, root, action, p, current, now=new Date(), generation=null) {
  const channel=action=>['screen','accept'].includes(action)?'screen':'caller';
  const url=action=>{
    state.pending[channel(action)]={action,generation:state.sequence};
    return `${config.origin}/api/voice/twilio/${root}/${action}/${state.sequence}`;
  };
  const gather=(action,prompt,speech=false)=>{
    const r=response();const opts={action:url(action),method:'POST',timeout:5,actionOnEmptyResult:true,input:speech?'speech':'dtmf'};
    if(speech) Object.assign(opts,{speechTimeout:'auto',language:'en-US'});
    else if(action==='callback') opts.finishOnKey='#'; else opts.numDigits=1;
    r.gather(opts).say({voice:'alice'},prompt);return r.toString();
  };
  const callback=()=>gather('callback','Brett is unavailable. I can take a message. Enter your callback number, including country code, then press pound. For a United States number, ten digits also works. To leave a message without a callback number, press zero then pound.');
  const message=()=>gather('message','Please say your name and a short message for Brett after this prompt.',true);
  let state=current?structuredClone(current):null;
  const result=(xml,record)=>{
    if(state && !xml.includes('<Dial '))state[channel(action)==='screen'?'lastScreenXml':'lastCallerXml']=xml;
    return {state,xml,...(record?{record}:{})};
  };
  if(!validSid(root)||!validSid(p.CallSid)) throw new Error('Invalid call identity');
  if(action==='start') {
    if(state) {
      if(now.getTime()>=state.expires)throw new Error('Expired call');
      // A lost initial HTTP response is ambiguous: never issue another Dial and
      // never simply hang up on the caller. Fall back to collecting a message.
      if(state.phase==='dial')Object.assign(state,{phase:'callback',retries:0,sequence:state.sequence+1});
      return result(state.phase==='callback'?callback():(state.lastCallerXml??end()));
    }
    state={phase:transferOpen(now)?'dial':'callback',expires:now.getTime()+600000,child:null,decision:null,callback:null,confirmed:false,message:null,retries:0,sequence:1,pending:{caller:null,screen:null}};
    if(state.phase!=='dial') return result(callback());
    const r=response();r.dial({action:url('result'),method:'POST',timeout:20,timeLimit:300,answerOnBridge:true,callerId:config.caller,record:'do-not-record'})
      .number({url:url('screen'),method:'POST'},config.target);
    return result(r.toString());
  }
  if(!state || now.getTime()>=state.expires) throw new Error('Missing or expired call');
  const side=channel(action);
  if(side==='caller' && p.CallSid!==root)throw new Error('Unrelated original call');
  if(side==='screen' && (p.CallSid===root || p.ParentCallSid!==root || (state.child && state.child!==p.CallSid)))throw new Error('Unrelated transfer leg');
  if(generation!==null && (state.pending?.[side]?.action!==action || state.pending[side].generation!==generation)) {
    // A retry or stale prompt may only replay the current continuation. Caller
    // and screening generations are independent while Dial is outstanding.
    return result(side==='screen'?(state.phase==='dial'?state.lastScreenXml??end():end()):state.lastCallerXml??end());
  }
  state.pending[side]=null;
  state.sequence+=1;
  if(['screen','accept'].includes(action)) {
    if(p.CallSid===root || p.ParentCallSid!==root || state.phase!=='dial' || (state.child && state.child!==p.CallSid) || state.decision) throw new Error('Unrelated or completed transfer leg');
    state.child=p.CallSid;
    if(action==='screen') return result(gather('accept','Dreki Solutions caller requesting Brett. Press one to accept. Press any other key to decline.'));
    state.decision=p.Digits==='1'&&transferOpen(now)?'accepted':'declined';
    return result(state.decision==='accepted'?response().toString():end());
  }
  if(p.CallSid!==root) throw new Error('Unrelated original call');
  if(action==='result') {
    if(state.phase!=='dial') throw new Error('Transfer already resolved');
    if(p.DialCallSid && (!validSid(p.DialCallSid) || (state.child&&state.child!==p.DialCallSid))) throw new Error('Wrong transfer result');
    if(state.decision==='accepted' && state.child && p.DialCallSid===state.child && p.DialBridged==='true' && p.DialCallStatus==='completed') {state.phase='done';return result(end());}
    state.phase='callback';return result(callback());
  }
  if(action==='send' && state.phase==='queued') return result(end('Your message has been saved for delivery to Brett. Thank you.'));
  if(!['callback','confirm','message','send'].includes(action) || state.phase!==action) throw new Error('Out-of-order callback');
  if(++state.retries>3) {state.phase='done';return result(end('I could not confirm your details. Please call again. Goodbye.'));}
  const digits=p.Digits??'';
  if(action==='callback') {
    if(digits==='0') {state.phase='message';state.retries=0;return result(message());}
    const number=(digits.length===10?'+1':'+')+digits;
    if(!/^\+[1-9]\d{7,14}$/.test(number)) return result(callback());
    Object.assign(state,{phase:'confirm',callback:number,retries:0});
    return result(gather('confirm',`Your callback number is ${number.slice(1).split('').join(' ')}. Press one to confirm, or two to enter it again.`));
  }
  if(action==='confirm') {
    if(digits==='1') {Object.assign(state,{phase:'message',confirmed:true,retries:0});return result(message());}
    if(digits==='2') {Object.assign(state,{phase:'callback',callback:null,confirmed:false,retries:0});return result(callback());}
    return result(gather('confirm','Press one to confirm your callback number, or two to enter it again.'));
  }
  if(action==='message') {
    const text=(p.SpeechResult??'').trim();
    if(!text) return result(message());
    if(text.length>4000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) throw new Error('Invalid message');
    Object.assign(state,{phase:'send',message:text,retries:0});
    return result(gather('send',`I heard: ${text}. Press one to save this message for Brett, two to say it again, or zero to cancel.`));
  }
  if(digits==='1') {
    state.phase='queued';
    return result(end('Your message has been saved for delivery to Brett. Thank you.'),{call_id:root,kind:'callback',name:'',callback_number:state.callback,callback_confirmed:state.confirmed,message:state.message});
  }
  if(digits==='2') {Object.assign(state,{phase:'message',message:null,retries:0});return result(message());}
  if(digits==='0') {state.phase='done';return result(end('Your message was canceled. Goodbye.'));}
  return result(gather('send','Press one to save your message, two to say it again, or zero to cancel.'));
}
