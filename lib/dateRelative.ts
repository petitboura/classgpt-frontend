const RTF = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

// Formate une date ISO en "il y a X" (ou "hier", "aujourd'hui")
// -- écrit pour l'écran d'accueil (activité récente), potentiellement
// réutilisable ailleurs (historique de chat, bibliothèque...).
export function dateRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60000);

  if (Math.abs(diffMin) < 60) return RTF.format(diffMin, "minute");
  const diffH = Math.round(diffMin / 60);
  if (Math.abs(diffH) < 24) return RTF.format(diffH, "hour");
  const diffJ = Math.round(diffH / 24);
  if (Math.abs(diffJ) < 30) return RTF.format(diffJ, "day");
  const diffMois = Math.round(diffJ / 30);
  return RTF.format(diffMois, "month");
}
