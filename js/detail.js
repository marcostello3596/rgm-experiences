/* RGM Experiences — ficha de cada departamento (/propiedades/<slug>/).
 * Una entrada por `slug` de js/data.js. Textos en { es, en, pt }.
 * - gallery: fotos de la grilla (la primera es la grande; la última se usa como foto ancha).
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
  tours:     { es: 'Reserva de tours y bodegas', en: 'Tour & winery bookings', pt: 'Reserva de passeios e vinícolas' },
  fan:       { es: 'Ventiladores de techo', en: 'Ceiling fans', pt: 'Ventiladores de teto' },
  fireplace: { es: 'Hogar a leña', en: 'Wood fireplace', pt: 'Lareira a lenha' },
  quincho:   { es: 'Quincho', en: 'Thatched gazebo', pt: 'Quiosque' },
  firepit:   { es: 'Fogón', en: 'Fire pit', pt: 'Fogueira' },
  mountain:  { es: 'Vista a la montaña', en: 'Mountain view', pt: 'Vista para a montanha' },
  cityview:  { es: 'Vista a la ciudad', en: 'City view', pt: 'Vista da cidade' },
  onsiteparking: { es: 'Estacionamiento en el predio', en: 'On-site parking', pt: 'Estacionamento no terreno' }
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
  potrerillos: { es: 'Dique Potrerillos', en: 'Potrerillos dam', pt: 'Represa de Potrerillos' },
  peatonal:  { es: 'Peatonal Sarmiento', en: 'Sarmiento pedestrian street', pt: 'Calçadão Sarmiento' },
  sanmartin: { es: 'Av. San Martín', en: 'Av. San Martín', pt: 'Av. San Martín' },
  cacheuta:  { es: 'Termas de Cacheuta', en: 'Cacheuta hot springs', pt: 'Termas de Cacheuta' },
  uspallata: { es: 'Uspallata', en: 'Uspallata', pt: 'Uspallata' },
  city:      { es: 'Ciudad de Mendoza', en: 'Mendoza city', pt: 'Cidade de Mendoza' }
};

// Galería de fotos numeradas: img/apts/<slug>/01.jpg, 02.jpg…
function rgmGal(slug, n) { var a = []; for (var i = 1; i <= n; i++) a.push('img/apts/' + slug + '/' + (i < 10 ? '0' : '') + i + '.jpg'); return a; }


window.RGM_DETAILS = {
  'mitre-753': {
    beds: 5,
    gallery: rgmGal('mitre-753', 15),
    title: { es: 'Espacio para todos, <em>a pasos de la plaza.</em>', en: 'Room for everyone, <em>steps from the plaza.</em>', pt: 'Espaço para todos, <em>a passos da praça.</em>' },
    intro: { es: 'Un departamento grande en un edificio con hall de entrada cuidado, a pocas cuadras de Plaza Independencia. Living con sillones, comedor para seis, tres dormitorios y dos baños: ideal para familias o grupos que quieren recorrer el centro a pie.', en: 'A large apartment in a building with a smart entrance hall, a few blocks from Plaza Independencia. Lounge with armchairs, dining for six, three bedrooms and two bathrooms: ideal for families or groups who want to explore downtown on foot.', pt: 'Um apartamento grande num prédio com hall de entrada caprichado, a poucas quadras da Plaza Independencia. Sala com poltronas, jantar para seis, três quartos e dois banheiros: ideal para famílias ou grupos que querem conhecer o centro a pé.' },
    overview: [
      { t: { es: 'El living', en: 'The living room', pt: 'A sala' }, p: { es: 'Piso de madera, sillones, TV y una mesa de vidrio para seis junto a los ventanales. Aire acondicionado y calefacción por radiadores.', en: 'Wooden floors, armchairs, a TV and a glass table for six by the windows. Air conditioning and radiator heating.', pt: 'Piso de madeira, poltronas, TV e uma mesa de vidro para seis junto às janelas. Ar-condicionado e aquecimento por radiadores.' } },
      { t: { es: 'Los dormitorios', en: 'The bedrooms', pt: 'Os quartos' }, p: { es: 'Tres dormitorios con placares: uno con cama matrimonial y dos con camas individuales, con ropa de cama y toallas incluidas.', en: 'Three bedrooms with wardrobes: one with a double bed and two with single beds, bed linen and towels included.', pt: 'Três quartos com armários: um com cama de casal e dois com camas de solteiro, roupa de cama e toalhas incluídas.' } },
      { t: { es: 'La cocina', en: 'The kitchen', pt: 'A cozinha' }, p: { es: 'Cocina separada con horno, anafe, microondas y mesada de granito, con todo lo necesario para cocinar durante la estadía.', en: 'Separate kitchen with oven, cooktop, microwave and granite counters, with everything you need to cook during your stay.', pt: 'Cozinha separada com forno, cooktop, micro-ondas e bancada de granito, com tudo para cozinhar durante a estadia.' } }
    ],
    amenities: { indoor: ['wifi', 'ac', 'heating', 'kitchen', 'tv', 'linens'], outdoor: ['elevator'], extras: ['concierge', 'transfer', 'tours'] },
    location: { text: { es: 'Sobre Av. Mitre, en pleno centro: Plaza Independencia, la peatonal Sarmiento y la Calle Arístides Villanueva se recorren a pie.', en: 'On Av. Mitre, right downtown: Plaza Independencia, Sarmiento pedestrian street and Arístides Villanueva are all walkable.', pt: 'Na Av. Mitre, no centro: a Plaza Independencia, o calçadão Sarmiento e a Arístides Villanueva ficam a pé.' }, map: 'Av. Bartolomé Mitre 753, Ciudad de Mendoza, Mendoza, Argentina', times: [['plaza', 5], ['peatonal', 7], ['aristides', 15], ['park', 8], ['airport', 20], ['lujan', 30]] }
  },
  'casa-potrerillos': {
    beds: 8,
    gallery: rgmGal('casa-potrerillos', 18),
    title: { es: 'Una casa de piedra <em>entre montañas.</em>', en: 'A stone house <em>among the mountains.</em>', pt: 'Uma casa de pedra <em>entre montanhas.</em>' },
    intro: { es: 'Una casa de montaña en Potrerillos, con un parque grande, pileta, parrilla, quincho y fogón. Adentro, living con hogar a leña, comedor vidriado con vista a los cerros y lugar para grupos grandes.', en: 'A mountain house in Potrerillos with a large garden, pool, grill, thatched gazebo and fire pit. Inside, a living room with a wood fireplace, a glassed-in dining room facing the hills and room for big groups.', pt: 'Uma casa na montanha em Potrerillos, com um grande jardim, piscina, churrasqueira, quiosque e fogueira. Dentro, sala com lareira a lenha, sala de jantar envidraçada com vista para os morros e espaço para grupos grandes.' },
    overview: [
      { t: { es: 'Afuera', en: 'Outdoors', pt: 'Lá fora' }, p: { es: 'Parque con árboles, pileta con vista a la montaña, parrilla de ladrillo, quincho de paja con mesa y un fogón para las noches frescas.', en: 'A tree-filled garden, a pool with mountain views, a brick grill, a thatched gazebo with a table and a fire pit for cool nights.', pt: 'Jardim com árvores, piscina com vista para a montanha, churrasqueira de tijolo, quiosque de palha com mesa e uma fogueira para as noites frescas.' } },
      { t: { es: 'Adentro', en: 'Indoors', pt: 'Lá dentro' }, p: { es: 'Muros de piedra, techos de madera y un living con hogar a leña. El comedor vidriado tiene mesa para seis y vista a los cerros; la cocina está equipada.', en: 'Stone walls, timber ceilings and a living room with a wood fireplace. The glassed-in dining room seats six and looks out to the hills; the kitchen is fully equipped.', pt: 'Paredes de pedra, tetos de madeira e uma sala com lareira a lenha. A sala de jantar envidraçada tem mesa para seis e vista para os morros; a cozinha é equipada.' } },
      { t: { es: 'Para dormir', en: 'Sleeping', pt: 'Para dormir' }, p: { es: 'Tres dormitorios: uno con cama matrimonial y dos con cuchetas, pensados para familias y grupos de amigos. Dos baños.', en: 'Three bedrooms: one with a double bed and two with bunk beds, made for families and groups of friends. Two bathrooms.', pt: 'Três quartos: um com cama de casal e dois com beliches, pensados para famílias e grupos de amigos. Dois banheiros.' } }
    ],
    amenities: { indoor: ['fireplace', 'kitchen', 'tv', 'linens'], outdoor: ['pool', 'grill', 'quincho', 'firepit', 'garden', 'mountain', 'onsiteparking'], extras: ['concierge', 'tours'] },
    location: { text: { es: 'En Las Carditas, Potrerillos, al pie de la cordillera: a minutos del dique Potrerillos y de las Termas de Cacheuta, y a poco más de una hora de la ciudad de Mendoza.', en: 'In Las Carditas, Potrerillos, at the foot of the Andes: minutes from the Potrerillos dam and Cacheuta hot springs, and just over an hour from Mendoza city.', pt: 'Em Las Carditas, Potrerillos, ao pé da cordilheira: a minutos da represa de Potrerillos e das Termas de Cacheuta, e a pouco mais de uma hora da cidade de Mendoza.' }, map: '-33.01608,-69.27439', times: [['potrerillos', 15], ['cacheuta', 25], ['uspallata', 55], ['city', 70], ['airport', 80]] }
  },
  'amigorena-14': {
    beds: 4,
    gallery: rgmGal('amigorena-14', 16),
    title: { es: 'Tres dormitorios <em>en pleno centro.</em>', en: 'Three bedrooms <em>right downtown.</em>', pt: 'Três quartos <em>no centro.</em>' },
    intro: { es: 'Un departamento amplio a metros de Av. San Martín, con living-comedor luminoso, tres dormitorios y cocina completa. Cafés, comercios y la peatonal Sarmiento a pocas cuadras.', en: 'A spacious apartment steps from Av. San Martín, with a bright living-dining room, three bedrooms and a full kitchen. Cafés, shops and Sarmiento pedestrian street a few blocks away.', pt: 'Um apartamento amplo a metros da Av. San Martín, com sala de estar e jantar iluminada, três quartos e cozinha completa. Cafés, lojas e o calçadão Sarmiento a poucas quadras.' },
    overview: [
      { t: { es: 'El living', en: 'The living room', pt: 'A sala' }, p: { es: 'Ventanal a la calle, sillón amplio, Smart TV y mesa para seis. Aire acondicionado y calefacción.', en: 'A large street-facing window, a big sofa, a Smart TV and a table for six. Air conditioning and heating.', pt: 'Janela ampla para a rua, sofá grande, Smart TV e mesa para seis. Ar-condicionado e aquecimento.' } },
      { t: { es: 'Los dormitorios', en: 'The bedrooms', pt: 'Os quartos' }, p: { es: 'Dos dormitorios con cama matrimonial y uno con dos camas individuales. Ropa de cama y toallas incluidas.', en: 'Two bedrooms with a double bed and one with two single beds. Bed linen and towels included.', pt: 'Dois quartos com cama de casal e um com duas camas de solteiro. Roupa de cama e toalhas incluídas.' } },
      { t: { es: 'La cocina', en: 'The kitchen', pt: 'A cozinha' }, p: { es: 'Cocina completa con horno, heladera, microondas, pava eléctrica y tostadora.', en: 'Full kitchen with oven, fridge, microwave, electric kettle and toaster.', pt: 'Cozinha completa com forno, geladeira, micro-ondas, chaleira elétrica e torradeira.' } }
    ],
    amenities: { indoor: ['wifi', 'ac', 'heating', 'kitchen', 'tv', 'linens'], outdoor: [], extras: ['concierge', 'transfer', 'tours'] },
    location: { text: { es: 'En el microcentro, a metros de Av. San Martín: cafés con mesas en la vereda, comercios y la peatonal Sarmiento a pocas cuadras.', en: 'In the city centre, steps from Av. San Martín: sidewalk cafés, shops and Sarmiento pedestrian street a few blocks away.', pt: 'No centro, a metros da Av. San Martín: cafés com mesas na calçada, lojas e o calçadão Sarmiento a poucas quadras.' }, map: 'Amigorena 14, Ciudad de Mendoza, Mendoza, Argentina', times: [['sanmartin', 1], ['peatonal', 5], ['plaza', 8], ['aristides', 20], ['airport', 20], ['lujan', 30]] }
  },
  'espana-1091': {
    beds: 3,
    gallery: rgmGal('espana-1091', 10),
    title: { es: 'Un balcón entre árboles, <em>junto a la peatonal.</em>', en: 'A leafy balcony, <em>next to the pedestrian street.</em>', pt: 'Uma varanda entre árvores, <em>junto ao calçadão.</em>' },
    intro: { es: 'Sobre calle España, a metros de la peatonal Sarmiento. Living-comedor con salida a un balcón entre los árboles, dos dormitorios y cocina completa: el centro de Mendoza a la puerta.', en: 'On España street, steps from Sarmiento pedestrian street. A living-dining room opening onto a balcony among the trees, two bedrooms and a full kitchen: downtown Mendoza on your doorstep.', pt: 'Na rua España, a metros do calçadão Sarmiento. Sala de estar e jantar com saída para uma varanda entre as árvores, dois quartos e cozinha completa: o centro de Mendoza na porta.' },
    overview: [
      { t: { es: 'El living y el balcón', en: 'Living room and balcony', pt: 'Sala e varanda' }, p: { es: 'Mesa para seis, sillón, TV y rincón de trabajo. El ventanal se abre a un balcón con mesa y sillas bajo los árboles de la calle.', en: 'A table for six, a sofa, a TV and a work corner. The glass door opens onto a balcony with a table and chairs under the street trees.', pt: 'Mesa para seis, sofá, TV e canto de trabalho. A porta de vidro abre para uma varanda com mesa e cadeiras sob as árvores da rua.' } },
      { t: { es: 'Los dormitorios', en: 'The bedrooms', pt: 'Os quartos' }, p: { es: 'Un dormitorio con cama matrimonial y otro con cama individual y cama carrito, ambos con ventilador de techo.', en: 'One bedroom with a double bed and another with a single bed and a trundle bed, both with ceiling fans.', pt: 'Um quarto com cama de casal e outro com cama de solteiro e bicama, ambos com ventilador de teto.' } },
      { t: { es: 'La cocina', en: 'The kitchen', pt: 'A cozinha' }, p: { es: 'Cocina completa con horno, anafe, heladera, microondas y pava eléctrica.', en: 'Full kitchen with oven, cooktop, fridge, microwave and electric kettle.', pt: 'Cozinha completa com forno, cooktop, geladeira, micro-ondas e chaleira elétrica.' } }
    ],
    amenities: { indoor: ['wifi', 'ac', 'fan', 'kitchen', 'tv', 'desk', 'linens'], outdoor: ['balcony'], extras: ['concierge', 'transfer', 'tours'] },
    location: { text: { es: 'En el corazón del centro, junto a la peatonal Sarmiento y a tres cuadras de Plaza Independencia: restaurantes, cafés y comercios a pie.', en: 'In the heart of downtown, next to Sarmiento pedestrian street and three blocks from Plaza Independencia: restaurants, cafés and shops on foot.', pt: 'No coração do centro, junto ao calçadão Sarmiento e a três quadras da Plaza Independencia: restaurantes, cafés e lojas a pé.' }, map: 'España 1091, Ciudad de Mendoza, Mendoza, Argentina', times: [['peatonal', 1], ['plaza', 5], ['aristides', 15], ['park', 10], ['airport', 20], ['lujan', 30]] }
  },
  'espana-1057': {
    beds: 2,
    gallery: rgmGal('espana-1057', 12),
    title: { es: 'Luminoso, cálido <em>y a pasos de todo.</em>', en: 'Bright, warm <em>and steps from everything.</em>', pt: 'Iluminado, acolhedor <em>e a passos de tudo.</em>' },
    intro: { es: 'Un departamento de dos dormitorios sobre calle España, a metros de la peatonal Sarmiento. Living con sillón y piso de parquet, comedor para cuatro con salida a un balcón, cocina completa, baño con bañera y toilette.', en: 'A two-bedroom apartment on España street, steps from Sarmiento pedestrian street. A living room with sofa and parquet floors, dining for four opening onto a balcony, a full kitchen, a bathroom with tub and a guest toilet.', pt: 'Um apartamento de dois quartos na rua España, a metros do calçadão Sarmiento. Sala com sofá e piso de parquet, mesa para quatro com saída para uma varanda, cozinha completa, banheiro com banheira e lavabo.' },
    overview: [
      { t: { es: 'Living y comedor', en: 'Living and dining', pt: 'Sala de estar e jantar' }, p: { es: 'Sillón amplio, TV, mesa para cuatro y aparador. El ventanal del comedor da a un balcón y tiene aire acondicionado y calefactor.', en: 'A large sofa, a TV, a table for four and a sideboard. The dining room window opens onto a balcony, with air conditioning and a gas heater.', pt: 'Sofá amplo, TV, mesa para quatro e aparador. A janela da sala de jantar dá para uma varanda, com ar-condicionado e aquecedor.' } },
      { t: { es: 'Los dormitorios', en: 'The bedrooms', pt: 'Os quartos' }, p: { es: 'Dormitorio principal con cama matrimonial, aire acondicionado, TV y placard. Un segundo dormitorio con cama individual y escritorio, ideal para trabajar.', en: 'Main bedroom with a double bed, air conditioning, TV and wardrobe. A second bedroom with a single bed and a desk, perfect for working.', pt: 'Quarto principal com cama de casal, ar-condicionado, TV e armário. Um segundo quarto com cama de solteiro e escrivaninha, ideal para trabalhar.' } },
      { t: { es: 'Cocina y baños', en: 'Kitchen and bathrooms', pt: 'Cozinha e banheiros' }, p: { es: 'Cocina completa con horno, anafe, campana, heladera, microondas y pava eléctrica. Baño con bañera y un toilette aparte.', en: 'Full kitchen with oven, cooktop, extractor hood, fridge, microwave and electric kettle. A bathroom with tub plus a separate guest toilet.', pt: 'Cozinha completa com forno, cooktop, coifa, geladeira, micro-ondas e chaleira elétrica. Banheiro com banheira e lavabo separado.' } }
    ],
    amenities: { indoor: ['wifi', 'ac', 'heating', 'kitchen', 'tv', 'desk', 'linens'], outdoor: ['balcony'], extras: ['concierge', 'transfer', 'tours'] },
    location: { text: { es: 'Sobre calle España, en pleno centro: la peatonal Sarmiento a metros y Plaza Independencia a pocas cuadras, con cafés, restaurantes y comercios a pie.', en: 'On España street, right downtown: Sarmiento pedestrian street steps away and Plaza Independencia a few blocks off, with cafés, restaurants and shops on foot.', pt: 'Na rua España, no centro: o calçadão Sarmiento a metros e a Plaza Independencia a poucas quadras, com cafés, restaurantes e lojas a pé.' }, map: 'España 1057, Ciudad de Mendoza, Mendoza, Argentina', times: [['peatonal', 1], ['plaza', 5], ['park', 10], ['aristides', 15], ['airport', 20], ['lujan', 30]] }
  },
  'belgrano-487': {
    beds: 2,
    gallery: rgmGal('belgrano-487', 14),
    title: { es: 'Luz de mañana <em>y el Parque cerca.</em>', en: 'Morning light <em>and the Park nearby.</em>', pt: 'Luz da manhã <em>e o Parque perto.</em>' },
    intro: { es: 'Un departamento luminoso sobre calle Belgrano, con ventanales, cocina completa y comedor. Cerca de la Calle Arístides Villanueva y del Parque General San Martín.', en: 'A bright apartment on Belgrano street, with large windows, a full kitchen and a dining area. Close to Arístides Villanueva and General San Martín Park.', pt: 'Um apartamento iluminado na rua Belgrano, com janelas amplas, cozinha completa e sala de jantar. Perto da Arístides Villanueva e do Parque General San Martín.' },
    overview: [
      { t: { es: 'El espacio', en: 'The space', pt: 'O espaço' }, p: { es: 'Ambientes claros con ventanales, comedor para cuatro, TV y aire acondicionado.', en: 'Light-filled rooms with big windows, dining for four, a TV and air conditioning.', pt: 'Ambientes claros com janelas amplas, mesa para quatro, TV e ar-condicionado.' } },
      { t: { es: 'Para dormir', en: 'Sleeping', pt: 'Para dormir' }, p: { es: 'Camas matrimoniales con ropa de cama y toallas incluidas; hasta cuatro huéspedes.', en: 'Double beds with linen and towels included; up to four guests.', pt: 'Camas de casal com roupa de cama e toalhas incluídas; até quatro hóspedes.' } },
      { t: { es: 'La cocina', en: 'The kitchen', pt: 'A cozinha' }, p: { es: 'Cocina completa con horno, anafe, heladera y microondas.', en: 'Full kitchen with oven, cooktop, fridge and microwave.', pt: 'Cozinha completa com forno, cooktop, geladeira e micro-ondas.' } }
    ],
    amenities: { indoor: ['wifi', 'ac', 'kitchen', 'tv', 'linens'], outdoor: [], extras: ['concierge', 'transfer', 'tours'] },
    location: { text: { es: 'Sobre calle Belgrano, entre el centro y el Parque: la Calle Arístides Villanueva, con sus bares y restaurantes, queda a unas cuadras.', en: 'On Belgrano street, between downtown and the Park: Arístides Villanueva, with its bars and restaurants, is a few blocks away.', pt: 'Na rua Belgrano, entre o centro e o Parque: a Arístides Villanueva, com seus bares e restaurantes, fica a poucas quadras.' }, map: 'Belgrano 487, Ciudad de Mendoza, Mendoza, Argentina', times: [['aristides', 10], ['park', 6], ['plaza', 12], ['airport', 20], ['lujan', 30]] }
  },
  'mitre-660': {
    beds: 1,
    gallery: rgmGal('mitre-660', 11),
    title: { es: 'Un monoambiente <em>pensado para dos.</em>', en: 'A studio <em>made for two.</em>', pt: 'Um estúdio <em>pensado para dois.</em>' },
    intro: { es: 'Un monoambiente práctico y luminoso sobre Av. Mitre, con cama matrimonial, kitchenette, escritorio y una vista abierta a la ciudad. Ideal para parejas o viajes de trabajo.', en: 'A bright, practical studio on Av. Mitre, with a double bed, kitchenette, desk and an open view over the city. Perfect for couples or work trips.', pt: 'Um estúdio prático e iluminado na Av. Mitre, com cama de casal, cozinha americana, escrivaninha e vista aberta da cidade. Ideal para casais ou viagens de trabalho.' },
    overview: [
      { t: { es: 'El espacio', en: 'The space', pt: 'O espaço' }, p: { es: 'Cama matrimonial, mesa para dos, escritorio, TV y aire acondicionado, todo en un ambiente luminoso.', en: 'A double bed, a table for two, a desk, a TV and air conditioning, all in one bright room.', pt: 'Cama de casal, mesa para dois, escrivaninha, TV e ar-condicionado, tudo num ambiente iluminado.' } },
      { t: { es: 'La cocina', en: 'The kitchen', pt: 'A cozinha' }, p: { es: 'Kitchenette con anafe, microondas y heladera, suficiente para desayunos y comidas simples.', en: 'Kitchenette with cooktop, microwave and fridge, enough for breakfasts and simple meals.', pt: 'Cozinha americana com cooktop, micro-ondas e geladeira, suficiente para cafés da manhã e refeições simples.' } }
    ],
    amenities: { indoor: ['wifi', 'ac', 'heating', 'kitchen', 'tv', 'desk', 'linens'], outdoor: ['cityview'], extras: ['concierge', 'transfer', 'tours'] },
    location: { text: { es: 'Sobre Av. Mitre, en el centro: Plaza Independencia a pocas cuadras y la Calle Arístides Villanueva a un paseo.', en: 'On Av. Mitre, downtown: Plaza Independencia a few blocks away and Arístides Villanueva within a short walk.', pt: 'Na Av. Mitre, no centro: a Plaza Independencia a poucas quadras e a Arístides Villanueva a uma caminhada.' }, map: 'Av. Bartolomé Mitre 660, Ciudad de Mendoza, Mendoza, Argentina', times: [['plaza', 7], ['peatonal', 8], ['aristides', 15], ['park', 8], ['airport', 20], ['lujan', 30]] }
  },
  'espana-1485': {
    beds: 2,
    gallery: rgmGal('espana-1485', 7),
    title: { es: 'Luz, parquet <em>y la ciudad a pie.</em>', en: 'Light, parquet <em>and the city on foot.</em>', pt: 'Luz, parquet <em>e a cidade a pé.</em>' },
    intro: { es: 'Un departamento luminoso sobre Av. España, con piso de parquet, living-comedor amplio, un dormitorio y cocina completa. Afuera, una avenida arbolada con cafés y comercios.', en: 'A bright apartment on Av. España, with parquet floors, a roomy living-dining area, one bedroom and a full kitchen. Outside, a tree-lined avenue with cafés and shops.', pt: 'Um apartamento iluminado na Av. España, com piso de parquet, sala de estar e jantar ampla, um quarto e cozinha completa. Lá fora, uma avenida arborizada com cafés e lojas.' },
    overview: [
      { t: { es: 'El living', en: 'The living room', pt: 'A sala' }, p: { es: 'Ambiente amplio con ventanal, mesa para cuatro, TV y aire acondicionado. Suma una cama matrimonial para dos huéspedes más.', en: 'A spacious room with a large window, a table for four, a TV and air conditioning. It also has a double bed for two more guests.', pt: 'Ambiente amplo com janelão, mesa para quatro, TV e ar-condicionado. Tem também uma cama de casal para mais dois hóspedes.' } },
      { t: { es: 'El dormitorio', en: 'The bedroom', pt: 'O quarto' }, p: { es: 'Cama matrimonial, placard amplio y ventana a la calle. Ropa de cama y toallas incluidas.', en: 'A double bed, a large wardrobe and a street-facing window. Bed linen and towels included.', pt: 'Cama de casal, armário amplo e janela para a rua. Roupa de cama e toalhas incluídas.' } },
      { t: { es: 'La cocina', en: 'The kitchen', pt: 'A cozinha' }, p: { es: 'Cocina separada con horno, anafe, heladera y microondas.', en: 'Separate kitchen with oven, cooktop, fridge and microwave.', pt: 'Cozinha separada com forno, cooktop, geladeira e micro-ondas.' } }
    ],
    amenities: { indoor: ['wifi', 'ac', 'kitchen', 'tv', 'linens'], outdoor: ['elevator'], extras: ['concierge', 'transfer', 'tours'] },
    location: { text: { es: 'Sobre Av. España, una avenida arbolada del centro de Mendoza con cafés y comercios, a unos minutos a pie de Plaza Independencia y la peatonal Sarmiento.', en: 'On Av. España, a tree-lined avenue in downtown Mendoza with cafés and shops, a few minutes’ walk from Plaza Independencia and Sarmiento pedestrian street.', pt: 'Na Av. España, uma avenida arborizada do centro de Mendoza com cafés e lojas, a poucos minutos a pé da Plaza Independencia e do calçadão Sarmiento.' }, map: 'Av. España 1485, Ciudad de Mendoza, Mendoza, Argentina', times: [['plaza', 10], ['peatonal', 8], ['aristides', 20], ['airport', 18], ['lujan', 35]] }
  }
};
