import { localCycle, clockLabel, lightCycle } from "./atmosphere-cycle.js";

// A projected garden: connected branches interrupt a single field of light.
(() => {
  const root = document.documentElement;
  const canvas = document.getElementById('light-canvas');
  const room = document.querySelector('.light');
  const surface = document.querySelector('.window');
  if (!canvas || !room || !surface) return;
  const ctx = canvas.getContext('2d');
  const mask = document.createElement('canvas');
  const m = mask.getContext('2d');
  const foliage = document.createElement('canvas');
  const f = foliage.getContext('2d');
  const shade=document.createElement('canvas');
  const shadeCtx=shade.getContext('2d');
  const frame=document.createElement('canvas');
  const frameCtx=frame.getContext('2d');
  if (!ctx || !m || !f || !shadeCtx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // Night and day are two different rooms, each with its own settings. Night is
  // the window, and the lamp follows the mouse. Day is a big soft ginkgo bough, and
  // its light rests where a lamp held at the bottom-left corner would throw it —
  // up and to the right, off the text — unless the mouse is asked to take over.
  const shared = { shape: 'window', pane: 'four', leaf: 'ginkgo', t: null, strength: 1, soft: 8, scale: 1, breeze: 1, lamp: 1, density: 1, follow: false, rest: null };
  const rooms = {
    // Night is locked: the hour is held at 7:34 PM, so the window never moves with the
    // clock — the only thing that changes it is the lamp following the mouse.
    dark:  { ...shared, shape: 'window', pane: 'four', t: (19+34/60-7)/24, strength: 1, soft: 6, scale: 1, lamp: .8, follow: true },
    light: { ...shared, shape: 'leaves', leaf: 'ginkgo', strength: .6, soft: 10, scale: 2.5, density: 1, breeze: 1, lamp: .25, rest: { x: 0, y: 1 } },
  };
  const panes = ['four','tall','grid','arch','round','blinds'];
  const key = 'ew.atmosphere.v7'; // v6: Eric's locked numbers for both rooms become the defaults
  const leaves = ['willow','birch','ginkgo','maple','olive','eucalyptus','bamboo'];
  const scenes = ['window', 'leaves'];
  const P = { dark: { ...rooms.dark }, light: { ...rooms.light } };
  try {
    const saved=JSON.parse(localStorage.getItem(key) || '{}');
    for (const room of ['dark','light']) Object.assign(P[room], saved[room] || {}, { rest: rooms[room].rest });
  } catch {}
  const url = new URL(location.href);
  for (const room of ['dark','light']) {
    const q = P[room];
    if (url.searchParams.has('light')) q.shape = url.searchParams.get('light');
    if (!scenes.includes(q.shape)) q.shape = rooms[room].shape;
    if (!leaves.includes(q.leaf)) q.leaf='ginkgo';
    if (!panes.includes(q.pane)) q.pane='four';
    if (url.searchParams.has('sun')) q.t = Number(url.searchParams.get('sun'));
    for (const [name, lo, hi] of [['t',0,1],['strength',0,1.5],['soft',0,40],['scale',0.5,3],['breeze',0,3],['lamp',0,1],['density',0.5,2.5]]) {
      if (name === 't' && q.t === null) continue;
      q[name] = Number.isFinite(Number(q[name])) ? Math.min(hi, Math.max(lo, Number(q[name]))) : rooms[room][name];
    }
    q.follow = !!q.follow;
  }
  const roomNow = () => root.dataset.mode === 'light' ? 'light' : 'dark';
  let p = P[roomNow()];
  const hour = localCycle;
  const save = () => { try { localStorage.setItem(key, JSON.stringify(P)); } catch {} };
  save();
  let seed = 941;
  const random = () => ((seed = seed * 16807 % 2147483647) / 2147483647);
  // Branch-local geometry means leaves remain attached while the whole limb bends.
  function branch(length, depth) {
    const node = { length, phase: random()*6.28, bend: (random()-.5)*.22, leaves: [], children: [] };
    // Density multiplies the leaves on a limb and packs them into the same stretch of it.
    const count = Math.max(1, Math.round((depth < 2 ? 6 : 2) * p.density));
    for (let i=0; i<count; i++) {
      const at = .25 + i*Math.min(.115,.69/count) + random()*.045;
      node.leaves.push({ at, side: i%2 ? 1:-1, length: (21+random()*22)*(depth===0 ? .9:1), angle: .45+random()*.65, phase: random()*6.28 });
    }
    if (depth > 0) for (let i=0; i<3; i++) node.children.push({ at: .38+i*.24+random()*.07, angle: (i%2 ? -1:1)*(.38+random()*.5), node: branch(length*(.43+random()*.16), depth-1) });
    return node;
  }
  // Unequal stems overlap into a canopy, leaving pockets of light between them.
  // Rebuilt from the same seed whenever density changes, so it stays the same tree.
  let trees = [];
  function plant() {
    seed = 941;
    trees = [
      // Boughs hang in from above and to the right, the way a tree outside a window
      // does — rooted off the edge of the light, tips trailing down and to the left.
      { node: branch(430,2), x: 260, y: -70, angle: -2.55, blur: 0, phase: 0 },
      { node: branch(360,2), x: 60, y: -90, angle: -2.9, blur: 1.4, phase: 2.3 },
      { node: branch(330,2), x: 370, y: 30, angle: -2.15, blur: .7, phase: 4.7 },
    ];
  }
  plant();
  // A faint static grain on the light's alpha. At a tenth of full brightness the
  // gradients only have a couple of dozen levels left, and each level shows as a
  // ring on dark paper; the grain breaks the contours without reading as noise.
  const grain=document.createElement('canvas'); grain.width=grain.height=192;
  const grainCtx=grain.getContext('2d');
  { const img=grainCtx.createImageData(192,192); let g=7;
    for(let i=3;i<img.data.length;i+=4){ g=g*16807%2147483647; img.data[i]=222+((g/2147483647)*34|0); }
    grainCtx.putImageData(img,0,0); }
  const grainPattern=ctx.createPattern(grain,'repeat');
  let width=0, height=0, ratio=1, dirty=true, last=0, elapsed=0;
  let anchorX=0, anchorY=0;
  let followMouse=p.follow, tracking=0, allowMotion=false;
  // Changing rooms: the light dims out, the room changes behind it, and it comes back.
  let veil=1, veilTarget=1;
  // First load: the light comes up slowly, over three seconds, like a lamp warming —
  // the page's one loading gesture. Skipped for reduced motion.
  // It is directional, the way light actually arrives: it enters at the window, up
  // and to the right of the patch, and travels across the page away from it, a soft
  // front that reaches the near panes first and the far corner last.
  let warmStart=null, warm=0, lift=0;
  const SOURCE={x:160,y:-260}, REACH=1150; // in the projection's own units
  // Tunable from the ⌘D panel's "arrival" section, then baked back here.
  //   dur      seconds, start to finish
  //   x1…y2    the front's travel as a cubic-bezier, like a CSS easing
  //   head     how far along the front already is at t=0 (0 = out at the source, off the patch)
  //   feather  softness of the front's edge
  //   lift     how fast overall brightness comes up behind the front (1 = with it, 5 = almost at once)
  const warmDefaults={dur:5,x1:.42,y1:0,x2:.58,y2:1,head:0,feather:300,lift:2.5};
  let W={...warmDefaults};
  try{Object.assign(W,JSON.parse(localStorage.getItem('ew.arrival')||'{}'));}catch{}
  const bezier=(t,x1,y1,x2,y2)=>{ let lo=0,hi=1,u=t;
    for(let i=0;i<22;i++){u=(lo+hi)/2;const x=3*(1-u)*(1-u)*u*x1+3*(1-u)*u*u*x2+u*u*u;x<t?lo=u:hi=u;}
    return 3*(1-u)*(1-u)*u*y1+3*(1-u)*u*u*y2+u*u*u; };
  const pointer={x:.72,y:.22};
  const pointerEase={...pointer};
  addEventListener('pointermove',event=>{
    if(event.target instanceof Element && event.target.closest('#light-panel'))return;
    pointer.x=event.clientX/innerWidth;pointer.y=event.clientY/innerHeight;
    if(followMouse)dirty=true;
  },{passive:true});
  const resize = () => {
    width=innerWidth; height=innerHeight;
    const column=document.querySelector('main').getBoundingClientRect();
    const intro=document.querySelector('.intro').getBoundingClientRect();
    anchorX=Math.min(width*.91,column.right+25);
    anchorY=Math.max(30,Math.min(height*.15,intro.top+scrollY-65));
    ratio=Math.min(1, 1100/Math.max(width,height));
    canvas.width=mask.width=foliage.width=shade.width=frame.width=Math.round(width*ratio);
    canvas.height=mask.height=foliage.height=shade.height=frame.height=Math.round(height*ratio);
    dirty=true;
  };
  resize();
  addEventListener('resize', resize);
  motion.addEventListener('change', () => { dirty=true; });
  new MutationObserver(() => { dirty=true; if (P[roomNow()]!==p) veilTarget=0; }).observe(root,{attributes:true,attributeFilter:['data-mode']});
  const reset = c => { c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,canvas.width,canvas.height); c.setTransform(ratio,0,0,ratio,0,0); };
  function limb(c, node, time, depth) {
    c.save();
    c.rotate(node.bend + Math.sin(time*.55+node.phase)*.065 + Math.sin(time*1.13+node.phase)*.018);
    const len=node.length;
    c.lineWidth=Math.max(1,depth*1.65);
    c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(len*.07,-len*.5,0,-len); c.stroke();
    for (const leaf of node.leaves) {
      c.save(); c.translate(Math.sin(leaf.at*Math.PI)*len*.035,-len*leaf.at);
      const flutter=Math.sin(time*(1.25+leaf.at*.55)+leaf.phase)*.20
        + Math.sin(time*.47+leaf.phase*1.7)*.06;
      c.rotate(leaf.side*leaf.angle + flutter);
      // A slight turn toward/away from the sun changes the projected leaf width.
      c.scale(.88+.12*Math.sin(time*.91+leaf.phase),1);
      const l=leaf.length;
      c.beginPath();c.moveTo(0,0);
      if(p.leaf==='ginkgo') {
        c.lineTo(0,-l*.23);
        c.bezierCurveTo(-l*.16,-l*.35,-l*.55,-l*.57,-l*.56,-l*.82);
        c.bezierCurveTo(-l*.38,-l*1.04,-l*.12,-l*1.04,0,-l*.89);
        c.bezierCurveTo(l*.15,-l*1.08,l*.4,-l*1.02,l*.56,-l*.82);
        c.bezierCurveTo(l*.48,-l*.57,l*.14,-l*.34,0,-l*.23);
      } else if(p.leaf==='birch') {
        c.lineTo(0,-l*.12);
        c.bezierCurveTo(-l*.6,-l*.37,-l*.37,-l*.63,0,-l);
        c.bezierCurveTo(l*.27,-l*.7,l*.6,-l*.38,0,-l*.12);
      } else if(p.leaf==='maple') {
        // five pointed lobes off a short stalk, drawn as one outline
        const pts=[[0,-.2],[-.3,-.16],[-.62,-.3],[-.5,-.44],[-.78,-.72],[-.46,-.68],[-.4,-.92],[-.2,-.8],[0,-1.2],
          [.2,-.8],[.4,-.92],[.46,-.68],[.78,-.72],[.5,-.44],[.62,-.3],[.3,-.16],[0,-.2]];
        for(const [x,y] of pts)c.lineTo(x*l,y*l);
      } else if(p.leaf==='olive') {
        c.lineTo(0,-l*.08);
        c.bezierCurveTo(-l*.1,-l*.3,-l*.17,-l*.72,0,-l*1.05);
        c.bezierCurveTo(l*.17,-l*.72,l*.1,-l*.3,0,-l*.08);
      } else if(p.leaf==='eucalyptus') {
        c.lineTo(0,-l*.2);
        c.closePath();c.fill();c.beginPath();
        c.ellipse(0,-l*.6,l*.4,l*.43,0,0,Math.PI*2);
      } else if(p.leaf==='bamboo') {
        c.bezierCurveTo(-l*.2,-l*.18,-l*.13,-l*.95,0,-l*1.7);
        c.bezierCurveTo(l*.1,-l*.95,l*.16,-l*.18,0,0);
      } else {
        c.bezierCurveTo(-l*.18,-l*.3,-l*.15,-l*.83,0,-l*1.25);
        c.bezierCurveTo(l*.2,-l*.81,l*.25,-l*.27,0,0);
      }
      c.closePath();c.fill();
      c.restore();
    }
    for (const child of node.children) {
      c.save(); c.translate(Math.sin(child.at*Math.PI)*len*.035,-len*child.at); c.rotate(child.angle); limb(c,child.node,time,depth-1); c.restore();
    }
    c.restore();
  }
  // Kinds of window. Each is its glass (the lit panes) and its outer shape; the
  // frame is one minus the other. All share the four-pane window's footprint.
  const X0=-235, Y0=-105, WW=263, WH=356, PAD=12;
  const glassCache={};
  function glass(kind) {
    if(glassCache[kind])return glassCache[kind];
    const lit=new Path2D(), outer=new Path2D();
    const gridOf=(cols,rows,gap,x=X0,y=Y0,w=WW,h=WH)=>{
      const pw=(w-gap*(cols-1))/cols, ph=(h-gap*(rows-1))/rows;
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)lit.rect(x+c*(pw+gap),y+r*(ph+gap),pw,ph);
    };
    // A slice of a disc as a polygon, trimmed by `gap` along both straight edges.
    const slice=(cx,cy,R,a0,a1,gap)=>{
      const trim=gap/R;
      lit.moveTo(cx+Math.cos((a0+a1)/2)*gap*1.4,cy+Math.sin((a0+a1)/2)*gap*1.4);
      for(let i=0;i<=18;i++){const a=a0+trim+(a1-a0-trim*2)*i/18;lit.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);}
      lit.closePath();
    };
    if(kind==='tall'){ gridOf(2,3,12); outer.rect(X0-PAD,Y0-PAD,WW+PAD*2,WH+PAD*2); }
    else if(kind==='grid'){ gridOf(3,4,7); outer.rect(X0-PAD,Y0-PAD,WW+PAD*2,WH+PAD*2); }
    else if(kind==='blinds'){ gridOf(1,13,15); outer.rect(X0-PAD,Y0-PAD,WW+PAD*2,WH+PAD*2); }
    else if(kind==='arch'){
      const R=WW/2, cx=X0+R, cy=Y0+R;
      for(let k=0;k<3;k++)slice(cx,cy-6,R,Math.PI+k*Math.PI/3,Math.PI+(k+1)*Math.PI/3,5);
      gridOf(2,1,15,X0,cy+8,WW,WH-R-8);
      outer.moveTo(X0-PAD,Y0+WH+PAD);outer.lineTo(X0-PAD,cy);
      outer.arc(cx,cy,R+PAD,Math.PI,0);outer.lineTo(X0+WW+PAD,Y0+WH+PAD);outer.closePath();
    }
    else if(kind==='round'){
      const R=142, cx=X0+WW/2, cy=Y0+R+10;
      for(let k=0;k<4;k++)slice(cx,cy,R,k*Math.PI/2,(k+1)*Math.PI/2,6);
      outer.arc(cx,cy,R+PAD,0,Math.PI*2);
    }
    else { gridOf(2,2,15,X0,Y0,WW,WH); outer.rect(X0-PAD,Y0-PAD,WW+PAD*2,WH+PAD*2); }
    return glassCache[kind]={lit,outer};
  }
  // A small projection enters from the upper edge. Hour changes its position,
  // angle and length without ever turning it into a full-page background.
  // With the mouse on, the pointer is the lamp: the window or canopy stays at
  // its anchor and the patch is thrown away from the lamp, longer and larger
  // the closer the lamp comes.
  function project(c,t) {
    const sun=lightCycle(t);
    const unit=Math.min(width/850,height/700,.95)*Math.min(p.scale,3);
    const autoX=anchorX+width*(sun.x-.875),autoY=anchorY+height*(sun.y-.025);
    const vx=anchorX-pointerEase.x*width, vy=anchorY-pointerEase.y*height;
    const dist=Math.max(1,Math.hypot(vx,vy)), nx=vx/dist, ny=vy/dist;
    const near=1-Math.min(1,dist/(height*.9));
    // Subtle on purpose: the patch leans and stretches toward where the lamp is, it does not chase it.
    // The constants are the ceiling; the panel's lamp slider scales them from 0 to 1.
    const k=p.lamp;
    const lamp={ x:anchorX+vx*.035*k, y:anchorY+vy*.035*k, angle:nx*.09*k, shear:nx*.09*k,
      stretch:1+(.06*near+.05*Math.max(0,ny))*k, scale:1+.05*near*k };
    const mix=(a,b)=>a+(b-a)*tracking;
    const w=p.shape==='leaves'?1.22:sun.beamWidth;
    c.translate(mix(autoX,lamp.x),mix(autoY,lamp.y));
    c.scale(unit*mix(w,w*lamp.scale),unit*mix(sun.beamLength,sun.beamLength*lamp.scale));
    c.rotate(mix(sun.angle,lamp.angle));
    c.transform(1,0,mix(sun.shear,lamp.shear),mix(sun.stretch,lamp.stretch),0,0);
  }
  function garden(c,time,t) {
    for(const tree of trees) {
      reset(f); f.fillStyle='black'; f.strokeStyle='black';
      f.save(); project(f,t); f.translate(tree.x,tree.y); f.rotate(tree.angle);
      limb(f,tree.node,time+tree.phase,3); f.restore();
      c.save(); c.globalAlpha=.86;
      // Blur in proportion to the leaf. A fixed blur that flatters a big canopy is a
      // third of a small leaf's width, and the far trees dissolve into a grey haze —
      // that haze is what reads as dirt. Small canopies get less blur and less depth.
      const size=Math.min(1.3,Math.max(.4,p.scale/2.3));
      const depth=Math.min(1,Math.max(.15,(p.scale-.6)/1.7));
      c.filter=`blur(${(p.soft*.3+.8)*size*(1+tree.blur*.7*depth)*ratio}px)`;
      c.drawImage(foliage,0,0,width,height); c.restore();
    }
  }
  // Sample the actual moving light mask, so letter edges respond to the same
  // panes and foliage as the page. No duplicate text or animated overlay copy.
  const reflectionMap=document.createElement('canvas');
  reflectionMap.width=96;reflectionMap.height=72;
  const reflectionCtx=reflectionMap.getContext('2d',{willReadFrequently:true});
  const textSurfaces=[...document.querySelectorAll('.intro p, .section .label, .company, .row .title, .row .year')];
  let lastReflection=-Infinity;
  function reflectText(now,day,force=false) {
    if(!reflectionCtx || (!force && now-lastReflection<100))return;
    lastReflection=now;
    reflectionCtx.clearRect(0,0,96,72);
    reflectionCtx.drawImage(mask,0,0,96,72);
    const pixels=reflectionCtx.getImageData(0,0,96,72).data;
    for(const element of textSurfaces) {
      const box=element.getBoundingClientRect();
      let exposure=0,peak=0,count=0;
      if(box.bottom>0 && box.top<height) {
        for(let row=0;row<3;row++)for(let col=0;col<7;col++) {
          const x=Math.floor((box.left+box.width*(col+.5)/7)/width*96);
          const y=Math.floor((box.top+box.height*(row+.5)/3)/height*72);
          if(x>=0 && x<96 && y>=0 && y<72){const sample=pixels[(y*96+x)*4+3]/255;exposure+=sample;peak=Math.max(peak,sample);count++;}
        }
      }
      const light=Math.min(1,(count?exposure/count*.65+peak*.35:0)*Math.min(p.strength,1.5)*veil*lift); // the glow on the type arrives with the front, since it samples the same mask
      element.style.setProperty('--light-brightness',String(1+light*(.95-1.13*day)));
      element.style.setProperty('--light-rim',String(light*(.68-.36*day)));
      element.style.setProperty('--light-glow',String(light*.42*(1-day)));
      element.classList.add('light-receiver');
    }
  }
  addEventListener('scroll',()=>{dirty=true;lastReflection=-Infinity;},{passive:true});
  document.fonts.ready.then(()=>{resize();lastReflection=-Infinity;});
  let day=root.dataset.mode==='light'?1:0;
  function render(now) {
    requestAnimationFrame(render);
    if (document.hidden || document.body.classList.contains('viewer-open') || !canvas.width || !canvas.height) { last=now; return; }
    const target=root.dataset.mode==='light'?1:0;
    const easing=Math.abs(day-target)>.002;
    const reduced=motion.matches && !allowMotion;
    // The lamp is the mouse when asked, else the room's resting lamp if it has one.
    const aim=followMouse?pointer:p.rest;
    const trackingTarget=aim?1:0;
    const trackingMoving=Math.abs(tracking-trackingTarget)>.002 || (aim && (Math.abs(pointerEase.x-aim.x)+Math.abs(pointerEase.y-aim.y)>.001));
    const veiling=Math.abs(veil-veilTarget)>.004 || warm<1;
    if (!dirty && !easing && !trackingMoving && !veiling && (reduced || p.breeze===0)) { last=now; return; }
    if (now-last<40) return;
    const dt=Math.min((now-last)/1000,.08); last=now;
    if (!reduced) elapsed+=dt*p.breeze;
    const chase=reduced?1:1-Math.exp(-dt*9);
    tracking+= (trackingTarget-tracking)*chase;
    if(aim){pointerEase.x+=(aim.x-pointerEase.x)*chase;pointerEase.y+=(aim.y-pointerEase.y)*chase;}
    if(warmStart===null)warmStart=now;
    { const w=reduced?1:Math.min(1,(now-warmStart)/(W.dur*1000));
      warm=w>=1?1:Math.max(0,bezier(w,W.x1,W.y1,W.x2,W.y2)); lift=w>=1?1:Math.min(1,warm*W.lift);
      canvas.dataset.arrival=w.toFixed(3); }
    veil+=(veilTarget-veil)*(reduced?1:1-Math.exp(-dt*7));
    if(veilTarget===0 && veil<.03) {
      // dark enough: change rooms, start the new one where its lamp rests, and come back
      // …and the new room warms up from nothing, the same three seconds as a first load.
      p=P[roomNow()]; followMouse=p.follow; plant(); veilTarget=1; veil=1; warmStart=now; warm=0;
      const at=followMouse?pointer:p.rest; if(at){pointerEase.x=at.x;pointerEase.y=at.y;} tracking=at?1:0;
      refreshControls();
    }
    canvas.dataset.motion=reduced?'reduced motion':p.breeze===0?'paused':'running';
    canvas.dataset.motionTime=elapsed.toFixed(3);
    canvas.dataset.tracking=followMouse?'mouse':p.rest?'resting lamp':'hour';
    day=easing?day+(target-day)*.16:target;
    const changed=dirty;
    dirty=false;
    const t=p.t===null?hour():p.t;
    const time=elapsed;
    const sun=lightCycle(t);
    const rgb=sun.colour.join(",");

    const breathing=reduced?1:.96+.025*Math.sin(time*.19)+.015*Math.sin(time*.073);
    surface.style.opacity=String(Math.min(p.strength,1.5)*breathing*veil*lift);
    room.style.background='transparent';
    reset(m);
    m.save(); project(m,t);
    const pool=m.createRadialGradient(0,40,12,0,40,370);
    pool.addColorStop(0,`rgba(${rgb},.9)`);
    pool.addColorStop(.45,`rgba(${rgb},.55)`);
    pool.addColorStop(1,`rgba(${rgb},0)`);
    if(p.shape==='window') {
      // Just four panes; a finite patch of sun with room left around it.
      m.filter=`blur(${(p.soft*.7+2)*sun.softness*ratio}px)`;
      m.fillStyle=pool;
      const {lit,outer}=glass(p.pane);
      m.fill(lit);
      // The frame itself: the mullion cross and outer border, the darkest tone on paper.
      reset(frameCtx); frameCtx.save(); project(frameCtx,t);
      frameCtx.filter=m.filter; frameCtx.fillStyle='rgb(74,66,50)';
      frameCtx.fill(outer);
      frameCtx.globalCompositeOperation='destination-out';
      frameCtx.fill(lit);
      frameCtx.restore();
    } else if(p.shape==='leaves') {
      m.fillStyle=pool; m.fillRect(-390,-350,780,740);
    }
    m.restore();
    reset(shadeCtx);
    shadeCtx.drawImage(mask,0,0,width,height);
    if(p.shape==='leaves') {
      m.save();m.globalCompositeOperation='destination-out';garden(m,time,t);m.restore();
    }
    // Bound both the light and its shadow to the same feathered footprint.
    for(const layer of [m,shadeCtx,frameCtx]) {
      layer.save();layer.globalCompositeOperation='destination-in';project(layer,t);
      const edge=layer.createRadialGradient(-50,25,30,-50,25,350);
      edge.addColorStop(0,'black');edge.addColorStop(.45,'rgba(0,0,0,.85)');edge.addColorStop(1,'transparent');
      layer.fillStyle=edge;layer.fillRect(-2000,-2000,4000,4000);
      if(warm<1) {
        const front=(W.head+warm*(1-W.head))*REACH, FEATHER=Math.max(1,W.feather);
        const reach=layer.createRadialGradient(SOURCE.x,SOURCE.y,0,SOURCE.x,SOURCE.y,front+FEATHER);
        reach.addColorStop(0,'black');reach.addColorStop(front/(front+FEATHER),'black');reach.addColorStop(1,'transparent');
        layer.fillStyle=reach;layer.fillRect(-4000,-4000,8000,8000);
      }
      layer.restore();
    }
    // On pale paper the occluder casts a shadow (leaves, or the window's frame and
    // surround); on dark paper the light reveals its silhouette. Subtract the lit
    // part from the bounded pool to get the complementary shadow.
    shadeCtx.save();shadeCtx.globalCompositeOperation='destination-out';
    shadeCtx.drawImage(mask,0,0,width,height);
    shadeCtx.globalCompositeOperation='source-in';shadeCtx.fillStyle='rgb(74,66,50)';
    shadeCtx.fillRect(0,0,width,height);shadeCtx.restore();
    reset(ctx);
    ctx.globalAlpha=sun.intensity*(1-day);
    ctx.drawImage(mask,0,0,width,height);
    ctx.globalAlpha=(p.shape==='leaves'?.5:.2)*day;ctx.drawImage(shade,0,0,width,height);
    if(p.shape==='window'){ctx.globalAlpha=.42*day;ctx.drawImage(frame,0,0,width,height);}
    ctx.globalAlpha=1;
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='destination-in';
    ctx.fillStyle=grainPattern;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
    reflectText(now,day,changed||easing||warm<1);

  }
  requestAnimationFrame(render);
  // Refresh the clock even with motion disabled or the controls hidden.
  let refreshControls=()=>{};
  setInterval(()=>{if(p.t===null){dirty=true;refreshControls();}},10000);
  const panel=document.getElementById('light-panel');
  if(!panel || !(panel.dataset.dev || url.searchParams.has('light') || url.searchParams.has('sun')))return;
  // On the live site the panel only appears when the URL asks for it. In local dev it
  // stays out of the way, so localhost looks like what ships, until ⌘D (or Ctrl+D).
  const asked=url.searchParams.has('light') || url.searchParams.has('sun');
  panel.hidden=!asked;
  if(panel.dataset.dev) addEventListener('keydown',event=>{
    if(!(event.metaKey||event.ctrlKey) || event.altKey || event.shiftKey || event.code!=='KeyD')return;
    event.preventDefault();
    panel.hidden=!panel.hidden;
    if(!panel.hidden){panel.classList.remove('closed');document.getElementById('lp-head').setAttribute('aria-expanded','true');}
  });
  const buttons=panel.querySelectorAll('[data-shape]'), inputs=panel.querySelectorAll('input[data-k]');
  const varieties=panel.querySelectorAll('[data-leaf]');
  const kinds=panel.querySelectorAll('[data-pane]');
  const paneChoices=document.getElementById('lp-panes');
  const leafChoices=document.getElementById('lp-leaves');
  const follow=document.getElementById('lp-follow');
  const motionStatus=document.getElementById('lp-motion');
  function sync(){
    document.querySelector('#lp-head span').textContent='light & shadow · '+(roomNow()==='light'?'day':'night');
    follow.setAttribute('aria-pressed',String(followMouse));
    follow.textContent=followMouse?'lamp at mouse · on':'lamp at mouse';
    motionStatus.textContent=motion.matches && !allowMotion?'reduced motion':p.breeze===0?'breeze paused':'leaves swaying';
    leafChoices.hidden=p.shape!=='leaves';
    panel.querySelectorAll('[data-hourly]').forEach(el=>{el.hidden=p.shape==='leaves' && !!p.rest;});
    paneChoices.hidden=p.shape!=='window';
    kinds.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pane===p.pane)));
    panel.querySelectorAll('[data-only]').forEach(el=>{el.hidden=el.dataset.only!==p.shape;});
    varieties.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.leaf===p.leaf)));
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shape===p.shape)));
    const t=p.t??hour();
    document.getElementById('lp-source').textContent=lightCycle(t).label;
    inputs.forEach(i=>{
      const value=i.dataset.k==='t'?t:p[i.dataset.k];
      i.value=value;
      const label=i.dataset.k==='t'?clockLabel(value):i.dataset.k==='soft'?String(value):Number(value).toFixed(2);
      i.nextElementSibling.textContent=label;
      i.setAttribute('aria-valuetext',label);
    });
  }
  follow.addEventListener('click',()=>{followMouse=!followMouse;p.follow=followMouse;save();sync();dirty=true;});
  buttons.forEach(b=>b.addEventListener('click',()=>{p.shape=b.dataset.shape;save();sync();dirty=true;}));
  varieties.forEach(b=>b.addEventListener('click',()=>{p.leaf=b.dataset.leaf;save();sync();dirty=true;}));
  kinds.forEach(b=>b.addEventListener('click',()=>{p.pane=b.dataset.pane;save();sync();dirty=true;}));
  // One press for the look Eric pointed at: a big, soft, slow canopy with near and far.
  document.getElementById('lp-canopy').addEventListener('click',()=>{Object.assign(p,{shape:'leaves',leaf:'willow',scale:2.3,soft:16,density:1.7,breeze:.6});allowMotion=true;plant();save();sync();dirty=true;});
  inputs.forEach(i=>i.addEventListener('input',()=>{p[i.dataset.k]=+i.value;if(i.dataset.k==='breeze' && p.breeze>0)allowMotion=true;if(i.dataset.k==='density')plant();save();sync();dirty=true;}));
  document.getElementById('lp-now').addEventListener('click',()=>{p.t=null;save();sync();dirty=true;});
  document.getElementById('lp-reset').addEventListener('click',()=>{const room=roomNow();P[room]={...rooms[room]};p=P[room];plant();followMouse=p.follow;allowMotion=false;save();sync();dirty=true;});
  // ---- arrival tuner: drag the two handles, or the sliders; replay to watch it again ----
  const arr=document.getElementById('lp-arrival');
  if(arr) {
    const svg=arr.querySelector('svg'), path=svg.querySelector('.ac-curve'), l1=svg.querySelector('.ac-l1'), l2=svg.querySelector('.ac-l2');
    const h1=svg.querySelector('.ac-h1'), h2=svg.querySelector('.ac-h2'), play=svg.querySelector('.ac-play'), read=document.getElementById('lp-arrival-read');
    const sliders=arr.querySelectorAll('input[data-w]');
    const X=v=>10+v*100, Y=v=>130-v*100; // y runs −0.2 … 1.2 so an overshoot can be drawn
    const replay=()=>{warmStart=null;warm=0;lift=0;dirty=true;};
    const draw=()=>{
      path.setAttribute('d',`M${X(0)} ${Y(0)} C${X(W.x1)} ${Y(W.y1)} ${X(W.x2)} ${Y(W.y2)} ${X(1)} ${Y(1)}`);
      l1.setAttribute('x2',X(W.x1));l1.setAttribute('y2',Y(W.y1));l2.setAttribute('x2',X(W.x2));l2.setAttribute('y2',Y(W.y2));
      h1.setAttribute('cx',X(W.x1));h1.setAttribute('cy',Y(W.y1));h2.setAttribute('cx',X(W.x2));h2.setAttribute('cy',Y(W.y2));
      sliders.forEach(i=>{i.value=W[i.dataset.w];i.nextElementSibling.textContent=i.dataset.w==='feather'?String(W.feather):Number(W[i.dataset.w]).toFixed(2);});
      read.textContent=`${W.dur.toFixed(1)}s · cubic-bezier(${[W.x1,W.y1,W.x2,W.y2].map(v=>+v.toFixed(2)).join(', ')}) · head ${W.head.toFixed(2)} · feather ${W.feather} · lift ${W.lift.toFixed(1)}`;
      try{localStorage.setItem('ew.arrival',JSON.stringify(W));}catch{}
    };
    for(const [handle,kx,ky] of [[h1,'x1','y1'],[h2,'x2','y2']]) {
      handle.addEventListener('pointerdown',e=>{handle.setPointerCapture(e.pointerId);e.preventDefault();});
      handle.addEventListener('pointermove',e=>{
        if(!handle.hasPointerCapture(e.pointerId))return;
        const box=svg.getBoundingClientRect(), sx=120/box.width, sy=160/box.height;
        W[kx]=Math.min(1,Math.max(0,((e.clientX-box.left)*sx-10)/100));
        W[ky]=Math.min(1.2,Math.max(-.2,(130-(e.clientY-box.top)*sy)/100));
        draw();
      });
      handle.addEventListener('pointerup',replay);
    }
    sliders.forEach(i=>{i.addEventListener('input',()=>{W[i.dataset.w]=+i.value;draw();});i.addEventListener('change',replay);});
    document.getElementById('lp-arrival-replay').addEventListener('click',replay);
    document.getElementById('lp-arrival-reset').addEventListener('click',()=>{W={...warmDefaults};draw();replay();});
    // a dot rides the curve while the light arrives, so the curve and the page can be read together
    (function tick(){const t=Number(canvas.dataset.arrival||1);play.setAttribute('cx',X(t));play.setAttribute('cy',Y(t>=1?1:bezier(t,W.x1,W.y1,W.x2,W.y2)));requestAnimationFrame(tick);})();
    draw();
  }
  const head=document.getElementById('lp-head');
  head.addEventListener('click',()=>head.setAttribute('aria-expanded',String(!panel.classList.toggle('closed'))));
  refreshControls=sync;
  sync();
})();
