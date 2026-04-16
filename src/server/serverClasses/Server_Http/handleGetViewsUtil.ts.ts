export function handleGetViewsUtil(configs: any): Response {
  try {
    const views = configs.views || {};
    const viewList = Object.entries(views).map(([key, value]) => ({
      key,
      path: (value as any).filePath || value,
      type: 'view'
    }));

    return new Response(JSON.stringify({
      views: viewList,
      count: viewList.length,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error('[handleGetViewsUtil] Error:', error);
    return new Response(JSON.stringify({
      error: "Failed to get views",
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

