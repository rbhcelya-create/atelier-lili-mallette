/* =================================================================
   L'ATELIER — Outil de gestion Lili Mallette  (prototype)
   Structure : Projet (le contenu) > Livrables (balado / vidéo / spectacle)
   Pipeline d'après le schéma client.
   ================================================================= */

const TEAM = [
  { id:'lise',  name:'Lise Martin',         role:'Créatrice & narratrice',        access:'admin',   color:'#C04A3F' },
  { id:'fred',  name:'Frédérick Rouleau',   role:'Univers visuel',                access:'editeur', color:'#6E8E63' },
  { id:'bruno', name:'Bruno Lefebvre',      role:'Réalisation sonore & musicale', access:'admin',   color:'#2F4259' },
  { id:'anne',  name:'Anne Kishnapanaïdou', role:'Coordonnatrice',                access:'admin',   color:'#C28A2C' },
  { id:'line',  name:'Line Charlebois',     role:'Fiche pédagogique',             access:'editeur', color:'#8C8270' },
  { id:'ana',   name:'Ana de Rosario',      role:'Marketing & réseaux sociaux',   access:'editeur', color:'#B07560' }
];
const memberById = id => TEAM.find(m=>m.id===id) || {name:'?',color:'#8C8270'};
const initials = n => n.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();

/* Pipeline d'après le schéma client : Texte > Mise en forme,
   Fiche pédagogique en parallèle, Images, puis les livrables
   (Balado / Vidéo / Spectacle, en parallèle), puis Site internet /
   Offres et Plateforme de distribution. */
const PIPELINE = [
  { key:'texte',     name:'Texte',                      parallel:false },
  { key:'miseforme', name:'Mise en forme',              parallel:false },
  { key:'fiche',     name:'Fiche pédagogique',          parallel:true  },
  { key:'images',    name:'Images',                     parallel:false },
  { key:'balado',    name:'Balado',                     parallel:true  },
  { key:'video',     name:'Vidéo',                      parallel:true  },
  { key:'spectacle', name:'Spectacle',                  parallel:true  },
  { key:'site',      name:'Site internet / Offres',     parallel:false },
  { key:'distrib',   name:'Plateforme de distribution', parallel:false }
];

const STYLES = [
  { id:'apaisant', name:'Histoires apaisantes', color:'#6E8E63' },
  { id:'contes',   name:'Contes du monde',      color:'#C04A3F' },
  { id:'rigolo',   name:'Aventures rigolotes',  color:'#C28A2C' }
];
const styleById = id => STYLES.find(s=>s.id===id) || {name:'—',color:'#8C8270'};

/* SVG icons for deliverables */
const DELIV_TYPES = {
  balado:    { label:'Balado',    svg:'<path d="M12 3a5 5 0 0 0-5 5v4a5 5 0 0 0 10 0V8a5 5 0 0 0-5-5z"/><path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3M8 22h8"/>' },
  video:     { label:'Vidéo',     svg:'<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>' },
  spectacle: { label:'Spectacle', svg:'<path d="M3 5h18M5 5v8a7 7 0 0 0 14 0V5M9 21h6M12 19v2"/>' }
};

const PROJECTS = [
  {
    id:'p1', style:'rigolo', fileCode:'2026-05-11_Filou_la_fusée',
    title:'Filou la fusée', status:'livr',
    gStart:0.4, gEnd:2.2, deadline:'2026-05-28',
    stages:{ texte:'done', miseforme:'done', fiche:'done', images:'active', balado:'active', video:'active', spectacle:'todo', site:'todo', distrib:'todo' },
    deliverables:[
      { type:'balado', state:'wip', prog:55 },
      { type:'video', state:'wip', prog:20 },
      { type:'spectacle', state:'off', prog:0 }
    ],
    tasks:[
      { t:'Rédaction du texte', stage:'Texte', who:'lise', date:'2026-05-04', done:true },
      { t:'Mise en forme du script', stage:'Mise en forme', who:'lise', date:'2026-05-11', done:true },
      { t:'Fiche pédagogique — vocabulaire', stage:'Fiche pédagogique', who:'line', date:'2026-05-14', done:true },
      { t:'Illustrations des scènes', stage:'Images', who:'fred', date:'2026-05-22', done:false },
      { t:'Montage du balado', stage:'Balado', who:'bruno', date:'2026-05-26', done:false }
    ],
    resources:[
      { name:'Texte Filou la fusée v3', url:'#', perm:'edition', note:'Version mise en forme' },
      { name:'Fiche pédagogique', url:'#', perm:'lecture', note:'Validée par Line' },
      { name:'Dossier illustrations', url:'#', perm:'edition', note:'En cours — Frédérick' }
    ],
    comments:[
      { who:'lise', date:'12 mai', text:'Le texte est prêt et mis en forme. Frédérick, tu peux commencer les images quand tu veux !' },
      { who:'fred', date:'13 mai', text:'Parfait, je commence les illustrations cette semaine. J\'aimerais garder des couleurs chaudes.' },
      { who:'anne', date:'14 mai', text:'On vise le 28 pour la publication. Bruno, le balado doit être prêt avant.' }
    ]
  },
  {
    id:'p2', style:'apaisant', fileCode:'2026-05-04_Bernardo_elephanteau',
    title:'Bernardo l\'éléphanteau', status:'prod',
    gStart:0.1, gEnd:1.7, deadline:'2026-05-26',
    stages:{ texte:'done', miseforme:'done', fiche:'active', images:'active', balado:'active', video:'todo', spectacle:'todo', site:'todo', distrib:'todo' },
    deliverables:[
      { type:'balado', state:'wip', prog:40 },
      { type:'video', state:'off', prog:0 }
    ],
    tasks:[
      { t:'Rédaction du conte', stage:'Texte', who:'lise', date:'2026-04-28', done:true },
      { t:'Mise en forme', stage:'Mise en forme', who:'lise', date:'2026-05-03', done:true },
      { t:'Fiche pédagogique', stage:'Fiche pédagogique', who:'line', date:'2026-05-18', done:false },
      { t:'Planches d\'illustration', stage:'Images', who:'fred', date:'2026-05-20', done:false }
    ],
    resources:[
      { name:'Script Bernardo v3', url:'#', perm:'edition', note:'' },
      { name:'Moodboard visuel', url:'#', perm:'lecture', note:'' }
    ],
    comments:[
      { who:'bruno', date:'10 mai', text:'Belle prise pour la voix de Bernardo, ça va être tout doux.' },
      { who:'line', date:'11 mai', text:'Je termine la fiche pédagogique d\'ici la fin de semaine.' }
    ]
  },
  {
    id:'p3', style:'apaisant', fileCode:'2026-06-01_Berceuse_des_etoiles',
    title:'La berceuse des étoiles', status:'prod',
    gStart:1.0, gEnd:3.0, deadline:'2026-06-18',
    stages:{ texte:'done', miseforme:'active', fiche:'todo', images:'todo', balado:'active', video:'todo', spectacle:'todo', site:'todo', distrib:'todo' },
    deliverables:[ { type:'balado', state:'wip', prog:15 } ],
    tasks:[
      { t:'Écriture de la berceuse', stage:'Texte', who:'lise', date:'2026-05-30', done:true },
      { t:'Mise en forme du texte', stage:'Mise en forme', who:'lise', date:'2026-06-06', done:false },
      { t:'Recherche musicale', stage:'Balado', who:'bruno', date:'2026-06-09', done:false }
    ],
    resources:[ { name:'Texte — La berceuse des étoiles', url:'#', perm:'edition', note:'En mise en forme' } ],
    comments:[ { who:'anne', date:'2 juin', text:'On garde le 18 juin, c\'est avant les vacances scolaires.' } ]
  },
  {
    id:'p4', style:'contes', fileCode:'2026-04-20_Le_geant_qui_faisait_peur',
    title:'Le géant qui faisait peur', status:'publie',
    gStart:0.0, gEnd:1.0, deadline:'2026-05-09',
    stages:{ texte:'done', miseforme:'done', fiche:'done', images:'done', balado:'done', video:'done', spectacle:'todo', site:'done', distrib:'done' },
    deliverables:[
      { type:'balado', state:'on', prog:100 },
      { type:'video', state:'on', prog:100 }
    ],
    tasks:[
      { t:'Mastering final', stage:'Balado', who:'bruno', date:'2026-05-05', done:true },
      { t:'Mise en ligne sur le site', stage:'Site internet / Offres', who:'anne', date:'2026-05-09', done:true },
      { t:'Publications réseaux sociaux', stage:'Plateforme de distribution', who:'ana', date:'2026-05-16', done:false }
    ],
    resources:[
      { name:'Balado final .wav', url:'#', perm:'admin', note:'Master' },
      { name:'Vidéo publiée', url:'#', perm:'lecture', note:'' },
      { name:'Visuels promo', url:'#', perm:'lecture', note:'Pour Instagram & Facebook' }
    ],
    comments:[
      { who:'ana', date:'12 mai', text:'Très bons retours sur Facebook ! Je prépare un extrait vidéo pour relancer.' }
    ]
  },
  {
    id:'p5', style:'contes', fileCode:'2026-06-06_Tifi_a_Lill-la',
    title:'Tifi a Lill-la', status:'prod',
    gStart:1.4, gEnd:3.4, deadline:'2026-06-25',
    stages:{ texte:'done', miseforme:'done', fiche:'active', images:'active', balado:'active', video:'todo', spectacle:'active', site:'todo', distrib:'todo' },
    deliverables:[
      { type:'balado', state:'wip', prog:25 },
      { type:'spectacle', state:'wip', prog:10 }
    ],
    tasks:[
      { t:'Adaptation du conte', stage:'Texte', who:'lise', date:'2026-06-06', done:true },
      { t:'Mise en forme', stage:'Mise en forme', who:'lise', date:'2026-06-10', done:true },
      { t:'Fiche pédagogique — vocabulaire', stage:'Fiche pédagogique', who:'line', date:'2026-06-13', done:false },
      { t:'Décor sonore & ambiances', stage:'Balado', who:'bruno', date:'2026-06-16', done:false }
    ],
    resources:[
      { name:'Conte original annoté', url:'#', perm:'lecture', note:'' },
      { name:'Script adapté v2', url:'#', perm:'edition', note:'' }
    ],
    comments:[
      { who:'line', date:'6 juin', text:'Beaucoup de vocabulaire riche ici — parfait pour la francisation.' },
      { who:'lise', date:'7 juin', text:'Oui ! Et ça ferait un beau spectacle aussi. On garde l\'option ouverte.' }
    ]
  },
  {
    id:'p6', style:'rigolo', fileCode:'2026-05-18_Coquin_oreilles_d_or',
    title:'Coquin le lapin aux oreilles d\'or', status:'livr',
    gStart:0.7, gEnd:2.4, deadline:'2026-06-04',
    stages:{ texte:'done', miseforme:'done', fiche:'done', images:'done', balado:'active', video:'active', spectacle:'todo', site:'todo', distrib:'todo' },
    deliverables:[
      { type:'balado', state:'wip', prog:80 },
      { type:'video', state:'wip', prog:35 }
    ],
    tasks:[
      { t:'Texte & mise en forme', stage:'Texte', who:'lise', date:'2026-05-15', done:true },
      { t:'Illustrations finales', stage:'Images', who:'fred', date:'2026-05-22', done:true },
      { t:'Mixage du balado', stage:'Balado', who:'bruno', date:'2026-05-30', done:false },
      { t:'Montage vidéo', stage:'Vidéo', who:'fred', date:'2026-06-02', done:false }
    ],
    resources:[
      { name:'Mix balado v2', url:'#', perm:'edition', note:'À masteriser' },
      { name:'Illustrations finales', url:'#', perm:'lecture', note:'Approuvées' }
    ],
    comments:[
      { who:'bruno', date:'21 mai', text:'Le mix avance bien, je masterise cette semaine.' },
      { who:'fred', date:'22 mai', text:'Les illustrations sont prêtes, je passe au montage vidéo.' }
    ]
  },
  {
    id:'p7', style:'rigolo', fileCode:'2026-07-15_Coquin_carotte_magique',
    title:'Coquin et la carotte magique', status:'idee',
    gStart:3.0, gEnd:5.0, deadline:'2026-08-20',
    stages:{ texte:'active', miseforme:'todo', fiche:'todo', images:'todo', balado:'todo', video:'todo', spectacle:'todo', site:'todo', distrib:'todo' },
    deliverables:[ { type:'balado', state:'off', prog:0 } ],
    tasks:[ { t:'Écriture du pitch', stage:'Texte', who:'lise', date:'2026-07-18', done:false } ],
    resources:[],
    comments:[]
  }
];

