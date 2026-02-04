# Hello World Bun Project (TypeScript)

This is a simple Bun project written in TypeScript that prints "hello world" to the console.

## Getting Started

Make sure you have [Bun](https://bun.sh) installed on your system.

### Installation

Install dependencies (includes TypeScript types for Bun):

```bash
bun install
```

### Running the Project

To run the project, use one of the following commands:

```bash
bun run index.ts
```

or

```bash
npm start
```

For development with watch mode:

```bash
bun run dev
```

### Expected Output

When you run the server, you'll see:

```
Server running at http://localhost:3000
Endpoints:
  GET  /      - Welcome message
  GET  /about - About page
  GET  /json  - JSON response
  POST /echo  - Echo back request body
```

## Project Structure

- `index.ts` - Main TypeScript entry point implementing an HTTP server
- `package.json` - Project configuration
- `tsconfig.json` - TypeScript configuration

## TypeScript

This project uses TypeScript with Bun's built-in TypeScript support. No separate compilation step is needed—Bun runs TypeScript files directly. The server demonstrates routing, different response types (plain text, JSON), and error handling.

## Testing the Server

Once the server is running, you can test it using:

```bash
# GET request to root
curl http://localhost:3000/

# GET request to /about
curl http://localhost:3000/about

# GET request to /json
curl http://localhost:3000/json

# POST request to /echo
curl -X POST -d "Hello server" http://localhost:3000/echo
```

## License

MIT
