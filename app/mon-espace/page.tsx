import { EspaceClovis } from "@/components/EspaceClovis";

// Correctif (08/08) : rien ne pointait vers /mon-espace nulle part dans
// l'interface -- EspaceClovis (partie 4) existait mais était
// inatteignable. Lien ajouté dans SidebarChatLite.tsx, visible pour
// tout compte connecté depuis le 09/08 (plus de rôle, voir
// EspaceClovis.tsx).
export default function PageMonEspace() {
  return <EspaceClovis />;
}
