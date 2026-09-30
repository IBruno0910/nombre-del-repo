import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import { createInquiryHandler, validateInquiry, leadEmail, receiptEmail, safeMailError } from './inquiries.js';
const env = { SMTP_USER:'test@example.com', SMTP_PASS:'test-only', MAIL_FROM:'Open World Aviation <contact@openworldaviation.com>', SEND_AUTOREPLY:'true', SITE_ORIGIN:'https://example.com' };
const base = () => ({ kind:'contact',language:'en',name:'Test Visitor',email:'visitor@example.com',phone:'',company:'',message:'Acquisition inquiry',service:2,requestId:randomUUID(),website:'' });
const future = days => new Date(Date.now()+days*86400000).toISOString().slice(0,10);
async function request(handler,data,options={}) {
  const req = Readable.from([Buffer.from(JSON.stringify(data))]); req.method=options.method || 'POST'; req.headers={host:'example.com',origin:'https://example.com','content-type':'application/json',...options.headers}; req.socket={remoteAddress:'127.0.0.1'};
  let status,body;
  await handler(req,{ writeHead:(code)=>{status=code;},end:value=>{body=JSON.parse(value);} });
  return {status,body};
}
test('routes owner email correctly and sends visitor receipt only after owner acceptance',async()=>{
  const calls=[];const handler=createInquiryHandler({env,send:async(email,key)=>{calls.push({email,key});return 'accepted';}});
  const input=base();input.to='attacker@example.com';
  const result=await request(handler,input);
  assert.equal(result.status,200);assert.equal(result.body.receipt,'accepted');assert.equal(calls.length,2);
  assert.deepEqual(calls[0].email.to,['contact@openworldaviation.com']);assert.equal(calls[0].email.reply_to,'visitor@example.com');
  assert.deepEqual(calls[1].email.to,['visitor@example.com']);assert.match(calls[1].email.text,/get in touch/);
  await request(handler,input);assert.equal(calls.length,2,'retry must not send duplicate lead or receipt');
});
test('failed lead does not claim success or send an acknowledgment',async()=>{
  let calls=0;const logs=[];const failure=new Error('rejected visitor@example.com');failure.code='EAUTH';failure.responseCode=535;failure.command='AUTH PLAIN';
  const handler=createInquiryHandler({env,send:async()=>{calls++;throw failure;},logger:{error:(...entry)=>logs.push(entry)}});
  const result=await request(handler,base());assert.equal(result.status,502);assert.equal(result.body.ok,undefined);assert.equal(calls,1);
  assert.deepEqual(logs,[['mail_delivery_failed',{name:'Error',code:'EAUTH',command:'AUTH PLAIN',responseCode:535}]]);
  assert.doesNotMatch(JSON.stringify(logs),/visitor@example\.com|rejected/);
});
test('receipt failure preserves successful lead and avoids duplicate lead on retry',async()=>{
  let calls=0;const input=base();const handler=createInquiryHandler({env,send:async()=>{calls++;if(calls===2)throw new Error('receipt failure');return 'accepted';},logger:{error:()=>{}}});
  const result=await request(handler,input);assert.equal(result.body.ok,true);assert.equal(result.body.receipt,'failed');
  const retry=await request(handler,input);assert.equal(retry.body.receipt,'accepted');assert.equal(calls,3);
});
test('mail diagnostics expose only bounded provider metadata',()=>{
  const error=new Error('secret test-only visitor@example.com');error.code='E'.repeat(100);error.syscall='connect';error.response='535 private provider response';
  assert.deepEqual(safeMailError(error),{name:'Error',code:'E'.repeat(80),syscall:'connect'});
  assert.doesNotMatch(JSON.stringify(safeMailError(error)),/secret|test-only|visitor|private/);
});
test('unconfigured transport fails honestly and never invokes delivery',async()=>{
  const handler=createInquiryHandler({env:{SITE_ORIGIN:'https://example.com'},send:async()=>assert.fail('must not send')});
  assert.equal((await request(handler,base())).status,503);
});
test('rejects invalid dates, identical routes, missing fields, bots and foreign origins',async()=>{
  const handler=createInquiryHandler({env,send:async()=>assert.fail('must not send')});
  assert.equal((await request(handler,base(),{headers:{origin:'https://other.example'}})).status,403);
  for (const overrides of [{email:'invalid'},{name:' '},{website:'spam'},{service:8},{name:'Name\r\nBcc:other@example.com'}]) assert.equal((await request(handler,{...base(),...overrides})).status,400);
  const flight={type:'round-trip',passengers:4,legs:[{from:'Miami',to:'Miami',date:future(3)}],returnDate:future(2)};
  assert.throws(()=>validateInquiry({...base(),kind:'flight',flight}));
  flight.legs[0].to='Nassau';assert.throws(()=>validateInquiry({...base(),kind:'flight',flight}));
  flight.returnDate=future(5);assert.equal(validateInquiry({...base(),kind:'flight',flight}).flight.passengers,4);
  flight.legs[0].date='2027-02-30';assert.throws(()=>validateInquiry({...base(),kind:'flight',flight}));
});
test('multi-city email includes all legs and Spanish receipt without reflecting visitor content',()=>{
  const input={...base(),kind:'flight',language:'es',flight:{type:'multi-city',passengers:6,legs:[{from:'Buenos Aires',to:'Córdoba',date:future(2)},{from:'Córdoba',to:'Mendoza',date:future(3)}]}};
  const data=validateInquiry(input);const email=leadEmail(data,env.MAIL_FROM);
  assert.match(email.text,/Leg 2: Córdoba → Mendoza/);assert.match(email.text,/Passengers: 6/);
  assert.match(receiptEmail(data,env.MAIL_FROM).text,/Recibimos su mensaje/);assert.doesNotMatch(receiptEmail(data,env.MAIL_FROM).text,/Acquisition inquiry/);
});
test('per-address rate limits throttle repeated sends',async()=>{
  const handler=createInquiryHandler({env,send:async()=> 'accepted'});
  for(let i=0;i<5;i++)assert.equal((await request(handler,base())).status,200);
  assert.equal((await request(handler,base())).status,429);
});
