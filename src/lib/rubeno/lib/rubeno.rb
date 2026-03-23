require 'json'
require 'fileutils'
require 'base_suite'
require 'base_setup'
require 'base_action'
require 'base_check'
require 'base_given'
require 'base_when'
require 'base_then'
require 'simple_adapter'
require 'types'

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
      
      # Generate specs - match TypeScript BaseTiposkripto which only passes BDD pattern wrappers
      puts "Rubeno.initialize: about to call test_specification"
      # Pass only BDD pattern wrappers to match TypeScript implementation
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
    
    def values_wrapper
      puts "values_wrapper: creating wrapper with methods: #{@values_overrides.keys}"
      wrapper = Object.new
      @values_overrides.each do |value_name, value_proc|
        wrapper.define_singleton_method(value_name.to_sym) do |features, table_rows, confirm_cb, initial_values|
          puts "values_wrapper.#{value_name} called with features: #{features}"
          value_proc.call(features, table_rows, confirm_cb, initial_values)
        end
      end
      puts "values_wrapper: returning wrapper"
      wrapper
    end
    
    def shoulds_wrapper
      puts "shoulds_wrapper: creating wrapper with methods: #{@shoulds_overrides.keys}"
      wrapper = Object.new
      @shoulds_overrides.each do |should_name, should_proc|
        wrapper.define_singleton_method(should_name.to_sym) do |*args|
          puts "shoulds_wrapper.#{should_name} called with args: #{args}"
          should_proc.call(*args)
        end
      end
      puts "shoulds_wrapper: returning wrapper"
      wrapper
    end
    
    def expecteds_wrapper
      puts "expecteds_wrapper: creating wrapper with methods: #{@expecteds_overrides.keys}"
      wrapper = Object.new
      @expecteds_overrides.each do |expected_name, expected_proc|
        wrapper.define_singleton_method(expected_name.to_sym) do |*args|
          puts "expecteds_wrapper.#{expected_name} called with args: #{args}"
          expected_proc.call(*args)
        end
      end
      puts "expecteds_wrapper: returning wrapper"
      wrapper
    end
    
    def describes_wrapper
      puts "describes_wrapper: creating wrapper with methods: #{@describes_overrides.keys}"
      wrapper = Object.new
      @describes_overrides.each do |describe_name, describe_proc|
        wrapper.define_singleton_method(describe_name.to_sym) do |features, its, describe_cb, initial_values|
          puts "describes_wrapper.#{describe_name} called with features: #{features}"
          describe_proc.call(features, its, describe_cb, initial_values)
        end
      end
      puts "describes_wrapper: returning wrapper"
      wrapper
    end
    
    def its_wrapper
      puts "its_wrapper: creating wrapper with methods: #{@its_overrides.keys}"
      wrapper = Object.new
      @its_overrides.each do |it_name, it_proc|
        wrapper.define_singleton_method(it_name.to_sym) do |*args|
          puts "its_wrapper.#{it_name} called with args: #{args}"
          it_proc.call(*args)
        end
      end
      puts "its_wrapper: returning wrapper"
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
      
      # Create classy givens (BDD pattern)
      if test_implementation.givens
        puts "  givens: #{test_implementation.givens.keys}"
        test_implementation.givens.each do |key, given_cb|
          @given_overrides[key] = ->(features, whens, thens, initial_values = nil) do
            puts "    given_wrapper.#{key} called with features: #{features}"
            given = BaseGiven.new(features, whens, thens, given_cb, initial_values, @test_adapter)
            given._parent = self
            given
          end
        end
      end
      
      # Create classy whens (BDD pattern)
      if test_implementation.whens
        puts "  whens: #{test_implementation.whens.keys}"
        test_implementation.whens.each do |key, when_cb_proc|
          @when_overrides[key] = ->(*args) do
            puts "    when_wrapper.#{key} called with args: #{args}"
            when_cb = when_cb_proc.call(*args)
            when_instance = BaseWhen.new(key, when_cb)
            when_instance.adapter = @test_adapter
            when_instance
          end
        end
      end
      
      # Create classy thens (BDD pattern)
      if test_implementation.thens
        puts "  thens: #{test_implementation.thens.keys}"
        test_implementation.thens.each do |key, then_cb_proc|
          @then_overrides[key] = ->(*args) do
            puts "    then_wrapper.#{key} called with args: #{args}"
            then_cb = then_cb_proc.call(*args)
            then_instance = BaseThen.new(key, then_cb)
            then_instance.adapter = @test_adapter
            then_instance
          end
        end
      end
      
      # Create classy values (TDT pattern)
      if test_implementation.values
        puts "  values: #{test_implementation.values.keys}"
        test_implementation.values.each do |key, value_cb|
          @values_overrides[key] = ->(features, table_rows, confirm_cb, initial_values) do
            puts "    values_wrapper.#{key} called with features: #{features}"
            value = BaseValue.new(features, table_rows, confirm_cb, initial_values)
            value._parent = self
            value
          end
        end
      end
      
      # Create classy shoulds (TDT pattern)
      if test_implementation.shoulds
        puts "  shoulds: #{test_implementation.shoulds.keys}"
        test_implementation.shoulds.each do |key, should_cb_proc|
          @shoulds_overrides[key] = ->(*args) do
            puts "    shoulds_wrapper.#{key} called with args: #{args}"
            should_cb = should_cb_proc.call(*args)
            BaseShould.new(key, should_cb)
          end
        end
      end
      
      # Create classy expecteds (TDT pattern)
      if test_implementation.expecteds
        puts "  expecteds: #{test_implementation.expecteds.keys}"
        test_implementation.expecteds.each do |key, expected_cb_proc|
          @expecteds_overrides[key] = ->(*args) do
            puts "    expecteds_wrapper.#{key} called with args: #{args}"
            expected_cb = expected_cb_proc.call(*args)
            BaseExpected.new(key, expected_cb)
          end
        end
      end
      
      # Create classy describes (Describe-It pattern)
      if test_implementation.describes
        puts "  describes: #{test_implementation.describes.keys}"
        test_implementation.describes.each do |key, describe_cb|
          @describes_overrides[key] = ->(features, its, describe_cb, initial_values) do
            puts "    describes_wrapper.#{key} called with features: #{features}"
            describe = BaseDescribe.new(features, its, describe_cb, initial_values)
            describe._parent = self
            describe
          end
        end
      end
      
      # Create classy its (Describe-It pattern)
      if test_implementation.its
        puts "  its: #{test_implementation.its.keys}"
        test_implementation.its.each do |key, it_cb_proc|
          @its_overrides[key] = ->(*args) do
            puts "    its_wrapper.#{key} called with args: #{args}"
            it_cb = it_cb_proc.call(*args)
            BaseIt.new(key, it_cb)
          end
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
    
    def run_test_job(suite, test_resource_config)
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
    
    # Create an artifactory that tracks context
    # Note: Ruby is a server-side language and CANNOT capture screenshots or screencasts
    # Only the Web runtime (browser environment) can do visual captures
    # This is a necessary difference between web and other runtimes
    def create_artifactory(context = {})
      base_path = @test_resource_configuration&.fs || "testeranto"
      
      puts "[Artifactory] Base path: #{base_path}"
      puts "[Artifactory] Context: #{context}"
      
      # Return an object with artifactory methods
      {
        write_file_sync: lambda do |filename, payload|
          # Construct path based on context
          path = ""
          
          # Add suite context if available
          if context[:suite_index]
            path += "suite-#{context[:suite_index]}/"
          end
          
          # Add given context if available
          if context[:given_key]
            path += "given-#{context[:given_key]}/"
          end
          
          # Add when or then context
          if context[:when_index]
            path += "when-#{context[:when_index]} "
          elsif context[:then_index]
            path += "then-#{context[:then_index]} "
          end
          
          # Add the filename
          path += filename
          
          # Ensure it has a .txt extension if not present
          unless path.match(/\.[a-zA-Z0-9]+$/)
            path += ".txt"
          end
          
          # Prepend the base path
          base_path_clean = base_path.gsub(/\/$/, '')
          path_clean = path.gsub(/^\//, '')
          full_path = "#{base_path_clean}/#{path_clean}"
          
          puts "[Artifactory] Full path: #{full_path}"
          
          # Write the file
          write_file_sync(full_path, payload)
        end
        
        # Note: We do NOT include screenshot, open_screencast, or close_screencast methods
        # because Ruby is a server-side language and cannot capture visual content
        # This is a necessary difference between web and other runtimes
      }
    end
    
    # Abstract method to be implemented by concrete runtimes
    def write_file_sync(filename, payload)
      # Ensure directory exists
      dir = File.dirname(filename)
      FileUtils.mkdir_p(dir) unless Dir.exist?(dir)
      
      # Write file
      File.write(filename, payload)
      puts "[write_file_sync] Wrote to #{filename}"
    end
    
    def receiveTestResourceConfig(partialTestResource, websocket_port = 'ipcfile')
      puts "receiveTestResourceConfig: called"
      puts "  partialTestResource: #{partialTestResource}"
      puts "  websocket_port: #{websocket_port}"
      
      # Parse the test resource configuration
      test_resource_config = parse_test_resource_config(partialTestResource)
      @test_resource_configuration = test_resource_config
      puts "  test_resource_config.fs: #{test_resource_config.fs}"
      puts "  test_resource_config.name: #{test_resource_config.name}"
      
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
          result = run_test_job(job[:suite], test_resource_config)
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
