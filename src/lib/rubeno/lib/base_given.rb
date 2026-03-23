module Rubeno
  class BaseGiven < BaseSetup
    attr_accessor :_parent, :_suite_index, :adapter
    
    def initialize(features, whens, thens, given_cb, initial_values, adapter = nil)
      # Map whens to actions, thens to checks
      super(features, whens, thens, given_cb, initial_values)
      @adapter = adapter
      @_parent = nil
    end
    
    def setup_that(subject, test_resource_configuration, artifactory, setup_cb, initial_values)
      # Call the adapter's prepare_each method
      if @adapter && @adapter.respond_to?(:prepare_each)
        @adapter.prepare_each(
          subject,
          setup_cb,
          test_resource_configuration,
          initial_values,
          artifactory
        )
      else
        # Fallback to calling the setup_cb directly
        if setup_cb.respond_to?(:call)
          setup_cb.call(subject)
        else
          subject
        end
      end
    end
    
    def after_each(store, key, artifactory)
      if @adapter && @adapter.respond_to?(:after_each)
        @adapter.after_each(store, key, artifactory)
      else
        store
      end
    end
    
    # Alias for BDD pattern
    def give(subject, key, test_resource_configuration, tester, artifactory = nil, suite_ndx = nil)
      @_suite_index = suite_ndx
      setup(subject, key, test_resource_configuration, tester, artifactory, suite_ndx)
    end
    
    # Create default artifactory if none provided
    def create_default_artifactory(given_key, suite_ndx = nil)
      base_path = "testeranto"
      if @_parent && @_parent.respond_to?(:test_resource_configuration) && @_parent.test_resource_configuration&.fs
        base_path = @_parent.test_resource_configuration.fs
      end
      
      {
        write_file_sync: lambda do |filename, payload|
          path = ""
          if suite_ndx
            path += "suite-#{suite_ndx}/"
          end
          path += "given-#{given_key}/"
          path += filename
          
          unless path.match(/\.[a-zA-Z0-9]+$/)
            path += ".txt"
          end
          
          full_path = "#{base_path}/#{path}"
          puts "[Artifactory] Would write to: #{full_path}"
          
          # Try to write using parent's write_file_sync if available
          if @_parent && @_parent.respond_to?(:write_file_sync)
            @_parent.write_file_sync(full_path, payload)
          end
        end,
        
        screenshot: lambda do |filename, payload = nil|
          puts "[Artifactory] Would take screenshot: #{filename}"
        end
      }
    end
  end
end
