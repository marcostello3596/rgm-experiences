"""Mapa ilustrado del centro de Mendoza para la home.
Lee src/map/centro-osm.json (calles, plazas y parques de OpenStreetMap, © colaboradores de OSM)
y genera:
  img/map-centro.svg  → base del mapa (manzanas con relieve, calles, plazas y parque con árboles). Sin textos.
  js/map-data.js      → proyección + referencias para la página: plazas, Peatonal, Arístides, parque,
                        y anclas para los nombres de las calles (se muestran según el zoom).
Uso: python3 src/map/build_map.py   (sólo Python 3, sin dependencias)"""
import json, math, os, random

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
data = json.load(open(os.path.join(HERE, 'centro-osm.json'), encoding='utf-8'))

# Proyección equirectangular en metros (suficiente para 4 km). La caja llega al oeste hasta el Parque San Martín.
LAT_TOP, LAT_BOT, LON_W, LON_E = -32.8745, -32.9095, -68.8745, -68.8300
KX = math.cos(math.radians((LAT_TOP + LAT_BOT) / 2)) * 111320
KY = 110574
W = round((LON_E - LON_W) * KX)
H = round((LAT_TOP - LAT_BOT) * KY)
M = 120  # margen fuera de la caja que todavía se dibuja
def P(lat, lon): return ((lon - LON_W) * KX, (LAT_TOP - lat) * KY)
def near_box(g): return any(-M <= x <= W + M and -M <= y <= H + M for x, y in (P(a, b) for a, b in g))
def path(pts, close=False):
    xy = [P(a, b) for a, b in pts]
    s = 'M' + ' '.join('%d %d' % (round(x), round(y)) for x, y in xy)
    return s + ('Z' if close else '')

# ---------- áreas verdes ----------
greens, squares = [], []   # polígonos (lista de (x, y))
for e in data:
    t = e['t']
    if e['k'] == 'w':
        g = e['g']
        if (t.get('leisure') in ('park', 'garden') or t.get('place') == 'square') and len(g) > 3 and g[0] == g[-1] and near_box(g):
            poly = [P(a, b) for a, b in g]
            (squares if t.get('name', '').startswith('Plaza ') else greens).append(poly)
    else:
        for m in e['m']:
            g = m['g']
            if m['r'] == 'outer' and len(g) > 3 and g[0] == g[-1] and near_box(g):
                greens.append([P(a, b) for a, b in g])

def inside(pt, poly):
    x, y = pt; c = False; j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]; xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-9) + xi: c = not c
        j = i
    return c
def bbox(poly): xs = [p[0] for p in poly]; ys = [p[1] for p in poly]; return (min(xs), min(ys), max(xs), max(ys))
GB = [(bbox(p), p) for p in greens + squares]
def in_green(pt):
    return any(b[0] <= pt[0] <= b[2] and b[1] <= pt[1] <= b[3] and inside(pt, p) for b, p in GB)
def poly_d(poly): return 'M' + ' '.join('%d %d' % (round(x), round(y)) for x, y in poly) + 'Z'

