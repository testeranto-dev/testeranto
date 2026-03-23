module Rubeno
  # BaseSetup is the unified base class for all setup phases.
  # It covers BDD's Given, AAA's Arrange, and TDT's Map.
  class BaseSetup
    attr_accessor :features, :actions, :checks, :error, :fail, :store, :recommended_fs_path,
                  :setup_cb, :initial_values, :key, :failed, :artifacts, :status, :fails, :_parent
    
    def initialize(features, actions, checks, setup_cb, initial_values)
      @features = features
      @actions = actions
      @checks = checks
      @setup_cb = setup_cb
      @initial_values = initial_values
      @artifacts = []
      @fails = 0
      @failed = false
      @error = nil
      @store = nil
      @key = ""
      @status = nil
      @_parent = nil
    end
    
    def add_artifact(path)
      if !path.is_a?(String)
        raise "[ARTIFACT ERROR] Expected string, got #{path.class}: #{path.inspect}"
      end
      normalized_path = path.gsub('\\', '/')
      @artifacts << normalized_path
    end
    
    def to_obj
      {
        key: @key,
        actions: (@actions || []).map { |a| a.respond_to?(:to_obj) ? a.to_obj : {} },
        checks: (@checks || []).map { |c| c.respond_to?(:to_obj) ? c.to_obj : {} },
        error: @error ? [@error, @error.backtrace] : nil,
        failed: @failed,
        features: @features || [],
        artifacts: @artifacts,
        status: @status
      }
    end
    
    def setup_that(subject, test_resource_configuration, artifactory, setup_cb, initial_values)
      # This should be implemented by subclasses
      raise NotImplementedError, "Subclasses must implement setup_that"
    end
    
    def after_each(store, key, artifactory)
      store
    end
    
    def setup(subject, key, test_resource_configuration, tester, artifactory = nil, suite_ndx = nil)
      @key = key
      @fails = 0
      
      actual_artifactory = artifactory
      unless actual_artifactory
        # Try to get artifactory from parent
        if self.respond_to?(:_parent) && @_parent && @_parent.respond_to?(:create_artifactory)
          actual_artifactory = @_parent.create_artifactory(given_key: key, suite_index: suite_ndx)
        else
          # Create a default artifactory
          actual_artifactory = {
            write_file_sync: ->(filename, payload) {
              puts "[Artifactory] Would write to: #{filename}"
            },
            screenshot: ->(filename, payload = nil) {
              puts "[Artifactory] Would take screenshot: #{filename}"
            }
          }
        end
      end
      
      begin
        @store = setup_that(
          subject,
          test_resource_configuration,
          actual_artifactory,
          @setup_cb,
          @initial_values
        )
        @status = true
      rescue => e
        @status = false
        @failed = true
        @fails += 1
        @error = e
        return @store
      end
      
      begin
        # Process actions
        (@actions || []).each_with_index do |action_step, action_ndx|
          begin
            # Create artifactory for action context
            action_artifactory = create_artifactory_for_action(key, action_ndx, suite_ndx, actual_artifactory)
            @store = action_step.test(
              @store,
              test_resource_configuration,
              action_artifactory
            )
          rescue => e
            @failed = true
            @fails += 1
            @error = e
          end
        end
        
        # Process checks
        @checks.each_with_index do |check_step, check_ndx|
          begin
            # Create artifactory for check context
            check_artifactory = create_artifactory_for_check(key, check_ndx, suite_ndx, actual_artifactory)
            filepath = suite_ndx ? "suite-#{suite_ndx}/setup-#{key}/check-#{check_ndx}" : 
                                   "setup-#{key}/check-#{check_ndx}"
            t = check_step.test(
              @store,
              test_resource_configuration,
              filepath,
              check_artifactory
            )
            tester.call(t)
          rescue => e
            @failed = true
            @fails += 1
            @error = e
          end
        end
      rescue => e
        @error = e
        @failed = true
        @fails += 1
      ensure
        begin
          after_each(@store, @key, actual_artifactory)
        rescue => e
          @failed = true
          @fails += 1
        end
      end
      
      @store
    end
    
    private
    
    def create_artifactory_for_action(key, action_index, suite_ndx, base_artifactory)
      # Try to get artifactory from parent
      if self.respond_to?(:_parent) && @_parent && @_parent.respond_to?(:create_artifactory)
        return @_parent.create_artifactory(given_key: key, when_index: action_index, suite_index: suite_ndx)
      end
      
      # Fallback to base artifactory
      base_artifactory
    end
    
    def create_artifactory_for_check(key, check_index, suite_ndx, base_artifactory)
      # Try to get artifactory from parent
      if self.respond_to?(:_parent) && @_parent && @_parent.respond_to?(:create_artifactory)
        return @_parent.create_artifactory(given_key: key, then_index: check_index, suite_index: suite_ndx)
      end
      
      # Fallback to base artifactory
      base_artifactory
    end
  end
end
