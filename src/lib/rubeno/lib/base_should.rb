module Rubeno
  # BaseShould extends BaseAction for TDT pattern.
  # Processes each row in table-driven testing.
  class BaseShould < BaseAction
    attr_accessor :current_row, :row_index
    
    def initialize(name, should_cb)
      super(name, should_cb)
      @current_row = []
      @row_index = -1
    end
    
    def perform_action(store, action_cb, test_resource, artifactory = nil)
      # This should be implemented by subclasses
      raise NotImplementedError, "Subclasses must implement perform_action"
    end
    
    # Set current row data
    def set_row_data(row_index, row_data)
      @row_index = row_index
      @current_row = row_data
    end
    
    # Process the current row
    def process_row(store, test_resource_configuration, artifactory = nil)
      test(store, test_resource_configuration, artifactory)
    end
    
    # Alias for TDT pattern
    def should(store, should_cb, test_resource_configuration, artifactory = nil)
      perform_action(store, should_cb, test_resource_configuration, artifactory)
    end
  end
end
