import { Outlet, NavLink, Link } from 'react-router';

export function AppLayout() {
  return (
    <>
      <a href="#contenu-principal" className="skip-link">
        Aller au contenu
      </a>

      <header>
        <Link to="/campagnes">Lanterne</Link>
      </header>

      <nav aria-label="Navigation principale">
        <ul>
          <li>
            <NavLink to="/campagnes">Mes campagnes</NavLink>
          </li>
          <li>
            <NavLink to="/rejoindre">Rejoindre une campagne</NavLink>
          </li>
        </ul>
      </nav>

      <main id="contenu-principal" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  );
}
