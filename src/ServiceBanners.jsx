import React, { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import ServiceImage from './ServiceImage';
import './service-banners.css';

export default function ServiceBanners({ services, lang, more, onSelect }) {
  const root = useRef(null);

  useEffect(() => {
    const element = root.current;
    const banners = [...element.querySelectorAll('.service-banner')];
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let stop = () => {};

    function configureMotion() {
      stop();
      banners.forEach(banner => {
        banner.style.removeProperty('--photo-y');
        banner.style.removeProperty('--scroll-progress');
      });
      delete element.dataset.motion;
      if (preference.matches || !('IntersectionObserver' in window)) return;

      element.dataset.motion = 'on';
      const visible = new Set();
      let frame = 0;
      function paint() {
        frame = 0;
        const height = window.innerHeight;
        visible.forEach(banner => {
          const rect = banner.getBoundingClientRect();
          const progress = Math.max(0, Math.min(1, (height - rect.top) / (height + rect.height)));
          banner.style.setProperty('--photo-y', `${((progress - .5) * 64).toFixed(2)}px`);
          banner.style.setProperty('--scroll-progress', progress.toFixed(3));
          if (rect.top < height * .9) banner.classList.add('is-revealed');
        });
      }
      function schedule() { if (!frame) frame = requestAnimationFrame(paint); }
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        });
        schedule();
      }, { rootMargin: '80px 0px' });
      banners.forEach(banner => observer.observe(banner));
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      stop = () => {
        observer.disconnect();
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
      };
    }

    configureMotion();
    preference.addEventListener('change', configureMotion);
    return () => { stop(); preference.removeEventListener('change', configureMotion); };
  }, []);

  return <div className="service-list service-banners" ref={root}>
    {services.map(service => <article className="service-banner" key={service.id} data-service-id={service.id}>
      <ServiceImage serviceId={service.id} lang={lang}/>
      <div className="service-banner-shade" aria-hidden="true"/>
      <button className="service-row" type="button" onClick={() => onSelect(service.id)} aria-label={`${service.title} — ${more}`}>
        <span className="service-banner-content container">
          <span className="service-banner-copy">
            <h3>{service.title}</h3>
            <span className="service-summary">{service.summary}</span>
          </span>
          <span className="service-more">{more}<span className="circle-arrow"><ArrowUpRight size={26} aria-hidden="true"/></span></span>
        </span>
      </button>
      <span className="service-banner-progress" aria-hidden="true"/>
    </article>)}
  </div>;
}
