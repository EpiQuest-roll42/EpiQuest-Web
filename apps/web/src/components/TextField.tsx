import { CircleAlert } from 'lucide-react';
import { useId, type InputHTMLAttributes } from 'react';

type ManagedAttributes =
  | 'id'
  | 'type'
  | 'value'
  | 'onChange'
  | 'required'
  | 'placeholder'
  | 'children'
  | 'aria-invalid'
  | 'aria-describedby'
  | 'aria-label'
  | 'aria-labelledby';

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  ManagedAttributes
> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';
  required?: boolean;
  help?: string;
  error?: string | null;
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  help,
  error,
  className,
  ...nativeProps
}: TextFieldProps) {
  const id = useId();
  const helpId = `${id}-aide`;
  const errorId = `${id}-erreur`;
  const describedBy =
    [help ? helpId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  const classes = ['field', error ? 'field--invalid' : null, className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            {' '}
            (obligatoire)
          </span>
        )}
      </label>
      <input
        {...nativeProps}
        id={id}
        className="field__input"
        type={type}
        value={value}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
      {help && (
        <p id={helpId} className="field__help">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="field__error">
          <CircleAlert className="field__error-icon" aria-hidden="true" size="1em" />
          {error}
        </p>
      )}
    </div>
  );
}
