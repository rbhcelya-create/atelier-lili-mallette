/* =================================================================
   L'ATELIER — Outil de gestion Lili Mallette  (prototype)
   Structure : Projet (le contenu) > Livrables (balado / vidéo / spectacle)
   Pipeline d'après le schéma client.
   ================================================================= */

/* ===== SUPABASE — fondation du backend
   Migration progressive de localStorage vers Supabase, module par
   module. Pour l'instant on initialise juste le client et on teste
   la connexion. Aucune donnée n'est encore lue/écrite côté serveur.
   La clé publishable est conçue pour être exposée côté navigateur ;
   la vraie sécurité passera par les politiques RLS définies dans
   Supabase pour chaque table. */
const SUPABASE_URL = 'https://rbcyupofvqhuihssrxwe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FKIOicG3sJW81e1Peo5wIw_5_u6BBjj';
let supa = null;
try {
  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('[Supabase] client initialisé pour', SUPABASE_URL);
    /* Petit ping de connexion : on ne fait rien de fonctionnel, on
       vérifie juste qu'on arrive à parler au serveur d'auth. Si le
       réseau est OK et la clé valide, on aura une session=null (pas
       connecté) sans erreur. Si la clé est mauvaise, on verra une
       erreur 401 dans la console. */
    supa.auth.getSession().then(({data, error}) => {
      if (error) console.error('[Supabase] erreur de connexion :', error.message);
      else console.log('[Supabase] connexion OK — session :', data.session ? 'authentifié' : 'anonyme');
    });
  } else {
    console.warn('[Supabase] SDK non chargé — window.supabase est absent. Vérifie le <script> CDN dans atelier-lili-mallette.html.');
  }
} catch (e) {
  console.error('[Supabase] échec d\'initialisation :', e);
}

/* ===== AUTHENTIFICATION (cosmétique)
   ATTENTION : c'est une protection visuelle uniquement. Le code étant
   côté client, n'importe qui peut contourner via les outils dev du
   navigateur. Pour une vraie auth, brancher Supabase plus tard.
   Pour changer les identifiants : modifier les valeurs ci-dessous et
   redéployer.
   AUTH_ENABLED = false  →  désactive complètement l'écran de login
                            et le bouton déconnexion. Aucune saisie
                            requise au chargement de la page. */
const AUTH_ENABLED = false;
const AUTH = {
  identifiant: 'liliatelier',
  motDePasse:  '123456'
};
const LS_AUTH = 'lili-mallette-auth-v1';
function isAuthed(){ try{ return localStorage.getItem(LS_AUTH)==='1'; }catch(e){ return false; } }
function setAuthed(v){
  try{ if(v) localStorage.setItem(LS_AUTH,'1'); else localStorage.removeItem(LS_AUTH); }catch(e){}
}
function showAuthScreen(){
  const sc=document.getElementById('auth-screen');
  if(!sc) return;
  sc.classList.remove('hidden');
  const id=document.getElementById('auth-id'), pwd=document.getElementById('auth-pwd'), err=document.getElementById('auth-err');
  if(id) id.value=''; if(pwd) pwd.value=''; if(err) err.textContent='';
  setTimeout(()=>{ if(id) id.focus(); },30);
}
function hideAuthScreen(){
  const sc=document.getElementById('auth-screen');
  if(sc) sc.classList.add('hidden');
}
function tryLogin(){
  const id=(document.getElementById('auth-id').value||'').trim();
  const pwd=document.getElementById('auth-pwd').value||'';
  const err=document.getElementById('auth-err');
  if(id===AUTH.identifiant && pwd===AUTH.motDePasse){
    setAuthed(true); hideAuthScreen();
    err.textContent='';
  } else {
    err.textContent='Identifiant ou mot de passe incorrect';
    document.getElementById('auth-pwd').value='';
    document.getElementById('auth-pwd').focus();
  }
}
function logout(){
  setAuthed(false);
  /* Recharge pour repartir d'un état propre — évite que des écouteurs en
     double s'accumulent après plusieurs logout/login. */
  location.reload();
}
/* Branche le formulaire dès maintenant : si l'utilisateur n'est pas
   identifié, l'écran reste visible ; sinon on le masque.
   Si AUTH_ENABLED est false, on masque tout (écran + bouton déconnexion). */
