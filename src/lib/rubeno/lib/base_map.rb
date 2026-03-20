module Rubeno
  # BaseMap extends BaseSetup to support TDT (Table Driven Testing) pattern.
  class BaseMap < BaseSetup
    attr_accessor :table_data
    
    def initialize(features, feeds, validates, map_cb, initial_values, table_data = [])
      # Map feeds to actions, validates to checks
      super(features, feeds, validates, map_cb, initial_values)
      @table_data = table_data
    end
    
    # Alias setup to map for TDT pattern
    def map(subject, key, test_resource_configuration, tester, artifactory = nil, suite_ndx = nil)
      setup(subject, key, test_resource_configuration, tester, artifactory, suite_ndx)
    end
    
    # Method to get table data
    def get_table_data
      @table_data || []
    end
  end
end
