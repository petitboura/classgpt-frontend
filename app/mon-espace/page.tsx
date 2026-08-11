import { EspaceClovis } from "@/components/EspaceClovis";

// Correctif (08/08) : rien ne pointait vers /mon-espace nulle part dans
// l'interface -- EspaceClovis (partie 4) existait mais était
// inatteignable. Lien ajouté dans SidebarChatLite.tsx (établissement et
// enseignant uniquement, un étudiant n'a rien à y faire -- voir le
// commentaire en tête de EspaceClovis.tsx).
export default function PageMonEspace() {
  return <EspaceClovis />;
}
