/* RGM Experiences — ficha de cada departamento (/propiedades/<slug>/).
 * Una entrada por `slug` de js/data.js. Textos en { es, en, pt }.
 * - gallery: fotos de la grilla (la primera es la grande). Son de MUESTRA.
 * - beds: camas.
 * - title/intro: titular y bajada de la sección "El departamento".
 * - overview: bloques de la pestaña Descripción.
 * - amenities: ids de RGM_AMENITIES (abajo), agrupados.
 * - location: texto, búsqueda para el mapa y tiempos de viaje (ids de RGM_PLACES).
 */

window.RGM_AMENITIES = {
  wifi:      { es: 'Wi-Fi de alta velocidad', en: 'High-speed Wi-Fi', pt: 'Wi-Fi de alta velocidade' },
  ac:        { es: 'Aire acondicionado', en: 'Air conditioning', pt: 'Ar-condicionado' },
  heating:   { es: 'Calefacción', en: 'Heating', pt: 'Aquecimento' },
  kitchen:   { es: 'Cocina equipada', en: 'Equipped kitchen', pt: 'Cozinha equipada' },
  coffee:    { es: 'Cafetera', en: 'Coffee maker', pt: 'Cafeteira' },
  washer:    { es: 'Lavarropas', en: 'Washing machine', pt: 'Máquina de lavar' },
  tv:        { es: 'Smart TV', en: 'Smart TV', pt: 'Smart TV' },
  desk:      { es: 'Escritorio de trabajo', en: 'Workspace', pt: 'Mesa de trabalho' },
  linens:    { es: 'Ropa de cama y toallas', en: 'Bed linen & towels', pt: 'Roupa de cama e toalhas' },
  hairdryer: { es: 'Secador de pelo', en: 'Hair dryer', pt: 'Secador de cabelo' },
  balcony:   { es: 'Balcón', en: 'Balcony', pt: 'Varanda' },
  terrace:   { es: 'Terraza', en: 'Terrace', pt: 'Terraço' },
  garden:    { es: 'Jardín', en: 'Garden', pt: 'Jardim' },
  pool:      { es: 'Pileta', en: 'Swimming pool', pt: 'Piscina' },
  grill:     { es: 'Parrilla', en: 'Barbecue grill', pt: 'Churrasqueira' },
  view:      { es: 'Vista a la cordillera', en: 'Andes view', pt: 'Vista para a cordilheira' },
  parking:   { es: 'Cochera', en: 'Parking', pt: 'Garagem' },
  elevator:  { es: 'Ascensor', en: 'Elevator', pt: 'Elevador' },
  selfcheck: { es: 'Check-in autónomo', en: 'Self check-in', pt: 'Check-in autônomo' },
  crib:      { es: 'Cuna a pedido', en: 'Crib on request', pt: 'Berço sob pedido' },
  pets:      { es: 'Se aceptan mascotas', en: 'Pets allowed', pt: 'Aceita pets' },
  concierge: { es: 'Asistencia por WhatsApp', en: 'WhatsApp assistance', pt: 'Atendimento por WhatsApp' },
  transfer:  { es: 'Traslado al aeropuerto (opcional)', en: 'Airport transfer (optional)', pt: 'Traslado ao aeroporto (opcional)' },
  tours:     { es: 'Reserva de tours y bodegas', en: 'Tour & winery bookings', pt: 'Reserva de passeios e vinícolas' }
};

window.RGM_AMENITY_GROUPS = {
  indoor:  { es: 'Interior', en: 'Indoor', pt: 'Interior' },
  outdoor: { es: 'Exterior', en: 'Outdoor', pt: 'Exterior' },
  extras:  { es: 'Servicios', en: 'Services', pt: 'Serviços' }
};

window.RGM_PLACES = {
  airport:   { es: 'Aeropuerto El Plumerillo', en: 'El Plumerillo Airport', pt: 'Aeroporto El Plumerillo' },
  plaza:     { es: 'Plaza Independencia', en: 'Plaza Independencia', pt: 'Plaza Independencia' },
  aristides: { es: 'Calle Arístides Villanueva', en: 'Arístides Villanueva street', pt: 'Rua Arístides Villanueva' },
  park:      { es: 'Parque General San Martín', en: 'General San Martín Park', pt: 'Parque General San Martín' },
  lujan:     { es: 'Bodegas de Luján de Cuyo', en: 'Luján de Cuyo wineries', pt: 'Vinícolas de Luján de Cuyo' },
  chacras:   { es: 'Plaza de Chacras de Coria', en: 'Chacras de Coria square', pt: 'Praça de Chacras de Coria' },
  palmares:  { es: 'Palmares Open Mall', en: 'Palmares Open Mall', pt: 'Palmares Open Mall' },
  uco:       { es: 'Valle de Uco', en: 'Uco Valley', pt: 'Vale de Uco' },
  potrerillos: { es: 'Dique Potrerillos', en: 'Potrerillos dam', pt: 'Represa de Potrerillos' }
};