(function bootAuth(){
  if(typeof document==='undefined') return;
  const wire=()=>{
    if(!AUTH_ENABLED){
      /* Bypass total — masque l'écran de login et le bouton déconnexion. */
      hideAuthScreen();
      const lb=document.getElementById('logout-btn');
      if(lb) lb.style.display='none';
      return;
    }
    const form=document.getElementById('auth-form');
    if(form) form.addEventListener('submit',e=>{ e.preventDefault(); tryLogin(); });
    const logoutBtn=document.getElementById('logout-btn');
    if(logoutBtn) logoutBtn.addEventListener('click',logout);
    if(isAuthed()) hideAuthScreen();
    else showAuthScreen();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',wire);
  else wire();
})();

const TEAM = [
  { id:'lise',  name:'Lise Martin',         role:'Créatrice & narratrice',        access:'admin',   color:'#C04A3F', initiales:'LM', email:'lise.martin@lilimallette.education' },
  { id:'fred',  name:'Frédérick Rouleau',   role:'Univers visuel',                access:'editeur', color:'#6E8E63', initiales:'FR', email:'frederouleau@proton.me' },
  { id:'bruno', name:'Bruno Lefebvre',      role:'Réalisation sonore & musicale', access:'admin',   color:'#2F4259', initiales:'BL', email:'bruno.lefebvre1962@pm.me' },
  { id:'anne',  name:'Anne Kichenapanaïdou', role:'Coordonnatrice',                access:'admin',   color:'#C28A2C', initiales:'AK', email:'anne.kichenapanaidou@lilimallette.education' },
  { id:'line',  name:'Line Durocher',        role:'Fiche pédagogique',             access:'editeur', color:'#8C8270', initiales:'LD' },
  { id:'ana',   name:'Ana de Rosario',      role:'Marketing & réseaux sociaux',   access:'editeur', color:'#B07560', initiales:'AR', email:'anacarolinadorosario@proton.me' }
];
const memberById = id => TEAM.find(m=>m.id===id) || {name:'?',color:'#8C8270'};
const initials = n => n.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();

/* ===== UTILISATEUR COURANT (étape vers la vraie auth Supabase)
   Permet à chaque personne de l'équipe d'indiquer qui elle est sans
   avoir à se créer un compte. Stockée en localStorage par navigateur.
   Quand l'auth Supabase arrivera, on mappera l'email connecté → membre
   d'équipe automatiquement et on supprimera le sélecteur manuel. */
const LS_CURRENT_USER = 'lili-mallette-current-user-v1';
let currentUserId = 'bruno';
function loadCurrentUser(){
  try{
    const stored = localStorage.getItem(LS_CURRENT_USER);
    if(stored && TEAM.find(m=>m.id===stored)) currentUserId = stored;
  }catch(e){}
}
function getCurrentUser(){
  return TEAM.find(m=>m.id===currentUserId) || TEAM[0];
}
function setCurrentUser(id){
  if(!TEAM.find(m=>m.id===id)) return;
  currentUserId = id;
  try{ localStorage.setItem(LS_CURRENT_USER, id); }catch(e){}
  renderSidebarFoot();
}

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
    folderLinks:{ texte:'https://drive.proton.me/urls/DOSSIER_FILOU_TEXTE', images:'https://drive.proton.me/urls/DOSSIER_FILOU_IMAGES', audio:'', video:'' },
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
    folderLinks:{ audio:'https://drive.proton.me/urls/DOSSIER_BERNARDO_AUDIO', texte:'', images:'', video:'' },
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
    folderLinks:{ video:'https://drive.proton.me/urls/DOSSIER_GEANT_VIDEO', audio:'https://drive.proton.me/urls/DOSSIER_GEANT_AUDIO', texte:'', images:'' },
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
    folderLinks:{ images:'https://drive.proton.me/urls/DOSSIER_TIFI_IMAGES', texte:'', audio:'', video:'' },
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

const DOC_CATEGORIES = [
  { key:'images', label:'Images', code:'IMG' },
  { key:'video',  label:'Vidéo',  code:'VID' },
  { key:'texte',  label:'Texte',  code:'TXT' },
  { key:'audio',  label:'Audio',  code:'AUD' }
];
/* Documents — le lien Proton n'est plus stocké par document : il est récupéré
   dynamiquement via docFolderLink() à partir de project.folderLinks[categorie].
   On garde le champ `lienProton` en option pour compat des anciennes données
   en localStorage, mais il n'est plus écrit pour les nouveaux documents. */
const DOCUMENTS = [
  { id:'d1', nomOriginal:'script v3',               projetId:'p1', categorie:'texte',  notes:'Version validée', createdAt:'2026-05-12' },
  { id:'d2', nomOriginal:'voix narration bernardo', projetId:'p2', categorie:'audio',  notes:'',                createdAt:'2026-05-08' },
  { id:'d3', nomOriginal:'montage final',           projetId:'p4', categorie:'video',  notes:'Master',          createdAt:'2026-05-04' },
  { id:'d4', nomOriginal:'planches scenes 1-3',     projetId:'p5', categorie:'images', notes:'Approuvées',      createdAt:'2026-06-08' }
];

/* ============================================================
   NOMENCLATURE CLIENT (3e section de la vue Documents)
   Format fourni par le client — Lili Mallette, juin 2026 :
     AAAA-MM-JJ_Sujet_CAT_INITIALES_v_NN
   Indépendant du module Documents historique au-dessus.
   ============================================================ */
const DOC_CATEGORIES_CLIENT = [
  { key:'images', label:'Images', code:'IMG'   },
  { key:'video',  label:'Vidéo',  code:'VIDEO' },
  { key:'texte',  label:'Texte',  code:'TXT'   },
  { key:'audio',  label:'Audio',  code:'AUDIO' }
];
const DOCUMENTS_CLIENT = [
  { id:'cd1', date:'2026-05-14', sujet:'Filou',          projetId:'p1', categorie:'images', initiales:'FR', version:1, lienProton:'https://drive.proton.me/urls/EXEMPLE_FILOU_IMG',     resume:'Filou sur sa trottinette avec un casque rouge',  createdAt:'2026-05-14' },
  { id:'cd2', date:'2026-05-18', sujet:'Geant_Youtube',  projetId:'p4', categorie:'video',  initiales:'BL', version:1, lienProton:'https://drive.proton.me/urls/EXEMPLE_GEANT_VIDEO',   resume:'Balado du géant pour Youtube',                   createdAt:'2026-05-18' },
  { id:'cd3', date:'2026-05-23', sujet:'Bernardo',       projetId:'p2', categorie:'audio',  initiales:'BL', version:2, lienProton:'https://drive.proton.me/urls/EXEMPLE_BERNARDO_AUDIO',resume:'Version 2 du balado Bernardo (mastering final)', createdAt:'2026-05-23' },
  { id:'cd4', date:'2026-06-08', sujet:'Tifi',           projetId:'p5', categorie:'texte',  initiales:'LM', version:1, lienProton:'https://drive.proton.me/urls/EXEMPLE_TIFI_TXT',    resume:'Adaptation finale du conte Tifi a Lill-la',      createdAt:'2026-06-08' }
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

/* ----------------------------------------------------------------------
   À METTRE À JOUR avec le format exact fourni par le client
   Format provisoire : {slug-projet}_{CAT}_{slug-nom-original}
     - slug-projet  : titre du projet, accents retirés, minuscules,
                      caractères non-alphanumériques → tirets
     - CAT          : code 3 lettres de la catégorie (IMG/VID/TXT/AUD)
     - slug-nom-original : nom original, accents retirés, minuscules,
                           caractères non-alphanumériques → underscores
   Retourne '' si une donnée manque, pour que l'UI puisse afficher un
   placeholder.
   ---------------------------------------------------------------------- */
function generateFileName({nomOriginal, projetId, categorie}){
  if(!nomOriginal||!projetId||!categorie) return '';
  const proj=PROJECTS.find(p=>p.id===projetId);
  if(!proj) return '';
  const strip=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
  const slugProj=strip(proj.title).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const slugOrig=strip(nomOriginal).replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  const cat=DOC_CATEGORIES.find(c=>c.key===categorie);
  const code=cat?cat.code:'XXX';
  return `${slugProj}_${code}_${slugOrig}`;
}
/* Lien Proton du dossier de destination, dérivé du projet + catégorie.
   Renseigné une fois par projet/catégorie, réutilisé pour tous les documents
   de cette combinaison. Si le projet n'a pas encore de lien, on retombe sur
   l'ancien champ `lienProton` du document (compat) puis sur ''. */
function docFolderLink(d){
  if(!d) return '';
  const p=PROJECTS.find(x=>x.id===d.projetId);
  if(p&&p.folderLinks&&p.folderLinks[d.categorie]) return p.folderLinks[d.categorie];
  return d.lienProton||'';
}
function setProjectFolderLink(projetId, categorie, url){
  const p=PROJECTS.find(x=>x.id===projetId);
  if(!p||!categorie) return false;
  p.folderLinks=p.folderLinks||{};
  p.folderLinks[categorie]=url||'';
  saveState();
  return true;
}
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
  /* On garde l'écriture localStorage comme cache rapide (utile pour
     d'autres modules legacy) ET on pousse en parallèle vers Supabase. */
  try{
    const data={};
    PROJECTS.forEach(p=>{ data[p.id]={
      docs:p.docs||{},
      comments:p.comments||[],
      dateStart:p.dateStart||null,
      dateEnd:p.dateEnd||null,
      deadline:p.deadline||null,
      livDates:p.livDates||{},
      folderLinks:p.folderLinks||{}
    }; });
    localStorage.setItem(LS_KEY,JSON.stringify(data));
  }catch(e){}
  /* Fire-and-forget : sync vers Supabase en arrière-plan */
  saveProjectsToSupabase();
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
      if(s.folderLinks&&typeof s.folderLinks==='object') p.folderLinks={...(p.folderLinks||{}),...s.folderLinks};
    });
  }catch(e){}
}

/* ============================================================
   PROJECTS — Supabase (table public.projects, JSONB pour nested)
   ============================================================ */

/* Mapping colonne BD (snake_case) ↔ champ JS (camelCase).
   Les champs `tasks` et `resources` du modèle JS sont legacy et ne
   sont PAS stockés en BD — on les réinitialise à [] au chargement. */
function projectFromRow(row){
  return {
    id:           row.id,
    title:        row.title,
    fileCode:     row.file_code,
    style:        row.style,
    status:       row.status,
    gStart:       parseFloat(row.g_start) || 0,
    gEnd:         parseFloat(row.g_end) || 1,
    dateStart:    row.date_start || undefined,
    dateEnd:      row.date_end || undefined,
    deadline:     row.deadline || undefined,
    folderLinks:  (row.folder_links && typeof row.folder_links==='object') ? row.folder_links : {},
    stages:       (row.stages && typeof row.stages==='object') ? row.stages : {},
    deliverables: Array.isArray(row.deliverables) ? row.deliverables : [],
    livDates:     (row.liv_dates && typeof row.liv_dates==='object') ? row.liv_dates : {},
    comments:     Array.isArray(row.comments) ? row.comments : [],
    docs:         (row.docs && typeof row.docs==='object') ? row.docs : {},
    tasks:        [],
    resources:    []
  };
}
function projectToRow(p){
  return {
    id:           p.id,
    title:        p.title,
    file_code:    p.fileCode,
    style:        p.style,
    status:       p.status,
    g_start:      typeof p.gStart === 'number' ? p.gStart : 0,
    g_end:        typeof p.gEnd === 'number' ? p.gEnd : 1,
    date_start:   p.dateStart || null,
    date_end:     p.dateEnd || null,
    deadline:     p.deadline || null,
    folder_links: p.folderLinks || {},
    stages:       p.stages || {},
    deliverables: p.deliverables || [],
    liv_dates:    p.livDates || {},
    comments:     p.comments || [],
    docs:         p.docs || {}
  };
}

/* Charge tous les projets depuis Supabase. Si la table est vide
   (premier lancement après création), seede avec les 7 projets
   hardcodés (qui peuvent déjà contenir les édits localStorage
   appliqués par loadState juste avant). */
async function loadProjectsFromSupabase(){
  if(!supa){
    console.warn('[Supabase] client absent — projets non chargés.');
    return false;
  }
  const { data, error } = await supa
    .from('projects')
    .select('*')
    .order('id', { ascending: true });
  if(error){
    console.error('[Supabase] chargement projects échec :', error.message);
    toast('Erreur de chargement projets — voir la console');
    return false;
  }
  if(data.length === 0){
    console.log('[Supabase] table projects vide, seed depuis JS...');
    const rows = PROJECTS.map(p => projectToRow(p));
    /* Upsert (au lieu d'insert) pour éviter les conflits si une autre
       initialisation (ex : saveState depuis migrateLegacyDocLinks) a
       déjà pushé entre notre SELECT et notre INSERT. */
    const { error: seedError } = await supa.from('projects').upsert(rows, { onConflict: 'id' });
    if(seedError){
      console.error('[Supabase] seed projects échec :', seedError.message);
      toast('Erreur seed projets — voir la console');
      return false;
    }
    console.log('[Supabase] seed projects OK ('+rows.length+' projets)');
    toast('Projets synchronisés avec Supabase');
    return true;
  }
  /* Remplace PROJECTS en place (PROJECTS est const, donc on mute le contenu) */
  PROJECTS.length = 0;
  data.forEach(row => PROJECTS.push(projectFromRow(row)));
  return true;
}

/* Pousse les 7 projets vers Supabase via upsert (insert ou update
   selon que la ligne existe). Appelé en fire-and-forget par saveState
   à chaque modification d'un projet. */
