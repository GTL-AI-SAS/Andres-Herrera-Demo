"""QA reproducible de un ZIP: Python 3, Playwright y Chromium.
Prueba navegación directa; con --inline usa transporte local alternativo
(set_content + recursos embebidos) para entornos con navegación bloqueada.
"""
import argparse, base64, re, shutil, tempfile, zipfile
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('zip',type=Path)
parser.add_argument('salida',type=Path)
parser.add_argument('--inline',action='store_true')
args = parser.parse_args()
args.salida.mkdir(exist_ok=True,parents=True)
with tempfile.TemporaryDirectory() as tmp, sync_playwright() as pw:
    root = Path(tmp)
    with zipfile.ZipFile(args.zip) as z: z.extractall(root)
    index = root/'index.html'
    html = index.read_text(encoding='utf-8')
    for url in re.findall(r'(?:href|src)="(assets/[^"\s]+)"',html): assert (root/url).is_file(), url
    def inline(broken=False):
        s = html.replace('<link rel="stylesheet" href="assets/estilo.css">','<style>'+(root/'assets/estilo.css').read_text()+'</style>')
        s = s.replace('<script src="assets/motion.js" defer></script>','')
        s = s.replace('</body>','<script>'+(root/'assets/motion.js').read_text()+'</script></body>')
        for name in ('AFH-F05','AFH-F01'):
            data = (root/f'assets/fotos/{name}.webp').read_bytes()
            if broken and name=='AFH-F05': data = b'foto no disponible'
            s = s.replace(f'assets/fotos/{name}.webp','data:image/webp;base64,'+base64.b64encode(data).decode())
        return s
    browser = pw.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
    print('Chromium',browser.version)
    dims = {'escritorio':(1440,900),'movil':(390,780),'estrecho':(320,568)}
    opening = "document.getAnimations().filter(a => a.effect.target.matches('.plate img,.fields i'))"
    pair = "document.getAnimations().filter(a => a.effect.target.matches('.record,.names i'))"
    def load(page):
        if args.inline: page.set_content(inline(), wait_until='load')
        else: page.goto(index.as_uri())
    def assert_layout(page):
        assert page.evaluate('document.documentElement.scrollWidth === innerWidth')
        assert page.locator('#foto').evaluate('i=>i.complete && i.naturalWidth===1890 && i.naturalHeight===1395')
        assert page.locator('#pie-foto').inner_text().endswith('Santa Fe 2026')
        assert page.locator('.timeline article').evaluate_all('a=>a.map(x=>x.id)') == ['AFH-A03','AFH-A04']
    def frames(page, scene, times, label, section=None):
        page.wait_for_function(scene+'.length===4',timeout=3000)
        page.evaluate(f'window.qa={scene}; qa.forEach(a=>a.pause())')
        if section:
            target=page.locator(section)
            target.evaluate('e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-12)')
        for i,t in enumerate(times):
            page.evaluate('(t)=>qa.forEach(a=>a.currentTime=t)',t)
            shot=args.salida/f'{label}-{i}-{t}ms.png'
            if section and page.locator(section).bounding_box()['height']<page.viewport_size['height']-20: page.locator(section).screenshot(path=shot)
            else: page.screenshot(path=shot)
        page.evaluate('qa.forEach(a=>a.finish())')
    for device,(width,height) in dims.items():
        page=browser.new_page(viewport={'width':width,'height':height})
        errors=[]
        page.on('pageerror',lambda error:errors.append(str(error)))
        load(page)
        assert_layout(page)
        if device!='estrecho':
            frames(page,opening,[0,300,620 if width==390 else 740],f'{device}-O')
            page.screenshot(path=args.salida/f'hero-{device}.png')
            page.locator('#duplas').evaluate('e=>e.scrollIntoView()')
            frames(page,pair,[0,250,650],f'{device}-P','#duplas')
            page.evaluate('window.scrollTo(0,0)'); page.wait_for_timeout(70)
            page.locator('#duplas').evaluate('e=>e.scrollIntoView()'); page.wait_for_timeout(100)
            assert page.evaluate(f'{pair}.length === 0')
        else: page.screenshot(path=args.salida/'hero-estrecho.png')
        assert not errors, errors
        page.close()
        page=browser.new_page(viewport={'width':width,'height':height})
        load(page)
        page.keyboard.press('Tab'); assert page.evaluate("document.activeElement.matches('.skip')")
        page.keyboard.press('Tab'); assert page.evaluate("document.activeElement.hash==='#agenda'")
        page.keyboard.press('Tab'); assert page.evaluate("document.activeElement.hash==='#cancha'")
        for href in ('#agenda','#cancha'):
            page.locator(f'.actions a[href="{href}"]').click()
            assert page.evaluate('location.hash')==href
        assert not errors, errors
        print(device,'foto, ancho, agenda, anclas y foco correctos')
        page.close()
    for options in ({'java_script_enabled':False},{'reduced_motion':'reduce'}):
        page=browser.new_page(viewport={'width':390,'height':780},**options)
        load(page); assert_layout(page)
        assert page.evaluate('document.getAnimations().length===0')
        assert 'Matías Knudsen' in page.locator('#duplas').inner_text()
        print('Estado final sin animación:',options); page.close()
    page=browser.new_page(viewport={'width':320,'height':568},reduced_motion='reduce')
    load(page); page.evaluate("document.documentElement.style.fontSize='200%'"); assert_layout(page)
    print('Texto al 200% sin desbordamiento horizontal a 320 px'); page.close()
    page=browser.new_page()
    if args.inline:
        page.set_content(inline(broken=True),wait_until='load')
    else:
        (root/'assets/fotos/AFH-F05.webp').unlink(); load(page)
    page.wait_for_function("document.querySelector('#foto').naturalWidth===522")
    assert 'IDRD' in page.locator('#credito').inner_text()
    assert page.evaluate(opening+'.length===0')
    print('F05 fallida: F01 decodificada, pie y crédito sincronizados, opening omitido')
    page.close()
    if args.inline:
        page=browser.new_page(viewport={'width':1440,'height':900})
        page.set_content('<style>body{margin:0}iframe{width:100%;height:890px;border:0}</style><iframe title="Prueba del protocolo"></iframe>')
        page.evaluate('''html=>{
          const f=document.querySelector('iframe');
          window.ready=false;
          addEventListener('message',e=>{if(e.source===f.contentWindow && e.data?.type==='gtl-opening-ready')window.ready=true});
          window.signal=(v)=>f.contentWindow.postMessage({type:'gtl-opening-visibility',visible:v},'*');
          f.srcdoc=html;
        }''',inline())
        page.wait_for_function('window.ready')
        frame=page.frames[1]
        assert frame.evaluate('document.getAnimations().length===0')
        # Un mensaje sintético con otra ventana u otro origen no abre la escena.
        frame.evaluate('''()=>{
          const data={type:'gtl-opening-visibility',visible:true};
          dispatchEvent(new MessageEvent('message',{data,origin:'null',source:window}));
          dispatchEvent(new MessageEvent('message',{data,origin:'https://otro.invalid',source:parent}));
        }''')
        page.wait_for_timeout(100)
        assert frame.evaluate('document.getAnimations().length===0')
        page.evaluate('signal(true)'); frame.wait_for_function(opening+'.length===4')
        assert frame.evaluate(pair+'.length===0')
        # Salir del área del díptico antes de terminar el opening.
        frame.evaluate("document.body.style.paddingBottom=innerHeight+'px'; document.querySelector('#agenda').scrollIntoView()")
        frame.wait_for_function(opening+'.length===0'); assert frame.evaluate(pair+'.length===0')
        frame.evaluate("document.querySelector('#duplas').scrollIntoView()")
        frame.wait_for_function(pair+'.length===4')
        page.evaluate('signal(false)'); frame.wait_for_function('document.getAnimations().length===0')
        page.evaluate('signal(true)'); page.wait_for_timeout(150)
        assert frame.evaluate('document.getAnimations().length===0')
        print('Marco simulado: ready, origen/ventana rechazados, activación única, espera y reentrada del post-hero, cancelación al ocultar')
