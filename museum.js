/* Local, dependency-free design prototype. No telemetry or network requests. */
(()=>{'use strict';
const $=id=>document.getElementById(id),data=window.MUSEUM_DATA,byId=new Map(data.map(p=>[p.id,p]));
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let favorites=[],prefs={seconds:20,type:'filtered',shuffle:false};
try{favorites=JSON.parse(localStorage.getItem('smartisan.favorites.v1')||'[]');if(!Array.isArray(favorites))favorites=[];prefs={...prefs,...JSON.parse(localStorage.getItem('smartisan.player.v1')||'{}')};}catch{}
let group='手机',category='主型号',query='',favoritesOnly=false,current=data[0],photo=0;
let playing=false,paused=false,queue=[],position=0,timer=null,hideTimer=null,elapsed=0,savedScroll=0,previousFocus=null;
let sceneVersion=0,readingIndex=-1,lastClock=-1;
const sceneAnimations=new Set(),reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const groups=['手机','周边','档案'];
const subcategories={手机:['全部','主型号','特别版本'],周边:['全部','耳机','TNT','配件','足迹','包装','合作生态'],档案:['全部','系统']};
function chronological(rows){return [...rows].sort((a,b)=>(a.release_date||'9999-12-31').localeCompare(b.release_date||'9999-12-31'));}
function store(){try{localStorage.setItem('smartisan.favorites.v1',JSON.stringify(favorites));localStorage.setItem('smartisan.player.v1',JSON.stringify(prefs));}catch{}}
function toast(t){$('toast').textContent=t;$('toast').hidden=false;setTimeout(()=>$('toast').hidden=true,3500);}
function filtered(){return chronological(data.filter(p=>p.collection_group===group&&(category==='全部'||(category==='主型号'?p.category==='手机':p.category===category))&&(!favoritesOnly||favorites.includes(p.id))&&JSON.stringify([p.name,p.features,p.design_reading,p.variants,p.era,p.launch_options]).toLowerCase().includes(query.toLowerCase())));}
function render(){document.querySelectorAll('#collection-tabs button').forEach(b=>{b.classList.toggle('active',b.dataset.group===group);b.setAttribute('aria-pressed',b.dataset.group===group);});document.querySelectorAll('#filters button').forEach(b=>{b.classList.toggle('active',b.dataset.category===category);b.setAttribute('aria-pressed',b.dataset.category===category);});const rows=filtered();$('count').textContent=`${rows.length} 件${group==='手机'?'手机藏品':group==='周边'?'周边藏品':'系统档案'}`;$('only-favorites').textContent=favoritesOnly?'♥ 正在看我的一柜':'♡ 我的一柜';$('only-favorites').setAttribute('aria-pressed',favoritesOnly);$('empty').hidden=rows.length>0;$('grid').innerHTML=rows.map(p=>`<button class="card" data-id="${escape(p.id)}"><figure><img loading="lazy" src="${escape(p.images[0]||'')}" alt="${escape(p.name)} 产品图"></figure><div class="card-copy"><div class="meta">${escape(p.release_date||p.date_label||'首发日期未确证')} · ${escape(p.category)}</div><h3>${escape(p.name)}${favorites.includes(p.id)?' ♡':''}</h3>${p.launch_options?.length?'<div class="launch-from">发布价 ¥'+Math.min(...p.launch_options.map(o=>o.price_cny)).toLocaleString('zh-CN')+' 起</div>':''}<div class="sub">${escape(p.category==='手机'?p.features.split('、').slice(0,2).join(' · '):p.features.slice(0,35))}</div></div></button>`).join('');}
function renderSubcategories(){$('filters').innerHTML=subcategories[group].map(c=>`<button data-category="${c}" aria-pressed="false">${c}</button>`).join('');}
function selectGroup(value){group=value;category=group==='手机'?'主型号':'全部';renderSubcategories();render();}
$('collection-tabs').innerHTML=groups.map(g=>`<button data-group="${g}" aria-pressed="false">${g==='档案'?'系统档案':g}</button>`).join('');$('collection-tabs').onclick=e=>{const b=e.target.closest('[data-group]');if(b)selectGroup(b.dataset.group);};document.querySelectorAll('[data-collection]').forEach(a=>a.onclick=()=>selectGroup(a.dataset.collection));renderSubcategories();$('filters').onclick=e=>{const b=e.target.closest('button');if(b){category=b.dataset.category;render();}};$('search').oninput=e=>{query=e.target.value;render();};$('only-favorites').onclick=()=>{favoritesOnly=!favoritesOnly;render();};$('grid').onclick=e=>{const b=e.target.closest('[data-id]');if(b)openDetail(b.dataset.id);};
$('hero-img').src=data[0].images[0];$('hero').onclick=()=>openDetail('t1');
function setPhoto(n){photo=n;const p=current;$('detail-img').src=p.images[n];$('detail-img').alt=p.name+' 官方照片 '+(n+1);$('thumbs').innerHTML=p.images.map((src,i)=>`<button data-photo="${i}" aria-label="查看第 ${i+1} 张图片" aria-pressed="${i===n}"><img src="${escape(src)}" alt=""></button>`).join('');}
function openDetail(id){const p=byId.get(id);if(!p)return;current=p;$('detail-kind').textContent=p.category+' / '+p.era;setPhoto(0);const related=p.related_accessories.map(id=>byId.get(id)).filter(Boolean);$('detail-copy').innerHTML=`<div class="eyebrow">COLLECTION / ${escape(p.id.toUpperCase())}</div><h2>${escape(p.name)}</h2><p>${escape(p.features)}</p><button id="favorite">${favorites.includes(p.id)?'♥ 已收入我的一柜':'♡ 收入我的一柜'}</button><h3>简洁参数</h3><dl><div><dt>发布日期</dt><dd>${escape(p.release_date||p.date_label||'首发日期未确证')}</dd></div>${Object.entries(p.specs).map(([k,v])=>`<div><dt>${escape(k)}</dt><dd>${escape(v)}${p.spec_notes?.[k]?'<small class="tiny"> · '+escape(p.spec_notes[k])+'</small>':''}</dd></div>`).join('')}</dl>${!p.release_date&&p.date_kind!=='not-applicable'?'<p class="tiny">此项尚无可引用的独立首发记录；不以当前上架时间推定发布日期。</p>':''}${p.launch_options?.length?'<h3>发布配置与价格</h3><table class="launch-table"><thead><tr><th>可选配置</th><th>公布价格</th></tr></thead><tbody>'+p.launch_options.map(o=>`<tr><td>${escape(o.configuration)}</td><td>¥${Number(o.price_cny).toLocaleString('zh-CN')}</td></tr>`).join('')+'</tbody></table><p class="tiny">人民币 · 发布时公布价格</p>'+(p.launch_price_note?'<p class="tiny">'+escape(p.launch_price_note)+'</p>':''):''}<h3>设计观察</h3><p>${escape(p.design_reading)}</p><p class="tiny">策展观察，非设计师原话。</p>${p.variants.length?'<h3>版本与配色</h3><ul>'+p.variants.map(v=>`<li>${escape(typeof v==='string'?v:v.options.join(' / '))}</li>`).join('')+'</ul>':''}${related.length?'<h3>打开配件抽屉</h3><div class="relations">'+related.map(r=>`<button data-related="${escape(r.id)}">${escape(r.name)}</button>`).join('')+'</div><p class="tiny">'+escape(p.relationship_note)+'</p>':''}<h3>资料来源</h3><div class="links">${p.sources.map((u,i)=>`<p><a href="${escape(u)}" target="_blank" rel="noopener noreferrer">${i+1}. ${escape(u)}</a></p>`).join('')}</div>`;$('favorite').onclick=()=>{favorites=favorites.includes(p.id)?favorites.filter(x=>x!==p.id):[...favorites,p.id];store();$('favorite').textContent=favorites.includes(p.id)?'♥ 已收入我的一柜':'♡ 收入我的一柜';render();};$('detail-copy').querySelectorAll('[data-related]').forEach(b=>b.onclick=()=>openDetail(b.dataset.related));if(!$('detail').open)$('detail').showModal();}
$('thumbs').onclick=e=>{const b=e.target.closest('[data-photo]');if(b)setPhoto(Number(b.dataset.photo));};$('close-detail').onclick=()=>$('detail').close();$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail').close();}});
$('zoom').onclick=()=>{$('zoom-img').src=current.images[photo];$('zoom-img').alt=current.name+' 放大照片';$('zoom-range').value=1;$('zoom-img').style.cssText='';$('zoom-dialog').showModal();};$('close-zoom').onclick=()=>$('zoom-dialog').close();$('zoom-range').oninput=e=>{const s=Number(e.target.value);$('zoom-img').style.maxWidth=85*s+'%';$('zoom-img').style.maxHeight=100*s+'%';$('zoom-img').style.width=s>1?85*s+'%':'';};
$('settings').onclick=()=>{$('duration').value=String(prefs.seconds);$('queue-type').value=prefs.type;$('shuffle').checked=prefs.shuffle;$('settings-dialog').showModal();};$('save-settings').onclick=()=>{prefs={seconds:Number($('duration').value),type:$('queue-type').value,shuffle:$('shuffle').checked};store();$('settings-dialog').close();};
function wakeControls(){$('player').classList.remove('quiet');clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(playing&&!paused)$('player').classList.add('quiet');},3000);}
function animatePart(element,frames,options={}){
  if(!element||reducedMotion.matches||!element.animate)return Promise.resolve();
  const animation=element.animate(frames,{duration:550,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both',...options});
  sceneAnimations.add(animation);
  return animation.finished.catch(()=>{}).finally(()=>{sceneAnimations.delete(animation);animation.cancel();});
}
function clearSceneMotion(){
  sceneAnimations.forEach(animation=>animation.cancel());
  sceneAnimations.clear();
  document.querySelectorAll('.player-photo-ghost').forEach(element=>element.remove());
}
function enterScene(direction=1,opening=false){
  const object=document.querySelector('.player-object'),mat=document.querySelector('.player-image-mat');
  const directionOffset=direction*24;
  animatePart(object,[
    {opacity:0,transform:`translateX(${directionOffset}px) translateY(16px) rotateY(${-direction*4}deg) scale(.975)`},
    {opacity:1,transform:'translateX(-2px) translateY(-3px) rotateY(0deg) scale(1.003)',offset:.76},
    {opacity:1,transform:'none'}
  ],{duration:opening?900:760});
  animatePart($('player-img'),[{opacity:.25,transform:'translateY(11px) scale(.975)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:950,delay:60});
  document.querySelectorAll('.player-shutter').forEach((tile,i)=>{
    const order=[0,3,6,1,4,7,2,5,8][i];
    animatePart(tile,[{opacity:1,transform:'rotateX(0deg) translateZ(2px)'},{opacity:1,offset:.25},{opacity:0,transform:'rotateX(-88deg) translateZ(10px)'}],{duration:390,delay:order*32+20});
  });
  const textParts=[document.querySelector('.player-overline'),$('player-title'),$('player-design-headline'),document.querySelector('.player-notes-heading')];
  textParts.forEach((element,i)=>animatePart(element,[{opacity:0,transform:`translateX(${direction*13}px) translateY(9px)`},{opacity:1,transform:'none'}],{duration:600,delay:100+i*85}));
  animatePart(document.querySelector('.player-design-rule'),[{transform:'scaleX(0)',opacity:0},{transform:'scaleX(1)',opacity:1}],{duration:700,delay:250});
  document.querySelectorAll('.player-feature').forEach((card,i)=>animatePart(card,[
    {opacity:0,transform:'translateY(22px) rotateX(-10deg) scale(.97)'},
    {opacity:1,transform:'translateY(-2px) rotateX(0deg) scale(1.004)',offset:.76},
    {opacity:1,transform:'none'}
  ],{duration:650,delay:330+i*95}));
  animatePart(document.querySelector('.player-glass-sheen'),[{opacity:0,transform:'translateX(-105%)'},{opacity:.6,offset:.4},{opacity:0,transform:'translateX(105%)'}],{duration:1450,delay:450});
  if(opening)animatePart($('player-controls'),[{opacity:0,marginBottom:'-10px'},{opacity:1,marginBottom:'0px'}],{duration:650,delay:450});
}
function updateReading(){
  const cards=[...document.querySelectorAll('#player-features .player-feature')];
  const next=Math.min(cards.length-1,Math.floor(elapsed/Math.max(1,prefs.seconds/cards.length)));
  if(next!==readingIndex){cards.forEach((card,i)=>card.classList.toggle('is-reading',i===next));readingIndex=next;}
  const seconds=Math.max(0,Math.ceil(prefs.seconds-elapsed));
  if(seconds!==lastClock){$('player-clock').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');lastClock=seconds;}
}
function chooseHighlights(pool){
  if(!Array.isArray(pool)||pool.length<3)return [];
  const rest=pool.slice(1);
  for(let i=rest.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
  const count=Math.min(pool.length,3+Math.floor(Math.random()*3));
  return [pool[0],...rest.slice(0,count-1)];
}
function display(){
  const p=queue[position];if(!p)return;
  $('player').style.setProperty('--exhibit-accent',p.display_accent||'#b99a76');
  $('player-img').src=p.images[0];$('player-img').alt=p.name+' 产品图';
  $('player-title').textContent=p.name;$('player-era').textContent=p.category;
  $('player-date').textContent=p.release_date||p.date_label||'藏品档案';
  $('player-object-index').textContent=String(data.findIndex(x=>x.id===p.id)+1).padStart(3,'0');
  $('player-object-category').textContent=p.collection_group==='手机'?'MOBILE PHONE':p.category==='系统'?'SMARTISAN OS':'OBJECTS & ACCESSORIES';
  $('player-design-headline').textContent=p.design_headline||p.design_reading;
  const highlights=chooseHighlights(p.design_highlights);
  $('player-features').innerHTML=highlights.map((h,i)=>`<li class="player-feature ${i===0?'signature':''}" style="--note-delay:${i*70}ms"><span class="feature-number">${String(i+1).padStart(2,'0')}</span><div><h3>${escape(h.title)}</h3><p>${escape(h.text)}</p></div></li>`).join('');
  $('player-features').dataset.count=String(highlights.length);
  $('player-counter').textContent=`${position+1} / ${queue.length}`;$('pause').textContent=paused?'继续':'暂停';
  elapsed=0;readingIndex=-1;lastClock=-1;$('progress').style.width='0';updateReading();
  $('player-label').style.transform=`translateY(${(position%3-1)*5}px)`;
}

function move(delta){
  if(!playing||!queue.length)return;
  ++sceneVersion;clearSceneMotion();
  const previousSource=$('player-img').src;
  position=(position+delta+queue.length)%queue.length;display();
  if(!reducedMotion.matches&&previousSource){
    const ghost=document.createElement('img');ghost.src=previousSource;ghost.alt='';ghost.setAttribute('aria-hidden','true');ghost.className='player-photo-ghost';
    document.querySelector('.player-image-mat').appendChild(ghost);
    animatePart(ghost,[{opacity:1,transform:'scale(1)'},{opacity:0,transform:`translateX(${-delta*14}px) scale(.985)`}],{duration:270}).then(()=>ghost.remove());
  }
  enterScene(delta);wakeControls();
}
function tick(){if(!playing||paused)return;elapsed+=0.1;updateReading();$('progress').style.width=Math.min(100,elapsed/prefs.seconds*100)+'%';if(elapsed>=prefs.seconds)move(1);}
async function start(){queue=(prefs.type==='phones'?chronological(data.filter(p=>p.category==='手机')):prefs.type==='favorites'?data.filter(p=>favorites.includes(p.id)):prefs.type==='all'?data:filtered()).filter(p=>p.images.length);if(!queue.length){toast('这个播放范围暂时没有藏品。先调整筛选或添加收藏。');return;}if(prefs.shuffle){queue=[...queue];for(let i=queue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];}}position=Math.max(0,queue.findIndex(p=>p.id===current.id));savedScroll=scrollY;previousFocus=document.activeElement;++sceneVersion;clearSceneMotion();playing=true;paused=false;$('player').classList.remove('is-paused');$('player').hidden=false;document.body.style.overflow='hidden';display();wakeControls();$('pause').focus();try{if($('player').requestFullscreen)await $('player').requestFullscreen();else toast('当前浏览器不支持全屏，已进入窗口内轮播。');}catch{toast('浏览器未允许全屏，已进入窗口内轮播。');}if(!playing)return;enterScene(1,true);clearInterval(timer);timer=setInterval(tick,100);}
async function stop(){
  if(!playing)return;playing=false;const version=++sceneVersion;
  clearInterval(timer);clearTimeout(hideTimer);clearSceneMotion();
  await animatePart($('player-stage'),[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'translateY(9px) scale(.99)'}],{duration:180});
  if(version!==sceneVersion)return;
  if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});
  $('player').hidden=true;$('player').classList.remove('quiet','is-paused');document.body.style.overflow='';
  window.scrollTo(0,savedScroll);(previousFocus||$('play')).focus();
}
function togglePause(){paused=!paused;$('player').classList.toggle('is-paused',paused);$('pause').textContent=paused?'继续':'暂停';wakeControls();}
$('play').onclick=start;$('exit').onclick=stop;$('prev').onclick=()=>move(-1);$('next').onclick=()=>move(1);$('pause').onclick=togglePause;$('player').onpointermove=wakeControls;$('player').ontouchstart=wakeControls;$('player-img').onerror=()=>{toast('当前图片加载失败，将跳到下一件。');if(playing&&queue.length>1)setTimeout(()=>{if(playing)move(1);},1500);};
document.addEventListener('fullscreenchange',()=>{if(playing&&!document.fullscreenElement)stop();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){paused=true;$('player').classList.add('is-paused');$('pause').textContent='继续';wakeControls();}});document.addEventListener('keydown',e=>{if(!playing)return;if(e.key==='Escape'){e.preventDefault();stop();}if(e.code==='Space'){e.preventDefault();togglePause();}if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}if(e.key==='Tab')wakeControls();});render();
})();
