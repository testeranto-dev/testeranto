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

```
Hello, world!
```

## Project Structure

- `index.ts` - Main TypeScript entry point with type annotations
- `package.json` - Project configuration
- `tsconfig.json` - TypeScript configuration

## TypeScript

This project uses TypeScript with Bun's built-in TypeScript support. No separate compilation step is needed—Bun runs TypeScript files directly. The example demonstrates TypeScript features like type annotations and string templates.

## License

MIT
