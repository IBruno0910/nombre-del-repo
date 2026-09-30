import { createHash } from 'node:crypto';
import nodemailer from 'nodemailer';

const RECIPIENT = 'contact@openworldaviation.com';
const serviceNames = ['Aircraft management', 'Private charter and flight support', 'Aircraft sales and acquisitions', 'Aviation consulting and corporate solutions', 'Aircraft support and logistics'];
const emailPattern = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
function field(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value) || (required && !value.trim())) throw new Error('invalid');
  return value.trim();
}
function single(value, max, required = false) {
  const text = field(value, max, required);
  if (/[\r\n]/.test(text)) throw new Error('invalid');
  return text;
}
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) throw new Error('invalid');
  // Allow the current local calendar day anywhere in the world.
  if (value < new Date(Date.now() - 86400000).toISOString().slice(0,10)) throw new Error('invalid');
  return value;
}
export function validateInquiry(input) {
  if (!input || !['contact', 'flight'].includes(input.kind) || !['en', 'es'].includes(input.language)) throw new Error('invalid');
  if (input.website || typeof input.requestId !== 'string' || !/^[\da-f-]{36}$/i.test(input.requestId)) throw new Error('invalid');
  const person = {
    name: single(input.name, 100, true), email: single(input.email, 160, true).toLowerCase(),
    phone: single(input.phone ?? '', 60), company: single(input.company ?? '', 160), message: field(input.message ?? '', 2500, input.kind === 'contact'),
  };
  if (!emailPattern.test(person.email)) throw new Error('invalid');
  const data = { kind: input.kind, language: input.language, ...person };
  if (input.kind === 'contact') {
    if (!Number.isInteger(input.service) || input.service < 0 || input.service >= serviceNames.length) throw new Error('invalid');
    data.service = input.service;
  } else {
    const flight = input.flight;
    if (!flight || !['one-way', 'round-trip', 'multi-city'].includes(flight.type) || !Array.isArray(flight.legs) || flight.legs.length < 1 || flight.legs.length > 5 || !Number.isInteger(flight.passengers) || flight.passengers < 1 || flight.passengers > 100) throw new Error('invalid');
    if ((flight.type === 'multi-city' && flight.legs.length < 2) || (flight.type !== 'multi-city' && flight.legs.length !== 1)) throw new Error('invalid');
    const legs = flight.legs.map(leg => ({ from: single(leg.from, 120, true), to: single(leg.to, 120, true), date: date(leg.date) }));
    if (legs.some((leg,i) => leg.from.toLowerCase() === leg.to.toLowerCase() || (i > 0 && leg.date < legs[i-1].date))) throw new Error('invalid');
    const returnDate = flight.type === 'round-trip' ? date(flight.returnDate) : '';
    if (returnDate && returnDate < legs[0].date) throw new Error('invalid');
    data.flight = { type: flight.type, passengers: flight.passengers, legs, returnDate };
  }
  return data;
}
export function leadEmail(data, from) {
  const flight = data.flight;
  const subject = flight ? `Flight inquiry: ${flight.legs[0].from} → ${flight.legs[0].to}` : `Inquiry: ${serviceNames[data.service]}`;
  const text = [
    'OPEN WORLD AVIATION', subject, '', `Name: ${data.name}`, `Email: ${data.email}`,
    `Phone: ${data.phone || '—'}`, `Company: ${data.company || '—'}`, `Language: ${data.language}`, '',
    ...(flight ? [`Trip: ${flight.type}`, `Passengers: ${flight.passengers}`, ...flight.legs.map((leg,i) => `Leg ${i+1}: ${leg.from} → ${leg.to} | ${leg.date}`), ...(flight.returnDate ? [`Return: ${flight.returnDate}`] : []), ''] : []),
    'Message:', data.message || '—', '', 'Submitted through the Open World Aviation website. Flight inquiries are not confirmed bookings.',
  ].join('\n');
  return { from, to: [RECIPIENT], reply_to: data.email, subject, text };
}
export function receiptEmail(data, from) {
  const es = data.language === 'es';
  return { from, to: [data.email], reply_to: RECIPIENT,
    subject: es ? 'Recibimos su consulta | Open World Aviation' : 'We received your inquiry | Open World Aviation',
    text: es
      ? 'Gracias por contactar a Open World Aviation.\n\nRecibimos su mensaje. Nuestro equipo revisará su consulta y se pondrá en contacto con usted pronto.\n\nSi su consulta es sobre un vuelo, esta confirmación no constituye una reserva ni una cotización. Toda propuesta está sujeta a disponibilidad y confirmación del operador.\n\nOpen World Aviation\ncontact@openworldaviation.com'
      : 'Thank you for contacting Open World Aviation.\n\nWe received your message. Our team will review your inquiry and get in touch with you soon.\n\nIf your inquiry concerns a flight, this acknowledgment is not a booking or a quote. Any proposal is subject to availability and operator confirmation.\n\nOpen World Aviation\ncontact@openworldaviation.com',
  };
}
export async function sendViaResend(email, key, env) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(email),
  });
  const result = await response.json();
  if (!response.ok || !result.id) throw new Error('provider_error');
  return result.id;
}
export async function sendViaSmtp(email, key, env) {
  const port = Number(env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.gmail.com', port, secure: port === 465, requireTLS: port !== 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  try {
    const { reply_to, ...message } = email;
    const result = await transport.sendMail({ ...message, replyTo: reply_to,
      messageId: `<${createHash('sha256').update(key).digest('hex')}@openworldaviation.com>`,
    });
    if (!result.accepted?.length || result.rejected?.length) throw new Error('provider_error');
    return result.messageId;
  } finally { transport.close(); }
}
export function mailConfigured(env) {
  return Boolean(env.MAIL_FROM && (env.MAIL_TRANSPORT === 'resend' ? env.RESEND_API_KEY : env.SMTP_USER && env.SMTP_PASS));
}
export function safeMailError(error) {
  const detail = { name: typeof error?.name === 'string' ? error.name : 'Error' };
  for (const property of ['code', 'command', 'syscall']) {
    if (typeof error?.[property] === 'string') detail[property] = error[property].slice(0, 80);
  }
  if (Number.isInteger(error?.responseCode)) detail.responseCode = error.responseCode;
  return detail;
}
export function createInquiryHandler({ env = process.env, send = (email,key,config) => config.MAIL_TRANSPORT === 'resend' ? sendViaResend(email,key,config) : sendViaSmtp(email,key,config), logger = console } = {}) {
  const buckets = new Map();
  // Deduplicate both concurrent submissions and retries while this server is running.
  // A single persistent instance is required for SMTP; see deployment notes.
  const deliveries = new Map();
  async function deliver(email,key) {
    const now = Date.now();
    for (const [k,record] of deliveries) if (record.until < now) deliveries.delete(k);
    if (deliveries.has(key)) return deliveries.get(key).promise;
    if (deliveries.size >= 10000) throw new Error('busy');
    const promise = Promise.resolve().then(() => send(email,key,env));
    deliveries.set(key,{ promise, until:now+86400000 });
    try { return await promise; } catch (error) { deliveries.delete(key); throw error; }
  }
  function allow(key, limit, windowMs) {
    const now = Date.now();
    for (const [k,b] of buckets) if (b.until < now) buckets.delete(k);
    if (buckets.size > 10000) return false;
    const bucket = buckets.get(key) || { count: 0, until: now + windowMs };
    buckets.set(key, bucket); bucket.count++;
    return bucket.count <= limit;
  }
  return async function inquiryHandler(req, res) {
    const respond = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)); };
    if (req.method !== 'POST') return respond(405, { code: 'method_not_allowed' });
    const expectedOrigin = env.SITE_ORIGIN || (env.NODE_ENV !== 'production' ? `http://${req.headers.host}` : '');
    if (!expectedOrigin || req.headers.origin !== expectedOrigin) return respond(403, { code: 'forbidden' });
    if (!req.headers['content-type']?.startsWith('application/json')) return respond(415, { code: 'invalid' });
    if (!allow(`ip:${req.socket.remoteAddress}`, 15, 600000)) return respond(429, { code: 'rate_limit' });
    let input, data;
    try {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 16384) return respond(413, { code: 'invalid' }); chunks.push(Buffer.from(chunk)); }
      input = JSON.parse(Buffer.concat(chunks).toString('utf8')); data = validateInquiry(input);
    } catch { return respond(400, { code: 'invalid' }); }
    if (!mailConfigured(env)) return respond(503, { code: 'not_configured' });
    if (!allow(`email:${createHash('sha256').update(data.email).digest('hex')}`, 5, 3600000)) return respond(429, { code: 'rate_limit' });
    const digest = createHash('sha256').update(JSON.stringify(data)).digest('hex');
    const key = `owa/${input.requestId}/${digest}`;
    try { await deliver(leadEmail(data, env.MAIL_FROM), `${key}/lead`); }
    catch (error) {
      logger.error('mail_delivery_failed', safeMailError(error));
      return respond(502, { code: 'send_failed' });
    }
    let receipt = 'disabled';
    if (env.SEND_AUTOREPLY === 'true') {
      try { await deliver(receiptEmail(data, env.MAIL_FROM), `${key}/receipt`); receipt = 'accepted'; }
      catch (error) {
        logger.error('mail_receipt_failed', safeMailError(error));
        receipt = 'failed';
      }
    }
    return respond(200, { ok: true, receipt });
  };
}
