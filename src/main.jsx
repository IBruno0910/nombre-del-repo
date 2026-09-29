import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, ArrowRight, ArrowDown, X, Menu, Globe2, Plus, Check, Mail, Download, SlidersHorizontal, PlaneTakeoff, ArrowLeftRight, Compass, Package } from 'lucide-react';
import { copy, contacts, legalPaths } from './content';
import services from './services.json';
import legal from './legal.json';
import './styles.css';
import './ui-refresh.css';
import Modal from './Modal';
import { FlightPlanner, SendInquiry } from './forms';

const serviceIcons = [SlidersHorizontal, PlaneTakeoff, ArrowLeftRight, Compass, Package];

function ServiceIcon({ index }) {
  const Icon = serviceIcons[index];
  return <span className="service-icon" aria-hidden="true"><Icon size={26} strokeWidth={1.25}/></span>;
}

function initialLanguage() {
  return new URLSearchParams(window.location.search).get('lang') === 'es' ? 'es' : 'en';
}
function Brand({ home }) {
  return <a className="brand" href={home} aria-label="Open World Aviation — Home"><img src="/brand/logo-complete.svg" alt="Open World Aviation" width="1316" height="254" /></a>;
}
function WorldGraphic() {
  return <div className="world-art" aria-hidden="true">
    <div className="art-coordinate top">OPEN WORLD / GLOBAL CONNECTIONS</div>
    <svg viewBox="0 0 600 600" fill="none">
      <defs><radialGradient id="sphere" cx="38%" cy="30%" r="72%"><stop stopColor="#ffffff" stopOpacity=".28"/><stop offset=".65" stopColor="#e1f2fc" stopOpacity=".10"/><stop offset="1" stopColor="#97c3df" stopOpacity=".24"/></radialGradient><linearGradient id="route"><stop stopColor="#3882b7" stopOpacity="0"/><stop offset=".5" stopColor="#3882b7"/><stop offset="1" stopColor="#3882b7" stopOpacity=".3"/></linearGradient></defs>
      <circle cx="300" cy="300" r="214" fill="url(#sphere)" />
      <g stroke="#7ca4c0" strokeWidth=".65" opacity=".36">
        <circle cx="300" cy="300" r="214"/><ellipse cx="300" cy="300" rx="156" ry="214"/><ellipse cx="300" cy="300" rx="82" ry="214"/>
        <ellipse cx="300" cy="300" rx="214" ry="70"/><ellipse cx="300" cy="300" rx="214" ry="150"/><path d="M86 300h428M300 86v428"/>
      </g>
      <g transform="rotate(-32 300 300)" opacity=".65"><ellipse cx="300" cy="300" rx="278" ry="104" stroke="url(#route)" strokeWidth="1.5"/><circle cx="551" cy="345" r="5" fill="#1970ac"/><circle cx="551" cy="345" r="12" stroke="#1970ac" opacity=".35"/></g>
      <path d="M149 380Q211 139 438 209" stroke="#387fae" strokeDasharray="3 5" opacity=".52"/>
      <circle cx="149" cy="380" r="3.5" fill="#387fae" opacity=".65"/><circle cx="438" cy="209" r="3.5" fill="#387fae" opacity=".65"/>
    </svg>
    <img className="world-monogram" src="/brand/monogram.png" alt="" />
    <span className="art-coordinate bottom">ONE WORLD. MANY POSSIBILITIES.</span>
    <span className="art-cross">+</span>
  </div>;
}
function AviationImage({ kind, lang }) {
  const hero = kind === 'hero';
  const name = hero ? 'aircraft-hangar' : 'engine-detail';
  const alt = hero
    ? (lang === 'en' ? 'Illustrative scene of a business aircraft outside a hangar in soft morning light' : 'Escena ilustrativa de una aeronave ejecutiva frente a un hangar con luz suave de mañana')
    : (lang === 'en' ? 'Illustrative close-up of an aircraft engine inside a bright hangar' : 'Detalle ilustrativo de un motor aeronáutico dentro de un hangar luminoso');
  return <figure className={`aviation-image ${hero ? 'hero-photo' : 'perspective-photo'}`}>
    <div className="photo-frame"><img
      src={`/images/${name}.jpg`}
      srcSet={`/images/${name}-small.jpg ${hero ? 768 : 480}w, /images/${name}.jpg ${hero ? 1536 : 800}w`}
      sizes={hero ? '(max-width: 800px) 90vw, 72vw' : '(max-width: 560px) 82vw, 38vw'}
      width={hero ? 1536 : 800} height={hero ? 1024 : 1200}
      alt={alt} loading="lazy" decoding="async"
    /></div>
    <figcaption><span>{hero ? (lang === 'en' ? 'A broader view of aviation.' : 'Una visión más amplia de la aviación.') : (lang === 'en' ? 'A closer look at every detail.' : 'Una mirada atenta a cada detalle.')}</span><span aria-hidden="true">{hero ? '01 / AVIATION' : '02 / EXPERTISE'}</span></figcaption>
  </figure>;
}
function App() {
  const [lang, setLang] = useState(initialLanguage);
  const [menu, setMenu] = useState(false);
  const [detail, setDetail] = useState(null);
  const [review, setReview] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', service: '', message: '' });
  const formRef = useRef(null);
  const t = copy[lang];
  const list = services[lang];
  const legalIndex = legalPaths.indexOf(window.location.pathname.replace(/\/$/, ''));
  const isLegal = legalIndex !== -1;
  const query = `?lang=${lang}`;
  const home = `/${query}`;
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${isLegal ? legal[lang][legalIndex].title : lang === 'en' ? 'A world of possibilities in aviation' : 'Un mundo de posibilidades en aviación'} | Open World Aviation`;
    document.querySelector('meta[name="description"]').content = t.meta;
    const url = new URL(window.location.href); url.searchParams.set('lang', lang); window.history.replaceState(null, '', url);
  }, [lang, isLegal, legalIndex, t.meta]);
  useEffect(() => { if (!menu) return; const handler = e => { if (e.key === 'Escape') setMenu(false); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [menu]);
  const update = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  function askAbout(index) {
    setDetail(null); setForm(p => ({ ...p, service: String(index) }));
    requestAnimationFrame(() => { formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); formRef.current.querySelector('input').focus({ preventScroll: true }); });
  }
  const anchor = id => isLegal ? `${home}#${id}` : `#${id}`;
  return <>
    <a className="skip-link" href="#main">{lang === 'en' ? 'Skip to content' : 'Ir al contenido'}</a>
    <header className="header"><div className="header-inner">
      <Brand home={home} />
      <nav id="main-navigation" className={menu ? 'navigation open' : 'navigation'} aria-label={lang === 'en' ? 'Main navigation' : 'Navegación principal'}>
        {['services', 'perspective', 'approach'].map((id, i) => <a key={id} href={anchor(id)} onClick={() => setMenu(false)}>{t.nav[i]}</a>)}
        <a className="mobile-contact" href={anchor('contact')} onClick={() => setMenu(false)}>{t.contact}</a>
      </nav>
      <div className="header-actions"><div className="languages" aria-label="Language"><button aria-label="Switch to English" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button><span>/</span><button aria-label="Cambiar a español" aria-pressed={lang === 'es'} onClick={() => setLang('es')}>ES</button></div><a className="header-contact" href={anchor('contact')}>{t.contact}<ArrowUpRight size={16}/></a><button className="menu-button icon-button" aria-label={menu ? t.close : t.menu} aria-expanded={menu} aria-controls="main-navigation" onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button></div>
    </div></header>
    <main id="main">
      {isLegal ? <article className="legal-page container"><a className="text-link" href={home}>← {t.back}</a><span className="eyebrow">OPEN WORLD AVIATION</span><h1>{legal[lang][legalIndex].title}</h1><aside className="draft-notice"><strong>{t.draft}</strong><p>{t.draftText}</p></aside><p>{t.englishControls}</p>{legal[lang][legalIndex].lines.map((line, i) => /^\d+\s{2}/.test(line) || (legalIndex === 3 && i > 0 && line.length < 65) ? <h2 key={i}>{line}</h2> : <p key={i} className={line.startsWith('•') ? 'legal-bullet' : ''}>{line.split(/(\[[^\]]+\])/g).map((part, j) => part.startsWith('[') ? <mark key={j}>{part}</mark> : part)}</p>)}</article> : <>
        <section className="hero container" id="home"><div className="hero-copy"><div className="eyebrow"><span className="small-line"/>{t.eyebrow}</div><h1>{t.hero[0]}<br/><span>{t.hero[1]}</span><br/>{t.hero[2]}</h1><p>{t.intro}</p><a className="button dark" href="#services">{t.discover}<ArrowUpRight size={19}/></a></div><WorldGraphic/><a className="hero-scroll" href="#services"><ArrowDown size={16}/>{t.scroll}</a><span className="hero-index">01 / 04</span></section>
        <FlightPlanner lang={lang}/><div className="segment-strip"><div className="container">{t.segments.map((s,i) => <span key={s}>{i === 0 ? <Globe2 size={17}/> : <span className="segment-dot"/>}{s}</span>)}</div></div>
        <div className="aviation-panorama"><AviationImage kind="hero" lang={lang}/></div><section className="section container" id="services"><div className="section-heading"><div><span className="eyebrow">{t.servicesLabel}</span><h2>{t.servicesTitle}</h2></div><p>{t.servicesIntro}</p></div><div className="service-list">{list.map((s,i) => <button className="service-row" key={s.title} onClick={() => setDetail(i)} aria-label={`${s.title} — ${t.more}`}><span className="service-number">0{i+1}</span><ServiceIcon index={i}/><h3>{s.title}</h3><p>{s.tagline}</p><span className="service-more">{t.more}<span className="circle-arrow"><ArrowUpRight size={21}/></span></span></button>)}</div></section>
        <section className="perspective" id="perspective"><div className="container perspective-grid"><AviationImage kind="perspective" lang={lang}/><div className="perspective-copy"><span className="eyebrow">{t.aboutLabel}</span><h2>{t.aboutTitle}</h2><p>{t.aboutText}</p><p>{t.aboutText2}</p><div className="values">{t.values.map(([title,description]) => <div key={title}><Check size={17}/><div><h3>{title}</h3><p>{description}</p></div></div>)}</div></div></div></section>
        <section className="section container" id="approach"><div className="section-heading"><div><span className="eyebrow">{t.processLabel}</span><h2>{t.processTitle}</h2></div><ArrowDown className="approach-arrow" size={39} strokeWidth={1}/></div><div className="process-grid">{t.process.map(([title,description],i) => <article key={title}><div className="process-number"><span>0{i+1}</span><Plus size={17}/></div><h3>{title}</h3><p>{description}</p></article>)}</div></section>
        <section className="contact-section" id="contact"><div className="container contact-grid"><div className="contact-copy"><span className="eyebrow">{t.contactLabel}</span><h2>{t.contactTitle}</h2><p>{t.contactIntro}</p>{contacts.email && <a className="email-link" href={`mailto:${contacts.email}`}><Mail size={18}/>{contacts.email}<ArrowUpRight size={18}/></a>}<div className="contact-signature"><img src="/brand/monogram.png" alt="" loading="lazy"/><span>OPEN WORLD.<br/>PERSONAL CONNECTION.</span></div></div><form ref={formRef} className="contact-form" onSubmit={e => {e.preventDefault(); setReview(true);}}><label className="trap-field" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" value={form.website || ''} onChange={update}/></label><div className="form-grid">
          {[['name',t.name,'text','name'],['email',t.email,'email','email'],['phone',t.phone,'tel','tel'],['company',t.company,'text','organization']].map(([name,label,type,autocomplete]) => <label key={name}>{label}{!['name','email'].includes(name) && <small> ({t.optional})</small>}<input name={name} type={type} autoComplete={autocomplete} required={['name','email'].includes(name)} maxLength={name === 'name' ? 100 : name === 'phone' ? 60 : 160} value={form[name]} onChange={update}/></label>)}
        </div><label>{t.service}<select name="service" value={form.service} onChange={update} required><option value="" disabled>{t.choose}</option>{list.map((s,i) => <option key={s.title} value={i}>{s.title}</option>)}</select></label><label>{t.message}<textarea name="message" value={form.message} onChange={update} rows={3} required maxLength={2500}/></label><p className="form-notice">{t.sensitive}<br/>{t.privacyNotice} <a href={`/privacy${query}`}>{t.privacy}</a>.</p><button className="button dark" type="submit">{t.prepare}<ArrowUpRight size={19}/></button></form></div></section>
      </>}
    </main>
    <footer><div className="container"><div className="footer-top"><Brand home={home}/><p>{t.footerText}</p><a href={anchor('contact')}>{t.contact}<ArrowUpRight size={18}/></a></div><p className="operational-note">{t.disclaimer}</p><div className="footer-bottom"><span>© {new Date().getFullYear()} Open World Aviation. {t.rights}</span><nav aria-label={lang === 'en' ? 'Legal information' : 'Información legal'}>{legalPaths.map((path,i) => <a key={path} href={`${path}${query}`}>{t.footerLinks[i]}</a>)}</nav><a className="back-top" href="#main" aria-label={lang === 'en' ? 'Back to top' : 'Volver arriba'}>↑</a></div></div></footer>
    {detail !== null && <Modal title={list[detail].title} close={() => setDetail(null)} closeLabel={t.close}><p className="modal-tagline">{list[detail].tagline}</p>{list[detail].paragraphs.map(p => <p key={p}>{p}</p>)}{detail === 1 && <p className="form-notice">{t.disclaimer}</p>}<button className="button dark" onClick={() => askAbout(detail)}>{t.consult}<ArrowUpRight size={18}/></button></Modal>}
    {review && <SendInquiry lang={lang} data={{ ...form, kind: 'contact', service: Number(form.service), language: lang }} close={() => setReview(false)} finished={() => {setReview(false);setForm({name:'',email:'',phone:'',company:'',service:'',message:'',website:''});}}/>}
  </>;
}
createRoot(document.getElementById('root')).render(<App/>);
