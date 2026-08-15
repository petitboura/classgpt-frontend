import { redirect } from "next/navigation";

// Ancienne route (page à onglets EspaceClovis.tsx, remplacée par les 7
// routes dédiées sous app/(app)/). Conservée en redirect uniquement pour
// ne pas casser un lien ou favori existant vers /mon-espace -- pointe
// vers "Bureau", premier onglet de l'ancienne page.
export default function PageMonEspace() {
  redirect("/bureau");
}
