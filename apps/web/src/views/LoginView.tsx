import { useLogin } from '../viewModels/useLogin';

export function LoginView() {
  const { error } = useLogin();

  return (
    <>
      <h1 tabIndex={-1}>Connexion</h1>
      {error !== null ? <p role="alert">{error}</p> : null}
    </>
  );
}
