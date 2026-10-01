import React, { useRef, useState } from 'react';
import { ArrowUpRight, ArrowLeftRight, Plus, X, Check, PlaneTakeoff, LoaderCircle } from 'lucide-react';
import Modal from './Modal';
import services from './services.json';

const words = {
  en: { title: 'Where would you like to go?', eyebrow: 'PRIVATE CHARTER & FLIGHT SUPPORT', types: ['One way', 'Round trip', 'Multi-city'], from: 'From', to: 'To', city: 'City or airport', date: 'Departure', returning: 'Return', passengers: 'Passengers', next: 'Request a flight', add: 'Add flight', remove: 'Remove flight', swap: 'Swap origin and destination', leg: 'Flight', note: 'A tailored flight proposal, coordinated through qualified operators. Subject to availability.', invalid: 'Please choose different departure and arrival locations and put the dates in chronological order.', details: 'Tell us a little about yourself.', name: 'Full name', email: 'Email', phone: 'Phone / WhatsApp (optional)', message: 'Additional requirements (optional)', review: 'Review your inquiry', intro: 'Check your details. Your inquiry will be sent directly to our team.', send: 'Send inquiry', sending: 'Sending…', edit: 'Edit details', close: 'Close', received: 'Thank you. We received your inquiry.', thanks: 'Our team will review your message and get in touch with you soon.', receipt: 'We have also sent an acknowledgment to your email address.', receiptFailed: 'Your inquiry was received, but we could not send your acknowledgment email. You do not need to submit again.', notConfigured: 'Online sending is temporarily unavailable. Your inquiry has not been sent. Please contact contact@openworldaviation.com.', failed: 'We could not confirm your submission. Please retry or contact us by email.', limited: 'Too many attempts. Please wait before trying again.', invalidServer: 'Please check your contact details, route and dates before trying again.', privacy: 'By submitting, you acknowledge that you have read our', policy: 'Privacy Policy', disclaimer: 'This is a flight inquiry, not a confirmed booking.', done: 'Done', optional: 'Optional', company: 'Company' },
  es: { title: '¿A dónde le gustaría ir?', eyebrow: 'CHARTER PRIVADO Y SOPORTE DE VUELO', types: ['Solo ida', 'Ida y vuelta', 'Múltiples destinos'], from: 'Origen', to: 'Destino', city: 'Ciudad o aeropuerto', date: 'Salida', returning: 'Regreso', passengers: 'Pasajeros', next: 'Solicitar vuelo', add: 'Agregar vuelo', remove: 'Eliminar vuelo', swap: 'Intercambiar origen y destino', leg: 'Vuelo', note: 'Una propuesta de vuelo a medida, coordinada con operadores calificados. Sujeta a disponibilidad.', invalid: 'Elija un destino diferente del origen y ordene las fechas cronológicamente.', details: 'Cuéntenos un poco sobre usted.', name: 'Nombre y apellido', email: 'Email', phone: 'Teléfono / WhatsApp (opcional)', message: 'Requerimientos adicionales (opcional)', review: 'Revisar consulta', intro: 'Revise sus datos. La consulta se enviará directamente a nuestro equipo.', send: 'Enviar consulta', sending: 'Enviando…', edit: 'Editar datos', close: 'Cerrar', received: 'Gracias. Recibimos su consulta.', thanks: 'Nuestro equipo revisará su mensaje y se pondrá en contacto con usted pronto.', receipt: 'También enviamos una confirmación a su dirección de correo.', receiptFailed: 'Recibimos su consulta, pero no pudimos enviarle el correo de confirmación. No necesita volver a enviarla.', notConfigured: 'El envío en línea no está disponible en este momento. Su consulta no fue enviada. Contáctenos en contact@openworldaviation.com.', failed: 'No pudimos confirmar el envío. Inténtelo nuevamente o contáctenos por correo.', limited: 'Hubo demasiados intentos. Espere un momento antes de volver a intentar.', invalidServer: 'Revise sus datos de contacto, ruta y fechas antes de volver a intentar.', privacy: 'Al enviar, reconoce haber leído nuestra', policy: 'Política de Privacidad', disclaimer: 'Esta es una consulta de vuelo, no una reserva confirmada.', done: 'Listo', optional: 'Opcional', company: 'Empresa' },
};
const types = ['one-way','round-trip','multi-city'];
const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const emptyLeg = () => ({ from:'', to:'', date:'' });
const displayDate = (value, lang) => new Intl.DateTimeFormat(lang, { dateStyle:'medium' }).format(new Date(`${value}T12:00:00`));

