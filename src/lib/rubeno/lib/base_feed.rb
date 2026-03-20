module Rubeno
  # BaseFeed extends BaseAction to support TDT (Table Driven Testing) pattern.
  class BaseFeed < BaseAction
    attr_accessor :row_index, :row_data
    
    def initialize(name, feed_cb)
      super(name, feed_cb)
      @row_index = -1
      @row_data = nil
    end
    
    # Set the current row data before processing
    def set_row_data(index, data)
      @row_index = index
      @row_data = data
    end
    
    # Alias perform_action to feed for TDT pattern
    def feed(store, feed_cb, test_resource)
      perform_action(store, feed_cb, test_resource)
    end
    
    # Alias test to process_row for TDT pattern
    def process_row(store, test_resource_configuration, row_index, row_data)
      set_row_data(row_index, row_data)
      test(store, test_resource_configuration)
    end
  end
end
