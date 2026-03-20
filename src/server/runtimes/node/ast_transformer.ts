// AST Transformer for JavaScript/TypeScript tests
// Provides bidirectional transformation between Testeranto and other test frameworks

import * as fs from 'fs';
import * as path from 'path';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

export class NodeASTTransformer {
  
  /**
   * Import: Transform external test framework tests to Testeranto
   */
  static importToTesteranto(filePath: string, framework: string): string {
    const source = fs.readFileSync(filePath, 'utf-8');
    const ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    // Extract test structure
    const testStructure = this.extractTestStructure(ast, framework);
    
    // Generate Testeranto code
    return this.generateTesterantoFromStructure(testStructure, filePath, framework);
  }

  /**
   * Export: Transform Testeranto tests to external test framework
   */
  static exportFromTesteranto(filePath: string, targetFramework: string): string {
    const source = fs.readFileSync(filePath, 'utf-8');
    const ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    // Extract Testeranto structure
    const testerantoStructure = this.extractTesterantoStructure(ast);
    
    // Generate target framework code
    return this.generateFrameworkFromTesteranto(testerantoStructure, targetFramework, filePath);
  }

  /**
   * Extract test structure from AST
   */
  private static extractTestStructure(ast: parser.ParseResult<t.File>, framework: string): any {
    const structure = {
      suites: [] as any[],
      imports: [] as string[]
    };

    traverse(ast, {
      ImportDeclaration(path) {
        structure.imports.push(generate(path.node).code);
      },
      
      CallExpression(path) {
        const callee = path.node.callee;
        
        // Find describe blocks
        if (t.isIdentifier(callee) && callee.name === 'describe') {
          const suiteName = path.node.arguments[0];
          const suiteBody = path.node.arguments[1];
          
          if (t.isStringLiteral(suiteName) && t.isFunctionExpression(suiteBody)) {
            const suite = {
              name: suiteName.value,
              tests: [] as any[],
              hooks: [] as any[]
            };
            
            // Traverse suite body
            traverse(suiteBody, {
              CallExpression(innerPath) {
                const innerCallee = innerPath.node.callee;
                
                if (t.isIdentifier(innerCallee)) {
                  // Test cases
                  if (innerCallee.name === 'it' || innerCallee.name === 'test') {
                    const testName = innerPath.node.arguments[0];
                    const testBody = innerPath.node.arguments[1];
                    
                    if (t.isStringLiteral(testName) && t.isFunctionExpression(testBody)) {
                      suite.tests.push({
                        name: testName.value,
                        body: generate(testBody).code,
                        type: innerCallee.name
                      });
                    }
                  }
                  // Hooks
                  else if (['beforeEach', 'afterEach', 'beforeAll', 'afterAll'].includes(innerCallee.name)) {
                    const hookBody = innerPath.node.arguments[0];
                    if (t.isFunctionExpression(hookBody)) {
                      suite.hooks.push({
                        type: innerCallee.name,
                        body: generate(hookBody).code
                      });
                    }
                  }
                }
              }
            }, path.scope);
            
            structure.suites.push(suite);
          }
        }
      }
    });

    return structure;
  }

  /**
   * Extract Testeranto structure from AST
   */
  private static extractTesterantoStructure(ast: parser.ParseResult<t.File>): any {
    const structure = {
      suites: [] as any[],
      imports: [] as string[]
    };

    traverse(ast, {
      ImportDeclaration(path) {
        structure.imports.push(generate(path.node).code);
      },
      
      CallExpression(path) {
        const callee = path.node.callee;
        
        // Look for Suite calls
        if (t.isIdentifier(callee) && callee.name === 'Suite') {
          const suiteName = path.node.arguments[0];
          const suiteBody = path.node.arguments[1];
          
          if (t.isStringLiteral(suiteName) && t.isObjectExpression(suiteBody)) {
            const suite = {
              name: suiteName.value,
              tests: [] as any[]
            };
            
            // Extract tests from suite body
            suiteBody.properties.forEach(prop => {
              if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                const testName = prop.key.name;
                const testValue = prop.value;
                
                if (t.isCallExpression(testValue) && t.isIdentifier(testValue.callee) && 
                    testValue.callee.name === 'Given') {
                  
                  const givenArgs = testValue.arguments;
                  if (givenArgs.length >= 3) {
                    const features = givenArgs[0];
                    const whens = givenArgs[1];
                    const thens = givenArgs[2];
                    
                    suite.tests.push({
                      name: testName,
                      features: this.extractArrayLiteral(features),
                      whens: this.extractArrayLiteral(whens),
                      thens: this.extractArrayLiteral(thens)
                    });
                  }
                }
              }
            });
            
            structure.suites.push(suite);
          }
        }
      }
    });

