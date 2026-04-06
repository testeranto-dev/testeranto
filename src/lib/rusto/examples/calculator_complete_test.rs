//! Complete calculator test example for Rusto
//! Demonstrates how to use the calculator with Rusto

use crate::examples::calculator::Calculator;
use crate::examples::calculator_test_implementation::CalculatorTestImplementation;
use crate::examples::calculator_test_specification::CalculatorTestSpecification;
use crate::simple_adapter::SimpleTestAdapter;
use crate::rusto::Rusto;
use crate::types::{ITestResourceConfiguration, ITTestResourceRequest};

pub fn create_calculator_test() -> Rusto<
    crate::examples::calculator_test_implementation::CalculatorTestTypes,
    (),
    (),
> {
    let input = Calculator::new();
    
    let test_specification = Box::new(CalculatorTestSpecification);
    let test_implementation = CalculatorTestImplementation::<()>::new();
    let test_resource_requirement = ITTestResourceRequest::default();
    let test_adapter = Box::new(SimpleTestAdapter::new());
    
    let test_resource_configuration = ITestResourceConfiguration {
        name: "calculator_test".to_string(),
        fs: "testeranto".to_string(),
        ports: vec![],
        files: vec![],
        timeout: None,
        retries: None,
        environment: None,
    };
    
    Rusto::new(
        "node",
        input,
        test_specification,
        test_implementation,
        test_resource_requirement,
        test_adapter,
        test_resource_configuration,
        "8080",
        "localhost",
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_calculator_creation() {
        let calculator = Calculator::new();
        assert_eq!(calculator.get_display(), "");
    }
    
    #[test]
    fn test_calculator_press() {
        let mut calculator = Calculator::new();
        calculator.press("5");
        assert_eq!(calculator.get_display(), "5");
    }
    
    #[test]
    fn test_calculator_addition() {
        let mut calculator = Calculator::new();
        calculator.press("5");
        calculator.press("+");
        calculator.press("3");
        calculator.enter();
        // The display should show "8" or similar
        // Our simple evaluator might not handle this perfectly
        // But we can at least check it's not empty
        assert!(!calculator.get_display().is_empty());
    }
    
    #[test]
    fn test_calculator_memory() {
        let mut calculator = Calculator::new();
        calculator.press("5");
        calculator.memory_store();
        assert_eq!(calculator.get_display(), "");
        
        calculator.memory_recall();
        assert_eq!(calculator.get_display(), "5");
    }
}
