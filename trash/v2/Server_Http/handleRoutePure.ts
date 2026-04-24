export const handleRoutePure = (
  routeName: string,
  request: Request,
  url: URL,
  server: any,
): Response => {
  // Return a 404 response for any routes not handled by the unified API
  return new Response(JSON.stringify({
    error: `Route not found: ${routeName}`,
    message: 'This endpoint is not available in the unified API',
    timestamp: new Date().toISOString()
  }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
};
