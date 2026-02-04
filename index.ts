// Entry point for the Bun application (TypeScript)
function greet(name: string): string {
    return `Hello, ${name}!`;
}

const message: string = greet("world");
console.log(message);
