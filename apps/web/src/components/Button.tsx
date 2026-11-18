import { Check, LoaderCircle, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary';

type ManagedAttributes = 'children' | 'aria-label' | 'aria-pressed' | 'aria-busy' | 'aria-disabled';

interface CommonButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  ManagedAttributes
> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  pressed?: boolean;
}

interface TextButtonProps extends CommonButtonProps {
  children: ReactNode;
  icon?: LucideIcon;
  label?: never;
}

interface IconOnlyButtonProps extends CommonButtonProps {
  icon: LucideIcon;
  label: string;
  children?: never;
}

export type ButtonProps = TextButtonProps | IconOnlyButtonProps;

export const LOADING_MESSAGE = 'Chargement en cours';

export function Button({
  variant = 'primary',
  isLoading,
  pressed,
  icon,
  label,
  children,
  type = 'button',
  className,
  onClick,
  ...nativeProps
}: ButtonProps) {
  const isIconOnly = label !== undefined;
  const LeadingIcon: LucideIcon | undefined = isLoading
    ? LoaderCircle
    : pressed && !isIconOnly
      ? Check
      : icon;
  const classes = [
    'button',
    `button--${variant}`,
    isIconOnly ? 'button--icon-only' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (isLoading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <>
      <button
        {...nativeProps}
        type={type}
        className={classes}
        aria-label={label}
        aria-pressed={pressed}
        aria-busy={isLoading || undefined}
        aria-disabled={isLoading || undefined}
        onClick={handleClick}
      >
        {LeadingIcon && (
          <LeadingIcon
            className={isLoading ? 'button__icon button__icon--spinning' : 'button__icon'}
            aria-hidden="true"
            size="1em"
          />
        )}
        {children}
      </button>
      {isLoading !== undefined && (
        <span className="visually-hidden" role="status">
          {isLoading ? LOADING_MESSAGE : ''}
        </span>
      )}
    </>
  );
}
