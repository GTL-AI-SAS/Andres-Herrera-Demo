"""QA reproducible. Uso opcional: python qa/verificar.py. Requiere Playwright y Chromium.
No se requieren estos programas para usar la página. Capturas en qa/.
"""
from pathlib import Path
import os, threading, base64
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
qa=root/'qa'
url=(root/'index.html').as_uri()
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kw): super().__init__(*args,directory=str(root),**kw)
    def log_message(self,*args): pass
    def do_GET(self):
        if self.path=='/fixture.html':
            payload=b'''<!doctype html><script>window.ready=false;addEventListener('message',e=>{if(e.source===document.querySelector('iframe')?.contentWindow&&e.origin===location.origin&&e.data?.type==='gtl-opening-ready')ready=true});function show(b){const f=document.querySelector('iframe');f.style.visibility=b?'visible':'hidden';f.contentWindow.postMessage({type:'gtl-opening-visibility',visible:b},location.origin)}</script><iframe title="Opcion" src="index.html" width="1000" height="680" style="visibility:hidden"></iframe>'''
            self.send_response(200);self.send_header('Content-Type','text/html');self.end_headers();self.wfile.write(payload)
        else: super().do_GET()
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
memory=os.getenv('QA_MEMORIA')=='1'
html=(root/'index.html').read_text(encoding='utf-8')
if memory:
    html=html.replace('<link rel="stylesheet" href="./assets/estilos.css">','<style>'+(root/'assets/estilos.css').read_text()+'</style>')
    script='<script>'+(root/'assets/motion.js').read_text()+'</script>'
    html=html.replace('<script defer src="./assets/motion.js"></script>','').replace('</body>',script+'</body>')
    photo=base64.b64encode((root/'assets/fotos/AFH-F06.webp').read_bytes()).decode()
    html=html.replace('./assets/fotos/AFH-F06.webp','data:image/webp;base64,'+photo)
def load(page):
    if memory: page.set_content(html,wait_until='load')
    else: page.goto(url)
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path=os.getenv('CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox','--headless=new'])
    print('Chromium',browser.version)
    for label,w,h in [('escritorio',1440,900),('movil',390,780),('estrecho',320,640)]:
        page=browser.new_page(viewport={'width':w,'height':h})
        errors=[]; page.on('pageerror',lambda error:errors.append(str(error)))
        load(page); page.wait_for_function('document.querySelector("#foto-hero").naturalWidth === 1440')
        assert page.evaluate('document.documentElement.scrollWidth === innerWidth')
        assert page.locator('.entry').count()==2
        assert page.locator('#AFH-A01, #AFH-A02').count()==0
        assert page.locator('#foto-hero').evaluate('(i) => Math.abs(i.getBoundingClientRect().height - i.getBoundingClientRect().width) < 1 && i.getBoundingClientRect().top<innerHeight')
        page.wait_for_timeout(760)
        page.screenshot(path=qa/f'hero-{label}.png')
        if label=='escritorio': page.screenshot(path=qa/'pagina-escritorio.png',full_page=True)
        page.keyboard.press('Tab'); assert page.evaluate('document.activeElement.className')=='skip'
        for name,anchor in [('Ver agenda','#agenda'),('Ver apoyo en encordado','#colaboracion')]:
            link=page.get_by_role('link',name=name,exact=False); assert link.get_attribute('href')==anchor and page.locator(anchor).count()==1
            if not memory:
                link.click(); assert page.evaluate('location.hash')==anchor
        assert not errors,errors
        print(label,'foto, agenda, anclas, teclado, sin desborde y sin errores')
        page.close()
    for opts in [dict(reduced_motion='reduce'),dict(java_script_enabled=False)]:
        page=browser.new_page(viewport={'width':390,'height':780},**opts);load(page)
        assert page.locator('.record').count()==3 and page.locator('.entry').count()==2
        assert page.locator('#foto-hero').evaluate('(i)=>i.complete&&i.naturalWidth>0')
        assert page.evaluate('document.getAnimations().length')==0
        print(opts,'contenido completo, sin animación');page.close()
    page=browser.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce'); load(page)
    page.evaluate('document.body.style.zoom="200%"'); assert page.evaluate('document.documentElement.scrollWidth===innerWidth'); print('Zoom de contenido 200%, sin desborde');page.close()
    # Capturamos los cuadros del timeline WAAPI del propio sitio (no reconstrucciones).
    page=browser.new_page(viewport={'width':1440,'height':900})
    hook='''window.samples=[]; {const a=Element.prototype.animate; Element.prototype.animate=function(...args){const x=a.apply(this,args);x.pause();x.currentTime=0;window.samples.push(x);return x}}'''
    if memory: page.evaluate('()=>{'+hook+'}')
    else: page.add_init_script(hook)
    load(page);page.wait_for_function('samples.length===2')
    for ms in (0,300,720):
        page.evaluate('(t)=>samples.slice(0,2).forEach(a=>a.currentTime=t)',ms)
        page.screenshot(path=qa/f'opening-{ms:03}.png')
    page.evaluate('samples.slice(0,2).forEach(a=>a.finish()); window.scrollTo(0,document.querySelector("#modalidades").offsetTop-20)')
    page.wait_for_function('samples.length===8')
    for ms in (0,260,540):
        page.evaluate('(t)=>samples.slice(2).forEach(a=>a.currentTime=t)',ms)
        page.screenshot(path=qa/f'posthero-{ms:03}.png')
    print('Secuencias capturadas desde WAAPI, 2 láminas y 6 tiras');page.close()
    if memory:
        print('En memoria: iframe HTTP y navegación real por anclas no probados');browser.close();server.shutdown();raise SystemExit(0)
    page=browser.new_page(viewport={'width':1200,'height':800})
    page.goto(base+'/fixture.html');page.wait_for_function('ready')
    frame=page.frames[1]
    frame.wait_for_function('document.querySelector("#foto-hero").naturalWidth===1440')
    assert frame.evaluate('document.getAnimations().length')==0
    # Una ventana distinta del padre no puede autorizar el opening.
    frame.evaluate('window.postMessage({type:"gtl-opening-visibility",visible:true},location.origin)');page.wait_for_timeout(50)
    assert frame.evaluate('document.getAnimations().length')==0
    page.evaluate('show(true)');frame.wait_for_function('document.getAnimations().length===2')
    page.evaluate('show(false)');frame.wait_for_function('document.getAnimations().length===0')
    page.evaluate('show(true)');page.wait_for_timeout(100);assert frame.evaluate('document.getAnimations().length')==0
    print('Iframe de prueba HTTP: ready, oculto sin motion, emisor incorrecto rechazado, activación, cancelación, sin repetición');page.close()
    browser.close()
server.shutdown()
