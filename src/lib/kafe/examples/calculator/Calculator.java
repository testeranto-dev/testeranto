package kafe.examples.calculator;

public class Calculator {
    private String display = "";
    private double memory = 0;
    
    public Calculator() {
        // Default constructor
    }
    
    public Calculator press(String button) {
        if (button.equals("C")) {
            clear();
        } else if (button.equals("MS")) {
            memoryStore();
        } else if (button.equals("MR")) {
            memoryRecall();
        } else if (button.equals("MC")) {
            memoryClear();
        } else if (button.equals("M+")) {
            memoryAdd();
        } else if (button.equals("=") || button.equals("Enter")) {
            enter();
        } else {
            display = display + button;
        }
        return this;
    }
    
    public void enter() {
        try {
            // Simple expression evaluation
            // Note: This is a simplified implementation
            // For a real calculator, you'd need a proper expression parser
            if (display.contains("+")) {
                String[] parts = display.split("\\+");
                double a = Double.parseDouble(parts[0]);
                double b = Double.parseDouble(parts[1]);
                display = String.valueOf(a + b);
            } else if (display.contains("-")) {
                String[] parts = display.split("-");
                double a = Double.parseDouble(parts[0]);
                double b = Double.parseDouble(parts[1]);
                display = String.valueOf(a - b);
            } else if (display.contains("*")) {
                String[] parts = display.split("\\*");
                double a = Double.parseDouble(parts[0]);
                double b = Double.parseDouble(parts[1]);
                display = String.valueOf(a * b);
            } else if (display.contains("/")) {
                String[] parts = display.split("/");
                double a = Double.parseDouble(parts[0]);
                double b = Double.parseDouble(parts[1]);
                if (b == 0) {
                    display = "Error";
                } else {
                    display = String.valueOf(a / b);
                }
            } else {
                // If no operator, just parse the number
                Double.parseDouble(display);
            }
        } catch (Exception e) {
            display = "Error";
        }
    }
    
    public void memoryStore() {
        try {
            memory = Double.parseDouble(display);
            clear();
        } catch (Exception e) {
            memory = 0;
        }
    }
    
    public void memoryRecall() {
        display = String.valueOf(memory);
    }
    
    public void memoryClear() {
        memory = 0;
    }
    
    public void memoryAdd() {
        try {
            double current = Double.parseDouble(display);
            memory += current;
            clear();
        } catch (Exception e) {
            // Ignore
        }
    }
    
    public void clear() {
        display = "";
    }
    
    public String getDisplay() {
        return display;
    }
    
    public double getMemory() {
        return memory;
    }
    
    // For testing purposes
    public double add(double a, double b) {
        return a + b;
    }
    
    public double subtract(double a, double b) {
        return a - b;
    }
    
    public double multiply(double a, double b) {
        return a * b;
    }
    
    public double divide(double a, double b) {
        if (b == 0) {
            throw new ArithmeticException("Division by zero");
        }
        return a / b;
    }
}
