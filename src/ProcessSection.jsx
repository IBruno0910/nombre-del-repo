import React from 'react';
import './process.css';

export default function ProcessSection({ content }) {
  return <section className="approach-section" id="approach" aria-labelledby="approach-title">
    <div className="container approach-content">
      <header className="approach-heading">
        <p className="approach-brand">Open World Aviation</p>
        <h2 id="approach-title">{content.processTitle}</h2>
        <p className="approach-intro">{content.processIntro}</p>
      </header>
      <ol className="approach-steps">
        {content.process.map(([title, description], index) => <li key={title}>
          <span className="approach-step-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </li>)}
      </ol>
    </div>
  </section>;
}
