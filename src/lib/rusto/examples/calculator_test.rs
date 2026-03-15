//! Example of using Rusto's flavored macros to test a Calculator.

use rusto::flavored::{test_suite, given, when, then};

struct Calculator {
    value: i32,
}

impl Calculator {
    fn new() -> Self {
        Calculator { value: 0 }
    }
    
    fn add(&mut self, x: i32, y: i32) {
        self.value = x + y;
    }
    
    fn result(&self) -> i32 {
        self.value
    }
}

// This will generate test functions that can be run with `cargo test`
test_suite!("Calculator Tests", {
    // The macro generates test functions automatically
    // The body is ignored by the current implementation
    // but must be present for macro syntax
});