async function saveProjectsToSupabase(){
  if(!supa) return false;
  const rows = PROJECTS.map(p => projectToRow(p));
  const { error } = await supa.from('projects').upsert(rows, { onConflict: 'id' });
  if(error){
    console.error('[Supabase] upsert projects échec :', error.message);
    toast('Erreur de sauvegarde projets — voir la console');
    return false;
  }
  return true;
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
        <div class="gr-l gr-l-sub"></div>
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

/* ===== SIDEBAR FOOT — affichage de l'utilisateur courant + picker ===== */
function renderSidebarFoot(){
  const u = getCurrentUser();
  const ava = document.querySelector('.sb-foot .ava');
  const name = document.querySelector('.sb-foot .who .n');
  const role = document.querySelector('.sb-foot .who .r');
  if(ava){
    ava.textContent = u.initiales || initials(u.name);
    ava.style.background = u.color;
  }
  if(name) name.textContent = u.name;
  if(role) role.textContent = u.role + ' · ' + (u.access === 'admin' ? 'Admin' : 'Éditeur');
}
function showUserPicker(){
  const existing = document.getElementById('user-picker');
  if(existing){ existing.remove(); return; }
  const picker = document.createElement('div');
  picker.id = 'user-picker';
  picker.className = 'user-picker';
  picker.innerHTML = `
    <div class="user-picker-head">Connecté en tant que</div>
    ${TEAM.map(m => `
      <button class="user-picker-item ${m.id === currentUserId ? 'active' : ''}" data-uid="${esc(m.id)}">
        <span class="user-picker-ava" style="background:${m.color}">${esc(m.initiales || initials(m.name))}</span>
        <span class="user-picker-info">
          <span class="user-picker-name">${esc(m.name)}</span>
          <span class="user-picker-role">${esc(m.role)}</span>
        </span>
        ${m.id === currentUserId ? '<span class="user-picker-check">✓</span>' : ''}
      </button>
    `).join('')}
    <div class="user-picker-foot">Ton choix sera mémorisé sur ce navigateur. Tes commentaires seront attribués au membre sélectionné.</div>
  `;
  document.body.appendChild(picker);
  picker.querySelectorAll('[data-uid]').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    setCurrentUser(btn.dataset.uid);
    picker.remove();
    toast('Connecté en tant que ' + getCurrentUser().name);
  }));
  /* Fermeture sur clic à l'extérieur */
  setTimeout(() => {
    const closeOnOutside = (e) => {
      if(!picker.contains(e.target) && !e.target.closest('.sb-foot')){
        picker.remove();
        document.removeEventListener('click', closeOnOutside);
      }
    };
    document.addEventListener('click', closeOnOutside);
  }, 10);
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
  document.querySelectorAll('#team-grid [data-del-member]').forEach(b=>b.addEventListener('click',async ()=>{
    const id = b.dataset.delMember;
    const ok = await deleteTeamMemberFromSupabase(id);
    if(!ok) return;
    await loadTeamFromSupabase();
    renderTeam();
    toast('Invitation retirée');
  }));
}

/* ===== ÉQUIPE — Supabase (table public.team_members) =====
   Stocke les 6 membres permanents + les invitations en attente (pending).
   L'authentification réelle viendra plus tard ; pour l'instant tout est
   ouvert (RLS anon_all) et les invitations restent une simulation
   (aucun email réel n'est envoyé). */

