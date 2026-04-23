/**
 * Handle an HTTP request
 */
export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  if (url.pathname === '/') {
    return new Response('Server V3 is running', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Not Found', { status: 404 });
}