const STATUS = {
  idee:   { label:'Idée',          cls:'idee' },
  prod:   { label:'En production', cls:'prod' },
  livr:   { label:'Livrables',     cls:'livr' },
  publie: { label:'Publié',        cls:'publie' }
};
const DOC_CATS  = ['Administratif','Création','Technique','Promotion','Divers'];
const DOC_STATS = ['Brouillon','En révision','Validé','Final'];

/* Livrables d'un projet et leurs dossiers de documents */
const LIVRABLES=[
  { key:'balado',    label:'Balados',             folders:['Texte','Audio'] },
  { key:'video',     label:'Vidéos',              folders:['Texte','Image'] },
  { key:'spectacle', label:'Spectacles',          folders:['Audio','Texte','Image'] },
  { key:'fiche',     label:'Fiches pédagogiques', folders:['Texte','Image'] }
];
const LIV_SVG={
  balado: DELIV_TYPES.balado.svg,
  video: DELIV_TYPES.video.svg,
  spectacle: DELIV_TYPES.spectacle.svg,
  fiche: '<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/>'
};

/* ===== helpers ===== */
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isHttpUrl = u => /^https?:\/\//i.test(String(u||'').trim());
function livDocs(p,lk){ p.docs=p.docs||{}; if(!p.docs[lk]) p.docs[lk]={}; return p.docs[lk]; }
function folderLinks(p,lk,fname){ const d=(p.docs&&p.docs[lk])||{}; return d[fname]||[]; }
function livLinkCount(p,lk){ const d=(p.docs&&p.docs[lk])||{}; return Object.values(d).reduce((a,arr)=>a+(arr?arr.length:0),0); }
function totalLinks(p){ let n=0; Object.values(p.docs||{}).forEach(f=>Object.values(f||{}).forEach(arr=>{ n+=arr?arr.length:0; })); return n; }
function fmtIso(d){
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return d.getFullYear()+'-'+m+'-'+day;
}
function frac2date(frac){
  const NM=GMONTHS.length, Y=2026, M0=4;
  if(frac==null||isNaN(frac)) return new Date(Y,M0,1);
  const f=Math.max(0,Math.min(NM,frac));
  const mi=Math.min(NM-1,Math.floor(f));
  const dim=GMONTHS[mi].days;
  const day=Math.max(1,Math.min(dim,Math.round((f-Math.floor(f))*dim)+1));
  return new Date(Y,M0+mi,day);
}
function _addDay(iso){
  const d=new Date(iso+'T00:00:00');
  d.setDate(d.getDate()+1);
  return fmtIso(d);
}
function date2frac(iso){
  if(!iso) return null;
  const d=new Date(iso+'T00:00:00');
  if(isNaN(d)) return null;
  const NM=GMONTHS.length, Y=2026, M0=4;
  const mi=(d.getFullYear()-Y)*12+(d.getMonth()-M0);
  if(mi<0) return 0;
  if(mi>=NM) return NM;
  return mi+(d.getDate()-1)/GMONTHS[mi].days;
}
const LS_KEY='lili-mallette-v1';
function saveState(){
  try{
    const data={};
    PROJECTS.forEach(p=>{ data[p.id]={
      docs:p.docs||{},
      comments:p.comments||[],
      dateStart:p.dateStart||null,
      dateEnd:p.dateEnd||null,
      deadline:p.deadline||null,
      livDates:p.livDates||{}
    }; });
    localStorage.setItem(LS_KEY,JSON.stringify(data));
  }catch(e){}
}
function loadState(){
  try{
    const raw=localStorage.getItem(LS_KEY);
    if(!raw) return;
    const data=JSON.parse(raw);
    PROJECTS.forEach(p=>{
      const s=data&&data[p.id];
      if(!s) return;
      if(s.docs&&typeof s.docs==='object') p.docs=s.docs;
      if(Array.isArray(s.comments)) p.comments=s.comments;
      if(typeof s.dateStart==='string') p.dateStart=s.dateStart;
      if(typeof s.dateEnd==='string') p.dateEnd=s.dateEnd;
      if(typeof s.deadline==='string') p.deadline=s.deadline;
      if(s.livDates&&typeof s.livDates==='object') p.livDates=s.livDates;
    });
  }catch(e){}
}
function linkHay(l,fname){ return (l.name||'')+' '+(l.url||'')+' '+(l.note||'')+' '+(fname||''); }
function allFolderNames(){
  const set=new Set();
  LIVRABLES.forEach(L=>L.folders.forEach(f=>set.add(f)));
  return [...set];
}
function allDocs(){
  const out=[];
  PROJECTS.forEach(p=>LIVRABLES.forEach(L=>L.folders.forEach(fname=>folderLinks(p,L.key,fname).forEach(l=>out.push({p,liv:L.label,fname,l})))));
  return out;
}
function dval(id){ const el=document.getElementById(id); return el?el.value:''; }
function fmtDate(iso){
  if(!iso) return '—';
  return new Date(iso+'T00:00:00').toLocaleDateString('fr-CA',{day:'2-digit',month:'short'});
}
function daysUntil(iso){
  if(!iso) return null;
  const d=new Date(iso+'T00:00:00'), n=new Date(); n.setHours(0,0,0,0);
  return Math.round((d-n)/86400000);
}
function stageProgress(p){
  let done=0; PIPELINE.forEach(s=>{ if(p.stages[s.key]==='done') done++; });
  return Math.round(done/PIPELINE.length*100);
}
function toast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t=setTimeout(()=>el.classList.remove('show'),2400);
}

