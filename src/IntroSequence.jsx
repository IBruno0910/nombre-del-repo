import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
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
      document.getElementById('main')?.focus({ preventScroll: true });
    };
  }, [onFinish]);

  return <dialog ref={dialogRef} tabIndex={-1} className="brand-intro" style={{ '--intro-duration': `${INTRO_DURATION}ms` }} aria-label={isSpanish ? 'Introducción de Open World Aviation' : 'Open World Aviation introduction'} onCancel={event => { event.preventDefault(); onFinish(false); }}>
    <div className="brand-intro__panel brand-intro__panel--left" aria-hidden="true"/>
    <div className="brand-intro__panel brand-intro__panel--right" aria-hidden="true"/>
    <div className="brand-intro__stage" aria-hidden="true">
      <div className="brand-intro__emblem">
        <div className="brand-intro__monogram">
          <span className="brand-intro__letter brand-intro__letter--o">
            <img src="/brand/monogram.png" alt="" width="326" height="174" decoding="sync" fetchPriority="high"/>
          </span>
          <span className="brand-intro__letter brand-intro__letter--w">
            <img src="/brand/monogram.png" alt="" width="326" height="174" decoding="sync"/>
          </span>
          <span className="brand-intro__gleam"/>
        </div>
      </div>
      <div className="brand-intro__name">
        <img src="/brand/logo-complete.svg" alt="" width="1316" height="254" decoding="sync"/>
      </div>
      <div className="brand-intro__rule"/>
    </div>
    <button className="brand-intro__skip" type="button" onClick={() => onFinish(false)}>
      <span>{isSpanish ? 'Saltar introducción' : 'Skip intro'}</span><ArrowRight size={17} strokeWidth={1.4}/>
    </button>
    <div className="brand-intro__timeline" aria-hidden="true"/>
  </dialog>;
}
