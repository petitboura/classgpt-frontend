import { EspaceClassGPT } from "@/components/EspaceClassGPT";

// Correctif (08/08) : rien ne pointait vers /mon-espace nulle part dans
// l'interface -- EspaceClassGPT (partie 4) existait mais était
// inatteignable. Lien ajouté dans SidebarChatLite.tsx (établissement et
// enseignant uniquement, un étudiant n'a rien à y faire -- voir le
// commentaire en tête de EspaceClassGPT.tsx).
export default function PageMonEspace() {
  return <EspaceClassGPT />;
}
