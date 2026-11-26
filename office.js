(()=>{
  const dialog=$('office'),body=$('officeBody'),key='polar.office.fiveRooms.v1';
  const marks=['❄ Снежинка','▲ Ёлка','★ Звезда'];
  let state,selected=false,message='',detail='',timer;
  const room=()=>questRooms[state.room];
  function newRun(){
    const digits=[];
    while(digits.length<3){const d=1+Math.floor(Math.random()*9);if(!digits.includes(d))digits.push(d)}
    const order=[0,1,2];
    for(let i=2;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
    return {room:0,stage:0,digits,order,start:Date.now()};
  }
  function load(){
    try{
      const s=JSON.parse(localStorage.getItem(key));
      if(s&&Number.isInteger(s.room)&&s.room>=0&&s.room<5&&Number.isInteger(s.stage)&&s.stage>=0&&s.stage<7&&Number.isSafeInteger(s.start)&&s.start>0&&Array.isArray(s.digits)&&s.digits.length===3&&s.digits.every(x=>Number.isInteger(x)&&x>=1&&x<=9)&&new Set(s.digits).size===3&&Array.isArray(s.order)&&s.order.slice().sort().join()==='0,1,2')return s;
    }catch{}
    return null;
  }
  const persist=()=>localStorage.setItem(key,JSON.stringify(state));
  const elapsed=()=>Math.max(1,Date.now()-state.start);
  function clock(){const t=$('officeClock');if(t)t.textContent=questTime(elapsed()).split('.')[0]}
  function intro(){
    clearInterval(timer);
    const saved=load();
    body.innerHTML='<section class="office-story"><div><small>31 ДЕКАБРЯ · 23:42</small><h2>Один в офисе</h2><p>Сборка наконец прошла все тесты. Вы снимаете наушники. У кулера пусто, под дверью конфетти. В рабочем чате фотография из такси: между бухгалтером и завхозом сидит ваша картонная копия. В вашей шапке. Вот кого они пересчитали!</p><p>Дома уже чистят мандарины. До улицы пять комнат, а принтер хранит последнее задание завхоза.</p><p>Таймер идёт от входа в кабинет до выхода на улицу, включая перерывы. В зачёт попадает самое быстрое полное прохождение.</p><button class="primary" id="enterOffice">'+(saved?'Продолжить · '+questRooms[saved.room].name:'Начать квест')+'</button>'+(saved?' <button class="line" id="restartOffice">Начать заново</button>':'')+'</div></section>';
    $('enterOffice').onclick=()=>begin(saved||newRun());
    if(saved)$('restartOffice').onclick=()=>{
      $('restartOffice').textContent='Сбросить текущую попытку и начать';
      $('restartOffice').onclick=()=>begin(newRun());
    };
  }
  function begin(run){state=run;persist();selected=false;message=room().arrival;detail='';render();clearInterval(timer);timer=setInterval(clock,200)}
  function puzzle(){
    const d=state.digits,o=state.order;
    switch(state.room){
      case 0:return {source:'На просвет слева направо: '+o.map(i=>marks[i]).join(' · '),clue:marks.map((m,i)=>m+' = '+d[i]).join(' · '),answer:o.map(i=>d[i]).join('')};
      case 1:return {source:['Танцы — кадр '+d[2],'Тост — кадр '+d[0],'Лотерея — кадр '+d[1]].join(' · '),answer:d.join('')};
      case 2:return {source:'Мёд на одну чашку: пряный чай — '+d[0]+' ложки, яблочный — '+d[1]+', мятный — '+d[2]+'.',answer:String(2*d[0]+d[1])};
      case 3:return {source:o.map((v,i)=>'Письмо № '+(i+1)+' — '+(v*100+30+d[i])+' г').join(' · '),answer:o.map(i=>'АБВ'[i]).join('')};
      case 4:return {source:'Охранник — '+d.join('')+' · Уборщик — '+[d[2],d[1],d[0]].join('')+' · Диспетчер — '+[d[1],d[0],d[2]].join(''),answer:d.join('')};
    }
  }
  function sceneLayer(effect){
    const [id,style,glyph]=effect,[,x,y,w,h]=room().spots[id];
    return '<i aria-hidden="true" class="quest-prop '+style+'" style="left:'+(x+w*.55)+'%;top:'+(y+h*.7)+'%">'+glyph+'</i>';
  }
  function backdrop(){
    if(!state.room)return 'background-image:url(office.png)';
    const tile=state.room-1;
    return 'background-image:url(office-rooms.svg);background-size:200% 200%;background-position:'+(tile%2*100)+'% '+(Math.floor(tile/2)*100)+'%';
  }
  function inventory(){const s=state.stage;if(state.room>0&&s>=4)return null;return [1,3,6].includes(s)?room().actions[s-1][1]:null}
  function render(){
    const r=room(),s=state.stage,carried=inventory();
    const spots=Object.entries(r.spots).map(([id,[label,x,y,w,h]])=>
      '<button type="button" class="object-zone" data-spot="'+id+'" aria-label="'+label+'" title="'+label+'" style="left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%"><span>'+label+'</span></button>').join('');
    const layers=(s===2?sceneLayer(r.effect2):'')+(s>=4?sceneLayer(r.effect4):'')+(s>=5?sceneLayer(r.effect5):'');
    body.innerHTML='<div class="office-heading"><small>КОМНАТА '+(state.room+1)+' ИЗ 5</small><h2>'+r.name+'</h2><time id="officeClock"></time></div><div class="office-room" style="'+backdrop()+'">'+layers+spots+'</div><section class="office-console"><div class="e-tray"><strong>Карман</strong>'+(carried?'<button class="line" id="heldItem" aria-pressed="'+selected+'">'+carried+'</button>':'<span>Пусто</span>')+'<button id="officeHint" class="line">Подсказка</button></div><p id="officeMsg" role="status"></p><div id="eClue"></div><small>Осмотрите предмет в светлой рамке. Чтобы применить находку, выберите её в кармане, затем укажите предмет в комнате.</small></section>';
    clock();$('officeMsg').textContent=message;
    if(detail==='lock'){
      $('eClue').innerHTML='<form id="eLock"><label for="eCode">'+r.puzzle+'</label><input id="eCode" required maxlength="12" autocomplete="off" placeholder="'+r.input+'" '+(state.room===3?'':'inputmode="numeric"')+'><button class="line">Проверить</button></form>';
      $('eLock').onsubmit=e=>{e.preventDefault();const answer=$('eCode').value.trim().toUpperCase().replace(/[\s,·-]/g,'');if(answer===puzzle().answer)advance();else{message='Пока не сходится. Улики можно осмотреть ещё раз.';$('officeMsg').textContent=message;$('eCode').select()}};
    }
    if(detail==='exit')exitPanel();
    body.querySelectorAll('[data-spot]').forEach(b=>b.onclick=()=>inspect(b.dataset.spot));
    if(carried)$('heldItem').onclick=()=>{selected=!selected;tell(selected?'В руке: '+carried+'. Выберите место применения.':'Предмет убран в карман.')};
    $('officeHint').onclick=()=>{const [id]=r.actions[s];if(state.room>0&&s>=4)return tell(exitHints[state.room][s-4]);tell(s===4?'Сопоставьте улики: '+r.spots[r.source][0]+' и '+r.spots[r.clue][0]+'. Затем осмотрите '+r.spots[id][0]+'.':(carried?'Выберите «'+carried+'» в кармане и примените здесь: ':'Осмотрите: ')+r.spots[id][0]+'.')};
  }
  function tell(text,view=''){message=text;detail=view;render()}
  function inspect(id){
    const r=room(),s=state.stage,target=r.actions[s][0];
    if(selected){if(inventory()&&id===target)return advance();return tell('Предмет сюда не подходит. Можно убрать его в карман.')}
    if(state.room>0&&s>=4&&id===target)return tell(exitHints[state.room][s-4],'exit');
    if(s===4&&id===target)return tell(r.spots[id][5],'lock');
    if(id===target&&!inventory())return advance();
    if(id===r.source&&s>=4)return tell(puzzle().source);
    if(id===r.clue)return tell(puzzle().clue||r.spots[id][5]);
    if(id===target&&inventory())return tell(r.spots[id][5]+' Выберите предмет в кармане.');
    tell(r.spots[id][5]);
  }

  const exitHints=[null,
    ['На проекторе соберите программу по времени: поставьте кадры в нужной последовательности.','У проектора поверните кольцо резкости, пока не прочтёте надпись.','На экране потяните нижнюю рейку, чтобы открыть проход.'],
    ['У кружек соберите поднос по заказу курьера.','У чайной коробки отмерьте мёд на весь заказ по рецепту.','Позвоните у раздачи: курьер заберёт чай и придержит дверь.'],
    ['В ячейках разложите письма по весу. Границы указаны в тарифной таблице.','В ячейках выберите отделение для второго письма.','В ячейках отправьте последнее письмо — курьер уберёт тележку.'],
    ['На коммутаторе соединитесь с последним дежурным по графику. Номера есть в справочнике.','У телефона объясните охраннику, кого увезли коллеги.','У телефона назовите деталь с фотографии из такси.']
  ];
  function exitPanel(){
    const box=$('eClue'),s=state.stage,d=state.digits;
    const prompt=document.createElement('strong'),controls=document.createElement('div'),status=document.createElement('output');
    box.append(prompt,controls,status);controls.className='exit-controls';status.setAttribute('aria-live','polite');
    function button(text,fn){const b=document.createElement('button');b.type='button';b.className='line';b.textContent=text;b.onclick=fn;controls.append(b);return b}
    function choose(labels,ok,wrong){labels.forEach((v,i)=>button(v,()=>i===ok?advance():status.textContent=wrong))}
    function dial(label,min,max,value,change){
      const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.value=value;input.setAttribute('aria-label',label);
      controls.append(input);input.oninput=()=>change(+input.value);change(value);return input;
    }
    if(state.room===1){
      if(s===4){
        const frames=[2,0,1],titles=['Тост','Лотерея','Танцы'];
        prompt.textContent='Монтажный стол · нажмите два кадра, чтобы поменять их местами.';
        let first=null;
        const buttons=frames.map((_,i)=>button('',()=>{
          if(first===null)first=i;else{[frames[first],frames[i]]=[frames[i],frames[first]];first=null}
          paint();
        }));
        function paint(){buttons.forEach((b,i)=>{b.textContent=(i+1)+'. '+titles[frames[i]];b.setAttribute('aria-pressed',String(first===i))})}
        paint();button('Показать слайды',()=>frames.every((v,i)=>v===i)?advance():status.textContent='Проектор остановился: проверьте хронологию по программе вечера.');
      }else if(s===5){
        prompt.textContent='Кольцо резкости';
        const focus=d[0]+1;
        const slider=dial('Резкость проектора',0,12,0,v=>{
          status.textContent='Потяните за нижнюю рейку экрана';status.style.filter='blur('+Math.min(5,Math.abs(focus-v)*1.3)+'px)';
        });
        button('Зафиксировать фокус',()=>+slider.value===focus?advance():$('officeMsg').textContent='Буквы ещё расплываются. Попробуйте повернуть кольцо.');
      }else{
        prompt.textContent='Нижняя рейка · оттяните вниз до упора и отпустите.';
        const rail=dial('Положение рейки',0,100,0,v=>{status.textContent=v+' % хода'});
        button('Отпустить рейку',()=>+rail.value===100?advance():status.textContent='Пружина не зацепилась. Нужен полный ход.');
      }
    }else if(state.room===2){
      if(s===4){
        prompt.textContent='Поднос курьера · выберите напиток для каждой чашки.';
        const tray=[];for(const tea of ['Яблочный','Мятный','Пряный'])button(tea,()=>{if(tray.length<3)tray.push(tea);status.textContent=tray.join(' · ')});
        button('Очистить поднос',()=>{tray.length=0;status.textContent='Поднос пуст.'});
        button('Заварить',()=>tray.filter(t=>t==='Пряный').length===2&&tray.includes('Яблочный')?advance():status.textContent='Этот заказ отличается от записки курьера.');
      }else if(s===5){
        prompt.textContent='Мерная ложка · добавьте мёд на все три чашки.';
        let spoons=0;status.textContent='Ложек: 0';
        for(const n of [1,5,-1])button(n>0?'+'+n:String(n),()=>{spoons=Math.max(0,spoons+n);status.textContent='Ложек: '+spoons});
        button('Размешать',()=>spoons===2*d[0]+d[1]?advance():status.textContent='Проверьте пропорции на доске. Сейчас ложек: '+spoons);
      }else{prompt.textContent='За окошком слышны голоса курьеров.';button('Позвонить в колокольчик',advance)}
    }else if(state.room===3){
      const i=s-4,group=state.order[i],weight=group*100+30+d[i];
      prompt.textContent='Письмо № '+(i+1)+' · '+weight+' г. Положите письмо в нужную ячейку.';
      choose(['Ячейка А','Ячейка Б','Ячейка В'],group,'Письмо вернулось. Сверьтесь с таблицей весовых категорий.');
    }else if(s===4){
      prompt.textContent='Коммутатор · нажмите линию нужного дежурного.';
      choose([[d[1],d[0],d[2]].join(''),d.join(''),[...d].reverse().join('')],1,'На этой линии автоответчик. Проверьте справочник и график.');
    }else if(s===5){
      prompt.textContent='«Кого тогда усадили в такси?»';
      choose(['Ночного диспетчера','Курьера с подносом','Мою картонную копию'],2,'«Не сходится с фотографией. Посмотрите внимательнее: пассажир даже не моргает».');
    }else{
      prompt.textContent='«Что на голове у вашего двойника?»';
      choose(['Моя шапка','Корона из мишуры','Курьерская кепка'],0,'«На снимке что-то другое. Это ведь ваша собственная вещь?»');
    }
  }

  async function advance(){
    const text=room().actions[state.stage][2];selected=false;detail='';
    if(state.stage<6){state.stage++;persist();tell(text+(state.stage===4?' '+puzzle().source:''));return}
    if(state.room<4){state.room++;state.stage=0;persist();tell(text+' '+room().arrival);return}
    const duration=elapsed();body.querySelectorAll('button,input').forEach(el=>el.disabled=true);clearInterval(timer);await saveBest(duration,'officeTime');localStorage.removeItem(key);
    body.innerHTML='<section class="office-story"><div><small>ВЫХОД НА УЛИЦУ</small><h2>Успели!</h2><p>Таксист открывает багажник. Внутри ваша картонная копия, в шапке и с пакетом мандаринов. «Ну что, теперь точно все?»</p><strong>Время прохождения: '+questTime(duration)+'</strong><p><button id="officeReplay" class="primary">Пройти ещё раз</button></p></div></section>';
    $('officeReplay').onclick=intro;
  }
  $('officePlay').onclick=()=>{intro();dialog.showModal()};
  $('officeClose').onclick=()=>dialog.close();dialog.addEventListener('close',()=>clearInterval(timer));
})();