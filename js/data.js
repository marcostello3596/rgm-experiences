/* RGM Experiences — contenido editable.
 * CONFIG: número de WhatsApp, emails, redes.
 * APARTMENTS / EXPERIENCES / TESTIMONIALS / FAQ / GALLERY: agregá o quitá
 * elementos y la página se arma sola (slider, contadores y números incluidos).
 * Todos los textos llevan { es, en, pt }. Los datos son de EJEMPLO. */
window.RGM_CONFIG = {
  // WhatsApp del ADMINISTRADOR: acá llegan todas las consultas de la web.
  // Formato internacional sin + ni espacios (ej. 5492611234567).
  whatsapp: '5492610000000',
  email: 'hola@rgmexperiences.com',
  phoneLabel: '+54 9 261 000 0000',
  instagram: 'https://instagram.com/',
  facebook: 'https://facebook.com/',
  zones: [
    { es: 'Ciudad de Mendoza', en: 'Mendoza City', pt: 'Cidade de Mendoza' },
    { es: 'Chacras de Coria', en: 'Chacras de Coria', pt: 'Chacras de Coria' },
    { es: 'Godoy Cruz', en: 'Godoy Cruz', pt: 'Godoy Cruz' }
  ]
};

window.RGM_APARTMENTS = [
  {
    name: 'Malbec', zone: 'Ciudad de Mendoza', img: 'img/apt1.jpg', img2: 'img/apt1b.jpg',
    badge: { es: 'Nuevo 2026', en: 'New 2026', pt: 'Novo 2026' },
    tag: { es: 'Vista a la cordillera · Balcón · A pasos de Plaza Independencia', en: 'Andes view · Balcony · Steps from Plaza Independencia', pt: 'Vista para a cordilheira · Varanda · A passos da Plaza Independencia' },
    bedrooms: 2, baths: 2, sleeps: 4, parking: true
  },
  {
    name: 'Torrontés', zone: 'Ciudad de Mendoza', img: 'img/apt2.jpg', img2: 'img/apt2b.jpg',
    tag: { es: 'Luminoso · Cocina abierta · Ideal parejas', en: 'Bright · Open kitchen · Perfect for couples', pt: 'Iluminado · Cozinha aberta · Ideal para casais' },
    bedrooms: 1, baths: 1, sleeps: 2, parking: false,
    // Fechas ocupadas (EJEMPLO): [llegada, salida) en formato AAAA-MM-DD.
    booked: [['2026-10-09', '2026-10-14'], ['2026-12-20', '2027-01-03']]
  },
  {
    name: 'Aconcagua', zone: 'Chacras de Coria', img: 'img/apt3.jpg', img2: 'img/apt3b.jpg',
    badge: { es: 'Recién renovado', en: 'Newly renovated', pt: 'Recém-reformado' },
    tag: { es: 'Entre viñedos · Parrilla propia · Pileta', en: 'Among vineyards · Private grill · Pool', pt: 'Entre vinhedos · Churrasqueira · Piscina' },
    bedrooms: 3, baths: 2, sleeps: 6, parking: true
  },
  {
    name: 'Cabernet', zone: 'Godoy Cruz', img: 'img/apt4.jpg', img2: 'img/apt4b.jpg',
    tag: { es: 'Familiar · Cochera · Cerca de Palmares', en: 'Family-friendly · Parking · Near Palmares', pt: 'Familiar · Garagem · Perto do Palmares' },
    bedrooms: 2, baths: 1.5, sleeps: 5, parking: true
  },
  {
    name: 'Bonarda', zone: 'Ciudad de Mendoza', img: 'img/apt5.jpg', img2: 'img/apt5b.jpg',
    tag: { es: 'Arístides Villanueva · Diseño cálido · Terraza', en: 'Arístides Villanueva · Warm design · Terrace', pt: 'Arístides Villanueva · Design acolhedor · Terraço' },
    bedrooms: 1, baths: 1, sleeps: 3, parking: false
  },
  {
    name: 'Uco', zone: 'Chacras de Coria', img: 'img/apt6.jpg', img2: 'img/apt6b.jpg',
    tag: { es: 'Silencioso · Jardín · Estadías largas', en: 'Quiet · Garden · Long stays', pt: 'Silencioso · Jardim · Estadias longas' },
    bedrooms: 2, baths: 2, sleeps: 4, parking: true
  }
];

