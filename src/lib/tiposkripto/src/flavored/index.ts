// Main export for TypeScript flavored API
export * from './Decorators';
export * from './FluentBuilder';

// Re-export commonly used items
import { given, flavored } from './FluentBuilder';
import { suite, given as givenDecorator, when, then, runSuite } from './Decorators';

export {
  given,
  flavored,
  suite,
  givenDecorator,
  when,
  then,
  runSuite
};

// Default export for easy import
export default {
  given,
  flavored,
  suite,
  givenDecorator,
  when,
  then,
  runSuite
};
