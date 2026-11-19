"""Actualiza el HTML estático desde el JSON; solo para edición, no para abrir la demo.
Uso: python herramientas/actualizar_agenda.py [ruta/al/AGENDA.json]
"""
from datetime import date
from html import escape as e
from pathlib import Path
from urllib.parse import urlsplit
import json, re, sys
root = Path(__file__).resolve().parents[1]
public = root / 'datos/AGENDA.json'
agenda = json.loads((Path(sys.argv[1]) if len(sys.argv)>1 else public).read_text(encoding='utf-8'))
history = sorted((r for r in agenda['historial'] if r['estado']=='disputado'), key=lambda r:r['inicio'], reverse=True)
public.write_text(json.dumps(dict(fecha_revision=agenda['fecha_revision'],historial=history), ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
months='enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split()
def full(d): return f'{d.day} de {months[d.month-1]} de {d.year}'
def render(r):
    a,b = (date.fromisoformat(r[k]) for k in ('inicio','fin'))
    span = f'{a.day}–{full(b)}' if a!=b and (a.year,a.month)==(b.year,b.month) else f'{full(a)} – {full(b)}' if a!=b else full(a)
    src=r['fuente_url']
    link=f'<a href="{e(src)}">Ver fuente <span aria-hidden="true">↗</span></a>' if urlsplit(src).scheme=='https' else ''
    return f'''<li class="entry" id="{e(r['id'])}"><div><time datetime="{a.isoformat()}">{span}</time><span class="status">Disputado</span></div><div><h3>{e(r['nombre'])}</h3><p class="entry-meta">{e(r['lugar'])} · {e(r['modalidad'] or '')}</p><p>{e(r['nota'])}</p>{link}</div></li>'''
f=root/'index.html'
s=f.read_text(encoding='utf-8')
for name,content in [('corte',full(date.fromisoformat(agenda['fecha_revision']))),('historial','\n'+'\n'.join(map(render,history))+'\n')]:
    s,n=re.subn(fr'(<!--{name}:inicio-->).*?(<!--{name}:fin-->)',lambda m:m[1]+content+m[2],s,count=1,flags=re.S)
    if n!=1: raise SystemExit(f'Falta el marcador {name}')
f.write_text(s,encoding='utf-8')
