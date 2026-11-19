const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=process.argv[2] || path.resolve(__dirname,'../..');
const code=f=>fs.readFileSync(path.join(root,f),'utf8');
const opts=['01','02','03'];

function setup(protocol, {reduced=false, hash='', delayPhoto=null, standalone=null}={}) {
  const origin=protocol==='file:'?'null':'http://localhost:8000';
  const timers=new Map(), events=[], rafs=new Map(), logs=[], children=new Map();
  let uid=0, observer, stage='init';
  function signal(){if(observer) events.push(() => observer());}
  class E {
    constructor(tag='', id='') {
      this.tag=tag;this.id=id;this.children=[];this.attrs=new Map();this.events=new EventTarget();
      this.classes=new Set();this.classList={add:(...c)=>c.forEach(x=>this.classes.add(x)),remove:(...c)=>c.forEach(x=>this.classes.delete(x)),contains:c=>this.classes.has(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};
      this.style={setProperty(){}};this.hidden=false;this.width=300;
      this.dataset=new Proxy({}, {set(o,k,v){o[k]=v;if(k==='openingDemo')signal();return true;},deleteProperty(o,k){delete o[k];signal();return true;}});
    }
    setAttribute(k,v){this.attrs.set(k,v);}
    getAttribute(k){return this.attrs.get(k)??null;}
    removeAttribute(k){this.attrs.delete(k);}
    hasAttribute(k){return this.attrs.has(k);}
    addEventListener(t,f){this.events.addEventListener(t,f);}
    removeEventListener(t,f){this.events.removeEventListener(t,f);}
    emit(t,props={}){const event=Object.assign(new Event(t),props);Object.defineProperty(event,'target',{value:this});this.events.dispatchEvent(event);}
    append(...children){children.forEach(c=>{c.parentElement=this;this.children.push(c);});}
    remove(){if(this.parentElement){const sibs=this.parentElement.children;sibs.splice(sibs.indexOf(this),1);}}
    getBoundingClientRect(){return {left:0,top:20,right:300,bottom:400,width:300,height:380};}
    get className(){return [...this.classes].join(' ');}
    set className(v){this.classes=new Set(v.split(' '));}
    focus(){}
    pause(){}
    play(){return Promise.resolve();}
    click(){this.emit('click',{button:0});}
  }
  const doc=new E('document'), global=new E('window'), body=new E('body'), welcome=new E('section'), hub=new E('main'), start=new E('a'), film=new E('video'), aperture=new E('figure'), selector=new E('div');
  hub.hidden=true;
  const frames=opts.map(id=>new E('iframe','frame-'+id)), buttons=opts.map(id=>new E('button','tab-'+id));
  for(const [i,f] of frames.entries()) {
    const id=opts[i];
    const button=buttons[i];
    button.setAttribute('aria-controls',f.id);
    button.setAttribute('aria-selected',String(i===0));
    button.dataset.demo=id;
    f.dataset.src=id+'/index.html';
    f.contentWindow={postMessage(data,to){
      assert.equal(to,protocol==='file:'?'*':origin);
      events.push(()=>{logs.push({kind:'bridge',id,data,stage});children.get(id)?.global.emit('message',{data,source:parentEndpoint,origin});});
    }};
    Object.defineProperty(f,'src',{set(url){f.setAttribute('src',url);child(id);}});
  }
  doc.body=body;
  doc.visibilityState='visible';
  doc.getElementById=id=>({'bienvenida':welcome,'empezar-demo':start,'brand-film':film,'demo-aperture':aperture}[id]||[...frames,...buttons].find(e=>e.id===id));
  doc.querySelector=s=>({'.hub':hub,'.switch':selector}[s]);
  doc.querySelectorAll=s=>s==='.switch button'?buttons:[];
  hub.querySelectorAll=s=>s==='.stage iframe'?frames:[];
  const matchMedia=()=>({matches:reduced,addEventListener(){}});
  const location={protocol,origin,hash};
  const parentEndpoint={};
  const parentEnv={
    document:doc,location,matchMedia,innerWidth:1280,innerHeight:800,
    history:{pushState(_,__,url){location.hash=url;},replaceState(_,__,url){location.hash=url;}},
    addEventListener:global.addEventListener.bind(global),
    MutationObserver:class{constructor(fn){observer=fn;}observe(){}},
    setTimeout(fn,ms){timers.set(++uid,{fn,ms});return uid;},
    clearTimeout(id){timers.delete(id);}
  };
  parentEnv.window=parentEnv;
  const parent=vm.createContext(parentEnv);
  function child(id) {
    if(children.has(id))return children.get(id);
    const f=frames[opts.indexOf(id)], document=new E('document'), global=new E('window');
    document.visibilityState='visible';
    const figure=new E('figure'), photo=new E('img'), target=new E('div');
    const photoId={'01':'#foto','02':'#retrato','03':'#foto-hero'}[id];
    const photoWait=id===delayPhoto;
    photo.complete=!photoWait;photo.naturalWidth=photo.complete?300:0;
    photo.clientWidth=300;photo.closest=s=>s==='figure'?figure:null;
    photo.src='assets/fotos/hero.webp';photo.decode=()=>Promise.resolve();
    figure.append(photo);
    target.getBoundingClientRect=()=>({bottom:1000,top:900,height:100});
    const running=[];
    class Animated extends E{
      animate(keyframes, timing){
        const a={keyframes,timing};
        a.finished=new Promise((resolve,reject)=>{a.finish=resolve;a.cancel=reject;});
        running.push(a);
        const l={kind:'motion',id,effect:this.className,stage,welcomeHidden:welcome.hidden,scroll:ctx.scrollY};
        logs.push(l);
        return a;
      }
    }
    photo.animate=Animated.prototype.animate;
    document.createElement=t=>new Animated(t);
    document.querySelectorAll=s=>s==='#duplas .names'?[target]:[];
    document.querySelector=s=>s===photoId?photo:
      (s==='#registro .result'||s==='#modalidades [aria-labelledby="equipos"] .roster')?target:null;
    const ctx={
      document,location:{protocol,origin},matchMedia,
      addEventListener:global.addEventListener.bind(global),innerWidth:1280,innerHeight:800,scrollY:0,
      requestAnimationFrame(fn){rafs.set(++uid,fn);return uid;},cancelAnimationFrame(id){rafs.delete(id);},
      scrollTo(ops){if(ops.top===0)ctx.scrollY=0;}
    };
    ctx.window=ctx;
    ctx.parent=standalone===id?ctx:parentEndpoint;
    parentEndpoint.postMessage=function(data,to){
      assert.equal(to,protocol==='file:'?'*':origin);
      const source=f.contentWindow;
      events.push(()=>globalParent('message',{data,source,origin}));
    };
    function globalParent(type,props){parentGlobal.emit(type,props);}
    const parentGlobal=setupParentGlobal;
    const child={document,global,ctx,photo,figure,finish(){running.splice(0).forEach(a=>a.finish());}};
    children.set(id,child);
    vm.runInNewContext(code(id+'/assets/motion.js'),ctx);
    events.push(()=>f.emit('load'));
    return child;
  }
  const setupParentGlobal=global;
  if(standalone) child(standalone);
  else {
    vm.runInContext(code('opening-bridge.js'),parent);
    vm.runInContext(code('welcome.js'),parent);
  }
  return {
    logs,children,hub,welcome,body,start,global,buttons,selector,location,
    stage(s){stage=s;},
    message(id,data,source=parentEndpoint,from=origin){children.get(id).global.emit('message',{data,source,origin:from});},
    readStage(){return stage;},
    timer(ms){for(const [id,t] of timers){if(t.ms===ms){timers.delete(id);t.fn();return;}}throw Error('No timer '+ms);},
    endDoor(){hub.emit('animationend',{animationName:'open-demo'});},
    async flush(){
      for(let i=0;i<6;i++){
        while(events.length) events.shift()();
        const queue=[...rafs];rafs.clear();for(const [,fn] of queue) fn();
        await Promise.resolve();
      }
    },
    motions(){return logs.filter(e=>e.kind==='motion');},
    finish(){children.forEach(c=>c.finish());}
  };
}

(async()=>{
  const report={};
  for(const protocol of ['file:','http:']){
    const s=setup(protocol);
    await s.flush();
    assert.deepEqual(s.motions(),[]);
    assert.equal(s.children.size,0);
    s.stage('cover click / preload');
    s.start.click();
    await s.flush();
    assert.equal(s.hub.hasAttribute('inert'),true);
    assert.equal(s.children.size,1);
    assert.equal(s.motions().length,0);
    // A forged activation may not start even a preloaded frame.
    s.message('01',{type:'gtl-opening-activation',active:true},{});
    s.message('01',{type:'gtl-opening-activation',active:true},undefined,'https://wrong.invalid');
    await s.flush();
    assert.equal(s.motions().length,0);
    s.stage('door midway');
    s.timer(180);
    assert.equal(s.body.classList.contains('revealing'),true);
    await s.flush();
    assert.equal(s.motions().length,0);
    s.stage('door finished');
    s.endDoor();
    await s.flush();
    assert.equal(s.motions().length,3);
    assert(s.motions().every(x=>x.id==='01'&&x.effect==='motion08-sheet'&&x.welcomeHidden&&x.stage==='door finished'));
    // A first resize must not cancel the opening during the settling of the layout.
    s.children.get('01').global.emit('resize');
    await s.flush();
    assert.equal(s.children.get('01').figure.children.length,2);
    s.finish();
    await s.flush();

    const selection=[1,2,0,1,2,0];
    const starts=[3,7,1];
    for(const i of selection){
      const id=opts[i], before=s.motions().length;
      s.stage('activate '+id);
      const old=s.children.get(id);
      if(old)old.ctx.scrollY=500;
      s.buttons[i].click();
      await s.flush();
      const current=s.motions().slice(before);
      assert.equal(current.length,starts[i]);
      assert(current.every(x=>x.id===id && x.scroll===0));
      if(old) assert.equal(s.children.get(id),old,'replay should not reload');
      s.buttons[i].click();
      await s.flush();
      assert.equal(s.motions().length,before+starts[i],'same tab should not retrigger');
      s.finish();
      await s.flush();
    }
    // Switch away mid-opening, then replay. The first opening must be cancelled and cleaned.
    s.buttons[1].click();await s.flush();
    const lead=s.children.get('02');
    assert.equal(lead.figure.children.length,2);
    s.buttons[2].click();await s.flush();
    assert.equal(lead.figure.children.length,1);
    s.buttons[1].click();await s.flush();
    assert.equal(lead.figure.children.length,2);
    s.finish();await s.flush();
    s.location.hash='';s.global.emit('popstate');await s.flush();
    assert.equal(s.welcome.hidden,false);
    const count=s.motions().length;
    s.start.click();s.timer(180);await s.flush();
    assert.equal(s.motions().length,count,'return to cover must revoke previous permission');
    s.endDoor();await s.flush();
    assert.equal(s.motions().length,count+3);
    s.finish();await s.flush();

    const direct=setup(protocol,{hash:'#03'});
    await direct.flush();assert.equal(direct.motions().length,1);assert.equal(direct.welcome.hidden,true);
    direct.finish();await direct.flush();

    const keyboard=setup(protocol,{hash:'#01'});
    await keyboard.flush();keyboard.finish();await keyboard.flush();
    keyboard.selector.emit('keydown',{key:'ArrowRight'});
    await keyboard.flush();
    assert.equal(keyboard.motions().filter(e=>e.id==='02').length,7);
    keyboard.finish();await keyboard.flush();

    const slow=setup(protocol,{hash:'#01',delayPhoto:'01'});
    await slow.flush();assert.equal(slow.motions().length,0);
    slow.buttons[1].click();await slow.flush();slow.finish();await slow.flush();
    const {photo}=slow.children.get('01');
    photo.complete=true;photo.naturalWidth=300;photo.emit('load');
    await slow.flush();assert.equal(slow.motions().filter(x=>x.id==='01').length,0);
    slow.buttons[0].click();await slow.flush();assert.equal(slow.motions().filter(x=>x.id==='01').length,3);
    slow.finish();await slow.flush();

    const fallback=setup(protocol);
    fallback.start.click();await fallback.flush();fallback.timer(180);await fallback.flush();
    assert.equal(fallback.motions().length,0);
    fallback.timer(1200);await fallback.flush();assert.equal(fallback.motions().length,3);
    fallback.finish();await fallback.flush();

    const decode=setup(protocol,{hash:'#01'});
    let resolveDecode;
    decode.children.get('01').photo.decode=()=>new Promise(resolve=>{resolveDecode=resolve;});
    await decode.flush();assert.equal(decode.motions().length,0);
    decode.buttons[1].click();await decode.flush();
    resolveDecode();await decode.flush();assert.equal(decode.motions().filter(x=>x.id==='01').length,0);
    decode.children.get('01').photo.decode=()=>Promise.resolve();
    decode.buttons[0].click();await decode.flush();assert.equal(decode.motions().filter(x=>x.id==='01').length,3);
    decode.finish();await decode.flush();

    const standalone=setup(protocol,{standalone:'03'});
    await standalone.flush();assert.equal(standalone.motions().length,1);
    standalone.finish();await standalone.flush();

    const reduced=setup(protocol,{reduced:true});
    reduced.start.click();
    await reduced.flush();assert.equal(reduced.motions().length,0);assert.equal(reduced.welcome.hidden,true);
    reduced.buttons[1].click();reduced.buttons[2].click();await reduced.flush();assert.equal(reduced.motions().length,0);

    report[protocol]={doorPreloadSilent:true,openingOnlyAfterDoor:true,doorTimeoutFallback:true,staleDecodeIgnored:true,replayedTabs:selection.map(i=>opts[i]),scrollReset:true,noReload:true,duplicateSelectionIgnored:true,keyboard:true,midOpeningSwitchClean:true,returnFromCover:true,deepLink:true,standalone:true,latePhoto:true,reducedMotion:true};
  }
  console.log(JSON.stringify({method:'Production JavaScript executed with simulated DOM, iframe messages, loading, and animation frames.',protocols:report},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
