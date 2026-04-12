export function handleUserAgentsRouteUtil(configs: any): Response {
    try {
        const agents = configs.agents || {};
        const agentList = Object.entries(agents).map(([key, value]) => ({
            key,
            load: (value as any).load || [],
            message: (value as any).message || '',
            hasSliceFunction: typeof (value as any).sliceFunction === 'function'
        }));

        return new Response(JSON.stringify({
            agents: agentList,
            count: agentList.length,
            timestamp: new Date().toISOString()
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        console.error('[handleUserAgentsRouteUtil] Error:', error);
        return new Response(JSON.stringify({
            error: "Failed to get user agents",
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
