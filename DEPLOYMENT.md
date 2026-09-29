# Propuesta de hosting — Open World Aviation

Investigado el 23 de septiembre de 2026. No se ha contratado ni creado ningún servicio.

## Recomendación

Render, servicio web Node de pago, una instancia de 0.5 CPU / 512 MB en un workspace Hobby. Referencia de cómputo: alrededor de USD 7/mes; confirmar el precio mostrado antes de contratar, más impuestos y posibles excedentes de tráfico. La web actual no requiere una base de datos.

Fuentes oficiales:
- https://render.com/pricing
- https://render.com/articles/render-vs-railway
- https://render.com/docs/blueprint-spec
- https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports

Render Free suspende el servicio tras inactividad y bloquea los puertos SMTP 25/465/587. Railway Hobby parte de USD 5 de consumo mensual mínimo, pero bloquea SMTP; Railway Pro lo permite y tiene un mínimo de USD 20. Usar una API de correo HTTPS como Resend, ya soportada por el código, sería otra opción para esos planes económicos, con configuración y límites propios.

- https://render.com/docs/free
- https://railway.com/pricing
- https://docs.railway.com/networking/outbound-networking

## Preparado en el proyecto

- `render.yaml`: propuesta importable, instancia única, secretos solicitados en el panel y despliegue automático desactivado.
- Build: `npm ci --include=dev && npm run build`.
- Inicio: `npm start`; escucha en `0.0.0.0` en producción y usa el puerto asignado por el hosting.
- `/healthz`: comprueba que el proceso responde; no afirma que el correo esté configurado ni entregándose.
- Cierre ordenado ante SIGTERM.

## Siguiente paso

1. Confirmar proveedor y presupuesto, dominio exacto y dónde se administra su DNS.
2. Preparar un repositorio privado del código, sin `.env`, `node_modules`, `dist` ni `artifacts`. Actualmente esta carpeta no contiene un repositorio Git configurado.
3. Crear o conectar una cuenta de Render bajo control del propietario; revisar el coste antes de importar `render.yaml`.
4. Configurar secretos del correo con el administrador de Google siguiendo `EMAIL_SETUP.md`. No pegarlos en conversaciones ni en el código.
5. Usar primero la URL de prueba que asigne el proveedor, colocando ese origen HTTPS exacto en `SITE_ORIGIN`.
6. Verificar portada, rutas legales, ambos formularios, recepción en la empresa y respuesta automática al visitante.
7. Completar los datos legales pendientes antes del lanzamiento público y decidir cuándo retirar `noindex`.
8. Agregar el dominio propio y configurar únicamente los registros web requeridos por Render. Conservar los MX y registros de Google que mantienen activo el correo. Actualizar `SITE_ORIGIN` al dominio canónico y redirigir la variante www/no-www a ese origen.

## Ajuste necesario antes de activar tráfico público

El limitador de solicitudes usa actualmente la IP del socket. Detrás de un proxy del hosting, distintas visitas pueden compartir esa IP. Confirmar y probar la cabecera/proxy confiable del proveedor antes de adaptar ese límite: no confiar indiscriminadamente en `X-Forwarded-For`. La deduplicación SMTP es en memoria, por lo que esta propuesta utiliza una sola instancia; no persiste tras reinicios. El éxito del proveedor debe verificarse con una prueba de recepción real.

## Dominio y correo

El dominio puede permanecer en el registrador actual. Cambiar el alojamiento web no implica migrar la casilla de Google. No reemplazar nameservers o registros de correo sin revisar la configuración vigente.
