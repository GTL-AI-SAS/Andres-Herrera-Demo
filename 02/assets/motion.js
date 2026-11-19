(() => {
  'use strict';
  const option = document.querySelector('#foto') ? '01' : document.querySelector('#retrato') ? '02' : '03';
  const photo = document.querySelector(option === '01' ? '#foto' : option === '02' ? '#retrato' : '#foto-hero');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = () => innerWidth <= 760;
  const embedded = parent !== window, origin = location.origin;
  const capable = typeof photo.animate === 'function';
  const ease = 'cubic-bezier(.32,.02,.24,1)';
  let granted = !embedded, state = 'idle', raf = 0, openingFrame = 0, epoch = 0;
  let active = new Set(), disposers = new Set();
  const seen = new Set();
  const targets = option === '01' ? [...document.querySelectorAll('#duplas .names')] :
    [document.querySelector(option === '02' ? '#registro .result' : '#modalidades [aria-labelledby="equipos"] .roster')];
  const eligible = () => granted && document.visibilityState === 'visible';
  function motion(node, frames, duration, delay = 0, name = 'opening', easing = ease, fill = 'both') {
    const animation = node.animate(frames, {duration, delay, fill, easing});
    animation.id = `afh08-${option}-${name}`;
    active.add(animation);
    animation.finished.then(() => active.delete(animation), () => active.delete(animation));
    return animation;
  }
  function cleanup(fn) { disposers.add(fn); return () => { if(disposers.delete(fn)) fn(); }; }
  function layer(host) {
    const el = document.createElement('div'); el.className = 'motion08-layer'; el.setAttribute('aria-hidden','true');
    host.append(el); return el;
  }
  function duplicate() {
    const img = document.createElement('img'); img.src = photo.currentSrc || photo.src; img.alt = ''; img.draggable = false; return img;
  }
  function cover(host) {
    const el = layer(host); photo.classList.add('motion08-hidden');
    return [el, cleanup(() => { el.remove(); photo.classList.remove('motion08-hidden'); })];
  }
  async function stack() {
    const [el, dispose] = cover(photo.parentElement), m = mobile(), w = photo.clientWidth;
    const lengths = m ? [50,85,120] : [70,120,170], end = m ? 620 : 720;
    const motions = [];
    for(let i=0;i<3;i++) {
      const sheet = document.createElement('div'); sheet.className = 'motion08-sheet'; sheet.style.left = `${i*100/3}%`;
      const img = duplicate(); img.style.left = `${-i*100}%`; sheet.append(img); el.append(sheet);
      const x = (1-i)*w/3, angle = (m ? [-4,3,-2] : [-7,4,-3])[i];
      motions.push(motion(sheet,[{transform:`translateX(${x}px) scale(.68) rotate(${angle}deg)`},{transform:'translateX(0) scale(1) rotate(0)'}],end-lengths[i],lengths[i]));
    }
    await Promise.allSettled(motions.map(a=>a.finished)); dispose();
  }
  async function impressions() {
    const el = layer(photo.parentElement), dispose = cleanup(()=>el.remove()), m = mobile();
    const end = m ? 590 : 690, pEnd = m ? 250 : 290, gStart = m ? 80 : 100, gEnd = m ? 330 : 380;
    const all=[];
    for(let i=0;i<2;i++) {
      const sleeve = document.createElement('div'); sleeve.className = 'motion08-sleeve '+(i ? 'motion08-green' : 'motion08-paper');
      const img = duplicate(); sleeve.append(img); el.append(sleeve);
      const start=i ? gStart : 0, entry=i ? gEnd-gStart : pEnd;
      all.push(motion(sleeve,[{transform:'translateY(101%)'},{transform:'translateY(0)'}],entry,start));
      all.push(motion(img,[{transform:'translateY(-101%)'},{transform:'translateY(0)'}],entry,start));
      if (i) {
        // Matching easing, duration and opposite transforms keep every pixel registered.
        all.push(motion(sleeve,[{transform:'translateY(0)'},{transform:'translateY(-101%)'}],end-gEnd,gEnd,'opening',ease, 'forwards'));
        all.push(motion(img,[{transform:'translateY(0)'},{transform:'translateY(101%)'}],end-gEnd,gEnd,'opening',ease, 'forwards'));
      } else {
        all.push(motion(sleeve,[{visibility:'visible'},{visibility:'hidden'}],1,gEnd,'opening','steps(1,end)'));
      }
    }
    await Promise.allSettled(all.map(a=>a.finished)); dispose();
  }
  async function contact() {
    const [el,dispose]=cover(photo.parentElement), m=mobile(), width=photo.clientWidth;
    const size=m ? Math.max(80,width*.36) : width*.304, pad=m ? 11 : 18;
    const contact=document.createElement('div'); contact.className='motion08-contact'; contact.append(duplicate()); el.append(contact);
    const from=`translate(${width-size-pad}px,${pad}px) scale(${size/width})`;
    await motion(contact,[{transform:from,offset:0},{transform:from,offset:.115},{transform:'translate(0,0) scale(1)',offset:1}],m?570:690).finished.catch(()=>{}); dispose();
  }
  function slice(target, delay) {
    const word=target.querySelector('.motion08-sliced'); word.classList.add('is-running');
    const dispose=cleanup(()=>word.classList.remove('is-running')), m=mobile();
    const xs=m?[-8,5,-5,8]:[-17,10,-10,17], ys=m?[-3,3,-2,3]:[-6,5,-4,6];
    const as=[...word.querySelectorAll('.motion08-slice>span')].map((node,i)=>motion(node,[
      {transform:`translate(${xs[i]}px,${ys[i]}px) rotate(${(i%2?1:-1)*(m?2.5:4)}deg)`,offset:0},
      {transform:`translate(${xs[i]*.3}px,${ys[i]*.5}px) rotate(${(i%2?1:-1)*1.8}deg)`,offset:.49},
      {transform:'translate(0,0) rotate(0)',offset:1}
    ],m?430:510,delay,'post','linear'));
    Promise.allSettled(as.map(a=>a.finished)).then(dispose);
  }
  function flip(target) {
    const m=mobile();
    target.querySelectorAll('.motion08-rotor').forEach((rotor,i)=>{
      const digit=rotor.dataset.digit, top=rotor.querySelector('.motion08-top'), bottom=rotor.querySelector('.motion08-bottom');
      bottom.firstElementChild.style.visibility='hidden';
      const leaf=document.createElement('span');leaf.className='motion08-leaf';
      leaf.innerHTML=`<span class="motion08-face motion08-front"></span><span class="motion08-face motion08-back"><span>${digit}</span></span>`;
      rotor.append(leaf);
      const dispose=cleanup(()=>{leaf.remove();bottom.firstElementChild.style.visibility='';});
      motion(leaf,[{transform:'rotateX(0deg)'},{transform:'rotateX(-180deg)'}],m?380:460,i*(m?60:75),'post','linear').finished.then(dispose,dispose);
    });
  }
  function formation(target) {
    const m=mobile();
    target.querySelectorAll('.motion08-carrier').forEach((node,i)=>{
      const center=i===1, sign=i===0?-1:1;
      motion(node,[{transform:`translate(${center?0:sign*(m?2:3)}px,${center?(m?4:7):(m?8:12)}px) rotate(${center?0:sign*(m?2:3)}deg)`},{transform:'translate(0,0) rotate(0)'}],center?220:(m?370:420),center?0:(m?80:100),'post');
    });
  }
  function ratio(el) {
    const r=el.getBoundingClientRect(); return r.height ? Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top))/r.height : 0;
  }
  function scan() {
    if (!eligible() || state!=='done') return;
    let count=0;
    for (const target of targets) {
      if(seen.has(target)) continue;
      // A jump or fast scroll past a piece leaves its complete final state.
      if (target.getBoundingClientRect().bottom<=0 || reduce.matches || !capable) { seen.add(target); continue; }
      if(ratio(target)<(option==='03'?.7:.5)) continue;
      seen.add(target);
      if(option==='01') slice(target,mobile()?0:count++*75);
      else if(option==='02') flip(target); else formation(target);
    }
  }
  function schedule() { if(!raf) raf=requestAnimationFrame(()=>{raf=0;scan();}); }
  function stop() {
    active.forEach(a=>a.cancel());active.clear();
    [...disposers].forEach(fn=>{disposers.delete(fn);fn();});
    if(state==='running') state='done';
  }
  async function start(activation) {
    if(activation!==epoch || !eligible() || state!=='idle' || !photo.complete) return;
    state='done';
    if(reduce.matches || !capable || !photo.naturalWidth || scrollY>20 || photo.closest('.fallback')) {scan();return;}
    if(typeof photo.decode==='function') {
      state='preparing';
      await photo.decode().catch(()=>{});
      if(activation!==epoch) return;
      state='idle';
      if(!eligible()) return;
      if(reduce.matches || scrollY>20 || photo.closest('.fallback')) {state='done';scan();return;}
    }
    state='running';
    try { await (option==='01'?stack():option==='02'?impressions():contact()); }
    finally {if(activation===epoch){state='done';scan();}}
  }
  function queueOpening() {
    if(!eligible() || state!=='idle' || openingFrame) return;
    const activation=epoch;
    // Give the selected iframe a paint after the cover or tab switch.
    openingFrame=requestAnimationFrame(()=>{
      openingFrame=requestAnimationFrame(()=>{openingFrame=0;start(activation);});
    });
  }
  function setActive(next) {
    if(granted===next) return;
    granted=next;
    ++epoch;
    if(openingFrame) {cancelAnimationFrame(openingFrame);openingFrame=0;}
    stop();
    state='idle';
    if(!granted) return;
    // Replay at the hero even if this tab was previously scrolled.
    window.scrollTo({top:0,left:0,behavior:'instant'});
    queueOpening();
  }
  if(option==='01') {
    function fallback() {
      const figure=photo.closest('figure'); if(figure.classList.contains('fallback'))return;
      stop();figure.classList.add('fallback');photo.width=522;photo.height=599;
      photo.alt='Deportista con raqueta y trofeo en una cancha de squash, RGSA Open 2024';
      document.querySelector('#pie-foto').textContent='RGSA Open 2024';
      document.querySelector('#credito').textContent='AFH-F01 · IDRD, según Portal Bogotá; fotógrafo no indicado';
      photo.src='assets/fotos/AFH-F01.webp';
    }
    photo.addEventListener('error',fallback);if(photo.complete&&!photo.naturalWidth)fallback();
  }
  if('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(schedule,{threshold:[0,.5,.7,1]});targets.forEach(t=>observer.observe(t));
  }
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(eligible()){queueOpening();schedule();}else stop();});
  reduce.addEventListener('change',()=>{if(reduce.matches)stop();scan();});
  photo.addEventListener('load',queueOpening);
  photo.addEventListener('error',queueOpening);
  if(embedded && /^(https?:|file:)$/.test(location.protocol)) {
    addEventListener('message',e=>{
      if(e.source!==parent || e.origin!==(location.protocol==='file:'?'null':origin) || e.data?.type!=='gtl-opening-activation' || typeof e.data.active!=='boolean')return;
      setActive(e.data.active);
    });parent.postMessage({type:'gtl-opening-ready'},location.protocol==='file:'?'*':origin);
  } else if(!embedded) {
    queueOpening();
  }
})();