/* ===== STAT CARDS ===== */
function renderStats(){
  const active = PROJECTS.filter(p=>p.status!=='publie').length;
  let deliv=0, links=0, dl=0;
  PROJECTS.forEach(p=>{
    (p.deliverables||[]).forEach(d=>{ if(d.state==='wip') deliv++; });
    links+=totalLinks(p);
    const dd=daysUntil(p.deadline);
    if(dd!==null && dd>=0 && dd<=7 && p.status!=='publie') dl++;
  });
  const cards=[
    { ic:'red',  label:'Projets actifs',     val:active, hint:'en production',
      svg:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' },
    { ic:'gold', label:'Livrables en cours',  val:deliv, hint:'balados · vidéos · spectacles',
      svg:'<path d="M12 3a5 5 0 0 0-5 5v4a5 5 0 0 0 10 0V8a5 5 0 0 0-5-5zM5 11v1a7 7 0 0 0 14 0v-1"/>' },
    { ic:'sage', label:'Fichiers liés', val:links, hint:'liens Proton Drive',
      svg:'<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>' },
    { ic:'navy', label:'Échéances ≤ 7 jours',  val:dl, hint:'à surveiller',
      svg:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>' }
  ];
  document.getElementById('stat-row').innerHTML = cards.map(c=>`
    <div class="stat">
      <div class="s-top">
        <div class="s-ico ${c.ic}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${c.svg}</svg></div>
        <div class="s-label">${c.label}</div>
      </div>
      <div class="s-value">${c.val}</div>
      <div class="s-hint">${c.hint}</div>
    </div>`).join('');
}

/* ===== PROJECT CARD ===== */
function projectCard(p){
  const st=styleById(p.style);
  const fileCount=totalLinks(p);
  const mono=initials(p.title);

  return `<article class="proj-card" data-id="${p.id}">
    <div class="pc-head">
      <div class="pc-top">
        <span class="pc-mono">${esc(mono)}</span>
        <span class="badge ${STATUS[p.status].cls}">${STATUS[p.status].label}</span>
      </div>
      <h3>${esc(p.title)}</h3>
      <div class="pc-file">${esc(p.fileCode)}</div>
    </div>
    <div class="pc-foot">
      <span>${esc(st.name)}</span>
      <span>${fileCount} doc${fileCount>1?'s':''}</span>
    </div>
  </article>`;
}
function wireCards(scope){
  scope.querySelectorAll('.proj-card').forEach(c=>{
    c.addEventListener('click',()=>openProject(c.dataset.id));
  });
}

/* ===== DASHBOARD ===== */
function topQ(){ const s=document.getElementById('search'); return s?s.value.toLowerCase().trim():''; }
function renderDashboard(){
  renderStats();
  const q=topQ();
  let list=PROJECTS.filter(p=>p.status!=='publie');
  if(q) list=list.filter(p=>(p.title+' '+p.fileCode).toLowerCase().includes(q));
  list.sort((a,b)=>(a.deadline||'').localeCompare(b.deadline||''));
  const grid=document.getElementById('dash-grid');
  grid.innerHTML=list.map(projectCard).join('')||`<div class="placeholder" style="grid-column:1/-1">
    <div class="ph-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div>
    <h2>Aucun projet</h2><p>Aucun projet actif ne correspond à cette recherche.</p></div>`;
  wireCards(grid);
}

/* ===== PROJETS (filterable) ===== */
let fStage='tous';
function buildFilterbar(){
  const counts={};
  ['idee','prod','livr','publie'].forEach(s=>counts[s]=PROJECTS.filter(p=>p.status===s).length);
  const stageChips=[
    ['tous','Toutes étapes',PROJECTS.length],
    ['idee','Idée',counts.idee],
    ['prod','En production',counts.prod],
    ['livr','Livrables',counts.livr],
    ['publie','Publié',counts.publie]
  ].map(([v,l,n])=>`<button class="chip ${v==='tous'?'active':''}" data-type="stage" data-v="${v}">${l} <span class="c-count">${n}</span></button>`).join('');

  document.getElementById('filterbar').innerHTML = stageChips;

  document.querySelectorAll('#filterbar .chip').forEach(ch=>{
    ch.addEventListener('click',()=>{
      const type=ch.dataset.type;
      document.querySelectorAll(`#filterbar .chip[data-type="${type}"]`).forEach(x=>x.classList.remove('active'));
      ch.classList.add('active');
      fStage=ch.dataset.v;
      renderProjets();
    });
  });
}
function renderProjets(){
  const grid=document.getElementById('proj-grid');
  const fb=document.getElementById('filterbar');
  const bar=document.getElementById('proj-back-bar');
  const sub=document.querySelector('#view-projets .subtitle');
  const q=topQ();
  fb.style.display=''; bar.innerHTML='';
  document.getElementById('crumb-current').textContent = q?'Projets › Recherche':'Projets';
  if(sub) sub.textContent = q?`Résultats pour « ${q} ».`:'Tous les projets de production.';
  let list=PROJECTS.slice();
  if(fStage!=='tous') list=list.filter(p=>p.status===fStage);
  if(q) list=list.filter(p=>(p.title+' '+p.fileCode).toLowerCase().includes(q));
  list.sort((a,b)=>(a.deadline||'').localeCompare(b.deadline||''));
  if(!list.length){
    grid.innerHTML=`<div class="placeholder" style="grid-column:1/-1">
      <div class="ph-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg></div>
      <h2>Aucun projet</h2><p>Aucun projet ne correspond à ces filtres.</p></div>`;
    return;
  }
  grid.innerHTML=list.map(projectCard).join(''); wireCards(grid);
}

/* ===== GANTT ===== */
const GMONTHS=[
  {label:'Mai 2026',days:31},
  {label:'Juin 2026',days:30},
  {label:'Juil. 2026',days:31},
  {label:'Août 2026',days:31},
  {label:'Sept. 2026',days:30},
  {label:'Oct. 2026',days:31}
];
function renderGantt(){
  const NM=GMONTHS.length, Y=2026, M0=4; /* M0 = mai (index 4) */
  const today=new Date(); today.setHours(0,0,0,0);
  const tMi=(today.getFullYear()-Y)*12+(today.getMonth()-M0);
  const todIn = tMi>=0 && tMi<NM;
  const todPct = todIn ? ((tMi + (today.getDate()-0.5)/GMONTHS[tMi].days)/NM)*100 : 0;

  const monthsH=GMONTHS.map(m=>`<div class="gm">${m.label}</div>`).join('');
  const daysH=GMONTHS.map((m,mi)=>{
    let cells='';
    for(let d=1;d<=m.days;d++){
      const tod = todIn && mi===tMi && d===today.getDate();
      cells+=`<div class="gd${tod?' tod':''}">${d}</div>`;
    }
    return `<div class="gmo">${cells}</div>`;
  }).join('');

  const gq=topQ();
  const grows=PROJECTS.slice().filter(p=>!gq||p.title.toLowerCase().includes(gq)).sort((a,b)=>a.gStart-b.gStart);
  let h=`<div class="g-head">
    <div class="gh-l">Production · ${grows.length} projet${grows.length>1?'s':''}</div>
    <div class="g-months">${monthsH}</div>
  </div>
  <div class="g-head g-dayhead">
    <div class="gh-l gh-sub">Bailleurs / livrables</div>
    <div class="g-days">${daysH}</div>
  </div>`;

  grows.forEach(p=>{
    const st=styleById(p.style);
    p.livDates=p.livDates||{};
    /* En-tête de groupe : titre du projet (cliquable, sans barre) */
    h+=`<div class="g-row g-row-group" data-id="${p.id}">
      <div class="gr-l">
        <div class="grl-t">${esc(p.title)}</div>
        <div class="grl-s"><span class="dot" style="background:${st.color}"></span>${esc(STATUS[p.status].label)}</div>
      </div>
      <div class="g-track">
        ${GMONTHS.map(()=>`<div class="gcell"></div>`).join('')}
        ${todIn?`<div class="g-today" style="left:${todPct}%"></div>`:''}
      </div>
    </div>`;
    /* 4 sous-rangées : une barre par livrable (Balado, Vidéo, Spectacle, Fiche) */
    LIVRABLES.forEach(L=>{
      const ld=p.livDates[L.key]||{};
      const startIso=ld.start||p.dateStart||fmtIso(frac2date(p.gStart));
      const endIso=ld.end||p.dateEnd||fmtIso(frac2date(p.gEnd));
      const fs=date2frac(startIso);
      const fe=date2frac(_addDay(endIso));
      const left=(fs/NM)*100;
      const width=Math.max(((fe-fs)/NM)*100,5);
      h+=`<div class="g-row g-row-sub" data-pid="${esc(p.id)}" data-lk="${esc(L.key)}">
        <div class="gr-l gr-l-sub"><div class="grl-t-sub">${esc(L.label)}</div></div>
        <div class="g-track">
          ${GMONTHS.map(()=>`<div class="gcell"></div>`).join('')}
          ${todIn?`<div class="g-today" style="left:${todPct}%"></div>`:''}
          <div class="g-bar" data-pid="${esc(p.id)}" data-lk="${esc(L.key)}" style="left:${left}%;width:${width}%">
            <span class="gb-resize gb-resize-l"></span>
            <span class="gb-lbl">${esc(L.label)}</span>
            <span class="gb-resize gb-resize-r"></span>
          </div>
        </div>
      </div>`;
    });
  });
  document.getElementById('gantt').innerHTML=h;
  document.querySelectorAll('#gantt .g-row[data-id]').forEach(r=>{
    r.addEventListener('click',()=>{
      if(_ganttDragMoved){ _ganttDragMoved=false; return; }
      openProject(r.dataset.id);
    });
  });
  document.querySelectorAll('#gantt .g-row[data-pid][data-lk]').forEach(r=>{
    r.addEventListener('click',()=>{
      if(_ganttDragMoved){ _ganttDragMoved=false; return; }
      openProject(r.dataset.pid,null,r.dataset.lk);
    });
  });
}

/* ===== TEAM ===== */
function renderTeam(){
  const q=topQ();
  const list=q?TEAM.filter(m=>(m.name+' '+m.role+' '+(m.email||'')).toLowerCase().includes(q)):TEAM;
  document.getElementById('team-grid').innerHTML = list.map(m=>`
    <div class="member">
      ${m.pending?`<button class="m-del" data-del-member="${esc(m.id)}" title="Retirer l'invitation">&times;</button>`:''}
      <div class="m-ava" style="background:${m.color}">${initials(m.name)}</div>
      <div>
        <div class="m-name">${esc(m.name)}</div>
        <div class="m-role">${esc(m.role)}</div>
        <span class="m-tag ${m.access}">${m.access==='admin'?'Administrateur':'Éditeur'}</span>
        ${m.pending?'<span class="m-tag pending">Invitation en attente</span>':''}
      </div>
    </div>`).join('');
  document.querySelectorAll('#team-grid [data-del-member]').forEach(b=>b.addEventListener('click',()=>{
    const i=TEAM.findIndex(m=>m.id===b.dataset.delMember);
    if(i>=0){ TEAM.splice(i,1); saveTeam(); renderTeam(); toast('Invitation retirée'); }
  }));
}

/* ===== ÉQUIPE — invitation (simulation, aucun email réel) ===== */
const LS_TEAM='lili-mallette-team-v1';
function saveTeam(){
  try{ localStorage.setItem(LS_TEAM, JSON.stringify(TEAM.filter(m=>m.pending))); }catch(e){}
}
function loadTeam(){
  try{
    const raw=localStorage.getItem(LS_TEAM);
    if(!raw) return;
    const arr=JSON.parse(raw);
    if(Array.isArray(arr)) arr.forEach(m=>{ if(m&&m.id&&!TEAM.some(x=>x.id===m.id)) TEAM.push(m); });
  }catch(e){}
}
function showInviteForm(){
  const box=document.getElementById('invite-form');
  if(!box) return;
  box.innerHTML=`
    <div class="invite-card">
      <input id="inv-name" placeholder="Nom complet">
      <input id="inv-email" type="email" placeholder="adresse@email.com">
      <select id="inv-access">
        <option value="editeur">Éditeur</option>
        <option value="admin">Administrateur</option>
      </select>
      <button class="btn primary sm" id="inv-send">Envoyer l'invitation</button>
      <button class="btn sm" id="inv-cancel">Annuler</button>
      <div class="invite-note">Simulation — aucun email réel n'est envoyé. L'envoi sera branché en V1 (backend + service mail).</div>
    </div>`;
  document.getElementById('inv-send').addEventListener('click',sendInvite);
  document.getElementById('inv-cancel').addEventListener('click',()=>{ box.innerHTML=''; });
  document.getElementById('inv-name').focus();
}
function sendInvite(){
  const name=(document.getElementById('inv-name').value||'').trim();
  const email=(document.getElementById('inv-email').value||'').trim();
  const access=document.getElementById('inv-access').value;
  if(!name){ toast('Indiquez un nom'); return; }
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ toast('Adresse email invalide'); return; }
  const colors=['#C04A3F','#6E8E63','#2F4259','#C28A2C','#8C8270','#B07560'];
  TEAM.push({ id:'inv_'+Date.now(), name, role:email, access, color:colors[TEAM.length%colors.length], email, pending:true });
  saveTeam();
  document.getElementById('invite-form').innerHTML='';
  renderTeam();
  toast('Invitation envoyée à '+email+' (simulation)');
}

/* ===== PROJECT MODAL ===== */
let currentId=null;
let modalQuery='';
let currentLivrable=null;
let currentDocFolder=null;
const mqHit = txt => !modalQuery || String(txt||'').toLowerCase().includes(modalQuery);
function openProject(id, source, initLiv){
  const p=PROJECTS.find(x=>x.id===id);
  if(!p) return;
  currentId=id;
  const st=styleById(p.style);
  document.getElementById('m-style').innerHTML=`<span class="dot" style="background:${st.color}"></span>${esc(st.name)}`;
  document.getElementById('m-title').textContent=p.title;
  document.getElementById('m-file').textContent=`${p.fileCode} · ${STATUS[p.status].label}`;

  /* période (dates éditables) */
  const md=document.getElementById('m-dates');
  if(md){
    const ds=p.dateStart||fmtIso(frac2date(p.gStart));
    const de=p.dateEnd||fmtIso(frac2date(p.gEnd));
    const dl=p.deadline||'';
    md.innerHTML=`
      <label class="md-field">Début <input type="date" id="md-start" value="${esc(ds)}"></label>
      <label class="md-field">Fin <input type="date" id="md-end" value="${esc(de)}"></label>
      <label class="md-field">Échéance <input type="date" id="md-deadline" value="${esc(dl)}"></label>`;
    const wireDate=(id,k)=>{
      const el=document.getElementById(id); if(!el) return;
      el.addEventListener('change',()=>{
        p[k]=el.value||undefined;
        saveState();
        renderGantt(); renderDashboard(); renderProjets();
      });
    };
    wireDate('md-start','dateStart');
    wireDate('md-end','dateEnd');
    wireDate('md-deadline','deadline');
  }

  /* recherche locale + panneaux */
  modalQuery=''; currentLivrable=initLiv||null; currentDocFolder=null;
  const ms=document.getElementById('m-search');
  if(ms){ ms.value=''; ms.parentElement.classList.remove('has-q'); }
  renderModalPanels(p);
  document.getElementById('overlay').classList.add('open');
}

function renderModalPanels(p){
  renderModalMain(p);
  renderCommentsSection(p);
}
function foldRow(lk,fname,label,countTxt,svg){
  return `<div class="fold" data-lk="${esc(lk)}"${fname?` data-folder="${esc(fname)}"`:''}>
    <div class="fold-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${svg||'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'}</svg></div>
    <div class="fold-n">${esc(label)}</div>
    <span class="fold-c">${esc(countTxt)}</span>
  </div>`;
}
function wireFoldRows(scope,p){
  scope.querySelectorAll('.fold[data-lk]').forEach(el=>el.addEventListener('click',()=>{
    if(modalQuery){ modalQuery=''; const ms=document.getElementById('m-search'); if(ms){ ms.value=''; ms.parentElement.classList.remove('has-q'); } }
    currentLivrable=el.dataset.lk;
    currentDocFolder=el.dataset.folder||null;
    renderModalMain(p);
  }));
}

function linkRow(lk,fname,l,i){
  const ok=isHttpUrl(l.url);
  const perm=l.perm||'lecture';
  const permLbl=perm==='lecture'?'Lecture':perm==='edition'?'Édition':'Admin';
  return `<div class="res">
    <div class="res-main">
      <div class="res-n">
        ${ok?`<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.name)}</a>`:`<span>${esc(l.name)}</span>`}
        <span class="perm ${esc(perm)}">${permLbl}</span>
        ${l.cat?`<span class="tk-stage">${esc(l.cat)}</span>`:''}
        ${l.stat?`<span class="tk-stage">${esc(l.stat)}</span>`:''}
      </div>
      ${l.note?`<div class="res-note">${esc(l.note)}</div>`:''}
      <div class="res-note" style="word-break:break-all">${ok?esc(l.url):'Lien à renseigner'}</div>
    </div>
    <div style="display:flex;gap:7px;flex-shrink:0">
      <button class="btn sm" data-lopen="${esc(lk)}|${esc(fname)}|${i}"${ok?'':' disabled'}>Ouvrir</button>
      <button class="btn sm" data-ldel="${esc(lk)}|${esc(fname)}|${i}">Retirer</button>
    </div>
  </div>`;
}
function wireLinkRows(scope,p){
  scope.querySelectorAll('[data-lopen]').forEach(b=>b.addEventListener('click',()=>{
    const [lk,fn,i]=b.dataset.lopen.split('|');
    const l=folderLinks(p,lk,fn)[+i];
    if(l&&isHttpUrl(l.url)) window.open(l.url,'_blank','noopener');
  }));
  scope.querySelectorAll('[data-ldel]').forEach(b=>b.addEventListener('click',()=>{
    const [lk,fn,i]=b.dataset.ldel.split('|');
    const arr=folderLinks(p,lk,fn);
    if(arr.length>+i){ arr.splice(+i,1); saveState(); renderModalMain(p); toast('Lien retiré'); }
  }));
}
function renderModalMain(p){
  const panel=document.getElementById('panel-main');
  if(!panel) return;
  p.docs=p.docs||{};

  /* Recherche : livrables, dossiers et documents correspondants */
  if(modalQuery){
    let any=false, nameHtml='', linkHtml='';
    LIVRABLES.forEach(L=>{
      if(mqHit(L.label)){ any=true; const n=livLinkCount(p,L.key); nameHtml+=foldRow(L.key,null,L.label,n+' doc'+(n>1?'s':''),LIV_SVG[L.key]); }
      L.folders.forEach(fname=>{
        if(mqHit(fname)||mqHit(L.label+' '+fname)){ any=true; const n=folderLinks(p,L.key,fname).length; nameHtml+=foldRow(L.key,fname,L.label+' · '+fname,n+' lien'+(n>1?'s':'')); }
        const links=folderLinks(p,L.key,fname).map((l,i)=>({l,i})).filter(({l})=>mqHit(linkHay(l,L.label+' '+fname)));
        if(links.length){ any=true; linkHtml+=`<div class="fold-search-head">${esc(L.label)} · ${esc(fname)}</div>`+links.map(({l,i})=>linkRow(L.key,fname,l,i)).join(''); }
      });
    });
    panel.innerHTML='<div class="modal-section-title">Recherche</div>'+nameHtml+linkHtml+(any?'':`<div class="empty-note">Aucun livrable, dossier ni document ne correspond à « ${esc(modalQuery)} ».</div>`);
    wireFoldRows(panel,p); wireLinkRows(panel,p);
    return;
  }

  /* Détail d'un dossier (livrable + dossier) */
  if(currentLivrable && currentDocFolder){
    const L=LIVRABLES.find(x=>x.key===currentLivrable);
    if(!L||L.folders.indexOf(currentDocFolder)<0){ currentDocFolder=null; return renderModalMain(p); }
    const links=folderLinks(p,L.key,currentDocFolder);
    panel.innerHTML=`
      <button class="btn sm" id="m-back" style="margin-bottom:14px">← ${esc(L.label)}</button>
      <div class="modal-section-title">${esc(L.label)} · ${esc(currentDocFolder)}</div>
      <p style="font-size:13px;color:var(--ink-3);margin-bottom:14px">Liens Proton Drive de ce dossier.</p>
      ${links.map((l,i)=>linkRow(L.key,currentDocFolder,l,i)).join('')||'<div class="empty-note">Aucun lien dans ce dossier.</div>'}
      <div class="disc-compose" style="flex-wrap:wrap">
        <input id="fl-name" placeholder="Nom du fichier" style="flex:1 1 150px">
        <input id="fl-url" placeholder="https://drive.proton.me/…" style="flex:2 1 220px">
        <select id="fl-perm" style="flex:0 0 auto"><option value="lecture">Lecture</option><option value="edition">Édition</option><option value="admin">Admin</option></select>
        <select id="fl-cat" style="flex:0 0 auto"><option value="">Catégorie…</option>${DOC_CATS.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
        <select id="fl-stat" style="flex:0 0 auto"><option value="">Statut…</option>${DOC_STATS.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select>
        <button class="btn primary sm" id="fl-add">+ Ajouter le lien</button>
      </div>`;
    document.getElementById('m-back').addEventListener('click',()=>{ currentDocFolder=null; renderModalMain(p); });
    wireLinkRows(panel,p);
    document.getElementById('fl-add').addEventListener('click',()=>{
      const name=panel.querySelector('#fl-name').value.trim();
      const url=panel.querySelector('#fl-url').value.trim();
      if(!name){ toast('Donnez un nom au fichier'); return; }
      if(!isHttpUrl(url)){ toast('Lien invalide — il doit commencer par https://'); return; }
      const perm=panel.querySelector('#fl-perm').value;
      const cat=panel.querySelector('#fl-cat').value;
      const stat=panel.querySelector('#fl-stat').value;
      const d=livDocs(p,L.key); (d[currentDocFolder]=d[currentDocFolder]||[]).push({name,url,perm,cat,stat,note:''});
      saveState(); renderModalMain(p); toast('Lien ajouté');
    });
    return;
  }

  /* Détail d'un livrable : période + ses dossiers */
  if(currentLivrable){
    const L=LIVRABLES.find(x=>x.key===currentLivrable);
    if(!L){ currentLivrable=null; return renderModalMain(p); }
    p.livDates=p.livDates||{};
    const ld=p.livDates[L.key]||{};
    panel.innerHTML=`
      <button class="btn sm" id="m-back" style="margin-bottom:14px">← Livrables</button>
      <div class="modal-section-title">${esc(L.label)}</div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px;padding:10px 12px;background:var(--surface-2);border:1px solid var(--line);border-radius:var(--radius-sm)">
        <label class="md-field">Début <input type="date" id="lv-start" value="${esc(ld.start||'')}"></label>
        <label class="md-field">Fin <input type="date" id="lv-end" value="${esc(ld.end||'')}"></label>
        <span style="font-size:11.5px;color:var(--ink-3);align-self:center">Dates spécifiques à ce livrable (utilisées sur le Calendrier).</span>
      </div>
      <div class="modal-section-title" style="font-size:14px;margin-top:6px">Dossiers de documents</div>
      ${L.folders.map(fname=>{ const n=folderLinks(p,L.key,fname).length; return foldRow(L.key,fname,fname,n+' lien'+(n>1?'s':'')); }).join('')}`;
    document.getElementById('m-back').addEventListener('click',()=>{ currentLivrable=null; renderModalMain(p); });
    wireFoldRows(panel,p);
    const wireLv=(id,k)=>{
      const el=document.getElementById(id); if(!el) return;
      el.addEventListener('change',()=>{
        p.livDates=p.livDates||{}; p.livDates[L.key]=p.livDates[L.key]||{};
        p.livDates[L.key][k]=el.value||undefined;
        saveState();
        renderGantt(); renderDashboard(); renderProjets();
      });
    };
    wireLv('lv-start','start');
    wireLv('lv-end','end');
    return;
  }

  /* Liste des livrables du projet */
  panel.innerHTML=`
    <div class="modal-section-title">Livrables</div>
    <p style="font-size:13px;color:var(--ink-3);margin-bottom:14px">Ouvre un livrable pour accéder à ses dossiers de documents (liens Proton Drive).</p>
    ${LIVRABLES.map(L=>{ const n=livLinkCount(p,L.key); return foldRow(L.key,null,L.label,n+' doc'+(n>1?'s':''),LIV_SVG[L.key]); }).join('')}`;
  wireFoldRows(panel,p);
}

