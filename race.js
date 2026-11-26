(()=>{
  const dialog=$('race'), canvas=$('circuit'), ctx=canvas.getContext('2d');
  const screen=$('gridScreen'), hud=$('raceHud'), controls=$('steering');
  const names=['Антифриз','Мисс Букс','Шеф'];
  const faces=new Image(); faces.src='drivers.png';
  const boss=new Image();boss.src='boss.png';
  const TAU=Math.PI*2, halfWidth=84;
  let mode='garage', driver=0, points=[], road, center, hazards=[], scenery=[];
  let car, time=0, camera=0, ice=0, shove=0, animation=0, last=0;
  const keys=new Set(), touches=new Map(), tracks=[];
  const polar=(a,r)=>({x:Math.cos(a)*r,y:Math.sin(a)*r});
  const turnAngle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  const colors=['#ff538e','#6af6ed','#ffe38c'];
  names.forEach((name,i)=>{
    const label=document.createElement('label');
    label.style.setProperty('--face',(i*50)+'%');
    label.classList.toggle('bossDriver',i===2);
    label.innerHTML='<input type="radio" name="pilot" value="'+i+'" '+(i===0?'checked':'')+'><i class="driverFace"></i>'+name;
    label.querySelector('input').onchange=()=>{driver=i};
    $('drivers').append(label);
  });

  function makeCourse(){
    const phases=Array.from({length:4},()=>Math.random()*TAU);
    const stretch=.74+Math.random()*.24;
    points=Array.from({length:240},(_,i)=>{
      const a=TAU*i/240;
      const r=780+110*Math.sin(2*a+phases[0])+65*Math.sin(3*a+phases[1])+30*Math.cos(4*a+phases[2]);
      const p=polar(a+phases[3],r);p.y*=stretch;return p;
    });
    road=new Path2D();center=new Path2D();hazards=[];scenery=[];
    points.forEach((p,i)=>{
      const q=points[(i+1)%points.length],angle=Math.atan2(q.y-p.y,q.x-p.x);
      const side=polar(angle+Math.PI/2,1);
      if(i===0)road.moveTo(p.x,p.y);else road.lineTo(p.x,p.y);
      if(i%4===0){center.moveTo(p.x,p.y);center.lineTo(q.x,q.y)}
      if(i%3===0){
        const offset=(i%2?1:-1)*(halfWidth+32+Math.random()*67);
        scenery.push({x:p.x+side.x*offset,y:p.y+side.y*offset,a:angle,kind:['tree','lamp','star','palm','tree','star','lamp'][(i/3)%7]});
      }
      if(i>10&&i%10===0){
        const rnd=Math.random(),kind=rnd<.37?'slick':rnd<.70?'snow':'rock';
        const offset=(Math.random()-.5)*102;
        hazards.push({x:p.x+side.x*offset,y:p.y+side.y*offset,kind,angle,cooldown:0});
      }
    });
    road.closePath();
    const a=Math.atan2(points[1].y-points[0].y,points[1].x-points[0].x);
    car={...points[0],a,course:a};camera=a;
    time=ice=shove=0;tracks.length=0;
  }
  function distanceToRoad(){
    let nearest=Infinity;
    for(let i=0;i<points.length;i++){
      const p=points[i],q=points[(i+1)%points.length],dx=q.x-p.x,dy=q.y-p.y;
      const t=Math.max(0,Math.min(1,((car.x-p.x)*dx+(car.y-p.y)*dy)/(dx*dx+dy*dy)));
      nearest=Math.min(nearest,(car.x-p.x-t*dx)**2+(car.y-p.y-t*dy)**2);
    }
    return Math.sqrt(nearest);
  }
  function clearInput(){keys.clear();touches.clear()}
  function showScreen(title,info,button,select){
    screen.hidden=false;controls.hidden=true;$('raceTitle').textContent=title;
    $('raceInfo').textContent=info;$('raceStart').textContent=button;$('drivers').hidden=!select;
  }
  function end(reason){
    mode='over';clearInput();const score=Math.floor(time);saveBest(score,'race');
    showScreen('Заезд окончен',reason+' Очки: '+score+'. Рекорд: '+Math.max(score,scores().race??0)+'.','Ещё один заезд',true);
  }
  function step(dt){
    const left=keys.has('ArrowLeft')||[...touches.values()].includes(-1);
    const right=keys.has('ArrowRight')||[...touches.values()].includes(1);
    time+=dt;ice=Math.max(0,ice-dt);
    const speed=224+113*(1-Math.exp(-time/125));
    car.a+=(Number(right)-Number(left))*1.85*dt;
    car.course+=turnAngle(car.a,car.course)*(1-Math.exp(-dt*(ice>0?.38:4.6)));
    car.x+=(Math.cos(car.course)*speed-Math.sin(car.course)*shove)*dt;
    car.y+=(Math.sin(car.course)*speed+Math.cos(car.course)*shove)*dt;
    shove*=Math.exp(-dt*3.7);camera+=turnAngle(car.course,camera)*(1-Math.exp(-dt*4));
    if(distanceToRoad()>halfWidth-12){end('Удар об ограждение.');return}
    for(const h of hazards){
      const dx=car.x-h.x,dy=car.y-h.y;
      if(h.kind==='slick'){
        const u=dx*Math.cos(h.angle)+dy*Math.sin(h.angle),v=-dx*Math.sin(h.angle)+dy*Math.cos(h.angle);
        if((u/38)**2+(v/22)**2<1)ice=1.6;
      }else if(dx*dx+dy*dy<(h.kind==='rock'?25:27)**2&&time>=h.cooldown){
        if(h.kind==='rock'){end('Столкновение с ледяной скалой.');return}
        shove=(-dx*Math.sin(car.course)+dy*Math.cos(car.course)>=0?1:-1)*150;
        h.cooldown=time+1.3;
      }
    }
    if(Math.abs(turnAngle(car.a,car.course))>.18||ice>0){
      const prev=tracks.at(-1);
      if(!prev||Math.hypot(car.x-prev.x,car.y-prev.y)>6){tracks.push({...car});if(tracks.length>80)tracks.shift()}
    }
  }

  function pathStroke(path,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke(path)}
  function shape(coords,fill,stroke){
    ctx.beginPath();coords.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
    ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}
  }
  function oval(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fillStyle=color;ctx.fill()}
  function paintHazard(h){
    ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.angle);
    if(h.kind==='slick'){
      oval(0,0,39,22,'#558ab6');oval(0,-1,35,18,'#80d5e0');
      shape([[-25,-3],[-6,-11],[16,-10],[-10,-6]],'#e4ffff');shape([[0,8],[16,1],[24,2],[11,7]],'#c5f5ff');
    }else if(h.kind==='snow'){
      oval(2,4,22,15,'#667fa6');oval(0,1,21,14,'#c3d9ee');oval(-4,-3,15,11,'#f6f8ff');
    }else{
      shape([[-18,12],[-13,-8],[-1,-24],[11,-11],[19,11],[5,17]],'#54c7e6','#3c537d');
      shape([[-13,-8],[-1,-24],[0,4],[-18,12]],'#ddffff');shape([[0,4],[11,-11],[19,11],[5,17]],'#668fce');
    }
    ctx.restore();
  }
  function paintCar(){
    ctx.save();ctx.translate(car.x,car.y);ctx.rotate(car.a+Math.PI/2);
    oval(3,5,18,27,'#26325b88');ctx.fillStyle='#202038';
    for(const x of [-17,10])for(const y of [-15,9])ctx.fillRect(x,y,7,12);
    shape([[-12,-24],[11,-24],[15,-14],[15,17],[12,24],[-12,24],[-15,17],[-15,-14]],'#fc5987','#52264d');
    shape([[-10,-22],[10,-22],[12,-12],[-12,-12]],'#ff968e');
    shape([[-12,-10],[12,-10],[10,13],[-10,13]],'#26314f');
    ctx.fillStyle='#fff2b6';ctx.fillRect(-12,-21,6,3);ctx.fillRect(6,-21,6,3);
    ctx.fillStyle='#813362';ctx.fillRect(-16,17,32,4);
    oval(0,1,13,13,'#23223e');
    const portrait=driver===2?boss:faces;
    if(portrait.naturalWidth){
      ctx.save();ctx.beginPath();ctx.arc(0,0,12,0,TAU);ctx.clip();
      const tile=driver===2?portrait.naturalWidth:portrait.naturalWidth/3;
      ctx.drawImage(portrait,driver===2?0:driver*tile,0,tile,portrait.naturalHeight,-12,-12,24,24);ctx.restore();
    }
    ctx.restore();
  }

  // Draw the illuminated props once. Each stamp stays upright as the camera turns.
  function holidayStamp(kind){
    const stamp=document.createElement('canvas');
    stamp.width=104;stamp.height=144;
    const g=stamp.getContext('2d');
    g.scale(2,2);g.translate(26,63);
    function polygon(vertices,fill){
      g.beginPath();vertices.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
      g.closePath();g.fillStyle=fill;g.fill();
    }
    function star(x,y,r){
      const vertices=Array.from({length:10},(_,i)=>{
        const a=i*Math.PI/5-Math.PI/2,length=i%2?r*.46:r;
        return [x+length*Math.cos(a),y+length*Math.sin(a)];
      });
      g.shadowColor='#ffa875';g.shadowBlur=7;polygon(vertices,'#ffe6a4');g.shadowBlur=0;
      g.strokeStyle='#fff4dc';g.lineWidth=1;g.stroke();
    }
    g.fillStyle='#59527780';g.beginPath();g.ellipse(2,2,18,4,0,0,TAU);g.fill();
    if(kind==='star'){
      g.fillStyle='#584268';g.fillRect(-2,-23,4,23);
      g.fillStyle='#9feeea';g.fillRect(-7,-1,14,3);
      star(0,-30,13);
    }else{
      g.fillStyle='#67445b';g.fillRect(-3,-11,6,12);
      for(const [top,bottom,radius] of [[-36,-6,20],[-43,-17,16],[-48,-27,12]]){
        polygon([[0,top],[radius,bottom-2],[5,bottom],[-2,bottom-2],[-radius,bottom]],'#17636b');
        polygon([[0,top],[radius*.65,top+(bottom-top)*.65],[3,top+9],[-2,top+13],[-5,top+11],[-radius*.73,top+(bottom-top)*.73]],'#d9f8fc');
      }
      for(const [y,span] of [[-29,9],[-16,14]]){
        g.beginPath();g.moveTo(-span,y-3);g.quadraticCurveTo(0,y+5,span,y-2);
        g.strokeStyle='#394160';g.stroke();
        for(let j=0;j<5;j++){
          const t=j/4;g.fillStyle=['#ff83b5','#ffe390','#78ffee'][j%3];
          g.beginPath();g.arc((2*t-1)*span,y-2+3*Math.sin(t*Math.PI),1.6,0,TAU);g.fill();
        }
      }
      star(0,-50,5);
      g.fillStyle='#dc578b';g.fillRect(9,-6,11,8);
      g.fillStyle='#ffe4a4';g.fillRect(13,-6,2,8);g.fillRect(9,-4,11,1);
    }
    return stamp;
  }
  const holidayStamps={tree:holidayStamp('tree'),star:holidayStamp('star')};

  function draw(){
    const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);
    if(!w||!h)return;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const sky=ctx.createLinearGradient(0,0,w,h);sky.addColorStop(0,'#b769a2');sky.addColorStop(.5,'#72679f');sky.addColorStop(1,'#38577c');
    ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.translate(w*.5,h*.67);
    const zoom=Math.max(.67,Math.min(1.55,w/370,h/320));ctx.scale(zoom,zoom);
    ctx.rotate(-camera-Math.PI/2);ctx.translate(-car.x,-car.y);
    ctx.lineJoin='round';ctx.lineCap='round';
    const viewRadius=Math.hypot(w*.5,h*.67)/zoom+75;
    for(const s of scenery){
      if(Math.hypot(s.x-car.x,s.y-car.y)>viewRadius)continue;
      ctx.save();ctx.translate(s.x,s.y);
      if(holidayStamps[s.kind]){
        ctx.rotate(camera+Math.PI/2);ctx.drawImage(holidayStamps[s.kind],-26,-63,52,72);
      }else if(s.kind==='palm'){
        ctx.rotate(s.a);
        oval(3,4,17,14,'#63547e');
        for(let j=0;j<7;j++){ctx.rotate(TAU/7);shape([[0,1],[6,-11],[3,-24],[-2,-14],[-3,-6]],j%2?'#247b85':'#426c91');shape([[0,-3],[3,-20],[3,-11]],'#cde1ed')}
      }else{oval(0,0,6,6,'#5d4275');oval(0,0,3,3,'#ffd1a8')}
      ctx.restore();
    }
    pathStroke(road,'#62466e',halfWidth*2+21);pathStroke(road,'#f5adcf',halfWidth*2+12);
    pathStroke(road,'#95ffef',halfWidth*2+5);pathStroke(road,'#516783',halfWidth*2);
    pathStroke(road,'#718da8',halfWidth*2-9);pathStroke(road,'#829bb6',halfWidth*2-28);pathStroke(center,'#b8cde0',2);
    for(const t of tracks){
      ctx.save();ctx.translate(t.x,t.y);ctx.rotate(t.course+Math.PI/2);ctx.fillStyle='#414d7466';
      ctx.fillRect(-11,9,2,6);ctx.fillRect(9,9,2,6);ctx.restore();
    }
    hazards.forEach(paintHazard);paintCar();ctx.restore();
    $('racePoints').textContent=Math.floor(time)+' ★';
  }
  function frame(now){
    if(mode!=='running')return;
    let dt=Math.min((now-last)/1000,.12);last=now;
    while(dt>0&&mode==='running'){const sub=Math.min(1/90,dt);step(sub);dt-=sub}
    draw();if(mode==='running')animation=requestAnimationFrame(frame);
  }
  function start(){
    if(mode!=='paused')makeCourse();
    clearInput();mode='running';screen.hidden=true;controls.hidden=false;hud.hidden=false;
    hud.classList.toggle('bossDriver',driver===2);hud.style.setProperty('--face',(driver*50)+'%');draw();last=performance.now();animation=requestAnimationFrame(frame);
  }
  function pause(){if(mode==='running'){mode='paused';cancelAnimationFrame(animation);clearInput();showScreen('Пауза','Продолжите заезд с того же места.','Продолжить',false)}}
  $('racePlay').onclick=()=>{
    mode='garage';hud.hidden=true;
    showScreen('Гонки на льду','Рулите стрелками ← → или кнопками на экране. Лужа усиливает занос, сугроб отбрасывает вбок. Удар о скалу или ограждение завершает заезд.','На трассу',true);
    dialog.showModal();
  };
  $('raceStart').onclick=start;$('raceExit').onclick=()=>dialog.close();
  dialog.onclose=()=>{if(mode==='running'||mode==='paused')saveBest(Math.floor(time),'race');mode='garage';clearInput();cancelAnimationFrame(animation)};
  document.addEventListener('keydown',e=>{if(mode==='running'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();keys.add(e.key)}});
  document.addEventListener('keyup',e=>keys.delete(e.key));
  controls.querySelectorAll('button').forEach(b=>{
    b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touches.set(e.pointerId,Number(b.dataset.turn))};
    b.onlostpointercapture=b.onpointercancel=b.onpointerup=e=>touches.delete(e.pointerId);
  });
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
})();