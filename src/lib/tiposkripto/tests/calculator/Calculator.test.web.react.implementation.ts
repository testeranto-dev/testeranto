import { assert } from "chai";
import type { ITestImplementation } from "../../src/CoreTypes";
import type { ICalculatorWebReact, O, M } from "./Calculator.test.types";

export const implementation: ITestImplementation<ICalculatorWebReact, O, M> = {
  suites: {
    Default: { description: "React test suite for Calculator" },
  },

  givens: {
    Default: () => {
      return {
        props: { initialValue: "" },
      };
    },
    WithInitialValue: (initialValue: string) => () => {
      return {
        props: { initialValue },
      };
    },
  },

  whens: {
    press: (button: string) => async (store: any, testResource: any, artifactory: any) => {
      console.log(`[Test Implementation] press: clicking button "${button}"`);
      const { htmlElement } = store;
      // Find and click the button
      const buttons = htmlElement.querySelectorAll('button');
      console.log(`[Test Implementation] Found ${buttons.length} buttons`);
      let clicked = false;
      for (const btn of buttons) {
        if (btn.textContent === button) {
          console.log(`[Test Implementation] Clicking button with text: "${btn.textContent}"`);
          btn.click();
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        console.error(`[Test Implementation] Button "${button}" not found`);
      }
      // Wait longer for React to re-render
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log(`[Test Implementation] press: completed`);
      // Return the store with updated htmlElement reference
      return { ...store, htmlElement };
    },
    enter: () => async (store: any, testResource: any, artifactory: any) => {
      console.log(`[Test Implementation] enter: pressing enter (=)`);
      const { htmlElement } = store;
      // Find and click the = button
      const buttons = htmlElement.querySelectorAll('button');
      let clicked = false;
      for (const btn of buttons) {
        if (btn.textContent === '=') {
          console.log(`[Test Implementation] Clicking = button`);
          btn.click();
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        console.error(`[Test Implementation] = button not found`);
      }
      // Wait longer for React to re-render
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log(`[Test Implementation] enter: completed`);
      return { ...store, htmlElement };
    },
    memoryStore: () => async (store: any, testResource: any, artifactory: any) => {
      console.log(`[Test Implementation] memoryStore: pressing MS`);
      const { htmlElement } = store;
      // Find and click the MS button
      const buttons = htmlElement.querySelectorAll('button');
      let clicked = false;
      for (const btn of buttons) {
        if (btn.textContent === 'MS') {
          console.log(`[Test Implementation] Clicking MS button`);
          btn.click();
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        console.error(`[Test Implementation] MS button not found`);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      return { ...store, htmlElement };
    },
    memoryRecall: () => async (store: any, testResource: any, artifactory: any) => {
      console.log(`[Test Implementation] memoryRecall: pressing MR`);
      const { htmlElement } = store;
      // Find and click the MR button
      const buttons = htmlElement.querySelectorAll('button');
      let clicked = false;
      for (const btn of buttons) {
        if (btn.textContent === 'MR') {
          console.log(`[Test Implementation] Clicking MR button`);
          btn.click();
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        console.error(`[Test Implementation] MR button not found`);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      return { ...store, htmlElement };
    },
    memoryClear: () => async (store: any, testResource: any, artifactory: any) => {
      console.log(`[Test Implementation] memoryClear: pressing MC`);
      const { htmlElement } = store;
      // Find and click the MC button
      const buttons = htmlElement.querySelectorAll('button');
      let clicked = false;
      for (const btn of buttons) {
        if (btn.textContent === 'MC') {
          console.log(`[Test Implementation] Clicking MC button`);
          btn.click();
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        console.error(`[Test Implementation] MC button not found`);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      return { ...store, htmlElement };
    },
    memoryAdd: () => async (store: any, testResource: any, artifactory: any) => {
      console.log(`[Test Implementation] memoryAdd: pressing M+`);
      const { htmlElement } = store;
      // Find and click the M+ button
      const buttons = htmlElement.querySelectorAll('button');
      let clicked = false;
      for (const btn of buttons) {
        if (btn.textContent === 'M+') {
          console.log(`[Test Implementation] Clicking M+ button`);
          btn.click();
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        console.error(`[Test Implementation] M+ button not found`);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      return { ...store, htmlElement };
    },
    clear: () => async (store: any, testResource: any, artifactory: any) => {
      console.log(`[Test Implementation] clear: pressing C`);
      const { htmlElement } = store;
      // Find and click the C button
      const buttons = htmlElement.querySelectorAll('button');
      let clicked = false;
      for (const btn of buttons) {
        if (btn.textContent === 'C') {
          console.log(`[Test Implementation] Clicking C button`);
          btn.click();
          clicked = true;
          break;
        }
      }
      if (!clicked) {
        console.error(`[Test Implementation] C button not found`);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
      return { ...store, htmlElement };
    },
  },

  thens: {
    displayIs: (expected: string) => async (store: any, testResource: any, artifactory: any) => {
      console.log(`[Test Implementation] displayIs: checking if display equals "${expected}"`);
      const { htmlElement } = store;

      // Wait a bit more to ensure React has updated
      await new Promise(resolve => setTimeout(resolve, 200));

      // Try multiple selectors to find the display
      let display = null;
      const selectors = [
        '[style*="displayValue"]',
        'div[style*="display"]',
        '.calculator div',
        '#root > div > div',
        'div'
      ];

      for (const selector of selectors) {
        const elements = htmlElement.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent || el.innerText;
          // Look for an element that looks like a calculator display (contains numbers, operators, etc.)
          if (text && text.trim().length > 0) {
            // Check if it's likely a display (contains calculator-like content)
            if (text.match(/[\d\+\-\*\/\.\(\)C=]/) || text === expected) {
              display = el;
              console.log(`[Test Implementation] Found display with selector "${selector}": "${text}"`);
              break;
            }
          }
        }
        if (display) break;
      }

      if (!display) {
        console.error('[Test Implementation] Display element not found');
        // Log all divs for debugging
        const allDivs = htmlElement.querySelectorAll('div');
        console.log(`[Test Implementation] All divs found: ${allDivs.length}`);
        allDivs.forEach((div, i) => {
          console.log(`[Test Implementation] Div ${i}: ${div.textContent?.substring(0, 50)}`);
        });
        throw new Error('Display element not found');
      }

      const displayText = display.textContent || display.innerText;
      console.log(`[Test Implementation] Found display text: "${displayText}"`);
      assert.equal(displayText.trim(), expected);
      console.log(`[Test Implementation] Assertion passed: display equals "${expected}"`);

      // Take a screenshot for this test
      if (artifactory) {
        console.log(`[Test Implementation] Taking screenshot for displayIs_${expected.replace(/[^a-zA-Z0-9]/g, '_')}`);
        artifactory.screenshot(`displayIs_${expected.replace(/[^a-zA-Z0-9]/g, '_')}`);
      }
    },
    result: (expected: string) => async (store: any, testResource: any, artifactory: any) => {
      // Alias for displayIs
      console.log(`[Test Implementation] result: checking if result equals "${expected}"`);
      const { htmlElement } = store;

      // Wait a bit more to ensure React has updated
      await new Promise(resolve => setTimeout(resolve, 200));

      // Try multiple selectors to find the display
      let display = null;
      const selectors = [
        '[style*="displayValue"]',
        'div[style*="display"]',
        '.calculator div',
        '#root > div > div',
        'div'
      ];

      for (const selector of selectors) {
        const elements = htmlElement.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent || el.innerText;
          // Look for an element that looks like a calculator display
          if (text && text.trim().length > 0) {
            if (text.match(/[\d\+\-\*\/\.\(\)C=]/) || text === expected) {
              display = el;
              console.log(`[Test Implementation] Found display with selector "${selector}": "${text}"`);
              break;
            }
          }
        }
        if (display) break;
      }

      if (!display) {
        console.error('[Test Implementation] Display element not found');
        throw new Error('Display element not found');
      }

      const displayText = display.textContent || display.innerText;
      console.log(`[Test Implementation] Found display text: "${displayText}"`);
      assert.equal(displayText.trim(), expected);
      console.log(`[Test Implementation] Assertion passed: result equals "${expected}"`);

      // Take a screenshot for this test
      if (artifactory) {
        console.log(`[Test Implementation] Taking screenshot for result_${expected.replace(/[^a-zA-Z0-9]/g, '_')}`);
        artifactory.screenshot(`result_${expected.replace(/[^a-zA-Z0-9]/g, '_')}`);
      }
    },
  },

  // Add missing confirms section
  confirms: {
    addition: () => {
      return (a: number, b: number) => a + b;
    },
  },

  // Add missing describes section
  describes: {
    "another simple calculator": (input: any) => {
      return () => {
        return { props: { initialValue: "" } };
      };
    },
  },

  // Add missing its section
  its: {
    "can save 1 memory": () => {
      return async (store: any, testResource: any, artifactory: any) => {
        // For React tests, we can't directly access calculator methods
        // So we'll simulate clicking memory buttons
        const { htmlElement } = store;

        // Click MS button
        const buttons = htmlElement.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent === 'MS') {
            btn.click();
            break;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 300));
        return store;
      };
    },
    "can save 2 memories": () => {
      return async (store: any, testResource: any, artifactory: any) => {
        const { htmlElement } = store;

        // Click MS button twice
        const buttons = htmlElement.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent === 'MS') {
            btn.click();
            break;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100));

        // Click M+ button
        for (const btn of buttons) {
          if (btn.textContent === 'M+') {
            btn.click();
            break;
          }
        }

        await new Promise(resolve => setTimeout(resolve, 300));
        return store;
      };
    },
  },

  // Add missing values and shoulds sections for TDT
  values: {
    of: (numbers: number[]) => {
      return numbers;
    },
    "one and two": () => {
      return [1, 2];
    },
  },

  shoulds: {
    beEqualTo: (expected: number) => {
      return (actualResult: number) => {
        return actualResult === expected;
      };
    },
    beGreaterThan: (expected: number) => {
      return (actualResult: number) => {
        return actualResult > expected;
      };
    },
    whenMultipliedAreAtLeast: (expected: number) => {
      return (actualResult: number) => {
        return actualResult >= expected;
      };
    },
    equal: (expected: any) => {
      return (actualResult: any) => {
        return actualResult === expected;
      };
    },
  },
};
