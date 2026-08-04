/* Notification par courriel d'un commentaire adressé à quelqu'un.
 *
 * Pourquoi une fonction et pas un appel depuis le navigateur : la clé du
 * service d'envoi est un SECRET. Elle vit dans les variables d'environnement
 * Netlify (Site settings → Environment variables), jamais dans le dépôt.
 *
 * Variables attendues :
 *   RESEND_API_KEY  — clé du compte d'envoi (https://resend.com)
 *   NOTIF_FROM      — adresse d'expédition, ex. "L'Atelier <atelier@lilimallette.education>"
 *                     Le domaine doit être vérifié chez Resend, sinon l'envoi
 *                     est refusé pour toute adresse autre que celle du compte.
 *   NOTIF_SITE_URL  — (option) adresse du site, pour le lien dans le courriel.
 *
 * Tant que ces variables sont absentes, la fonction répond 200 en disant
 * pourquoi elle n'a rien envoyé : la pastille dans l'app reste le canal
 * fiable, le courriel n'est qu'un rappel et ne doit jamais faire échouer
 * l'ajout d'un commentaire.
 *
 * Garde-fou : cette adresse est publique. On n'envoie QU'À un courriel déjà
 * présent dans la table team_members — sans quoi n'importe qui pourrait s'en
 * servir pour expédier du courrier à n'importe quelle adresse.
 */

const SUPABASE_URL = 'https://rbcyupofvqhuihssrxwe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FKIOicG3sJW81e1Peo5wIw_5_u6BBjj'; /* clé publiable, lecture seule côté RLS */

const json = (code, obj) => new Response(JSON.stringify(obj), {
  status: code,
  headers: { 'Content-Type': 'application/json' }
});

const echappe = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function courrielsDeLEquipe() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/team_members?select=email`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows.map(x => String(x.email || '').trim().toLowerCase()).filter(Boolean);
}

export default async function handler(req) {
  if (req.method !== 'POST') return json(405, { erreur: 'méthode non permise' });

  let d;
  try { d = await req.json(); } catch (e) { return json(400, { erreur: 'corps illisible' }); }

  const dest = String(d.destinataireCourriel || '').trim().toLowerCase();
  if (!dest) return json(400, { erreur: 'destinataire manquant' });

  const equipe = await courrielsDeLEquipe();
  if (equipe && equipe.indexOf(dest) < 0) {
    return json(403, { erreur: 'ce courriel ne figure pas dans l’équipe' });
  }

  const cle = process.env.RESEND_API_KEY;
  const from = process.env.NOTIF_FROM;
  if (!cle || !from) {
    /* Pas configuré : ce n'est pas une erreur du côté de l'app. */
    return json(200, { envoye: false, motif: 'service d’envoi non configuré (RESEND_API_KEY / NOTIF_FROM)' });
  }

  const site = process.env.NOTIF_SITE_URL || 'https://atelierlilimallette.netlify.app/atelier-lili-mallette.html';
  const auteur = d.auteurNom || 'Quelqu’un';
  const projet = d.projetTitre || 'un projet';
  const texte = String(d.texte || '').slice(0, 2000);

  const html = `
    <div style="font-family:Georgia,serif;font-size:15px;line-height:1.55;color:#2b2b2b;max-width:520px">
      <p style="margin:0 0 14px"><strong>${echappe(auteur)}</strong> t’a adressé un commentaire dans
      <strong>${echappe(projet)}</strong>.</p>
      <blockquote style="margin:0 0 18px;padding:10px 14px;background:#f6f3ee;border-left:3px solid #c0392b;white-space:pre-wrap">${echappe(texte)}</blockquote>
      <p style="margin:0 0 18px"><a href="${echappe(site)}" style="color:#8a4b2a">Ouvrir L’Atelier</a></p>
      <p style="margin:0;font-size:12px;color:#8a8a8a">Tu reçois ce message parce qu’un commentaire t’a été adressé nommément.</p>
    </div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [dest],
      subject: `${auteur} t’a adressé un commentaire — ${projet}`,
      html
    })
  });

  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    return json(200, { envoye: false, motif: 'refus du service d’envoi', detail: detail.slice(0, 300) });
  }
  return json(200, { envoye: true });
}
