import type {
  CalendarBlock, ChannelId, Conversation, Currency, Dataset, Expense, Guest, ISODate, Message, Payment, Property, Rate, Reservation,
  ReservationStatus, Season, Settings, Task,
} from '@/types';
import { addDays, addMonths, startOfMonth, weekday } from '@/lib/dates';
import { findConflict, totalOf } from '@/domain/reservations';
import { indexRates, quoteStay } from '@/domain/pricing';
import { syncCleaningTasks } from '@/domain/tasks';

/**
 * DATOS FICTICIOS DE LA DEMO
 *
 * Se generan una sola vez (con una semilla fija, así siempre salen iguales) alrededor de la fecha del día
 * y quedan guardados en el navegador. Los 9 primeros departamentos usan nombre, capacidad, precio base y fotos
 * del sitio público; los 3 últimos son inventados para llegar a 12. Reservas, huéspedes, pagos, gastos,
 * comisiones y mensajes son todos inventados.
 */

/** Generador pseudoaleatorio con semilla (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const photos = (slug: string, n: number, first?: string): string[] => {
  const list = Array.from({ length: n }, (_, i) => `/img/apts/${slug}/${String(i + 1).padStart(2, '0')}.jpg`);
  return first ? [`/img/apts/${slug}/${first}`, ...list] : list;
};

type PSeed = [id: string, name: string, address: string, city: string, capacity: number, bedrooms: number, beds: number, baths: number, price: number, photos: string[], amenities: string[], demo?: boolean];

const BASE_AMENITIES = ['Wi-Fi', 'Aire acondicionado', 'Calefacción', 'Cocina equipada', 'Smart TV', 'Ropa blanca'];
const P: PSeed[] = [
  ['mitre-i', 'Mitre I', 'Mitre 753, piso 6, depto. 604', 'Ciudad de Mendoza', 4, 2, 3, 1, 65, photos('mitre-i', 6, 'pileta-1.jpg'), [...BASE_AMENITIES, 'Pileta', 'Ascensor', 'Balcón']],
  ['amigorena', 'Amigorena', 'Amigorena 14', 'Ciudad de Mendoza', 6, 3, 4, 1, 70, photos('amigorena', 6), [...BASE_AMENITIES, 'Lavarropas', 'Ascensor']],
  ['espana-i', 'España I', 'España 1091', 'Ciudad de Mendoza', 6, 3, 4, 2, 65, photos('espana-i', 6), [...BASE_AMENITIES, 'Lavarropas', 'Ascensor', 'Balcón']],
  ['espana-ii', 'España II', 'Av. España (dos dormitorios)', 'Ciudad de Mendoza', 3, 2, 2, 1.5, 50, photos('espana-ii', 6), [...BASE_AMENITIES, 'Ascensor', 'Cafetera']],
  ['belgrano-i', 'Belgrano I', 'Belgrano 487, depto. 6', 'Ciudad de Mendoza', 2, 1, 1, 1, 35, photos('belgrano-i', 5), [...BASE_AMENITIES]],
  ['belgrano-ii', 'Belgrano II', 'Belgrano 487, depto. 5', 'Ciudad de Mendoza', 3, 1, 2, 1, 38, photos('belgrano-ii', 6), [...BASE_AMENITIES]],
  ['mitre-ii', 'Mitre II', 'Mitre 660', 'Ciudad de Mendoza', 2, 0, 1, 1, 35, photos('mitre-ii', 6), [...BASE_AMENITIES, 'Ascensor']],
  ['espana-iii', 'España III', 'Av. España 1485', 'Ciudad de Mendoza', 3, 1, 2, 1, 38, photos('espana-iii', 6), [...BASE_AMENITIES, 'Ascensor']],
  ['casa-potrerillos', 'Casa Potrerillos', 'Margaritas 50, Villa Las Carditas', 'Potrerillos', 9, 3, 8, 2, 100, photos('casa-potrerillos', 6), ['Wi-Fi', 'Calefacción', 'Cocina equipada', 'Pileta', 'Parrilla', 'Cochera', 'Ropa blanca']],
  ['demo-sarmiento', 'Sarmiento Loft', 'Peatonal Sarmiento 250, piso 3', 'Ciudad de Mendoza', 2, 1, 1, 1, 45, [], [...BASE_AMENITIES, 'Ascensor', 'Escritorio'], true],
  ['demo-aristides', 'Arístides Studio', 'Arístides Villanueva 480, piso 2', 'Ciudad de Mendoza', 2, 0, 1, 1, 42, [], [...BASE_AMENITIES, 'Balcón'], true],
  ['demo-chacras', 'Chacras Casa Jardín', 'Viamonte 5200', 'Chacras de Coria', 6, 3, 4, 2, 110, [], [...BASE_AMENITIES, 'Pileta', 'Parrilla', 'Cochera', 'Apto mascotas'], true],
];

function buildProperties(): Property[] {
  return P.map(([id, name, address, city, capacity, bedrooms, beds, bathrooms, price, ph, amenities, demo]) => ({
    id: `prop_${id}`,
    internalName: name,
    publicName: `Apartamento ${name}`.replace('Apartamento Casa', 'Casa').replace('Apartamento Chacras', 'Chacras'),
    description: demo
      ? 'Departamento inventado para la demostración. No existe en el sitio público.'
      : `${bedrooms === 0 ? 'Monoambiente' : `${bedrooms} dormitorio${bedrooms > 1 ? 's' : ''}`} para ${capacity} huéspedes en ${city}.`,
    address,
    city,
    capacity,
    bedrooms,
    beds,
    bathrooms,
    photos: ph,
    amenities,
    checkInTime: '15:00',
    checkOutTime: '10:00',
    currency: 'USD' as Currency,
    basePrice: price,
    weekendPrice: Math.round(price * 1.12),
    cleaningFee: capacity >= 6 ? 30 : 20,
    minStay: city === 'Potrerillos' ? 2 : 1,
    maxStay: 60,
    weeklyDiscount: 8,
    monthlyDiscount: 20,
    active: true,
    units: [{ id: `unit_${id}`, propertyId: `prop_${id}`, name: 'Unidad única', external: {} }],
    external: {},
    demo,
  }));
}

const GUESTS: [string, string, string][] = [
  ['Lucía', 'Fernández', 'Argentina'], ['Martín', 'Giménez', 'Argentina'], ['Camila', 'Rossi', 'Argentina'], ['Joaquín', 'Paz', 'Argentina'],
  ['Valentina', 'Ortiz', 'Argentina'], ['Tomás', 'Herrera', 'Argentina'], ['Agustina', 'Molina', 'Argentina'], ['Federico', 'Suárez', 'Argentina'],
  ['Rafael', 'Oliveira', 'Brasil'], ['Beatriz', 'Carvalho', 'Brasil'], ['Thiago', 'Almeida', 'Brasil'], ['Larissa', 'Mendes', 'Brasil'],
  ['Gustavo', 'Pereira', 'Brasil'], ['Mariana', 'Barros', 'Brasil'], ['Ignacio', 'Vergara', 'Chile'], ['Constanza', 'Riquelme', 'Chile'],
  ['Matías', 'Fuentes', 'Chile'], ['Francisca', 'Tapia', 'Chile'], ['Sebastián', 'Bravo', 'Chile'], ['Emma', 'Collins', 'Estados Unidos'],
  ['Daniel', 'Harper', 'Estados Unidos'], ['Olivia', 'Bennett', 'Estados Unidos'], ['Hannah', 'Keller', 'Alemania'], ['Lukas', 'Brandt', 'Alemania'],
  ['Chloé', 'Marchand', 'Francia'], ['Antoine', 'Leroy', 'Francia'], ['Irene', 'Soler', 'España'], ['Pablo', 'Navarro', 'España'],
  ['Sofía', 'Cabrera', 'Uruguay'], ['Bruno', 'Silveira', 'Uruguay'], ['Andrea', 'Quispe', 'Perú'], ['Diego', 'Salazar', 'Colombia'],
  ['Paula', 'Rincón', 'Colombia'], ['Ximena', 'Aguirre', 'México'], ['Oscar', 'Villalobos', 'México'], ['Grace', 'Whitfield', 'Reino Unido'],
  ['Giulia', 'Ferraro', 'Italia'], ['Nicolás', 'Acosta', 'Argentina'], ['Julieta', 'Benítez', 'Argentina'], ['Emilia', 'Duarte', 'Paraguay'],
  ['Renata', 'Lima', 'Brasil'], ['Hernán', 'Castro', 'Argentina'], ['Milagros', 'Vera', 'Argentina'], ['Santiago', 'Luna', 'Argentina'],
];
const DIAL: Record<string, string> = { Argentina: '+54 9 261', Brasil: '+55 11', Chile: '+56 9', 'Estados Unidos': '+1 415', Alemania: '+49 151', Francia: '+33 6', España: '+34 6', Uruguay: '+598 9', Perú: '+51 9', Colombia: '+57 3', México: '+52 55', 'Reino Unido': '+44 7', Italia: '+39 3', Paraguay: '+595 9' };
const PREFS = ['Llegada tarde', 'Viaja con chicos', 'Cochera', 'Piso alto', 'Cuna', 'Check-in anticipado', 'Viaje de trabajo', 'Tour de bodegas'];
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '');

function buildGuests(rand: () => number, now: string): Guest[] {
  return GUESTS.map(([firstName, lastName, country], i) => ({
    id: `gst_${String(i + 1).padStart(3, '0')}`,
    firstName,
    lastName,
    email: `${slug(firstName)}.${slug(lastName)}@ejemplo.com`,
    phone: `${DIAL[country] ?? '+00'} 555-${String(1000 + Math.floor(rand() * 8999))}`,
    country,
    preferences: rand() < 0.45 ? [PREFS[Math.floor(rand() * PREFS.length)]] : [],
    notes: '',
    createdAt: now,
  }));
}

export const DEFAULT_SETTINGS: Settings = {
  business: { name: 'RGM Experiences', legalName: '', email: '', phone: '+54 9 261 467-1604', address: 'Ciudad de Mendoza, Argentina', website: 'rgmexperiences.com' },
  general: { language: 'es-AR', dateFormat: 'dd/MM/yyyy', weekStart: 'monday', defaultCalendarDays: 14 },
  currency: { reporting: 'USD', convert: false, demoRate: 1200 },
  timezone: 'America/Argentina/Mendoza',
  notifications: { newReservation: true, cancellation: true, pendingPayment: true, checkInToday: true, cleaningPending: true, newMessage: true },
  policies: { depositPct: 30, cancellationDays: 7, checkInTime: '15:00', checkOutTime: '10:00', houseRules: 'No se permiten fiestas. No fumar dentro del departamento.' },
  demoChannelFees: { airbnb: 15, booking: 17, web: 0, manual: 0 },
  users: [{ id: 'usr_demo', name: 'Administrador demo', email: 'admin@ejemplo.com', role: 'admin', active: true }],
  staff: ['Rosa (limpieza)', 'Marta (limpieza)', 'Carlos (mantenimiento)'],
};

const CHANNEL_PICK: ChannelId[] = ['airbnb', 'airbnb', 'airbnb', 'airbnb', 'booking', 'booking', 'booking', 'web', 'web', 'manual'];
const OBS = ['', '', '', 'Llegan en auto desde Chile.', 'Piden cuna.', 'Llegada después de las 22 h.', 'Aniversario: dejar una botella de vino.', 'Viaje de trabajo, necesita factura.', 'Consultó por tour de bodegas.'];

export function buildDataset(today: ISODate): Dataset {
  const rand = rng(20261111);
  const int = (a: number, b: number) => a + Math.floor(rand() * (b - a + 1));
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const settings: Settings = structuredClone(DEFAULT_SETTINGS);
  const properties = buildProperties();
  const guests = buildGuests(rand, `${addDays(today, -120)}T12:00:00.000Z`);

  // Temporadas (para el año en curso y el siguiente)
  const year = Number(today.slice(0, 4));
  const seasons: Season[] = [];
  for (const y of [year - 1, year, year + 1]) {
    seasons.push({ id: `sea_verano_${y}`, name: `Verano ${y}/${String(y + 1).slice(2)}`, type: 'high', start: `${y}-12-15`, end: `${y + 1}-03-01`, adjustPct: 20 });
    seasons.push({ id: `sea_vendimia_${y}`, name: `Vendimia ${y}`, type: 'high', start: `${y}-03-01`, end: `${y}-03-16`, adjustPct: 30 });
    seasons.push({ id: `sea_baja_${y}`, name: `Otoño ${y}`, type: 'low', start: `${y}-05-01`, end: `${y}-06-20`, adjustPct: -12 });
  }

  // Bloqueos
  const blocks: CalendarBlock[] = [
    { id: 'blk_001', propertyId: 'prop_espana-ii', start: addDays(today, 6), end: addDays(today, 10), type: 'maintenance', reason: 'Pintura del living' },
    { id: 'blk_002', propertyId: 'prop_casa-potrerillos', start: addDays(today, 16), end: addDays(today, 20), type: 'owner', reason: 'Uso de la familia' },
    { id: 'blk_003', propertyId: 'prop_mitre-ii', start: addDays(today, -14), end: addDays(today, -11), type: 'maintenance', reason: 'Cambio de termotanque' },
    { id: 'blk_004', propertyId: 'prop_demo-chacras', start: addDays(today, 30), end: addDays(today, 37), type: 'maintenance', reason: 'Mantenimiento de la pileta' },
  ];

  // Tarifas puntuales: un fin de semana largo ficticio dentro de tres semanas
  const rates: Rate[] = [];
  let fri = addDays(today, 18);
  while (weekday(fri) !== 5) fri = addDays(fri, 1);
  for (const p of properties) for (let i = 0; i < 3; i++) rates.push({ propertyId: p.id, date: addDays(fri, i), price: Math.round(p.basePrice * 1.35), minStay: 2 });
  const rateIndex = indexRates(rates);

  // Reservas
  const reservations: Reservation[] = [];
  const payments: Payment[] = [];
  let seq = 1040;
  let guestCursor = 0;
  const nextGuest = (): Guest => (rand() < 0.2 && guestCursor > 6 ? guests[int(0, guestCursor - 1)] : guests[guestCursor++ % guests.length]);

  const add = (propertyId: string, checkIn: ISODate, nightsCount: number, opts: { channel?: ChannelId; status?: ReservationStatus; pay?: 'paid' | 'partial' | 'unpaid' } = {}): boolean => {
    const property = properties.find((p) => p.id === propertyId)!;
    const checkOut = addDays(checkIn, nightsCount);
    const status: ReservationStatus = opts.status ?? (checkOut <= today ? 'completed' : 'confirmed');
    if (status !== 'cancelled' && findConflict({ propertyId, start: checkIn, end: checkOut }, reservations, blocks)) return false;
    const channel = opts.channel ?? pick(CHANNEL_PICK);
    const guest = nextGuest();
    const q = quoteStay(property, checkIn, checkOut, rateIndex, seasons);
    const ars = channel === 'manual' && rand() < 0.6;
    const k = ars ? settings.currency.demoRate : 1;
    const accommodation = q.accommodation * k;
    const discount = q.discount * k;
    const cleaning = q.cleaning * k;
    const breakdown = { accommodation, cleaning, discount, taxes: 0, channelFee: Math.round(((accommodation - discount) * settings.demoChannelFees[channel]) / 100) };
    const lead = int(3, 45);
    const createdAt = `${addDays(checkIn, -lead)}T${String(int(9, 21)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}:00.000Z`;
    const id = `res_${seq}`;
    const r: Reservation = {
      id,
      code: `RGM-${seq}`,
      propertyId,
      unitId: property.units[0]?.id,
      guestId: guest.id,
      channel,
      checkIn,
      checkOut,
      adults: Math.max(1, Math.min(property.capacity, int(1, Math.max(2, property.capacity - 1)))),
      children: property.capacity > 3 && rand() < 0.25 ? 1 : 0,
      status,
      currency: ars ? 'ARS' : 'USD',
      breakdown,
      observations: pick(OBS),
      notes: [],
      history: [{ id: `h_${seq}_1`, at: createdAt, action: 'Reserva creada', detail: 'Dato de demostración' }],
      createdAt,
    };
    if (status === 'cancelled') {
      r.cancelledAt = `${addDays(checkIn, -int(1, Math.max(1, lead - 1)))}T15:00:00.000Z`;
      r.history.push({ id: `h_${seq}_2`, at: r.cancelledAt, action: 'Reserva cancelada' });
    }
    seq++;
    reservations.push(r);

    const total = totalOf(breakdown);
    const method = channel === 'airbnb' || channel === 'booking' ? 'channel' : pick(['transfer', 'transfer', 'cash', 'card'] as const);
    const mode = opts.pay ?? (status === 'cancelled' || status === 'pending' ? 'unpaid' : status === 'completed' ? 'paid' : method === 'channel' ? pick(['paid', 'paid', 'paid', 'paid', 'partial'] as const) : pick(['paid', 'partial', 'partial', 'unpaid'] as const));
    const payDate = (d: ISODate) => (d > today ? today : d);
    if (mode === 'paid') {
      if (method !== 'channel' && rand() < 0.5) {
        const dep = Math.round(total * 0.3);
        payments.push({ id: `pay_${id}_1`, reservationId: id, date: payDate(addDays(checkIn, -lead)), amount: dep, currency: r.currency, method, note: 'Seña' });
        payments.push({ id: `pay_${id}_2`, reservationId: id, date: payDate(checkIn), amount: total - dep, currency: r.currency, method, note: 'Saldo' });
      } else {
        payments.push({ id: `pay_${id}_1`, reservationId: id, date: payDate(addDays(checkIn, -Math.min(lead, 2))), amount: total, currency: r.currency, method, note: method === 'channel' ? 'Cobro informado por el canal (ficticio)' : 'Pago total' });
      }
    } else if (mode === 'partial') {
      payments.push({ id: `pay_${id}_1`, reservationId: id, date: payDate(addDays(checkIn, -lead)), amount: Math.round(total * 0.3), currency: r.currency, method: method === 'channel' ? 'transfer' : method, note: 'Seña 30 %' });
    }
    return true;
  };

  // Movimiento garantizado para hoy y los próximos días (llegadas, salidas y huéspedes alojados)
  add('prop_mitre-i', addDays(today, -4), 4, { channel: 'airbnb' });
  add('prop_mitre-i', today, 5, { channel: 'booking', pay: 'partial' });
  add('prop_amigorena', addDays(today, -2), 6, { channel: 'airbnb', pay: 'paid' });
  add('prop_espana-i', addDays(today, -3), 3, { channel: 'web' });
  add('prop_espana-i', today, 4, { channel: 'airbnb', pay: 'paid' });
  add('prop_belgrano-i', today, 3, { channel: 'manual', pay: 'unpaid' });
  add('prop_belgrano-ii', addDays(today, -5), 5, { channel: 'booking' });
  add('prop_espana-iii', addDays(today, -1), 4, { channel: 'web', pay: 'partial' });
  add('prop_casa-potrerillos', addDays(today, 1), 3, { channel: 'airbnb', pay: 'paid' });
  add('prop_mitre-ii', addDays(today, 1), 2, { channel: 'booking', pay: 'unpaid' });
  add('prop_demo-sarmiento', addDays(today, -6), 7, { channel: 'airbnb' });
  add('prop_demo-aristides', addDays(today, 2), 5, { channel: 'web', status: 'pending' });
  add('prop_demo-chacras', addDays(today, -1), 3, { channel: 'manual', pay: 'partial' });

  // Resto: reservas pasadas y futuras, más densas cerca de hoy
  const TARGET = 63;
  for (let round = 0; round < 4 && reservations.length < TARGET; round++) {
    for (const p of properties) {
      let cursor = addDays(today, -48 + int(0, 6));
      while (cursor < addDays(today, 52) && reservations.length < TARGET) {
        const n = int(3, 8);
        const near = Math.abs((Date.parse(cursor) - Date.parse(today)) / 86_400_000) < 24;
        if (rand() < (near ? 0.85 : 0.6)) add(p.id, cursor, n, cursor > addDays(today, 12) && rand() < 0.14 ? { status: 'pending' } : {});
        cursor = addDays(cursor, n + int(near ? 0 : 2, near ? 4 : 10));
      }
    }
  }
  // Canceladas (no ocupan fechas)
  for (let i = 0; i < 5; i++) add(pick(properties).id, addDays(today, int(-40, 40)), int(2, 5), { status: 'cancelled' });
  reservations.sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  // Gastos de los últimos 4 meses
  const expenses: Expense[] = [];
  let ex = 1;
  const pushExpense = (e: Omit<Expense, 'id'>) => { if (e.date <= today) expenses.push({ id: `exp_${String(ex++).padStart(3, '0')}`, ...e }); };
  for (let m = -3; m <= 0; m++) {
    const first = addMonths(startOfMonth(today), m);
    for (const p of properties) {
      pushExpense({ propertyId: p.id, date: addDays(first, int(1, 6)), category: 'utilities', description: 'Luz, gas e internet', amount: int(38, 70) * 1000, currency: 'ARS', paid: m < 0 || rand() < 0.5 });
      pushExpense({ propertyId: p.id, date: addDays(first, int(8, 26)), category: 'cleaning', description: 'Limpiezas del mes', amount: int(45, 110) * 1000, currency: 'ARS', paid: m < 0 });
      if (rand() < 0.5) pushExpense({ propertyId: p.id, date: addDays(first, int(5, 25)), category: 'laundry', description: 'Lavado de ropa blanca', amount: int(18, 40) * 1000, currency: 'ARS', paid: true });
      if (rand() < 0.22) pushExpense({ propertyId: p.id, date: addDays(first, int(3, 27)), category: 'maintenance', description: pick(['Arreglo de cerradura', 'Service de aire acondicionado', 'Plomería', 'Pintura de retoque', 'Cambio de colchón']), amount: int(40, 220), currency: 'USD', paid: rand() < 0.8 });
    }
    pushExpense({ propertyId: null, date: addDays(first, int(2, 20)), category: 'supplies', description: 'Insumos: café, jabón, papel', amount: int(60, 120) * 1000, currency: 'ARS', paid: true });
    pushExpense({ propertyId: null, date: addDays(first, 10), category: 'other', description: 'Contador y gestoría', amount: 90, currency: 'USD', paid: m < 0 });
  }

  // Tareas: limpiezas a partir de los check-outs + algo de mantenimiento
  const tasks: Task[] = [
    { id: 'tsk_m1', propertyId: 'prop_espana-ii', type: 'maintenance', date: addDays(today, 6), assignee: 'Carlos (mantenimiento)', status: 'pending', priority: 'normal', comments: 'Pintar el living durante el bloqueo.' },
    { id: 'tsk_m2', propertyId: 'prop_amigorena', type: 'maintenance', date: addDays(today, 1), assignee: 'Carlos (mantenimiento)', status: 'pending', priority: 'high', comments: 'Pierde la canilla de la cocina.' },
    { id: 'tsk_m3', propertyId: 'prop_belgrano-i', type: 'maintenance', date: addDays(today, 4), assignee: '', status: 'pending', priority: 'low', comments: 'Cambiar foco del baño.' },
    { id: 'tsk_m4', propertyId: 'prop_mitre-ii', type: 'maintenance', date: addDays(today, -11), assignee: 'Carlos (mantenimiento)', status: 'done', priority: 'high', comments: 'Termotanque nuevo instalado.' },
  ];

  // Mensajes
  const conv = (i: number, r: Reservation, msgs: [from: Message['from'], text: string, daysAgo: number, hour: number][], unread: boolean): Conversation => ({
    id: `cnv_${String(i).padStart(3, '0')}`,
    guestId: r.guestId,
    propertyId: r.propertyId,
    reservationId: r.id,
    channel: r.channel,
    unread,
    messages: msgs.map(([from, text, daysAgo, hour], k) => ({ id: `msg_${i}_${k}`, at: `${addDays(today, -daysAgo)}T${String(hour).padStart(2, '0')}:${String((k * 13 + i * 7) % 60).padStart(2, '0')}:00.000Z`, from, text })),
  });
  const upcoming = reservations.filter((r) => r.status !== 'cancelled' && r.checkOut > today).slice(0, 9);
  const scripts: [Message['from'], string, number, number][][] = [
    [['guest', '¡Hola! ¿A qué hora podemos hacer el check-in? Llegamos al aeropuerto a las 13 h.', 1, 14], ['host', 'Hola, el check-in es desde las 15 h. Si el departamento está listo antes, les avisamos.', 1, 15], ['guest', 'Perfecto, muchas gracias. ¿Tienen dónde dejar las valijas?', 0, 13]],
    [['guest', 'Buen día, ¿el departamento tiene cochera?', 2, 12], ['host', 'Buen día. No tiene cochera propia, pero hay una playa a media cuadra.', 2, 13]],
    [['guest', 'Olá! Gostaríamos de reservar um tour de vinícolas. Vocês organizam?', 0, 11]],
    [['guest', 'Hi! Is there a washing machine in the apartment?', 3, 16], ['host', 'Hi! Yes, there is one in the kitchen. Detergent is provided.', 3, 17], ['guest', 'Great, thank you!', 3, 17]],
    [['guest', 'Hola, ¿puedo pagar el saldo por transferencia?', 1, 19], ['host', 'Sí, claro. Te paso los datos por acá el día del ingreso.', 1, 20]],
    [['guest', 'No anda el wifi desde anoche, ¿me podrán ayudar?', 0, 12]],
    [['guest', '¿Se puede hacer el check-out un poco más tarde? Nuestro vuelo sale a las 18 h.', 1, 10], ['host', 'Podemos extenderlo hasta las 12 h sin cargo.', 1, 11], ['guest', 'Buenísimo, gracias.', 1, 11]],
    [['guest', 'Hola, somos 4 adultos y un bebé. ¿Tienen cuna?', 4, 15], ['host', 'Hola. Sí, la dejamos armada sin cargo.', 4, 16]],
    [['guest', 'Gracias por todo, el departamento estaba impecable.', 2, 20]],
  ];
  const conversations = upcoming.map((r, i) => conv(i + 1, r, scripts[i % scripts.length], scripts[i % scripts.length].at(-1)![0] === 'guest' && i % 3 !== 1));

  const ds: Dataset = {
    properties,
    guests,
    reservations,
    payments,
    expenses,
    blocks,
    rates,
    seasons,
    tasks,
    conversations,
    templates: [
      { id: 'tpl_bienvenida', name: 'Bienvenida', text: 'Hola {huesped}, ¡gracias por tu reserva en {departamento}! Te esperamos el {checkin}. Cualquier consulta, escribinos por acá.' },
      { id: 'tpl_checkin', name: 'Instrucciones de check-in', text: 'Hola {huesped}. El check-in es desde las 15 h en {direccion}. Avisanos tu horario de llegada así coordinamos la entrega de llaves.' },
      { id: 'tpl_checkout', name: 'Recordatorio de check-out', text: 'Hola {huesped}. Te recordamos que el check-out es mañana {checkout} hasta las 10 h. ¡Esperamos que hayas disfrutado la estadía!' },
      { id: 'tpl_resena', name: 'Pedido de reseña', text: 'Hola {huesped}, gracias por elegirnos. Si te gustó tu estadía en {departamento}, nos ayuda mucho que nos dejes una reseña.' },
    ],
    channels: [
      { id: 'airbnb', name: 'Airbnb', description: 'Las reservas y la disponibilidad de Airbnb llegarán a través de Beds24. Todavía no hay ninguna conexión.', status: 'pending_integration' },
      { id: 'booking', name: 'Booking.com', description: 'Las reservas y la disponibilidad de Booking.com llegarán a través de Beds24. Todavía no hay ninguna conexión.', status: 'pending_integration' },
      { id: 'web', name: 'Página web', description: 'Reservas directas desde rgmexperiences.com. Hoy el sitio deriva las consultas a WhatsApp; las reservas "web" que ves son ficticias.', status: 'demo' },
      { id: 'beds24', name: 'Beds24', description: 'Gestor de canales que centralizará reservas, disponibilidad y tarifas. Será la fuente de verdad del inventario.', status: 'pending_config' },
      { id: 'manual', name: 'Reservas manuales', description: 'Reservas y bloqueos cargados a mano desde este panel.', status: 'demo' },
    ],
    sync: [
      { channelId: 'beds24', state: 'never', log: [], errors: [] },
      { channelId: 'airbnb', state: 'never', log: [], errors: [] },
      { channelId: 'booking', state: 'never', log: [], errors: [] },
    ],
    settings,
  };
  syncCleaningTasks(ds, today, true);
  return ds;
}
