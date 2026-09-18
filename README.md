# RGM Experiences

Sitio web de RGM: departamentos de alquiler temporario en Mendoza y experiencias (tours de bodegas, alta montaña, cabalgatas y paquetes). Español, inglés y portugués, con detección automática del idioma del dispositivo.

## Páginas
- `index.html`: home (hero con buscador, slider de departamentos, experiencias, testimonios, galería, contacto, FAQ).
- `propiedades.html`: listado de departamentos con filtro por fechas y huéspedes (`?in=AAAA-MM-DD&out=AAAA-MM-DD&guests=N`).

Las consultas no tienen precios: el panel "Consultar" arma un mensaje y lo envía por WhatsApp al administrador (siempre en español, con el idioma del huésped indicado).

## Editar contenido
- `js/data.js`: número de WhatsApp del administrador, departamentos (capacidad, cochera, fechas ocupadas), extras, experiencias, testimonios, FAQ y galería.
- `js/i18n.js`: todos los textos en ES / EN / PT.
- `css/styles.css`: estilos.

## Estructura de fuentes (HTML)
`index.html` y `propiedades.html` se generan desde `src/`:
```
python3 src/build.py
```
Editá `src/content.html` (home y partes compartidas) o `src/props-main.html` (listado) y volvé a correr el script.

## Fuentes tipográficas
El sitio usa "Bodonisvtytwoitctt Bookita" y "Franklingothicurw Lig". Los archivos no están en el repo (licencia comercial): copiar `BodoniSvtyTwoITCTT-BookIta.woff` y `FranklinGothicURW-Lig.woff2` en `fonts/`. Sin ellos se usan Libre Bodoni y Libre Franklin.

## Librerías (CDN)
GSAP 3.13 (ScrollTrigger, SplitText, Draggable, Inertia), Lenis, flatpickr.

## Fotos
Las fotos de `img/` son de muestra (Freepik, requieren atribución). Reemplazar por fotos propias de RGM.

## Publicar
Es un sitio estático: subir el contenido del repo (sin `src/`) a Hostinger, o activar GitHub Pages.
