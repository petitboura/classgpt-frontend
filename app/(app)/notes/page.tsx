import { EspaceNotes } from "@/components/EspaceNotes";

// Notes (refonte "vraiment comme Notion", 21/08/2026, demande explicite
// de Bourama). Sort volontairement du conteneur commun SectionPage
// (largeur limitée + titre au-dessus, utilisé par les 6 autres
// sections) pour occuper tout l'espace disponible -- sidebar + canevas
// plein, exactement comme Notion. C'est une décision UX explicite :
// ne PAS remettre SectionPage ici sans lui redemander d'abord.
export default function PageNotes() {
  return <EspaceNotes />;
}
