/* RGM Experiences — contenido editable.
 * CONFIG: número de WhatsApp, emails, redes.
 * APARTMENTS / EXPERIENCES / TESTIMONIALS / FAQ / GALLERY: agregá o quitá
 * elementos y la página se arma sola (slider, contadores y números incluidos).
 * `slug` define la URL de cada departamento: /propiedades/<slug>/ (en minúsculas, sin tildes).
 * `coords` [lat, lng] ubica el pin en el mapa de /propiedades/. `kind: 'house'` lo muestra como "Casa".
 * `bedrooms: 0` se muestra como monoambiente; `null` oculta el dato.
 * La ficha completa de cada uno (galería, descripción, comodidades, ubicación) está en js/detail.js.
 * Todos los textos llevan { es, en, pt }. Los datos son de EJEMPLO. */
window.RGM_CONFIG = {
  // WhatsApp del ADMINISTRADOR: acá llegan todas las consultas de la web.
  // Formato internacional sin + ni espacios (ej. 5492611234567).
  whatsapp: '5492614671604',
  email: 'hola@rgmexperiences.com',
  phoneLabel: '+54 9 261 467-1604',
  instagram: 'https://instagram.com/',
  facebook: 'https://facebook.com/',
  zones: [
    { es: 'Ciudad de Mendoza', en: 'Mendoza City', pt: 'Cidade de Mendoza' },
    { es: 'Potrerillos', en: 'Potrerillos', pt: 'Potrerillos' }
  ]
};

window.RGM_APARTMENTS = [
  {
    slug: 'mitre-i', name: 'Mitre I', zone: 'Ciudad de Mendoza', img: 'img/apts/mitre-i/01.jpg', img2: 'img/apts/mitre-i/08.jpg',
    coords: [-32.89352, -68.84533],
    tag: { es: 'Amplio · Living-comedor para seis · A pocas cuadras de Plaza Independencia', en: 'Spacious · Living and dining for six · A few blocks from Plaza Independencia', pt: 'Amplo · Sala de estar e jantar para seis · A poucas quadras da Plaza Independencia' },
    bedrooms: 3, baths: 2, sleeps: 6, parking: false
  },
  {
    slug: 'casa-potrerillos', name: 'Potrerillos', zone: 'Potrerillos', kind: 'house', img: 'img/apts/casa-potrerillos/01.jpg', img2: 'img/apts/casa-potrerillos/02.jpg',
    coords: [-33.01608, -69.27439],
    badge: { es: 'Casa de montaña', en: 'Mountain house', pt: 'Casa na montanha' },
    tag: { es: 'Pileta · Parrilla, quincho y fogón · Rodeada de montañas', en: 'Pool · Grill, gazebo and fire pit · Surrounded by mountains', pt: 'Piscina · Churrasqueira, quiosque e fogueira · Cercada de montanhas' },
    bedrooms: 3, baths: 2, sleeps: 9, parking: false
  },
  {
    slug: 'amigorena', name: 'Amigorena', zone: 'Ciudad de Mendoza', img: 'img/apts/amigorena/01.jpg', img2: 'img/apts/amigorena/07.jpg',
    coords: [-32.89174, -68.83929],
    tag: { es: 'Tres dormitorios · A metros de Av. San Martín · Ideal familias', en: 'Three bedrooms · Steps from Av. San Martín · Great for families', pt: 'Três quartos · A metros da Av. San Martín · Ideal para famílias' },
    bedrooms: 3, baths: 1, sleeps: 6, parking: false
  },
  {
    slug: 'espana-i', name: 'España I', zone: 'Ciudad de Mendoza', img: 'img/apts/espana-i/01.jpg', img2: 'img/apts/espana-i/03.jpg',
    coords: [-32.89047, -68.84191],
    tag: { es: 'Balcón entre árboles · Junto a la peatonal · Dos dormitorios', en: 'Leafy balcony · Next to the pedestrian street · Two bedrooms', pt: 'Varanda entre árvores · Junto ao calçadão · Dois quartos' },
    bedrooms: 2, baths: 1, sleeps: 4, parking: false
  },
  {
    slug: 'espana-ii', name: 'España II', zone: 'Ciudad de Mendoza', img: 'img/apts/espana-ii/01.jpg', img2: 'img/apts/espana-ii/03.jpg',
    coords: [-32.89072, -68.84198],
    badge: { es: 'Nuevo', en: 'New', pt: 'Novo' },
    tag: { es: 'Dos dormitorios · Living y comedor luminosos · Junto a la peatonal', en: 'Two bedrooms · Bright living and dining · Next to the pedestrian street', pt: 'Dois quartos · Sala de estar e jantar iluminadas · Junto ao calçadão' },
    bedrooms: 2, baths: 1.5, sleeps: 3, parking: false
  },
  {
    slug: 'belgrano', name: 'Belgrano', zone: 'Ciudad de Mendoza', img: 'img/apts/belgrano/01.jpg', img2: 'img/apts/belgrano/05.jpg',
    coords: [-32.89527, -68.85119],
    tag: { es: 'Luminoso · Cocina completa · Cerca de Arístides y del Parque', en: 'Bright · Full kitchen · Close to Arístides and the Park', pt: 'Iluminado · Cozinha completa · Perto da Arístides e do Parque' },
    bedrooms: 1, baths: 1, sleeps: 4, parking: false
  },
  {
    slug: 'mitre-ii', name: 'Mitre II', zone: 'Ciudad de Mendoza', img: 'img/apts/mitre-ii/01.jpg', img2: 'img/apts/mitre-ii/02.jpg',
    coords: [-32.89456, -68.84597],
    tag: { es: 'Monoambiente · Vista abierta a la ciudad · Ideal parejas', en: 'Studio · Open city view · Perfect for couples', pt: 'Estúdio · Vista aberta da cidade · Ideal para casais' },
    bedrooms: 0, baths: 1, sleeps: 2, parking: false
  },
  {
    slug: 'espana-iii', name: 'España III', zone: 'Ciudad de Mendoza', img: 'img/apts/espana-iii/01.jpg', img2: 'img/apts/espana-iii/03.jpg',
    coords: [-32.88620, -68.84082],
    tag: { es: 'Luminoso · Piso de parquet · Sobre Av. España arbolada', en: 'Bright · Parquet floors · On leafy Av. España', pt: 'Iluminado · Piso de parquet · Na arborizada Av. España' },
    bedrooms: 1, baths: 1, sleeps: 4, parking: false
  }
];

