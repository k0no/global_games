function questTime(ms){
  const seconds=Math.floor(ms/1000);
  return Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0')+'.'+String(ms%1000).padStart(3,'0');
}
function displayResult(key,value){
  if(key==='officeTime')return value===null?'квест ещё не пройден':questTime(value);
  return value===null?'ещё не играли':value+' ★';
}
const resultCodec = (() => {
  const bytes = Uint8Array.from('bc8a714e297bf36497de12c653484bb30f455853ae269712a78dbcb3a1ccc62e'.match(/../g), x => parseInt(x,16));
  const key = () => crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt','decrypt']);
  return {
    async encode(id, scores) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const plain = new TextEncoder().encode(JSON.stringify({id,scores}));
      const cipher = await crypto.subtle.encrypt({name:'AES-GCM',iv}, await key(), plain);
      return 'NY1.' + btoa(String.fromCharCode(...iv,...new Uint8Array(cipher))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
    },
    async decode(code) {
      if (!/^NY1\.[\w-]{38,2048}$/.test(code)) throw Error();
      const packed = Uint8Array.from(atob(code.slice(4).replaceAll('-','+').replaceAll('_','/')), c=>c.charCodeAt(0));
      const plain = await crypto.subtle.decrypt({name:'AES-GCM',iv:packed.slice(0,12)},await key(),packed.slice(12));
      const data=JSON.parse(new TextDecoder().decode(plain));
      if (!/^\d{15}$/.test(data.id) || !Object.hasOwn(data.scores,'runner') || !Object.values(data.scores).every(v=>v===null || Number.isSafeInteger(v)&&v>=0)) throw Error();
      return data;
    }
  };
})();