/* ===== COMMENTAIRES (permanent) ===== */
function renderCommentsSection(p){
  const box=document.getElementById('panel-comments');
  if(!box) return;
  p.comments=p.comments||[];
  const opts=TEAM.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('');
  box.innerHTML=`
    <div class="modal-section-title">Commentaires</div>
    ${p.comments.map(c=>{
      const m=memberById(c.who);
      const to=c.to?memberById(c.to):null;
      return `<div class="msg">
        <div class="msg-ava" style="background:${m.color}">${initials(m.name)}</div>
        <div class="msg-bubble">
          <div class="msg-meta"><span class="mm-name">${esc(m.name)}</span>${to?`<span class="mm-to">→ ${esc(to.name)}</span>`:''}<span class="mm-date">${esc(c.date)}</span></div>
          <div class="msg-text">${esc(c.text)}</div>
        </div>
      </div>`;
    }).join('')||'<div class="empty-note">Aucun commentaire pour l\'instant.</div>'}
    <div class="cmt-compose">
      <label class="cmt-to">Adresser à
        <select id="cmt-to"><option value="">— personne —</option>${opts}</select>
      </label>
      <textarea id="cmt-text" placeholder="Écrire un commentaire…" rows="2"></textarea>
      <button class="btn primary sm" id="cmt-send">Commenter</button>
    </div>`;
  const send=document.getElementById('cmt-send');
  if(send) send.addEventListener('click',addMessage);
}
function addMessage(){
  const p=PROJECTS.find(x=>x.id===currentId);
  if(!p) return;
  const ta=document.getElementById('cmt-text');
  const txt=((ta&&ta.value)||'').trim();
  if(!txt){ toast('Écrivez un commentaire'); return; }
  const sel=document.getElementById('cmt-to');
  const to=(sel&&sel.value)||'';
  p.comments=p.comments||[];
  p.comments.push({ who:'anne', to:to||undefined, date:'à l\'instant', text:txt });
  saveState();
  renderCommentsSection(p);
  renderDashboard(); renderProjets();
  toast('Commentaire ajouté');
}

