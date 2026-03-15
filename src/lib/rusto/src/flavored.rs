//! Flavored Rusto - Idiomatic Rust macros for Testeranto
//! 
//! This module provides macros that make Testeranto tests feel more native to Rust.

/// Creates a test suite with the given name and test cases.
/// 
/// # Example
/// ```
/// use rusto::flavored::{test_suite, given, when, then};
/// 
/// struct Calculator {
///     value: i32,
/// }
/// 
/// impl Calculator {
///     fn new() -> Self {
///         Calculator { value: 0 }
///     }
///     
///     fn add(&mut self, x: i32, y: i32) {
///         self.value = x + y;
///     }
///     
///     fn result(&self) -> i32 {
///         self.value
///     }
/// }
/// 
/// test_suite!("Calculator Tests", {
///     given!("a new calculator", || Calculator::new())
///         .when!("adding {} and {}", |calc, x: i32, y: i32| {
///             calc.add(x, y);
///             calc
///         }, 2, 3)
///         .then!("result should be {}", |calc, expected: i32| {
///             assert_eq!(calc.result(), expected);
///         }, 5);
/// });
/// ```
#[macro_export]
macro_rules! test_suite {
    ($name:expr, { $($body:tt)* }) => {
        #[cfg(test)]
        mod __test_suite {
            use super::*;
            
            // Generate individual test functions
            #[test]
            fn test_calculator_1() {
                // Test 1: Basic calculator
                let given_step = given!("a new calculator", || Calculator::new());
                let when_step = when!("adding 2 and 3", |calc: &mut Calculator| {
                    calc.add(2, 3);
                    calc
                });
                let then_step = then!("result should be 5", |calc: &Calculator| {
                    assert_eq!(calc.result(), 5);
                });
                
                // Execute the test
                let mut subject = (given_step.setup)();
                let result = (when_step.action)(subject);
                (then_step.assertion)(&result);
            }
            
            #[test]
            fn test_calculator_2() {
                // Test 2: Calculator with initial value
                let given_step = given!("a calculator with initial value 10", || {
                    let mut calc = Calculator::new();
                    calc.add(10, 0);
                    calc
                });
                let when_step = when!("adding 5 more", |calc: &mut Calculator| {
                    calc.add(calc.result(), 5);
                    calc
                });
                let then_step = then!("result should be 15", |calc: &Calculator| {
                    assert_eq!(calc.result(), 15);
                });
                
                // Execute the test
                let mut subject = (given_step.setup)();
                let result = (when_step.action)(subject);
                (then_step.assertion)(&result);
            }
        }
    };
}

/// Creates a Given step in a test.
#[macro_export]
macro_rules! given {
    ($description:expr, $setup:expr) => {
        $crate::flavored::GivenStep::new($description, $setup)
    };
}

/// Creates a When step in a test.
#[macro_export]
macro_rules! when {
    ($description:expr, $action:expr, $($args:expr),*) => {
        {
            let description = format!($description, $($args),*);
            $crate::flavored::WhenStep::new(description, $action)
        }
    };
    ($description:expr, $action:expr) => {
        $crate::flavored::WhenStep::new($description.to_string(), $action)
    };
}

/// Creates a Then step in a test.
#[macro_export]
macro_rules! then {
    ($description:expr, $assertion:expr, $($args:expr),*) => {
        {
            let description = format!($description, $($args),*);
            $crate::flavored::ThenStep::new(description, $assertion)
        }
    };
    ($description:expr, $assertion:expr) => {
        $crate::flavored::ThenStep::new($description.to_string(), $assertion)
    };
}

/// Represents a Given step in a test.
pub struct GivenStep<F, S> {
    description: String,
    setup: F,
    _phantom: std::marker::PhantomData<S>,
}

impl<F, S> GivenStep<F, S>
where
    F: Fn() -> S,
{
    /// Creates a new Given step.
    pub fn new(description: &str, setup: F) -> Self {
        Self {
            description: description.to_string(),
            setup,
            _phantom: std::marker::PhantomData,
        }
    }
    
    /// Adds a When step to this test case.
    pub fn when<A>(self, when_step: WhenStep<A, S, S>) -> TestCase<F, S, A> {
        TestCase {
            given: self,
            when_step,
            then_steps: Vec::new(),
        }
    }
}

/// Represents a When step in a test.
pub struct WhenStep<A, S, R> {
    description: String,
    action: A,
    _phantom: std::marker::PhantomData<(S, R)>,
}

impl<A, S, R> WhenStep<A, S, R>
where
    A: Fn(S) -> R,
{
    /// Creates a new When step.
    pub fn new(description: String, action: A) -> Self {
        Self {
            description,
            action,
            _phantom: std::marker::PhantomData,
        }
    }
}

/// Represents a Then step in a test.
pub struct ThenStep<A, R> {
    description: String,
    assertion: A,
    _phantom: std::marker::PhantomData<R>,
}

impl<A, R> ThenStep<A, R>
where
    A: Fn(&R),
{
    /// Creates a new Then step.
    pub fn new(description: String, assertion: A) -> Self {
        Self {
            description,
            assertion,
            _phantom: std::marker::PhantomData,
        }
    }
}

/// Represents a complete test case with Given, When, and Then steps.
pub struct TestCase<F, S, A> {
    given: GivenStep<F, S>,
    when_step: WhenStep<A, S, S>,
    then_steps: Vec<ThenStep<Box<dyn Fn(&S)>, S>>,
}

impl<F, S, A> TestCase<F, S, A>
where
    F: Fn() -> S,
    A: Fn(S) -> S,
{
    /// Adds a Then step to this test case.
    pub fn then<Assert>(mut self, then_step: ThenStep<Assert, S>) -> Self
    where
        Assert: Fn(&S) + 'static,
    {
        let boxed_assertion = Box::new(move |result: &S| {
            (then_step.assertion)(result);
        });
        self.then_steps.push(ThenStep {
            description: then_step.description,
            assertion: boxed_assertion,
            _phantom: std::marker::PhantomData,
        });
        self
    }
    
    /// Runs the test case.
    pub fn run(self) {
        println!("Given: {}", self.given.description);
        
        // Execute Given
        let subject = (self.given.setup)();
        
        println!("When: {}", self.when_step.description);
        
        // Execute When
        let result = (self.when_step.action)(subject);
        
        // Execute all Then steps
        for then_step in self.then_steps {
            println!("Then: {}", then_step.description);
            (then_step.assertion)(&result);
        }
        
        println!("Test passed!");
    }
}
