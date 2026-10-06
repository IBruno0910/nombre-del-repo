import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import AviationMark from './AviationMark';
import './intro.css';

const INTRO_DURATION = 3400;

export function shouldShowIntro() {
  const path = window.location.pathname.replace(/\/$/, '');
  if (!['', '/en', '/es'].includes(path) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try { return sessionStorage.getItem('owa-intro-seen') !== 'true'; }
  catch { return true; }
}

export default function IntroSequence({ lang, onFinish }) {
  const dialogRef = useRef(null);
  const isSpanish = lang === 'es';
  const services = isSpanish ? ['Asesoría', 'Gestión', 'Soluciones'] : ['Advisory', 'Management', 'Solutions'];

  useEffect(() => {
    try { sessionStorage.setItem('owa-intro-seen', 'true'); } catch {}
    const dialog = dialogRef.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    dialog.showModal();
    dialog.focus({ preventScroll: true });
    document.body.classList.add('intro-active');
    const finish = () => onFinish(false);
    const timer = window.setTimeout(finish, INTRO_DURATION);
    const onMotionChange = event => { if (event.matches) finish(); };
    motion.addEventListener('change', onMotionChange);
    return () => {
      window.clearTimeout(timer);
      motion.removeEventListener('change', onMotionChange);
      document.body.classList.remove('intro-active');
      dialog.close();
      document.querySelector('.header .brand')?.focus({ preventScroll: true });
    };
  }, [onFinish]);

  return <dialog ref={dialogRef} tabIndex={-1} className="brand-intro" style={{ '--intro-duration': `${INTRO_DURATION}ms` }} aria-label={isSpanish ? 'Introducción de Open World Aviation' : 'Open World Aviation introduction'} onCancel={event => { event.preventDefault(); onFinish(false); }}>
    <div className="brand-intro__panel brand-intro__panel--left" aria-hidden="true"/>
    <div className="brand-intro__panel brand-intro__panel--right" aria-hidden="true"/>
    <div className="brand-intro__stage" aria-hidden="true">
      <div className="brand-intro__emblem">
        <svg className="brand-intro__guides" viewBox="0 0 420 210" fill="none">
          <path pathLength="1" d="M32 128H388M210 12V198M38 26H62M38 26V50M382 26H358M382 26V50M38 184H62M38 184V160M382 184H358M382 184V160"/>
        </svg>
        <AviationMark className="brand-intro__mark"/>
      </div>
      <div className="brand-intro__name">
        <img src="/brand/logo-complete.svg" alt="" width="1316" height="254" decoding="sync"/>
      </div>
      <div className="brand-intro__rule"/>
      <div className="brand-intro__services">{services.map(service => <span key={service}>{service}</span>)}</div>
    </div>
    <button className="brand-intro__skip" type="button" onClick={() => onFinish(false)}>
      <span>{isSpanish ? 'Saltar introducción' : 'Skip intro'}</span><ArrowRight size={17} strokeWidth={1.4}/>
    </button>
    <div className="brand-intro__timeline" aria-hidden="true"/>
  </dialog>;
}
