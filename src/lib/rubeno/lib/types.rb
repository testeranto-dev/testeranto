module Rubeno
  # Type definitions for Rubeno
  
  # Test resource configuration
  class ITTestResourceConfiguration
    attr_accessor :name, :fs, :ports, :browser_ws_endpoint, :timeout, :retries, :environment
    
    def initialize(name:, fs:, ports:, browser_ws_endpoint: nil, timeout: nil, retries: nil, environment: {})
      @name = name
      @fs = fs
      @ports = ports
      @browser_ws_endpoint = browser_ws_endpoint
      @timeout = timeout
      @retries = retries
      @environment = environment
    end
  end
  
  # Test adapter interface - Universal adapter methods only
  module ITestAdapter
    # Lifecycle hooks
    def prepare_all(input_val, test_resource, artifactory = nil)
      input_val
    end
    
    def prepare_each(subject, initializer, test_resource, initial_values, artifactory = nil)
      # Call the initializer to get the store
      if initializer.respond_to?(:call)
        initializer.call(subject)
      else
        subject
      end
    end
    
    # Execution
    def execute(store, action_cb, test_resource, artifactory = nil)
      # Call the action_cb with the store to get the modified store
      if action_cb.respond_to?(:call)
        action_cb.call(store)
      else
        store
      end
    end
    
    # Verification
    def verify(store, check_cb, test_resource, artifactory = nil)
      # Call the check_cb with the store to perform assertions
      if check_cb.respond_to?(:call)
        check_cb.call(store)
      else
        store
      end
    end
    
    # Cleanup
    def cleanup_each(store, key, artifactory = nil)
      store
    end
    
    def cleanup_all(store, artifactory = nil)
      store
    end
    
    # Assertion - standardized name across all languages
    def assert(x)
      !!x
    end
  end
  
  # Test specification function type
  ITestSpecification = Proc
  
  # Test implementation structure with all patterns
  class ITestImplementation
    attr_accessor :suites, :givens, :whens, :thens,
                  :values, :shoulds, :expecteds,
                  :describes, :its
    
    def initialize(suites:, givens: {}, whens: {}, thens: {},
                   values: {}, shoulds: {}, expecteds: {},
                   describes: {}, its: {})
      @suites = suites
      @givens = givens
      @whens = whens
      @thens = thens
      @values = values
      @shoulds = shoulds
      @expecteds = expecteds
      @describes = describes
      @its = its
    end
  end
  
  # Test resource request
  class ITTestResourceRequest
    attr_accessor :ports
    
    def initialize(ports: 0)
      @ports = ports
    end
  end
  
  # Final results
  class IFinalResults
    attr_accessor :failed, :fails, :artifacts, :features, :tests, :run_time_tests, :test_job
    
    def initialize(failed:, fails:, artifacts:, features:, tests: 0, run_time_tests: 0, test_job: {})
      @failed = failed
      @fails = fails
      @artifacts = artifacts
      @features = features
      @tests = tests
      @run_time_tests = run_time_tests
      @test_job = test_job
    end
  end
  
  # Unified Pattern Types
  ISetups = Hash
  IActions = Hash
  IChecks = Hash
  
  # AAA Pattern Types
  IArranges = Hash
  IActs = Hash
  IAsserts = Hash
  
  # TDT Pattern Types
  IMaps = Hash
  IFeeds = Hash
  IValidates = Hash
  
  # BDD Pattern Types
  IGivens = Hash
  IWhens = Hash
  IThens = Hash
end
