import { useEffect, useRef } from 'react';
import { useCampaignList } from '../viewModels/useCampaignList';

export function CampaignListView() {
  const { campaigns, isLoading, isRefreshing, error, refresh } = useCampaignList();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const retryWasActive = useRef(false);
  const statusMessage = isLoading
    ? 'Chargement des campagnes…'
    : isRefreshing
      ? 'Nouvelle tentative en cours…'
      : error === null
        ? campaigns.length === 0
          ? 'Aucune campagne chargée'
          : `${campaigns.length} ${campaigns.length === 1 ? 'campagne chargée' : 'campagnes chargées'}`
        : '';

  useEffect(() => {
    if (isRefreshing) {
      retryWasActive.current = true;
      return;
    }

    if (retryWasActive.current) {
      retryWasActive.current = false;
      if (error === null) {
        headingRef.current?.focus();
      }
    }
  }, [error, isRefreshing]);

  function handleRetry() {
    if (isRefreshing) {
      return;
    }
    void refresh();
  }

  return (
    <main>
      <h1 ref={headingRef} tabIndex={-1}>
        Mes campagnes
      </h1>
      <p role="status" aria-live="polite">
        {statusMessage}
      </p>
      {error !== null ? (
        <section role="alert">
          <p>{error}</p>
          <button type="button" onClick={handleRetry} aria-disabled={isRefreshing}>
            {isRefreshing ? 'Nouvelle tentative…' : 'Réessayer'}
          </button>
        </section>
      ) : null}
      {!isLoading && error === null && campaigns.length === 0 ? (
        <p>Aucune campagne pour le moment.</p>
      ) : null}
      {!isLoading && error === null && campaigns.length > 0 ? (
        <ul aria-label="Liste des campagnes">
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              <article>
                <h2>{campaign.name}</h2>
                <p>
                  {campaign.myRole === 'gm' ? 'Maître du jeu' : 'Joueur'} · {campaign.playerCount}{' '}
                  {campaign.playerCount === 1 ? 'joueur' : 'joueurs'}
                </p>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
