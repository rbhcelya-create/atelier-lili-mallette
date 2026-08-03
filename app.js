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
  { id:'line',  name:'Line Durocher',        role:'Fiche pédagogique',             access:'editeur', color:'#8C8270', initiales:'LD', email:'lilisunshine21@hotmail.com' },
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
  /* Re-render la vue active si elle dépend du rôle de l'utilisateur courant
     (Kanban affiche les boutons Valider/Dévalider uniquement aux admins). */
  const av = document.querySelector('.nav-item.active');
  if(av && av.dataset.view === 'kanban') renderKanban();
  else if(av && av.dataset.view === 'equipe') renderTeam();
}

/* ===== AUTH SUPABASE — connexion par lien magique (Étape 1) =====
   Vraie authentification : la personne entre son courriel, reçoit un
   « lien magique » à cliquer, et revient connectée. On mappe son
   courriel → membre d'équipe pour retrouver son nom/rôle.
   Le sélecteur de profil manuel reste dispo en parallèle le temps de
   valider ; il sera retiré à l'étape 2. Aucune clé secrète ici :
   signInWithOtp utilise le service courriel intégré de Supabase. */
let supaSession = null;
function isSupaAuthed(){ return !!(supaSession && supaSession.user); }
/* Courriels secondaires → id de membre. Permet à une personne d'avoir
   plus d'une adresse reconnue (la table team_members n'a qu'une colonne
   email, donc on garde les alias ici, à l'épreuve du rechargement BD). */
const ALT_EMAILS = {
  'bruno.lefebvre@lilimallette.education': 'bruno'
};
function memberByEmail(email){
  if(!email) return null;
  const e = String(email).trim().toLowerCase();
  const byMain = TEAM.find(m => (m.email||'').trim().toLowerCase() === e);
  if(byMain) return byMain;
  const altId = ALT_EMAILS[e];
  if(altId){ const m = TEAM.find(x => x.id === altId); if(m) return m; }
  return null;
}
/* Applique une session Supabase : bascule le profil courant sur le
   membre correspondant à l'email connecté, puis rafraîchit l'UI. */
let teamLoaded = false; /* passe à true quand l'équipe est chargée depuis Supabase */
function applySupaSession(session){
  supaSession = session || null;
  reconcileSession();
  renderSidebarFoot();
  const p = document.getElementById('user-picker');
  if(p) renderPickerAuth();
}
/* Rattache la session connectée à un membre d'équipe. Si le courriel ne
   correspond à aucun membre ET que l'équipe est déjà chargée, c'est un
   courriel inconnu → on déconnecte (pas d'usurpation d'un profil admin). */
function reconcileSession(){
  if(!isSupaAuthed()) return;
  const m = memberByEmail(supaSession.user.email);
  if(m){
    setCurrentUser(m.id);
    if(m.pending) acceptPendingInvite(m);
    return;
  }
  if(teamLoaded){
    const mail = supaSession.user.email;
    toast('Le courriel '+mail+' n’est rattaché à aucun membre. Demande une invitation à un admin.');
    signOutSupa();
  }
}
/* Quand une personne invitée se connecte pour la première fois (clic sur
   son lien magique), elle accepte l'invitation : on retire le statut
   « en attente » → elle devient membre confirmé. */
async function acceptPendingInvite(member){
  if(!member || !member.pending) return;
  member.pending = false;
  const ok = await upsertTeamMemberInSupabase(member);
  renderSidebarFoot();
  const av = document.querySelector('.nav-item.active');
  if(av && av.dataset.view === 'equipe') renderTeam();
  if(ok) toast('Bienvenue dans l’équipe, '+member.name+' !');
}
/* Envoie le lien magique. Réservé aux courriels déjà dans l'équipe
   (gated par memberByEmail — pas d'inscription sauvage). shouldCreateUser:true
   pour qu'un membre reconnu qui n'a jamais eu de compte puisse créer son
   accès au premier clic, sans invitation séparée. */