/* Mapping colonne BD ↔ champ JS (presque tout pareil sauf created_at/updated_at) */
function teamMemberFromRow(row){
  return {
    id:        row.id,
    name:      row.name,
    role:      row.role,
    access:    row.access,
    color:     row.color,
    initiales: row.initiales || '',
    email:     row.email || '',
    pending:   !!row.pending,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function teamMemberToRow(m){
  return {
    id:        m.id,
    name:      m.name,
    role:      m.role || '',
    access:    m.access || 'editeur',
    color:     m.color || '#8C8270',
    initiales: m.initiales || null,
    email:     m.email || null,
    pending:   !!m.pending
  };
}

/* Charge tous les membres depuis Supabase. Si la table est vide
   (premier lancement), seede les 6 hardcodés. */
async function loadTeamFromSupabase(){
  if(!supa){
    console.warn('[Supabase] client absent — équipe non chargée.');
    return false;
  }
  const { data, error } = await supa
    .from('team_members')
    .select('*')
    .order('created_at', { ascending: true });
  if(error){
    console.error('[Supabase] chargement team_members échec :', error.message);
    toast('Erreur de chargement équipe — voir la console');
    return false;
  }
  if(data.length === 0){
    console.log('[Supabase] table team_members vide, seed depuis JS...');
    const rows = TEAM.map(m => teamMemberToRow(m));
    const { error: seedError } = await supa.from('team_members').upsert(rows, { onConflict: 'id' });
    if(seedError){
      console.error('[Supabase] seed team_members échec :', seedError.message);
      toast('Erreur seed équipe — voir la console');
      return false;
    }
    console.log('[Supabase] seed team_members OK ('+rows.length+' membres)');
    toast('Équipe synchronisée avec Supabase');
    return true;
  }
  /* Remplace TEAM en place (TEAM est const) */
  TEAM.length = 0;
  data.forEach(row => TEAM.push(teamMemberFromRow(row)));
  return true;
}

async function upsertTeamMemberInSupabase(member){
  if(!supa){ toast('Supabase indisponible'); return false; }
  const row = teamMemberToRow(member);
  const { error } = await supa.from('team_members').upsert(row, { onConflict: 'id' });
  if(error){
    console.error('[Supabase] upsert team_member échec :', error.message);
    toast('Erreur de sauvegarde équipe — voir la console');
    return false;
  }
  return true;
}

async function deleteTeamMemberFromSupabase(id){
  if(!supa){ toast('Supabase indisponible'); return false; }
  const { error } = await supa.from('team_members').delete().eq('id', id);
  if(error){
    console.error('[Supabase] delete team_member échec :', error.message);
    toast('Erreur de suppression équipe — voir la console');
    return false;
  }
  return true;
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
async function sendInvite(){
  const name=(document.getElementById('inv-name').value||'').trim();
  const email=(document.getElementById('inv-email').value||'').trim();
  const access=document.getElementById('inv-access').value;
  if(!name){ toast('Indiquez un nom'); return; }
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ toast('Adresse email invalide'); return; }
  const colors=['#C04A3F','#6E8E63','#2F4259','#C28A2C','#8C8270','#B07560'];
  const newMember = {
    id:    'inv_'+Date.now(),
    name,
    role:  email,
    access,
    color: colors[TEAM.length%colors.length],
    email,
    pending: true
  };
  const ok = await upsertTeamMemberInSupabase(newMember);
  if(!ok) return;
  await loadTeamFromSupabase();
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
  p.comments.push({ who:currentUserId, to:to||undefined, date:'à l\'instant', text:txt });
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
(function(){
  const ov=document.getElementById('doc-overlay');
  const cb=document.getElementById('doc-m-close');
  if(cb) cb.addEventListener('click',closeDocModal);
  if(ov) ov.addEventListener('click',e=>{ if(e.target.id==='doc-overlay') closeDocModal(); });
})();

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
  renderDocList();
  renderClientDocs();
}

/* ===== DOCUMENTS — module 5 étapes ===== */
let docCat='tous';
function renderDocList(){
  const grid=document.getElementById('doc-grid');
  const fb=document.getElementById('doc-filterbar');
  if(!grid||!fb) return;
  const counts={tous:DOCUMENTS.length};
  DOC_CATEGORIES.forEach(c=>{ counts[c.key]=DOCUMENTS.filter(d=>d.categorie===c.key).length; });
  fb.innerHTML=`<button class="chip ${docCat==='tous'?'active':''}" data-dcat="tous">Toutes <span class="c-count">${DOCUMENTS.length}</span></button>`+
    DOC_CATEGORIES.map(c=>`<button class="chip ${docCat===c.key?'active':''}" data-dcat="${esc(c.key)}">${esc(c.label)} <span class="c-count">${counts[c.key]||0}</span></button>`).join('');
  fb.querySelectorAll('.chip[data-dcat]').forEach(ch=>ch.addEventListener('click',()=>{ docCat=ch.dataset.dcat; renderDocList(); }));
  let list=DOCUMENTS.slice();
  if(docCat!=='tous') list=list.filter(d=>d.categorie===docCat);
  list.sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  if(!list.length){
    grid.innerHTML=`<div class="placeholder" style="grid-column:1/-1">
      <div class="ph-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/></svg></div>
      <h2>Aucun document</h2><p>Ajoutez votre premier document avec le bouton « Nouveau document » ci-dessus.</p></div>`;
    return;
  }
  grid.innerHTML=list.map(renderDocCard).join('');
  grid.querySelectorAll('.doc-card[data-docid]').forEach(c=>c.addEventListener('click',ev=>{
    if(ev.target.closest('.doc-proton-link')) return;
    openDocModal(c.dataset.docid);
  }));
}
function renderDocCard(d){
  const proj=PROJECTS.find(p=>p.id===d.projetId);
  const cat=DOC_CATEGORIES.find(c=>c.key===d.categorie);
  const name=generateFileName({nomOriginal:d.nomOriginal,projetId:d.projetId,categorie:d.categorie});
  const folderUrl=docFolderLink(d);
  const ok=isHttpUrl(folderUrl);
  return `<article class="proj-card doc-card" data-docid="${esc(d.id)}">
    <div class="pc-head">
      <div class="pc-top">
        <span class="pc-mono">${esc((cat&&cat.code)||'')}</span>
        <span class="badge doc-cat-${esc(d.categorie)}">${esc(cat?cat.label:d.categorie)}</span>
      </div>
      <h3 style="font-family:'Source Sans 3',ui-monospace,monospace;font-size:13.5px;font-weight:600;line-height:1.3;word-break:break-all">${esc(name||'(nom incomplet)')}</h3>
      <div class="pc-file">${proj?esc(proj.title):'(projet introuvable)'}</div>
    </div>
    <div class="pc-foot">
      <span>${esc(fmtDate(d.createdAt))}</span>
      ${ok?`<a href="${esc(folderUrl)}" target="_blank" rel="noopener noreferrer" class="doc-proton-link">Ouvrir le dossier ↗</a>`:'<span style="color:var(--ink-3)">Dossier non lié</span>'}
    </div>
  </article>`;
}
function openDocModal(id){
  const isEdit=!!id;
  const d=isEdit?DOCUMENTS.find(x=>x.id===id):{id:null,nomOriginal:'',projetId:'',categorie:'',notes:''};
  if(isEdit&&!d) return;
  document.getElementById('doc-m-title').textContent=isEdit?'Modifier le document':'Nouveau document';
  document.getElementById('doc-m-sub').textContent=isEdit?'Modifiez puis enregistrez':'Renseignez les 5 étapes — flux automatisé';
  const body=document.getElementById('doc-m-body');
  const projOpts='<option value="">— sélectionnez —</option>'+PROJECTS.map(p=>`<option value="${esc(p.id)}"${p.id===(d.projetId||'')?' selected':''}>${esc(p.title)}</option>`).join('');
  const catChips=DOC_CATEGORIES.map(c=>`<button class="chip ${c.key===d.categorie?'active':''}" data-dform-cat="${esc(c.key)}">${esc(c.label)}</button>`).join('');
  body.innerHTML=`
    <div class="doc-step"><span class="step-num">1</span><div class="doc-step-body">
      <div class="field-label">Nom original</div>
      <input id="df-nom" placeholder="ex. bernardo l'éléphanteau" value="${esc(d.nomOriginal||'')}">
    </div></div>
    <div class="doc-step"><span class="step-num">2</span><div class="doc-step-body">
      <div class="field-label">Projet et catégorie</div>
      <select id="df-proj">${projOpts}</select>
      <div class="filterbar" id="df-cats" style="margin-top:6px">${catChips}</div>
    </div></div>
    <div class="doc-step"><span class="step-num">3</span><div class="doc-step-body">
      <div class="field-label">Nom final (généré automatiquement)</div>
      <div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap">
        <div class="doc-name-preview empty" id="df-name">Le nom apparaîtra ici…</div>
        <button class="btn sm" id="df-copy" disabled>📋 Copier</button>
      </div>
    </div></div>
    <div class="doc-step"><span class="step-num">4</span><div class="doc-step-body" id="df-step4-body">
      <div class="field-label">Lien d'accès au dossier Proton</div>
      <div id="df-folder-zone" class="doc-folder-zone">
        <div class="doc-step-instruction muted">Sélectionnez d'abord un projet et une catégorie.</div>
      </div>
    </div></div>
    <div class="doc-step"><span class="step-num">5</span><div class="doc-step-body">
      <div class="field-label">Glisser le document dans le dossier</div>
      <div class="doc-step-instruction">
        Une fois le dossier ouvert sur Proton Drive : <b>collez le nom final</b> (Ctrl+V) sur le fichier renommé, puis <b>glissez-le</b> dans le dossier.<br>
        Quand c'est fait, cliquez sur <b>Enregistrer</b> pour garder une trace du document dans l'index.
      </div>
    </div></div>
    <div class="doc-notes-block">
      <div class="field-label" style="margin-bottom:6px">Notes (optionnel)</div>
      <textarea id="df-notes" rows="2" placeholder="ex. Version validée, à mettre en ligne le 18 juin…">${esc(d.notes||'')}</textarea>
    </div>
    <div class="doc-modal-foot">
      ${isEdit?`<button class="btn sm" id="df-del" style="color:var(--accent)">Supprimer</button>`:'<span></span>'}
      <div style="display:flex;gap:8px">
        <button class="btn" id="df-cancel">Annuler</button>
        <button class="btn primary" id="df-save" disabled>Enregistrer</button>
      </div>
    </div>`;
  const st={nomOriginal:d.nomOriginal||'',projetId:d.projetId||'',categorie:d.categorie||'',notes:d.notes||''};

  /* Rendu de la zone Step 4 — adaptatif :
     - si projet+catégorie pas encore choisis → instruction
     - si lien dossier déjà connu pour ce (projet, catégorie) → boutons Ouvrir / Copier le lien + édition discrète
     - sinon → input pour coller le lien (auto-save au niveau projet) */
  const renderStep4=()=>{
    const zone=document.getElementById('df-folder-zone');
    if(!zone) return;
    if(!st.projetId||!st.categorie){
      zone.innerHTML='<div class="doc-step-instruction muted">Sélectionnez d\'abord un projet et une catégorie à l\'étape 2.</div>';
      return;
    }
    const proj=PROJECTS.find(x=>x.id===st.projetId);
    const cat=DOC_CATEGORIES.find(x=>x.key===st.categorie);
    const url=docFolderLink({projetId:st.projetId,categorie:st.categorie});
    const ctx=`${esc(proj?proj.title:'')} · ${esc(cat?cat.label:st.categorie)}`;
    if(isHttpUrl(url)){
      zone.innerHTML=`
        <div class="doc-folder-context">${ctx}</div>
        <div class="doc-folder-url"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a></div>
        <div class="doc-folder-actions">
          <button class="btn primary sm" id="df-open">↗ Ouvrir le dossier</button>
          <button class="btn sm" id="df-copy-folder">📋 Copier le lien</button>
          <button class="btn sm" id="df-edit-folder">Modifier</button>
        </div>
        <div class="doc-step-instruction">Une fois le dossier ouvert, collez le <b>nom final</b> (étape 3) puis glissez le fichier (étape 5).</div>`;
      document.getElementById('df-open').addEventListener('click',()=>window.open(url,'_blank','noopener'));
      document.getElementById('df-copy-folder').addEventListener('click',()=>{
        if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(()=>toast('Lien du dossier copié')); }
        else { const ta=document.createElement('textarea'); ta.value=url; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(ta); toast('Lien du dossier copié'); }
      });
      document.getElementById('df-edit-folder').addEventListener('click',()=>{
        renderStep4Edit(url);
      });
    } else {
      renderStep4Edit('');
    }
  };
  const renderStep4Edit=(currentUrl)=>{
    const zone=document.getElementById('df-folder-zone');
    if(!zone) return;
    const proj=PROJECTS.find(x=>x.id===st.projetId);
    const cat=DOC_CATEGORIES.find(x=>x.key===st.categorie);
    const ctx=`${esc(proj?proj.title:'')} · ${esc(cat?cat.label:st.categorie)}`;
    zone.innerHTML=`
      <div class="doc-folder-context">${ctx}</div>
      <input id="df-folder-input" type="url" placeholder="https://drive.proton.me/…" value="${esc(currentUrl||'')}">
      <div class="doc-folder-actions">
        <button class="btn primary sm" id="df-folder-save">Enregistrer ce lien pour ${ctx}</button>
        ${currentUrl?'<button class="btn sm" id="df-folder-cancel">Annuler</button>':''}
      </div>
      <div class="doc-step-instruction muted">Ce lien sera réutilisé pour tous les documents de cette catégorie dans ce projet.</div>`;
    const input=document.getElementById('df-folder-input');
    const saveBtn=document.getElementById('df-folder-save');
    const updateBtn=()=>{ saveBtn.disabled=!isHttpUrl(input.value.trim()); };
    input.addEventListener('input',()=>{ updateBtn(); refresh(); });
    updateBtn();
    saveBtn.addEventListener('click',()=>{
      const v=input.value.trim();
      if(!isHttpUrl(v)){ toast('Lien invalide — il doit commencer par https://'); return; }
      if(setProjectFolderLink(st.projetId,st.categorie,v)){
        toast('Lien du dossier enregistré');
        renderStep4();
        refresh();
      }
    });
    const cancel=document.getElementById('df-folder-cancel');
    if(cancel) cancel.addEventListener('click',()=>{ renderStep4(); refresh(); });
    setTimeout(()=>input.focus(),20);
  };

  const refresh=()=>{
    const name=generateFileName(st);
    const prev=document.getElementById('df-name');
    const copy=document.getElementById('df-copy');
    const save=document.getElementById('df-save');
    if(name){ prev.textContent=name; prev.classList.remove('empty'); copy.disabled=false; }
    else{ prev.textContent='Le nom apparaîtra ici…'; prev.classList.add('empty'); copy.disabled=true; }
    /* Validation : nom + projet + catégorie + lien dossier existant. Si on est en mode édition
       inline, on lit aussi la valeur du champ pour activer Enregistrer dès qu'elle est valide. */
    const folderUrl=docFolderLink({projetId:st.projetId,categorie:st.categorie});
    const inlineInput=document.getElementById('df-folder-input');
    const effectiveFolder=isHttpUrl(folderUrl)?folderUrl:(inlineInput?inlineInput.value.trim():'');
    save.disabled=!(st.nomOriginal.trim()&&st.projetId&&st.categorie&&isHttpUrl(effectiveFolder));
  };
  document.getElementById('df-nom').addEventListener('input',e=>{ st.nomOriginal=e.target.value; refresh(); });
  document.getElementById('df-proj').addEventListener('change',e=>{ st.projetId=e.target.value; renderStep4(); refresh(); });
  document.querySelectorAll('#df-cats [data-dform-cat]').forEach(ch=>ch.addEventListener('click',()=>{
    st.categorie=ch.dataset.dformCat;
    document.querySelectorAll('#df-cats .chip').forEach(c=>c.classList.toggle('active', c.dataset.dformCat===st.categorie));
    renderStep4(); refresh();
  }));
  document.getElementById('df-notes').addEventListener('input',e=>{ st.notes=e.target.value; });
  document.getElementById('df-copy').addEventListener('click',()=>{
    const name=generateFileName(st); if(!name) return;
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(name).then(()=>toast('Nom copié')); }
    else { const ta=document.createElement('textarea'); ta.value=name; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(ta); toast('Nom copié'); }
  });
  document.getElementById('df-cancel').addEventListener('click',closeDocModal);
  document.getElementById('df-save').addEventListener('click',()=>{
    /* Si l'utilisateur a saisi un lien dossier inline mais n'a pas cliqué « Enregistrer ce lien »,
       on le persiste automatiquement avant de sauvegarder le document. */
    const inlineInput=document.getElementById('df-folder-input');
    if(inlineInput){
      const v=inlineInput.value.trim();
      if(isHttpUrl(v)) setProjectFolderLink(st.projetId,st.categorie,v);
    }
    saveDocFromForm(id,st);
  });
  if(isEdit){
    document.getElementById('df-del').addEventListener('click',()=>{
      if(!confirm('Supprimer ce document ?')) return;
      const i=DOCUMENTS.findIndex(x=>x.id===id);
      if(i<0) return;
      DOCUMENTS.splice(i,1); saveDocs(); closeDocModal(); renderDocList(); toast('Document supprimé');
    });
  }
  renderStep4();
  refresh();
  document.getElementById('doc-overlay').classList.add('open');
  setTimeout(()=>{ const n=document.getElementById('df-nom'); if(n) n.focus(); },50);
}
function closeDocModal(){ document.getElementById('doc-overlay').classList.remove('open'); }
function saveDocFromForm(id,s){
  /* Le lien Proton n'est plus stocké sur le document : il est dérivé du projet+catégorie
     via docFolderLink(). On vérifie juste qu'il existe au moment de la sauvegarde. */
  const folderUrl=docFolderLink({projetId:s.projetId,categorie:s.categorie});
  if(!s.nomOriginal.trim()||!s.projetId||!s.categorie||!isHttpUrl(folderUrl)) return;
  if(id){
    const i=DOCUMENTS.findIndex(x=>x.id===id);
    if(i>=0) DOCUMENTS[i]={...DOCUMENTS[i],nomOriginal:s.nomOriginal.trim(),projetId:s.projetId,categorie:s.categorie,notes:s.notes||''};
  } else {
    DOCUMENTS.push({id:'d_'+Date.now(),nomOriginal:s.nomOriginal.trim(),projetId:s.projetId,categorie:s.categorie,notes:s.notes||'',createdAt:fmtIso(new Date())});
  }
  saveDocs(); closeDocModal(); renderDocList();
  toast(id?'Document mis à jour':'Document ajouté');
}
function exportDocsCSV(){
  /* Séparateur `;` (compatible Excel français), BOM UTF-8, échappement RFC 4180. */
  const headers=['nom_original','projet','categorie','nom_final','lien_dossier','date_creation','notes'];
  const csvEsc=v=>{ const s=String(v??''); return /[";\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; };
  const lines=[headers.join(';')];
  DOCUMENTS.forEach(d=>{
    const proj=PROJECTS.find(p=>p.id===d.projetId);
    const cat=DOC_CATEGORIES.find(c=>c.key===d.categorie);
    const name=generateFileName({nomOriginal:d.nomOriginal,projetId:d.projetId,categorie:d.categorie});
    const folderUrl=docFolderLink(d);
    lines.push([csvEsc(d.nomOriginal||''),csvEsc(proj?proj.title:''),csvEsc(cat?cat.label:d.categorie||''),csvEsc(name),csvEsc(folderUrl),csvEsc(d.createdAt||''),csvEsc(d.notes||'')].join(';'));
  });
  const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='documents_lili_'+fmtIso(new Date())+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('Export : '+DOCUMENTS.length+' document'+(DOCUMENTS.length>1?'s':''));
}

/* ============================================================
   NOMENCLATURE CLIENT — module indépendant (section 3 de view-docs)
   Format fourni par le client — Lili Mallette, juin 2026
   Backend Supabase : table public.documents_client.
   ============================================================ */

/* Mapping colonne BD (snake_case) ↔ champ JS (camelCase) */
function cdocFromRow(row){
  return {
    id:         row.id,
    date:       row.date,
    sujet:      row.sujet,
    projetId:   row.projet_id || '',
    categorie:  row.categorie,
    initiales:  row.initiales,
    version:    row.version,
    lienProton: row.lien_proton || '',
    resume:     row.resume || '',
    createdAt:  row.created_at,
    updatedAt:  row.updated_at
  };
}
function cdocToRow(d){
  return {
    date:        d.date,
    sujet:       (d.sujet||'').trim(),
    projet_id:   d.projetId || null,
    categorie:   d.categorie,
    initiales:   d.initiales,
    version:     Math.max(1, parseInt(d.version,10)||1),
    lien_proton: d.lienProton || null,
    resume:      d.resume || ''
  };
}

/* Chargement depuis Supabase — remplace le contenu du tableau en place
   (pour que les références existantes restent valides). */
async function loadCDocsFromSupabase(){
  if(!supa){
    console.warn('[Supabase] client absent — la section Nomenclature client ne se chargera pas.');
    return false;
  }
  const { data, error } = await supa
    .from('documents_client')
    .select('*')
    .order('date', { ascending: false });
  if(error){
    console.error('[Supabase] chargement documents_client échec :', error.message);
    toast('Erreur de chargement des documents — voir la console');
    return false;
  }
  DOCUMENTS_CLIENT.length = 0;
  data.forEach(row => DOCUMENTS_CLIENT.push(cdocFromRow(row)));
  return true;
}

/* Insert ou update selon que `id` est fourni. Renvoie true en cas de succès. */
async function upsertCDocInSupabase(id, payload){
  if(!supa){ toast('Supabase indisponible'); return false; }
  const res = id
    ? await supa.from('documents_client').update(payload).eq('id', id).select().single()
    : await supa.from('documents_client').insert(payload).select().single();
  if(res.error){
    console.error('[Supabase] sauvegarde documents_client échec :', res.error.message);
    toast('Erreur de sauvegarde — voir la console');
    return false;
  }
  return true;
}

/* Suppression d'une ligne par id. */
async function deleteCDocInSupabase(id){
  if(!supa){ toast('Supabase indisponible'); return false; }
  const { error } = await supa.from('documents_client').delete().eq('id', id);
  if(error){
    console.error('[Supabase] suppression documents_client échec :', error.message);
    toast('Erreur de suppression — voir la console');
    return false;
  }
  return true;
}

/* Format fourni par le client — Lili Mallette, juin 2026 */
function generateClientFileName({date, sujet, categorie, initiales, version}){
  if(!date||!sujet||!categorie||!initiales) return '';
  /* Sujet : on garde majuscules + accents, on remplace juste les espaces
     par des underscores et on retire les caractères qui poseraient
     problème dans un nom de fichier. */
  const cleanSujet = String(sujet).trim().replace(/\s+/g,'_').replace(/[^A-Za-z0-9À-ÿ_\-+]/g,'').replace(/^_+|_+$/g,'');
  if(!cleanSujet) return '';
  const cat = DOC_CATEGORIES_CLIENT.find(c=>c.key===categorie);
  const code = cat ? cat.code : 'XXX';
  const init = String(initiales).trim().toUpperCase();
  const v = String(Math.max(1,parseInt(version,10)||1)).padStart(2,'0');
  return `${date}_${cleanSujet}_${code}_${init}_v_${v}`;
}

let cdocCat='tous';
let cdocWho='tous';

function renderClientDocs(){
  /* Filterbar 1 — catégories */
  const fbc=document.getElementById('cdoc-filterbar-cat');
  if(fbc){
    const counts={tous:DOCUMENTS_CLIENT.length};
    DOC_CATEGORIES_CLIENT.forEach(c=>{ counts[c.key]=DOCUMENTS_CLIENT.filter(d=>d.categorie===c.key).length; });
    fbc.innerHTML=`<button class="chip ${cdocCat==='tous'?'active':''}" data-cdcat="tous">Toutes <span class="c-count">${DOCUMENTS_CLIENT.length}</span></button>`+
      DOC_CATEGORIES_CLIENT.map(c=>`<button class="chip ${cdocCat===c.key?'active':''}" data-cdcat="${esc(c.key)}">${esc(c.label)} <span class="c-count">${counts[c.key]||0}</span></button>`).join('');
    fbc.querySelectorAll('.chip[data-cdcat]').forEach(ch=>ch.addEventListener('click',()=>{ cdocCat=ch.dataset.cdcat; renderClientDocs(); }));
  }
  /* Filterbar 2 — responsables (initiales) */
  const fbw=document.getElementById('cdoc-filterbar-who');
  if(fbw){
    const whoCounts={tous:DOCUMENTS_CLIENT.length};
    TEAM.forEach(m=>{ if(m.initiales) whoCounts[m.initiales]=DOCUMENTS_CLIENT.filter(d=>d.initiales===m.initiales).length; });
    fbw.innerHTML=`<button class="chip ${cdocWho==='tous'?'active':''}" data-cdwho="tous">Tous <span class="c-count">${DOCUMENTS_CLIENT.length}</span></button>`+
      TEAM.filter(m=>m.initiales).map(m=>`<button class="chip ${cdocWho===m.initiales?'active':''}" data-cdwho="${esc(m.initiales)}" title="${esc(m.name)}">${esc(m.initiales)} <span class="c-count">${whoCounts[m.initiales]||0}</span></button>`).join('');
    fbw.querySelectorAll('.chip[data-cdwho]').forEach(ch=>ch.addEventListener('click',()=>{ cdocWho=ch.dataset.cdwho; renderClientDocs(); }));
  }
  /* Liste filtrée + triée par date décroissante */
  let list=DOCUMENTS_CLIENT.slice();
  if(cdocCat!=='tous') list=list.filter(d=>d.categorie===cdocCat);
  if(cdocWho!=='tous') list=list.filter(d=>d.initiales===cdocWho);
  list.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const grid=document.getElementById('cdoc-grid');
  if(!grid) return;
  if(!list.length){
    grid.innerHTML=`<div class="placeholder" style="grid-column:1/-1">
      <div class="ph-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/></svg></div>
      <h2>Aucun document</h2><p>Aucun document ne correspond à ces filtres.</p></div>`;
    return;
  }
  grid.innerHTML=list.map(renderClientDocCard).join('');
  grid.querySelectorAll('.doc-card[data-cdocid]').forEach(c=>c.addEventListener('click',ev=>{
    if(ev.target.closest('.doc-proton-link')) return;
    openClientDocModal(c.dataset.cdocid);
  }));
}

function renderClientDocCard(d){
  const cat=DOC_CATEGORIES_CLIENT.find(c=>c.key===d.categorie);
  const author=TEAM.find(m=>m.initiales===d.initiales);
  const name=generateClientFileName({date:d.date,sujet:d.sujet,categorie:d.categorie,initiales:d.initiales,version:d.version});
  const ok=isHttpUrl(d.lienProton);
  return `<article class="proj-card doc-card cdoc-card" data-cdocid="${esc(d.id)}">
    <div class="pc-head">
      <div class="pc-top">
        <span class="badge doc-cat-${esc(d.categorie)}">${esc(cat?cat.label:d.categorie)}</span>
        ${author?`<span class="ava-sm cdoc-ava" style="background:${author.color}" title="${esc(author.name)}">${esc(author.initiales)}</span>`:''}
      </div>
      <h3 class="cdoc-name">${esc(name||'(incomplet)')}</h3>
      ${d.resume?`<div class="cdoc-resume">${esc(d.resume)}</div>`:''}
    </div>
    <div class="pc-foot">
      <span>${esc(fmtDate(d.date))}</span>
      ${ok?`<a href="${esc(d.lienProton)}" target="_blank" rel="noopener noreferrer" class="doc-proton-link">Ouvrir sur Proton ↗</a>`:'<span style="color:var(--ink-3)">Pas de lien</span>'}
    </div>
  </article>`;
}

function openClientDocModal(id){
  const isEdit=!!id;
  const todayIso=fmtIso(new Date());
  const d=isEdit?DOCUMENTS_CLIENT.find(x=>x.id===id)
                :{id:null,date:todayIso,sujet:'',projetId:'',categorie:'',initiales:'BL',version:1,lienProton:'',resume:''};
  if(isEdit&&!d) return;
  document.getElementById('cdoc-m-title').textContent=isEdit?'Modifier le document':'Nouveau document';
  document.getElementById('cdoc-m-sub').textContent=isEdit?'Format client — modifier':'Format client — 5 étapes';
  const body=document.getElementById('cdoc-m-body');
  const projOpts='<option value="">— aucun projet lié —</option>'+
    PROJECTS.map(p=>`<option value="${esc(p.id)}"${p.id===(d.projetId||'')?' selected':''}>${esc(p.title)}</option>`).join('');
  const catChips=DOC_CATEGORIES_CLIENT.map(c=>`<button type="button" class="chip ${c.key===d.categorie?'active':''}" data-cdform-cat="${esc(c.key)}">${esc(c.label)}</button>`).join('');
  const whoOpts=TEAM.filter(m=>m.initiales).map(m=>`<option value="${esc(m.initiales)}"${m.initiales===(d.initiales||'')?' selected':''}>${esc(m.name)} (${esc(m.initiales)})</option>`).join('');
  body.innerHTML=`
    <div class="doc-step"><span class="step-num">1</span><div class="doc-step-body">
      <div class="field-label">Informations de base</div>
      <div class="cdoc-grid-2">
        <label class="cdoc-field"><span>Date</span><input id="cdf-date" type="date" value="${esc(d.date||todayIso)}"></label>
        <label class="cdoc-field"><span>Projet lié (optionnel)</span><select id="cdf-proj">${projOpts}</select></label>
      </div>
      <label class="cdoc-field"><span>Sujet <em style="font-weight:400;color:var(--ink-3);font-style:normal;text-transform:none;letter-spacing:0">(majuscules + accents conservés, espaces → _)</em></span><input id="cdf-sujet" placeholder="ex. Filou · Lili Jeanne Printemps · Geant Youtube" value="${esc(d.sujet||'')}"></label>
    </div></div>
    <div class="doc-step"><span class="step-num">2</span><div class="doc-step-body">
      <div class="field-label">Catégorie et responsable</div>
      <div class="filterbar" id="cdf-cats" style="margin-top:2px">${catChips}</div>
      <label class="cdoc-field"><span>Responsable</span><select id="cdf-author">${whoOpts}</select></label>
    </div></div>
    <div class="doc-step"><span class="step-num">3</span><div class="doc-step-body">
      <div class="field-label">Version</div>
      <label class="cdoc-field" style="max-width:160px"><span>Numéro</span><input id="cdf-version" type="number" min="1" step="1" value="${esc(String(d.version||1))}"></label>
    </div></div>
    <div class="doc-step"><span class="step-num">4</span><div class="doc-step-body">
      <div class="field-label">Aperçu du nom final</div>
      <div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap">
        <div class="doc-name-preview empty" id="cdf-name">Le nom apparaîtra ici…</div>
        <button type="button" class="btn sm" id="cdf-copy" disabled>📋 Copier</button>
      </div>
    </div></div>
    <div class="doc-step"><span class="step-num">5</span><div class="doc-step-body">
      <div class="field-label">Lien et résumé</div>
      <label class="cdoc-field"><span>Lien Proton Drive</span><input id="cdf-link" type="url" placeholder="https://drive.proton.me/…" value="${esc(d.lienProton||'')}"></label>
      <label class="cdoc-field"><span>Résumé / description</span><textarea id="cdf-resume" rows="2" placeholder="ex. Filou sur sa trottinette avec un casque rouge">${esc(d.resume||'')}</textarea></label>
    </div></div>
    <div class="doc-modal-foot">
      ${isEdit?`<button type="button" class="btn sm" id="cdf-del" style="color:var(--accent)">Supprimer</button>`:'<span></span>'}
      <div style="display:flex;gap:8px">
        <button type="button" class="btn" id="cdf-cancel">Annuler</button>
        <button type="button" class="btn primary" id="cdf-save" disabled>Enregistrer</button>
      </div>
    </div>`;
  const st={date:d.date||todayIso,sujet:d.sujet||'',projetId:d.projetId||'',categorie:d.categorie||'',initiales:d.initiales||'BL',version:d.version||1,lienProton:d.lienProton||'',resume:d.resume||''};
  const refresh=()=>{
    const name=generateClientFileName(st);
    const prev=document.getElementById('cdf-name');
    const copy=document.getElementById('cdf-copy');
    const save=document.getElementById('cdf-save');
    if(name){ prev.textContent=name; prev.classList.remove('empty'); copy.disabled=false; }
    else { prev.textContent='Le nom apparaîtra ici…'; prev.classList.add('empty'); copy.disabled=true; }
    save.disabled=!(st.date&&st.sujet.trim()&&st.categorie&&st.initiales);
  };
  document.getElementById('cdf-date').addEventListener('change',e=>{ st.date=e.target.value||todayIso; refresh(); });
  document.getElementById('cdf-proj').addEventListener('change',e=>{ st.projetId=e.target.value; });
  document.getElementById('cdf-sujet').addEventListener('input',e=>{ st.sujet=e.target.value; refresh(); });
  document.querySelectorAll('#cdf-cats [data-cdform-cat]').forEach(ch=>ch.addEventListener('click',()=>{
    st.categorie=ch.dataset.cdformCat;
    document.querySelectorAll('#cdf-cats .chip').forEach(c=>c.classList.toggle('active', c.dataset.cdformCat===st.categorie));
    refresh();
  }));
  document.getElementById('cdf-author').addEventListener('change',e=>{ st.initiales=e.target.value; refresh(); });
  document.getElementById('cdf-version').addEventListener('input',e=>{ const n=parseInt(e.target.value,10); st.version=isNaN(n)||n<1?1:n; refresh(); });
  document.getElementById('cdf-link').addEventListener('input',e=>{ st.lienProton=e.target.value.trim(); });
  document.getElementById('cdf-resume').addEventListener('input',e=>{ st.resume=e.target.value; });
  document.getElementById('cdf-copy').addEventListener('click',()=>{
    const name=generateClientFileName(st); if(!name) return;
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(name).then(()=>toast('Nom copié')); }
    else { const ta=document.createElement('textarea'); ta.value=name; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(ta); toast('Nom copié'); }
  });
  document.getElementById('cdf-cancel').addEventListener('click',closeClientDocModal);
  document.getElementById('cdf-save').addEventListener('click',()=>saveClientDocFromForm(id,st));
  if(isEdit){
    document.getElementById('cdf-del').addEventListener('click',async ()=>{
      if(!confirm('Supprimer ce document ?')) return;
      const ok = await deleteCDocInSupabase(id);
      if(!ok) return;
      await loadCDocsFromSupabase();
      closeClientDocModal();
      renderClientDocs();
      toast('Document supprimé');
    });
  }
  refresh();
  document.getElementById('client-doc-overlay').classList.add('open');
  setTimeout(()=>{ const n=document.getElementById('cdf-sujet'); if(n) n.focus(); },50);
}

function closeClientDocModal(){ document.getElementById('client-doc-overlay').classList.remove('open'); }

async function saveClientDocFromForm(id,s){
  if(!s.date||!s.sujet.trim()||!s.categorie||!s.initiales) return;
  const payload = cdocToRow(s);
  const ok = await upsertCDocInSupabase(id, payload);
  if(!ok) return;
  await loadCDocsFromSupabase();
  closeClientDocModal();
  renderClientDocs();
  toast(id?'Document mis à jour':'Document ajouté');
}

function exportClientDocsCSV(){
  /* Format client : séparateur ;, BOM UTF-8, colonnes exactes du tableur */
  const headers=['Nom de fichier','Résumé','Lien final','Sources_Production'];
  const csvEsc=v=>{ const s=String(v??''); return /[";\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; };
  const lines=[headers.join(';')];
  DOCUMENTS_CLIENT.forEach(d=>{
    const name=generateClientFileName({date:d.date,sujet:d.sujet,categorie:d.categorie,initiales:d.initiales,version:d.version});
    lines.push([csvEsc(name),csvEsc(d.resume||''),csvEsc(d.lienProton||''),csvEsc('')].join(';'));
  });
  const blob=new Blob(['﻿'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='documents_lili_'+fmtIso(new Date())+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('Export : '+DOCUMENTS_CLIENT.length+' document'+(DOCUMENTS_CLIENT.length>1?'s':''));
}

/* ===== KANBAN ===== */
/* La clé interne `deposited` est conservée pour compat des tâches déjà
   sauvegardées en localStorage. Seul le libellé affiché a changé. */
const KANBAN_STATUSES=[
  { key:'todo',      label:'À faire',  cls:'k-todo' },
  { key:'doing',     label:'En cours', cls:'k-doing' },
  { key:'done',      label:'Terminé',  cls:'k-done' },
  { key:'deposited', label:'En ligne', cls:'k-deposited' },
  { key:'archived',  label:'Archives', cls:'k-archived' }
];
const LS_DOCS='lili-mallette-docs-v1';
function saveDocs(){ try{ localStorage.setItem(LS_DOCS, JSON.stringify(DOCUMENTS)); }catch(e){} }
function loadDocs(){
  try{
    const raw=localStorage.getItem(LS_DOCS);
    if(!raw) return;
    const arr=JSON.parse(raw);
    if(Array.isArray(arr)){ DOCUMENTS.length=0; arr.forEach(d=>DOCUMENTS.push(d)); }
  }catch(e){}
}

let TASKS=[];
let kProj='tous';
let kCat='tous';
let kWho='tous';
let kStatus='tous';

/* Mapping colonne BD (snake_case) ↔ champ JS (camelCase) */
function taskFromRow(row){
  return {
    id:        row.id,
    title:     row.title,
    category:  row.category,
    projectId: row.project_id || '',
    assignee:  row.assignee || '',
    deadline:  row.deadline || '',
    jalon:     row.jalon || '',
    link:      row.link || '',
    status:    row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function taskToRow(t){
  return {
    title:      (t.title||'').trim(),
    category:   t.category,
    project_id: t.projectId || null,
    assignee:   t.assignee || null,
    deadline:   t.deadline || null,
    jalon:      t.jalon || '',
    link:       t.link || '',
    status:     t.status || 'todo'
  };
}

/* Chargement depuis Supabase — réassigne TASKS en place. */
async function loadTasksFromSupabase(){
  if(!supa){
    console.warn('[Supabase] client absent — les tâches Kanban ne se chargeront pas.');
    return false;
  }
  const { data, error } = await supa
    .from('tasks')
    .select('*')
    .order('deadline', { ascending: true, nullsFirst: false });
  if(error){
    console.error('[Supabase] chargement tasks échec :', error.message);
    toast('Erreur de chargement des tâches — voir la console');
    return false;
  }
  TASKS = data.map(taskFromRow);
  return true;
}

/* Insert ou update partiel selon que `id` est fourni. */
async function upsertTaskInSupabase(id, payload){
  if(!supa){ toast('Supabase indisponible'); return false; }
  const res = id
    ? await supa.from('tasks').update(payload).eq('id', id).select().single()
    : await supa.from('tasks').insert(payload).select().single();
  if(res.error){
    console.error('[Supabase] sauvegarde tasks échec :', res.error.message);
    toast('Erreur de sauvegarde — voir la console');
    return false;
  }
  return true;
}

/* Suppression par id. */
async function deleteTaskInSupabase(id){
  if(!supa){ toast('Supabase indisponible'); return false; }
  const { error } = await supa.from('tasks').delete().eq('id', id);
  if(error){
    console.error('[Supabase] suppression tasks échec :', error.message);
    toast('Erreur de suppression — voir la console');
    return false;
  }
  return true;
}
function renderKanban(){
  const q=topQ();
  /* Panneau de filtres — 3 dropdowns : Projet, Responsable, Catégorie */
  const filters=document.getElementById('k-filters');
  if(filters){
    const projOpts=`<option value="tous">Tous les projets</option>`+
      PROJECTS.map(p=>`<option value="${esc(p.id)}"${p.id===kProj?' selected':''}>${esc(p.title)}</option>`).join('');
    const whoOpts=`<option value="tous">Tous</option>`+
      TEAM.map(m=>`<option value="${esc(m.id)}"${m.id===kWho?' selected':''}>${esc(m.name)}</option>`).join('')+
      `<option value="none"${kWho==='none'?' selected':''}>Non assigné</option>`;
    const catOpts=`<option value="tous">Toutes</option>`+
      LIVRABLES.map(L=>`<option value="${esc(L.key)}"${L.key===kCat?' selected':''}>${esc(L.label)}</option>`).join('');
    const statusOpts=`<option value="tous">Tous</option>`+
      KANBAN_STATUSES.map(s=>`<option value="${esc(s.key)}"${s.key===kStatus?' selected':''}>${esc(s.label)}</option>`).join('');
    filters.innerHTML=`
      <div class="k-filter-field">
        <label class="k-filter-label" for="k-f-proj">Projet</label>
        <select id="k-f-proj">${projOpts}</select>
      </div>
      <div class="k-filter-field">
        <label class="k-filter-label" for="k-f-who">Responsable</label>
        <select id="k-f-who">${whoOpts}</select>
      </div>
      <div class="k-filter-field">
        <label class="k-filter-label" for="k-f-cat">Catégorie</label>
        <select id="k-f-cat">${catOpts}</select>
      </div>
      <div class="k-filter-field">
        <label class="k-filter-label" for="k-f-status">Statut</label>
        <select id="k-f-status">${statusOpts}</select>
      </div>`;
    /* Sélectionne la valeur courante (Firefox parfois ne respecte pas l'attr `selected`) */
    document.getElementById('k-f-proj').value=kProj;
    document.getElementById('k-f-who').value=kWho;
    document.getElementById('k-f-cat').value=kCat;
    document.getElementById('k-f-status').value=kStatus;
    document.getElementById('k-f-proj').addEventListener('change',e=>{ kProj=e.target.value; renderKanban(); });
    document.getElementById('k-f-who').addEventListener('change',e=>{ kWho=e.target.value; renderKanban(); });
    document.getElementById('k-f-cat').addEventListener('change',e=>{ kCat=e.target.value; renderKanban(); });
    document.getElementById('k-f-status').addEventListener('change',e=>{ kStatus=e.target.value; renderKanban(); });
  }
  /* Tâches filtrées (projet + responsable + catégorie + statut + recherche globale) */
  let list=TASKS.slice();
  if(kProj!=='tous') list=list.filter(t=>t.projectId===kProj);
  if(kWho==='none') list=list.filter(t=>!t.assignee);
  else if(kWho!=='tous') list=list.filter(t=>t.assignee===kWho);
  if(kCat!=='tous') list=list.filter(t=>t.category===kCat);
  if(kStatus!=='tous') list=list.filter(t=>t.status===kStatus);
  if(q){
    list=list.filter(t=>{
      const m=t.assignee?memberById(t.assignee):null;
      const L=LIVRABLES.find(x=>x.key===t.category);
      const hay=(t.title||'')+' '+(t.jalon||'')+' '+(L?L.label:'')+' '+(m?m.name:'');
      return hay.toLowerCase().includes(q);
    });
  }
  list.sort((a,b)=>(a.deadline||'').localeCompare(b.deadline||''));
  /* Compteur de tâches (post-filtre) */
  const cntEl=document.getElementById('k-count');
  if(cntEl) cntEl.textContent=list.length+' tâche'+(list.length>1?'s':'');
  /* Colonnes — si un statut est filtré, on n'affiche que la colonne
     correspondante (les autres seraient nécessairement vides). */
  const today=new Date(); today.setHours(0,0,0,0);
  const visibleStatuses=(kStatus==='tous')?KANBAN_STATUSES:KANBAN_STATUSES.filter(s=>s.key===kStatus);
  const kanbanEl=document.getElementById('kanban');
  /* Layout adaptatif : 1 seule colonne quand on filtre, sinon 5 cols */
  kanbanEl.style.gridTemplateColumns = (kStatus==='tous')?'':'1fr';
  kanbanEl.innerHTML=visibleStatuses.map(col=>{
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
    col.addEventListener('drop',async e=>{
      e.preventDefault();
      col.classList.remove('drag-over');
      const id=e.dataTransfer.getData('text/plain');
      const newStatus=col.dataset.status;
      if(!id||!newStatus) return;
      const t=TASKS.find(x=>x.id===id);
      if(!t||t.status===newStatus) return;
      /* Optimistic UI : on bouge la carte immédiatement pour un retour
         visuel instantané, puis on confirme côté Supabase. Si la
         sauvegarde échoue, on rollback et on prévient l'utilisateur. */
      const oldStatus=t.status;
      t.status=newStatus;
      renderKanban();
      const ok=await upsertTaskInSupabase(id,{status:newStatus});
      if(!ok){
        t.status=oldStatus;
        renderKanban();
        return;
      }
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
  if(id){ document.getElementById('tk-del').addEventListener('click',async ()=>{
    if(!confirm('Supprimer cette tâche ?')) return;
    const ok = await deleteTaskInSupabase(id);
    if(!ok) return;
    await loadTasksFromSupabase();
    box.innerHTML='';
    renderKanban();
    toast('Tâche supprimée');
  }); }
  document.getElementById('tk-title').focus();
}
async function saveTaskFromForm(id){
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
  const payload = taskToRow({title,category,projectId,assignee,deadline,jalon,link,status});
  const ok = await upsertTaskInSupabase(id, payload);
  if(!ok) return;
  await loadTasksFromSupabase();
  document.getElementById('task-form').innerHTML='';
  renderKanban();
  toast(id?'Tâche mise à jour':'Tâche créée');
}

/* ===== NAV ===== */
const VIEW_NAMES={dashboard:'Tableau de bord',projets:'Projets',docs:'Documents',kanban:'Tâches',gantt:'Calendrier',equipe:'Équipe'};
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
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape') return;
  if(document.getElementById('client-doc-overlay').classList.contains('open')) closeClientDocModal();
  else if(document.getElementById('doc-overlay').classList.contains('open')) closeDocModal();
  else closeModal();
});

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

/* Migration douce :
   Avant ce changement, chaque document portait son propre lienProton.
   Désormais le lien est un attribut du projet (par catégorie). Pour ne pas
   perdre les vraies URLs Proton déjà saisies, on remonte chaque ancien
   lienProton vers project.folderLinks[categorie] si la place est vide ou
   encore occupée par une URL placeholder de démo (DOSSIER_*). Idempotent. */
function migrateLegacyDocLinks(){
  let changed=false;
  DOCUMENTS.forEach(d=>{
    if(!d.lienProton) return;
    const p=PROJECTS.find(x=>x.id===d.projetId);
    if(!p) return;
    p.folderLinks=p.folderLinks||{};
    const existing=p.folderLinks[d.categorie]||'';
    const isPlaceholder=/DOSSIER_/.test(existing);
    if(!existing||isPlaceholder){
      p.folderLinks[d.categorie]=d.lienProton;
      changed=true;
    }
  });
  if(changed) saveState();
}

/* init */
loadState();
loadDocs();
loadCurrentUser();
migrateLegacyDocLinks();

/* Sidebar foot : affiche l'utilisateur courant + clic ouvre le picker */
renderSidebarFoot();
(function(){
  const foot = document.querySelector('.sb-foot');
  if(!foot) return;
  foot.addEventListener('click', e => {
    /* Ignore le clic sur le bouton de déconnexion (masqué quand
       AUTH_ENABLED=false, mais on protège quand même). */
    if(e.target.closest('.sb-logout')) return;
    showUserPicker();
  });
})();

/* Chargement Supabase en arrière-plan (non bloquant). Chaque module
   re-render la vue concernée si l'utilisateur est déjà dessus. */
loadCDocsFromSupabase().then(ok => {
  if(!ok) return;
  const av = document.querySelector('.nav-item.active');
  if(av && av.dataset.view === 'docs') renderClientDocs();
});
loadTasksFromSupabase().then(ok => {
  if(!ok) return;
  const av = document.querySelector('.nav-item.active');
  if(av && av.dataset.view === 'kanban') renderKanban();
});
/* Projects : charge depuis Supabase (ou seed si table vide), puis
   reconstruit la filterbar et re-render la vue active. */
loadProjectsFromSupabase().then(ok => {
  if(!ok) return;
  buildFilterbar();
  const av = document.querySelector('.nav-item.active');
  const view = av && av.dataset.view;
  if(view === 'dashboard') renderDashboard();
  else if(view === 'projets') renderProjets();
  else if(view === 'gantt') renderGantt();
  /* On met aussi à jour le compteur dans la sidebar */
  const nc = document.getElementById('nav-count-proj');
  if(nc) nc.textContent = PROJECTS.length;
});
/* Équipe : charge depuis Supabase (ou seed si table vide). Si l'user
   est sur la vue Équipe, on re-rend. On rafraîchit aussi la sidebar foot
   (avatar + nom) au cas où le user courant aurait changé d'avatar/role. */
loadTeamFromSupabase().then(ok => {
  if(!ok) return;
  renderSidebarFoot();
  const av = document.querySelector('.nav-item.active');
  if(av && av.dataset.view === 'equipe') renderTeam();
});
(function(){
  const n=document.getElementById('doc-new-btn');
  if(n) n.addEventListener('click',()=>openDocModal(null));
  const c=document.getElementById('doc-csv-btn');
  if(c) c.addEventListener('click',exportDocsCSV);
  /* Nomenclature client — 3e section */
  const cn=document.getElementById('cdoc-new-btn');
  if(cn) cn.addEventListener('click',()=>openClientDocModal(null));
  const cc=document.getElementById('cdoc-csv-btn');
  if(cc) cc.addEventListener('click',exportClientDocsCSV);
  const cb=document.getElementById('cdoc-m-close');
  if(cb) cb.addEventListener('click',closeClientDocModal);
  const ov=document.getElementById('client-doc-overlay');
  if(ov) ov.addEventListener('click',e=>{ if(e.target.id==='client-doc-overlay') closeClientDocModal(); });
})();
(function(){ const b=document.getElementById('invite-btn'); if(b) b.addEventListener('click',showInviteForm); })();
(function(){ const b=document.getElementById('task-new-btn'); if(b) b.addEventListener('click',()=>openTaskForm(null)); })();
buildFilterbar();
renderDashboard();
