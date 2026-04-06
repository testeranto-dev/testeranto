require 'json'
require 'fileutils'
require 'base_suite'
require 'base_setup'
require 'base_action'
require 'base_check'
require 'base_given'
require 'base_when'
require 'base_then'
require 'base_confirm'
require 'simple_adapter'
require 'types'

# Load the split files
require_relative 'rubeno/core'
require_relative 'rubeno/wrappers'
require_relative 'rubeno/initialization'
require_relative 'rubeno/test_jobs'
require_relative 'rubeno/artifactory'

module Rubeno
  class Rubeno
    # These methods are defined in the split files
    
    # Add the remaining methods that weren't split
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
        # Update the job's receiveTestResourceConfig to pass test_resource_config
        result = run_test_job(job[:suite], test_resource_config)
        puts "    Job #{i} result: fails=#{result.fails}, features=#{result.features.length}, artifacts=#{result.artifacts.length}"
        total_fails += result.fails
        all_features.concat(result.features)
        all_artifacts.concat(result.artifacts)
        suite_results << job[:to_obj].call
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
