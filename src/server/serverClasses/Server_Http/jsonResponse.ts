export const jsonResponse = (data: any, status = 200): Response => {
  const responseData = {
    ...data,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(responseData, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
