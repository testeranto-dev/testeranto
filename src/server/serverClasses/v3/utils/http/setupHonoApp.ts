export function setupHonoApp(): {
  apiRoutePattern: string;
  staticRoutePattern: string;
} {
  return {
    apiRoutePattern: '/~/*',
    staticRoutePattern: '/*',
  };
}
