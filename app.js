const STORAGE='foreverArchiveMessagesV1';
const PASS='ourMemoryArchivePasswordV1';
let messages=JSON.parse(localStorage.getItem(STORAGE)||'[]');
let currentView='chat', currentDate='all';

const $=s=>document.querySelector(s);
const save=()=>localStorage.setItem(STORAGE,JSON.stringify(messages));

function unlock(){
  const saved=localStorage.getItem(PASS);
  const input=$('#passwordInput').value.trim();
  if(!saved){
    if(!input){$('#lockError').textContent='Choose a password first.';return;}
    localStorage.setItem(PASS,input);
  } else if(input!==saved){$('#lockError').textContent='That password is not correct.';return;}
  $('#lockScreen').classList.add('hidden');$('#app').classList.remove('hidden');render();
}
$('#unlockBtn').onclick=unlock;
$('#passwordInput').addEventListener('keydown',e=>{if(e.key==='Enter')unlock()});

$('#importBtn').onclick=()=>$('#fileInput').click();
$('#fileInput').onchange=e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=()=>importChat(r.result);r.readAsText(f);}};
function importChat(text){
  const lines=text.split(/\r?\n/);
  const patterns=[
    /^(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?:\s?[AP]M)?)\s+-\s+([^:]+):\s?(.*)$/i,
    /^\[(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}),?\s+(\d{1,2}:\d{2}(?:\s?[AP]M)?)\]\s+([^:]+):\s?(.*)$/i
  ];
  let added=0,last=null;
  for(const line of lines){
    let m=null; for(const p of patterns){m=line.match(p);if(m)break;}
    if(m){last={id:Date.now()+Math.random(),date:m[1],time:m[2],sender:m[3].trim(),text:m[4],favorite:false};messages.push(last);added++;}
    else if(last && line.trim()) last.text+='\n'+line;
  }
  save(); alert(added?`${added} messages imported ❤️`:'Could not recognize this export format. Make sure it is a WhatsApp .txt export.');
  render();
}
function filtered(){const q=$('#searchInput').value.toLowerCase();return messages.filter(m=>(currentDate==='all'||m.date===currentDate)&&(`${m.sender} ${m.text} ${m.date}`).toLowerCase().includes(q));}
function esc(s){return s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}
function renderChat(){
  const arr=filtered(), box=$('#messages'), dates=[...new Set(messages.map(m=>m.date))];
  $('#emptyState').classList.toggle('hidden',messages.length>0);
  $('#dateFilter').innerHTML=messages.length?`<button class="date-chip" data-date="all">All</button>`+dates.map(d=>`<button class="date-chip" data-date="${esc(d)}">${esc(d)}</button>`).join(''):'';
  box.innerHTML=arr.map((m,i)=>`${i===0||arr[i-1].date!==m.date?`<div class="date-separator">📅 ${esc(m.date)}</div>`:''}<div class="message ${m.sender.toLowerCase().includes('me')?'me':''}"><button class="fav" data-id="${m.id}">${m.favorite?'⭐':'☆'}</button><div class="meta">${esc(m.sender)} • ${esc(m.time)}</div>${esc(m.text).replace(/\n/g,'<br>')}</div>`).join('');
  document.querySelectorAll('.fav').forEach(b=>b.onclick=()=>{const m=messages.find(x=>x.id==b.dataset.id);m.favorite=!m.favorite;save();render();});
  document.querySelectorAll('.date-chip').forEach(b=>b.onclick=()=>{currentDate=b.dataset.date;renderChat();});
}
function flashback(){
  const box=$('#flashbackMessages'); if(!messages.length){box.innerHTML='<p>Import memories first 💌</p>';return;}
  const dates=[...new Set(messages.map(m=>m.date))], d=dates[Math.floor(Math.random()*dates.length)];
  const arr=messages.filter(m=>m.date===d).slice(0,12);
  $('#flashbackTitle').textContent=`A memory from ${d} ❤️`;
  box.innerHTML=arr.map(m=>`<div class="message"><div class="meta">${esc(m.sender)} • ${esc(m.time)}</div>${esc(m.text)}</div>`).join('');
}
function render(){
  renderChat();
  $('#favoritesList').innerHTML=messages.filter(m=>m.favorite).map(m=>`<div class="message"><div class="meta">${esc(m.date)} • ${esc(m.sender)}</div>${esc(m.text)}</div>`).join('')||'<div class="empty"><div>⭐</div><h3>No favorites yet</h3><p>Star your most special messages.</p></div>';
  const senders=new Set(messages.map(m=>m.sender)).size;
  const days=new Set(messages.map(m=>m.date)).size;
  const chars=messages.reduce((a,m)=>a+m.text.length,0);
  $('#statsGrid').innerHTML=[['💬 Total Messages',messages.length],['📅 Memory Days',days],['👥 People',senders],['✍️ Characters',chars.toLocaleString()]].map(x=>`<div class="stat">${x[0]}<strong>${x[1]}</strong></div>`).join('');
  flashback();
}
$('.content').querySelectorAll('.nav');
document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>{currentView=b.dataset.view;document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.view').forEach(v=>v.classList.add('hidden'));$('#'+currentView+'View').classList.remove('hidden');$('#viewTitle').textContent=b.textContent.trim();});
$('#searchInput').oninput=renderChat;
$('#newFlashback').onclick=flashback;
$('#exportBtn').onclick=()=>{const data=new Blob([JSON.stringify(messages,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(data);a.download='our-forever-archive-backup.json';a.click();};
$('#clearBtn').onclick=()=>{if(confirm('Delete all locally stored imported memories? Your downloaded backup will not be affected.')){messages=[];save();render();}};
