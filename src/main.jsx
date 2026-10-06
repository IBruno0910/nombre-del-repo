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

function InstagramIcon() {
  return <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>;
}
function WhatsAppIcon() {
  return <svg viewBox="0 0 24 24" width="29" height="29" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.148-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26C2.168 6.442 6.613 2.01 12.065 2.01c2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.99c-.003 5.45-4.437 9.884-9.893 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>;
}

function ServiceIcon({ index }) {
  const Icon = serviceIcons[index];
  return <span className="service-icon" aria-hidden="true"><Icon size={26} strokeWidth={1.25}/></span>;
}

function initialLanguage() {
  const pathLanguage = window.location.pathname.match(/^\/(en|es)(?:\/|$)/)?.[1];
  if (pathLanguage) return pathLanguage;
  return new URLSearchParams(window.location.search).get('lang') === 'es' ? 'es' : 'en';
}
function Brand({ home }) {
  return <a className="brand" href={home} aria-label="Open World Aviation — Home"><img src="/brand/logo-complete.svg" alt="Open World Aviation" width="1316" height="254" /></a>;
}
function AviationMark({ className = '' }) {
  return <svg className={`aviation-mark ${className}`} viewBox="0 0 320 170" fill="none" aria-hidden="true">
    <path className="mark-line mark-line-main" d="M20 104C74 103 117 86 160 47C203 86 246 103 300 104"/>
    <path className="mark-line mark-line-inner" d="M48 122C96 117 128 104 160 77C192 104 224 117 272 122"/>
    <path className="mark-line mark-line-horizon" d="M77 137H243"/>
    <path className="mark-line mark-line-axis" d="M160 25V143"/>
    <path className="mark-fill" d="M160 37L168 75L160 88L152 75Z"/>
    <path className="mark-detail" d="M89 107L72 125M231 107L248 125M137 137L160 151L183 137"/>
  </svg>;
}
function shouldShowIntro() {
  const path = window.location.pathname.replace(/\/$/, '');
  if (!['', '/en', '/es'].includes(path) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try { return sessionStorage.getItem('owa-intro-seen') !== 'true'; }
  catch { return true; }
}
function IntroSequence({ lang, onFinish }) {
  useEffect(() => {
    try { sessionStorage.setItem('owa-intro-seen', 'true'); } catch {}
    document.body.classList.add('intro-active');
    const timer = window.setTimeout(() => onFinish(false), 3200);
    const closeOnEscape = event => { if (event.key === 'Escape') onFinish(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove('intro-active');
    };
  }, [onFinish]);
  return <div className="intro-sequence" role="dialog" aria-modal="true" aria-label={lang === 'es' ? 'Introducción de Open World Aviation' : 'Open World Aviation introduction'}>
    <div className="intro-stage" aria-hidden="true">
      <div className="intro-symbol">
        <span className="intro-datum intro-datum-a"/>
        <AviationMark className="intro-aviation-mark"/>
        <span className="intro-datum intro-datum-b"/>
        <span className="intro-mark-label">ADVISORY · OPERATIONS · SOLUTIONS</span>
      </div>
      <img className="intro-wordmark" src="/brand/logo-complete.svg" alt=""/>
      <span className="intro-tagline">ONE WORLD · MANY POSSIBILITIES</span>
    </div>
    <button className="intro-skip" type="button" onClick={() => onFinish(false)}>{lang === 'es' ? 'Saltar introducción' : 'Skip intro'}</button>
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
  const [introVisible, setIntroVisible] = useState(shouldShowIntro);
  const [menu, setMenu] = useState(false);
  const [detail, setDetail] = useState(null);
  const [review, setReview] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', service: '', message: '' });
  const formRef = useRef(null);
  const t = copy[lang];
  const list = services[lang];
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  const contentPath = currentPath.replace(/^\/(?:en|es)(?=\/|$)/, '') || '/';
  const legalIndex = legalPaths.indexOf(contentPath);
  const isLegal = legalIndex !== -1;
  const home = `/${lang}`;
  const legalHasPlaceholders = isLegal && legal[lang][legalIndex].lines.some(line => /\[[^\]]+\]/.test(line));
  const whatsappMessage = lang === 'es'
    ? 'Hola Open World Aviation, me gustaría recibir información sobre sus servicios.'
    : 'Hello Open World Aviation, I would like information about your services.';
  const whatsappHref = `https://wa.me/${contacts.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = `${isLegal ? legal[lang][legalIndex].title : lang === 'en' ? 'Aviation solutions. Global perspective.' : 'Soluciones aeronáuticas. Visión global.'} | Open World Aviation`;
    document.querySelector('meta[name="description"]').content = t.meta;
    const url = new URL(window.location.href);
    url.pathname = `/${lang}${isLegal ? legalPaths[legalIndex] : ''}`;
    url.searchParams.delete('lang');
    window.history.replaceState(null, '', url);
  }, [lang, isLegal, legalIndex, t.meta]);
  useEffect(() => { if (!menu) return; const handler = e => { if (e.key === 'Escape') setMenu(false); }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [menu]);
  const update = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  function askAbout(index) {
    setDetail(null); setForm(p => ({ ...p, service: String(index) }));
    requestAnimationFrame(() => { formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); formRef.current.querySelector('input').focus({ preventScroll: true }); });
  }
  const anchor = id => isLegal ? `${home}#${id}` : `#${id}`;
  return <>
    {introVisible && <IntroSequence lang={lang} onFinish={setIntroVisible}/>}
    <a className="skip-link" href="#main">{lang === 'en' ? 'Skip to content' : 'Ir al contenido'}</a>
    <header className={`header ${isLegal ? '' : 'header-overlay'}`}><div className="header-inner">
      <Brand home={home} />
      <nav id="main-navigation" className={menu ? 'navigation open' : 'navigation'} aria-label={lang === 'en' ? 'Main navigation' : 'Navegación principal'}>
        {['services', 'perspective', 'approach'].map((id, i) => <a key={id} href={anchor(id)} onClick={() => setMenu(false)}>{t.nav[i]}</a>)}
        <a className="mobile-contact" href={anchor('contact')} onClick={() => setMenu(false)}>{t.contact}</a>
      </nav>
      <div className="header-actions"><div className="languages" aria-label="Language"><button aria-label="Switch to English" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button><span>/</span><button aria-label="Cambiar a español" aria-pressed={lang === 'es'} onClick={() => setLang('es')}>ES</button></div><a className="header-contact" href={anchor('contact')}>{t.contact}<ArrowUpRight size={16}/></a><button className="menu-button icon-button" aria-label={menu ? t.close : t.menu} aria-expanded={menu} aria-controls="main-navigation" onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button></div>
    </div></header>
    <main id="main">
      {isLegal ? <article className="legal-page container"><a className="text-link" href={home}>← {t.back}</a><span className="eyebrow">OPEN WORLD AVIATION</span><h1>{legal[lang][legalIndex].title}</h1>{legalHasPlaceholders && <aside className="draft-notice"><strong>{t.draft}</strong><p>{t.draftText}</p></aside>}<p>{t.englishControls}</p>{legal[lang][legalIndex].lines.map((line, i) => /^\d+\s{2}/.test(line) || (legalIndex === 3 && i > 0 && line.length < 65) ? <h2 key={i}>{line}</h2> : <p key={i} className={line.startsWith('•') ? 'legal-bullet' : ''}>{line.split(/(\[[^\]]+\])/g).map((part, j) => part.startsWith('[') ? <mark key={j}>{part}</mark> : part)}</p>)}</article> : <>
        <section className="hero hero-cover" id="home"><div className="hero-inner container"><div className="hero-copy"><h1>{t.hero[0]}<br/>{t.hero[1]}</h1><p>{t.intro}</p><a className="button hero-cta" href="#services">{t.discover}<ArrowRight size={21}/></a></div><div className="hero-signature" aria-hidden="true"><AviationMark/><span>OPEN WORLD AVIATION</span></div></div></section>
        <FlightPlanner lang={lang}/><div className="segment-strip"><div className="container">{t.segments.map((s,i) => <span key={s}>{i === 0 ? <Globe2 size={17}/> : <span className="segment-dot"/>}{s}</span>)}</div></div>
        <div className="aviation-panorama"><AviationImage kind="hero" lang={lang}/></div><section className="section container" id="services"><div className="section-heading"><div><span className="eyebrow">{t.servicesLabel}</span><h2>{t.servicesTitle}</h2></div><p>{t.servicesIntro}</p></div><div className="service-list">{list.map((s,i) => <button className="service-row" key={s.title} onClick={() => setDetail(i)} aria-label={`${s.title} — ${t.more}`}><span className="service-number">0{i+1}</span><ServiceIcon index={i}/><h3>{s.title}</h3><p>{s.tagline}</p><span className="service-more">{t.more}<span className="circle-arrow"><ArrowUpRight size={21}/></span></span></button>)}</div></section>
        <section className="perspective" id="perspective"><div className="container perspective-grid"><AviationImage kind="perspective" lang={lang}/><div className="perspective-copy"><span className="eyebrow">{t.aboutLabel}</span><h2>{t.aboutTitle}</h2><p>{t.aboutText}</p><p>{t.aboutText2}</p><div className="values">{t.values.map(([title,description]) => <div key={title}><Check size={17}/><div><h3>{title}</h3><p>{description}</p></div></div>)}</div></div></div></section>
        <section className="section container" id="approach"><div className="section-heading"><div><span className="eyebrow">{t.processLabel}</span><h2>{t.processTitle}</h2></div><ArrowDown className="approach-arrow" size={39} strokeWidth={1}/></div><div className="process-grid">{t.process.map(([title,description],i) => <article key={title}><div className="process-number"><span>0{i+1}</span><Plus size={17}/></div><h3>{title}</h3><p>{description}</p></article>)}</div></section>
        <section className="contact-section" id="contact"><div className="container contact-grid"><div className="contact-copy"><span className="eyebrow">{t.contactLabel}</span><h2>{t.contactTitle}</h2><p>{t.contactIntro}</p>{contacts.email && <a className="email-link" href={`mailto:${contacts.email}`}><Mail size={18}/>{contacts.email}<ArrowUpRight size={18}/></a>}<div className="contact-signature"><AviationMark/><span>AVIATION EXPERTISE.<br/>INDEPENDENT PERSPECTIVE.</span></div></div><form ref={formRef} className="contact-form" onSubmit={e => {e.preventDefault(); setReview(true);}}><label className="trap-field" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" value={form.website || ''} onChange={update}/></label><div className="form-grid">
          {[['name',t.name,'text','name'],['email',t.email,'email','email'],['phone',t.phone,'tel','tel'],['company',t.company,'text','organization']].map(([name,label,type,autocomplete]) => <label key={name}>{label}{!['name','email'].includes(name) && <small> ({t.optional})</small>}<input name={name} type={type} autoComplete={autocomplete} required={['name','email'].includes(name)} maxLength={name === 'name' ? 100 : name === 'phone' ? 60 : 160} value={form[name]} onChange={update}/></label>)}
        </div><label>{t.service}<select name="service" value={form.service} onChange={update} required><option value="" disabled>{t.choose}</option>{list.map((s,i) => <option key={s.title} value={i}>{s.title}</option>)}</select></label><label>{t.message}<textarea name="message" value={form.message} onChange={update} rows={3} required maxLength={2500}/></label><p className="form-notice">{t.sensitive}<br/>{t.privacyNotice} <a href={`/${lang}/privacy`}>{t.privacy}</a>.</p><button className="button dark" type="submit">{t.prepare}<ArrowUpRight size={19}/></button></form></div></section>
      </>}
    </main>
    <footer><div className="container"><div className="footer-top"><Brand home={home}/><p>{t.footerText}</p><a href={anchor('contact')}>{t.contact}<ArrowUpRight size={18}/></a></div><p className="operational-note">{t.disclaimer}</p><div className="footer-bottom"><span>© {new Date().getFullYear()} Open World Aviation. {t.rights}</span><nav aria-label={lang === 'en' ? 'Legal information' : 'Información legal'}>{legalPaths.map((path,i) => <a key={path} href={`/${lang}${path}`}>{t.footerLinks[i]}</a>)}</nav><a className="footer-social" href={contacts.instagram} target="_blank" rel="noopener noreferrer" aria-label="Open World Aviation on Instagram"><InstagramIcon/><span>Instagram</span></a><a className="back-top" href="#main" aria-label={lang === 'en' ? 'Back to top' : 'Volver arriba'}>↑</a></div></div></footer>
    <a className="whatsapp-fab" href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label={lang === 'es' ? 'Contactar a Open World Aviation por WhatsApp' : 'Contact Open World Aviation on WhatsApp'}><WhatsAppIcon/></a>
    {detail !== null && <Modal title={list[detail].title} close={() => setDetail(null)} closeLabel={t.close}><p className="modal-tagline">{list[detail].tagline}</p>{list[detail].paragraphs.map(p => <p key={p}>{p}</p>)}{detail === 1 && <p className="form-notice">{t.disclaimer}</p>}<button className="button dark" onClick={() => askAbout(detail)}>{t.consult}<ArrowUpRight size={18}/></button></Modal>}
    {review && <SendInquiry lang={lang} data={{ ...form, kind: 'contact', service: Number(form.service), language: lang }} close={() => setReview(false)} finished={() => {setReview(false);setForm({name:'',email:'',phone:'',company:'',service:'',message:'',website:''});}}/>}
  </>;
}
createRoot(document.getElementById('root')).render(<App/>);
