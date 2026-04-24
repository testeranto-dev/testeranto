export function handleChatRouteUtil(): Response {
    return new Response(JSON.stringify({
        message: "Chat route is not implemented",
        timestamp: new Date().toISOString()
    }), {
        status: 501,
        headers: { "Content-Type": "application/json" }
    });
}
