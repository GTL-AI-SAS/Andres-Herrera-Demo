"""Regenera el historial estático con Python estándar; el navegador no lo necesita."""
from pathlib import Path
import json, re
from html import escape as e
from datetime import date

root = Path(__file__).resolve().parents[1]
agenda = json.loads((root / 'datos/agenda.json').read_text())
months = 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split()
def textdate(d):
    return f'{d.day} de {months[d.month-1]} de {d.year}'

events = []
for x in agenda['historial']:
    if x['estado'] != 'disputado':
        continue
    a,b = (date.fromisoformat(x[k]) for k in ('inicio','fin'))
    start = f'<time datetime="{a}">{a.day if a != b and a.month == b.month and a.year == b.year else textdate(a)}</time>'
    period = start if a == b else f'{start}–<time datetime="{b}">{textdate(b)}</time>'
    events.append(f'''<article class="event" data-id="{e(x['id'])}">
<div><p class="eyebrow">{period}</p><small>Disputado · {e(x['modalidad'])}</small></div>
<div><h3>{e(x['nombre'])}</h3><small>{e(x['lugar'])}</small><p>{e(x['nota'])} <a href="{e(x['fuente_url'])}">Fuente del registro ↗</a></p></div>
</article>''')
path = root / 'index.html'
html = path.read_text()
cut = date.fromisoformat(agenda['fecha_revision'])
html = re.sub(r'(Corte: )<time[^>]*>[^<]*</time>',rf'\1<time datetime="{cut}">{textdate(cut)}</time>',html)
html = re.sub(r'(<!-- agenda:inicio -->).*?(<!-- agenda:fin -->)',lambda m: m[1]+'\n'+'\n'.join(events)+'\n'+m[2],html,flags=re.S)
path.write_text(html)