# ---------- calles ----------
ROAD = {  # clase OSM → (grupo, ancho en metros)
    'trunk': ('major', 17), 'primary': ('major', 16), 'primary_link': ('mid', 10),
    'secondary': ('major', 15), 'secondary_link': ('mid', 8), 'tertiary': ('mid', 12), 'tertiary_link': ('mid', 8),
    'residential': ('minor', 10), 'unclassified': ('minor', 10), 'living_street': ('minor', 8),
    'service': ('lane', 5), 'pedestrian': ('walk', 9), 'footway': ('foot', 2.4), 'path': ('foot', 2.4),
}
groups = {}
KEY = {'aristides': [], 'peatonal': []}
named = {}  # nombre → lista de tramos (para las etiquetas)
for e in data:
    t = e['t']
    if e['k'] != 'w' or t.get('highway') not in ROAD: continue
    g = e['g']
    if not near_box(g): continue
    grp, w = ROAD[t['highway']]
    n = t.get('name', '')
    if grp == 'foot':
        # sólo los senderos dentro de plazas y parques (las veredas ensucian el dibujo)
        mid = P(*g[len(g) // 2])
        if not in_green(mid): continue
    groups.setdefault((grp, w), []).append(path(g))
    if n == 'Arístides Villanueva': KEY['aristides'].append(g)
    if n == 'Sarmiento' and t['highway'] == 'pedestrian': KEY['peatonal'].append(g)
    if n and grp in ('major', 'mid', 'minor', 'walk'): named.setdefault(n, []).append(g)

# ---------- árboles (patrón: copas punteadas con sombra) ----------
rnd = random.Random(7)
TILE = 90
trees, tries = [], 0
while tries < 4000 and len(trees) < 46:
    tries += 1
    x, y, r = rnd.uniform(0, TILE), rnd.uniform(0, TILE), rnd.uniform(3.6, 5.6)
    ok = True
    for (a, b, rr) in trees:
        dx = min(abs(a - x), TILE - abs(a - x)); dy = min(abs(b - y), TILE - abs(b - y))
        if math.hypot(dx, dy) < r + rr + 2.6: ok = False; break
    if ok: trees.append((x, y, r))
def tree_marks(dx, dy, scale, col):
    out = []
    for (x, y, r) in trees:
        for ox in (-TILE, 0, TILE):          # copias en los bordes para que el patrón no se corte
            for oy in (-TILE, 0, TILE):
                cx, cy = x + ox + dx, y + oy + dy
                if -8 < cx < TILE + 8 and -8 < cy < TILE + 8:
                    out.append('<circle cx="%.1f" cy="%.1f" r="%.1f"/>' % (cx, cy, r * scale))
    return '<g fill="%s">%s</g>' % (col, ''.join(out))

PAPER, BLOCK_SH = '#e7dfd1', '#d4c8b5'
svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d">' % (W, H, W, H),
       '<defs>',
       '<pattern id="t" width="%d" height="%d" patternUnits="userSpaceOnUse">' % (TILE, TILE),
       '<rect width="%d" height="%d" fill="#d3d3ba"/>' % (TILE, TILE),
       tree_marks(1.3, 1.7, 1.0, '#b6b796'), tree_marks(0, 0, 1.0, '#c3c5a6'), tree_marks(-1.0, -1.2, .45, '#cfd1b5'),
       '</pattern>',
       '<pattern id="s" width="%d" height="%d" patternUnits="userSpaceOnUse" patternTransform="translate(37 21)">' % (TILE, TILE),
       '<rect width="%d" height="%d" fill="#cdcfb1"/>' % (TILE, TILE),
       tree_marks(1.3, 1.7, 1.0, '#acaf8b'), tree_marks(0, 0, 1.0, '#bcbf9d'), tree_marks(-1.0, -1.2, .45, '#cacdb0'),
       '</pattern>']
# trazados de las calles por grupo (se reutilizan para la sombra y el relleno)
order = [('lane',), ('minor',), ('mid',), ('major',), ('walk',)]
ids = []
for (grp, w), ds in sorted(groups.items(), key=lambda kv: [o[0] for o in order].index(kv[0][0]) if kv[0][0] != 'foot' else 99):
    if grp == 'foot': continue
    i = 'r%d' % len(ids); ids.append((i, grp, w))
    svg.append('<path id="%s" d="%s"/>' % (i, ' '.join(ds)))
svg.append('</defs>')
svg.append('<rect width="%d" height="%d" fill="%s"/>' % (W, H, PAPER))
svg.append('<path d="%s" fill="url(#t)"/>' % ' '.join(poly_d(p) for p in greens))
svg.append('<path d="%s" fill="url(#s)"/>' % ' '.join(poly_d(p) for p in squares))
# relieve: la calle se dibuja corrida 1,6 m sobre una copia más oscura → las manzanas parecen levantadas
FILL = {'major': '#fbf8f2', 'mid': '#faf6ef', 'minor': '#f7f2e9', 'lane': '#f1eadf', 'walk': '#fbf8f2'}
svg.append('<g fill="none" stroke="%s" stroke-linecap="round" stroke-linejoin="round">' % BLOCK_SH)
for i, grp, w in ids: svg.append('<use href="#%s" stroke-width="%s"/>' % (i, w + 1.2))
svg.append('</g><g fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(1.6 1.6)">')
for i, grp, w in ids: svg.append('<use href="#%s" stroke="%s" stroke-width="%s"/>' % (i, FILL[grp], w))
svg.append('</g>')
# senderos dentro de las plazas y el parque
foot = [d for (grp, w), ds in groups.items() if grp == 'foot' for d in ds]
if foot: svg.append('<path d="%s" fill="none" stroke="#ece5d6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>' % ' '.join(foot))
svg.append('</svg>')
open(os.path.join(ROOT, 'img', 'map-centro.svg'), 'w', encoding='utf-8').write(''.join(svg))

# ---------- referencias para la página ----------
def centroid(name):
    for e in data:
        if e['k'] == 'w' and e['t'].get('name') == name:
            g = e['g'][:-1] if e['g'][0] == e['g'][-1] else e['g']
            return [round(sum(p[0] for p in g) / len(g), 5), round(sum(p[1] for p in g) / len(g), 5)]
def ring(name):
    for e in data:
        if e['k'] == 'w' and e['t'].get('name') == name: return [[round(a, 5), round(b, 5)] for a, b in e['g']]
def joined(ways):
    # une los tramos en una sola polilínea ordenada de este a oeste
    pts = sorted(set(tuple(p) for g in ways for p in g), key=lambda p: -p[1])
    return [[round(a, 5), round(b, 5)] for a, b in pts]

LABELS = {  # nombre en OSM → (texto, prioridad: 2 se ve antes que 3)
    'Avenida General San Martín': ('Av. San Martín', 2), 'Avenida Bartolomé Mitre': ('Av. Mitre', 2),
    'Avenida Colón': ('Av. Colón', 2), 'Avenida Juan Gregorio de Las Heras': ('Av. Las Heras', 2),
    'Avenida Emilio Civit': ('Av. Emilio Civit', 2), 'Manuel Belgrano': ('Belgrano', 2),
    'Boulogne Sur Mer': ('Boulogne Sur Mer', 2), 'Avenida Pedro Molina': ('Av. Pedro Molina', 2),
    'Avenida Mariano Moreno': ('Av. Moreno', 3), 'Paso de los Andes': ('Paso de los Andes', 3),
    'España': ('España', 3), 'Patricias Mendocinas': ('Patricias Mendocinas', 3), 'Chile': ('Chile', 3),
    '25 de Mayo': ('25 de Mayo', 3), '9 de Julio': ('9 de Julio', 3), 'Bernardino Rivadavia': ('Rivadavia', 3),
    'Montevideo': ('Montevideo', 3), 'José Albino Gutiérrez': ('Gutiérrez', 3), 'Gral. Gerónimo Espejo': ('Espejo', 3),
    'Mariano Necochea': ('Necochea', 3), 'Avenida Luciano Peltier': ('Av. Peltier', 3),
    'Cnel. Juan Esteban Rodríguez': ('Rodríguez', 3), 'Perú': ('Perú', 3), 'Tiburcio Benegas': ('T. Benegas', 3),
    'Juan Martínez de Rozas': ('Martínez de Rozas', 3), 'Rioja': ('Rioja', 3), 'Salta': ('Salta', 3),
    'San Juan': ('San Juan', 3), 'Buenos Aires': ('Buenos Aires', 3), 'San Lorenzo': ('San Lorenzo', 3),
    'José Francisco de Amigorena': ('Amigorena', 3), 'Juan Galo de Lavalle': ('Lavalle', 3),
    'Gobernador Ricardo Videla': ('Videla', 3), 'Granaderos': ('Granaderos', 3), 'Manuel Olascoaga': ('Olascoaga', 3),
    'Avenida Juan Bautista Justo': ('Av. J. B. Justo', 3), 'Avenida Tomás Godoy Cruz': ('Av. Godoy Cruz', 3),
    'Doctor Adolfo Calle': ('Adolfo Calle', 3), 'Gral. José María Paz': ('Paz', 3), 'Rufino Ortega': ('Rufino Ortega', 3),
    'Martín Zapata': ('Martín Zapata', 3), 'Agustín Álvarez': ('Agustín Álvarez', 3), 'Juan Martín de Pueyrredón': ('Pueyrredón', 3),
}
def anchors(ways, step=330, first=160):
    out = []
    for g in ways:
        xy = [P(a, b) for a, b in g]
        segs = [(xy[i], xy[i + 1], math.hypot(xy[i + 1][0] - xy[i][0], xy[i + 1][1] - xy[i][1])) for i in range(len(xy) - 1)]
        total = sum(s[2] for s in segs)
        if total < 140: continue
        d = min(first, total / 2)
        while d < total:
            acc = 0
            for (a, b, l) in segs:
                if acc + l >= d and l > 0:
                    u = (d - acc) / l; x = a[0] + (b[0] - a[0]) * u; y = a[1] + (b[1] - a[1]) * u
                    ang = math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))
                    if ang > 90: ang -= 180
                    if ang <= -90: ang += 180
                    if 40 < x < W - 40 and 30 < y < H - 30: out.append([round(x), round(y), round(ang, 1)])
                    break
                acc += l
            d += step
    return out
