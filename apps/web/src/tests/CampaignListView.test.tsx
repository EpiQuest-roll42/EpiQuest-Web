import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CampaignListView } from '../views/CampaignListView';
import { useCampaignList, type CampaignListScreenState } from '../viewModels/useCampaignList';
import { campaignSummary } from './campaignListFixtures';

vi.mock('../viewModels/useCampaignList', () => ({
  useCampaignList: vi.fn(),
}));

const mockedUseCampaignList = vi.mocked(useCampaignList);

function createScreenState(
  overrides: Partial<CampaignListScreenState> = {},
): CampaignListScreenState {
  return {
    campaigns: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    refresh: vi.fn(async () => {}),
    ...overrides,
  };
}

describe('CampaignListView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the loading state from the ViewModel', () => {
    mockedUseCampaignList.mockReturnValue(createScreenState({ isLoading: true }));

    render(<CampaignListView />);

    expect(screen.getByRole('status')).toHaveTextContent('Chargement des campagnes');
  });

  it('keeps the status region present and announces loaded campaigns', () => {
    mockedUseCampaignList.mockReturnValue(
      createScreenState({ campaigns: [{ ...campaignSummary, playerCount: 1 }] }),
    );

    render(<CampaignListView />);

    expect(screen.getByRole('status')).toHaveTextContent('1 campagne chargée');
    expect(screen.getByText('Maître du jeu · 1 joueur')).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    mockedUseCampaignList.mockReturnValue(createScreenState());

    render(<CampaignListView />);

    expect(screen.getByText('Aucune campagne pour le moment.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Aucune campagne chargée');
  });

  it('keeps focus on the retry button until success, then focuses the heading', async () => {
    const user = userEvent.setup();
    const state = createScreenState({ error: 'Chargement impossible.' });
    mockedUseCampaignList.mockReturnValue(state);

    const { rerender } = render(<CampaignListView />);
    expect(screen.getByRole('alert')).toHaveTextContent('Chargement impossible.');

    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(state.refresh).toHaveBeenCalledOnce();

    mockedUseCampaignList.mockReturnValue(
      createScreenState({ error: 'Chargement impossible.', isRefreshing: true }),
    );
    rerender(<CampaignListView />);
    const retryButton = screen.getByRole('button', { name: 'Nouvelle tentative…' });
    expect(retryButton).toHaveAttribute('aria-disabled', 'true');
    expect(retryButton).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(state.refresh).toHaveBeenCalledOnce();

    mockedUseCampaignList.mockReturnValue(createScreenState({ campaigns: [campaignSummary] }));
    rerender(<CampaignListView />);
    expect(screen.getByRole('heading', { name: 'Mes campagnes' })).toHaveFocus();
  });

  it('announces an active retry without disabling the retry button', () => {
    mockedUseCampaignList.mockReturnValue(
      createScreenState({ error: 'Chargement impossible.', isRefreshing: true }),
    );

    render(<CampaignListView />);

    expect(screen.getByRole('status')).toHaveTextContent('Nouvelle tentative en cours');
    expect(screen.getByRole('button', { name: 'Nouvelle tentative…' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('renders campaign data from the ViewModel', () => {
    mockedUseCampaignList.mockReturnValue(createScreenState({ campaigns: [campaignSummary] }));

    render(<CampaignListView />);

    expect(screen.getByRole('heading', { name: 'La Mine perdue' })).toBeInTheDocument();
    expect(screen.getByText('Maître du jeu · 2 joueurs')).toBeInTheDocument();
  });
});
