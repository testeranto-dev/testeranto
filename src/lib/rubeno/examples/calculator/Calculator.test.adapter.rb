require_relative '../../lib/types'

module Rubeno
  module Examples
    class CalculatorTestAdapter
      include ITestAdapter
      
      def prepare_all(input_val, test_resource, artifactory = nil)
        puts "[adapter] before_all called with input: #{input_val}"
        input_val
      end
      
      def prepare_each(subject, initializer, test_resource, initial_values, artifactory = nil)
        puts "[adapter] beforeEach called with subject: #{subject}"
        # Call initializer with appropriate arguments
        calculator = nil
        if initializer.arity == 0
          calculator = initializer.call
        elsif initializer.arity == 1
          # Try subject first (for implementations like (input: typeof Calculator) => new input())
          calculator = initializer.call(subject)
        else
          # Default: call with no arguments
          calculator = initializer.call
        end
        puts "[adapter] beforeEach created calculator: #{calculator}"
        calculator
      end
      
      def execute(store, action_cb, test_resource, artifactory = nil)
        puts "[adapter] andWhen called with store: #{store}"
        # action_cb is (calculator: Calculator) => Calculator
        result = action_cb.call(store)
        puts "[adapter] andWhen result: #{result}"
        result
      end
      
      def verify(store, check_cb, test_resource, artifactory = nil)
        puts "[adapter] verify called with store: #{store}"
        puts "[adapter] verificationFn: #{check_cb}"
        
        if check_cb.respond_to?(:call)
          # Call verificationFn with store to perform assertion
          check_cb.call(store)
          # Return the store (truthy value) to indicate success
          return store
        end
        store
      end
      
      def cleanup_each(store, key, artifactory = nil)
        puts "[adapter] afterEach called with store: #{store}"
        store
      end
      
      def cleanup_all(store, artifactory = nil)
        puts "[adapter] afterAll called, but skipping web-only storage operations in Ruby"
        
        if artifactory && artifactory.respond_to?(:write_file_sync)
          artifactory.write_file_sync("fizz", "buzz")
        end
        
        store
      end
      
      def assert(actual)
        puts "[adapter] assert called with actual: #{actual}"
        actual
      end
    end
  end
end
