/* RGM Experiences — ficha de cada experiencia (/experiencias/<slug>/).
 * Una entrada por `slug` de RGM_EXPERIENCES (js/data.js). Textos en { es, en, pt }.
 * - gallery: fotos (la primera es la grande).
 * - facts: datos rápidos de la cabecera.
 * - itinerary: pasos del día (hora opcional).
 * - includes / excludes: qué incluye y qué no.
 * - info: datos útiles (punto de encuentro, qué llevar, temporada…).
 * Los contenidos son de EJEMPLO: ajustalos a lo que realmente ofrece RGM. */

window.RGM_EXP_DETAILS = {
  'ruta-del-malbec': {
    gallery: ['img/exp-tasting.jpg', 'img/g1.jpg', 'img/g4.jpg', 'img/exp-cellar.jpg', 'img/g6.jpg'],
    facts: { group: { es: 'Privado o compartido', en: 'Private or shared', pt: 'Privado ou compartilhado' }, transfer: true, langs: 'ES · EN · PT' },
    title: { es: 'Tres bodegas, <em>un almuerzo largo.</em>', en: 'Three wineries, <em>one long lunch.</em>', pt: 'Três vinícolas, <em>um almoço longo.</em>' },
    intro: { es: 'Luján de Cuyo es la cuna del Malbec. En un día recorrés tres bodegas de estilos distintos —una familiar, una histórica y una de autor— con degustaciones guiadas y un almuerzo de pasos entre viñedos.', en: 'Luján de Cuyo is the cradle of Malbec. In one day you visit three wineries of different styles — a family estate, a historic house and a boutique winery — with guided tastings and a multi-course lunch among the vines.', pt: 'Luján de Cuyo é o berço do Malbec. Em um dia você visita três vinícolas de estilos diferentes — uma familiar, uma histórica e uma de autor — com degustações guiadas e almoço harmonizado entre vinhedos.' },
    itinerary: [
      { h: '09:30', t: { es: 'Te buscamos', en: 'Pick-up', pt: 'Buscamos você' }, p: { es: 'Traslado privado desde tu departamento hacia Luján de Cuyo.', en: 'Private transfer from your apartment to Luján de Cuyo.', pt: 'Traslado privado do seu apartamento até Luján de Cuyo.' } },
      { h: '10:15', t: { es: 'Primera bodega', en: 'First winery', pt: 'Primeira vinícola' }, p: { es: 'Recorrido por viñedo y sala de barricas, y degustación de tres vinos.', en: 'Vineyard and barrel-room tour, and a three-wine tasting.', pt: 'Passeio pelo vinhedo e sala de barricas, e degustação de três vinhos.' } },
      { h: '12:00', t: { es: 'Segunda bodega', en: 'Second winery', pt: 'Segunda vinícola' }, p: { es: 'Una casa histórica: cava subterránea y Malbec de viñas viejas.', en: 'A historic house: underground cellar and old-vine Malbec.', pt: 'Uma casa histórica: cave subterrânea e Malbec de vinhas velhas.' } },
      { h: '13:30', t: { es: 'Almuerzo de pasos', en: 'Multi-course lunch', pt: 'Almoço harmonizado' }, p: { es: 'Menú de temporada maridado, con vista a la cordillera.', en: 'Seasonal paired menu facing the Andes.', pt: 'Menu da estação harmonizado, com vista para a cordilheira.' } },
      { h: '16:30', t: { es: 'Tercera bodega y regreso', en: 'Third winery and return', pt: 'Terceira vinícola e retorno' }, p: { es: 'Degustación final y vuelta al departamento cerca de las 18 h.', en: 'Final tasting and back at your apartment around 6 pm.', pt: 'Degustação final e volta ao apartamento por volta das 18h.' } }
    ],
    includes: { es: ['Traslado privado ida y vuelta', 'Visitas y degustaciones en 3 bodegas', 'Almuerzo de pasos maridado', 'Coordinación de reservas'], en: ['Private round-trip transfer', 'Visits and tastings at 3 wineries', 'Multi-course paired lunch', 'Booking coordination'], pt: ['Traslado privado ida e volta', 'Visitas e degustações em 3 vinícolas', 'Almoço harmonizado', 'Coordenação das reservas'] },
    excludes: { es: ['Compras de vinos', 'Propinas'], en: ['Wine purchases', 'Tips'], pt: ['Compras de vinhos', 'Gorjetas'] },
    info: [
      { t: { es: 'Punto de encuentro', en: 'Meeting point', pt: 'Ponto de encontro' }, p: { es: 'Te buscamos en tu departamento o alojamiento.', en: 'We pick you up at your apartment or hotel.', pt: 'Buscamos você no apartamento ou hotel.' } },
      { t: { es: 'Qué llevar', en: 'What to bring', pt: 'O que levar' }, p: { es: 'Calzado cómodo, protector solar y un abrigo liviano para las cavas.', en: 'Comfortable shoes, sunscreen and a light jacket for the cellars.', pt: 'Calçado confortável, protetor solar e um casaco leve para as caves.' } },
      { t: { es: 'Temporada', en: 'Season', pt: 'Temporada' }, p: { es: 'Todo el año. En vendimia (febrero–abril) conviene reservar con anticipación.', en: 'All year. During harvest (February–April) book in advance.', pt: 'O ano todo. Na vindima (fevereiro–abril) reserve com antecedência.' } }
    ]
  },
  'valle-de-uco': {
    gallery: ['img/exp-andes.jpg', 'img/g4.jpg', 'img/g6.jpg', 'img/g1.jpg', 'img/exp-tasting.jpg'],
    facts: { group: { es: 'Privado o compartido', en: 'Private or shared', pt: 'Privado ou compartilhado' }, transfer: true, langs: 'ES · EN · PT' },
    title: { es: 'Viñedos de altura <em>al pie de los Andes.</em>', en: 'High-altitude vineyards <em>at the foot of the Andes.</em>', pt: 'Vinhedos de altitude <em>ao pé dos Andes.</em>' },
    intro: { es: 'A una hora y media de la ciudad, el Valle de Uco reúne algunas de las bodegas más impactantes del país, con viñedos a más de mil metros y la cordillera como telón de fondo.', en: 'An hour and a half from the city, the Uco Valley gathers some of the country\'s most striking wineries, with vineyards above a thousand metres and the Andes as a backdrop.', pt: 'A uma hora e meia da cidade, o Vale de Uco reúne algumas das vinícolas mais impressionantes do país, com vinhedos acima de mil metros e a cordilheira ao fundo.' },
    itinerary: [
      { h: '08:30', t: { es: 'Salida', en: 'Departure', pt: 'Saída' }, p: { es: 'Traslado privado por la ruta 40 hacia Tupungato.', en: 'Private transfer along Route 40 to Tupungato.', pt: 'Traslado privado pela rota 40 até Tupungato.' } },
      { h: '10:00', t: { es: 'Primera bodega', en: 'First winery', pt: 'Primeira vinícola' }, p: { es: 'Recorrido y degustación en una bodega de arquitectura contemporánea.', en: 'Tour and tasting at a contemporary-architecture winery.', pt: 'Passeio e degustação numa vinícola de arquitetura contemporânea.' } },
      { h: '13:00', t: { es: 'Almuerzo', en: 'Lunch', pt: 'Almoço' }, p: { es: 'Almuerzo en bodega frente a los viñedos y la cordillera.', en: 'Lunch at a winery facing vineyards and mountains.', pt: 'Almoço na vinícola de frente para os vinhedos e a cordilheira.' } },
      { h: '16:00', t: { es: 'Segunda bodega y regreso', en: 'Second winery and return', pt: 'Segunda vinícola e retorno' }, p: { es: 'Última degustación y vuelta a Mendoza al atardecer.', en: 'Final tasting and back to Mendoza at sunset.', pt: 'Última degustação e volta a Mendoza ao entardecer.' } }
    ],
    includes: { es: ['Traslado privado ida y vuelta', 'Visitas y degustaciones en 2 bodegas', 'Almuerzo en bodega', 'Coordinación de reservas'], en: ['Private round-trip transfer', 'Visits and tastings at 2 wineries', 'Winery lunch', 'Booking coordination'], pt: ['Traslado privado ida e volta', 'Visitas e degustações em 2 vinícolas', 'Almoço na vinícola', 'Coordenação das reservas'] },
    excludes: { es: ['Compras de vinos', 'Propinas'], en: ['Wine purchases', 'Tips'], pt: ['Compras de vinhos', 'Gorjetas'] },
    info: [
      { t: { es: 'Punto de encuentro', en: 'Meeting point', pt: 'Ponto de encontro' }, p: { es: 'Te buscamos en tu departamento o alojamiento.', en: 'We pick you up at your apartment or hotel.', pt: 'Buscamos você no apartamento ou hotel.' } },
      { t: { es: 'Qué llevar', en: 'What to bring', pt: 'O que levar' }, p: { es: 'Abrigo: en el valle refresca rápido cuando baja el sol.', en: 'A warm layer: the valley cools quickly after sunset.', pt: 'Agasalho: no vale esfria rápido quando o sol se põe.' } },
      { t: { es: 'Temporada', en: 'Season', pt: 'Temporada' }, p: { es: 'Todo el año. Otoño es ideal por los colores de los viñedos.', en: 'All year. Autumn is ideal for the vineyard colours.', pt: 'O ano todo. O outono é ideal pelas cores dos vinhedos.' } }
    ]
  },
  'alta-montana': {
    gallery: ['img/exp-snow.jpg', 'img/exp-river.jpg', 'img/g7.jpg', 'img/g3.jpg', 'img/g4.jpg'],
    facts: { group: { es: 'Privado o compartido', en: 'Private or shared', pt: 'Privado ou compartilhado' }, transfer: true, langs: 'ES · EN · PT' },
    title: { es: 'Hasta el pie <em>del Aconcagua.</em>', en: 'To the foot <em>of Aconcagua.</em>', pt: 'Até o pé <em>do Aconcágua.</em>' },
    intro: { es: 'Un día por la ruta 7 hacia la frontera con Chile: el dique Potrerillos, el valle de Uspallata, Puente del Inca y el mirador del Aconcagua, la montaña más alta de América.', en: 'A day along Route 7 towards the Chilean border: Potrerillos dam, the Uspallata valley, Puente del Inca and the Aconcagua lookout — the highest mountain in the Americas.', pt: 'Um dia pela rota 7 rumo à fronteira com o Chile: a represa de Potrerillos, o vale de Uspallata, a Puente del Inca e o mirante do Aconcágua, a montanha mais alta das Américas.' },
    itinerary: [
      { h: '08:00', t: { es: 'Salida', en: 'Departure', pt: 'Saída' }, p: { es: 'Traslado desde tu departamento hacia la precordillera.', en: 'Transfer from your apartment into the foothills.', pt: 'Traslado do seu apartamento até a pré-cordilheira.' } },
      { h: '09:00', t: { es: 'Dique Potrerillos', en: 'Potrerillos dam', pt: 'Represa de Potrerillos' }, p: { es: 'Parada fotográfica frente al lago y el Cordón del Plata.', en: 'Photo stop by the lake and the Cordón del Plata.', pt: 'Parada para fotos diante do lago e do Cordón del Plata.' } },
      { h: '10:30', t: { es: 'Uspallata', en: 'Uspallata', pt: 'Uspallata' }, p: { es: 'Recorrido por el valle y sus cerros de colores.', en: 'Drive through the valley and its coloured hills.', pt: 'Passeio pelo vale e seus morros coloridos.' } },
      { h: '13:00', t: { es: 'Puente del Inca y Aconcagua', en: 'Puente del Inca & Aconcagua', pt: 'Puente del Inca e Aconcágua' }, p: { es: 'El puente natural y el mirador de Horcones frente a la cara sur.', en: 'The natural bridge and the Horcones lookout facing the south face.', pt: 'A ponte natural e o mirante de Horcones diante da face sul.' } },
      { h: '18:30', t: { es: 'Regreso', en: 'Return', pt: 'Retorno' }, p: { es: 'Vuelta a Mendoza con parada para merendar.', en: 'Back to Mendoza with a stop for afternoon tea.', pt: 'Volta a Mendoza com parada para o lanche.' } }
    ],
    includes: { es: ['Traslado ida y vuelta', 'Guía durante el recorrido', 'Paradas fotográficas'], en: ['Round-trip transfer', 'Guide throughout the route', 'Photo stops'], pt: ['Traslado ida e volta', 'Guia durante o percurso', 'Paradas para fotos'] },
    excludes: { es: ['Comidas', 'Entrada al Parque Provincial Aconcagua'], en: ['Meals', 'Aconcagua Provincial Park entrance'], pt: ['Refeições', 'Entrada no Parque Provincial Aconcágua'] },
    info: [
      { t: { es: 'Qué llevar', en: 'What to bring', pt: 'O que levar' }, p: { es: 'Abrigo en capas, lentes de sol y protector: arriba hace frío y el sol es fuerte.', en: 'Layers, sunglasses and sunscreen: it is cold up high and the sun is strong.', pt: 'Roupas em camadas, óculos de sol e protetor: lá em cima faz frio e o sol é forte.' } },
      { t: { es: 'Documentos', en: 'Documents', pt: 'Documentos' }, p: { es: 'Llevá tu documento: la ruta pasa por controles cerca de la frontera.', en: 'Bring your ID: the route passes checkpoints near the border.', pt: 'Leve seu documento: a rota passa por controles perto da fronteira.' } },
      { t: { es: 'Temporada', en: 'Season', pt: 'Temporada' }, p: { es: 'Todo el año; en invierno puede suspenderse por nieve en la ruta.', en: 'All year; in winter it may be suspended due to snow on the road.', pt: 'O ano todo; no inverno pode ser suspenso por neve na estrada.' } }
    ]
  },
  'cabalgata-al-atardecer': {
    gallery: ['img/exp-horse.jpg', 'img/g5.jpg', 'img/g6.jpg', 'img/g7.jpg', 'img/g3.jpg'],
    facts: { group: { es: 'Grupos reducidos', en: 'Small groups', pt: 'Grupos reduzidos' }, transfer: true, langs: 'ES · EN' },
    title: { es: 'A caballo <em>hasta que cae el sol.</em>', en: 'On horseback <em>until the sun goes down.</em>', pt: 'A cavalo <em>até o sol se pôr.</em>' },
    intro: { es: 'Una cabalgata tranquila por la precordillera mendocina, apta para quienes nunca montaron, que termina con un asado criollo mientras oscurece sobre la ciudad.', en: 'A gentle ride through the Mendoza foothills, suitable for first-time riders, ending with a traditional asado as night falls over the city.', pt: 'Uma cavalgada tranquila pela pré-cordilheira mendocina, apta para quem nunca montou, que termina com um churrasco crioulo enquanto escurece sobre a cidade.' },
    itinerary: [
      { h: '16:00', t: { es: 'Te buscamos', en: 'Pick-up', pt: 'Buscamos você' }, p: { es: 'Traslado hasta el puesto en el pie de monte.', en: 'Transfer to the ranch in the foothills.', pt: 'Traslado até o rancho no pé da montanha.' } },
      { h: '17:00', t: { es: 'Cabalgata', en: 'The ride', pt: 'A cavalgada' }, p: { es: 'Dos horas entre jarillas y quebradas con guías baqueanos.', en: 'Two hours among shrubs and ravines with local guides.', pt: 'Duas horas entre arbustos e ravinas com guias locais.' } },
      { h: '19:30', t: { es: 'Asado criollo', en: 'Traditional asado', pt: 'Churrasco crioulo' }, p: { es: 'Asado, empanadas y vino al aire libre.', en: 'Asado, empanadas and wine outdoors.', pt: 'Churrasco, empanadas e vinho ao ar livre.' } },
      { h: '22:00', t: { es: 'Regreso', en: 'Return', pt: 'Retorno' }, p: { es: 'Vuelta a tu departamento.', en: 'Back to your apartment.', pt: 'Volta ao seu apartamento.' } }
    ],
    includes: { es: ['Traslado ida y vuelta', 'Cabalgata guiada', 'Asado con bebidas'], en: ['Round-trip transfer', 'Guided ride', 'Asado with drinks'], pt: ['Traslado ida e volta', 'Cavalgada guiada', 'Churrasco com bebidas'] },
    excludes: { es: ['Propinas'], en: ['Tips'], pt: ['Gorjetas'] },
    info: [
      { t: { es: 'Nivel', en: 'Level', pt: 'Nível' }, p: { es: 'Apta para principiantes. Edad mínima sugerida: 8 años.', en: 'Suitable for beginners. Suggested minimum age: 8.', pt: 'Apta para iniciantes. Idade mínima sugerida: 8 anos.' } },
      { t: { es: 'Qué llevar', en: 'What to bring', pt: 'O que levar' }, p: { es: 'Pantalón largo, calzado cerrado y abrigo para la noche.', en: 'Long trousers, closed shoes and a jacket for the evening.', pt: 'Calça comprida, calçado fechado e agasalho para a noite.' } }
    ]
  },
  'bodegas-en-bici': {
    gallery: ['img/exp-vineglass.jpg', 'img/g2.jpg', 'img/g1.jpg', 'img/g6.jpg', 'img/exp-cellar.jpg'],
    facts: { group: { es: 'Libre, a tu ritmo', en: 'Self-guided', pt: 'Livre, no seu ritmo' }, transfer: true, langs: 'ES · EN · PT' },
    title: { es: 'Maipú <em>en dos ruedas.</em>', en: 'Maipú <em>on two wheels.</em>', pt: 'Maipú <em>sobre duas rodas.</em>' },
    intro: { es: 'Caminos planos entre olivares y viñedos, bodegas familiares, una fábrica de aceite de oliva y chocolates artesanales. Pedaleás a tu ritmo con un mapa y nuestras recomendaciones.', en: 'Flat roads between olive groves and vineyards, family wineries, an olive-oil mill and artisan chocolates. Ride at your own pace with a map and our tips.', pt: 'Caminhos planos entre olivais e vinhedos, vinícolas familiares, uma fábrica de azeite e chocolates artesanais. Pedale no seu ritmo com um mapa e nossas dicas.' },
    itinerary: [
      { h: '10:00', t: { es: 'Traslado a Maipú', en: 'Transfer to Maipú', pt: 'Traslado a Maipú' }, p: { es: 'Te dejamos en el punto de alquiler de bicis.', en: 'We drop you at the bike rental point.', pt: 'Deixamos você no ponto de aluguel das bikes.' } },
      { h: '10:30', t: { es: 'Recorrido libre', en: 'Free ride', pt: 'Passeio livre' }, p: { es: 'Dos o tres bodegas familiares, olivícola y degustaciones.', en: 'Two or three family wineries, an olive mill and tastings.', pt: 'Duas ou três vinícolas familiares, olivícola e degustações.' } },
      { h: '16:30', t: { es: 'Regreso', en: 'Return', pt: 'Retorno' }, p: { es: 'Te buscamos y volvés al departamento.', en: 'We pick you up and take you back.', pt: 'Buscamos você e voltamos ao apartamento.' } }
    ],
    includes: { es: ['Traslado ida y vuelta', 'Alquiler de bicicleta', 'Mapa y recomendaciones'], en: ['Round-trip transfer', 'Bike rental', 'Map and recommendations'], pt: ['Traslado ida e volta', 'Aluguel de bicicleta', 'Mapa e recomendações'] },
    excludes: { es: ['Degustaciones y almuerzo (se pagan en cada lugar)'], en: ['Tastings and lunch (paid on site)'], pt: ['Degustações e almoço (pagos em cada lugar)'] },
    info: [
      { t: { es: 'Nivel', en: 'Level', pt: 'Nível' }, p: { es: 'Fácil: caminos planos, unos 12 km en total.', en: 'Easy: flat roads, about 12 km in total.', pt: 'Fácil: caminhos planos, cerca de 12 km no total.' } },
      { t: { es: 'Qué llevar', en: 'What to bring', pt: 'O que levar' }, p: { es: 'Gorra, agua y protector solar.', en: 'Cap, water and sunscreen.', pt: 'Boné, água e protetor solar.' } }
    ]
  },
  'mendoza-esencial': {
    gallery: ['img/exp-cellar.jpg', 'img/exp-tasting.jpg', 'img/exp-snow.jpg', 'img/g2.jpg', 'img/g6.jpg'],
    facts: { group: { es: 'Privado', en: 'Private', pt: 'Privado' }, transfer: true, langs: 'ES · EN · PT' },
    title: { es: 'Lo mejor de Mendoza <em>en cuatro días.</em>', en: 'The best of Mendoza <em>in four days.</em>', pt: 'O melhor de Mendoza <em>em quatro dias.</em>' },
    intro: { es: 'Un paquete armado para una primera visita: tres noches en uno de nuestros departamentos, la Ruta del Malbec, un día de Alta Montaña y traslados desde y hasta el aeropuerto.', en: 'A package designed for a first visit: three nights in one of our apartments, the Malbec Route, a High Andes day and airport transfers.', pt: 'Um pacote pensado para a primeira visita: três noites em um dos nossos apartamentos, a Rota do Malbec, um dia de Alta Montanha e traslados de e para o aeroporto.' },
    itinerary: [
      { h: { es: 'Día 1', en: 'Day 1', pt: 'Dia 1' }, t: { es: 'Llegada', en: 'Arrival', pt: 'Chegada' }, p: { es: 'Te buscamos en el aeropuerto y te llevamos al departamento. Tarde libre por el centro.', en: 'Airport pick-up and transfer to your apartment. Free afternoon downtown.', pt: 'Buscamos você no aeroporto e levamos ao apartamento. Tarde livre no centro.' } },
      { h: { es: 'Día 2', en: 'Day 2', pt: 'Dia 2' }, t: { es: 'Ruta del Malbec', en: 'Malbec Route', pt: 'Rota do Malbec' }, p: { es: 'Tres bodegas en Luján de Cuyo con almuerzo de pasos.', en: 'Three Luján de Cuyo wineries with a multi-course lunch.', pt: 'Três vinícolas em Luján de Cuyo com almoço harmonizado.' } },
      { h: { es: 'Día 3', en: 'Day 3', pt: 'Dia 3' }, t: { es: 'Alta Montaña', en: 'High Andes', pt: 'Alta Montanha' }, p: { es: 'Potrerillos, Uspallata, Puente del Inca y el Aconcagua.', en: 'Potrerillos, Uspallata, Puente del Inca and Aconcagua.', pt: 'Potrerillos, Uspallata, Puente del Inca e Aconcágua.' } },
      { h: { es: 'Día 4', en: 'Day 4', pt: 'Dia 4' }, t: { es: 'Regreso', en: 'Departure', pt: 'Retorno' }, p: { es: 'Mañana libre y traslado al aeropuerto.', en: 'Free morning and airport transfer.', pt: 'Manhã livre e traslado ao aeroporto.' } }
    ],
    includes: { es: ['3 noches de alojamiento', 'Ruta del Malbec con almuerzo', 'Excursión de Alta Montaña', 'Traslados aeropuerto ida y vuelta', 'Asistencia por WhatsApp'], en: ['3 nights of lodging', 'Malbec Route with lunch', 'High Andes excursion', 'Round-trip airport transfers', 'WhatsApp assistance'], pt: ['3 noites de hospedagem', 'Rota do Malbec com almoço', 'Excursão de Alta Montanha', 'Traslados do aeroporto ida e volta', 'Atendimento por WhatsApp'] },
    excludes: { es: ['Vuelos', 'Comidas no mencionadas'], en: ['Flights', 'Meals not listed'], pt: ['Voos', 'Refeições não mencionadas'] },
    info: [
      { t: { es: 'A medida', en: 'Tailor-made', pt: 'Sob medida' }, p: { es: 'Podemos sumar noches, cambiar excursiones o elegir el departamento que prefieras.', en: 'We can add nights, swap excursions or choose the apartment you prefer.', pt: 'Podemos somar noites, trocar passeios ou escolher o apartamento que preferir.' } }
    ]
  }
};