/* Extras que el huésped puede sumar a la estadía.
 * requires: 'parking' → sólo se ofrece si el depto tiene `parking: true`. */
window.RGM_EXTRAS = [
  { id: 'cochera', requires: 'parking', label: { es: 'Cochera', en: 'Parking space', pt: 'Garagem' } },
  { id: 'early', label: { es: 'Check-in temprano', en: 'Early check-in', pt: 'Check-in antecipado' } },
  { id: 'late', label: { es: 'Check-out tardío', en: 'Late check-out', pt: 'Check-out tardio' } },
  { id: 'cuna', label: { es: 'Cuna para bebé', en: 'Baby cot', pt: 'Berço' } },
  { id: 'bienvenida', label: { es: 'Compras de bienvenida', en: 'Welcome groceries', pt: 'Compras de boas-vindas' } }
];

/* type: 'tour' (excursiones) · 'wine' (bodegas) · 'service' (servicios) → filtros de /experiencias/ */
window.RGM_EXPERIENCES = [
  {
    slug: 'alta-montana', type: 'tour', img: 'img/exp-snow.jpg',
    name: { es: 'Alta Montaña', en: 'High Andes', pt: 'Alta Montanha' },
    place: { es: 'Potrerillos · Uspallata · Aconcagua', en: 'Potrerillos · Uspallata · Aconcagua', pt: 'Potrerillos · Uspallata · Aconcágua' },
    duration: { es: 'Día completo', en: 'Full day', pt: 'Dia inteiro' },
    text: { es: 'El dique de Potrerillos, Uspallata, Puente del Inca y el mirador del Aconcagua.', en: 'Potrerillos dam, Uspallata, Puente del Inca and the Aconcagua lookout.', pt: 'A represa de Potrerillos, Uspallata, a Puente del Inca e o mirante do Aconcágua.' }
  },
  {
    slug: 'potrerillos-cabalgata', type: 'tour', img: 'img/exp-horse.jpg',
    name: { es: 'Potrerillos + cabalgata', en: 'Potrerillos + horseback ride', pt: 'Potrerillos + cavalgada' },
    place: { es: 'Potrerillos', en: 'Potrerillos', pt: 'Potrerillos' },
    duration: { es: 'Día completo', en: 'Full day', pt: 'Dia inteiro' },
    text: { es: 'El dique de Potrerillos y una cabalgata guiada por la precordillera.', en: 'Potrerillos dam and a guided horseback ride through the Andean foothills.', pt: 'A represa de Potrerillos e uma cavalgada guiada pela pré-cordilheira.' }
  },
  {
    slug: 'termas-de-cacheuta', type: 'tour', img: 'img/exp-river.jpg',
    name: { es: 'Termas de Cacheuta', en: 'Cacheuta hot springs', pt: 'Termas de Cacheuta' },
    place: { es: 'Cacheuta · Luján de Cuyo', en: 'Cacheuta · Luján de Cuyo', pt: 'Cacheuta · Luján de Cuyo' },
    duration: { es: 'Día completo', en: 'Full day', pt: 'Dia inteiro' },
    text: { es: 'Piletas de agua termal al pie de la montaña, junto al río Mendoza.', en: 'Thermal pools at the foot of the mountains, beside the Mendoza river.', pt: 'Piscinas de água termal ao pé da montanha, junto ao rio Mendoza.' }
  },
  {
    slug: 'bodegas-maipu', type: 'wine', img: 'img/exp-vineglass.jpg',
    name: { es: 'Bodegas de Maipú', en: 'Maipú wineries', pt: 'Vinícolas de Maipú' },
    place: { es: 'Maipú', en: 'Maipú', pt: 'Maipú' },
    duration: { es: 'Medio día', en: 'Half day', pt: 'Meio dia' },
    text: { es: 'Bodegas tradicionales y familiares entre olivares, a minutos de la ciudad.', en: 'Traditional family wineries among olive groves, minutes from the city.', pt: 'Vinícolas tradicionais e familiares entre olivais, a minutos da cidade.' }
  },
  {
    slug: 'bodegas-lujan-de-cuyo', type: 'wine', img: 'img/exp-tasting.jpg',
    name: { es: 'Bodegas de Luján de Cuyo', en: 'Luján de Cuyo wineries', pt: 'Vinícolas de Luján de Cuyo' },
    place: { es: 'Luján de Cuyo', en: 'Luján de Cuyo', pt: 'Luján de Cuyo' },
    duration: { es: 'Día completo', en: 'Full day', pt: 'Dia inteiro' },
    text: { es: 'La cuna del Malbec: bodegas de distintos estilos y degustaciones guiadas.', en: 'The cradle of Malbec: wineries of different styles and guided tastings.', pt: 'O berço do Malbec: vinícolas de estilos diferentes e degustações guiadas.' }
  },
  {
    slug: 'valle-de-uco', type: 'wine', img: 'img/exp-andes.jpg',
    name: { es: 'Valle de Uco', en: 'Uco Valley', pt: 'Vale de Uco' },
    place: { es: 'Tupungato · Tunuyán · San Carlos', en: 'Tupungato · Tunuyán · San Carlos', pt: 'Tupungato · Tunuyán · San Carlos' },
    duration: { es: 'Día completo', en: 'Full day', pt: 'Dia inteiro' },
    text: { es: 'Bodegas de altura con la cordillera de fondo.', en: 'High-altitude wineries against the Andes.', pt: 'Vinícolas de altitude com a cordilheira ao fundo.' }
  },
  {
    slug: 'alquiler-de-autos', type: 'service', img: 'img/g7.jpg',
    name: { es: 'Alquiler de autos', en: 'Car rental', pt: 'Aluguel de carros' },
    place: { es: 'Mendoza', en: 'Mendoza', pt: 'Mendoza' },
    duration: { es: 'Por día', en: 'Per day', pt: 'Por dia' },
    text: { es: 'Recorré Mendoza a tu ritmo: bodegas, montaña y rutas escénicas.', en: 'Explore Mendoza at your own pace: wineries, mountains and scenic roads.', pt: 'Conheça Mendoza no seu ritmo: vinícolas, montanha e estradas cênicas.' }
  },
  {
    slug: 'traslado-aeropuerto', type: 'service', img: 'img/g2.jpg',
    name: { es: 'Traslado aeropuerto – alojamiento', en: 'Airport – lodging transfer', pt: 'Traslado aeroporto – hospedagem' },
    place: { es: 'Aeropuerto El Plumerillo', en: 'El Plumerillo Airport', pt: 'Aeroporto El Plumerillo' },
    duration: { es: 'Hasta 4 pasajeros', en: 'Up to 4 passengers', pt: 'Até 4 passageiros' },
    text: { es: 'Te esperamos en el aeropuerto y te llevamos directo a tu alojamiento.', en: 'We meet you at the airport and take you straight to your lodging.', pt: 'Esperamos você no aeroporto e levamos direto à sua hospedagem.' }
  }
];

