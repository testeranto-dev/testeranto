require_relative '../Calculator'

module Rubeno
  module Examples
    module CalculatorTestImplementation
      # TDT style /////////////////////////
      def self.confirms
        {
          addition: -> {
            -> {
              ->(a, b) { a + b }
            }
          }
        }
      end
      
      def self.values
        {
          of: ->(numbers) {
            numbers
          },
          one_and_two: -> {
            [1, 2]
          }
        }
      end
      
      def self.shoulds
        {
          be_equal_to: ->(expected) {
            ->(actual_result) {
              actual_result == expected
            }
          },
          be_greater_than: ->(expected) {
            ->(actual_result) {
              actual_result > expected
            }
          },
          when_multiplied_are_at_least: ->(expected) {
            ->(actual_result) {
              actual_result >= expected
            }
          },
          equal: ->(expected) {
            ->(actual_result) {
              actual_result == expected
            }
          }
        }
      end
      
      # AAA style /////////////////////////
      def self.describes
        {
          a_simple_calculator: ->(input) {
            input.new
          }
        }
      end
      
      def self.its
        {
          can_save_1_memory: -> {
            ->(calculator) {
              calculator.memory_store
              calculator.get_value("memory") == 0
            }
          },
          can_save_2_memories: -> {
            ->(calculator) {
              calculator.memory_store
              calculator.memory_add
              calculator.get_value("memory").is_a?(Numeric)
            }
          }
        }
      end
      
      # BDD style /////////////////////////
      def self.givens
        {
          default: ->(input) {
            input.new
          }
        }
      end
      
      def self.whens
        {
          press: ->(button) {
            ->(calculator) {
              calculator.press(button)
            }
          },
          enter: -> {
            ->(calculator) {
              calculator.enter
              calculator
            }
          },
          memory_store: -> {
            ->(calculator) {
              calculator.memory_store
              calculator
            }
          },
          memory_recall: -> {
            ->(calculator) {
              calculator.memory_recall
              calculator
            }
          },
          memory_clear: -> {
            ->(calculator) {
              calculator.memory_clear
              calculator
            }
          },
          memory_add: -> {
            ->(calculator) {
              calculator.memory_add
              calculator
            }
          }
        }
      end
      
      def self.thens
        {
          result: ->(expected) {
            ->(calculator) {
              actual = calculator.get_display
              actual_num = actual.to_f
              expected_num = expected.to_f
              if !actual_num.nan? && !expected_num.nan?
                (actual_num - expected_num).abs < 0.0000001
              else
                actual == expected
              end
            }
          }
        }
      end
    end
  end
end
