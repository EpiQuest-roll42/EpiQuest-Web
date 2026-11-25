export type TokenSide = 'ally' | 'enemy';

export type TokenHealthState = 'unharmed' | 'wounded' | 'down';

interface CommonTokenProps {
  name: string;
  side: TokenSide;
  selected?: boolean;
  onSelect?: () => void;
}

interface CharacterTokenProps extends CommonTokenProps {
  kind: 'character';
  hitPoints: { current: number; max: number };
  healthState?: never;
}

interface CreatureTokenProps extends CommonTokenProps {
  kind: 'creature';
  healthState: TokenHealthState;
  hitPoints?: never;
}

export type TokenProps = CharacterTokenProps | CreatureTokenProps;

const SIDE_LABELS: Record<TokenSide, string> = { ally: 'allié', enemy: 'ennemi' };

const HEALTH_LABELS: Record<TokenHealthState, string> = {
  unharmed: 'indemne',
  wounded: 'blessé',
  down: 'à terre',
};

export function tokenInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0] ?? '';
  const last = words[words.length - 1] ?? '';
  const letters =
    words.length > 1
      ? [...first].slice(0, 1).concat([...last].slice(0, 1))
      : [...first].slice(0, 2);
  return letters.join('').toLocaleUpperCase('fr');
}

export function tokenAccessibleName(token: TokenProps): string {
  const state =
    token.kind === 'character'
      ? `${token.hitPoints.current} PV sur ${token.hitPoints.max}`
      : HEALTH_LABELS[token.healthState];
  return `${token.name}, ${SIDE_LABELS[token.side]}, ${state}`;
}
