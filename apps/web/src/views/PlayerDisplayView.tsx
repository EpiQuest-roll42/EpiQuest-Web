import { usePlayerDisplay } from '../viewModels/usePlayerDisplay';

export function PlayerDisplayView() {
  const { hasToken } = usePlayerDisplay();

  return (
    <>
      <h1 tabIndex={-1}>Vue joueurs</h1>
      {!hasToken ? (
        <p>Ouvrez la vue depuis l’écran du maître du jeu pour afficher la partie.</p>
      ) : null}
    </>
  );
}