def merge(ways):
    # une los tramos que comparten un extremo (OSM corta las calles en muchos pedazos)
    ws = [list(map(tuple, g)) for g in ways]
    changed = True
    while changed:
        changed = False
        for i in range(len(ws)):
            for j in range(len(ws)):
                if i == j or not ws[i] or not ws[j]: continue
                a, b = ws[i], ws[j]
                if a[-1] == b[0]: ws[i] = a + b[1:]
                elif a[-1] == b[-1]: ws[i] = a + b[::-1][1:]
                elif a[0] == b[-1]: ws[i] = b + a[1:]
                elif a[0] == b[0]: ws[i] = b[::-1] + a[1:]
                else: continue
                ws[j] = None; changed = True
        ws = [w for w in ws if w]
    return ws
streets = []
for n, (label, pr) in LABELS.items():
    if n not in named: continue
    for a in anchors(merge(named[n])): streets.append([label, pr] + a)

park = ring('Parque General San Martín')
pk_in = [P(a, b) for a, b in park if 0 < P(a, b)[0] < W and 0 < P(a, b)[1] < H]
out = {
    'box': [LAT_TOP, LAT_BOT, LON_W, LON_E], 'size': [W, H], 'kx': KX, 'ky': KY,
    'plazas': {k: centroid('Plaza ' + k) for k in ['Independencia', 'España', 'Italia', 'Chile', 'San Martín']},
    'indep': ring('Plaza Independencia'),
    'park': park,                                            # contorno del Parque San Martín (para la distancia)
    'parkLbl': [round(sum(p[0] for p in pk_in) / len(pk_in) * .4), round(sum(p[1] for p in pk_in) / len(pk_in))] if pk_in else [300, 700],
    'aristides': joined(KEY['aristides']),
    'peatonal': joined(KEY['peatonal']),
    'streets': streets,                                      # [texto, prioridad, x, y, ángulo] en metros del mapa
}
open(os.path.join(ROOT, 'js', 'map-data.js'), 'w', encoding='utf-8').write(
    '/* Generado por src/map/build_map.py — datos © colaboradores de OpenStreetMap */\nwindow.RGM_MAP = ' +
    json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('svg %dx%d' % (W, H), os.path.getsize(os.path.join(ROOT, 'img', 'map-centro.svg')), 'bytes;',
      'map-data', os.path.getsize(os.path.join(ROOT, 'js', 'map-data.js')), 'bytes;', len(streets), 'anclas de calles')
