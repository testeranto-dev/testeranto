// Basic HTTP server using Bun
const server = Bun.serve({
  port: 3000,
  fetch(request) {
    const url = new URL(request.url);
    
    // Handle different routes
    if (url.pathname === "/") {
      return new Response("Hello, World! Welcome to the Bun HTTP server.", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    
    if (url.pathname === "/about") {
      return new Response("This is a simple HTTP server built with Bun and TypeScript.", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    
    if (url.pathname === "/json") {
      return Response.json({
        message: "Hello from JSON endpoint!",
        timestamp: new Date().toISOString(),
        method: request.method,
        path: url.pathname,
      });
    }
    
    // Handle POST requests to /echo
    if (url.pathname === "/echo" && request.method === "POST") {
      return request.text().then(text => {
        return new Response(`You sent: ${text}`, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      });
    }
    
    // 404 for other routes
    return new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    });
  },
  error(error) {
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
console.log("Endpoints:");
console.log("  GET  /      - Welcome message");
console.log("  GET  /about - About page");
console.log("  GET  /json  - JSON response");
console.log("  POST /echo  - Echo back request body");
