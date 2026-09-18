import re, os
HERE=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(HERE)
c=open(os.path.join(HERE,'content.html')).read()
HEAD_END=c.index('<div class="rgm-page"')
head=c[:HEAD_END]
def section(start_marker,end_marker):
    a=c.index(start_marker); b=c.index(end_marker,a); return c[a:b]
nav=section('  <!-- ============ NAV ============ -->','  <main id="top">')
contact_faq=section('    <!-- ============ CONTACTO ============ -->','  </main>')
tail=c[c.index('  </main>'):]
# props page: links back to home use ./
def home_links(s):
    s=re.sub(r'href="#(experiencias|faq|top)"',r'href="./#\1"',s)
    return s
pnav=home_links(nav).replace('href="./#top" class="logo"','href="./" class="logo"')
ptail=home_links(tail).replace('href="./#top" class="logo logo--footer"','href="./" class="logo logo--footer"')
phead=head.replace('<title>RGM Experiences</title>','<title>Departamentos · RGM Experiences</title>')
props=phead+'<div class="rgm-page" data-page="props">\n\n'+pnav+open(os.path.join(HERE,'props-main.html')).read()+'\n'+contact_faq+ptail
home=head+re.sub(r'<div class="rgm-page"[^>]*>','<div class="rgm-page" data-page="home">',c[HEAD_END:],count=1)
open(os.path.join(HERE,'content.html'),'w').write(home)
def full(frag):
    i=frag.index('<div class="rgm-page"')
    return ('<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
     '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Crect width=%2232%22 height=%2232%22 rx=%226%22 fill=%22%233d1a22%22/%3E%3Cpath d=%22M4 22 L12 12 L16 16 L21 9 L28 22%22 fill=%22none%22 stroke=%22%23d9b98a%22 stroke-width=%222%22/%3E%3C/svg%3E">\n'
     +frag[:i]+'</head>\n<body>\n'+frag[i:]+'</body>\n</html>\n')
open(os.path.join(ROOT,'index.html'),'w').write(full(home))
open(os.path.join(ROOT,'propiedades.html'),'w').write(full(props))
print('ok', props.count('data-contact'), props.count('data-faq'), home.count('data-page="home"'))
