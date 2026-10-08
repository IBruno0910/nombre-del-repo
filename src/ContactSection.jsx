import React from 'react';
import { ArrowUpRight, ArrowRight, Mail, Phone, Globe2 } from 'lucide-react';
import { contactDetails } from './content';
import './contact.css';

export default function ContactSection({ lang, content: t, services, form, formRef, onChange, onReview }) {
  const titleParts = t.contactTitle.split(/(próximo proyecto\.|next project\.)/);
  return <section className="contact-section" id="contact" aria-labelledby="contact-title">
    <div className="container contact-grid">
      <div className="contact-copy">
        <h2 id="contact-title">{titleParts.map((part, i) => i === 1 ? <span key={i}>{part}</span> : part)}</h2>
        <p>{t.contactIntro}</p>
        <div className="contact-links">
          {contactDetails.map(({ label, href, type }) => {
            const Icon = type === 'email' ? Mail : type === 'phone' ? Phone : Globe2;
            return <a className="email-link" key={href} href={href}>
              <Icon size={20} strokeWidth={1.5} aria-hidden="true"/>
              <span>{label}</span><ArrowUpRight size={16} aria-hidden="true"/>
            </a>;
          })}
        </div>
        <div className="contact-signature">
          <img src="/brand/monogram.png" alt="" width="326" height="174" loading="lazy"/>
          <span>{t.footerText}</span>
        </div>
      </div>
      <form ref={formRef} className="contact-form" onSubmit={e => { e.preventDefault(); onReview(); }}>
        <label className="trap-field" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" value={form.website || ''} onChange={onChange}/></label>
        <div className="form-grid">
          {[['name', t.name, 'text', 'name'], ['email', t.email, 'email', 'email'], ['phone', t.phone, 'tel', 'tel'], ['company', t.company, 'text', 'organization']].map(([name, label, type, autoComplete]) => <label key={name}>
            {label}{!['name', 'email'].includes(name) && <small> ({t.optional})</small>}
            <input name={name} type={type} autoComplete={autoComplete} placeholder={t.contactPlaceholders[name]} required={['name', 'email'].includes(name)} maxLength={name === 'name' ? 100 : name === 'phone' ? 60 : 160} value={form[name]} onChange={onChange}/>
          </label>)}
        </div>
        <label>{t.service}<select name="service" value={form.service} onChange={onChange} required>
          <option value="" disabled>{t.choose}</option>
          {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select></label>
        <label>{t.message}<textarea name="message" placeholder={t.contactPlaceholders.message} value={form.message} onChange={onChange} rows={3} required maxLength={2500}/></label>
        <p className="form-notice">{t.sensitive}<br/>{t.privacyNotice} <a href={`/${lang}/privacy`}>{t.privacy}</a>.</p>
        <button className="button dark" type="submit">{t.prepare}<ArrowRight size={20} aria-hidden="true"/></button>
      </form>
    </div>
  </section>;
}
