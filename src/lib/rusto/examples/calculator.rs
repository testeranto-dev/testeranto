//! Calculator implementation for Rusto tests
//! Matches the TypeScript Calculator implementation

#[derive(Debug, Clone)]
pub struct Calculator {
    display: String,
    values: std::collections::HashMap<String, f64>,
}

impl Calculator {
    pub fn new() -> Self {
        Calculator {
            display: String::new(),
            values: std::collections::HashMap::new(),
        }
    }
    
    pub fn enter(&mut self) {
        if self.display.is_empty() {
            return;
        }
        
        // Simple expression evaluation
        // Note: This is a simplified implementation for testing
        // In production, you'd want a proper expression evaluator
        let result = match self.evaluate_expression(&self.display) {
            Ok(value) => value,
            Err(_) => {
                self.display = "Error".to_string();
                return;
            }
        };
        
        // Handle division by zero
        if result.is_infinite() {
            self.display = "Error".to_string();
        } else {
            self.display = result.to_string();
        }
    }
    
    fn evaluate_expression(&self, expr: &str) -> Result<f64, String> {
        // Very simple expression evaluation
        // This only handles basic arithmetic for testing
        let parts: Vec<&str> = expr.split(|c| c == '+' || c == '-' || c == '*' || c == '/').collect();
        if parts.len() != 2 {
            return Err("Invalid expression".to_string());
        }
        
        let left: f64 = parts[0].parse().map_err(|_| "Invalid number".to_string())?;
        let right: f64 = parts[1].parse().map_err(|_| "Invalid number".to_string())?;
        
        if expr.contains('+') {
            Ok(left + right)
        } else if expr.contains('-') {
            Ok(left - right)
        } else if expr.contains('*') {
            Ok(left * right)
        } else if expr.contains('/') {
            if right == 0.0 {
                Err("Division by zero".to_string())
            } else {
                Ok(left / right)
            }
        } else {
            Err("Unknown operator".to_string())
        }
    }
    
    pub fn memory_store(&mut self) {
        if let Ok(value) = self.display.parse::<f64>() {
            self.values.insert("memory".to_string(), value);
        } else {
            self.values.insert("memory".to_string(), 0.0);
        }
        self.clear();
    }
    
    pub fn memory_recall(&mut self) {
        let memory_value = self.values.get("memory").copied().unwrap_or(0.0);
        self.display = memory_value.to_string();
    }
    
    pub fn memory_clear(&mut self) {
        self.values.insert("memory".to_string(), 0.0);
    }
    
    pub fn memory_add(&mut self) {
        let current_value = self.display.parse::<f64>().unwrap_or(0.0);
        let memory_value = self.values.get("memory").copied().unwrap_or(0.0);
        self.values.insert("memory".to_string(), memory_value + current_value);
        self.clear();
    }
    
    fn handle_special_button(&mut self, button: &str) -> bool {
        match button {
            "C" => {
                self.clear();
                true
            }
            "MS" => {
                self.memory_store();
                true
            }
            "MR" => {
                self.memory_recall();
                true
            }
            "MC" => {
                self.memory_clear();
                true
            }
            "M+" => {
                self.memory_add();
                true
            }
            _ => false,
        }
    }
    
    pub fn press(&mut self, button: &str) -> &mut Self {
        // Handle special buttons first
        if self.handle_special_button(button) {
            return self;
        }
        
        // For regular buttons, append to display
        self.display.push_str(button);
        self
    }
    
    pub fn get_display(&self) -> &str {
        &self.display
    }
    
    pub fn clear(&mut self) {
        self.display.clear();
    }
    
    // Keep these methods for backward compatibility if needed
    pub fn add(&self, a: f64, b: f64) -> f64 {
        a + b
    }
    
    pub fn subtract(&self, a: f64, b: f64) -> f64 {
        a - b
    }
    
    pub fn multiply(&self, a: f64, b: f64) -> f64 {
        a * b
    }
    
    pub fn divide(&self, a: f64, b: f64) -> Result<f64, String> {
        if b == 0.0 {
            Err("Cannot divide by zero".to_string())
        } else {
            Ok(a / b)
        }
    }
    
    pub fn set_value(&mut self, identifier: &str, value: f64) {
        self.values.insert(identifier.to_string(), value);
    }
    
    pub fn get_value(&self, identifier: &str) -> Option<f64> {
        self.values.get(identifier).copied()
    }
}
