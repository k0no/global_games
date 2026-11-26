const $ = id=>document.getElementById(id);
const catalog={runner:'Побег Антифриза',race:'Гонки на льду',officeTime:'Один в офисе'};
function playerId(){
  let id=localStorage.getItem('polar.id');
  if(!id){id=Array.from(crypto.getRandomValues(new Uint32Array(3)),n=>String(n%100000).padStart(5,'0')).join('');localStorage.setItem('polar.id',id)}
  return id;
}
const id=playerId();
function scores(){return Object.fromEntries(Object.keys(catalog).map(k=>{const v=localStorage.getItem('polar.best.'+k);return [k,v===null?null:Number(v)]}))}
function updateBest(){const all=scores();for(const [game,element] of Object.entries({runner:'best',race:'raceBest',officeTime:'officeBest'}))$(element).textContent=all[game]===null?'—':displayResult(game,all[game])}
function saveBest(n,key='runner'){const save=()=>{localStorage.setItem('polar.best.'+key,String(key==='officeTime'?Math.min(scores()[key]??Infinity,n):Math.max(scores()[key]??0,n)));updateBest()};return navigator.locks?navigator.locks.request('polar.best',save):save()}
$('playerId').textContent=id.replace(/(\d{5})(?=\d)/g,'$1 ');updateBest();window.addEventListener('storage',updateBest);
const panel=$('panel'),content=$('content');
function openPanel(html){content.innerHTML=html;panel.showModal()}
panel.querySelector('.close').onclick=()=>panel.close();
$('showResult').onclick=async()=>{
 const snapshot=scores();
 openPanel('<h2>Ваш результат</h2><p id="stats"></p><label for="code">Код для организатора</label><textarea id="code" readonly rows="4"></textarea><button id="copy" class="primary" disabled>Скопировать</button><p id="notice" role="status"></p>');
 $('stats').textContent='ID '+id+' · '+Object.entries(catalog).map(([key,name])=>name+' — '+(displayResult(key,snapshot[key]))).join(' · ');
 try{$('code').value=await resultCodec.encode(id,snapshot);$('copy').disabled=false}catch{$('notice').textContent='Для формирования кода откройте приложение по HTTPS или на localhost.';return}
 $('copy').onclick=async()=>{try{await navigator.clipboard.writeText($('code').value);$('notice').textContent='Код скопирован. Отправьте его организатору.'}catch{$('code').select();$('notice').textContent='Скопируйте выделенный код.'}};
};
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>$('network').textContent='● Доступен оффлайн').catch(()=>$('network').textContent='Офлайн недоступен')}else $('network').textContent='Офлайн недоступен';
