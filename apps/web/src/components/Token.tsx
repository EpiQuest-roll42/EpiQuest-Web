import { tokenAccessibleName, tokenInitials, type TokenProps } from './tokenLabels';

export type { TokenHealthState, TokenProps, TokenSide } from './tokenLabels';

export function Token(props: TokenProps) {
  const { side, selected = false, onSelect } = props;
  const name = tokenAccessibleName(props);
  const classes = ['token', `token--${side}`, selected ? 'token--selected' : null]
    .filter(Boolean)
    .join(' ');
  const initials = <span aria-hidden="true">{tokenInitials(props.name)}</span>;

  if (onSelect) {
    return (
      <button
        type="button"
        className={classes}
        aria-label={name}
        aria-pressed={selected}
        onClick={onSelect}
      >
        {initials}
      </button>
    );
  }

  return (
    <span className={classes} role="img" aria-label={selected ? `${name}, sélectionné` : name}>
      {initials}
    </span>
  );
}