export function SendInquiry({ data, lang, close, finished = close }) {
  const t = words[lang];
  const [state,setState] = useState('idle');
  const [error,setError] = useState('');
  const [receipt,setReceipt] = useState('');
  const requestId = useRef(crypto.randomUUID());
  const busy = useRef(false);
  const flight = data.flight;
  async function send() {
    if (busy.current) return;
    busy.current = true; setState('sending'); setError('');
    try {
      const response = await fetch('/api/inquiries', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...data,requestId:requestId.current}), signal:AbortSignal.timeout(90000) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        setError(result.code === 'not_configured' ? t.notConfigured : result.code === 'rate_limit' ? t.limited : result.code === 'invalid' ? t.invalidServer : t.failed); setState('idle');
      } else { setReceipt(result.receipt); setState('success'); }
    } catch { setError(t.failed); setState('idle'); }
    finally { busy.current = false; }
  }
  return <Modal title={state === 'success' ? t.received : t.review} close={() => {if (!busy.current) (state === 'success' ? finished : close)();}} closeLabel={t.close}>
    {state === 'success' ? <div className="submission-success" role="status"><span className="success-icon"><Check size={28}/></span><p>{t.thanks}</p>{receipt === 'accepted' && <p>{t.receipt}</p>}{receipt === 'failed' && <p>{t.receiptFailed}</p>}{flight && <p className="form-notice">{t.disclaimer}</p>}<button className="button dark" onClick={finished}>{t.done}<Check size={17}/></button></div> : <><p>{t.intro}</p><div className="inquiry-summary">
    <strong>{flight ? t.next : services[lang][data.service].title}</strong>
    {flight && <div className="flight-summary"><p>{t.types[types.indexOf(flight.type)]} · {flight.passengers} {t.passengers.toLowerCase()}</p>{flight.legs.map((leg,i) => <p key={i}>{leg.from} → {leg.to}<br/><small>{displayDate(leg.date,lang)}</small></p>)}{flight.returnDate && <p>{t.returning}: {displayDate(flight.returnDate,lang)}</p>}</div>}
    <p>{data.name}<br/>{data.email}{data.phone && <><br/>{data.phone}</>}{data.company && <><br/>{data.company}</>}</p>{data.message && <p>{data.message}</p>}</div>
    <p className="form-notice">{t.privacy} <a href={`/${lang}/privacy`} target="_blank" rel="noreferrer">{t.policy}</a>.</p>
    {error && <p className="submission-error" role="alert">{error}</p>}<div className="review-actions"><button className="button dark" disabled={state === 'sending'} onClick={send}>{state === 'sending' ? t.sending : t.send}{state === 'sending' ? <LoaderCircle className="loading-icon" size={18}/> : <ArrowUpRight size={18}/>}</button><button className="text-link" disabled={state === 'sending'} onClick={close}>{t.edit}</button></div></>}
  </Modal>;
}

