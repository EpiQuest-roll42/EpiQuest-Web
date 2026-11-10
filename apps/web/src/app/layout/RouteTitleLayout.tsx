import { Outlet } from 'react-router';
import { DocumentTitleManager } from './AppLayout';

export function RouteTitleLayout() {
  return (
    <>
      <DocumentTitleManager />
      <Outlet />
    </>
  );
}
