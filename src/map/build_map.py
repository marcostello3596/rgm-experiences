"""Mapa ilustrado del centro de Mendoza para la home.
Lee src/map/centro-osm.json (calles, plazas y parques de OpenStreetMap, © colaboradores de OSM)
y genera:
  img/map-centro.svg  → base del mapa (manzanas, calles, plazas, parques). Sin textos.
  js/map-data.js      → proyección + puntos de referencia (plazas, peatonal, Arístides) para dibujar
                        etiquetas y los pines de los departamentos en la página.
Uso: python3 src/map/build_map.py"""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
data = json.load(open(os.path.join(HERE, 'centro-osm.json'), encoding='utf-8'))

# Proyección equirectangular en metros (suficiente para 3 km)
LAT_TOP, LAT_BOT, LON_W, LON_E = -32.8820, -32.9030, -68.8650, -68.8330
KX = math.cos(math.radians((LAT_TOP + LAT_BOT) / 2)) * 111320
KY = 110574
W = round((LON_E - LON_W) * KX)
H = round((LAT_TOP - LAT_BOT) * KY)
def P(lat, lon): return ((lon - LON_W) * KX, (LAT_TOP - lat) * KY)
def path(pts, close=False):
    xy = [P(a, b) for a, b in pts]
    s = 'M' + ' L'.join('%d %d' % (round(x), round(y)) for x, y in xy)
    return s + ('Z' if close else '')

ROAD = {  # clase OSM → (grupo, ancho en metros)
    'trunk': ('major', 15), 'primary': ('major', 14), 'primary_link': ('major', 10),
    'secondary': ('mid', 11), 'secondary_link': ('mid', 8), 'tertiary': ('mid', 10), 'tertiary_link': ('mid', 7),
    'residential': ('minor', 8), 'unclassified': ('minor', 8), 'living_street': ('minor', 6),
    'service': ('lane', 4), 'pedestrian': ('walk', 6), 'footway': ('foot', 1.8), 'path': ('foot', 1.8),
}
groups = {}
parks, squares = [], []
KEY = {'aristides': [], 'peatonal': [], 'sanmartin_av': []}
for e in data:
    t = e['t']
    if e['k'] == 'w':
        g = e['g']
        if t.get('highway') in ROAD:
            grp, w = ROAD[t['highway']]
            groups.setdefault(grp, []).append(path(g))
            n = t.get('name', '')
            if n == 'Arístides Villanueva': KEY['aristides'].append(g)
            if n == 'Sarmiento' and t['highway'] == 'pedestrian': KEY['peatonal'].append(g)
            if n == 'Avenida General San Martín': KEY['sanmartin_av'].append(g)
        elif t.get('leisure') in ('park', 'garden') or t.get('place') == 'square':
            if len(g) > 2 and g[0] == g[-1]:
                (squares if (t.get('name', '').startswith('Plaza ') or t.get('place') == 'square') else parks).append(path(g, True))
    else:
        for m in e['m']:
            g = m['g']
            if m['r'] == 'outer' and len(g) > 2:
                parks.append(path(g, g[0] == g[-1]))

STYLE = {'major': ('#fbf7f0', 14), 'mid': ('#fbf7f0', 10), 'minor': ('#f8f3ea', 7.5), 'lane': ('#f5efe5', 4),
         'walk': ('#f8f3ea', 6), 'foot': ('#cbbfae', 1.6)}
svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d">' % (W, H, W, H),
       '<rect width="%d" height="%d" fill="#e6ddd0"/>' % (W, H),
       '<path d="%s" fill="#d9d4c1"/>' % ' '.join(parks),
       '<path d="%s" fill="#cfcbb4"/>' % ' '.join(squares)]
for grp in ('lane', 'minor', 'mid', 'major', 'walk', 'foot'):
    if grp in groups:
        col, w = STYLE[grp]
        svg.append('<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round"/>' % (' '.join(groups[grp]), col, w))
svg.append('</svg>')
open(os.path.join(ROOT, 'img', 'map-centro.svg'), 'w', encoding='utf-8').write(''.join(svg))

# Puntos de referencia para la página
def centroid(name):
    for e in data:
        if e['k'] == 'w' and e['t'].get('name') == name:
            g = e['g']; return [round(sum(p[0] for p in g) / len(g), 5), round(sum(p[1] for p in g) / len(g), 5)]
def joined(ways):
    # une los tramos en una sola polilínea ordenada de este a oeste (para el texto a lo largo de la calle)
    pts = [p for g in ways for p in g]
    pts = sorted(set(map(tuple, pts)), key=lambda p: -p[1])
    return [list(p) for p in pts]
out = {
    'box': [LAT_TOP, LAT_BOT, LON_W, LON_E], 'size': [W, H], 'kx': KX, 'ky': KY,
    'plazas': {k: centroid('Plaza ' + k) for k in ['Independencia', 'España', 'Italia', 'Chile', 'San Martín']},
    'parque': [-32.8905, -68.8640],
    'aristides': joined(KEY['aristides']),
    'peatonal': joined(KEY['peatonal']),
}
open(os.path.join(ROOT, 'js', 'map-data.js'), 'w', encoding='utf-8').write(
    '/* Generado por src/map/build_map.py — datos © colaboradores de OpenStreetMap */\nwindow.RGM_MAP = ' +
    json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('svg', W, H, os.path.getsize(os.path.join(ROOT, 'img', 'map-centro.svg')), 'bytes')
