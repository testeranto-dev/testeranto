module Rubeno
  module Examples
    class Calculator
      attr_accessor :display, :values
      
      def initialize
        @display = ""
        @values = {}
      end
      
      def enter
        begin
          # Simple expression evaluation
          # Note: Using eval is not recommended for production code
          # This is just for testing purposes
          result = eval(@display)
          # Handle division by zero
          if result.infinite?
            @display = "Error"
          else
            @display = result.to_s
          end
        rescue => e
          # For a calculator, syntax errors should be displayed, not thrown
          # This allows the user to see the error and correct their input
          @display = "Error"
        end
      end
      
      def memory_store
        @values["memory"] = @display.to_f || 0
        clear
      end
      
      def memory_recall
        memory_value = @values["memory"] || 0
        @display = memory_value.to_s
      end
      
      def memory_clear
        @values["memory"] = 0
      end
      
      def memory_add
        current_value = @display.to_f || 0
        memory_value = @values["memory"] || 0
        @values["memory"] = memory_value + current_value
        clear
      end
      
      def handle_special_button(button)
        case button
        when "C"
          clear
          true
        when "MS"
          memory_store
          true
        when "MR"
          memory_recall
          true
        when "MC"
          memory_clear
          true
        when "M+"
          memory_add
          true
        else
          false
        end
      end
      
      def press(button)
        # Handle special buttons first
        return self if handle_special_button(button)
        
        # For regular buttons, append to display
        @display = @display + button
        self
      end
      
      def get_display
        @display
      end
      
      def clear
        @display = ""
      end
      
      # Keep these methods for backward compatibility if needed
      def add(a, b)
        a + b
      end
      
      def subtract(a, b)
        a - b
      end
      
      def multiply(a, b)
        a * b
      end
      
      def divide(a, b)
        if b == 0
          raise "Cannot divide by zero"
        end
        a / b
      end
      
      def set_value(identifier, value)
        @values[identifier] = value
      end
      
      def get_value(identifier)
        @values[identifier]
      end
    end
  end
end
