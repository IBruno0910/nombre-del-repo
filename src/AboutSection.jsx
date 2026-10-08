import React from 'react';
import { Compass, Network, Handshake } from 'lucide-react';
import './about.css';

const valueIcons = [Compass, Network, Handshake];

export default function AboutSection({ lang, content }) {
  return <section className="about-section" id="perspective" aria-labelledby="about-title">
      <figure className="about-photo">
        <img
          src="/images/about-aviation.jpg"
          srcSet="/images/about-aviation-small.jpg 640w, /images/about-aviation.jpg 1122w"
          sizes="(max-width: 800px) 100vw, 58vw"
          width="1122" height="1402"
          alt={lang === 'en' ? 'Helicopter beside a hangar at sunset, with an aircraft on the apron in the background' : 'Helicóptero junto a un hangar al atardecer, con un avión en la plataforma al fondo'}
          loading="lazy" decoding="async"
        />
      </figure>
    <div className="container about-grid">
      <div className="about-intro">
        <h2 id="about-title">{content.aboutTitle}</h2>
        <p>{content.aboutText}</p>
      </div>
      <ul className="about-values">
        {content.values.map(([title, description], index) => {
          const Icon = valueIcons[index];
          return <li key={title}>
          <Icon size={24} strokeWidth={1.4} aria-hidden="true"/>
          <div><h3>{title}</h3><p>{description}</p></div>
        </li>;
        })}
      </ul>
    </div>
  </section>;
}
