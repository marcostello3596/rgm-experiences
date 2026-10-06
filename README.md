# RGM Experiences

Sitio web de RGM: departamentos de alquiler temporario en Mendoza y experiencias (tours de bodegas, alta montaña, cabalgatas y paquetes). Español, inglés y portugués, con detección automática del idioma del dispositivo.

## Páginas
- `index.html`: home (hero con buscador, slider de departamentos, experiencias, testimonios, galería, contacto, FAQ).
- `propiedades/`: listado de departamentos (`?in=AAAA-MM-DD&out=AAAA-MM-DD&guests=N`).
- `experiencias/`: listado de todas las experiencias con filtros (día completo, medio día, paquetes; `?tipo=day|half|pack`).
- `experiencias/<slug>/`: ficha de cada experiencia (itinerario, qué incluye, info útil y consulta). El contenido está en `js/exp-detail.js`.
- `propiedades/<slug>/`: ficha de cada departamento (galería, descripción, comodidades, ubicación, reseñas y consulta). El contenido está en `js/detail.js`; para sumar un departamento agregalo en `js/data.js` y `js/detail.js` y corré `python3 src/build.py`.

Las consultas no tienen precios: el panel "Consultar" arma un mensaje y lo envía por WhatsApp al administrador (siempre en español, con el idioma del huésped indicado).

## Editar contenido
- `js/data.js`: número de WhatsApp del administrador, departamentos (capacidad, cochera, fechas ocupadas), extras, experiencias, testimonios, FAQ y galería.
- `js/i18n.js`: todos los textos en ES / EN / PT.
- `css/styles.css`: estilos base y componentes.
- `css/v2.css`: sistema visual editorial (tipografías, botones, hero, secciones). Va después de styles.css.

## Estructura de fuentes (HTML)
Las páginas (`index.html`, `propiedades/` y `propiedades/<slug>/` de cada departamento) se generan desde `src/`:
```
python3 src/build.py
```
Editá `src/content.html` (home y partes compartidas) o `src/props-main.html` (listado) y volvé a correr el script.

## Fuentes tipográficas
- Titulares: **Gambarino** · textos y etiquetas: **Supreme** (Fontshare, licencia ITF Free Font: uso comercial gratuito). Archivos en `fonts/`.
- El logo "RGM" del menú y del pie es el trazo vectorial del logo original (símbolo `#rgm-word` en `src/content.html`), no depende de ninguna fuente.

## Librerías (CDN)
GSAP 3.13 (ScrollTrigger, SplitText, Draggable, Inertia), Lenis, flatpickr.

## Fotos
Las fotos de `img/` son de muestra (Freepik, requieren atribución). Reemplazar por fotos propias de RGM.

## Publicar
Es un sitio estático: subir el contenido del repo (sin `src/`) a Hostinger, o activar GitHub Pages.
