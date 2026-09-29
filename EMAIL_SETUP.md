# Activación del correo de Open World Aviation

El destinatario de todas las consultas está fijado en el servidor como `contact@openworldaviation.com`. El navegador no puede cambiarlo. Las respuestas automáticas se envían al email que el visitante escribió, después de que el proveedor acepte la consulta dirigida a la empresa.

## Estado actual

Implementados: formulario general, formulario de vuelos, endpoint de envío, validación, confirmación en pantalla y respuesta automática EN/ES. Probados con entrega simulada. **La cuenta de Google todavía no está autorizada: no se verificó ningún envío real.** Comprar hosting no es necesario para probar desde este equipo una vez configurado el correo.

## Para quien administra la cuenta de Google

1. Confirmar que `contact@openworldaviation.com` es una casilla de Google Workspace o un alias autorizado para enviar, e identificar la cuenta real que se autentica.
2. Verificar si la organización permite contraseñas de aplicación. Requieren verificación en dos pasos y pueden no estar disponibles según las políticas de la cuenta. Si están permitidas, crear una específica para la web; no utilizar la contraseña normal de Google.
3. Configurar el secreto directamente en `.env` local o en las variables privadas del hosting. No enviarlo por chat ni incorporarlo a archivos del frontend. Para comenzar, copiar `.env.example` a `.env` y completar `SMTP_USER`, `SMTP_PASS` y `MAIL_FROM`.
4. Si la organización prohíbe este método, coordinar una integración OAuth2 o un relay autorizado antes de activar el envío. Esta versión implementa SMTP autenticado y, como alternativa opcional, Resend; OAuth2 no está implementado.
5. Reiniciar el servidor y probar una consulta real con una dirección controlada. Confirmar tanto la recepción en `contact@openworldaviation.com` como el acuse de recibo del visitante, incluidas las carpetas de spam.

Configuración prevista: `smtp.gmail.com`, puerto 465 con TLS, remitente autorizado de Open World Aviation y `SEND_AUTOREPLY=true`.

Documentación: [contraseñas de aplicación de Google](https://support.google.com/accounts/answer/185833), [SMTP de Nodemailer](https://nodemailer.com/smtp).

## Confirmación automática

ES: “Gracias por contactar a Open World Aviation. Recibimos su mensaje. Nuestro equipo revisará su consulta y se pondrá en contacto con usted pronto.”

EN: “Thank you for contacting Open World Aviation. We received your message. Our team will review your inquiry and get in touch with you soon.”

El mensaje añade que una consulta de vuelo no constituye una reserva ni una cotización confirmada. No incluye el texto libre del visitante, para evitar reenviar contenido arbitrario a terceros.

La confirmación de la web significa que el proveedor aceptó el correo, no que esté garantizada su entrega final en la bandeja de entrada. Si falla solo el acuse de recibo, se informa que la consulta se recibió y no es necesario repetirla.

## Hosting

Se necesita alojamiento con un proceso Node.js persistente o adaptar el endpoint a funciones del proveedor. Un hosting que solo sirva `dist/` no ejecutará el envío. Comandos: `npm run build` y `npm start`. En producción configurar `NODE_ENV=production`, `SITE_ORIGIN=https://DOMINIO-CONFIRMADO`, `HOST`, `PORT` y las variables privadas de correo; servir la web y `/api/inquiries` bajo el mismo origen y con HTTPS.

El servidor incluye límites de tamaño y frecuencia, validación, honeypot y comprobación de origen. Los límites por IP usan la dirección del socket sin confiar en cabeceras del cliente. Si se añade un proxy, ajustar su política de límites antes de publicar (de lo contrario, sus visitas pueden compartir el mismo límite).

La deduplicación de SMTP es en memoria durante 24 horas, dentro de una sola instancia. Para varias instancias o persistencia tras reinicios se debe usar un almacén compartido. Un fallo de red de resultado ambiguo puede ocasionar un duplicado al reintentar SMTP. La alternativa Resend envía claves de idempotencia al proveedor. No se guardan mensajes de visitantes en archivos locales ni se imprimen sus datos en logs de la aplicación.

Las políticas legales continúan como borrador y deben ajustarse al hosting, configuración de correo y prácticas reales antes de publicar.