export function FlightPlanner({ lang }) {
  const t = words[lang];
  const [type,setType] = useState('one-way');
  const [legs,setLegs] = useState([emptyLeg(),emptyLeg()]);
  const [returnDate,setReturnDate] = useState('');
  const [passengers,setPassengers] = useState('2');
  const [error,setError] = useState('');
  const [step,setStep] = useState('route');
  const [person,setPerson] = useState({name:'',email:'',phone:'',message:'',website:''});
  const activeLegs = type === 'multi-city' ? legs : [legs[0]];
  function updateLeg(index, key, value) { setError(''); setLegs(prev => prev.map((leg,i) => i === index ? {...leg,[key]:value} : leg)); }
  function next(e) { e.preventDefault(); if (activeLegs.some((leg,i) => leg.from.trim().toLowerCase() === leg.to.trim().toLowerCase() || (i>0 && leg.date < activeLegs[i-1].date)) || (type === 'round-trip' && returnDate < legs[0].date)) {setError(t.invalid);return;} setError(''); setStep('details'); }
  const personField = e => setPerson(p => ({...p,[e.target.name]:e.target.value}));
  return <section className="flight-planner container" id="flights" aria-labelledby="flight-title"><div className="flight-heading"><div><span className="eyebrow">{t.eyebrow}</span><h2 id="flight-title">{t.title}</h2></div><PlaneTakeoff size={30} strokeWidth={1}/></div><form onSubmit={next}>
    <div className="flight-types">{types.map((value,i) => <label key={value}><input type="radio" name="trip-type" value={value} checked={type === value} onChange={() => {setType(value);setError('');}}/><span>{t.types[i]}</span></label>)}</div>
    <div className="itinerary">{activeLegs.map((leg,i) => <div className="flight-row" key={i}>
      <label>{t.from}{i>0 && ` ${i+1}`}<input aria-label={`${t.from}${i ? ` ${i+1}` : ''}`} value={leg.from} onChange={e=>updateLeg(i,'from',e.target.value)} placeholder={t.city} maxLength={120} required/></label>
      <button className="swap-flight icon-button" type="button" aria-label={`${t.swap}${i ? ` ${i+1}` : ''}`} onClick={()=>setLegs(prev=>prev.map((item,j)=>i===j?{...item,from:item.to,to:item.from}:item))}><ArrowLeftRight size={17}/></button>
      <label>{t.to}{i>0 && ` ${i+1}`}<input aria-label={`${t.to}${i ? ` ${i+1}` : ''}`} value={leg.to} onChange={e=>updateLeg(i,'to',e.target.value)} placeholder={t.city} maxLength={120} required/></label>
      <label>{t.date}{i>0 && ` ${i+1}`}<input aria-label={`${t.date}${i ? ` ${i+1}` : ''}`} type="date" value={leg.date} min={i ? legs[i-1].date || localDay() : localDay()} onChange={e=>updateLeg(i,'date',e.target.value)} required/></label>
      {type==='round-trip' && <label>{t.returning}<input type="date" value={returnDate} min={legs[0].date || localDay()} onChange={e=>setReturnDate(e.target.value)} required/></label>}
      {i===0 && <label>{t.passengers}<input type="number" min="1" max="100" value={passengers} onChange={e=>setPassengers(e.target.value)} required/></label>}
      {i===0 && <button className="button dark flight-submit" type="submit">{t.next}<ArrowUpRight size={18}/></button>}
      {i>1 && <button className="icon-button" type="button" aria-label={`${t.remove} ${i+1}`} onClick={()=>setLegs(prev=>prev.filter((_,j)=>j!==i))}><X size={18}/></button>}
    </div>)}</div>
    {type==='multi-city' && legs.length<5 && <button className="text-link" type="button" onClick={()=>setLegs(prev=>[...prev,{...emptyLeg(),from:prev.at(-1).to}])}><Plus size={15}/>{t.add}</button>}
    {error && <p role="alert" className="submission-error">{error}</p>}<p className="flight-note">{t.note}</p>
  </form>
  {step==='details' && <Modal title={t.details} close={()=>setStep('route')} closeLabel={t.close}><form className="flight-details" onSubmit={e=>{e.preventDefault();setStep('review');}}>
    <label className="trap-field" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" value={person.website} onChange={personField}/></label>
    { [['name',t.name,'text','name'],['email',t.email,'email','email'],['phone',t.phone,'tel','tel']].map(([key,label,type,auto])=><label key={key}>{label}<input name={key} value={person[key]} onChange={personField} type={type} autoComplete={auto} required={key!=='phone'} maxLength={key==='phone'?60:key==='name'?100:160}/></label>)}
    <label>{t.message}<textarea name="message" value={person.message} onChange={personField} maxLength={2500} rows={3}/></label><p className="form-notice">{t.disclaimer}</p><button className="button dark" type="submit">{t.review}<ArrowUpRight size={18}/></button>
  </form></Modal>}
  {step==='review' && <SendInquiry lang={lang} data={{kind:'flight',language:lang,...person,flight:{type,legs:activeLegs,returnDate:type==='round-trip'?returnDate:'',passengers:Number(passengers)}}} close={()=>setStep('details')} finished={()=>{setStep('route');setPerson({name:'',email:'',phone:'',message:'',website:''});}}/>}
  </section>;
}
