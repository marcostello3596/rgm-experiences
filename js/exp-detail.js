/* RGM Experiences — ficha de cada experiencia (/experiencias/<slug>/).
 * Una entrada por `slug` de RGM_EXPERIENCES (js/data.js). Textos en { es, en, pt }.
 * - gallery: fotos (la primera es la grande).
 * - facts: datos rápidos de la cabecera.
 * - itinerary: pasos del día (hora opcional).
 * - includes / excludes: qué incluye y qué no.
 * - info: datos útiles (punto de encuentro, qué llevar, temporada…).
 * Revisá que lo que dice cada ficha (qué incluye, duración) coincida con lo que ofrece RGM. */

window.RGM_EXP_DETAILS = {
  'alta-montana': {
    gallery: ['img/exp-snow.jpg', 'img/exp-river.jpg', 'img/g7.jpg', 'img/g3.jpg', 'img/g4.jpg'],
    facts: { group: { es: 'Privado o compartido', en: 'Private or shared', pt: 'Privado ou compartilhado' }, transfer: true, langs: 'ES · EN · PT' },
    title: { es: 'Hasta el pie <em>del Aconcagua.</em>', en: 'To the foot <em>of Aconcagua.</em>', pt: 'Até o pé <em>do Aconcágua.</em>' },
    intro: { es: 'Un día por la ruta 7 hacia la frontera con Chile: el dique Potrerillos, el valle de Uspallata, Puente del Inca y el mirador del Aconcagua, la montaña más alta de América.', en: 'A day along Route 7 towards the Chilean border: Potrerillos dam, the Uspallata valley, Puente del Inca and the Aconcagua lookout — the highest mountain in the Americas.', pt: 'Um dia pela rota 7 rumo à fronteira com o Chile: a represa de Potrerillos, o vale de Uspallata, a Puente del Inca e o mirante do Aconcágua, a montanha mais alta das Américas.' },
    itinerary: [
      { h: '08:00', t: { es: 'Salida', en: 'Departure', pt: 'Saída' }, p: { es: 'Traslado desde tu alojamiento hacia la precordillera.', en: 'Transfer from your apartment into the foothills.', pt: 'Traslado do seu apartamento até a pré-cordilheira.' } },
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
  'potrerillos-cabalgata': {
    gallery: ['img/exp-horse.jpg', 'img/exp-river.jpg', 'img/g3.jpg', 'img/g7.jpg', 'img/g5.jpg'],
    facts: { group: { es: 'Grupos reducidos', en: 'Small groups', pt: 'Grupos reduzidos' }, transfer: true, langs: 'ES · EN' },
    title: { es: 'El dique, la montaña <em>y a caballo.</em>', en: 'The lake, the mountains <em>and on horseback.</em>', pt: 'A represa, a montanha <em>e a cavalo.</em>' },
    intro: { es: 'Un día en Potrerillos, a una hora de la ciudad: el dique con la cordillera de fondo y una cabalgata guiada por la precordillera, apta para quienes nunca montaron.', en: 'A day in Potrerillos, an hour from the city: the lake with the Andes behind it and a guided horseback ride through the foothills, suitable for first-timers.', pt: 'Um dia em Potrerillos, a uma hora da cidade: a represa com a cordilheira ao fundo e uma cavalgada guiada pela pré-cordilheira, para quem nunca montou.' },
    itinerary: [
      { h: '01', t: { es: 'Te buscamos', en: 'Pick-up', pt: 'Buscamos você' }, p: { es: 'Traslado desde tu alojamiento por la ruta 7 hacia la montaña.', en: 'Transfer from your lodging along route 7 into the mountains.', pt: 'Traslado da sua hospedagem pela rota 7 rumo à montanha.' } },
      { h: '02', t: { es: 'Dique Potrerillos', en: 'Potrerillos dam', pt: 'Represa de Potrerillos' }, p: { es: 'Paradas frente al lago y el Cordón del Plata.', en: 'Stops by the lake facing the Cordón del Plata range.', pt: 'Paradas em frente ao lago e ao Cordón del Plata.' } },
      { h: '03', t: { es: 'Cabalgata', en: 'Horseback ride', pt: 'Cavalgada' }, p: { es: 'Recorrido a caballo con guías baqueanos entre quebradas y cerros.', en: 'A ride with local guides through ravines and hills.', pt: 'Passeio a cavalo com guias locais entre ravinas e morros.' } },
      { h: '04', t: { es: 'Regreso', en: 'Return', pt: 'Retorno' }, p: { es: 'Vuelta a tu alojamiento por la tarde.', en: 'Back to your lodging in the afternoon.', pt: 'Volta à sua hospedagem à tarde.' } }
    ],
    includes: { es: ['Traslado ida y vuelta', 'Cabalgata guiada', 'Paradas en el dique'], en: ['Round-trip transfer', 'Guided horseback ride', 'Stops at the dam'], pt: ['Traslado ida e volta', 'Cavalgada guiada', 'Paradas na represa'] },
    excludes: { es: ['Comidas', 'Propinas'], en: ['Meals', 'Tips'], pt: ['Refeições', 'Gorjetas'] },
    info: [
      { t: { es: 'Nivel', en: 'Level', pt: 'Nível' }, p: { es: 'Apta para principiantes.', en: 'Suitable for beginners.', pt: 'Para iniciantes.' } },
      { t: { es: 'Qué llevar', en: 'What to bring', pt: 'O que levar' }, p: { es: 'Pantalón largo, calzado cerrado, gorra y protector solar.', en: 'Long trousers, closed shoes, a cap and sunscreen.', pt: 'Calça comprida, calçado fechado, boné e protetor solar.' } }
    ]
  },
  'termas-de-cacheuta': {
    gallery: ['img/exp-river.jpg', 'img/g7.jpg', 'img/g3.jpg', 'img/exp-snow.jpg', 'img/g4.jpg'],
    facts: { group: { es: 'Privado o compartido', en: 'Private or shared', pt: 'Privado ou compartilhado' }, transfer: true, langs: 'ES · EN · PT' },
    title: { es: 'Agua termal <em>entre montañas.</em>', en: 'Thermal water <em>among the mountains.</em>', pt: 'Água termal <em>entre montanhas.</em>' },
    intro: { es: 'A unos 40 km de la ciudad, en la quebrada del río Mendoza, las termas de Cacheuta tienen piletas de agua termal al aire libre rodeadas de montañas. Un día para relajarse.', en: 'About 40 km from the city, in the Mendoza river canyon, Cacheuta has open-air thermal pools surrounded by mountains. A day to unwind.', pt: 'A cerca de 40 km da cidade, no vale do rio Mendoza, as termas de Cacheuta têm piscinas termais ao ar livre cercadas de montanhas. Um dia para relaxar.' },
    itinerary: [
      { h: '01', t: { es: 'Te buscamos', en: 'Pick-up', pt: 'Buscamos você' }, p: { es: 'Traslado desde tu alojamiento hacia Cacheuta.', en: 'Transfer from your lodging to Cacheuta.', pt: 'Traslado da sua hospedagem até Cacheuta.' } },
      { h: '02', t: { es: 'Día en las termas', en: 'Day at the springs', pt: 'Dia nas termas' }, p: { es: 'Piletas termales al aire libre con vista a la montaña.', en: 'Open-air thermal pools with mountain views.', pt: 'Piscinas termais ao ar livre com vista para a montanha.' } },
      { h: '03', t: { es: 'Regreso', en: 'Return', pt: 'Retorno' }, p: { es: 'Vuelta a tu alojamiento al final de la tarde.', en: 'Back to your lodging in the late afternoon.', pt: 'Volta à sua hospedagem no fim da tarde.' } }
    ],
    includes: { es: ['Traslado ida y vuelta', 'Coordinación de la entrada'], en: ['Round-trip transfer', 'Entry coordination'], pt: ['Traslado ida e volta', 'Coordenação da entrada'] },
    excludes: { es: ['Comidas', 'Servicios adicionales del complejo'], en: ['Meals', 'Extra services at the complex'], pt: ['Refeições', 'Serviços adicionais do complexo'] },
    info: [
      { t: { es: 'Qué llevar', en: 'What to bring', pt: 'O que levar' }, p: { es: 'Malla, toalla, ojotas, gorra y protector solar.', en: 'Swimsuit, towel, flip-flops, a cap and sunscreen.', pt: 'Roupa de banho, toalha, chinelos, boné e protetor solar.' } },
      { t: { es: 'Temporada', en: 'Season', pt: 'Temporada' }, p: { es: 'Todo el año.', en: 'All year.', pt: 'O ano todo.' } }
    ]
  },
  'bodegas-maipu': {
    gallery: ['img/exp-vineglass.jpg', 'img/g1.jpg', 'img/exp-cellar.jpg', 'img/g2.jpg', 'img/g6.jpg'],
    facts: { group: { es: 'Privado o compartido', en: 'Private or shared', pt: 'Privado ou compartilhado' }, transfer: true, langs: 'ES · EN · PT' },
    title: { es: 'Bodegas y olivares <em>cerca de la ciudad.</em>', en: 'Wineries and olive groves <em>close to the city.</em>', pt: 'Vinícolas e olivais <em>perto da cidade.</em>' },
    intro: { es: 'Maipú es una de las zonas vitivinícolas más tradicionales de Mendoza: bodegas históricas y familiares, olivares y caminos rurales a pocos minutos del centro.', en: 'Maipú is one of Mendoza’s most traditional wine areas: historic and family wineries, olive groves and country roads minutes from downtown.', pt: 'Maipú é uma das regiões vinícolas mais tradicionais de Mendoza: vinícolas históricas e familiares, olivais e estradas rurais a minutos do centro.' },
    itinerary: [
      { h: '01', t: { es: 'Te buscamos', en: 'Pick-up', pt: 'Buscamos você' }, p: { es: 'Traslado desde tu alojamiento hacia Maipú.', en: 'Transfer from your lodging to Maipú.', pt: 'Traslado da sua hospedagem até Maipú.' } },
      { h: '02', t: { es: 'Bodegas', en: 'Wineries', pt: 'Vinícolas' }, p: { es: 'Visitas y degustaciones en bodegas de la zona.', en: 'Visits and tastings at local wineries.', pt: 'Visitas e degustações em vinícolas da região.' } },
      { h: '03', t: { es: 'Regreso', en: 'Return', pt: 'Retorno' }, p: { es: 'Vuelta a tu alojamiento.', en: 'Back to your lodging.', pt: 'Volta à sua hospedagem.' } }
    ],
    includes: { es: ['Traslado ida y vuelta', 'Visitas y degustaciones', 'Coordinación de reservas'], en: ['Round-trip transfer', 'Visits and tastings', 'Booking coordination'], pt: ['Traslado ida e volta', 'Visitas e degustações', 'Coordenação das reservas'] },
    excludes: { es: ['Almuerzo', 'Compras de vinos', 'Propinas'], en: ['Lunch', 'Wine purchases', 'Tips'], pt: ['Almoço', 'Compras de vinhos', 'Gorjetas'] },
    info: [
      { t: { es: 'Qué llevar', en: 'What to bring', pt: 'O que levar' }, p: { es: 'Calzado cómodo y protector solar.', en: 'Comfortable shoes and sunscreen.', pt: 'Calçado confortável e protetor solar.' } },
      { t: { es: 'Temporada', en: 'Season', pt: 'Temporada' }, p: { es: 'Todo el año. En vendimia (febrero–abril) conviene reservar con anticipación.', en: 'All year. During harvest (February–April) book in advance.', pt: 'O ano todo. Na vindima (fevereiro–abril) reserve com antecedência.' } }
    ]
  },
  'bodegas-lujan-de-cuyo': {
    gallery: ['img/exp-tasting.jpg', 'img/g1.jpg', 'img/g4.jpg', 'img/exp-cellar.jpg', 'img/g6.jpg'],
    facts: { group: { es: 'Privado o compartido', en: 'Private or shared', pt: 'Privado ou compartilhado' }, transfer: true, langs: 'ES · EN · PT' },
    title: { es: 'Tres bodegas, <em>un almuerzo largo.</em>', en: 'Three wineries, <em>one long lunch.</em>', pt: 'Três vinícolas, <em>um almoço longo.</em>' },
    intro: { es: 'Luján de Cuyo es la cuna del Malbec. En un día recorrés tres bodegas de estilos distintos —una familiar, una histórica y una de autor— con degustaciones guiadas y un almuerzo de pasos entre viñedos.', en: 'Luján de Cuyo is the cradle of Malbec. In one day you visit three wineries of different styles — a family estate, a historic house and a boutique winery — with guided tastings and a multi-course lunch among the vines.', pt: 'Luján de Cuyo é o berço do Malbec. Em um dia você visita três vinícolas de estilos diferentes — uma familiar, uma histórica e uma de autor — com degustações guiadas e almoço harmonizado entre vinhedos.' },
    itinerary: [
      { h: '09:30', t: { es: 'Te buscamos', en: 'Pick-up', pt: 'Buscamos você' }, p: { es: 'Traslado privado desde tu alojamiento hacia Luján de Cuyo.', en: 'Private transfer from your apartment to Luján de Cuyo.', pt: 'Traslado privado do seu apartamento até Luján de Cuyo.' } },
      { h: '10:15', t: { es: 'Primera bodega', en: 'First winery', pt: 'Primeira vinícola' }, p: { es: 'Recorrido por viñedo y sala de barricas, y degustación de tres vinos.', en: 'Vineyard and barrel-room tour, and a three-wine tasting.', pt: 'Passeio pelo vinhedo e sala de barricas, e degustação de três vinhos.' } },
      { h: '12:00', t: { es: 'Segunda bodega', en: 'Second winery', pt: 'Segunda vinícola' }, p: { es: 'Una casa histórica: cava subterránea y Malbec de viñas viejas.', en: 'A historic house: underground cellar and old-vine Malbec.', pt: 'Uma casa histórica: cave subterrânea e Malbec de vinhas velhas.' } },
      { h: '13:30', t: { es: 'Almuerzo de pasos', en: 'Multi-course lunch', pt: 'Almoço harmonizado' }, p: { es: 'Menú de temporada maridado, con vista a la cordillera.', en: 'Seasonal paired menu facing the Andes.', pt: 'Menu da estação harmonizado, com vista para a cordilheira.' } },
      { h: '16:30', t: { es: 'Tercera bodega y regreso', en: 'Third winery and return', pt: 'Terceira vinícola e retorno' }, p: { es: 'Degustación final y vuelta a tu alojamiento cerca de las 18 h.', en: 'Final tasting and back at your apartment around 6 pm.', pt: 'Degustação final e volta ao apartamento por volta das 18h.' } }
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
  'alquiler-de-autos': {
    gallery: ['img/g7.jpg', 'img/g4.jpg', 'img/exp-snow.jpg', 'img/g2.jpg', 'img/exp-andes.jpg'],
    facts: { group: { es: 'Por día', en: 'Per day', pt: 'Por dia' }, transfer: false, langs: 'ES · EN · PT' },
    title: { es: 'Mendoza <em>a tu ritmo.</em>', en: 'Mendoza <em>at your own pace.</em>', pt: 'Mendoza <em>no seu ritmo.</em>' },
    intro: { es: 'Si preferís moverte por tu cuenta, te coordinamos el alquiler de un auto por los días que necesites: bodegas, alta montaña y rutas escénicas sin horarios.', en: 'If you prefer to get around on your own, we arrange a rental car for the days you need: wineries, high mountains and scenic roads on your schedule.', pt: 'Se prefere se deslocar por conta própria, combinamos o aluguel de um carro pelos dias que precisar: vinícolas, alta montanha e estradas cênicas sem horários.' },
    itinerary: [
      { h: '01', t: { es: 'Nos escribís', en: 'Message us', pt: 'Fale com a gente' }, p: { es: 'Contanos fechas y cantidad de días.', en: 'Tell us your dates and number of days.', pt: 'Conte as datas e a quantidade de dias.' } },
      { h: '02', t: { es: 'Te confirmamos', en: 'We confirm', pt: 'Confirmamos' }, p: { es: 'Te pasamos disponibilidad y condiciones por WhatsApp.', en: 'We send availability and terms over WhatsApp.', pt: 'Enviamos disponibilidade e condições pelo WhatsApp.' } },
      { h: '03', t: { es: 'A la ruta', en: 'Hit the road', pt: 'Pé na estrada' }, p: { es: 'Retirás el auto y recorrés Mendoza como quieras.', en: 'Pick up the car and explore Mendoza your way.', pt: 'Retire o carro e conheça Mendoza do seu jeito.' } }
    ],
    includes: { es: ['Auto por día', 'Coordinación por WhatsApp'], en: ['Car per day', 'WhatsApp coordination'], pt: ['Carro por dia', 'Coordenação pelo WhatsApp'] },
    excludes: { es: ['Combustible', 'Peajes y estacionamiento'], en: ['Fuel', 'Tolls and parking'], pt: ['Combustível', 'Pedágios e estacionamento'] },
    info: [
      { t: { es: 'Requisitos', en: 'Requirements', pt: 'Requisitos' }, p: { es: 'Licencia de conducir vigente. Te confirmamos el resto de las condiciones al consultar.', en: 'A valid driving licence. We confirm the other terms when you enquire.', pt: 'Carteira de motorista válida. Confirmamos as demais condições na consulta.' } },
      { t: { es: 'Alta montaña', en: 'High Andes', pt: 'Alta montanha' }, p: { es: 'En invierno la ruta 7 puede cerrarse por nieve: consultá antes de salir.', en: 'In winter route 7 may close due to snow: check before you go.', pt: 'No inverno a rota 7 pode fechar por neve: consulte antes de sair.' } }
    ]
  },
  'traslado-aeropuerto': {
    gallery: ['img/g2.jpg', 'img/g7.jpg', 'img/g4.jpg', 'img/g6.jpg', 'img/g3.jpg'],
    facts: { group: { es: 'Privado', en: 'Private', pt: 'Privado' }, transfer: true, langs: 'ES · EN · PT' },
    title: { es: 'De la puerta del avión <em>a tu alojamiento.</em>', en: 'From the plane <em>to your door.</em>', pt: 'Do avião <em>até a sua porta.</em>' },
    intro: { es: 'Te esperamos en el aeropuerto El Plumerillo y te llevamos directo a tu alojamiento, sin taxis ni esperas. También te buscamos para el viaje de vuelta. Precio por traslado, hasta 4 pasajeros.', en: 'We meet you at El Plumerillo airport and take you straight to your lodging, no taxis or waiting. We also pick you up for your return flight. Price per transfer, up to 4 passengers.', pt: 'Esperamos você no aeroporto El Plumerillo e levamos direto à sua hospedagem, sem táxi nem espera. Também buscamos você para a volta. Preço por traslado, até 4 passageiros.' },
    itinerary: [
      { h: '01', t: { es: 'Nos pasás tu vuelo', en: 'Send us your flight', pt: 'Envie seu voo' }, p: { es: 'Con el número de vuelo seguimos tu horario de llegada.', en: 'With your flight number we track your arrival time.', pt: 'Com o número do voo acompanhamos o horário de chegada.' } },
      { h: '02', t: { es: 'Te esperamos', en: 'We meet you', pt: 'Esperamos você' }, p: { es: 'Te recibimos en el aeropuerto y te ayudamos con el equipaje.', en: 'We greet you at the airport and help with your luggage.', pt: 'Recebemos você no aeroporto e ajudamos com a bagagem.' } },
      { h: '03', t: { es: 'A tu alojamiento', en: 'To your lodging', pt: 'Até a hospedagem' }, p: { es: 'Traslado directo, unos 20 minutos hasta el centro.', en: 'Direct transfer, about 20 minutes to downtown.', pt: 'Traslado direto, cerca de 20 minutos até o centro.' } }
    ],
    includes: { es: ['Traslado privado', 'Hasta 4 pasajeros con equipaje', 'Seguimiento del vuelo'], en: ['Private transfer', 'Up to 4 passengers with luggage', 'Flight tracking'], pt: ['Traslado privado', 'Até 4 passageiros com bagagem', 'Acompanhamento do voo'] },
    info: [
      { t: { es: 'Ida y vuelta', en: 'Both ways', pt: 'Ida e volta' }, p: { es: 'Podés sumar el traslado de regreso al aeropuerto en la misma consulta.', en: 'You can add the return transfer to the airport in the same enquiry.', pt: 'Você pode somar o traslado de volta ao aeroporto na mesma consulta.' } }
    ]
  }
};
