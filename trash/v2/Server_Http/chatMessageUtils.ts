export async function handleAddChatMessageUtil(
  request: Request,
  graphManager: any
): Promise<Response> {
  try {
    const body = await request.json();
    const { agentName, content } = body;

    if (!agentName || !content) {
      return new Response(JSON.stringify({
        error: 'Missing agentName or content parameter',
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    graphManager.addChatMessage(agentName, content);

    return new Response(JSON.stringify({
      success: true,
      agentName,
      message: 'Chat message added',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('[Server_HTTP] Error in handleAddChatMessage:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
