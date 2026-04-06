require 'json'
require 'fileutils'
require_relative 'base_suite'
require_relative 'base_setup'
require_relative 'base_action'
require_relative 'base_check'
require_relative 'base_given'
require_relative 'base_when'
require_relative 'base_then'
require_relative 'base_confirm'
require_relative 'simple_adapter'
require_relative 'types'

module Rubeno
  class Rubeno
    attr_accessor :test_resource_requirement, :artifacts, :test_jobs, :test_specification,
                  :suites_overrides, :given_overrides, :when_overrides, :then_overrides,
                  :values_overrides, :shoulds_overrides, :expecteds_overrides,
                  :describes_overrides, :its_overrides,
                  :specs, :total_tests, :assert_this, :test_adapter,
                  :test_subject, :test_resource_configuration
    
    def initialize(input_val, test_specification, test_implementation, test_resource_requirement, test_adapter, uber_catcher = nil)
      puts "Rubeno.initialize: starting"
      @test_resource_requirement = test_resource_requirement
      @artifacts = []
      @test_jobs = []
      @test_specification = test_specification
      @suites_overrides = {}
      @given_overrides = {}
      @when_overrides = {}
      @then_overrides = {}
      @values_overrides = {}
      @shoulds_overrides = {}
      @expecteds_overrides = {}
      @confirms_overrides = {}
      @describes_overrides = {}
      @its_overrides = {}
      @test_subject = input_val
      @test_adapter = test_adapter
      
      puts "Rubeno.initialize: about to initialize_classy_implementations"
      # Initialize classy implementations for all patterns
      initialize_classy_implementations(test_implementation)
      
      puts "Rubeno.initialize: classy implementations done"
      puts "  suites_overrides keys: #{@suites_overrides.keys}"
      puts "  given_overrides keys: #{@given_overrides.keys}"
      puts "  when_overrides keys: #{@when_overrides.keys}"
      puts "  then_overrides keys: #{@then_overrides.keys}"
      puts "  values_overrides keys: #{@values_overrides.keys}"
      puts "  shoulds_overrides keys: #{@shoulds_overrides.keys}"
      puts "  expecteds_overrides keys: #{@expecteds_overrides.keys}"
      puts "  describes_overrides keys: #{@describes_overrides.keys}"
      puts "  its_overrides keys: #{@its_overrides.keys}"
      
      # Generate specs - match TypeScript BaseTiposkripto which passes all pattern wrappers
      puts "Rubeno.initialize: about to call test_specification"
      # Pass all pattern wrappers to match TypeScript implementation (8 arguments)
      @specs = test_specification.call(
        given_wrapper,
        when_wrapper,
        then_wrapper,
        describes_wrapper,
        its_wrapper,
        confirms_wrapper,
        values_wrapper,
        shoulds_wrapper
      )
      puts "Rubeno.initialize: specs generated, count: #{@specs.length}"
      
      # Initialize test jobs
      puts "Rubeno.initialize: about to initialize_test_jobs"
      initialize_test_jobs
      puts "Rubeno.initialize: done"
    end
  end
end
