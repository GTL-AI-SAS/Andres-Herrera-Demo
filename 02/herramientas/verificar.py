"""QA opcional: pip install playwright; CHROMIUM=/usr/bin/chromium python herramientas/verificar.py."""
from pathlib import Path
import os, json, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[1]
qa = Path(os.getenv('AFH_QA', root / 'qa')); qa.mkdir(exist_ok=True)
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler,directory=root))
threading.Thread(target=server.serve_forever, daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
checks=[]
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
    for label,w,h in [('escritorio',1440,900),('movil',390,780),('estrecho',320,740)]:
        p=browser.new_page(viewport={'width':w,'height':h})
        errors=[]; p.on('pageerror',lambda err:errors.append(str(err)))
        p.add_init_script('''window.qaSeen=[]; const run=Element.prototype.animate; Element.prototype.animate=function(...args){const a=run.apply(this,args);window.qaSeen.push(a);a.pause();a.currentTime=0;return a};''')
        p.goto(base+'/index.html')
        p.wait_for_function('document.getAnimations().some(a=>a.id==="afh-portada")')
        assert p.locator('#retrato').evaluate('async i => {await i.decode();return i.naturalWidth===522 && i.naturalHeight===599 && i.currentSrc.endsWith("/assets/fotos/AFH-F01.webp")}')
        assert p.evaluate('document.documentElement.scrollWidth === innerWidth')
        if label=='movil': assert p.locator('figcaption').bounding_box()['y']+p.locator('figcaption').bounding_box()['height']<=h
        if label!='estrecho':
            for t in (0,330,720):
                p.evaluate('(t)=>document.getAnimations().forEach(a=>a.currentTime=t)',t)
                p.screenshot(path=qa/f'{label}-portada-{t:03}.png', animations='allow')
        p.locator('#registro').scroll_into_view_if_needed()
        assert p.evaluate('qaSeen.every(a=>a.id!=="afh-registro")')
        p.evaluate('document.getAnimations().forEach(a=>a.finish())')
        p.wait_for_function('document.getAnimations().some(a=>a.id==="afh-registro")')
        if label!='estrecho':
            p.locator('#fragmento').scroll_into_view_if_needed()
            for t in (0,300,650):
                p.evaluate('(t)=>document.getAnimations().forEach(a=>a.currentTime=t)',t)
                p.locator('.fragment').screenshot(path=qa/f'{label}-registro-{t:03}.png', animations='allow')
        p.evaluate('document.getAnimations().forEach(a=>a.finish())')
        p.evaluate('scrollTo(0,0)')
        p.locator('#registro').scroll_into_view_if_needed()
        assert p.evaluate('qaSeen.filter(a=>a.id==="afh-registro").length===3')
        assert p.locator('.event').evaluate_all('nodes=>nodes.map(x=>x.dataset.id)')==['AFH-A03','AFH-A04']
        p.get_by_role('link',name='Ver agenda',exact=True).click(); assert p.evaluate('location.hash')=='#agenda'
        p.get_by_role('link',name='Ver apoyo en pasajes',exact=True).click(); assert p.evaluate('location.hash')=='#pasajes'
        assert not errors, errors
        checks.append(f'{label}: fotografía 522×599, opening y post, anclas, historial, sin errores JS ni desborde')
        p.close()
    for js,reduce in [(False,'no-preference'),(True,'reduce')]:
        p=browser.new_page(viewport={'width':320,'height':740},java_script_enabled=js,reduced_motion=reduce)
        p.goto(base+'/index.html')
        p.add_style_tag(content='html{font-size:200%}')
        assert p.evaluate('document.documentElement.scrollWidth === innerWidth')
        assert p.evaluate('document.getAnimations().length===0')
        assert p.locator('.event').count()==2 and p.locator('#retrato').is_visible()
        p.keyboard.press('Tab'); assert p.locator(':focus-visible').count()==1
        p.keyboard.press('Tab'); p.keyboard.press('Enter'); assert p.evaluate('location.hash')=='#agenda'
        checks.append(f'320 px, texto 200 %, JS {js}, movimiento {reduce}: estado estático, sin desborde y teclado')
        p.close()
    p=browser.new_page(viewport={'width':1440,'height':900})
    p.goto(base+'/index.html')
    p.evaluate('''() => {
        document.body.replaceChildren();window.ready=0;
        const f=document.createElement('iframe'); f.style='width:100%;height:850px'; f.src='/index.html'; f.hidden=true;
        window.addEventListener('message', e=>{if(e.source===f.contentWindow && e.origin===location.origin && e.data?.type==='gtl-opening-ready')window.ready++});
        document.body.append(f);
    }''')
    p.wait_for_function('ready===1')
    frame=p.frames[1]
    frame.wait_for_function('document.querySelector("img").complete')
    assert frame.evaluate('document.getAnimations().length===0')
    frame.evaluate('window.postMessage({type:"gtl-opening-visibility",visible:true},location.origin)')
    p.evaluate('document.querySelector("iframe").hidden=false')
    assert frame.evaluate('document.getAnimations().length===0')
    p.evaluate('''document.querySelector('iframe').contentWindow.postMessage({type:'gtl-opening-visibility',visible:true},location.origin)''')
    frame.wait_for_function('document.getAnimations().some(a=>a.id==="afh-portada")')
    p.evaluate('''document.querySelector('iframe').contentWindow.postMessage({type:'gtl-opening-visibility',visible:false},location.origin)''')
    frame.wait_for_function('document.getAnimations().filter(a=>a.id==="afh-portada").every(a=>a.playState==="paused")')
    p.evaluate('''document.querySelector('iframe').contentWindow.postMessage({type:'gtl-opening-visibility',visible:true},location.origin)''')
    frame.wait_for_function('!document.getAnimations().some(a=>a.id==="afh-portada")')
    p.evaluate('''for(const visible of [false,true]) document.querySelector('iframe').contentWindow.postMessage({type:'gtl-opening-visibility',visible},location.origin)''')
    assert frame.evaluate('!document.getAnimations().some(a=>a.id==="afh-portada")')
    checks.append('iframe HTTP: ready, espera, rechazo de ventana incorrecta, pausa, reanudación y no repetición')
    p.close()
    # Carga real sin instrumentación: la transición directa debe arrancar y resolver sola.
    p=browser.new_page(viewport={'width':1440,'height':900})
    p.goto(base+'/index.html',wait_until='domcontentloaded')
    p.wait_for_function('document.getAnimations().some(a=>a.id==="afh-portada")')
    p.wait_for_function('!document.getAnimations().some(a=>a.id==="afh-portada")')
    p.locator('#registro').scroll_into_view_if_needed()
    p.wait_for_function('document.getAnimations().some(a=>a.id==="afh-registro")')
    p.wait_for_function('!document.getAnimations().some(a=>a.id==="afh-registro")')
    checks.append('carga directa sin instrumentación: ambos movimientos arrancan y terminan')
    browser.close()
(qa/'resultado.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n')
print('\n'.join(checks))