window.RGM_DETAILS = {
  malbec: {
    beds: 3,
    gallery: ['img/apt1.jpg', 'img/apt1b.jpg', 'img/apt2.jpg', 'img/apt3.jpg', 'img/g4.jpg'],
    title: { es: 'Luz, cordillera y <em>el centro a pie.</em>', en: 'Light, mountains and <em>the city on foot.</em>', pt: 'Luz, cordilheira e <em>o centro a pé.</em>' },
    intro: { es: 'Un departamento nuevo en un piso alto, con balcón corrido y la cordillera de frente. Dos dormitorios en suite, living amplio y todo a pocas cuadras de Plaza Independencia.', en: 'A brand-new apartment on a high floor, with a long balcony facing the Andes. Two en-suite bedrooms, a generous living room and everything a few blocks from Plaza Independencia.', pt: 'Um apartamento novo em andar alto, com varanda corrida e a cordilheira de frente. Dois quartos com banheiro, sala ampla e tudo a poucas quadras da Plaza Independencia.' },
    overview: [
      { t: { es: 'El living', en: 'The living room', pt: 'A sala' }, p: { es: 'Ventanales de piso a techo, sillones amplios y mesa para seis. Al atardecer la luz entra de lleno y la montaña se tiñe de rosa.', en: 'Floor-to-ceiling windows, deep sofas and a table for six. At sunset the light pours in and the mountains turn pink.', pt: 'Janelas do piso ao teto, sofás amplos e mesa para seis. No fim da tarde a luz entra forte e a montanha fica rosada.' } },
      { t: { es: 'Los dormitorios', en: 'The bedrooms', pt: 'Os quartos' }, p: { es: 'Dos suites con colchones de hotel, blackout y placares grandes. Una tiene cama king y la otra, dos camas que se pueden unir.', en: 'Two suites with hotel-grade mattresses, blackout curtains and large closets. One has a king bed; the other has two beds that can be joined.', pt: 'Duas suítes com colchões de hotel, blackout e armários grandes. Uma tem cama king e a outra, duas camas que podem ser unidas.' } },
      { t: { es: 'La cocina', en: 'The kitchen', pt: 'A cozinha' }, p: { es: 'Integrada al living, con horno, anafe, cafetera y todo lo necesario para cocinar o descorchar un Malbec al volver de las bodegas.', en: 'Open to the living room, with oven, cooktop, coffee maker and everything you need to cook or open a Malbec after the wineries.', pt: 'Integrada à sala, com forno, cooktop, cafeteira e tudo para cozinhar ou abrir um Malbec na volta das vinícolas.' } }
    ],
    amenities: { indoor: ['wifi', 'ac', 'heating', 'kitchen', 'coffee', 'washer', 'tv', 'desk', 'linens', 'hairdryer'], outdoor: ['balcony', 'view', 'parking', 'elevator'], extras: ['selfcheck', 'concierge', 'transfer', 'tours'] },
    location: { text: { es: 'En pleno centro, a tres cuadras de Plaza Independencia: cafés, restaurantes y la peatonal a pie. Las bodegas de Luján de Cuyo quedan a media hora.', en: 'Right downtown, three blocks from Plaza Independencia: cafés, restaurants and the pedestrian street on foot. Luján de Cuyo wineries are half an hour away.', pt: 'No centro, a três quadras da Plaza Independencia: cafés, restaurantes e o calçadão a pé. As vinícolas de Luján de Cuyo ficam a meia hora.' }, map: 'Plaza Independencia, Mendoza', times: [['plaza', 5], ['aristides', 10], ['park', 12], ['airport', 20], ['lujan', 30]] }
  },
  torrontes: {
    beds: 1,
    gallery: ['img/apt2.jpg', 'img/apt2b.jpg', 'img/apt1b.jpg', 'img/apt5.jpg', 'img/g5.jpg'],
    title: { es: 'Pequeño, luminoso <em>y pensado para dos.</em>', en: 'Small, bright <em>and made for two.</em>', pt: 'Pequeno, iluminado <em>e pensado para dois.</em>' },
    intro: { es: 'Un monoambiente amplio con dormitorio separado y cocina abierta. Ideal para parejas que quieren recorrer Mendoza a pie y volver a un lugar tranquilo.', en: 'A spacious studio with a separate bedroom and open kitchen. Perfect for couples who want to explore Mendoza on foot and come back to somewhere calm.', pt: 'Um estúdio amplo com quarto separado e cozinha aberta. Ideal para casais que querem conhecer Mendoza a pé e voltar para um lugar tranquilo.' },
    overview: [
      { t: { es: 'El espacio', en: 'The space', pt: 'O espaço' }, p: { es: 'Paredes claras, madera y mucha luz natural. Sillón cómodo, mesa para dos y un rincón de lectura junto a la ventana.', en: 'Light walls, wood and plenty of natural light. A comfortable sofa, a table for two and a reading nook by the window.', pt: 'Paredes claras, madeira e muita luz natural. Sofá confortável, mesa para dois e um canto de leitura junto à janela.' } },
      { t: { es: 'El descanso', en: 'Rest', pt: 'O descanso' }, p: { es: 'Cama queen con sábanas de algodón y cortinas blackout para dormir la siesta mendocina como corresponde.', en: 'Queen bed with cotton sheets and blackout curtains for a proper Mendoza siesta.', pt: 'Cama queen com lençóis de algodão e cortinas blackout para a sesta mendocina.' } }
    ],
    amenities: { indoor: ['wifi', 'ac', 'heating', 'kitchen', 'coffee', 'tv', 'linens', 'hairdryer'], outdoor: ['elevator'], extras: ['selfcheck', 'concierge', 'transfer', 'tours'] },
    location: { text: { es: 'A metros de la Alameda y a pocas cuadras de la peatonal Sarmiento, en una calle tranquila del centro.', en: 'Steps from the Alameda and a few blocks from Sarmiento pedestrian street, on a quiet downtown street.', pt: 'A poucos metros da Alameda e perto do calçadão Sarmiento, numa rua tranquila do centro.' }, map: 'Alameda, Mendoza', times: [['plaza', 8], ['aristides', 12], ['park', 15], ['airport', 20], ['lujan', 35]] }
  },
  aconcagua: {
    beds: 4,
    gallery: ['img/apt3.jpg', 'img/apt3b.jpg', 'img/g6.jpg', 'img/apt4.jpg', 'img/exp-andes.jpg'],
    title: { es: 'Entre viñedos, <em>con pileta y parrilla.</em>', en: 'Among the vines, <em>with pool and grill.</em>', pt: 'Entre vinhedos, <em>com piscina e churrasqueira.</em>' },
    intro: { es: 'Una casa-departamento en Chacras de Coria, rodeada de verde. Tres dormitorios, galería con parrilla y pileta para las tardes de verano.', en: 'A house-style apartment in Chacras de Coria, surrounded by green. Three bedrooms, a porch with grill and a pool for summer afternoons.', pt: 'Um apartamento estilo casa em Chacras de Coria, cercado de verde. Três quartos, varanda com churrasqueira e piscina para as tardes de verão.' },
    overview: [
      { t: { es: 'La galería', en: 'The porch', pt: 'A varanda' }, p: { es: 'El corazón de la casa: parrilla, mesa larga y vista al jardín. Pensada para asados que empiezan temprano y terminan tarde.', en: 'The heart of the house: grill, long table and garden views. Made for asados that start early and end late.', pt: 'O coração da casa: churrasqueira, mesa comprida e vista para o jardim. Feita para churrascos que começam cedo e terminam tarde.' } },
      { t: { es: 'Para familias', en: 'For families', pt: 'Para famílias' }, p: { es: 'Tres dormitorios, dos baños y espacio de sobra. Cuna a pedido y jardín cerrado para que los chicos jueguen tranquilos.', en: 'Three bedrooms, two bathrooms and room to spare. Crib on request and an enclosed garden for kids to play safely.', pt: 'Três quartos, dois banheiros e espaço de sobra. Berço sob pedido e jardim fechado para as crianças brincarem.' } },
      { t: { es: 'Bodegas cerca', en: 'Wineries nearby', pt: 'Vinícolas perto' }, p: { es: 'Luján de Cuyo está a diez minutos: ideal para combinar con la Ruta del Malbec.', en: 'Luján de Cuyo is ten minutes away — ideal for the Malbec Route.', pt: 'Luján de Cuyo fica a dez minutos: ideal para combinar com a Rota do Malbec.' } }
    ],
    amenities: { indoor: ['wifi', 'ac', 'heating', 'kitchen', 'coffee', 'washer', 'tv', 'linens', 'hairdryer', 'crib'], outdoor: ['pool', 'grill', 'garden', 'parking'], extras: ['concierge', 'transfer', 'tours', 'pets'] },
    location: { text: { es: 'En Chacras de Coria, el barrio verde de Mendoza: casonas, restaurantes de campo y la plaza con feria los fines de semana.', en: 'In Chacras de Coria, Mendoza\'s leafy neighbourhood: old houses, country restaurants and a square with a weekend market.', pt: 'Em Chacras de Coria, o bairro verde de Mendoza: casarões, restaurantes de campo e a praça com feira nos fins de semana.' }, map: 'Chacras de Coria, Mendoza', times: [['chacras', 5], ['lujan', 10], ['palmares', 12], ['plaza', 25], ['airport', 35], ['uco', 70]] }
  },
  cabernet: {
    beds: 3,
    gallery: ['img/apt4.jpg', 'img/apt4b.jpg', 'img/apt5b.jpg', 'img/apt6.jpg', 'img/g2.jpg'],
    title: { es: 'Espacio para todos <em>y cochera propia.</em>', en: 'Room for everyone <em>and private parking.</em>', pt: 'Espaço para todos <em>e garagem própria.</em>' },
    intro: { es: 'Un departamento familiar en Godoy Cruz, cerca de Palmares y con salida rápida a las rutas de montaña y bodegas.', en: 'A family apartment in Godoy Cruz, near Palmares and with quick access to the mountain and winery routes.', pt: 'Um apartamento familiar em Godoy Cruz, perto do Palmares e com saída rápida para as rotas de montanha e vinícolas.' },
    overview: [
      { t: { es: 'Cómodo y práctico', en: 'Comfortable and practical', pt: 'Confortável e prático' }, p: { es: 'Living con sofá cama, cocina completa y lavarropas. Todo lo necesario para estadías de una semana o más.', en: 'Living room with sofa bed, full kitchen and washing machine. Everything for stays of a week or more.', pt: 'Sala com sofá-cama, cozinha completa e máquina de lavar. Tudo para estadias de uma semana ou mais.' } },
      { t: { es: 'Con auto', en: 'By car', pt: 'De carro' }, p: { es: 'Cochera cubierta incluida y acceso rápido al Acceso Sur para salir a Luján, Maipú o la montaña.', en: 'Covered parking included and quick access to the southern highway towards Luján, Maipú or the mountains.', pt: 'Garagem coberta incluída e acesso rápido à rodovia sul rumo a Luján, Maipú ou a montanha.' } }
    ],
    amenities: { indoor: ['wifi', 'ac', 'heating', 'kitchen', 'coffee', 'washer', 'tv', 'desk', 'linens', 'crib'], outdoor: ['balcony', 'parking', 'elevator'], extras: ['selfcheck', 'concierge', 'transfer', 'tours'] },
    location: { text: { es: 'En Godoy Cruz, a cinco minutos de Palmares Open Mall y a quince del centro de Mendoza.', en: 'In Godoy Cruz, five minutes from Palmares Open Mall and fifteen from downtown Mendoza.', pt: 'Em Godoy Cruz, a cinco minutos do Palmares Open Mall e a quinze do centro de Mendoza.' }, map: 'Godoy Cruz, Mendoza', times: [['palmares', 5], ['plaza', 15], ['lujan', 20], ['airport', 25], ['potrerillos', 50]] }
  },
  bonarda: {
    beds: 2,
    gallery: ['img/apt5.jpg', 'img/apt5b.jpg', 'img/apt6b.jpg', 'img/apt2b.jpg', 'img/g3.jpg'],
    title: { es: 'Terraza propia <em>en el barrio más vivo.</em>', en: 'A private terrace <em>in the liveliest street.</em>', pt: 'Terraço próprio <em>no bairro mais animado.</em>' },
    intro: { es: 'Diseño cálido a una cuadra de Arístides Villanueva, la calle de bares y restaurantes. Terraza para desayunar al sol.', en: 'Warm design one block from Arístides Villanueva, the street of bars and restaurants. A terrace for breakfast in the sun.', pt: 'Design acolhedor a uma quadra da Arístides Villanueva, a rua de bares e restaurantes. Terraço para o café da manhã ao sol.' },
    overview: [
      { t: { es: 'La terraza', en: 'The terrace', pt: 'O terraço' }, p: { es: 'Mesa, reposeras y plantas. El lugar para el primer café de la mañana o una copa al final del día.', en: 'Table, loungers and plants. The spot for your first coffee or a glass at the end of the day.', pt: 'Mesa, espreguiçadeiras e plantas. O lugar para o primeiro café ou uma taça no fim do dia.' } },
      { t: { es: 'Adentro', en: 'Inside', pt: 'Por dentro' }, p: { es: 'Un dormitorio con cama queen y sofá cama en el living para una tercera persona.', en: 'One bedroom with a queen bed plus a sofa bed in the living room for a third guest.', pt: 'Um quarto com cama queen e sofá-cama na sala para uma terceira pessoa.' } }
    ],
    amenities: { indoor: ['wifi', 'ac', 'heating', 'kitchen', 'coffee', 'tv', 'linens', 'hairdryer'], outdoor: ['terrace'], extras: ['selfcheck', 'concierge', 'transfer', 'tours'] },
    location: { text: { es: 'A una cuadra de Arístides Villanueva y a cinco del Parque General San Martín.', en: 'One block from Arístides Villanueva and five from General San Martín Park.', pt: 'A uma quadra da Arístides Villanueva e a cinco do Parque General San Martín.' }, map: 'Arístides Villanueva, Mendoza', times: [['aristides', 2], ['park', 8], ['plaza', 12], ['airport', 22], ['lujan', 30]] }
  },
  uco: {
    beds: 3,
    gallery: ['img/apt6.jpg', 'img/apt6b.jpg', 'img/apt3b.jpg', 'img/apt4b.jpg', 'img/g1.jpg'],
    title: { es: 'Silencio, jardín <em>y tiempo para quedarse.</em>', en: 'Silence, a garden <em>and time to stay.</em>', pt: 'Silêncio, jardim <em>e tempo para ficar.</em>' },
    intro: { es: 'Un departamento tranquilo en Chacras de Coria, con jardín propio y escritorio. Pensado para estadías largas y para trabajar a distancia.', en: 'A quiet apartment in Chacras de Coria, with its own garden and a desk. Designed for long stays and remote work.', pt: 'Um apartamento tranquilo em Chacras de Coria, com jardim próprio e escrivaninha. Pensado para estadias longas e trabalho remoto.' },
    overview: [
      { t: { es: 'Para quedarse', en: 'To stay a while', pt: 'Para ficar' }, p: { es: 'Wi-Fi rápido, escritorio junto a la ventana, lavarropas y cocina completa. Tarifas especiales por mes.', en: 'Fast Wi-Fi, a desk by the window, washing machine and full kitchen. Special monthly rates.', pt: 'Wi-Fi rápido, mesa junto à janela, máquina de lavar e cozinha completa. Tarifas especiais por mês.' } },
      { t: { es: 'El jardín', en: 'The garden', pt: 'O jardim' }, p: { es: 'Césped, árboles y una mesa afuera para almorzar a la sombra.', en: 'Lawn, trees and an outdoor table for lunch in the shade.', pt: 'Gramado, árvores e uma mesa externa para almoçar à sombra.' } }
    ],
    amenities: { indoor: ['wifi', 'ac', 'heating', 'kitchen', 'coffee', 'washer', 'tv', 'desk', 'linens'], outdoor: ['garden', 'grill', 'parking'], extras: ['concierge', 'transfer', 'tours', 'pets'] },
    location: { text: { es: 'En una calle arbolada de Chacras de Coria, a minutos de la plaza y de las primeras bodegas de Luján.', en: 'On a tree-lined street in Chacras de Coria, minutes from the square and the first Luján wineries.', pt: 'Numa rua arborizada de Chacras de Coria, a minutos da praça e das primeiras vinícolas de Luján.' }, map: 'Chacras de Coria, Mendoza', times: [['chacras', 4], ['lujan', 10], ['palmares', 12], ['plaza', 25], ['airport', 35], ['uco', 70]] }
  }
};