(function(){
  const mSearch=document.getElementById('m-search');
  if(!mSearch) return;
  const apply=()=>{
    modalQuery=mSearch.value.trim().toLowerCase();
    mSearch.parentElement.classList.toggle('has-q', modalQuery!=='');
    const p=PROJECTS.find(x=>x.id===currentId);
    if(p) renderModalMain(p);
  };
  mSearch.addEventListener('input',apply);
  const clr=document.getElementById('m-search-clear');
  if(clr) clr.addEventListener('click',()=>{ mSearch.value=''; mSearch.focus(); apply(); });
})();
function closeModal(){ document.getElementById('overlay').classList.remove('open'); }
document.getElementById('m-close').addEventListener('click',closeModal);
document.getElementById('overlay').addEventListener('click',e=>{ if(e.target.id==='overlay') closeModal(); });

/* ===== DOCUMENTS (recherche globale) ===== */
function dsRender(){
  const box=document.getElementById('ds-results');
  if(!box) return;
  const q=dval('ds-q').toLowerCase().trim();
  const fp=dval('ds-proj'), ff=dval('ds-fold'), fc=dval('ds-cat'), fsv=dval('ds-stat'), fperm=dval('ds-perm');
  if(!q && !fp && !ff && !fc && !fsv && !fperm){
    box.innerHTML='<div class="empty-note">Saisissez un terme ou activez un filtre pour lancer la recherche.</div>';
    return;
  }
  let res=allDocs();
  if(fp) res=res.filter(d=>d.p.id===fp);
  if(ff) res=res.filter(d=>d.fname===ff);
  if(fc) res=res.filter(d=>(d.l.cat||'')===fc);
  if(fsv) res=res.filter(d=>(d.l.stat||'')===fsv);
  if(fperm) res=res.filter(d=>(d.l.perm||'lecture')===fperm);
  if(q) res=res.filter(d=>((d.l.name||'')+' '+(d.l.url||'')+' '+(d.l.note||'')).toLowerCase().includes(q));
  if(!res.length){ box.innerHTML='<div class="empty-note">Aucun document ne correspond.</div>'; return; }
  box.innerHTML=res.map(d=>{
    const ok=isHttpUrl(d.l.url);
    const perm=d.l.perm||'lecture';
    return `<div class="res">
      <div class="res-main">
        <div class="res-n">
          ${ok?`<a href="${esc(d.l.url)}" target="_blank" rel="noopener noreferrer">${esc(d.l.name)}</a>`:`<span>${esc(d.l.name)}</span>`}
          <span class="perm ${esc(perm)}">${perm==='lecture'?'Lecture':perm==='edition'?'Édition':'Admin'}</span>
          ${d.l.cat?`<span class="tk-stage">${esc(d.l.cat)}</span>`:''}
          ${d.l.stat?`<span class="tk-stage">${esc(d.l.stat)}</span>`:''}
        </div>
        <div class="res-note">${esc(d.p.title)} · ${esc(d.liv)} · ${esc(d.fname)}</div>
      </div>
      <button class="btn sm" data-dsproj="${esc(d.p.id)}">Ouvrir le projet</button>
    </div>`;
  }).join('');
  box.querySelectorAll('[data-dsproj]').forEach(b=>b.addEventListener('click',()=>openProject(b.dataset.dsproj)));
}
function renderDocs(){
  const panel=document.getElementById('ds-panel');
  if(!panel) return;
  const optList=(arr,all)=>`<option value="">${all}</option>`+arr.map(o=>`<option value="${esc(o.v)}">${esc(o.t)}</option>`).join('');
  const projOpts=optList(PROJECTS.map(p=>({v:p.id,t:p.title})),'Tous');
  const foldOpts=optList(allFolderNames().map(n=>({v:n,t:n})),'Tous');
  const catOpts=optList(DOC_CATS.map(c=>({v:c,t:c})),'Toutes');
  const statOpts=optList(DOC_STATS.map(s=>({v:s,t:s})),'Tous');
  const permOpts='<option value="">Toutes</option><option value="lecture">Lecture</option><option value="edition">Édition</option><option value="admin">Admin</option>';
  panel.innerHTML=`
    <input id="ds-q" class="ds-input" placeholder="Titre ou version (ex : « v2 dépôt SODEC »)">
    <div class="ds-filters">
      <label>Projet<select id="ds-proj">${projOpts}</select></label>
      <label>Sous-dossier<select id="ds-fold">${foldOpts}</select></label>
      <label>Catégorie<select id="ds-cat">${catOpts}</select></label>
      <label>Statut<select id="ds-stat">${statOpts}</select></label>
      <label>Permission<select id="ds-perm">${permOpts}</select></label>
    </div>
    <div id="ds-results" style="margin-top:18px"></div>`;
  ['ds-q','ds-proj','ds-fold','ds-cat','ds-stat','ds-perm'].forEach(id=>{
    const el=document.getElementById(id); if(!el) return;
    el.addEventListener(id==='ds-q'?'input':'change',dsRender);
  });
  dsRender();
}

