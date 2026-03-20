require 'json'
require 'fileutils'
require 'base_suite'
require 'base_setup'
require 'base_action'
require 'base_check'
require 'base_given'
require 'base_when'
require 'base_then'
require 'base_arrange'
require 'base_act'
require 'base_assert'
require 'base_map'
require 'base_feed'
require 'base_validate'
require 'simple_adapter'
require 'pm/ruby'
require 'types'

module Rubeno
  class Rubeno
    attr_accessor :test_resource_requirement, :artifacts, :test_jobs, :test_specification,
                  :suites_overrides, :given_overrides, :when_overrides, :then_overrides,
                  :puppet_master, :specs, :total_tests, :assert_this, :test_adapter,
                  :test_subject
    
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
      @test_subject = input_val
      @test_adapter = test_adapter
      
      puts "Rubeno.initialize: about to initialize_classy_implementations"
      # Initialize classy implementations
      initialize_classy_implementations(test_implementation)
      
      puts "Rubeno.initialize: classy implementations done"
      puts "  suites_overrides keys: #{@suites_overrides.keys}"
      puts "  given_overrides keys: #{@given_overrides.keys}"
      puts "  when_overrides keys: #{@when_overrides.keys}"
      puts "  then_overrides keys: #{@then_overrides.keys}"
      
      # Generate specs
      puts "Rubeno.initialize: about to call test_specification"
      @specs = test_specification.call(
        suites_wrapper,
        given_wrapper,
        when_wrapper,
        then_wrapper
      )
      puts "Rubeno.initialize: specs generated, count: #{@specs.length}"
      
      # Initialize test jobs
      puts "Rubeno.initialize: about to initialize_test_jobs"
      initialize_test_jobs
      puts "Rubeno.initialize: done"
    end
    
    def suites_wrapper
      puts "suites_wrapper: creating wrapper with methods: #{@suites_overrides.keys}"
      # Return an object that responds to method calls for suite types
      wrapper = Object.new
      @suites_overrides.each do |suite_name, suite_proc|
        wrapper.define_singleton_method(suite_name.to_sym) do |description, givens_dict|
          puts "suites_wrapper.#{suite_name} called with description: #{description}"
          suite_proc.call(description, givens_dict)
        end
      end
      puts "suites_wrapper: returning wrapper"
      wrapper
    end
    
    def given_wrapper
      puts "given_wrapper: creating wrapper with methods: #{@given_overrides.keys}"
      wrapper = Object.new
      @given_overrides.each do |given_name, given_proc|
        wrapper.define_singleton_method(given_name.to_sym) do |features, whens, thens, initial_values = nil|
          puts "given_wrapper.#{given_name} called with features: #{features}"
          given_proc.call(features, whens, thens, initial_values)
        end
      end
      puts "given_wrapper: returning wrapper"
      wrapper
    end
    
    def when_wrapper
      puts "when_wrapper: creating wrapper with methods: #{@when_overrides.keys}"
      wrapper = Object.new
      @when_overrides.each do |when_name, when_proc|
        wrapper.define_singleton_method(when_name.to_sym) do |*args|
          puts "when_wrapper.#{when_name} called with args: #{args}"
          when_proc.call(*args)
        end
      end
      puts "when_wrapper: returning wrapper"
      wrapper
    end
    
    def then_wrapper
      puts "then_wrapper: creating wrapper with methods: #{@then_overrides.keys}"
      wrapper = Object.new
      @then_overrides.each do |then_name, then_proc|
        wrapper.define_singleton_method(then_name.to_sym) do |*args|
          puts "then_wrapper.#{then_name} called with args: #{args}"
          then_proc.call(*args)
        end
      end
      puts "then_wrapper: returning wrapper"
      wrapper
    end
    
    def initialize_classy_implementations(test_implementation)
      puts "initialize_classy_implementations: starting"
      # Create classy suites
      puts "  suites: #{test_implementation.suites.keys}"
      test_implementation.suites.each do |key, suite_data|
        @suites_overrides[key] = ->(description, givens_dict) do
          puts "    suites_wrapper.#{key} called with description: #{description}"
          {
            'name' => description,
            'givens' => givens_dict
          }
        end
      end
      
      # Create classy givens
      puts "  givens: #{test_implementation.givens.keys}"
      test_implementation.givens.each do |key, given_cb|
        @given_overrides[key] = ->(features, whens, thens, initial_values = nil) do
          puts "    given_wrapper.#{key} called with features: #{features}"
          BaseGiven.new(features, whens, thens, given_cb, initial_values, @test_adapter)
        end
      end
      
      # Create classy whens
      puts "  whens: #{test_implementation.whens.keys}"
      test_implementation.whens.each do |key, when_cb_proc|
        @when_overrides[key] = ->(*args) do
          puts "    when_wrapper.#{key} called with args: #{args}"
          when_cb = when_cb_proc.call(*args)
          BaseWhen.new(key, when_cb)
        end
      end
      
      # Create classy thens
      puts "  thens: #{test_implementation.thens.keys}"
      test_implementation.thens.each do |key, then_cb_proc|
        @then_overrides[key] = ->(*args) do
          puts "    then_wrapper.#{key} called with args: #{args}"
          then_cb = then_cb_proc.call(*args)
          BaseThen.new(key, then_cb)
        end
      end
      puts "initialize_classy_implementations: done"
    end
    
    def initialize_test_jobs
      @test_jobs = []
      @specs.each_with_index do |suite_spec, i|
        # Create a BaseSuite instance
        suite = BaseSuite.new(suite_spec['name'], suite_spec['givens'])
        suite.index = i
        
        # Create a test job
        test_job = {
          suite: suite,
          receiveTestResourceConfig: ->(pm, test_resource_config) { run_test_job(suite, pm, test_resource_config) },
          to_obj: -> { suite.to_obj }
        }
        
        @test_jobs << test_job
      end
    end
    
    def run_test_job(suite, pm, test_resource_config)
      # Run the suite
      suite_done = suite.run(
        @test_subject,
        test_resource_config  # Use the actual test resource configuration
      )
      
      # Create result object
      result = Object.new
      result.instance_variable_set(:@fails, suite_done.fails)
      result.instance_variable_set(:@artifacts, suite_done.artifacts)
      result.instance_variable_set(:@features, suite_done.features)
      
      def result.fails; @fails; end
      def result.artifacts; @artifacts; end
      def result.features; @features; end
      
      result
    rescue => e
      puts "Error in test job: #{e.message}"
      puts e.backtrace
      
      result = Object.new
      result.instance_variable_set(:@fails, 1)
      result.instance_variable_set(:@artifacts, [])
      result.instance_variable_set(:@features, [])
      
      def result.fails; @fails; end
      def result.artifacts; @artifacts; end
      def result.features; @features; end
      
      result
    end
    
    def receiveTestResourceConfig(partialTestResource, websocket_port = 'ipcfile')
      puts "receiveTestResourceConfig: called"
      puts "  partialTestResource: #{partialTestResource}"
      puts "  websocket_port: #{websocket_port}"
      
      # Parse the test resource configuration
      test_resource_config = parse_test_resource_config(partialTestResource)
      puts "  test_resource_config.fs: #{test_resource_config.fs}"
      puts "  test_resource_config.name: #{test_resource_config.name}"
      
      pm = PM_Ruby.new(test_resource_config, websocket_port)
      puts "  PM_Ruby created"
      
      # Run all test jobs
      total_fails = 0
      all_features = []
      all_artifacts = []
      suite_results = []
      
      puts "  Number of test jobs: #{@test_jobs.length}"
      @test_jobs.each_with_index do |job, i|
        puts "  Processing job #{i}"
        begin
          # Update the job's receiveTestResourceConfig to pass test_resource_config
          result = run_test_job(job[:suite], pm, test_resource_config)
          puts "    Job #{i} result: fails=#{result.fails}, features=#{result.features.length}, artifacts=#{result.artifacts.length}"
          total_fails += result.fails
          all_features.concat(result.features)
          all_artifacts.concat(result.artifacts)
          suite_results << job[:to_obj].call
        rescue => e
          puts "Error running test job: #{e.message}"
          puts e.backtrace
          total_fails += 1
        end
      end
      
      puts "  Total fails: #{total_fails}"
      puts "  All features: #{all_features.uniq}"
      puts "  All artifacts: #{all_artifacts}"
      
      # Calculate total tests
      total_tests = @specs.sum do |suite_spec|
        suite_spec['givens'] ? suite_spec['givens'].length : 0
      end
      puts "  Total tests: #{total_tests}"
      
      # Write tests.json
      write_tests_json(test_resource_config, suite_results, total_fails, all_features.uniq, all_artifacts, total_tests)
      
      # Get the first test job's to_obj result
      test_job_obj = @test_jobs.first ? @test_jobs.first[:to_obj].call : {}
      puts "  test_job_obj: #{test_job_obj}"
      
      # Return result
      result = IFinalResults.new(
        failed: total_fails > 0,
        fails: total_fails,
        artifacts: all_artifacts,
        features: all_features.uniq,
        tests: 0,  # This could be calculated differently
        run_time_tests: total_tests,
        test_job: test_job_obj
      )
      puts "  Returning IFinalResults"
      result
    end
    
    private
    
    def parse_test_resource_config(partialTestResource)
      puts "parse_test_resource_config: called with #{partialTestResource}"
      begin
        config = JSON.parse(partialTestResource)
        puts "  Parsed JSON: #{config}"
        # Create a hash that can be used as test resource configuration
        # The PM_Ruby expects certain methods to be available
        config_hash = {
          'name' => config['name'] || 'default',
          'fs' => config['fs'] || '.',
          'ports' => config['ports'] || [],
          'timeout' => config['timeout'] || 30000,
          'retries' => config['retries'] || 0,
          'environment' => config['environment'] || {}
        }
        puts "  config_hash: #{config_hash}"
        # Create an object that responds to the needed methods
        test_resource = Object.new
        test_resource.define_singleton_method(:name) { config_hash['name'] }
        test_resource.define_singleton_method(:fs) { config_hash['fs'] }
        test_resource.define_singleton_method(:ports) { config_hash['ports'] }
        test_resource.define_singleton_method(:timeout) { config_hash['timeout'] }
        test_resource.define_singleton_method(:retries) { config_hash['retries'] }
        test_resource.define_singleton_method(:environment) { config_hash['environment'] }
        puts "  test_resource created with fs: #{test_resource.fs}"
        test_resource
      rescue JSON::ParserError => e
        puts "  JSON parse error: #{e.message}"
        # If not valid JSON, create a default config
        test_resource = Object.new
        test_resource.define_singleton_method(:name) { 'default' }
        test_resource.define_singleton_method(:fs) { '.' }
        test_resource.define_singleton_method(:ports) { [] }
        test_resource.define_singleton_method(:timeout) { 30000 }
        test_resource.define_singleton_method(:retries) { 0 }
        test_resource.define_singleton_method(:environment) { {} }
        puts "  Created default test_resource with fs: #{test_resource.fs}"
        test_resource
      end
    end
    
    def write_tests_json(test_resource_config, suite_results, total_fails, features, artifacts, total_tests)
      puts "write_tests_json: starting"
      puts "  test_resource_config.fs: #{test_resource_config.fs}"
      puts "  total_fails: #{total_fails}"
      puts "  features count: #{features.length}"
      puts "  artifacts count: #{artifacts.length}"
      puts "  total_tests: #{total_tests}"
      
      # Get the first test job's to_obj result
      test_job_obj = @test_jobs.first ? @test_jobs.first[:to_obj].call : {}
      puts "  test_job_obj keys: #{test_job_obj.keys}"
      
      # Create the results object matching the TypeScript IFinalResults structure
      results = {
        'features' => features,
        'failed' => total_fails > 0,
        'fails' => total_fails,
        'artifacts' => artifacts,
        'tests' => 0,  # Could be calculated as number of givens
        'runTimeTests' => total_tests,
        'testJob' => test_job_obj
      }
      
      # Get the fs path from test resource configuration
      fs_path = test_resource_config.fs
      puts "  fs_path: #{fs_path}"
      puts "  fs_path class: #{fs_path.class}"
      
      # Ensure fs_path is a string
      fs_path = fs_path.to_s if fs_path.respond_to?(:to_s)
      puts "  fs_path after conversion: #{fs_path}"
      
      report_json_path = File.join(fs_path, 'tests.json')
      puts "  report_json_path: #{report_json_path}"
      puts "  absolute report_json_path: #{File.absolute_path(report_json_path)}"
      puts "  Current directory: #{Dir.pwd}"
      
      # Create directory if it doesn't exist
      dir_path = File.dirname(report_json_path)
      puts "  dir_path: #{dir_path}"
      puts "  Dir.exist?(dir_path): #{Dir.exist?(dir_path)}"
      
      begin
        FileUtils.mkdir_p(dir_path) unless Dir.exist?(dir_path)
        puts "  Directory created or already exists"
      rescue => e
        puts "  Error creating directory: #{e.message}"
      end
      
      # Write to file
      puts "  Writing JSON to file..."
      begin
        File.write(report_json_path, JSON.pretty_generate(results))
        puts "  File.write succeeded"
        puts "  File exists? #{File.exist?(report_json_path)}"
        puts "  File size: #{File.size(report_json_path) if File.exist?(report_json_path)}"
        puts "tests.json written to: #{report_json_path}"
      rescue => e
        puts "  Error writing file: #{e.message}"
        puts "  Backtrace: #{e.backtrace.first}"
      end
    end
  end
  
  # Main function
  def self.main
    puts "Rubeno.main: starting"
    
    # Check command line arguments
    puts "ARGV: #{ARGV}"
    if ARGV.length < 1
      puts "No test arguments provided - exiting"
      exit 0
    end
    
    partialTestResource = ARGV[0]
    websocket_port = ARGV[1] || 'ipcfile'
    puts "partialTestResource: #{partialTestResource}"
    puts "websocket_port: #{websocket_port}"
    
    # We need a default instance to run
    # In a real implementation, this would be set elsewhere
    puts "$default_rubeno_instance is nil? #{$default_rubeno_instance.nil?}"
    if $default_rubeno_instance.nil?
      puts "WARNING: No default Rubeno instance has been configured"
      puts "Creating a minimal default instance for testing..."
      
      # Create a minimal test implementation
      minimal_implementation = ITestImplementation.new(
        suites: { 'Default' => { description: "Default test suite" } },
        givens: { 
          'Default' => ->(initial_values) do
            puts "minimal given.Default callback called"
            # Return a simple object
            Object.new
          end
        },
        whens: {
          'noop' => ->() do
            ->(store) do
              store
            end
          end
        },
        thens: {
          'alwaysTrue' => ->() do
            ->(store) do
              true
            end
          end
        }
      )
      
      # Create a minimal test specification
      minimal_specification = ->(suites, givens, whens, thens) do
        puts "minimal_specification called"
        # The wrappers are objects with methods, not hashes
        # So we need to use them correctly
        [
          suites.Default('Minimal Test Suite', {
            'test1' => givens.Default(
              ['minimal test'],
              [],
              [thens.alwaysTrue()],
              nil
            )
          })
        ]
      end
      
      # Create and set a default instance
      puts "Creating minimal Rubeno instance..."
      $default_rubeno_instance = Rubeno.new(
        nil,
        minimal_specification,
        minimal_implementation,
        ITTestResourceRequest.new(ports: 0),
        SimpleTestAdapter.new
      )
      
      puts "Minimal default instance created"
    else
      puts "Using existing default instance"
    end
    
    puts "Calling receiveTestResourceConfig..."
    result = $default_rubeno_instance.receiveTestResourceConfig(partialTestResource, websocket_port)
    puts "Result fails: #{result.fails}"
    exit result.fails
  end
  
  # Store the default instance
  $default_rubeno_instance = nil
  
  def self.set_default_instance(instance)
    $default_rubeno_instance = instance
  end
  
  # Helper function to create a Rubeno instance
  def self.Rubeno(input_val = nil, test_specification = nil, test_implementation = nil, test_adapter = nil, test_resource_requirement = nil, uber_catcher = nil)
    instance = Rubeno.new(
      input_val,
      test_specification,
      test_implementation,
      test_resource_requirement || ITTestResourceRequest.new,
      test_adapter || SimpleTestAdapter.new,
      uber_catcher
    )
    instance
  end
end
