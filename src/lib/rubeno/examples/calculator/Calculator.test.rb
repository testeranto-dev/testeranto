require_relative '../../lib/rubeno'
require_relative 'Calculator'
require_relative 'Calculator.test.implementation'
require_relative 'Calculator.test.specification'
require_relative 'Calculator.test.adapter'

module Rubeno
  module Examples
    class CalculatorTest
      def self.run
        puts "Starting Calculator test..."
        
        # Create test implementation
        test_implementation = ITestImplementation.new(
          suites: { 'Default' => { description: "Comprehensive test suite for Calculator" } },
          givens: CalculatorTestImplementation.givens,
          whens: CalculatorTestImplementation.whens,
          thens: CalculatorTestImplementation.thens,
          confirms: CalculatorTestImplementation.confirms,
          values: CalculatorTestImplementation.values,
          shoulds: CalculatorTestImplementation.shoulds,
          describes: CalculatorTestImplementation.describes,
          its: CalculatorTestImplementation.its
        )
        
        # Create test specification
        test_specification = ->(given_wrapper, when_wrapper, then_wrapper,
                                describes_wrapper, its_wrapper,
                                confirms_wrapper, values_wrapper, shoulds_wrapper) do
          CalculatorTestSpecification.call(
            given_wrapper, when_wrapper, then_wrapper,
            describes_wrapper, its_wrapper,
            confirms_wrapper, values_wrapper, shoulds_wrapper
          )
        end
        
        # Create test adapter
        test_adapter = CalculatorTestAdapter.new
        
        # Create Rubeno instance
        rubeno_instance = Rubeno.Rubeno(
          Calculator,  # input
          test_specification,
          test_implementation,
          ITTestResourceRequest.new(ports: 0),
          test_adapter
        )
        
        # Set as default instance
        Rubeno.set_default_instance(rubeno_instance)
        
        puts "Calculator test setup complete. Ready to run tests."
        rubeno_instance
      end
    end
  end
end

# If this file is run directly, run the tests
if __FILE__ == $0
  puts "Running Calculator test directly..."
  instance = Rubeno::Examples::CalculatorTest.run
  
  # Create a test resource configuration
  test_resource_config = ITTestResourceConfiguration.new(
    name: "calculator_test",
    fs: Dir.pwd + "/test_output",
    ports: [],
    browser_ws_endpoint: nil,
    timeout: 30000,
    retries: 0,
    environment: {}
  )
  
  # Run tests
  puts "Running tests..."
  result = instance.receiveTestResourceConfig(test_resource_config.to_json, 'ipcfile')
  
  puts "Test results:"
  puts "  Failed: #{result.failed}"
  puts "  Fails: #{result.fails}"
  puts "  Features: #{result.features}"
  puts "  Artifacts: #{result.artifacts}"
  
  exit result.fails > 0 ? 1 : 0
end
