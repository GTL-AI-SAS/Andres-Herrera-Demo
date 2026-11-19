"""Regenera solo los bloques estáticos de agenda. Python 3, sin dependencias."""
from pathlib import Path
import json, re
from html import escape as e
from datetime import date

root = Path(__file__).resolve().parent.parent
data = json.loads((root/'datos/AGENDA.json').read_text(encoding='utf-8'))
months = 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split()
def dt(x):
    d = date.fromisoformat(x)
    return f'{d.day} de {months[d.month-1]} de {d.year}'
def time(x, label=None):
    return f'<time datetime="{e(x)}">{label or dt(x)}</time>'

rows = []
for a in sorted(data['historial'], key=lambda a:a['inicio'], reverse=True):
    if a['estado'] != 'disputado':
        continue
    s,f = a['inicio'],a['fin']
    period = time(s) if s == f else time(s, str(int(s[-2:]))) + '–' + time(f) if s[:7] == f[:7] else time(s) + ' – ' + time(f)
    rows.append(f'''    <article id="{e(a['id'])}">
      <p class="label">{period} · Disputado</p>
      <h3>{e(a['nombre'])}</h3>
      <p>{e(a['lugar'])} · {e(a['modalidad'] or '')}</p>
      <p>{e(a['nota'])}</p>
    </article>''')
path = root/'index.html'
s = path.read_text(encoding='utf-8')
for tag, html in [('corte',f'  <p>Corte: {time(data["fecha_revision"])}.</p>'), ('agenda','\n'.join(rows))]:
    s = re.sub(rf'(<!-- {tag}:start -->).*?(<!-- {tag}:end -->)', lambda m:m[1]+'\n'+html+'\n'+m[2],s,flags=re.S)
path.write_text(s,encoding='utf-8')
