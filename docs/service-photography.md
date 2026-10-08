# Imágenes de servicios

Selección entregada por el usuario en esta conversación, integrada el 8 de octubre de 2026. Los archivos de `public/images/services/` reemplazan las imágenes generadas anteriormente.

| Servicio (ID estable) | Archivo | Imagen seleccionada | Resolución original |
| --- | --- | --- | --- |
| Compra y venta / Aircraft sales and acquisitions (2) | `aircraft-sales.jpg` | Dos profesionales junto al avión al atardecer; segunda imagen del envío del 8 de octubre | 1536 × 1024 |
| Gestión / Aircraft management (0) | `aircraft-management.jpg` | Sala de reuniones con vista al hangar; imagen del envío anterior, reasignada al quedar reemplazada la selección de Corporate solutions | 1280 × 853 |
| Vuelos privados / Private flights (1) | `private-flights.jpg` | Cabina de cuero claro y madera; selección explícita del 8 de octubre | 1448 × 1086 |
| Soluciones corporativas / Corporate solutions (3) | `corporate-solutions.jpg` | Hangar y aeronaves al atardecer; primera imagen del envío del 8 de octubre | 1536 × 1024 |
| Soporte y logística / Support and logistics (4) | `support-logistics.jpg` | Avión carguero y pallets; tercera imagen del envío del 8 de octubre (la cuarta era un duplicado) | 1600 × 900 |

## Tratamiento

- Se conservaron las imágenes suministradas, sin reconstrucción generativa ni modificaciones de aeronaves, personas o marcas.
- Conversión a JPEG, calidad 88, sin aumentar las dimensiones originales. Cada archivo tiene una variante `-small.jpg` de 768 px de ancho.
- Las versiones se seleccionan con `srcSet`; se cargan de manera diferida. Los encuadres de escritorio y móvil se definen en `src/ServiceImage.jsx`.
- Los fondos llevan un degradado CSS para mantener legibles los textos. El desplazamiento de la imagen queda limitado a 32 px y se desactiva con la preferencia de movimiento reducido.
- Procedencia: adjuntos del usuario. No se atribuye un autor, licencia de banco de imágenes ni autenticidad fotográfica independiente que no hayan sido verificados.
- Las fotografías descargadas durante la búsqueda previa quedaron fuera de los archivos públicos y no se utilizan en el sitio.

Las imágenes representan cada servicio; no se presentan como flota, instalaciones ni personal propios. Se mantienen los textos y avisos operativos existentes.

## Quiénes somos y contacto

Actualización del 8 de octubre de 2026 con los adjuntos adicionales del usuario:

- `public/images/about-aviation.jpg`: helicóptero junto a un hangar al atardecer, con un avión al fondo. Original de 1122 × 1402 px integrado en Quiénes somos con encuadre adaptable y degradado CSS, sin marco ni epígrafe. Variante `-small.jpg` de 640 px de ancho.
- `public/images/contact-cockpit.jpg`: cabina de mando, original de 1600 × 900 px. Fondo de la sección Contacto con una capa azul oscuro aplicada mediante CSS para mantener el contraste. Variante `-small.jpg` de 800 px de ancho.
- `public/images/process-apron.jpg`: aeronave y equipos de asistencia en la plataforma, original de 1600 × 900 px. Fondo de Cómo trabajamos con degradado claro para los tres pasos. Variante `-small.jpg` de 800 px de ancho.

Estas imágenes se convirtieron a JPEG con calidad 88, sin reconstrucción generativa, ampliación ni cambios en su contenido.