/* Reseñas de EJEMPLO: reemplazar por reseñas reales (Airbnb, Booking, Google)
 * y borrar `sample: true` para que desaparezca la etiqueta "Ejemplo". */
window.RGM_TESTIMONIALS = [
  { sample: true, name: 'Nombre A.', where: 'Mitre I · Mendoza', text: { es: 'Espacio para una reseña real de un huésped. Contá acá qué le gustó del departamento, la atención y las experiencias que hizo durante su estadía en Mendoza.', en: 'Space for a real guest review. Tell here what they liked about the apartment, the service and the experiences they booked during their stay in Mendoza.', pt: 'Espaço para uma avaliação real de hóspede. Conte aqui o que gostou do apartamento, do atendimento e das experiências que fez durante a estadia em Mendoza.' } },
  { sample: true, name: 'Nombre B.', where: 'Casa Potrerillos', text: { es: 'Espacio para una reseña real. Idealmente una que mencione el tour de bodegas o la cabalgata, así la sección también vende las experiencias.', en: 'Space for a real review. Ideally one that mentions the winery tour or the horseback ride, so this section also sells the experiences.', pt: 'Espaço para uma avaliação real. De preferência uma que mencione o tour de vinícolas ou a cavalgada, assim a seção também vende as experiências.' } },
  { sample: true, name: 'Nombre C.', where: 'España I · Mendoza', text: { es: 'Espacio para una reseña real corta.', en: 'Space for a short real review.', pt: 'Espaço para uma avaliação real curta.' } },
  { sample: true, name: 'Nombre D.', where: 'Amigorena · Mendoza', text: { es: 'Espacio para una reseña real de una familia: comodidad, cochera, cercanía y lo fácil que fue coordinar todo por WhatsApp con el equipo de RGM.', en: 'Space for a real review from a family: comfort, parking, location and how easy it was to arrange everything over WhatsApp with the RGM team.', pt: 'Espaço para uma avaliação real de uma família: conforto, garagem, localização e como foi fácil combinar tudo pelo WhatsApp com a equipe RGM.' } },
  { sample: true, name: 'Nombre E.', where: 'Belgrano · Mendoza', text: { es: 'Espacio para una reseña real de una pareja que combinó departamento y paquete de experiencias.', en: 'Space for a real review from a couple who combined an apartment with an experience package.', pt: 'Espaço para uma avaliação real de um casal que combinou apartamento e pacote de experiências.' } }
];

