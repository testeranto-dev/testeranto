//! Calculator test implementation for Rusto
//! Matches the TypeScript Calculator.test.implementation.ts

use crate::examples::calculator::Calculator;
use crate::types::{IbddInAny, IbddOutAny, ITestImplementation};
use std::collections::HashMap;
use std::marker::PhantomData;

// Define test types to match TypeScript
pub struct CalculatorTestTypes;

impl IbddInAny for CalculatorTestTypes {
    type Iinput = Calculator;
    type Isubject = Calculator;
    type Istore = Calculator;
    type Iselection = f64;
    type Then = bool;
    type Given = Box<dyn Fn(Calculator) -> Calculator>;
    type When = Box<dyn Fn(Calculator) -> Calculator>;
}

impl IbddOutAny for CalculatorTestTypes {}

// Test implementation structure
pub struct CalculatorTestImplementation<M> {
    _phantom: PhantomData<M>,
}

impl<M> CalculatorTestImplementation<M> {
    pub fn new() -> Self {
        Self {
            _phantom: PhantomData,
        }
    }
}

impl<M> Default for CalculatorTestImplementation<M> {
    fn default() -> Self {
        Self::new()
    }
}

impl<M: 'static> ITestImplementation<CalculatorTestTypes, (), M> for CalculatorTestImplementation<M> {
    fn suites(&self) -> HashMap<String, M> {
        HashMap::new()
    }
    
    fn givens(&self) -> HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> <CalculatorTestTypes as IbddInAny>::Given + Send + Sync>> {
        let mut map = HashMap::new();
        
        // Default given: creates a new Calculator
        map.insert("Default".to_string(), Box::new(|_| {
            Box::new(|calculator: Calculator| calculator) as Box<dyn Fn(Calculator) -> Calculator>
        }) as Box<dyn Fn(Box<dyn std::any::Any>) -> <CalculatorTestTypes as IbddInAny>::Given + Send + Sync>);
        
        map
    }
    
    fn whens(&self) -> HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> <CalculatorTestTypes as IbddInAny>::When + Send + Sync>> {
        let mut map = HashMap::new();
        
        // press button
        map.insert("press".to_string(), Box::new(|args| {
            let button = args.downcast_ref::<String>().expect("Expected string").clone();
            Box::new(move |calculator: Calculator| {
                let mut calc = calculator;
                calc.press(&button);
                calc
            }) as Box<dyn Fn(Calculator) -> Calculator>
        }) as Box<dyn Fn(Box<dyn std::any::Any>) -> <CalculatorTestTypes as IbddInAny>::When + Send + Sync>);
        
        // enter
        map.insert("enter".to_string(), Box::new(|_| {
            Box::new(|calculator: Calculator| {
                let mut calc = calculator;
                calc.enter();
                calc
            }) as Box<dyn Fn(Calculator) -> Calculator>
        }) as Box<dyn Fn(Box<dyn std::any::Any>) -> <CalculatorTestTypes as IbddInAny>::When + Send + Sync>);
        
        // memoryStore
        map.insert("memoryStore".to_string(), Box::new(|_| {
            Box::new(|calculator: Calculator| {
                let mut calc = calculator;
                calc.memory_store();
                calc
            }) as Box<dyn Fn(Calculator) -> Calculator>
        }) as Box<dyn Fn(Box<dyn std::any::Any>) -> <CalculatorTestTypes as IbddInAny>::When + Send + Sync>);
        
        // memoryRecall
        map.insert("memoryRecall".to_string(), Box::new(|_| {
            Box::new(|calculator: Calculator| {
                let mut calc = calculator;
                calc.memory_recall();
                calc
            }) as Box<dyn Fn(Calculator) -> Calculator>
        }) as Box<dyn Fn(Box<dyn std::any::Any>) -> <CalculatorTestTypes as IbddInAny>::When + Send + Sync>);
        
        // memoryClear
        map.insert("memoryClear".to_string(), Box::new(|_| {
            Box::new(|calculator: Calculator| {
                let mut calc = calculator;
                calc.memory_clear();
                calc
            }) as Box<dyn Fn(Calculator) -> Calculator>
        }) as Box<dyn Fn(Box<dyn std::any::Any>) -> <CalculatorTestTypes as IbddInAny>::When + Send + Sync>);
        
        // memoryAdd
        map.insert("memoryAdd".to_string(), Box::new(|_| {
            Box::new(|calculator: Calculator| {
                let mut calc = calculator;
                calc.memory_add();
                calc
            }) as Box<dyn Fn(Calculator) -> Calculator>
        }) as Box<dyn Fn(Box<dyn std::any::Any>) -> <CalculatorTestTypes as IbddInAny>::When + Send + Sync>);
        
        map
    }
    
    fn thens(&self) -> HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> <CalculatorTestTypes as IbddInAny>::Then + Send + Sync>> {
        let mut map = HashMap::new();
        
        // result
        map.insert("result".to_string(), Box::new(|args| {
            let expected = args.downcast_ref::<String>().expect("Expected string").clone();
            Box::new(move |calculator: Calculator| {
                let actual = calculator.get_display();
                let actual_num = actual.parse::<f64>().ok();
                let expected_num = expected.parse::<f64>().ok();
                
                if let (Some(actual_val), Some(expected_val)) = (actual_num, expected_num) {
                    (actual_val - expected_val).abs() < 0.0000001
                } else {
                    actual == expected
                }
            }) as Box<dyn Fn(Calculator) -> bool>
        }) as Box<dyn Fn(Box<dyn std::any::Any>) -> <CalculatorTestTypes as IbddInAny>::Then + Send + Sync>);
        
        map
    }
    
    fn values(&self) -> HashMap<String, Box<dyn Fn(Vec<String>, Vec<Vec<Box<dyn std::any::Any>>>, <CalculatorTestTypes as IbddInAny>::Given, Box<dyn std::any::Any>) -> Box<dyn std::any::Any> + Send + Sync>> {
        HashMap::new()
    }
    
    fn shoulds(&self) -> HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any> + Send + Sync>> {
        HashMap::new()
    }
    
    fn expecteds(&self) -> HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any> + Send + Sync>> {
        HashMap::new()
    }
    
    fn describes(&self) -> HashMap<String, Box<dyn Fn(Vec<String>, Vec<Box<dyn std::any::Any>>, <CalculatorTestTypes as IbddInAny>::Given, Box<dyn std::any::Any>) -> Box<dyn std::any::Any> + Send + Sync>> {
        HashMap::new()
    }
    
    fn its(&self) -> HashMap<String, Box<dyn Fn(Box<dyn std::any::Any>) -> Box<dyn std::any::Any> + Send + Sync>> {
        HashMap::new()
    }
}