async function startMagicLink(email){
  if(!supa){ toast('Supabase indisponible'); return; }
  const e = String(email||'').trim().toLowerCase();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)){ toast('Adresse courriel invalide'); return; }
  if(!memberByEmail(e)){ toast('Ce courriel n’est pas reconnu dans l’équipe'); return; }
  const redirect = window.location.origin + window.location.pathname;
  const { error } = await supa.auth.signInWithOtp({
    email: e,
    options: { shouldCreateUser:true, emailRedirectTo: redirect }
  });
  if(error){
    console.error('[Supabase] signInWithOtp échec :', error.message);
    toast('Échec de l’envoi : '+error.message);
    return;
  }
  toast('Lien de connexion envoyé à '+e+' — vérifie ta boîte courriel');
}
async function signOutSupa(){
  if(!supa) return;
  await supa.auth.signOut();
  supaSession = null;
  renderSidebarFoot();
  const p = document.getElementById('user-picker');
  if(p) renderPickerAuth();
  toast('Déconnecté de la connexion par courriel');
}
/* Remplit la zone auth du picker selon l'état de connexion. */
function renderPickerAuth(){
  const box = document.getElementById('up-auth');
  if(!box) return;
  if(isSupaAuthed()){
    box.innerHTML =
      `<div class="up-auth-state">🔒 Connecté par courriel<br><b>${esc(supaSession.user.email)}</b></div>`+
      `<button class="up-auth-btn" id="up-signout">Se déconnecter</button>`;
    const b=document.getElementById('up-signout');
    if(b) b.addEventListener('click', async e=>{ e.stopPropagation(); await signOutSupa(); });
  } else {
    box.innerHTML =
      `<button class="up-auth-btn primary" id="up-magic">Se connecter par courriel</button>`+
      `<form class="up-auth-form" id="up-form" style="display:none">`+
        `<input id="up-email" type="email" placeholder="ton adresse courriel" autocomplete="email">`+
        `<button type="submit" class="up-auth-btn primary">Envoyer le lien</button>`+
      `</form>`+
      `<div class="up-auth-note">Vraie connexion : tu reçois un lien à cliquer dans ton courriel. Le sélecteur ci-dessus reste dispo en attendant.</div>`;
    const mb=document.getElementById('up-magic');
    if(mb) mb.addEventListener('click', e=>{
      e.stopPropagation();
      document.getElementById('up-form').style.display='flex';
      mb.style.display='none';
      document.getElementById('up-email').focus();
    });
    const f=document.getElementById('up-form');
    if(f) f.addEventListener('submit', e=>{
      e.preventDefault(); e.stopPropagation();
      startMagicLink(document.getElementById('up-email').value);
    });
  }
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
  { key:'balado',    label:'Balados',             folders:['Vidéo','Texte','Image','Audio'] },
  { key:'video',     label:'Vidéos',              folders:['Vidéo','Texte','Image','Audio'] },
  { key:'spectacle', label:'Spectacles',          folders:['Vidéo','Texte','Image','Audio'] },
  { key:'fiche',     label:'Fiches pédagogiques', folders:['Vidéo','Texte','Image','Audio'] },
  { key:'comm',      label:'Communication',       folders:['Vidéo','Texte','Image','Audio'] }
];
const LIV_SVG={
  balado: DELIV_TYPES.balado.svg,
  video: DELIV_TYPES.video.svg,
  spectacle: DELIV_TYPES.spectacle.svg,
  fiche: '<path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/>',
  comm: '<path d="M4 9v6h3l6 4V5L7 9H4z"/><path d="M17 9a4 4 0 0 1 0 6"/><path d="M20 7a8 8 0 0 1 0 10"/>'
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
/* Lien Proton d'un document. Il est désormais PROPRE À CHAQUE document
   (d.lienProton). On ne retombe sur l'ancien lien partagé projet+catégorie
   (project.folderLinks[categorie]) que pour les anciens documents qui n'ont
   pas encore leur propre lien (compat), puis sur ''. */
function docFolderLink(d){
  if(!d) return '';
  if(d.lienProton) return d.lienProton;
  const p=PROJECTS.find(x=>x.id===d.projetId);
  if(p&&p.folderLinks&&p.folderLinks[d.categorie]) return p.folderLinks[d.categorie];
  return '';
}
function setProjectFolderLink(projetId, categorie, url){
  const p=PROJECTS.find(x=>x.id===projetId);
  if(!p||!categorie) return false;
  p.folderLinks=p.folderLinks||{};
  p.folderLinks[categorie]=url||'';
  saveState();
  return true;
}
/* Clé réservée dans p.docs[livrable] : identifiants des documents de
   DOCUMENTS_CLIENT rattachés À LA MAIN à ce livrable. Elle vit dans la colonne
   `docs` (déjà persistée en BD et en localStorage) — aucune migration. Les
   compteurs de liens Proton doivent donc l'ignorer. */
const RATT_KEY='__rattaches';
function livDocs(p,lk){ p.docs=p.docs||{}; if(!p.docs[lk]) p.docs[lk]={}; return p.docs[lk]; }
function folderLinks(p,lk,fname){ if(fname===RATT_KEY) return []; const d=(p.docs&&p.docs[lk])||{}; return d[fname]||[]; }
function livLinkCount(p,lk){
  const d=(p.docs&&p.docs[lk])||{};
  return Object.keys(d).reduce((a,k)=>k===RATT_KEY?a:a+((d[k]&&d[k].length)||0),0);
}
function totalLinks(p){
  let n=0;
  Object.values(p.docs||{}).forEach(f=>Object.keys(f||{}).forEach(k=>{ if(k!==RATT_KEY) n+=(f[k]&&f[k].length)||0; }));
  return n;
}
/* Documents rattachés à un livrable, dans l'ordre de rattachement, purgés des
   identifiants devenus introuvables (document supprimé ailleurs). */
function livAttachedIds(p,lk){
  const arr=(p.docs&&p.docs[lk]&&p.docs[lk][RATT_KEY])||[];
  return Array.isArray(arr)?arr:[];
}
function livAttachedDocs(p,lk){
  return livAttachedIds(p,lk).map(id=>DOCUMENTS_CLIENT.find(d=>d.id===id)).filter(Boolean);
}
function setLivAttached(p,lk,ids){
  const d=livDocs(p,lk);
  if(ids.length) d[RATT_KEY]=ids; else delete d[RATT_KEY];
  saveState();
}
function fmtIso(d){
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return d.getFullYear()+'-'+m+'-'+day;
}
function frac2date(frac){
  const NM=GMONTHS.length, Y=GWIN_Y, M0=GWIN_M0;
  if(frac==null||isNaN(frac)) return new Date(Y,M0,1);
  const f=Math.max(0,Math.min(NM,frac));
  const mi=Math.min(NM-1,Math.floor(f));
  const dim=GMONTHS[mi].days;
  const day=Math.max(1,Math.min(dim,Math.round((f-Math.floor(f))*dim)+1));
  return new Date(Y,M0+mi,day);
}
/* Les fractions historiques gStart/gEnd ont été saisies dans l'ancien
   repère fixe (mai 2026 = 0). On les interprète toujours dans ce repère,
   indépendamment de la fenêtre d'affichage glissante. */
function legacyFracToDate(frac){
  const Y=2026, M0=4; /* mai 2026 */
  if(frac==null||isNaN(frac)) return new Date(Y,M0,1);
  const f=Math.max(0,frac);
  const mi=Math.floor(f);
  const dim=new Date(Y,M0+mi+1,0).getDate();
  const day=Math.max(1,Math.min(dim,Math.round((f-mi)*dim)+1));
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
  const NM=GMONTHS.length, Y=GWIN_Y, M0=GWIN_M0;
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
    /* GARDE-FOU : si on est connecté (session Supabase) et qu'on lit 0
       projet, c'est presque sûrement les règles RLS qui masquent les
       lignes, PAS une table réellement vide. On NE re-seed PAS (sinon on
       risquerait d'écraser les vrais projets) et on garde les données
       locales déjà chargées. */
    const { data: _sess } = await supa.auth.getSession();
    if(_sess && _sess.session){
      console.warn('[Supabase] 0 projet en session connectée → RLS probable. Pas de re-seed (données locales conservées).');
      toast('Accès aux projets refusé pour ce compte — règles RLS à ajuster');
      return false;
    }
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
/* Fenêtre glissante : 12 mois à partir du mois courant (recalculée à
   chaque chargement de page). */
const _gnow=new Date();
const GWIN_Y=_gnow.getFullYear();
const GWIN_M0=_gnow.getMonth();
const GMONTHS=(function(){
  const ML=['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'];
  const arr=[];
  for(let i=0;i<12;i++){
    const d=new Date(GWIN_Y,GWIN_M0+i,1);
    const y=d.getFullYear(), m=d.getMonth();
    const days=new Date(y,m+1,0).getDate(); /* nb de jours du mois (gère les années bissextiles) */
    arr.push({label:ML[m]+' '+y, days});
  }
  return arr;
})();
function renderGantt(){
  const NM=GMONTHS.length, Y=GWIN_Y, M0=GWIN_M0; /* fenêtre glissante : mois courant */
  const ganttAdmin=getCurrentUser().access==='admin'; /* seul l'admin déplace les barres */
  const today=new Date(); today.setHours(0,0,0,0);
  const tMi=(today.getFullYear()-Y)*12+(today.getMonth()-M0);
  const todIn = tMi>=0 && tMi<NM;
  const todPct = todIn ? ((tMi + (today.getDate()-0.5)/GMONTHS[tMi].days)/NM)*100 : 0;

  const monthsH=GMONTHS.map(m=>`<div class="gm">${m.label}</div>`).join('');
  const daysH=GMONTHS.map((m,mi)=>{
    let cells='';
    for(let d=1;d<=m.days;d++){
      const tod = todIn && mi===tMi && d===today.getDate();
      /* Sur 12 mois, afficher chaque jour rend les numéros illisibles.
         On n'étiquette qu'un repère tous les 5 jours (1, 5, 10, …), en plus
         gros, tout en gardant une cellule (ligne de grille) pour chaque jour. */
      const show = d===1 || d%5===0;
      cells+=`<div class="gd${tod?' tod':''}${show?' gd-lbl':''}">${show?d:''}</div>`;
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
      const startIso=ld.start||p.dateStart||fmtIso(legacyFracToDate(p.gStart));
      const endIso=ld.end||p.dateEnd||fmtIso(legacyFracToDate(p.gEnd));
      const fs=date2frac(startIso);
      const fe=date2frac(_addDay(endIso));
      const left=(fs/NM)*100;
      const width=Math.max(((fe-fs)/NM)*100,5);
      h+=`<div class="g-row g-row-sub" data-pid="${esc(p.id)}" data-lk="${esc(L.key)}">
        <div class="gr-l gr-l-sub"></div>
        <div class="g-track">
          ${GMONTHS.map(()=>`<div class="gcell"></div>`).join('')}
          ${todIn?`<div class="g-today" style="left:${todPct}%"></div>`:''}
          <div class="g-bar${ganttAdmin?'':' g-bar-locked'}" data-pid="${esc(p.id)}" data-lk="${esc(L.key)}" style="left:${left}%;width:${width}%">
            ${ganttAdmin?'<span class="gb-resize gb-resize-l"></span>':''}
            <span class="gb-lbl">${esc(L.label)}</span>
            ${ganttAdmin?'<span class="gb-resize gb-resize-r"></span>':''}
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
    <div class="user-picker-auth" id="up-auth"></div>
    <div class="user-picker-foot">Ton choix sera mémorisé sur ce navigateur. Tes commentaires seront attribués au membre sélectionné.</div>
  `;
  document.body.appendChild(picker);
  renderPickerAuth();
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
  const isAdmin=getCurrentUser().access==='admin';
  const invBtn=document.getElementById('invite-btn');
  if(invBtn) invBtn.style.display=isAdmin?'':'none';
  if(!isAdmin){ const f=document.getElementById('invite-form'); if(f) f.innerHTML=''; }
  const list=q?TEAM.filter(m=>(m.name+' '+m.role+' '+(m.email||'')).toLowerCase().includes(q)):TEAM;
  document.getElementById('team-grid').innerHTML = list.map(m=>`
    <div class="member">
      ${(isAdmin && m.id!==currentUserId)?`<button class="m-del" data-del-member="${esc(m.id)}" data-del-name="${esc(m.name)}" data-del-pending="${m.pending?'1':'0'}" title="${m.pending?'Retirer l\'invitation':'Retirer ce membre'}">&times;</button>`:''}
      <div class="m-ava" style="background:${m.color}">${initials(m.name)}</div>
      <div>
        <div class="m-name">${esc(m.name)}</div>
        <div class="m-role">${esc(m.role)}</div>
        <span class="m-tag ${m.access}">${m.access==='admin'?'Administrateur':'Éditeur'}</span>
        ${m.pending?'<span class="m-tag pending">Invitation en attente</span>':''}
      </div>
    </div>`).join('');
  document.querySelectorAll('#team-grid [data-del-member]').forEach(b=>b.addEventListener('click',async ()=>{
    if(getCurrentUser().access!=='admin'){ toast('Seul un administrateur peut retirer un membre'); return; }
    const id = b.dataset.delMember;
    const nm = b.dataset.delName || 'ce membre';
    const isPending = b.dataset.delPending==='1';
    const msg = isPending
      ? 'Retirer l\'invitation de '+nm+' ?'
      : 'Retirer '+nm+' de l\'équipe ? La personne perdra l\'accès à sa prochaine connexion.';
    if(!confirm(msg)) return;
    const ok = await deleteTeamMemberFromSupabase(id);
    if(!ok) return;
    await loadTeamFromSupabase();
    renderTeam();
    toast(isPending ? 'Invitation retirée' : nm+' retiré·e de l\'équipe');
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
    /* Même garde-fou que pour les projets : 0 membre en session connectée
       = RLS qui masque, pas une table vide → on ne re-seed pas. */
    const { data: _sess } = await supa.auth.getSession();
    if(_sess && _sess.session){
      console.warn('[Supabase] 0 membre en session connectée → RLS probable. Pas de re-seed.');
      return false;
    }
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
  if(getCurrentUser().access!=='admin'){ toast('Seul un administrateur peut inviter un membre'); return; }
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
      <div class="invite-note">La personne reçoit un courriel avec un lien d'accès. En cliquant, elle entre dans L'Atelier avec le rôle choisi.</div>
    </div>`;
  document.getElementById('inv-send').addEventListener('click',sendInvite);
  document.getElementById('inv-cancel').addEventListener('click',()=>{ box.innerHTML=''; });
  document.getElementById('inv-name').focus();
}
async function sendInvite(){
  if(getCurrentUser().access!=='admin'){ toast('Seul un administrateur peut inviter un membre'); return; }
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
  /* Envoi du vrai courriel d'invitation : un lien magique qui crée le
     compte de la personne au premier clic (shouldCreateUser:true). */
  const redirect = window.location.origin + window.location.pathname;
  const { error } = await supa.auth.signInWithOtp({
    email,
    options: { shouldCreateUser:true, emailRedirectTo: redirect }
  });
  if(error){
    console.error('[Supabase] invitation signInWithOtp échec :', error.message);
    toast('Membre ajouté, mais l’envoi du courriel a échoué : '+error.message);
    return;
  }
  toast('Invitation envoyée à '+email);
}

/* ===== PROJECT MODAL ===== */
let currentId=null;
let modalQuery='';
let currentLivrable=null;
let currentDocFolder=null;
let livPicker=false;      /* écran de sélection « rattacher des documents » */
let livPickerQuery='';
let docsPicker=false;     /* écran « lier un document existant » (onglet Documents) */
let docsPickerQuery='';
let modalTab='livr';   /* onglet de la modale projet : 'livr' | 'docs' */
const mqHit = txt => !modalQuery || String(txt||'').toLowerCase().includes(modalQuery);

/* ===== NEW PROJECT MODAL — création d'un nouveau projet ===== */
function openNewProjectModal(){
  const body=document.getElementById('newproj-body');
  if(!body) return;
  /* Réinitialise le titre du modal (réutilisé par le mode édition) */
  const tEl=document.getElementById('newproj-title'); if(tEl) tEl.textContent='Nouveau projet';
  const sEl=document.getElementById('newproj-sub'); if(sEl) sEl.textContent='Crée un projet pour ton équipe';
  const today=fmtIso(new Date());
  body.innerHTML=`
    <label class="cdoc-field"><span>Titre du projet</span>
      <input id="np-title" placeholder="ex. Filou et le grand voyage">
    </label>
    <label class="cdoc-field" style="margin-top:11px"><span>Code projet <em style="font-weight:400;color:var(--ink-3);font-style:normal;text-transform:none;letter-spacing:0">(auto-rempli, modifiable)</em></span>
      <input id="np-filecode" placeholder="auto-rempli depuis le titre">
    </label>
    <div class="cdoc-grid-2" style="margin-top:11px">
      <label class="cdoc-field"><span>Style</span>
        <select id="np-style">
          <option value="apaisant">Histoires apaisantes</option>
          <option value="contes">Contes du monde</option>
          <option value="rigolo" selected>Aventures rigolotes</option>
        </select>
      </label>
      <label class="cdoc-field"><span>Statut initial</span>
        <select id="np-status">
          <option value="idee" selected>Idée</option>
          <option value="prod">En production</option>
          <option value="livr">Livrables</option>
          <option value="publie">Publié</option>
        </select>
      </label>
    </div>
    <div class="cdoc-grid-2" style="margin-top:11px">
      <label class="cdoc-field"><span>Date de début</span>
        <input id="np-datestart" type="date" value="${esc(today)}">
      </label>
      <label class="cdoc-field"><span>Échéance</span>
        <input id="np-deadline" type="date">
      </label>
    </div>
    <div class="doc-modal-foot" style="margin-top:18px">
      <span></span>
      <div style="display:flex;gap:8px">
        <button type="button" class="btn" id="np-cancel">Annuler</button>
        <button type="button" class="btn primary" id="np-save" disabled>Créer le projet</button>
      </div>
    </div>`;
  const title=document.getElementById('np-title');
  const filecode=document.getElementById('np-filecode');
  const save=document.getElementById('np-save');
  /* Auto-remplissage du code projet à partir du titre */
  let userEditedFilecode=false;
  const autoFilecode=()=>{
    if(userEditedFilecode) return;
    const t=title.value.trim();
    if(!t){ filecode.value=''; return; }
    const slug=t.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
    filecode.value=`${today}_${slug}`;
  };
  title.addEventListener('input',()=>{
    autoFilecode();
    save.disabled=!title.value.trim();
  });
  filecode.addEventListener('input',()=>{ userEditedFilecode=true; });
  document.getElementById('np-cancel').addEventListener('click',closeNewProjectModal);
  document.getElementById('np-save').addEventListener('click',saveNewProject);
  document.getElementById('newproj-overlay').classList.add('open');
  setTimeout(()=>title.focus(),50);
}
function closeNewProjectModal(){
  document.getElementById('newproj-overlay').classList.remove('open');
}
async function saveNewProject(){
  const title=document.getElementById('np-title').value.trim();
  if(!title){ toast('Donne un titre au projet'); return; }
  const fileCode=document.getElementById('np-filecode').value.trim() || `${fmtIso(new Date())}_${title.replace(/\s+/g,'_')}`;
  const style=document.getElementById('np-style').value;
  const status=document.getElementById('np-status').value;
  const dateStart=document.getElementById('np-datestart').value || undefined;
  const deadline=document.getElementById('np-deadline').value || undefined;
  /* Génère un ID unique préfixé p_ (les hardcodés sont p1-p7) */
  const id='p_'+Date.now();
  const newProj={
    id, title, fileCode, style, status,
    gStart:0, gEnd:1,
    dateStart, deadline,
    folderLinks:{ images:'', video:'', texte:'', audio:'' },
    stages:{ texte:'todo', miseforme:'todo', fiche:'todo', images:'todo', balado:'todo', video:'todo', spectacle:'todo', site:'todo', distrib:'todo' },
    deliverables:[],
    livDates:{},
    comments:[],
    docs:{},
    tasks:[],
    resources:[]
  };
  PROJECTS.push(newProj);
  /* Push vers Supabase + retour visuel immédiat */
  const ok = await saveProjectsToSupabase();
  if(!ok){
    /* Rollback si Supabase échoue */
    const i=PROJECTS.findIndex(p=>p.id===id);
    if(i>=0) PROJECTS.splice(i,1);
    return;
  }
  closeNewProjectModal();
  buildFilterbar();
  renderDashboard();
  renderProjets();
  renderGantt();
  const navCount=document.getElementById('nav-count-proj');
  if(navCount) navCount.textContent=PROJECTS.length;
  toast('Projet créé : '+title);
}

/* ===== MODIFIER / SUPPRIMER UN PROJET — réservé aux admins =====
   Réutilise le modal "newproj-overlay" en mode édition. Le sélecteur
   "qui suis-je" (getCurrentUser) détermine le rôle ; les boutons ne
   s'affichent qu'aux admins ET les fonctions revérifient le rôle
   (défense en profondeur, même si tout est côté client). */
function openEditProjectModal(id){
  if(getCurrentUser().access!=='admin'){ toast('Seul un administrateur peut modifier un projet'); return; }
  const p=PROJECTS.find(x=>x.id===id);
  if(!p){ return; }
  const body=document.getElementById('newproj-body');
  if(!body) return;
  const tEl=document.getElementById('newproj-title'); if(tEl) tEl.textContent='Modifier le projet';
  const sEl=document.getElementById('newproj-sub'); if(sEl) sEl.textContent='Mets à jour les informations du projet';
  const styleOpts=STYLES.map(s=>`<option value="${esc(s.id)}"${s.id===p.style?' selected':''}>${esc(s.name)}</option>`).join('');
  const statusOpts=Object.keys(STATUS).map(k=>`<option value="${esc(k)}"${k===p.status?' selected':''}>${esc(STATUS[k].label)}</option>`).join('');
  body.innerHTML=`
    <label class="cdoc-field"><span>Titre du projet</span>
      <input id="np-title" value="${esc(p.title)}">
    </label>
    <label class="cdoc-field" style="margin-top:11px"><span>Code projet</span>
      <input id="np-filecode" value="${esc(p.fileCode||'')}">
    </label>
    <div class="cdoc-grid-2" style="margin-top:11px">
      <label class="cdoc-field"><span>Style</span>
        <select id="np-style">${styleOpts}</select>
      </label>
      <label class="cdoc-field"><span>Statut</span>
        <select id="np-status">${statusOpts}</select>
      </label>
    </div>
    <div class="cdoc-grid-2" style="margin-top:11px">
      <label class="cdoc-field"><span>Date de début</span>
        <input id="np-datestart" type="date" value="${esc(p.dateStart||'')}">
      </label>
      <label class="cdoc-field"><span>Échéance</span>
        <input id="np-deadline" type="date" value="${esc(p.deadline||'')}">
      </label>
    </div>
    <div class="doc-modal-foot" style="margin-top:18px">
      <button type="button" class="btn sm" id="np-delete" style="color:var(--accent)">Supprimer le projet</button>
      <div style="display:flex;gap:8px">
        <button type="button" class="btn" id="np-cancel">Annuler</button>
        <button type="button" class="btn primary" id="np-save">Enregistrer</button>
      </div>
    </div>`;
  const title=document.getElementById('np-title');
  const save=document.getElementById('np-save');
  title.addEventListener('input',()=>{ save.disabled=!title.value.trim(); });
  document.getElementById('np-cancel').addEventListener('click',closeNewProjectModal);
  document.getElementById('np-save').addEventListener('click',()=>saveEditedProject(id));
  document.getElementById('np-delete').addEventListener('click',()=>deleteProject(id));
  document.getElementById('newproj-overlay').classList.add('open');
  setTimeout(()=>title.focus(),50);
}
async function saveEditedProject(id){
  if(getCurrentUser().access!=='admin'){ toast('Seul un administrateur peut modifier un projet'); return; }
  const p=PROJECTS.find(x=>x.id===id);
  if(!p) return;
  const title=document.getElementById('np-title').value.trim();
  if(!title){ toast('Donne un titre au projet'); return; }
  /* Snapshot pour rollback si Supabase échoue */
  const prev={ title:p.title, fileCode:p.fileCode, style:p.style, status:p.status, dateStart:p.dateStart, deadline:p.deadline };
  p.title    = title;
  p.fileCode = document.getElementById('np-filecode').value.trim() || p.fileCode;
  p.style    = document.getElementById('np-style').value;
  p.status   = document.getElementById('np-status').value;
  p.dateStart= document.getElementById('np-datestart').value || undefined;
  p.deadline = document.getElementById('np-deadline').value || undefined;
  const ok=await saveProjectsToSupabase();
  if(!ok){ Object.assign(p,prev); return; }
  closeNewProjectModal();
  buildFilterbar(); renderDashboard(); renderProjets(); renderGantt();
  toast('Projet mis à jour');
}
async function deleteProject(id){
  if(getCurrentUser().access!=='admin'){ toast('Seul un administrateur peut supprimer un projet'); return; }
  const p=PROJECTS.find(x=>x.id===id);
  if(!p) return;
  if(!confirm('Supprimer définitivement le projet « '+p.title+' » ? Cette action est irréversible.')) return;
  if(!supa){ toast('Connexion à la base requise pour supprimer'); return; }
  const { error } = await supa.from('projects').delete().eq('id', id);
  if(error){
    console.error('[Supabase] suppression projet échec :', error.message);
    toast('Erreur de suppression — voir la console');
    return;
  }
  const i=PROJECTS.findIndex(x=>x.id===id);
  if(i>=0) PROJECTS.splice(i,1);
  closeNewProjectModal();
  closeModal();
  buildFilterbar(); renderDashboard(); renderProjets(); renderGantt();
  const navCount=document.getElementById('nav-count-proj');
  if(navCount) navCount.textContent=PROJECTS.length;
  toast('Projet supprimé');
}

function openProject(id, source, initLiv){
  const p=PROJECTS.find(x=>x.id===id);
  if(!p) return;
  currentId=id;
  const st=styleById(p.style);
  document.getElementById('m-style').innerHTML=`<span class="dot" style="background:${st.color}"></span>${esc(st.name)}`;
  document.getElementById('m-title').textContent=p.title;
  document.getElementById('m-file').textContent=`${p.fileCode} · ${STATUS[p.status].label}`;

  /* bouton Modifier (admins seulement) */
  const isAdmin=getCurrentUser().access==='admin';
  const editBtn=document.getElementById('m-edit');
  if(editBtn){
    if(isAdmin){
      editBtn.style.display='';
      editBtn.onclick=()=>{ closeModal(); openEditProjectModal(id); };
    } else {
      editBtn.style.display='none';
      editBtn.onclick=null;
    }
  }

  /* période (dates éditables — admins seulement) */
  const md=document.getElementById('m-dates');
  if(md){
    const ds=p.dateStart||fmtIso(legacyFracToDate(p.gStart));
    const de=p.dateEnd||fmtIso(legacyFracToDate(p.gEnd));
    const dl=p.deadline||'';
    const dis=isAdmin?'':' disabled';
    md.innerHTML=`
      <label class="md-field">Début <input type="date" id="md-start" value="${esc(ds)}"${dis}></label>
      <label class="md-field">Fin <input type="date" id="md-end" value="${esc(de)}"${dis}></label>
      <label class="md-field">Échéance <input type="date" id="md-deadline" value="${esc(dl)}"${dis}></label>`;
    if(isAdmin){
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
  }

  /* recherche locale + panneaux */
  /* Onglet d'accueil = Documents : les dossiers de liens des livrables sont
     quasi tous vides (4 remplis sur 500), on ouvrait donc sur un écran vide.
     Exception : arrivée depuis le Calendrier sur un livrable précis. */
  modalQuery=''; currentLivrable=initLiv||null; currentDocFolder=null;
  livPicker=false; livPickerQuery=''; docsPicker=false; docsPickerQuery='';
  modalTab=initLiv?'livr':'docs';
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
/* ===== Onglet « Documents » de la modale projet =====
   Le lien projet↔document se fait par la DONNÉE (d.projetId), jamais à la main :
   tout document de DOCUMENTS_CLIENT rattaché au projet apparaît ici. */
function projectDocs(p){
  return DOCUMENTS_CLIENT.filter(d=>d.projetId===p.id)
    .slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
}
function modalTabsHtml(p){
  const n=projectDocs(p).length;
  return `<div class="mtabs">
    <button type="button" class="mtab${modalTab==='livr'?' active':''}" data-mtab="livr">Livrables</button>
    <button type="button" class="mtab${modalTab==='docs'?' active':''}" data-mtab="docs">Documents<span class="mtab-c">${n}</span></button>
  </div>`;
}
function wireModalTabs(scope,p){
  scope.querySelectorAll('[data-mtab]').forEach(b=>b.addEventListener('click',()=>{
    if(modalTab===b.dataset.mtab) return;
    modalTab=b.dataset.mtab;
    renderModalMain(p);
  }));
}
function projectDocRow(d,actionHtml,metaExtra){
  const cat=DOC_CATEGORIES_CLIENT.find(c=>c.key===d.categorie);
  const author=TEAM.find(m=>m.initiales===d.initiales);
  const name=generateClientFileName({date:d.date,sujet:d.sujet,categorie:d.categorie,initiales:d.initiales,version:d.version});
  const url=docFolderLink(d);
  const ok=isHttpUrl(url);
  return `<div class="pdoc" data-pdocid="${esc(d.id)}">
    <div class="pdoc-main">
      <div class="pdoc-n">${esc(name||'(nom incomplet)')}</div>
      <div class="pdoc-meta">
        <span class="badge doc-cat-${esc(d.categorie)}">${esc(cat?cat.label:d.categorie)}</span>
        ${author
          ? `<span class="ava-sm" style="background:${author.color}" title="${esc(author.name)}">${esc(author.initiales)}</span>`
          : `<span class="ava-sm" style="background:var(--ink-3)" title="Responsable inconnu">${esc(d.initiales||'?')}</span>`}
        <span class="pdoc-date">${esc(fmtDate(d.date))}</span>
        ${metaExtra||''}
      </div>
      ${d.resume?`<div class="pdoc-resume">${esc(d.resume)}</div>`:''}
    </div>
    ${ok
      ? `<a class="btn sm pdoc-open" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Ouvrir sur Proton ↗</a>`
      : `<span class="pdoc-nolink">Aucun lien</span>`}
    ${actionHtml||''}
  </div>`;
}
/* Les quatre dossiers d'un livrable portent le nom des quatre catégories de
   documents : le contenu se DÉDUIT donc de la donnée, sans rien ressaisir.
   Un document créé dans le projet apparaît tout de suite dans le bon dossier. */
const FOLDER_CAT={'Image':'images','Images':'images','Vidéo':'video','Texte':'texte','Audio':'audio'};
function folderDocs(p,fname){
  const c=FOLDER_CAT[fname];
  return c?projectDocs(p).filter(d=>d.categorie===c):[];
}
function nDoc(n){ return n+' document'+(n>1?'s':''); }
function nLien(n){ return n+' lien'+(n>1?'s':''); }
/* Tant qu'un projet porte les cinq livrables, ses documents se retrouvent dans
   les dossiers de chacun : on précise « du projet » pour que le compte ne se
   lise pas comme un contenu propre au livrable. */
function livMeta(p,lk){
  const nl=livLinkCount(p,lk), nd=projectDocs(p).length;
  return nDoc(nd)+' du projet'+(nl?' · '+nLien(nl):'');
}
function folderMeta(p,lk,fname){
  const nl=folderLinks(p,lk,fname).length, nd=folderDocs(p,fname).length;
  return nl?nDoc(nd)+' · '+nLien(nl):nDoc(nd);
}
function docHay(d){
  const cat=DOC_CATEGORIES_CLIENT.find(c=>c.key===d.categorie);
  return [generateClientFileName({date:d.date,sujet:d.sujet,categorie:d.categorie,initiales:d.initiales,version:d.version}),
          d.sujet,cat?cat.label:d.categorie,d.initiales,d.date,d.resume].join(' ').toLowerCase();
}
/* Écran de rattachement : on choisit À LA MAIN, parmi les documents DU PROJET,
   ceux qui appartiennent à ce livrable. Chaque clic écrit tout de suite ; on ne
   redessine que la ligne touchée pour ne pas perdre la position de lecture. */
function renderLivPicker(panel,p,L){
  const all=projectDocs(p);
  panel.innerHTML=modalTabsHtml(p)+`
    <button class="btn sm" id="m-back" style="margin-bottom:14px">← ${esc(L.label)}</button>
    <div class="modal-section-title">Épingler des documents à « ${esc(L.label)} »</div>
    <p style="font-size:13px;color:var(--ink-3);margin-bottom:12px">Documents du projet. Cliquez pour épingler ou retirer — l'enregistrement est immédiat.</p>
    <input id="lp-q" class="lp-q" placeholder="Filtrer par nom, sujet, catégorie…" value="${esc(livPickerQuery)}">
    <div id="lp-list"></div>`;
  const list=document.getElementById('lp-list');
  const draw=()=>{
    const q=livPickerQuery.trim().toLowerCase();
    const shown=q?all.filter(d=>docHay(d).indexOf(q)>=0):all;
    if(!all.length){
      list.innerHTML='<div class="empty-note">Aucun document dans ce projet. Ajoutez-en un depuis l\'onglet Documents.</div>';
      return;
    }
    if(!shown.length){
      list.innerHTML=`<div class="empty-note">Aucun document ne correspond à « ${esc(livPickerQuery)} ».</div>`;
      return;
    }
    const ids=livAttachedIds(p,L.key);
    list.innerHTML=shown.map(d=>{
      const on=ids.indexOf(d.id)>=0;
      return projectDocRow(d,`<button type="button" class="btn sm ${on?'':'primary '}pdoc-pick" data-pick="${esc(d.id)}">${on?'Retirer':'+ Rattacher'}</button>`)
        .replace('class="pdoc"',`class="pdoc${on?' sel':''}"`);
    }).join('');
    const toggle=id=>{
      const cur=livAttachedIds(p,L.key).slice();
      const i=cur.indexOf(id);
      if(i>=0) cur.splice(i,1); else cur.push(id);
      setLivAttached(p,L.key,cur);
      draw();
      toast(i>=0?'Document retiré du livrable':'Document épinglé au livrable');
    };
    list.querySelectorAll('.pdoc[data-pdocid]').forEach(el=>el.addEventListener('click',ev=>{
      if(ev.target.closest('.pdoc-open')) return;   /* le lien Proton garde son rôle */
      toggle(el.dataset.pdocid);
    }));
  };
  draw();
  const q=document.getElementById('lp-q');
  q.addEventListener('input',()=>{ livPickerQuery=q.value; draw(); });
  document.getElementById('m-back').addEventListener('click',()=>{ livPicker=false; livPickerQuery=''; renderModalMain(p); });
  wireModalTabs(panel,p);
}

/* Livrables auxquels ce document a été rattaché à la main, dans ce projet. */
function docLivrables(p,id){
  return LIVRABLES.filter(L=>livAttachedIds(p,L.key).indexOf(id)>=0);
}
/* Rattacher au projet un document qui existe DÉJÀ : on écrit son projet_id,
   on ne recrée rien. S'il appartenait à un autre projet, on demande confirmation
   — c'est un déplacement, pas une copie (un document a un seul projet). */
async function attacherDocAuProjet(p,d){
  const nom=generateClientFileName({date:d.date,sujet:d.sujet,categorie:d.categorie,initiales:d.initiales,version:d.version})||d.sujet;
  const anc=d.projetId?PROJECTS.find(x=>x.id===d.projetId):null;
  if(anc&&anc.id!==p.id&&!confirm(`« ${nom} » est rattaché au projet « ${anc.title} ».\nLe déplacer vers « ${p.title} » ?`)) return;
  const ok=await upsertCDocInSupabase(d.id, cdocToRow({...d, projetId:p.id}));
  if(!ok) return;
  await loadCDocsFromSupabase();
  renderClientDocs();
  renderModalMain(p);
  toast('Document rattaché au projet');
}
/* Choix d'un document EXISTANT à rattacher au projet ouvert. */
function renderDocsPicker(panel,p){
  panel.innerHTML=modalTabsHtml(p)+`
    <button class="btn sm" id="m-back" style="margin-bottom:14px">← Documents</button>
    <div class="modal-section-title">Lier un document existant</div>
    <p style="font-size:13px;color:var(--ink-3);margin-bottom:12px">Documents déjà créés qui ne sont pas dans ce projet. Cliquez pour les rattacher à « ${esc(p.title)} ».</p>
    <input id="dp-q" class="lp-q" placeholder="Filtrer par nom, sujet, catégorie…" value="${esc(docsPickerQuery)}">
    <div id="dp-list"></div>`;
  const list=document.getElementById('dp-list');
  const draw=()=>{
    const q=docsPickerQuery.trim().toLowerCase();
    const pool=DOCUMENTS_CLIENT.filter(d=>d.projetId!==p.id);
    const shown=(q?pool.filter(d=>docHay(d).indexOf(q)>=0):pool)
      .slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,60);
    if(!shown.length){
      list.innerHTML=`<div class="empty-note">${q?`Aucun document ne correspond à « ${esc(docsPickerQuery)} ».`:'Tous les documents sont déjà rattachés à ce projet.'}</div>`;
      return;
    }
    list.innerHTML=shown.map(d=>{
      const anc=d.projetId?PROJECTS.find(x=>x.id===d.projetId):null;
      return projectDocRow(d,
        `<button type="button" class="btn sm primary" data-attach="${esc(d.id)}">+ Rattacher</button>`,
        anc?`<span class="pdoc-liv">${esc(anc.title)}</span>`:`<span class="pdoc-liv none">Sans projet</span>`);
    }).join('')+(shown.length>=60?'<div class="empty-note">60 premiers résultats — affinez la recherche.</div>':'');
    list.querySelectorAll('[data-attach]').forEach(b=>b.addEventListener('click',ev=>{
      ev.stopPropagation();
      const d=DOCUMENTS_CLIENT.find(x=>x.id===b.dataset.attach);
      if(d) attacherDocAuProjet(p,d);
    }));
  };
  draw();
  const q=document.getElementById('dp-q');
  q.addEventListener('input',()=>{ docsPickerQuery=q.value; draw(); });
  document.getElementById('m-back').addEventListener('click',()=>{ docsPicker=false; docsPickerQuery=''; renderModalMain(p); });
  wireModalTabs(panel,p);
}
function renderModalDocs(panel,p){
  if(docsPicker) return renderDocsPicker(panel,p);
  const list=projectDocs(p);
  panel.innerHTML=modalTabsHtml(p)+`
    <div class="modal-section-title">Documents du projet</div>
    ${list.length
      ? list.map(d=>projectDocRow(d,'',
          docLivrables(p,d.id).map(L=>`<span class="pdoc-liv">${esc(L.label)}</span>`).join(''))).join('')
      : '<div class="empty-note">Aucun document pour ce projet. Ajoutez-en un pour commencer.</div>'}
    <div class="pdoc-foot">
      <button type="button" class="btn sm" id="pdoc-link">Lier un document existant</button>
      <button type="button" class="btn primary sm" id="pdoc-add">+ Nouveau document</button>
    </div>`;
  wireModalTabs(panel,p);
  panel.querySelectorAll('.pdoc[data-pdocid]').forEach(el=>el.addEventListener('click',ev=>{
    if(ev.target.closest('.pdoc-open')) return;
    openClientDocModal(el.dataset.pdocid);
  }));
  const add=document.getElementById('pdoc-add');
  if(add) add.addEventListener('click',()=>openClientDocModal(null,p.id));
  const lnk=document.getElementById('pdoc-link');
  if(lnk) lnk.addEventListener('click',()=>{ docsPicker=true; docsPickerQuery=''; renderModalMain(p); });
}

function renderModalMain(p){
  const panel=document.getElementById('panel-main');
  if(!panel) return;
  p.docs=p.docs||{};

  /* Recherche : livrables, dossiers et documents correspondants */
  if(modalQuery){
    let any=false, nameHtml='', linkHtml='';
    LIVRABLES.forEach(L=>{
      if(mqHit(L.label)){ any=true; nameHtml+=foldRow(L.key,null,L.label,livMeta(p,L.key),LIV_SVG[L.key]); }
      L.folders.forEach(fname=>{
        if(mqHit(fname)||mqHit(L.label+' '+fname)){ any=true; nameHtml+=foldRow(L.key,fname,L.label+' · '+fname,folderMeta(p,L.key,fname)); }
        const links=folderLinks(p,L.key,fname).map((l,i)=>({l,i})).filter(({l})=>mqHit(linkHay(l,L.label+' '+fname)));
        if(links.length){ any=true; linkHtml+=`<div class="fold-search-head">${esc(L.label)} · ${esc(fname)}</div>`+links.map(({l,i})=>linkRow(L.key,fname,l,i)).join(''); }
      });
    });
    panel.innerHTML='<div class="modal-section-title">Recherche</div>'+nameHtml+linkHtml+(any?'':`<div class="empty-note">Aucun livrable, dossier ni document ne correspond à « ${esc(modalQuery)} ».</div>`);
    wireFoldRows(panel,p); wireLinkRows(panel,p);
    return;
  }

  /* Onglet Documents */
  if(modalTab==='docs'){ renderModalDocs(panel,p); return; }

  /* Détail d'un dossier (livrable + dossier) */
  if(currentLivrable && currentDocFolder){
    const L=LIVRABLES.find(x=>x.key===currentLivrable);
    if(!L||L.folders.indexOf(currentDocFolder)<0){ currentDocFolder=null; return renderModalMain(p); }
    const links=folderLinks(p,L.key,currentDocFolder);
    const docs=folderDocs(p,currentDocFolder);
    const att=livAttachedIds(p,L.key);
    panel.innerHTML=modalTabsHtml(p)+`
      <button class="btn sm" id="m-back" style="margin-bottom:14px">← ${esc(L.label)}</button>
      <div class="modal-section-title">${esc(L.label)} · ${esc(currentDocFolder)}</div>
      <p style="font-size:13px;color:var(--ink-3);margin-bottom:14px">Documents du projet en catégorie « ${esc(currentDocFolder)} ». Ils arrivent ici tout seuls : rien à ressaisir.</p>
      ${docs.length
        ? docs.map(d=>projectDocRow(d,'',att.indexOf(d.id)>=0?`<span class="pdoc-liv">${esc(L.label)}</span>`:'')).join('')
        : `<div class="empty-note">Aucun document du projet en catégorie « ${esc(currentDocFolder)} ».</div>`}
      <div class="modal-section-title" style="font-size:14px;margin-top:20px">Liens Proton ajoutés à la main</div>
      ${links.map((l,i)=>linkRow(L.key,currentDocFolder,l,i)).join('')||'<div class="empty-note">Aucun lien saisi à la main dans ce dossier.</div>'}
      <div class="disc-compose" style="flex-wrap:wrap">
        <input id="fl-name" placeholder="Nom du fichier" style="flex:1 1 150px">
        <input id="fl-url" placeholder="https://drive.proton.me/…" style="flex:2 1 220px">
        <select id="fl-perm" style="flex:0 0 auto"><option value="lecture">Lecture</option><option value="edition">Édition</option><option value="admin">Admin</option></select>
        <select id="fl-cat" style="flex:0 0 auto"><option value="">Catégorie…</option>${DOC_CATS.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
        <select id="fl-stat" style="flex:0 0 auto"><option value="">Statut…</option>${DOC_STATS.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select>
        <button class="btn primary sm" id="fl-add">+ Ajouter le lien</button>
      </div>`;
    document.getElementById('m-back').addEventListener('click',()=>{ currentDocFolder=null; renderModalMain(p); });
    wireModalTabs(panel,p);
    wireLinkRows(panel,p);
    panel.querySelectorAll('.pdoc[data-pdocid]').forEach(el=>el.addEventListener('click',ev=>{
      if(ev.target.closest('.pdoc-open')) return;
      openClientDocModal(el.dataset.pdocid);
    }));
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
    if(livPicker) return renderLivPicker(panel,p,L);
    p.livDates=p.livDates||{};
    const ld=p.livDates[L.key]||{};
    const att=livAttachedDocs(p,L.key);
    panel.innerHTML=modalTabsHtml(p)+`
      <button class="btn sm" id="m-back" style="margin-bottom:14px">← Livrables</button>
      <div class="modal-section-title">${esc(L.label)}</div>
      <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:14px;padding:10px 12px;background:var(--surface-2);border:1px solid var(--line);border-radius:var(--radius-sm)">
        <label class="md-field">Début <input type="date" id="lv-start" value="${esc(ld.start||'')}"></label>
        <label class="md-field">Fin <input type="date" id="lv-end" value="${esc(ld.end||'')}"></label>
        <span style="font-size:11.5px;color:var(--ink-3);align-self:center">Dates spécifiques à ce livrable (utilisées sur le Calendrier).</span>
      </div>
      <div class="modal-section-title" style="font-size:14px;margin-top:6px">Documents mis en avant</div>
      <p style="font-size:12.5px;color:var(--ink-3);margin:-8px 0 12px">Les dossiers ci-dessous se remplissent tout seuls à partir des documents du projet. Cette liste sert à épingler ceux qui sont propres à ce livrable.</p>
      ${att.length
        ? att.map(d=>projectDocRow(d,`<button type="button" class="btn sm pdoc-unlink" data-unlink="${esc(d.id)}">Retirer</button>`)).join('')
        : '<div class="empty-note">Aucun document épinglé à ce livrable.</div>'}
      <div class="pdoc-foot"><button type="button" class="btn primary sm" id="lv-pick">+ Épingler un document</button></div>
      <div class="modal-section-title" style="font-size:14px;margin-top:18px">Dossiers de documents</div>
      ${L.folders.map(fname=>foldRow(L.key,fname,fname,folderMeta(p,L.key,fname))).join('')}`;
    document.getElementById('m-back').addEventListener('click',()=>{ currentLivrable=null; renderModalMain(p); });
    wireModalTabs(panel,p);
    wireFoldRows(panel,p);
    document.getElementById('lv-pick').addEventListener('click',()=>{ livPicker=true; livPickerQuery=''; renderModalMain(p); });
    panel.querySelectorAll('[data-unlink]').forEach(b=>b.addEventListener('click',ev=>{
      ev.stopPropagation();
      const cur=livAttachedIds(p,L.key).filter(x=>x!==b.dataset.unlink);
      setLivAttached(p,L.key,cur);
      renderModalMain(p); toast('Document retiré du livrable');
    }));
    panel.querySelectorAll('.pdoc[data-pdocid]').forEach(el=>el.addEventListener('click',ev=>{
      if(ev.target.closest('.pdoc-open')||ev.target.closest('[data-unlink]')) return;
      openClientDocModal(el.dataset.pdocid);
    }));
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
  panel.innerHTML=modalTabsHtml(p)+`
    <div class="modal-section-title">Livrables</div>
    <p style="font-size:13px;color:var(--ink-3);margin-bottom:14px">Ouvre un livrable pour ses dates et ses dossiers, qui reprennent automatiquement les documents du projet par catégorie.</p>
    ${LIVRABLES.map(L=>foldRow(L.key,null,L.label,livMeta(p,L.key),LIV_SVG[L.key])).join('')}`;
  wireModalTabs(panel,p);
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
/* Fermeture au clic sur le fond — mais SEULEMENT si le geste a commencé ET
   fini sur le fond. Sans ce garde, sélectionner un texte (ex. une URL) dans la
   modale en glissant la souris jusqu'au fond déclenche un « click » dont la
   cible est l'overlay → la modale se fermait par erreur. */
function bindBackdropClose(overlay, closeFn){
  if(!overlay) return;
  let downOnBackdrop=false;
  overlay.addEventListener('mousedown',e=>{ downOnBackdrop=(e.target===overlay); });
  overlay.addEventListener('click',e=>{ if(e.target===overlay && downOnBackdrop) closeFn(); downOnBackdrop=false; });
}
document.getElementById('m-close').addEventListener('click',closeModal);
bindBackdropClose(document.getElementById('overlay'), closeModal);

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
  /* Panneau de recherche en haut : input + 4 dropdowns (Projet, Catégorie,
     Responsable, Année) qui filtrent la grille « Mes documents » plus bas.
     Synchronisé avec la barre du topbar. */
  const panel=document.getElementById('ds-panel');
  if(panel){
    /* Options des dropdowns */
    const projOpts = `<option value="tous">Tous les projets</option>`+
      PROJECTS.map(p=>`<option value="${esc(p.id)}"${p.id===cdocProj?' selected':''}>${esc(p.title)}</option>`).join('');
    const catOpts = `<option value="tous">Toutes les catégories</option>`+
      DOC_CATEGORIES_CLIENT.map(c=>`<option value="${esc(c.key)}"${c.key===cdocCat?' selected':''}>${esc(c.label)}</option>`).join('');
    const whoOpts = `<option value="tous">Tous les responsables</option>`+
      TEAM.filter(m=>m.initiales).map(m=>`<option value="${esc(m.initiales)}"${m.initiales===cdocWho?' selected':''}>${esc(m.name)} (${esc(m.initiales)})</option>`).join('');
    /* Années extraites des documents existants, tri descendant */
    const years = [...new Set(DOCUMENTS_CLIENT.map(d=>(d.date||'').slice(0,4)).filter(Boolean))].sort().reverse();
    const yearOpts = `<option value="tous">Toutes les années</option>`+
      years.map(y=>`<option value="${esc(y)}"${y===cdocYear?' selected':''}>${esc(y)}</option>`).join('');
    panel.innerHTML = `
      <input id="ds-q" class="ds-input" placeholder="Sujet, projet, responsable, date… (ex : « Filou », « Bruno », « 2026-05 »)" value="${esc(cdocQ)}">
      <div class="ds-filters">
        <label>Projet<select id="ds-proj">${projOpts}</select></label>
        <label>Catégorie<select id="ds-cat">${catOpts}</select></label>
        <label>Responsable<select id="ds-who">${whoOpts}</select></label>
        <label>Année<select id="ds-year">${yearOpts}</select></label>
      </div>
    `;
    /* Wiring */
    const dsq=document.getElementById('ds-q');
    if(dsq) dsq.addEventListener('input',()=>{ cdocQ=dsq.value; renderClientDocs(); });
    document.getElementById('ds-proj').addEventListener('change',e=>{ cdocProj=e.target.value; renderClientDocs(); });
    document.getElementById('ds-cat').addEventListener('change',e=>{ cdocCat=e.target.value; renderClientDocs(); });
    document.getElementById('ds-who').addEventListener('change',e=>{ cdocWho=e.target.value; renderClientDocs(); });
    document.getElementById('ds-year').addEventListener('change',e=>{ cdocYear=e.target.value; renderClientDocs(); });
  }
  renderClientDocs();
}

/* ===== ANCIEN MODULE "Mes documents" — SUPPRIMÉ (2026-06-11) =====
   Voir « NOMENCLATURE CLIENT » plus bas pour le seul module qui reste.
   La barre de recherche transversale (#ds-panel) reste active.
   Cette IIFE absorbe les fonctions retirées sans casser la syntaxe ; le code
   à l'intérieur n'est jamais exécuté (jamais appelé). À supprimer dans une
   passe ultérieure quand on aura aussi nettoyé les helpers liés. */
(function _DELETED_old_documents_module(){ if(false){
function _noop_old(){
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
}})();

/* ============================================================
   NOMENCLATURE CLIENT — module unique de la section "Mes documents"
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

/* Recherche propre à la page Documents. Elle vivait dans la barre du topbar,
   recopiée dans le panneau « Rechercher un document » : deux champs identiques
   à l'écran. Le panneau est désormais la seule source, et la barre du topbar
   est masquée sur cette page. */
let cdocQ='';
let cdocCat='tous';
let cdocWho='tous';
let cdocProj='tous';
let cdocYear='tous';
/* Affichage de la page Documents. Liste par défaut : l'équipe a des centaines
   de fiches et les cartes obligent à scroller. Le choix vit le temps de la
   session, volontairement pas en localStorage. */
let cdocView='liste';
const CDOC_ICO={
  images:'<path d="M3 5h18v14H3z"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5-5-4 4-2-2-7 6"/>',
  video: '<path d="M4 5h11v14H4z"/><path d="M15 10l5-3v10l-5-3z"/>',
  texte: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M9 13h7M9 17h5"/>',
  audio: '<path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2"/>'
};

function renderClientDocs(){
  /* Les filtres sont désormais dans le panneau du haut (ds-panel) :
     Projet, Catégorie, Responsable, Année + recherche texte. La grille
     « Mes documents » plus bas affiche le résultat filtré. */
  const q = cdocQ.toLowerCase().trim();
  let list=DOCUMENTS_CLIENT.slice();
  if(cdocProj!=='tous') list=list.filter(d=>d.projetId===cdocProj);
  if(cdocCat!=='tous') list=list.filter(d=>d.categorie===cdocCat);
  if(cdocWho!=='tous') list=list.filter(d=>d.initiales===cdocWho);
  if(cdocYear!=='tous') list=list.filter(d=>(d.date||'').slice(0,4)===cdocYear);
  if(q){
    list=list.filter(d=>{
      const proj=PROJECTS.find(p=>p.id===d.projetId);
      const author=TEAM.find(m=>m.initiales===d.initiales);
      const cat=DOC_CATEGORIES_CLIENT.find(c=>c.key===d.categorie);
      const name=generateClientFileName({date:d.date,sujet:d.sujet,categorie:d.categorie,initiales:d.initiales,version:d.version});
      const hay=(d.sujet||'')+' '+(d.resume||'')+' '+(name||'')+' '+(proj?proj.title:'')+' '+(author?author.name:'')+' '+(cat?cat.label:'')+' '+(d.date||'');
      return hay.toLowerCase().includes(q);
    });
  }
  list.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  /* Compteur de résultats au-dessus de la grille */
  const cntEl=document.getElementById('cdoc-count');
  if(cntEl){
    const total=DOCUMENTS_CLIENT.length;
    const hasFilter = q || cdocProj!=='tous' || cdocCat!=='tous' || cdocWho!=='tous' || cdocYear!=='tous';
    cntEl.textContent = hasFilter
      ? `${list.length} document${list.length>1?'s':''} sur ${total}`
      : `${list.length} document${list.length>1?'s':''}`;
  }
  const grid=document.getElementById('cdoc-grid');
  if(!grid) return;
  grid.className=cdocView==='liste'?'doc-list':'proj-grid';
  document.getElementById('cdoc-view-grille')?.classList.toggle('active',cdocView==='grille');
  document.getElementById('cdoc-view-liste')?.classList.toggle('active',cdocView==='liste');
  if(!list.length){
    grid.innerHTML=`<div class="placeholder" style="grid-column:1/-1">
      <div class="ph-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/></svg></div>
      <h2>Aucun document</h2><p>Aucun document ne correspond à ces filtres. Modifie tes critères dans le panneau de recherche en haut.</p></div>`;
    return;
  }
  grid.innerHTML=list.map(cdocView==='liste'?renderClientDocRow:renderClientDocCard).join('');
  grid.querySelectorAll('[data-cdocid]').forEach(c=>c.addEventListener('click',ev=>{
    if(ev.target.closest('.doc-proton-link')) return;
    openClientDocModal(c.dataset.cdocid);
  }));
}

function renderClientDocRow(d){
  const cat=DOC_CATEGORIES_CLIENT.find(c=>c.key===d.categorie);
  const author=TEAM.find(m=>m.initiales===d.initiales);
  const name=generateClientFileName({date:d.date,sujet:d.sujet,categorie:d.categorie,initiales:d.initiales,version:d.version});
  const url=docFolderLink(d);
  const ok=isHttpUrl(url);
  return `<div class="doc-row" data-cdocid="${esc(d.id)}" title="${esc(name||d.sujet||'')}">
    <span class="dr-ic doc-cat-${esc(d.categorie)}" title="${esc(cat?cat.label:d.categorie)}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${CDOC_ICO[d.categorie]||''}</svg>
    </span>
    <span class="dr-n">${esc(name||'(incomplet)')}</span>
    <span class="dr-r">${esc(d.resume||'')}</span>
    ${author
      ? `<span class="ava-sm dr-a" style="background:${author.color}" title="${esc(author.name)}">${esc(author.initiales)}</span>`
      : `<span class="ava-sm dr-a" style="background:var(--ink-3)" title="Responsable inconnu">${esc(d.initiales||'?')}</span>`}
    <span class="dr-d">${esc(fmtDate(d.date))}</span>
    ${ok
      ? `<a class="dr-o doc-proton-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Ouvrir ↗</a>`
      : `<span class="dr-o none">—</span>`}
  </div>`;
}

function renderClientDocCard(d){
  const cat=DOC_CATEGORIES_CLIENT.find(c=>c.key===d.categorie);
  const author=TEAM.find(m=>m.initiales===d.initiales);
  const name=generateClientFileName({date:d.date,sujet:d.sujet,categorie:d.categorie,initiales:d.initiales,version:d.version});
  /* On utilise désormais le lien Proton du DOSSIER (projet+catégorie) au
     lieu du lien par document. Si pas de dossier configuré, on retombe
     éventuellement sur l'ancien d.lienProton (compat). */
  const folderUrl=docFolderLink(d);
  const ok=isHttpUrl(folderUrl);
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
      ${ok?`<a href="${esc(folderUrl)}" target="_blank" rel="noopener noreferrer" class="doc-proton-link">Ouvrir le dossier ↗</a>`:'<span style="color:var(--ink-3)">Dossier non lié</span>'}
    </div>
  </article>`;
}

/* presetProjetId : projet pré-sélectionné quand on crée le document depuis la
   modale d'un projet (bouton « + Lier un document »). */
function openClientDocModal(id, presetProjetId){
  const isEdit=!!id;
  const todayIso=fmtIso(new Date());
  const d=isEdit?DOCUMENTS_CLIENT.find(x=>x.id===id)
                :{id:null,date:todayIso,sujet:'',projetId:presetProjetId||'',categorie:'',initiales:'BL',version:1,lienProton:'',resume:''};
  if(isEdit&&!d) return;
  document.getElementById('cdoc-m-title').textContent=isEdit?'Modifier le document':'Nouveau document';
  document.getElementById('cdoc-m-sub').textContent=isEdit?'Format client — modifier':'Format client — 5 étapes';
  const body=document.getElementById('cdoc-m-body');
  const projOpts='<option value="">— sélectionnez un projet —</option>'+
    PROJECTS.map(p=>`<option value="${esc(p.id)}"${p.id===(d.projetId||'')?' selected':''}>${esc(p.title)}</option>`).join('');
  const catChips=DOC_CATEGORIES_CLIENT.map(c=>`<button type="button" class="chip ${c.key===d.categorie?'active':''}" data-cdform-cat="${esc(c.key)}">${esc(c.label)}</button>`).join('');
  const whoOpts=TEAM.filter(m=>m.initiales).map(m=>`<option value="${esc(m.initiales)}"${m.initiales===(d.initiales||'')?' selected':''}>${esc(m.name)} (${esc(m.initiales)})</option>`).join('');
  body.innerHTML=`
    <div class="doc-step"><span class="step-num">1</span><div class="doc-step-body">
      <div class="field-label">Informations de base</div>
      <div class="cdoc-grid-2">
        <label class="cdoc-field"><span>Date</span><input id="cdf-date" type="date" value="${esc(d.date||todayIso)}"></label>
        <label class="cdoc-field"><span>Projet</span><select id="cdf-proj">${projOpts}</select></label>
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
      <div class="field-label">Lien d'accès au dossier Proton + résumé</div>
      <div id="cdf-folder-zone" class="doc-folder-zone">
        <div class="doc-step-instruction muted">Sélectionnez un projet et une catégorie à l'étape 1/2.</div>
      </div>
      <label class="cdoc-field" style="margin-top:10px"><span>Résumé / description</span><textarea id="cdf-resume" rows="2" placeholder="ex. Filou sur sa trottinette avec un casque rouge">${esc(d.resume||'')}</textarea></label>
    </div></div>
    <div class="doc-modal-foot">
      ${isEdit?`<button type="button" class="btn sm" id="cdf-del" style="color:var(--accent)">Supprimer</button>`:'<span></span>'}
      <div style="display:flex;gap:8px">
        <button type="button" class="btn" id="cdf-cancel">Annuler</button>
        <button type="button" class="btn primary" id="cdf-save" disabled>Enregistrer</button>
      </div>
    </div>`;
  /* Le lien Proton est propre au document. Pour un document existant qui n'a
     pas encore son propre lien, on adopte l'ancien lien partagé projet+catégorie
     (compat) ; il deviendra propre au document dès le prochain enregistrement. */
  const st={date:d.date||todayIso,sujet:d.sujet||'',projetId:d.projetId||'',categorie:d.categorie||'',initiales:d.initiales||'BL',version:d.version||1,lienProton:(d.lienProton||(isEdit?docFolderLink({projetId:d.projetId,categorie:d.categorie}):'')),resume:d.resume||''};

  /* Step 5 — lien Proton PROPRE à ce document */
  const renderStep5=()=>{
    const zone=document.getElementById('cdf-folder-zone');
    if(!zone) return;
    if(!st.projetId||!st.categorie){
      zone.innerHTML='<div class="doc-step-instruction muted">Sélectionnez un projet (étape 1) et une catégorie (étape 2) pour voir le lien du dossier.</div>';
      return;
    }
    const proj=PROJECTS.find(x=>x.id===st.projetId);
    const cat=DOC_CATEGORIES_CLIENT.find(x=>x.key===st.categorie);
    const url=st.lienProton;
    const ctx=`${esc(proj?proj.title:'')} · ${esc(cat?cat.label:st.categorie)}`;
    if(isHttpUrl(url)){
      zone.innerHTML=`
        <div class="doc-folder-context">${ctx}</div>
        <div class="doc-folder-url"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url)}</a></div>
        <div class="doc-folder-actions">
          <button type="button" class="btn primary sm" id="cdf-open">↗ Ouvrir le dossier</button>
          <button type="button" class="btn sm" id="cdf-copy-folder">📋 Copier le lien</button>
          <button type="button" class="btn sm" id="cdf-edit-folder">Modifier</button>
        </div>
        <div class="doc-step-instruction">Une fois le dossier ouvert sur Proton : <b>colle le nom final</b> (Ctrl+V) sur le fichier renommé, puis <b>glisse-le</b> dans le dossier. Quand c'est fait, clique sur <b>Enregistrer</b> pour conserver une trace ici.</div>`;
      document.getElementById('cdf-open').addEventListener('click',()=>window.open(url,'_blank','noopener'));
      document.getElementById('cdf-copy-folder').addEventListener('click',()=>{
        if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(()=>toast('Lien du dossier copié')); }
        else { const ta=document.createElement('textarea'); ta.value=url; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(ta); toast('Lien du dossier copié'); }
      });
      document.getElementById('cdf-edit-folder').addEventListener('click',()=>{ renderStep5Edit(url); });
    } else {
      renderStep5Edit('');
    }
  };
  const renderStep5Edit=(currentUrl)=>{
    const zone=document.getElementById('cdf-folder-zone');
    if(!zone) return;
    const proj=PROJECTS.find(x=>x.id===st.projetId);
    const cat=DOC_CATEGORIES_CLIENT.find(x=>x.key===st.categorie);
    const ctx=`${esc(proj?proj.title:'')} · ${esc(cat?cat.label:st.categorie)}`;
    zone.innerHTML=`
      <div class="doc-folder-context">${ctx}</div>
      <input id="cdf-folder-input" type="url" placeholder="https://drive.proton.me/…" value="${esc(currentUrl||'')}">
      <div class="doc-folder-actions">
        <button type="button" class="btn primary sm" id="cdf-folder-save">Valider ce lien</button>
        ${currentUrl?'<button type="button" class="btn sm" id="cdf-folder-cancel">Annuler</button>':''}
      </div>
      <div class="doc-step-instruction muted">Ce lien est propre à ce document.</div>`;
    const input=document.getElementById('cdf-folder-input');
    const saveBtn=document.getElementById('cdf-folder-save');
    const updateBtn=()=>{ saveBtn.disabled=!isHttpUrl(input.value.trim()); };
    input.addEventListener('input',()=>{ st.lienProton=input.value.trim(); updateBtn(); refresh(); });
    updateBtn();
    saveBtn.addEventListener('click',()=>{
      const v=input.value.trim();
      if(!isHttpUrl(v)){ toast('Lien invalide — il doit commencer par https://'); return; }
      st.lienProton=v;
      toast('Lien enregistré pour ce document');
      renderStep5();
      refresh();
    });
    const cancel=document.getElementById('cdf-folder-cancel');
    if(cancel) cancel.addEventListener('click',()=>{ renderStep5(); refresh(); });
    setTimeout(()=>input.focus(),20);
  };

  const refresh=()=>{
    const name=generateClientFileName(st);
    const prev=document.getElementById('cdf-name');
    const copy=document.getElementById('cdf-copy');
    const save=document.getElementById('cdf-save');
    if(name){ prev.textContent=name; prev.classList.remove('empty'); copy.disabled=false; }
    else { prev.textContent='Le nom apparaîtra ici…'; prev.classList.add('empty'); copy.disabled=true; }
    /* Validation : nom + projet + cat + responsable + le lien propre au document. */
    save.disabled=!(st.date&&st.sujet.trim()&&st.projetId&&st.categorie&&st.initiales&&isHttpUrl(st.lienProton));
  };
  document.getElementById('cdf-date').addEventListener('change',e=>{ st.date=e.target.value||todayIso; refresh(); });
  document.getElementById('cdf-proj').addEventListener('change',e=>{ st.projetId=e.target.value; renderStep5(); refresh(); });
  document.getElementById('cdf-sujet').addEventListener('input',e=>{ st.sujet=e.target.value; refresh(); });
  document.querySelectorAll('#cdf-cats [data-cdform-cat]').forEach(ch=>ch.addEventListener('click',()=>{
    st.categorie=ch.dataset.cdformCat;
    document.querySelectorAll('#cdf-cats .chip').forEach(c=>c.classList.toggle('active', c.dataset.cdformCat===st.categorie));
    renderStep5(); refresh();
  }));
  document.getElementById('cdf-author').addEventListener('change',e=>{ st.initiales=e.target.value; refresh(); });
  document.getElementById('cdf-version').addEventListener('input',e=>{ const n=parseInt(e.target.value,10); st.version=isNaN(n)||n<1?1:n; refresh(); });
  document.getElementById('cdf-resume').addEventListener('input',e=>{ st.resume=e.target.value; });
  document.getElementById('cdf-copy').addEventListener('click',()=>{
    const name=generateClientFileName(st); if(!name) return;
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(name).then(()=>toast('Nom copié')); }
    else { const ta=document.createElement('textarea'); ta.value=name; document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(e){} document.body.removeChild(ta); toast('Nom copié'); }
  });
  document.getElementById('cdf-cancel').addEventListener('click',closeClientDocModal);
  document.getElementById('cdf-save').addEventListener('click',()=>{
    /* Si un lien est en cours de saisie inline (pas encore validé), on le
       prend en compte pour ce document avant d'enregistrer. */
    const inlineInput=document.getElementById('cdf-folder-input');
    if(inlineInput){ const v=inlineInput.value.trim(); if(isHttpUrl(v)) st.lienProton=v; }
    saveClientDocFromForm(id,st);
  });
  if(isEdit){
    document.getElementById('cdf-del').addEventListener('click',async ()=>{
      if(!confirm('Supprimer ce document ?')) return;
      const ok = await deleteCDocInSupabase(id);
      if(!ok) return;
      await loadCDocsFromSupabase();
      closeClientDocModal();
      renderClientDocs();
      refreshOpenProjectModal();
      toast('Document supprimé');
    });
  }
  renderStep5();
  refresh();
  document.getElementById('client-doc-overlay').classList.add('open');
  setTimeout(()=>{ const n=document.getElementById('cdf-sujet'); if(n) n.focus(); },50);
}

function closeClientDocModal(){ document.getElementById('client-doc-overlay').classList.remove('open'); }

/* La modale projet peut être ouverte derrière celle du document : on la
   redessine pour que l'onglet Documents reflète l'ajout/suppression. */
function refreshOpenProjectModal(){
  const ovl=document.getElementById('overlay');
  if(!ovl||!ovl.classList.contains('open')) return;
  const p=PROJECTS.find(x=>x.id===currentId);
  if(p) renderModalMain(p);
}

async function saveClientDocFromForm(id,s){
  if(!s.date||!s.sujet.trim()||!s.categorie||!s.initiales) return;
  const payload = cdocToRow(s);
  const ok = await upsertCDocInSupabase(id, payload);
  if(!ok) return;
  await loadCDocsFromSupabase();
  closeClientDocModal();
  renderClientDocs();
  refreshOpenProjectModal();
  toast(id?'Document mis à jour':'Document ajouté');
}

function exportClientDocsCSV(){
  /* Format client : séparateur ;, BOM UTF-8, colonnes exactes du tableur */
  const headers=['Nom de fichier','Résumé','Lien final','Sources_Production'];
  const csvEsc=v=>{ const s=String(v??''); return /[";\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; };
  const lines=[headers.join(';')];
  DOCUMENTS_CLIENT.forEach(d=>{
    const name=generateClientFileName({date:d.date,sujet:d.sujet,categorie:d.categorie,initiales:d.initiales,version:d.version});
    const folderUrl=docFolderLink(d);
    lines.push([csvEsc(name),csvEsc(d.resume||''),csvEsc(folderUrl),csvEsc('')].join(';'));
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
    id:          row.id,
    title:       row.title,
    category:    row.category,
    projectId:   row.project_id || '',
    assignee:    row.assignee || '',
    deadline:    row.deadline || '',
    jalon:       row.jalon || '',
    link:        row.link || '',
    status:      row.status,
    validatedBy: row.validated_by || '',
    validatedAt: row.validated_at || '',
    createdAt:   row.created_at,
    updatedAt:   row.updated_at
  };
}
function taskToRow(t){
  return {
    title:        (t.title||'').trim(),
    category:     t.category,
    project_id:   t.projectId || null,
    assignee:     t.assignee || null,
    deadline:     t.deadline || null,
    jalon:        t.jalon || '',
    link:         t.link || '',
    status:       t.status || 'todo',
    validated_by: t.validatedBy || null,
    validated_at: t.validatedAt || null
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

/* Validation par un admin — applique validated_by + validated_at en BD,
   met à jour la tâche en mémoire, re-rend le Kanban. */
/* Droit de modifier une tâche : un admin OU la personne assignée à la tâche.
   Sert à verrouiller édition / suppression / déplacement (drag&drop). */
function canTouchTask(t){
  const u = getCurrentUser();
  if(u.access==='admin') return true;
  return !!t && !!t.assignee && t.assignee===u.id;
}
async function validateTask(id){
  const t = TASKS.find(x=>x.id===id);
  if(!t) return false;
  const u = getCurrentUser();
  if(u.access !== 'admin'){
    toast('Seul un administrateur peut valider une tâche');
    return false;
  }
  const nowIso = new Date().toISOString();
  /* Optimistic UI : on met à jour en mémoire et on rend immédiatement */
  const prev = { validatedBy: t.validatedBy, validatedAt: t.validatedAt };
  t.validatedBy = u.id;
  t.validatedAt = nowIso;
  renderKanban();
  const ok = await upsertTaskInSupabase(id, { validated_by: u.id, validated_at: nowIso });
  if(!ok){
    /* Rollback */
    t.validatedBy = prev.validatedBy;
    t.validatedAt = prev.validatedAt;
    renderKanban();
    return false;
  }
  toast('Tâche validée par '+u.name);
  return true;
}
async function devalidateTask(id){
  const t = TASKS.find(x=>x.id===id);
  if(!t) return false;
  const u = getCurrentUser();
  if(u.access !== 'admin'){
    toast('Seul un administrateur peut dévalider une tâche');
    return false;
  }
  const prev = { validatedBy: t.validatedBy, validatedAt: t.validatedAt };
  t.validatedBy = '';
  t.validatedAt = '';
  renderKanban();
  const ok = await upsertTaskInSupabase(id, { validated_by: null, validated_at: null });
  if(!ok){
    t.validatedBy = prev.validatedBy;
    t.validatedAt = prev.validatedAt;
    renderKanban();
    return false;
  }
  toast('Validation annulée');
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
      /* Les clics sur les boutons internes (link, valider, dévalider) ne doivent
         pas ouvrir le formulaire d'édition de la tâche. */
      if(ev.target.closest('.k-card-link, .k-validate-btn, .k-devalidate-btn')) return;
      openTaskForm(c.dataset.id);
    });
    /* Drag&drop réservé à la personne assignée ou à un admin. */
    const _ct=TASKS.find(x=>x.id===c.dataset.id);
    if(canTouchTask(_ct)){
      c.setAttribute('draggable','true');
      c.addEventListener('dragstart',e=>{
        e.dataTransfer.setData('text/plain',c.dataset.id);
        e.dataTransfer.effectAllowed='move';
        c.classList.add('dragging');
      });
      c.addEventListener('dragend',()=>c.classList.remove('dragging'));
    }
  });
  /* Boutons Valider / Dévalider — uniquement visibles si l'utilisateur
     courant est admin (cf. canValidate/canDevalidate dans renderTaskCard). */
  document.querySelectorAll('#kanban [data-tk-validate]').forEach(b=>b.addEventListener('click',async ev=>{
    ev.stopPropagation();
    const id = b.dataset.tkValidate;
    await validateTask(id);
  }));
  document.querySelectorAll('#kanban [data-tk-devalidate]').forEach(b=>b.addEventListener('click',async ev=>{
    ev.stopPropagation();
    const id = b.dataset.tkDevalidate;
    if(!confirm('Annuler la validation de cette tâche ?')) return;
    await devalidateTask(id);
  }));
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
      if(!canTouchTask(t)){ toast('Seule la personne assignée ou un admin peut déplacer cette tâche'); return; }
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
  /* Validation : seul un admin peut valider/dévalider. Le badge est visible
     pour tous les utilisateurs si la tâche a été validée. */
  const isValidated = !!t.validatedBy;
  const validator = isValidated ? memberById(t.validatedBy) : null;
  const validDate = isValidated && t.validatedAt ? fmtDate(t.validatedAt.split('T')[0]) : '';
  const currentUserIsAdmin = getCurrentUser().access === 'admin';
  const canValidate = currentUserIsAdmin && t.status === 'done' && !isValidated;
  const canDevalidate = currentUserIsAdmin && isValidated;
  return `<div class="k-card${isValidated?' k-validated':''}" data-id="${esc(t.id)}">
    <div class="k-card-title">${esc(t.title)}</div>
    <div class="k-card-meta">
      ${L?`<span class="tk-stage">${esc(L.label)}</span>`:''}
      ${m?`<span class="ava-sm" style="width:22px;height:22px;margin:0;background:${m.color}" title="${esc(m.name)}">${initials(m.name)}</span>`:''}
      ${t.deadline?`<span class="k-card-date${overdue?' warn':''}">${fmtDate(t.deadline)}</span>`:''}
    </div>
    ${t.jalon?`<div class="k-card-jalon">📌 ${esc(t.jalon)}</div>`:''}
    ${t.link&&isHttpUrl(t.link)?`<a class="btn sm k-card-link" href="${esc(t.link)}" target="_blank" rel="noopener noreferrer">Ouvrir Proton</a>`:''}
    ${isValidated?`<div class="k-card-validated-row">
      <span class="vbadge">✓ Validée par ${esc(validator?validator.name:t.validatedBy)}${validDate?` · ${esc(validDate)}`:''}</span>
      ${canDevalidate?`<button type="button" class="k-devalidate-btn" data-tk-devalidate="${esc(t.id)}" title="Annuler la validation">Dévalider</button>`:''}
    </div>`:''}
    ${canValidate?`<button type="button" class="k-validate-btn" data-tk-validate="${esc(t.id)}">✓ Valider la tâche</button>`:''}
  </div>`;
}
function openTaskForm(id){
  const box=document.getElementById('task-form');
  if(!box) return;
  const t=id?TASKS.find(x=>x.id===id):{id:null,title:'',category:LIVRABLES[0].key,projectId:'',assignee:'',deadline:'',jalon:'',link:'',status:'todo'};
  if(id&&!t){ return; }
  /* Une tâche existante n'est modifiable que par la personne assignée ou un
     admin. Les autres voient le détail en lecture seule. La création reste
     ouverte à tous. */
  const canEdit = !id || canTouchTask(t);
  const dis = canEdit ? '' : ' disabled';
  const catOpts=LIVRABLES.map(L=>`<option value="${esc(L.key)}"${L.key===t.category?' selected':''}>${esc(L.label)}</option>`).join('');
  const whoOpts='<option value="">— personne —</option>'+TEAM.map(m=>`<option value="${esc(m.id)}"${m.id===(t.assignee||'')?' selected':''}>${esc(m.name)}</option>`).join('');
  const projOpts='<option value="">— aucun projet —</option>'+PROJECTS.map(p=>`<option value="${esc(p.id)}"${p.id===(t.projectId||'')?' selected':''}>${esc(p.title)}</option>`).join('');
  const statusOpts=KANBAN_STATUSES.map(s=>`<option value="${esc(s.key)}"${s.key===t.status?' selected':''}>${esc(s.label)}</option>`).join('');
  box.innerHTML=`
    <div class="invite-card">
      <input id="tk-title" placeholder="Titre de la tâche" value="${esc(t.title)}" style="flex:1 1 240px"${dis}>
      <select id="tk-cat"${dis}>${catOpts}</select>
      <select id="tk-proj"${dis}>${projOpts}</select>
      <select id="tk-who"${dis}>${whoOpts}</select>
      <input id="tk-date" type="date" value="${esc(t.deadline||'')}"${dis}>
      <input id="tk-jalon" placeholder="Jalon (ex. Validation client)" value="${esc(t.jalon||'')}" style="flex:1 1 180px"${dis}>
      <input id="tk-link" placeholder="Lien Proton (https://…)" value="${esc(t.link||'')}" style="flex:1 1 220px"${dis}>
      <select id="tk-status"${dis}>${statusOpts}</select>
      ${canEdit?`<button class="btn primary sm" id="tk-save">${id?'Enregistrer':'Créer la tâche'}</button>`:''}
      ${canEdit&&id?'<button class="btn sm" id="tk-del">Supprimer</button>':''}
      <button class="btn sm" id="tk-cancel">${canEdit?'Annuler':'Fermer'}</button>
      ${canEdit?'':'<span class="muted" style="align-self:center">Lecture seule — réservé à la personne assignée ou à un admin</span>'}
    </div>`;
  if(canEdit){
    document.getElementById('tk-save').addEventListener('click',()=>saveTaskFromForm(id));
  }
  document.getElementById('tk-cancel').addEventListener('click',()=>{ box.innerHTML=''; });
  if(canEdit&&id){ document.getElementById('tk-del').addEventListener('click',async ()=>{
    if(!confirm('Supprimer cette tâche ?')) return;
    const ok = await deleteTaskInSupabase(id);
    if(!ok) return;
    await loadTasksFromSupabase();
    box.innerHTML='';
    renderKanban();
    toast('Tâche supprimée');
  }); }
  if(canEdit) document.getElementById('tk-title').focus();
}
async function saveTaskFromForm(id){
  if(id){
    const _t=TASKS.find(x=>x.id===id);
    if(!canTouchTask(_t)){ toast('Seule la personne assignée ou un admin peut modifier cette tâche'); return; }
  }
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
/* Pas d'entrée `docs` : la page Documents a son propre champ de recherche dans
   le panneau, la barre du topbar y est masquée. */
const SEARCH_PLACEHOLDER={dashboard:'Rechercher un projet…',projets:'Rechercher un projet…',kanban:'Rechercher une tâche…',gantt:'Rechercher un projet…',equipe:'Rechercher un membre…'};
function switchView(v){
  document.querySelectorAll('.view').forEach(el=>el.classList.remove('active'));
  document.getElementById('view-'+v).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  document.getElementById('crumb-current').textContent=VIEW_NAMES[v]||'';
  closeMobileNav();
  window.scrollTo({top:0,behavior:'smooth'});
  const _s=document.getElementById('search');
  if(_s){ _s.value=''; _s.placeholder=SEARCH_PLACEHOLDER[v]||'Rechercher…'; }
  document.querySelector('.topbar .search')?.classList.toggle('hide', v==='docs');
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
});

/* mobile menu : tiroir + fond cliquable synchronisés */
function closeMobileNav(){
  document.getElementById('sidebar').classList.remove('open');
  const bd=document.getElementById('nav-backdrop'); if(bd) bd.classList.remove('open');
}
document.getElementById('menu-toggle').addEventListener('click',()=>{
  const open=document.getElementById('sidebar').classList.toggle('open');
  const bd=document.getElementById('nav-backdrop'); if(bd) bd.classList.toggle('open',open);
});
(function(){ const bd=document.getElementById('nav-backdrop'); if(bd) bd.addEventListener('click',closeMobileNav); })();
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape') return;
  if(document.getElementById('newproj-overlay').classList.contains('open')) closeNewProjectModal();
  else if(document.getElementById('client-doc-overlay').classList.contains('open')) closeClientDocModal();
  else closeModal();
});

/* ===== drag & resize des barres du Calendrier ===== */
let _ganttDrag=null;
let _ganttDragMoved=false;
document.addEventListener('mousedown',e=>{
  const bar=e.target.closest('#gantt .g-bar');
  if(!bar) return;
  /* Déplacer/redimensionner une barre du Calendrier est réservé aux admins.
     Pour les autres, on n'amorce pas le glissement : le clic normal continue
     d'ouvrir la fiche projet (lecture). */
  if(getCurrentUser().access!=='admin') return;
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
  const startIso=ld.start||p.dateStart||fmtIso(legacyFracToDate(p.gStart));
  const endIso=ld.end||p.dateEnd||fmtIso(legacyFracToDate(p.gEnd));
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
  /* Si déjà connecté par courriel, re-mappe au cas où les emails de la
     BD diffèrent légèrement des emails codés en dur. */
  teamLoaded = true;
  reconcileSession();
  renderSidebarFoot();
  const av = document.querySelector('.nav-item.active');
  if(av && av.dataset.view === 'equipe') renderTeam();
});

/* Auth Supabase : récupère la session au chargement (retour de lien
   magique, ou session déjà active) et écoute les changements d'état. */
if(supa){
  supa.auth.getSession().then(({data}) => { applySupaSession(data.session); });
  supa.auth.onAuthStateChange((_event, session) => { applySupaSession(session); });
}
(function(){
  /* Module Mes documents (ex-Nomenclature client) — boutons + modale */
  const cn=document.getElementById('cdoc-new-btn');
  if(cn) cn.addEventListener('click',()=>openClientDocModal(null));
  const cc=document.getElementById('cdoc-csv-btn');
  if(cc) cc.addEventListener('click',exportClientDocsCSV);
  [['cdoc-view-grille','grille'],['cdoc-view-liste','liste']].forEach(([id,mode])=>{
    const b=document.getElementById(id);
    if(b) b.addEventListener('click',()=>{ if(cdocView===mode) return; cdocView=mode; renderClientDocs(); });
  });
  const cb=document.getElementById('cdoc-m-close');
  if(cb) cb.addEventListener('click',closeClientDocModal);
  bindBackdropClose(document.getElementById('client-doc-overlay'), closeClientDocModal);
  /* Création de projet — bouton(s) « + Nouveau projet » présents sur le
     Tableau de bord ET sur la vue Projets, plus la modale */
  document.querySelectorAll('.new-proj-btn').forEach(b=>b.addEventListener('click',openNewProjectModal));
  const npClose=document.getElementById('newproj-close');
  if(npClose) npClose.addEventListener('click',closeNewProjectModal);
  bindBackdropClose(document.getElementById('newproj-overlay'), closeNewProjectModal);
})();
(function(){ const b=document.getElementById('invite-btn'); if(b) b.addEventListener('click',showInviteForm); })();
(function(){ const b=document.getElementById('task-new-btn'); if(b) b.addEventListener('click',()=>openTaskForm(null)); })();
buildFilterbar();
renderDashboard();