/* Extras que el huésped puede sumar a la estadía.
 * requires: 'parking' → sólo se ofrece si el depto tiene `parking: true`. */
window.RGM_EXTRAS = [
  { id: 'cochera', requires: 'parking', label: { es: 'Cochera', en: 'Parking space', pt: 'Garagem' } },
  { id: 'traslado', label: { es: 'Traslado desde el aeropuerto', en: 'Airport transfer', pt: 'Traslado do aeroporto' } },
  { id: 'early', label: { es: 'Check-in temprano', en: 'Early check-in', pt: 'Check-in antecipado' } },
  { id: 'late', label: { es: 'Check-out tardío', en: 'Late check-out', pt: 'Check-out tardio' } },
  { id: 'cuna', label: { es: 'Cuna para bebé', en: 'Baby cot', pt: 'Berço' } },
  { id: 'bienvenida', label: { es: 'Compras de bienvenida', en: 'Welcome groceries', pt: 'Compras de boas-vindas' } }
];

window.RGM_EXPERIENCES = [
  {
    img: 'img/exp-tasting.jpg',
    name: { es: 'Ruta del Malbec', en: 'Malbec Route', pt: 'Rota do Malbec' },
    place: { es: 'Luján de Cuyo', en: 'Luján de Cuyo', pt: 'Luján de Cuyo' },
    duration: { es: 'Día completo', en: 'Full day', pt: 'Dia inteiro' },
    text: { es: 'Tres bodegas, degustaciones guiadas y almuerzo de pasos entre viñedos.', en: 'Three wineries, guided tastings and a multi-course lunch among the vines.', pt: 'Três vinícolas, degustações guiadas e almoço harmonizado entre vinhedos.' }
  },
  {
    img: 'img/exp-andes.jpg',
    name: { es: 'Valle de Uco', en: 'Uco Valley', pt: 'Vale de Uco' },
    place: { es: 'Tupungato · Tunuyán · San Carlos', en: 'Tupungato · Tunuyán · San Carlos', pt: 'Tupungato · Tunuyán · San Carlos' },
    duration: { es: 'Día completo', en: 'Full day', pt: 'Dia inteiro' },
    text: { es: 'Bodegas de altura con la cordillera de fondo y almuerzo con vista a los Andes.', en: 'High-altitude wineries against the Andes, with a lunch facing the peaks.', pt: 'Vinícolas de altitude com a cordilheira ao fundo e almoço com vista para os Andes.' }
  },
  {
    img: 'img/exp-snow.jpg',
    name: { es: 'Alta Montaña', en: 'High Andes', pt: 'Alta Montanha' },
    place: { es: 'Potrerillos · Uspallata · Aconcagua', en: 'Potrerillos · Uspallata · Aconcagua', pt: 'Potrerillos · Uspallata · Aconcágua' },
    duration: { es: 'Día completo', en: 'Full day', pt: 'Dia inteiro' },
    text: { es: 'El dique de Potrerillos, Puente del Inca y el mirador del Aconcagua.', en: 'Potrerillos dam, Puente del Inca and the Aconcagua lookout.', pt: 'A represa de Potrerillos, a Puente del Inca e o mirante do Aconcágua.' }
  },
  {
    img: 'img/exp-horse.jpg',
    name: { es: 'Cabalgata al atardecer', en: 'Sunset horseback ride', pt: 'Cavalgada ao pôr do sol' },
    place: { es: 'Pie de monte', en: 'Andean foothills', pt: 'Pé da montanha' },
    duration: { es: 'Medio día', en: 'Half day', pt: 'Meio dia' },
    text: { es: 'A caballo por la precordillera y asado criollo cuando cae el sol.', en: 'Ride through the foothills and share a traditional asado at sundown.', pt: 'A cavalo pela pré-cordilheira e churrasco crioulo quando o sol se põe.' }
  },
  {
    img: 'img/exp-vineglass.jpg',
    name: { es: 'Bodegas en bici', en: 'Wineries by bike', pt: 'Vinícolas de bike' },
    place: { es: 'Maipú', en: 'Maipú', pt: 'Maipú' },
    duration: { es: 'Medio día', en: 'Half day', pt: 'Meio dia' },
    text: { es: 'Pedaleá entre olivares y bodegas familiares a tu ritmo.', en: 'Pedal between olive groves and family wineries at your own pace.', pt: 'Pedale entre olivais e vinícolas familiares no seu ritmo.' }
  },
  {
    img: 'img/exp-cellar.jpg',
    name: { es: 'Paquete Mendoza Esencial', en: 'Essential Mendoza package', pt: 'Pacote Mendoza Essencial' },
    place: { es: '3 noches · depto + 2 tours + traslados', en: '3 nights · apartment + 2 tours + transfers', pt: '3 noites · apê + 2 passeios + traslados' },
    duration: { es: '4 días', en: '4 days', pt: '4 dias' },
    text: { es: 'Alojamiento, Ruta del Malbec, Alta Montaña y traslado desde el aeropuerto.', en: 'Lodging, Malbec Route, High Andes and airport transfer.', pt: 'Hospedagem, Rota do Malbec, Alta Montanha e traslado do aeroporto.' }
  }
];

