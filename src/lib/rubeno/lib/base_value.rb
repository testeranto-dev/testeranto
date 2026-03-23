module Rubeno
  # BaseValue extends BaseSetup for TDT pattern.
  # Sets up table data for table-driven testing.
  class BaseValue < BaseSetup
    attr_accessor :table_rows, :adapter
    
    def initialize(features, table_rows, confirm_cb, initial_values)
      # For TDT, actions will be Should and checks will be Expected
      super(features, [], [], confirm_cb, initial_values)
      @table_rows = table_rows || []
      @adapter = nil
    end
    
    def setup_that(subject, test_resource_configuration, artifactory, setup_cb, initial_values)
      # This should be implemented by subclasses
      raise NotImplementedError, "Subclasses must implement setup_that"
    end
    
    def after_each(store, key, artifactory)
      if @adapter && @adapter.respond_to?(:after_each)
        @adapter.after_each(store, key, artifactory)
      else
        store
      end
    end
    
    # Alias for TDT pattern
    def value(subject, key, test_resource_configuration, tester, artifactory = nil, suite_ndx = nil)
      setup(subject, key, test_resource_configuration, tester, artifactory, suite_ndx)
    end
  end
end