    return structure;
  }

  /**
   * Extract array literal values
   */
  private static extractArrayLiteral(node: t.Node): any[] {
    if (t.isArrayExpression(node)) {
      return node.elements.map(elem => {
        if (t.isStringLiteral(elem)) return elem.value;
        if (t.isCallExpression(elem)) return generate(elem).code;
        return null;
      }).filter(Boolean);
    }
    return [];
  }

  /**
   * Generate Testeranto code from test structure
   */
  private static generateTesterantoFromStructure(structure: any, filePath: string, sourceFramework: string): string {
    const suiteCode = structure.suites.map((suite: any) => {
      const testsCode = suite.tests.map((test: any) => {
        return `    "${test.name}": Given(
      ["${test.name}"],
      [When("${test.name}", (store) => {
        ${test.body}
        return store;
      })],
      [Then("verify ${test.name}", async (store) => {
        // Assertions would be here
        return store;
      })]
    )`;
      }).join(',\n');

      return `  Suite("${suite.name}", {
${testsCode}
  })`;
    }).join(',\n');

    return `// Generated by Testeranto AST Transformer
// Source: ${filePath}
// Framework: ${sourceFramework}

import { Suite, Given, When, Then } from 'tiposkripto';

const specification = (Suite, Given, When, Then) => [
${suiteCode}
];

export default specification;`;
  }

  /**
   * Generate framework code from Testeranto structure
   */
  private static generateFrameworkFromTesteranto(structure: any, targetFramework: string, filePath: string): string {
    const imports = structure.imports.filter((imp: string) => !imp.includes('tiposkripto'));
    
    if (targetFramework === 'jest') {
      imports.push("import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';");
    } else if (targetFramework === 'mocha') {
      imports.push("import { describe, it } from 'mocha';");
      imports.push("import { expect } from 'chai';");
    } else if (targetFramework === 'vitest') {
      imports.push("import { describe, it, expect, beforeEach, afterEach } from 'vitest';");
    } else if (targetFramework === 'jasmine') {
      imports.push("import { describe, it, expect, beforeEach, afterEach } from 'jasmine';");
    }

    const suitesCode = structure.suites.map((suite: any) => {
      const testsCode = suite.tests.map((test: any) => {
        // Convert Testeranto test to framework test
        const testBody = this.convertTesterantoTestToFramework(test, targetFramework);
        return `  it('${test.name}', () => {
    ${testBody}
  });`;
      }).join('\n\n');

      return `describe('${suite.name}', () => {
${testsCode}
});`;
    }).join('\n\n');

    return `${imports.join('\n')}

${suitesCode}`;
  }

  /**
   * Convert Testeranto test to framework test
   */
  private static convertTesterantoTestToFramework(test: any, framework: string): string {
    // Extract actions from Whens
    const actions = test.whens.map((when: string) => {
      // Parse the When call to extract the action
      if (when.includes('When(')) {
        // Extract the function body
        const match = when.match(/When\([^,]+,\s*(\([^)]+\)|[^,]+)\s*=>\s*{([^}]+)}/);
        if (match) {
          return match[2].trim();
        }
      }
      return '// Action';
    }).join('\n    ');

    // Extract assertions from Thens
    const assertions = test.thens.map((then: string) => {
      if (framework === 'jest' || framework === 'vitest') {
        return 'expect(true).toBe(true); // TODO: Convert assertion';
      } else if (framework === 'mocha') {
        return 'expect(true).to.be.true; // TODO: Convert assertion';
      } else if (framework === 'jasmine') {
        return 'expect(true).toBe(true); // TODO: Convert assertion';
      }
      return '// Assertion';
    }).join('\n    ');

    return `${actions}
    ${assertions}`;
  }

  /**
   * Detect the test framework from file content
   */
  static detectFramework(filePath: string): string {
    const source = fs.readFileSync(filePath, 'utf-8');
    
    if (source.includes('jest') || source.includes('@jest/')) {
      return 'jest';
    } else if (source.includes('vitest') || source.includes('@vitest/')) {
      return 'vitest';
    } else if (source.includes('mocha')) {
      return 'mocha';
    } else if (source.includes('jasmine')) {
      return 'jasmine';
    } else if (source.includes('describe(') && source.includes('it(')) {
      return 'mocha'; // Default assumption
    }
    
    return 'unknown';
  }

  /**
   * Create a bidirectional pairing between Testeranto and framework tests
   */
  static createPairing(filePath: string, framework: string): Map<string, string> {
    const pairing = new Map<string, string>();
    const source = fs.readFileSync(filePath, 'utf-8');
    const ast = parser.parse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        
        if (t.isIdentifier(callee)) {
          if (callee.name === 'describe') {
            const suiteName = path.node.arguments[0];
            if (t.isStringLiteral(suiteName)) {
              pairing.set(`${framework}:${suiteName.value}`, `testeranto:${suiteName.value}`);
            }
          } else if (callee.name === 'Suite') {
            const suiteName = path.node.arguments[0];
            if (t.isStringLiteral(suiteName)) {
              pairing.set(`testeranto:${suiteName.value}`, `${framework}:${suiteName.value}`);
            }
          }
        }
      }
    });

    return pairing;
  }
}
