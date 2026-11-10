import { useJoinCampaign } from '../viewModels/useJoinCampaign';

export function JoinCampaignView() {
  const { invitationCode } = useJoinCampaign();

  return (
    <>
      <h1 tabIndex={-1}>Rejoindre une campagne</h1>
      {invitationCode === '' ? (
        <p>Aucun code d’invitation fourni.</p>
      ) : (
        <p>
          Code d’invitation : <code>{invitationCode}</code>
        </p>
      )}
    </>
  );
}