/* Reseñas de EJEMPLO: reemplazar por reseñas reales (Airbnb, Booking, Google)
 * y borrar `sample: true` para que desaparezca la etiqueta "Ejemplo". */
window.RGM_TESTIMONIALS = [
  { sample: true, name: 'Nombre A.', where: 'Malbec · Mendoza', text: { es: 'Espacio para una reseña real de un huésped. Contá acá qué le gustó del departamento, la atención y las experiencias que hizo durante su estadía en Mendoza.', en: 'Space for a real guest review. Tell here what they liked about the apartment, the service and the experiences they booked during their stay in Mendoza.', pt: 'Espaço para uma avaliação real de hóspede. Conte aqui o que gostou do apartamento, do atendimento e das experiências que fez durante a estadia em Mendoza.' } },
  { sample: true, name: 'Nombre B.', where: 'Aconcagua · Chacras', text: { es: 'Espacio para una reseña real. Idealmente una que mencione el tour de bodegas o la cabalgata, así la sección también vende las experiencias.', en: 'Space for a real review. Ideally one that mentions the winery tour or the horseback ride, so this section also sells the experiences.', pt: 'Espaço para uma avaliação real. De preferência uma que mencione o tour de vinícolas ou a cavalgada, assim a seção também vende as experiências.' } },
  { sample: true, name: 'Nombre C.', where: 'Torrontés · Mendoza', text: { es: 'Espacio para una reseña real corta.', en: 'Space for a short real review.', pt: 'Espaço para uma avaliação real curta.' } },
  { sample: true, name: 'Nombre D.', where: 'Cabernet · Godoy Cruz', text: { es: 'Espacio para una reseña real de una familia: comodidad, cochera, cercanía y lo fácil que fue coordinar todo por WhatsApp con el equipo de RGM.', en: 'Space for a real review from a family: comfort, parking, location and how easy it was to arrange everything over WhatsApp with the RGM team.', pt: 'Espaço para uma avaliação real de uma família: conforto, garagem, localização e como foi fácil combinar tudo pelo WhatsApp com a equipe RGM.' } },
  { sample: true, name: 'Nombre E.', where: 'Bonarda · Mendoza', text: { es: 'Espacio para una reseña real de una pareja que combinó departamento y paquete de experiencias.', en: 'Space for a real review from a couple who combined an apartment with an experience package.', pt: 'Espaço para uma avaliação real de um casal que combinou apartamento e pacote de experiências.' } }
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
  'img/g6.jpg', 'img/g1.jpg', 'img/exp-river.jpg', 'img/g3.jpg', 'img/g7.jpg', 'img/g2.jpg', 'img/g5.jpg', 'img/g4.jpg'
];