/* ===== KANBAN ===== */
const KANBAN_STATUSES=[
  { key:'todo',      label:'À faire',  cls:'k-todo' },
  { key:'doing',     label:'En cours', cls:'k-doing' },
  { key:'done',      label:'Terminé',  cls:'k-done' },
  { key:'deposited', label:'Déposé',   cls:'k-deposited' }
];
const LS_TASKS='lili-mallette-tasks-v1';
let TASKS=[];
let kCat='tous';
function saveTasks(){ try{ localStorage.setItem(LS_TASKS, JSON.stringify(TASKS)); }catch(e){} }
function loadTasks(){
  try{
    const raw=localStorage.getItem(LS_TASKS);
    if(!raw) return;
    const arr=JSON.parse(raw);
    if(Array.isArray(arr)) TASKS=arr;
  }catch(e){}
}
function renderKanban(){
  const q=topQ();
  /* Filterbar (catégorie) */
  const counts={tous:TASKS.length};
  LIVRABLES.forEach(L=>{ counts[L.key]=TASKS.filter(t=>t.category===L.key).length; });
  const fb=document.getElementById('k-filterbar');
  if(fb){
    fb.innerHTML=`<button class="chip ${kCat==='tous'?'active':''}" data-kcat="tous">Toutes ${TASKS.length?`<span class="c-count">${TASKS.length}</span>`:''}</button>`+
      LIVRABLES.map(L=>`<button class="chip ${kCat===L.key?'active':''}" data-kcat="${esc(L.key)}">${esc(L.label)} <span class="c-count">${counts[L.key]||0}</span></button>`).join('');
    fb.querySelectorAll('.chip[data-kcat]').forEach(ch=>ch.addEventListener('click',()=>{ kCat=ch.dataset.kcat; renderKanban(); }));
  }
  /* Tâches filtrées */
  let list=TASKS.slice();
  if(kCat!=='tous') list=list.filter(t=>t.category===kCat);
  if(q){
    list=list.filter(t=>{
      const m=t.assignee?memberById(t.assignee):null;
      const L=LIVRABLES.find(x=>x.key===t.category);
      const hay=(t.title||'')+' '+(t.jalon||'')+' '+(L?L.label:'')+' '+(m?m.name:'');
      return hay.toLowerCase().includes(q);
    });
  }
  list.sort((a,b)=>(a.deadline||'').localeCompare(b.deadline||''));
  /* Colonnes */
  const today=new Date(); today.setHours(0,0,0,0);
  document.getElementById('kanban').innerHTML=KANBAN_STATUSES.map(col=>{
    const cards=list.filter(t=>t.status===col.key);
    return `<div class="kanban-col" data-status="${esc(col.key)}">
      <div class="k-col-head ${col.cls}">${col.label} <span class="k-col-count">${cards.length}</span></div>
      <div class="k-col-body">${cards.map(t=>renderTaskCard(t,today)).join('')||'<div class="empty-note">Vide</div>'}</div>
    </div>`;
  }).join('');
  document.querySelectorAll('#kanban .k-card[data-id]').forEach(c=>{
    c.addEventListener('click',ev=>{
      if(ev.target.closest('.k-card-link')) return;
      openTaskForm(c.dataset.id);
    });
    c.setAttribute('draggable','true');
    c.addEventListener('dragstart',e=>{
      e.dataTransfer.setData('text/plain',c.dataset.id);
      e.dataTransfer.effectAllowed='move';
      c.classList.add('dragging');
    });
    c.addEventListener('dragend',()=>c.classList.remove('dragging'));
  });
  document.querySelectorAll('#kanban .kanban-col[data-status]').forEach(col=>{
    col.addEventListener('dragover',e=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; col.classList.add('drag-over'); });
    col.addEventListener('dragleave',e=>{ if(!col.contains(e.relatedTarget)) col.classList.remove('drag-over'); });
    col.addEventListener('drop',e=>{
      e.preventDefault();
      col.classList.remove('drag-over');
      const id=e.dataTransfer.getData('text/plain');
      const newStatus=col.dataset.status;
      if(!id||!newStatus) return;
      const t=TASKS.find(x=>x.id===id);
      if(!t||t.status===newStatus) return;
      t.status=newStatus;
      saveTasks();
      renderKanban();
      toast('Tâche déplacée vers '+(KANBAN_STATUSES.find(s=>s.key===newStatus)||{}).label);
    });
  });
}
function renderTaskCard(t,today){
  const L=LIVRABLES.find(x=>x.key===t.category);
  const m=t.assignee?memberById(t.assignee):null;
  const dl=t.deadline?new Date(t.deadline+'T00:00:00'):null;
  const overdue = dl && dl<today && t.status!=='done' && t.status!=='deposited';
  return `<div class="k-card" data-id="${esc(t.id)}">
    <div class="k-card-title">${esc(t.title)}</div>
    <div class="k-card-meta">
      ${L?`<span class="tk-stage">${esc(L.label)}</span>`:''}
      ${m?`<span class="ava-sm" style="width:22px;height:22px;margin:0;background:${m.color}" title="${esc(m.name)}">${initials(m.name)}</span>`:''}
      ${t.deadline?`<span class="k-card-date${overdue?' warn':''}">${fmtDate(t.deadline)}</span>`:''}
    </div>
    ${t.jalon?`<div class="k-card-jalon">📌 ${esc(t.jalon)}</div>`:''}
    ${t.link&&isHttpUrl(t.link)?`<a class="btn sm k-card-link" href="${esc(t.link)}" target="_blank" rel="noopener noreferrer">Ouvrir Proton</a>`:''}
  </div>`;
}
function openTaskForm(id){
  const box=document.getElementById('task-form');
  if(!box) return;
  const t=id?TASKS.find(x=>x.id===id):{id:null,title:'',category:LIVRABLES[0].key,projectId:'',assignee:'',deadline:'',jalon:'',link:'',status:'todo'};
  if(id&&!t){ return; }
  const catOpts=LIVRABLES.map(L=>`<option value="${esc(L.key)}"${L.key===t.category?' selected':''}>${esc(L.label)}</option>`).join('');
  const whoOpts='<option value="">— personne —</option>'+TEAM.map(m=>`<option value="${esc(m.id)}"${m.id===(t.assignee||'')?' selected':''}>${esc(m.name)}</option>`).join('');
  const projOpts='<option value="">— aucun projet —</option>'+PROJECTS.map(p=>`<option value="${esc(p.id)}"${p.id===(t.projectId||'')?' selected':''}>${esc(p.title)}</option>`).join('');
  const statusOpts=KANBAN_STATUSES.map(s=>`<option value="${esc(s.key)}"${s.key===t.status?' selected':''}>${esc(s.label)}</option>`).join('');
  box.innerHTML=`
    <div class="invite-card">
      <input id="tk-title" placeholder="Titre de la tâche" value="${esc(t.title)}" style="flex:1 1 240px">
      <select id="tk-cat">${catOpts}</select>
      <select id="tk-proj">${projOpts}</select>
      <select id="tk-who">${whoOpts}</select>
      <input id="tk-date" type="date" value="${esc(t.deadline||'')}">
      <input id="tk-jalon" placeholder="Jalon (ex. Validation client)" value="${esc(t.jalon||'')}" style="flex:1 1 180px">
      <input id="tk-link" placeholder="Lien Proton (https://…)" value="${esc(t.link||'')}" style="flex:1 1 220px">
      <select id="tk-status">${statusOpts}</select>
      <button class="btn primary sm" id="tk-save">${id?'Enregistrer':'Créer la tâche'}</button>
      ${id?'<button class="btn sm" id="tk-del">Supprimer</button>':''}
      <button class="btn sm" id="tk-cancel">Annuler</button>
    </div>`;
  document.getElementById('tk-save').addEventListener('click',()=>saveTaskFromForm(id));
  document.getElementById('tk-cancel').addEventListener('click',()=>{ box.innerHTML=''; });
  if(id){ document.getElementById('tk-del').addEventListener('click',()=>{
    if(!confirm('Supprimer cette tâche ?')) return;
    TASKS=TASKS.filter(x=>x.id!==id); saveTasks(); box.innerHTML=''; renderKanban(); toast('Tâche supprimée');
  }); }
  document.getElementById('tk-title').focus();
}
function saveTaskFromForm(id){
  const title=document.getElementById('tk-title').value.trim();
  if(!title){ toast('Donnez un titre'); return; }
  const category=document.getElementById('tk-cat').value;
  const projectId=document.getElementById('tk-proj').value;
  const assignee=document.getElementById('tk-who').value;
  const deadline=document.getElementById('tk-date').value;
  const jalon=document.getElementById('tk-jalon').value.trim();
  const link=document.getElementById('tk-link').value.trim();
  const status=document.getElementById('tk-status').value;
  if(link&&!isHttpUrl(link)){ toast('Lien invalide — il doit commencer par https://'); return; }
  if(id){
    const i=TASKS.findIndex(t=>t.id===id);
    if(i>=0) TASKS[i]={...TASKS[i],title,category,projectId,assignee,deadline,jalon,link,status};
  } else {
    TASKS.push({id:'t_'+Date.now(),title,category,projectId,assignee,deadline,jalon,link,status});
  }
  saveTasks();
  document.getElementById('task-form').innerHTML='';
  renderKanban();
  toast(id?'Tâche mise à jour':'Tâche créée');
}

