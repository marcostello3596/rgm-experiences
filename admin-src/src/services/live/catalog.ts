/**
 * Ficha de los departamentos tomada del sitio público (js/data.js y js/detail.js) y de la tarifa 2026–2027.
 * Beds24 no guarda fotos, comodidades ni dormitorios en el formato del panel: se completan desde acá,
 * buscando el departamento por nombre. Generado con los datos del sitio; si el sitio cambia, se regenera.
 */
export interface CatalogEntry { slug: string; names: string[]; publicName: string; bedrooms: number; beds: number; bathrooms: number; photos: string[]; amenities: string[]; basePrice: number }

export const CATALOG: CatalogEntry[] = [
  {
    "slug": "mitre-i",
    "names": [
      "Mitre I"
    ],
    "publicName": "Apartamento Mitre I",
    "bedrooms": 2,
    "beds": 3,
    "bathrooms": 1,
    "photos": [
      "/img/apts/mitre-i/pileta-1.jpg",
      "/img/apts/mitre-i/01.jpg",
      "/img/apts/mitre-i/pileta-3.jpg",
      "/img/apts/mitre-i/04.jpg",
      "/img/apts/mitre-i/07.jpg",
      "/img/apts/mitre-i/02.jpg",
      "/img/apts/mitre-i/03.jpg",
      "/img/apts/mitre-i/05.jpg",
      "/img/apts/mitre-i/06.jpg",
      "/img/apts/mitre-i/pileta-2.jpg",
      "/img/apts/mitre-i/08.jpg",
      "/img/apts/mitre-i/09.jpg",
      "/img/apts/mitre-i/10.jpg",
      "/img/apts/mitre-i/11.jpg",
      "/img/apts/mitre-i/12.jpg",
      "/img/apts/mitre-i/13.jpg",
      "/img/apts/mitre-i/14.jpg",
      "/img/apts/mitre-i/15.jpg"
    ],
    "amenities": [
      "Wi-Fi",
      "Aire acondicionado",
      "Calefacción",
      "Cocina equipada",
      "TV",
      "Ropa blanca",
      "Pileta",
      "Terraza",
      "Ascensor"
    ],
    "basePrice": 65
  },
  {
    "slug": "casa-potrerillos",
    "names": [
      "Casa Potrerillos",
      "Potrerillos"
    ],
    "publicName": "Casa en Potrerillos",
    "bedrooms": 3,
    "beds": 8,
    "bathrooms": 2,
    "photos": [
      "/img/apts/casa-potrerillos/01.jpg",
      "/img/apts/casa-potrerillos/02.jpg",
      "/img/apts/casa-potrerillos/03.jpg",
      "/img/apts/casa-potrerillos/04.jpg",
      "/img/apts/casa-potrerillos/05.jpg",
      "/img/apts/casa-potrerillos/06.jpg",
      "/img/apts/casa-potrerillos/07.jpg",
      "/img/apts/casa-potrerillos/08.jpg",
      "/img/apts/casa-potrerillos/09.jpg",
      "/img/apts/casa-potrerillos/10.jpg",
      "/img/apts/casa-potrerillos/11.jpg",
      "/img/apts/casa-potrerillos/12.jpg",
      "/img/apts/casa-potrerillos/13.jpg",
      "/img/apts/casa-potrerillos/14.jpg",
      "/img/apts/casa-potrerillos/15.jpg",
      "/img/apts/casa-potrerillos/16.jpg",
      "/img/apts/casa-potrerillos/17.jpg",
      "/img/apts/casa-potrerillos/18.jpg"
    ],
    "amenities": [
      "Hogar a leña",
      "Cocina equipada",
      "TV",
      "Ropa blanca",
      "Pileta",
      "Parrilla",
      "Quincho",
      "Fogón",
      "Jardín",
      "Vista a la montaña",
      "Estacionamiento en el lugar"
    ],
    "basePrice": 100
  },
  {
    "slug": "amigorena",
    "names": [
      "Amigorena"
    ],
    "publicName": "Apartamento Amigorena",
    "bedrooms": 3,
    "beds": 4,
    "bathrooms": 1,
    "photos": [
      "/img/apts/amigorena/01.jpg",
      "/img/apts/amigorena/02.jpg",
      "/img/apts/amigorena/03.jpg",
      "/img/apts/amigorena/04.jpg",
      "/img/apts/amigorena/05.jpg",
      "/img/apts/amigorena/06.jpg",
      "/img/apts/amigorena/07.jpg",
      "/img/apts/amigorena/08.jpg",
      "/img/apts/amigorena/09.jpg",
      "/img/apts/amigorena/10.jpg",
      "/img/apts/amigorena/11.jpg",
      "/img/apts/amigorena/12.jpg",
      "/img/apts/amigorena/13.jpg",
      "/img/apts/amigorena/14.jpg",
      "/img/apts/amigorena/15.jpg",
      "/img/apts/amigorena/16.jpg"
    ],
    "amenities": [
      "Wi-Fi",
      "Aire acondicionado",
      "Calefacción",
      "Cocina equipada",
      "TV",
      "Ropa blanca"
    ],
    "basePrice": 70
  },
  {
    "slug": "espana-i",
    "names": [
      "España I"
    ],
    "publicName": "Apartamento España I",
    "bedrooms": 3,
    "beds": 4,
    "bathrooms": 2,
    "photos": [
      "/img/apts/espana-i/01.jpg",
      "/img/apts/espana-i/02.jpg",
      "/img/apts/espana-i/03.jpg",
      "/img/apts/espana-i/04.jpg",
      "/img/apts/espana-i/05.jpg",
      "/img/apts/espana-i/06.jpg",
      "/img/apts/espana-i/07.jpg",
      "/img/apts/espana-i/08.jpg",
      "/img/apts/espana-i/09.jpg",
      "/img/apts/espana-i/10.jpg"
    ],
    "amenities": [
      "Wi-Fi",
      "Aire acondicionado",
      "Ventilador",
      "Cocina equipada",
      "TV",
      "Escritorio",
      "Ropa blanca",
      "Balcón"
    ],
    "basePrice": 65
  },
  {
    "slug": "espana-ii",
    "names": [
      "España II"
    ],
    "publicName": "Apartamento España II",
    "bedrooms": 2,
    "beds": 2,
    "bathrooms": 1.5,
    "photos": [
      "/img/apts/espana-ii/01.jpg",
      "/img/apts/espana-ii/02.jpg",
      "/img/apts/espana-ii/03.jpg",
      "/img/apts/espana-ii/04.jpg",
      "/img/apts/espana-ii/05.jpg",
      "/img/apts/espana-ii/06.jpg",
      "/img/apts/espana-ii/07.jpg",
      "/img/apts/espana-ii/08.jpg",
      "/img/apts/espana-ii/09.jpg",
      "/img/apts/espana-ii/10.jpg",
      "/img/apts/espana-ii/11.jpg",
      "/img/apts/espana-ii/12.jpg"
    ],
    "amenities": [
      "Wi-Fi",
      "Aire acondicionado",
      "Calefacción",
      "Cocina equipada",
      "TV",
      "Escritorio",
      "Ropa blanca",
      "Balcón"
    ],
    "basePrice": 50
  },
  {
    "slug": "belgrano-i",
    "names": [
      "Belgrano I"
    ],
    "publicName": "Apartamento Belgrano I",
    "bedrooms": 1,
    "beds": 1,
    "bathrooms": 1,
    "photos": [
      "/img/apts/belgrano-i/01.jpg",
      "/img/apts/belgrano-i/02.jpg",
      "/img/apts/belgrano-i/03.jpg",
      "/img/apts/belgrano-i/04.jpg",
      "/img/apts/belgrano-i/05.jpg"
    ],
    "amenities": [
      "Wi-Fi",
      "Aire acondicionado",
      "Cocina equipada",
      "TV",
      "Ropa blanca"
    ],
    "basePrice": 35
  },
  {
    "slug": "belgrano-ii",
    "names": [
      "Belgrano II"
    ],
    "publicName": "Apartamento Belgrano II",
    "bedrooms": 1,
    "beds": 2,
    "bathrooms": 1,
    "photos": [
      "/img/apts/belgrano-ii/01.jpg",
      "/img/apts/belgrano-ii/02.jpg",
      "/img/apts/belgrano-ii/03.jpg",
      "/img/apts/belgrano-ii/04.jpg",
      "/img/apts/belgrano-ii/05.jpg",
      "/img/apts/belgrano-ii/06.jpg",
      "/img/apts/belgrano-ii/07.jpg",
      "/img/apts/belgrano-ii/08.jpg",
      "/img/apts/belgrano-ii/09.jpg"
    ],
    "amenities": [
      "Wi-Fi",
      "Aire acondicionado",
      "Cocina equipada",
      "TV",
      "Ropa blanca"
    ],
    "basePrice": 38
  },
  {
    "slug": "mitre-ii",
    "names": [
      "Mitre II"
    ],
    "publicName": "Apartamento Mitre II",
    "bedrooms": 0,
    "beds": 1,
    "bathrooms": 1,
    "photos": [
      "/img/apts/mitre-ii/01.jpg",
      "/img/apts/mitre-ii/02.jpg",
      "/img/apts/mitre-ii/03.jpg",
      "/img/apts/mitre-ii/04.jpg",
      "/img/apts/mitre-ii/05.jpg",
      "/img/apts/mitre-ii/06.jpg",
      "/img/apts/mitre-ii/07.jpg",
      "/img/apts/mitre-ii/08.jpg",
      "/img/apts/mitre-ii/09.jpg",
      "/img/apts/mitre-ii/10.jpg",
      "/img/apts/mitre-ii/11.jpg"
    ],
    "amenities": [
      "Wi-Fi",
      "Aire acondicionado",
      "Calefacción",
      "Cocina equipada",
      "TV",
      "Escritorio",
      "Ropa blanca",
      "Vista a la ciudad"
    ],
    "basePrice": 35
  },
  {
    "slug": "espana-iii",
    "names": [
      "España III"
    ],
    "publicName": "Apartamento España III",
    "bedrooms": 1,
    "beds": 2,
    "bathrooms": 1,
    "photos": [
      "/img/apts/espana-iii/01.jpg",
      "/img/apts/espana-iii/02.jpg",
      "/img/apts/espana-iii/03.jpg",
      "/img/apts/espana-iii/04.jpg",
      "/img/apts/espana-iii/05.jpg",
      "/img/apts/espana-iii/06.jpg",
      "/img/apts/espana-iii/07.jpg"
    ],
    "amenities": [
      "Wi-Fi",
      "Aire acondicionado",
      "Cocina equipada",
      "TV",
      "Ropa blanca",
      "Ascensor"
    ],
    "basePrice": 38
  }
];

const norm = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

export const findCatalog = (name: string): CatalogEntry | undefined => CATALOG.find((c) => c.names.some((n) => norm(n) === norm(name)));
