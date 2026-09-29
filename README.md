# Open World Aviation

Web bilingüe en React y Vite, con inglés inicial, español alternativo y contenido procedente del paquete de marca suministrado. Incluye cinco servicios, imágenes editoriales, formulario de contacto y planificador de vuelos.

## Desarrollo

Node.js 22.12 o posterior.

```sh
npm install
npm run dev
```

Vista local: http://localhost:5173. Vite ejecuta también el endpoint local `/api/inquiries`.

```sh
npm run build
npm run preview
npm run test:server
npm test
```

## Formularios y correo

- Vuelos de ida, ida y vuelta o hasta cinco tramos, con fechas y pasajeros. Validación de ruta y orden de fechas en navegador y servidor.
- Ambos formularios permiten revisar los datos antes del envío.
- El servidor envía la consulta a `contact@openworldaviation.com`, con el visitante como `Reply-To`, y luego un acuse de recibo en su idioma si `SEND_AUTOREPLY=true`.
- No se abre el programa de correo del visitante. No se confirma recepción hasta que el proveedor acepte la consulta.
- Sin credenciales configuradas, el servidor responde 503 y la web informa que no se envió; conserva los datos para reintentar.
- **La entrega real está pendiente de la autorización de quien administra Google.** Las pruebas usan entrega simulada y no mandan correos.

Ver [EMAIL_SETUP.md](EMAIL_SETUP.md) para activar Google SMTP, configurar secretos, comprobar recepción y desplegar. La configuración está en `.env.example`; los secretos se guardan solo del lado del servidor.

## Producción

```sh
npm run build
npm start
```

`npm start` sirve `dist/` y la API desde el mismo proceso Node. Configurar `NODE_ENV=production`, `SITE_ORIGIN`, variables de correo, host y puerto según el alojamiento. No basta un hosting de archivos estáticos para enviar correos; el antiguo `_redirects` únicamente resuelve las rutas de la interfaz.

## Contenido

Los servicios completos y su orden provienen de `Open_World_Aviation_Servicios_Web_ES_EN.docx`. El selector conserva el idioma en la URL sin cookies. Los logos son los PNG originales. No hay analítica, píxeles ni fuentes remotas.

Las rutas `/privacy`, `/terms`, `/cookies` y `/legal-disclaimer` mantienen los borradores bilingües del paquete, con datos pendientes destacados. Antes de publicar faltan razón social, jurisdicción, dirección, dominio confirmado, contacto legal, fecha y revisión de la configuración real. El sitio sigue con `noindex, nofollow`.

## Imágenes

Dos escenas ilustrativas creadas con `image_gen`, no fotografías de flota ni instalaciones de la empresa. JPEG locales optimizados con `srcSet`; carga diferida para la segunda imagen. PNG originales y prompts: `artifacts/owa-generated/`. Las imágenes se integran en composiciones abiertas, sin marcos de tarjeta.

## Archivos

- `src/main.jsx`: página y contacto.
- `src/forms.jsx`: planificador, revisión, envío y confirmaciones.
- `src/Modal.jsx`: diálogo accesible y restitución del foco.
- `src/content.js`, `src/services.json`, `src/legal.json`: textos y datos.
- `server/inquiries.js`: validación, SMTP/Resend, emails, deduplicación y límites.
- `server/start.js`: servidor de producción.
- `server/inquiries.test.js`, `tests/website.spec.js`: pruebas de servidor y navegador.
- `public/brand/`, `public/images/`, `public/fonts/`: assets locales.
- `artifacts/`: fuentes originales, versiones previas y capturas; no publicar esta carpeta.

La portada también recupera, a pedido del usuario, la fotografía de aviones en formación de la primera versión (`public/images/formation-flight.jpg`, procedente de `artifacts/previous-inajet/images/hero.jpg`). Se usa como fondo decorativo bajo degradados CSS; el globo y el logo se conservan por encima. No es una imagen generada para Open World Aviation. La variante `formation-flight-small.jpg` reduce el peso en dispositivos móviles.
