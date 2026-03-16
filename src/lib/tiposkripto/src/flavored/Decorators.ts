// Decorator implementation for TypeScript flavored API

// Suite decorator
export function suite(name: string) {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      static suiteName = name;
      static isTestSuite = true;
      
      // Collect test metadata
      static tests: Array<{
        given: string;
        when?: string;
        then?: string;
        method: string;
        args?: any[];
      }> = [];
    };
  };
}

// Given decorator
export function given(description: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const constructor = target.constructor;
    
    if (!constructor.tests) {
      constructor.tests = [];
    }
    
    constructor.tests.push({
      given: description,
      method: propertyKey
    });
    
    return descriptor;
  };
}

// When decorator
export function when(description: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const constructor = target.constructor;
    
    if (!constructor.tests) {
      constructor.tests = [];
    }
    
    // Find the last test (which should be a Given) and add When to it
    const lastTest = constructor.tests[constructor.tests.length - 1];
    if (lastTest) {
      lastTest.when = description;
    }
    
    return descriptor;
  };
}

// Then decorator
export function then(description: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const constructor = target.constructor;
    
    if (!constructor.tests) {
      constructor.tests = [];
    }
    
    // Find the last test (which should have Given and possibly When) and add Then to it
    const lastTest = constructor.tests[constructor.tests.length - 1];
    if (lastTest) {
      lastTest.then = description;
    }
    
    return descriptor;
  };
}

// Helper to run a decorated test suite
export async function runSuite(testClass: any) {
  const instance = new testClass();
  const results = [];
  
  for (const test of testClass.tests || []) {
    try {
      // Execute Given
      await instance[test.method]();
      
      results.push({
        given: test.given,
        when: test.when,
        then: test.then,
        passed: true
      });
    } catch (error) {
      results.push({
        given: test.given,
        when: test.when,
        then: test.then,
        passed: false,
        error
      });
    }
  }
  
  return {
    suiteName: testClass.suiteName,
    tests: results,
    passed: results.every(r => r.passed)
  };
}
