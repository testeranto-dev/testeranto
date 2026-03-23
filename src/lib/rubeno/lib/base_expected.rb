module Rubeno
  # BaseExpected extends BaseCheck for TDT pattern.
  # Validates each row in table-driven testing.
  class BaseExpected < BaseCheck
    attr_accessor :expected_value
    
    def initialize(name, expected_cb)
      super(name, expected_cb)
      @expected_value = nil
    end
    
    def verify_check(store, check_cb, test_resource_configuration, artifactory = nil)
      # This should be implemented by subclasses
      raise NotImplementedError, "Subclasses must implement verify_check"
    end
    
    # Set expected value for current row
    def set_expected_value(expected)
      @expected_value = expected
    end
    
    # Validate current row
    def validate_row(store, test_resource_configuration, filepath, expected_value, artifactory = nil)
      set_expected_value(expected_value)
      test(store, test_resource_configuration, filepath, artifactory)
    end
    
    # Alias for TDT pattern
    def expected(store, expected_cb, test_resource_configuration, artifactory = nil)
      verify_check(store, expected_cb, test_resource_configuration, artifactory)
    end
  end
end
