# Ruby-flavored Testeranto interface
# Provides idiomatic Ruby syntax for BDD testing
module Rubeno
  module Flavored
    # Main test suite builder
    class SuiteBuilder
      def initialize(name)
        @name = name
        @tests = []
        @before_all = nil
        @after_all = nil
        @before_each = nil
        @after_each = nil
      end
      
      # Define a before_all hook
      def before_all(&block)
        @before_all = block
        self
      end
      
      # Define an after_all hook
      def after_all(&block)
        @after_all = block
        self
      end
      
      # Define a before_each hook
      def before_each(&block)
        @before_each = block
        self
      end
      
      # Define an after_each hook
      def after_each(&block)
        @after_each = block
        self
      end
      
      # Define a test scenario
      def scenario(description, &block)
        @tests << { description: description, block: block }
        self
      end
      
      # Alias for scenario
      def test(description, &block)
        scenario(description, &block)
      end
      
      # Convert to baseline Rubeno format
      def to_baseline
        {
          name: @name,
          before_all: @before_all,
          after_all: @after_all,
          before_each: @before_each,
          after_each: @after_each,
          tests: @tests
        }
      end
    end
    
    # Scenario context for Given/When/Then steps
    class ScenarioContext
      def initialize
        @givens = []
        @whens = []
        @thens = []
        @subject = nil
      end
      
      # Define a Given step
      def given(description = nil, &block)
        @givens << { description: description, block: block }
        self
      end
      
      # Define a When step
      def when(description = nil, &block)
        @whens << { description: description, block: block }
        self
      end
      
      # Define a Then step
      def then(description = nil, &block)
        @thens << { description: description, block: block }
        self
      end
      
      # Set the test subject
      def subject(&block)
        @subject = block
        self
      end
      
      # Get the scenario definition
      def to_definition
        {
          subject: @subject,
          givens: @givens,
          whens: @whens,
          thens: @thens
        }
      end
    end
    
    # DSL methods for creating test suites
    module DSL
      # Create a new test suite
      def suite(name, &block)
        builder = SuiteBuilder.new(name)
        builder.instance_eval(&block) if block_given?
        builder
      end
      
      # Create a scenario within a suite
      def scenario(description, &block)
        context = ScenarioContext.new
        context.instance_eval(&block) if block_given?
        context
      end
      
      # Alias for scenario
      def test(description, &block)
        scenario(description, &block)
      end
    end
    
    # Minitest integration
    module MinitestIntegration
      def self.included(base)
        base.extend(ClassMethods)
      end
      
      module ClassMethods
        # Define a Testeranto test suite within Minitest
        def testeranto_suite(name, &block)
          builder = SuiteBuilder.new(name)
          builder.instance_eval(&block) if block_given?
          
          # Convert to Minitest test methods
          builder.to_baseline[:tests].each do |test_def|
            test_name = "test_#{test_def[:description].to_s.downcase.gsub(/\s+/, '_')}"
            
            define_method(test_name) do
              # Execute the test scenario
              context = ScenarioContext.new
              context.instance_eval(&test_def[:block])
              definition = context.to_definition
              
              # Setup subject
              subject = definition[:subject]&.call
              
              # Execute Given steps
              definition[:givens].each do |given|
                given[:block]&.call(subject)
              end
              
              # Execute When steps
              definition[:whens].each do |when_step|
                when_step[:block]&.call(subject)
              end
              
              # Execute Then steps (assertions)
              definition[:thens].each do |then_step|
                result = then_step[:block]&.call(subject)
                assert result, "Assertion failed: #{then_step[:description]}"
              end
            end
          end
        end
      end
    end
    
    # RSpec integration
    module RSpecIntegration
      # RSpec matchers for Testeranto
      module Matchers
        def have_state(expected)
          HaveStateMatcher.new(expected)
        end
        
        class HaveStateMatcher
          def initialize(expected)
            @expected = expected
          end
          
          def matches?(actual)
            @actual = actual
            # Simple equality check - can be extended for more complex state matching
            @actual == @expected
          end
          
          def failure_message
            "expected state to be #{@expected.inspect}, but got #{@actual.inspect}"
          end
          
          def description
            "have state #{@expected.inspect}"
          end
        end
      end
      
      # RSpec DSL for Testeranto
      module DSL
        def suite(name, &block)
          describe name do
            builder = ::Rubeno::Flavored::SuiteBuilder.new(name)
            builder.instance_eval(&block) if block_given?
            
            builder.to_baseline[:tests].each do |test_def|
              it test_def[:description] do
                context = ::Rubeno::Flavored::ScenarioContext.new
                context.instance_eval(&test_def[:block])
                definition = context.to_definition
                
                # Setup subject
                subject = definition[:subject]&.call
                
                # Execute Given steps
                definition[:givens].each do |given|
                  given[:block]&.call(subject)
                end
                
                # Execute When steps
                definition[:whens].each do |when_step|
                  when_step[:block]&.call(subject)
                end
                
                # Execute Then steps (expectations)
                definition[:thens].each do |then_step|
                  result = then_step[:block]&.call(subject)
                  expect(result).to be_truthy
                end
              end
            end
          end
        end
      end
    end
    
    # Main entry point for flavored Rubeno
    class Runner
      def initialize(suite_builder, adapter = nil)
        @suite_builder = suite_builder
        @adapter = adapter || SimpleTestAdapter.new
      end
      
      # Run the test suite
      def run(test_resource_configuration = {})
        baseline = @suite_builder.to_baseline
        
        # Convert to baseline Rubeno format
        test_implementation = convert_to_implementation(baseline)
        test_specification = convert_to_specification(baseline)
        
        # Create and run Rubeno instance
        rubeno_instance = ::Rubeno::Rubeno.new(
          nil,
          test_specification,
          test_implementation,
          ::Rubeno::ITTestResourceRequest.new(ports: 0),
          @adapter
        )
        
        # Run tests
        rubeno_instance.receiveTestResourceConfig(test_resource_configuration.to_json)
      end
      
      private
      
      def convert_to_implementation(baseline)
        # Convert flavored suite to baseline implementation format
        suites = { 'Default' => baseline[:name] }
        
        givens = {}
        whens = {}
        thens = {}
        
        baseline[:tests].each_with_index do |test, index|
          test_name = "test_#{index}"
          
          # Convert scenario to given/when/then implementation
          context = ScenarioContext.new
          context.instance_eval(&test[:block])
          definition = context.to_definition
          
          givens[test_name] = ->(initial_values) do
            definition[:subject]&.call || initial_values
          end
          
          definition[:whens].each_with_index do |when_step, when_index|
            whens["when_#{index}_#{when_index}"] = ->(*args) do
              ->(store) do
                when_step[:block]&.call(store, *args)
                store
              end
            end
          end
          
          definition[:thens].each_with_index do |then_step, then_index|
            thens["then_#{index}_#{then_index}"] = ->(*args) do
              ->(store) do
                result = then_step[:block]&.call(store, *args)
                raise "Assertion failed" unless result
                store
              end
            end
          end
        end
        
        ::Rubeno::ITestImplementation.new(
          suites: suites,
          givens: givens,
          whens: whens,
          thens: thens
        )
      end
      
      def convert_to_specification(baseline)
        ->(suites, givens, whens, thens) do
          test_specs = []
          
          baseline[:tests].each_with_index do |test, index|
            test_name = "test_#{index}"
            
            # Build when and then arrays for this test
            when_list = []
            then_list = []
            
            context = ScenarioContext.new
            context.instance_eval(&test[:block])
            definition = context.to_definition
            
            definition[:whens].each_with_index do |when_step, when_index|
              when_list << whens["when_#{index}_#{when_index}"]
            end
            
            definition[:thens].each_with_index do |then_step, then_index|
              then_list << thens["then_#{index}_#{then_index}"]
            end
            
            test_specs << {
              'name' => test[:description],
              'givens' => {
                test_name => givens[test_name](
                  definition[:givens].map { |g| g[:description] }.compact,
                  when_list,
                  then_list,
                  nil
                )
              }
            }
          end
          
          # Wrap in a suite
          [
            suites.Default(baseline[:name], test_specs.first['givens'])
          ]
        end
      end
    end
    
    # Top-level DSL methods
    extend DSL
    
    # Create a test suite
    def self.suite(name, &block)
      builder = SuiteBuilder.new(name)
      builder.instance_eval(&block) if block_given?
      Runner.new(builder)
    end
  end
end
