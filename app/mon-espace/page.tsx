import { EspaceClassGPT } from "@/components/EspaceClassGPT";

// Correctif (08/08) : rien ne pointait vers /mon-espace nulle part dans
// l'interface -- EspaceClassGPT (partie 4) existait mais était
// inatteignable. Lien ajouté dans SidebarChatLite.tsx, visible pour
// tout compte connecté depuis le 09/08 (plus de rôle, voir
// EspaceClassGPT.tsx).
export default function PageMonEspace() {
  return <EspaceClassGPT />;
}
