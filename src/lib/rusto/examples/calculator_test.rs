//! Example of using Rusto to test a Calculator.
//! Matches the TypeScript implementation

use rusto::prelude::*;

// Use the Calculator from our examples module
use rusto::Calculator;

// Create a simple test
fn main() {
    println!("Calculator Test Example");
    
    // Test basic calculator functionality
    let mut calc = Calculator::new();
    calc.press("5");
    calc.press("+");
    calc.press("3");
    calc.enter();
    
    println!("5 + 3 = {}", calc.get_display());
    
    // Test memory functions
    let mut calc2 = Calculator::new();
    calc2.press("1");
    calc2.press("0");
    calc2.memory_store();
    calc2.clear();
    calc2.memory_recall();
    
    println!("Memory recall: {}", calc2.get_display());
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_calculator_basic() {
        let mut calc = Calculator::new();
        calc.press("5");
        assert_eq!(calc.get_display(), "5");
    }
    
    #[test]
    fn test_calculator_addition() {
        let mut calc = Calculator::new();
        calc.press("1");
        calc.press("0");
        calc.press("+");
        calc.press("2");
        calc.press("0");
        calc.enter();
        // The result should be "30"
        assert_eq!(calc.get_display(), "30");
    }
    
    #[test]
    fn test_calculator_memory() {
        let mut calc = Calculator::new();
        calc.press("4");
        calc.press("2");
        calc.memory_store();
        assert_eq!(calc.get_display(), "");
        
        calc.memory_recall();
        assert_eq!(calc.get_display(), "42");
    }
}
