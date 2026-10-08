import React from 'react';

// User-selected assets, keyed by the stable service ID (not display order).
const photographs = {
  2: {
    name: 'aircraft-sales', width: 1536, height: 1024, position: '48% 55%', mobilePosition: '32% center',
    es: 'Dos profesionales junto a una aeronave ejecutiva al atardecer.',
    en: 'Two professionals beside an executive aircraft at sunset.',
  },
  0: {
    name: 'aircraft-management', width: 1280, height: 853, position: 'center 58%', mobilePosition: '60% center',
    es: 'Sala de reuniones con vista a aeronaves y un hangar.',
    en: 'Meeting room overlooking aircraft and a hangar.',
  },
  1: {
    name: 'private-flights', width: 1448, height: 1086, position: 'center 54%', mobilePosition: 'center',
    es: 'Interior de una cabina ejecutiva con asientos de cuero claro y terminaciones en madera.',
    en: 'Executive cabin interior with light leather seats and wood finishes.',
  },
  3: {
    name: 'corporate-solutions', width: 1536, height: 1024, position: 'center 70%', mobilePosition: '64% center',
    es: 'Instalaciones aeroportuarias y aeronaves frente a un hangar al atardecer.',
    en: 'Airport facilities and aircraft outside a hangar at dusk.',
  },
  4: {
    name: 'support-logistics', width: 1600, height: 900, position: 'center', mobilePosition: '65% center',
    es: 'Carga aérea preparada en pallets junto a un avión carguero.',
    en: 'Air freight pallets being handled beside a cargo aircraft.',
  },
};

export default function ServiceImage({ serviceId, lang }) {
  const photo = photographs[serviceId];
  return <span className="service-photo" style={{ '--photo-position': photo.position, '--photo-mobile-position': photo.mobilePosition }}>
    <img
      src={`/images/services/${photo.name}.jpg`}
      srcSet={`/images/services/${photo.name}-small.jpg 768w, /images/services/${photo.name}.jpg ${photo.width}w`}
      sizes="100vw"
      width={photo.width} height={photo.height} alt={photo[lang]}
      loading="lazy" decoding="async"
    />
  </span>;
}
