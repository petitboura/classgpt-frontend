// Class GPT — squelette (partie 1).
//
// Cette page est un point de jonction temporaire, pas l'écran final.
// Rappel du parcours voulu par Bourama : à terme, cette route doit
// rediriger directement soit vers l'écran de connexion (partie 2) si
// personne n'est connecté, soit directement dans le chat (partie 3) si
// une session existe déjà — jamais de page de présentation publique,
// jamais de mention "établissement"/"école"/Djiguignè.
export default function PageAccueil() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-dj-fond px-6 text-center">
      <div className="animate-dj-fade-in space-y-3">
        <h1 className="font-display text-2xl font-bold text-dj-texte">Class GPT</h1>
        <p className="text-sm text-dj-texte-muet">
          Squelette du projet — connexion (partie 2) et chat (partie 3) à
          brancher ici.
        </p>
      </div>
    </main>
  );
}