/* ===== NAV ===== */
const VIEW_NAMES={dashboard:'Tableau de bord',projets:'Projets',docs:'Documents',kanban:'Kanban',gantt:'Calendrier',equipe:'Équipe'};
const SEARCH_PLACEHOLDER={dashboard:'Rechercher un projet…',projets:'Rechercher un projet…',docs:'Rechercher un document…',kanban:'Rechercher une tâche…',gantt:'Rechercher un projet…',equipe:'Rechercher un membre…'};
function switchView(v){
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
  document.getElementById('view-'+v).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  document.getElementById('crumb-current').textContent=VIEW_NAMES[v]||'';
  document.getElementById('sidebar').classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
  const _s=document.getElementById('search');
  if(_s){ _s.value=''; _s.placeholder=SEARCH_PLACEHOLDER[v]||'Rechercher…'; }
  if(v==='dashboard') renderDashboard();
  if(v==='projets') renderProjets();
  if(v==='docs') renderDocs();
  if(v==='kanban') renderKanban();
  if(v==='gantt') renderGantt();
  if(v==='equipe') renderTeam();
}
document.querySelectorAll('.nav-item').forEach(b=>{
  if(b.hasAttribute('data-soon')){
    b.addEventListener('click',()=>toast('Module prévu pour une phase ultérieure'));
  }else{
    b.addEventListener('click',()=>{ if(b.dataset.view) switchView(b.dataset.view); });
  }
});

