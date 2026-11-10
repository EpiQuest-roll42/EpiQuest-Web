export type RouteHandle = {
  title: string;
};

export function isRouteHandle(value: unknown): value is RouteHandle {
  return (
    typeof value === 'object' &&
    value !== null &&
    'title' in value &&
    typeof value.title === 'string'
  );
}
