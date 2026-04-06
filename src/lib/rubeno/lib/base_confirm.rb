module Rubeno
  # BaseConfirm for TDT (Table-Driven Testing) pattern.
  # Standalone class similar to BaseGiven but for table-driven testing.
  class BaseConfirm
    attr_accessor :features, :test_cases, :confirm_cb, :initial_values, :key, :failed, :artifacts, :fails, :status, :error, :store,
                  :test_resource_configuration
    
    def initialize(features, test_cases, confirm_cb, initial_values)
      @features = features
      @test_cases = test_cases || []
      @confirm_cb = confirm_cb
      @initial_values = initial_values
      @artifacts = []
      @fails = 0
      @failed = false
      @error = nil
      @store = nil
      @key = ""
      @status = nil
      @test_resource_configuration = nil
    end
    
    def add_artifact(path)
      normalized_path = path.gsub('\\', '/')
      @artifacts << normalized_path
    end
    
    def set_parent(parent)
      @_parent = parent
    end
    
    def to_obj
      {
        key: @key,
        features: @features,
        test_cases: @test_cases,
        failed: @failed,
        fails: @fails,
        error: @error ? "#{@error.class}: #{@error.message}" : nil,
        artifacts: @artifacts,
        status: @status
      }
    end
    
    def confirm(subject, key, test_resource_configuration, tester, artifactory = nil, suite_ndx = nil)
      @key = key
      @fails = 0
      @test_resource_configuration = test_resource_configuration
      
      # Store suite index for use in artifactory creation
      @_suite_index = suite_ndx
      
      # For TDT tests, the confirm_cb is the function to test
      @store = nil
      @status = true
      
      begin
        # Process each test case
        @test_cases.each_with_index do |test_case, case_index|
          begin
            if test_case.is_a?(Array) && test_case.length >= 2
              value, should = test_case
              
              # Get the input from value
              input = value.respond_to?(:call) ? value.call : value
              
              # Compute actual result using confirm_cb
              test_fn = @confirm_cb
              if test_fn.respond_to?(:call)
                actual_result = if input.is_a?(Array)
                  test_fn.call(*input)
                else
                  test_fn.call(input)
                end
                
                # Call should with the actual result
                if should.respond_to?(:call)
                  passed = should.call(actual_result)
                  tester.call(passed)
                elsif should.respond_to?(:process_row)
                  passed = should.process_row(actual_result, test_resource_configuration, artifactory)
                  tester.call(passed)
                else
                  tester.call(true)
                end
              end
            end
          rescue => e
            @failed = true
            @fails += 1
            @error = e
          end
        end
      rescue => e
        @failed = true
        @fails += 1
        @error = e
      end
      
      @store
    end
    
    # Alias for run to match BaseSuite expectations
    def run(subject, test_resource_configuration, artifactory = nil)
      confirm(subject, @key || "confirm", test_resource_configuration, ->(t) { !!t }, artifactory)
    end
  end
end
