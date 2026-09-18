"""Genera las páginas estáticas a partir de content.html (home + partes compartidas):
   index.html                      → home
   propiedades/index.html          → listado      (base ../)
   propiedades/<slug>/index.html   → cada depto   (base ../../)
   propiedades.html                → redirección a propiedades/ (links viejos)
Uso: python3 build.py"""
import re, os
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.environ.get('RGM_SRC', HERE)      # carpeta de content.html / *-main.html
OUT = os.environ.get('RGM_OUT', os.path.dirname(HERE) if os.path.basename(HERE) == 'src' else HERE)  # raíz del sitio
rd = lambda n: open(os.path.join(SRC, n), encoding='utf-8').read()
c = rd('content.html')
HEAD_END = c.index('<div class="rgm-page"')
head = c[:HEAD_END]
def section(a_m, b_m):
    a = c.index(a_m); b = c.index(b_m, a); return c[a:b]
nav = section('  <!-- ============ NAV ============ -->', '  <main id="top">')
contact_faq = section('    <!-- ============ CONTACTO ============ -->', '  </main>')
faq_only = section('    <!-- ============ FAQ ============ -->', '  </main>')
tail = c[c.index('  </main>'):]
def home_links(s):
    return re.sub(r'href="#(experiencias|faq|top|contacto)"', r'href="./#\1"', s)
subnav = home_links(nav).replace('href="./#top" class="logo"', 'href="./" class="logo"')
subtail = home_links(tail).replace('href="./#top" class="logo logo--footer"', 'href="./" class="logo logo--footer"')
ICON = ('<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 rx=%226%22 fill=%22%233d1a22%22/%3E%3Cpath d=%22M4 22 L12 12 L16 16 L21 9 L28 22%22 fill=%22none%22 stroke=%22%23d9b98a%22 stroke-width=%222%22/%3E%3C/svg%3E">\n')
def full(frag, base=''):
    i = frag.index('<div class="rgm-page"')
    b = '<base href="%s">\n' % base if base else ''
    return ('<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + b + ICON + frag[:i] + '</head>\n<body>\n' + frag[i:] + '</body>\n</html>\n')
def write(rel, txt):
    p = os.path.join(OUT, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(txt)

# Home
home = head + re.sub(r'<div class="rgm-page"[^>]*>', '<div class="rgm-page" data-page="home">', c[HEAD_END:], count=1)
write('index.html', full(home))

# Listado
phead = head.replace('<title>RGM Experiences</title>', '<title>Departamentos · RGM Experiences</title>')
props = phead + '<div class="rgm-page" data-page="props">\n\n' + subnav + rd('props-main.html') + '\n' + contact_faq + subtail
write('propiedades/index.html', full(props, '../'))

# Fichas de departamentos
data = open(os.path.join(OUT, 'js', 'data.js'), encoding='utf-8').read()
apts = re.findall(r"slug: '([^']+)', name: '([^']+)', zone: '([^']+)'", data)
for slug, name, zone in apts:
    h = head.replace('<title>RGM Experiences</title>', '<title>Depto %s en %s · RGM Experiences</title>' % (name, zone))
    page = h + '<div class="rgm-page" data-page="apt" data-slug="%s">\n\n' % slug + subnav + rd('apt-main.html') + '\n' + faq_only + subtail
    write('propiedades/%s/index.html' % slug, full(page, '../../'))

# Fichas de experiencias
exps = re.findall(r"slug: '([^']+)', img: '[^']+',\n\s+name: \{ es: '([^']+)'", data)
for slug, name in exps:
    h = head.replace('<title>RGM Experiences</title>', '<title>%s · Experiencias en Mendoza · RGM Experiences</title>' % name)
    page = h + '<div class="rgm-page" data-page="exp" data-slug="%s">\n\n' % slug + subnav + rd('exp-main.html') + '\n' + faq_only + subtail
    write('experiencias/%s/index.html' % slug, full(page, '../../'))

# Redirección de la URL vieja
write('propiedades.html', '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>RGM Experiences</title>'
      '<script>location.replace("propiedades/" + location.search);</script>'
      '<meta http-equiv="refresh" content="0; url=propiedades/"></head><body></body></html>\n')
print('ok:', 'index, propiedades/,', ', '.join(s for s, _, _ in apts), '| experiencias:', ', '.join(s for s, _ in exps))