window.RGM_FAQ = [
  { q: { es: '¿Cómo es el check-in?', en: 'How does check-in work?', pt: 'Como funciona o check-in?' },
    a: { es: 'El check-in es a partir de las 14 h y el check-out hasta las 10 h. Te recibimos en persona o te enviamos las instrucciones de acceso autónomo el día anterior.', en: 'Check-in is from 2 pm and check-out until 10 am. We welcome you in person or send self check-in instructions the day before.', pt: 'O check-in é a partir das 14h e o check-out até as 10h. Recebemos você pessoalmente ou enviamos as instruções de acesso autônomo no dia anterior.' } },
  { q: { es: '¿Puedo reservar solo una experiencia sin alojarme?', en: 'Can I book an experience without staying with you?', pt: 'Posso reservar só uma experiência sem me hospedar?' },
    a: { es: 'Sí. Todas las experiencias se pueden contratar por separado; si además te alojás con nosotros, armamos un paquete con mejor precio.', en: 'Yes. Every experience can be booked on its own; if you also stay with us, we put together a package at a better price.', pt: 'Sim. Todas as experiências podem ser contratadas separadamente; se você também se hospedar conosco, montamos um pacote com preço melhor.' } },
  { q: { es: '¿Qué incluyen los tours de bodegas?', en: 'What do the winery tours include?', pt: 'O que incluem os tours de vinícolas?' },
    a: { es: 'Traslado ida y vuelta desde el departamento, visitas y degustaciones en las bodegas del itinerario y, según el tour, almuerzo. Te pasamos el detalle al reservar.', en: 'Round-trip transfer from the apartment, visits and tastings at the wineries on the itinerary and, depending on the tour, lunch. We send full details when you book.', pt: 'Traslado ida e volta a partir do apartamento, visitas e degustações nas vinícolas do roteiro e, dependendo do tour, almoço. Enviamos os detalhes na reserva.' } },
  { q: { es: '¿Cómo se paga?', en: 'How do I pay?', pt: 'Como é o pagamento?' },
    a: { es: 'Aceptamos transferencia, tarjeta y efectivo. Para confirmar la reserva pedimos una seña y el saldo se abona al llegar.', en: 'We accept bank transfer, card and cash. A deposit confirms the booking and the balance is paid on arrival.', pt: 'Aceitamos transferência, cartão e dinheiro. Um sinal confirma a reserva e o saldo é pago na chegada.' } },
  { q: { es: '¿Qué tan rápido responden?', en: 'How quickly do you reply?', pt: 'Em quanto tempo vocês respondem?' },
    a: { es: 'Por WhatsApp respondemos en minutos durante el día y siempre dentro de pocas horas.', en: 'On WhatsApp we reply within minutes during the day and always within a few hours.', pt: 'Pelo WhatsApp respondemos em minutos durante o dia e sempre em poucas horas.' } }
];

window.RGM_GALLERY = [
  'img/g6.jpg', 'img/g1.jpg', 'img/exp-river.jpg', 'img/g3.jpg', 'img/g7.jpg', 'img/g2.jpg', 'img/g5.jpg'
];