/* search */
document.getElementById('search').addEventListener('input',()=>{
  const v=document.querySelector('.nav-item.active')?.dataset.view;
  if(v==='dashboard') renderDashboard();
  else if(v==='projets') renderProjets();
  else if(v==='gantt') renderGantt();
  else if(v==='equipe') renderTeam();
  else if(v==='kanban') renderKanban();
  else if(v==='docs'){ const dq=document.getElementById('ds-q'); if(dq){ dq.value=document.getElementById('search').value; dsRender(); } }
});

/* mobile menu */
document.getElementById('menu-toggle').addEventListener('click',()=>{
  document.getElementById('sidebar').classList.toggle('open');
});
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeModal(); });

/* ===== drag & resize des barres du Calendrier ===== */
let _ganttDrag=null;
let _ganttDragMoved=false;
document.addEventListener('mousedown',e=>{
  const bar=e.target.closest('#gantt .g-bar');
  if(!bar) return;
  const pid=bar.dataset.pid, lk=bar.dataset.lk;
  if(!pid||!lk) return;
  const p=PROJECTS.find(x=>x.id===pid);
  if(!p) return;
  p.livDates=p.livDates||{};
  const track=bar.parentElement;
  const trackRect=track.getBoundingClientRect();
  const mode=e.target.classList.contains('gb-resize-l')?'start'
            :e.target.classList.contains('gb-resize-r')?'end':'move';
  const NM=GMONTHS.length;
  const ld=p.livDates[lk]||{};
  const startIso=ld.start||p.dateStart||fmtIso(frac2date(p.gStart));
  const endIso=ld.end||p.dateEnd||fmtIso(frac2date(p.gEnd));
  const fs0=date2frac(startIso);
  const fe0=date2frac(_addDay(endIso));
  _ganttDrag={ p, lk, bar, mode, trackRect, x0:e.clientX, fs0, fe0, NM };
  _ganttDragMoved=false;
  bar.classList.add('dragging');
  e.preventDefault();
});
document.addEventListener('mousemove',e=>{
  if(!_ganttDrag) return;
  const d=_ganttDrag;
  const dx=e.clientX-d.x0;
  if(Math.abs(dx)>3) _ganttDragMoved=true;
  const dF=(dx/d.trackRect.width)*d.NM;
  const minW=0.05;
  let fs=d.fs0, fe=d.fe0;
  if(d.mode==='move'){
    fs=d.fs0+dF; fe=d.fe0+dF;
    if(fs<0){ fe+=-fs; fs=0; }
    if(fe>d.NM){ fs-=(fe-d.NM); fe=d.NM; }
  } else if(d.mode==='start'){
    fs=Math.min(d.fe0-minW, Math.max(0, d.fs0+dF));
  } else {
    fe=Math.max(d.fs0+minW, Math.min(d.NM, d.fe0+dF));
  }
  d.p.livDates=d.p.livDates||{};
  d.p.livDates[d.lk]=d.p.livDates[d.lk]||{};
  d.p.livDates[d.lk].start=fmtIso(frac2date(fs));
  const endBound=frac2date(fe); endBound.setDate(endBound.getDate()-1);
  d.p.livDates[d.lk].end=fmtIso(endBound);
  const fs2=date2frac(d.p.livDates[d.lk].start);
  const fe2=date2frac(_addDay(d.p.livDates[d.lk].end));
  d.bar.style.left=(fs2/d.NM*100)+'%';
  d.bar.style.width=Math.max((fe2-fs2)/d.NM*100,5)+'%';
});
document.addEventListener('mouseup',()=>{
  if(!_ganttDrag) return;
  const d=_ganttDrag;
  d.bar.classList.remove('dragging');
  _ganttDrag=null;
  if(_ganttDragMoved){
    saveState();
    renderGantt(); renderDashboard(); renderProjets();
  }
});

/* nav project count */
document.getElementById('nav-count-proj').textContent=PROJECTS.length;

/* init */
loadState();
loadTeam();
loadTasks();
(function(){ const b=document.getElementById('invite-btn'); if(b) b.addEventListener('click',showInviteForm); })();
(function(){ const b=document.getElementById('task-new-btn'); if(b) b.addEventListener('click',()=>openTaskForm(null)); })();
buildFilterbar();
renderDashboard();
