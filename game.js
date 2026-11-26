(()=>{
 const game=$('game'), canvas=game.querySelector('canvas'), ctx=canvas.getContext('2d');
 const scene=new Image(),hero=new Image();scene.src='winter.png';hero.src='hero.png';
 const W=640,H=240,floor=205,playerX=75;
 const startSpeed=155, rampSeconds=600, maxSpeedFactor=10, boostFactor=1.5;
 function baseSpeed(seconds){return startSpeed*(1+(maxSpeedFactor-1)*Math.min(seconds/rampSeconds,1))}
 canvas.width=W;canvas.height=H;
 let mode='idle',frame=0,last=0,travel=0,height=0,velocity=0,points=0,elapsed=0,spawn=0,boost=0,magnet=0,items=[];
 let previousObstacle='flake';
 function overlay(title,text,action){$('gameTitle').textContent=title;$('gameText').textContent=text;$('start').textContent=action;$('overlay').hidden=false}
 function jump(){if(mode==='running'&&height===0)velocity=308}
 function reset(){travel=height=velocity=points=elapsed=boost=magnet=0;spawn=40;previousObstacle='flake';items=[];hud()}
 function hud(){$('score').textContent=points+' ★';$('effect').textContent=[boost>0?'Ускорение ×1,5 · '+Math.ceil(boost)+' с':'',magnet>0?'Магнит · '+Math.ceil(magnet)+' с':''].filter(Boolean).join(' / ')||'↑ Прыжок'}
 function draw(){
   ctx.imageSmoothingEnabled=false;ctx.fillStyle='#282b4f';ctx.fillRect(0,0,W,H);
   if(scene.naturalWidth){const offset=Math.floor(travel*.4)%W;ctx.drawImage(scene,-offset,0,W,H);ctx.drawImage(scene,W-offset,0,W,H)}
   for(const o of items){
     const x=Math.round(o.x),y=Math.round(o.y);
     if(o.kind==='bank'){
       ctx.fillStyle='#556292';ctx.fillRect(x-14,y-6,28,7);ctx.fillStyle='#c5deef';ctx.fillRect(x-12,y-12,24,9);ctx.fillRect(x-8,y-18,15,12);ctx.fillStyle='#fffaff';ctx.fillRect(x-8,y-18,13,4);ctx.fillRect(x-12,y-13,5,3);
     }else if(o.kind==='flake'){
       ctx.save();ctx.translate(x,y);
       ctx.beginPath();
       for(let arm=0;arm<6;arm++){
         ctx.moveTo(0,0);ctx.lineTo(0,-12);
         ctx.moveTo(-4,-9);ctx.lineTo(0,-6);ctx.lineTo(4,-9);
         ctx.rotate(Math.PI/3);
       }
       ctx.lineWidth=4;ctx.strokeStyle='#29365c';ctx.stroke();
       ctx.lineWidth=2;ctx.strokeStyle='#aff6ff';ctx.stroke();
       ctx.fillStyle='white';ctx.fillRect(-2,-2,4,4);ctx.restore();
     }else if(o.kind==='star'){
       ctx.fillStyle='#ffdd76';ctx.beginPath();for(let j=0;j<10;j++){const a=j*Math.PI/5-Math.PI/2,r=j%2?4:10;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath();ctx.fill();ctx.fillStyle='#fff5c4';ctx.fillRect(x-2,y-4,3,3);
     }else{ctx.fillStyle=o.kind==='magnet'?'#d1b5ff':'#91ffd4';ctx.fillRect(x-9,y-10,18,20);ctx.fillStyle='#232037';ctx.font='bold 18px monospace';ctx.textAlign='center';ctx.fillText(o.kind==='magnet'?'∪':'»',x,y+6)}
   }
   const bob=height===0?Math.round(Math.abs(Math.sin(travel/11))*3):0;
   if(hero.naturalWidth)ctx.drawImage(hero,playerX-16,floor-40-Math.round(height)-bob,34,40);
 }
 function finish(){mode='over';saveBest(points);overlay('Забег окончен', 'Собрано звёзд — '+points+'. Ваш рекорд — '+Math.max(points,scores().runner??0)+'.','Ещё один забег')}
 function tick(now){
   if(mode!=='running')return;
   elapsed+=(now-last)/1000;
   const dt=Math.min((now-last)/1000,.035);last=now;
   // At top speed with a boost, one frame can cross an entire obstacle.
   const steps=Math.max(1,Math.ceil(dt*120));
   for(let step=0;step<steps&&mode==='running';step++)advance(dt/steps);
   if(mode==='running'){draw();hud();frame=requestAnimationFrame(tick)}
 }
 function advance(dt){
   const speed=baseSpeed(elapsed);
   const dx=speed*(boost>0?boostFactor:1)*dt;
   travel+=dx;boost=Math.max(0,boost-dt);magnet=Math.max(0,magnet-dt);
   height=Math.max(0,height+velocity*dt);velocity=height>0||velocity>0?velocity-850*dt:0;
   spawn-=dx;
   if(spawn<=0){
     const kind=previousObstacle==='bank'&&Math.random()<.36?'flake':'bank';
     const x=W+15+spawn;
     items.push({kind,x,y:kind==='bank'?floor:floor-59});
     previousObstacle=kind;
     // Space hazards by jump duration at the fastest possible approach speed.
     const gap=baseSpeed(elapsed+4)*boostFactor*(.95+Math.random()*.32);
     const roll=Math.random();
     const pickup=roll<.03?'boost':roll<.06?'magnet':'star';
     items.push({kind:pickup,x:x+gap/2,y:floor-(Math.random()<.6?24:66)});
     spawn+=gap;
   }
   for(const o of items){
     o.x-=dx;
     const delta=Math.abs(o.x-playerX),dy=floor-height-20-o.y;
     if(o.kind==='bank'){
       if(delta<19&&height<15){draw();finish();return}
     }else if(o.kind==='flake'){
       if(delta<18&&Math.abs(dy)<25){draw();finish();return}
     }else{
       if(magnet>0&&o.kind==='star'&&Math.hypot(delta,dy)<110){o.x+=(playerX-o.x)*Math.min(1,dt*9);o.y+=dy*Math.min(1,dt*9)}
       if(Math.abs(o.x-playerX)<21&&Math.abs(floor-height-20-o.y)<26){
         if(o.kind==='star')points++;else if(o.kind==='boost')boost=5;else magnet=5;
         o.collected=true;
       }
     }
   }
   items=items.filter(o=>!o.collected&&o.x> -25);
 }
 function run(){if(mode!=='paused')reset();mode='running';$('overlay').hidden=true;last=performance.now();frame=requestAnimationFrame(tick)}
 function pause(){if(mode==='running'){mode='paused';cancelAnimationFrame(frame);overlay('Пауза','Забег продолжится с того же места.','Продолжить')}}
 $('play').onclick=()=>{reset();mode='ready';game.showModal();draw();overlay('Побег Антифриза','Перепрыгивайте сугробы кнопкой ↑, а под снежинками пробегайте по земле. Звезда даёт одно очко, магнит притягивает звёзды, а ускоритель на 5 секунд увеличивает скорость в 1,5 раза.','Начать забег')};
 $('start').onclick=run;$('jump').onpointerdown=e=>{e.preventDefault();jump()};$('jump').onclick=jump;
 $('leave').onclick=()=>game.close();game.onclose=()=>{if(mode==='running'||mode==='paused')saveBest(points);mode='idle';cancelAnimationFrame(frame)};
 document.addEventListener('keydown',e=>{if(game.open&&e.key==='ArrowUp'){e.preventDefault();if(!e.repeat)jump()}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});window.addEventListener('blur',pause);
})();
