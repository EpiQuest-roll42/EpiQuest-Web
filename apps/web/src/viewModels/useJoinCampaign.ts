import { useLocation } from 'react-router';

export interface JoinCampaignScreenState {
  invitationCode: string;
}

export function useJoinCampaign(): JoinCampaignScreenState {
  const { hash } = useLocation();
  return {
    invitationCode: hash.startsWith('#') ? hash.slice(1) : '',
  };
}
