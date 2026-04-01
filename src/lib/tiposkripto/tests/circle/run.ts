// Simple runner for Circle tests
import CircleTest from "./Circle.test.node.js";

async function runCircleTests() {
  console.log("Running Circle tests...");
  try {
    const test = CircleTest;
    console.log("Circle tests initialized successfully");
  } catch (error) {
    console.error("Error running Circle tests:", error);
    process.exit(1);
  }
}

runCircleTests();
