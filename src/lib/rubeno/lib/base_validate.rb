module Rubeno
  # BaseValidate extends BaseCheck to support TDT (Table Driven Testing) pattern.
  class BaseValidate < BaseCheck
    attr_accessor :expected_result
    
    def initialize(name, validate_cb)
      super(name, validate_cb)
      @expected_result = nil
    end
    
    # Set expected result before validation
    def set_expected_result(expected)
      @expected_result = expected
    end
    
    # Alias verify_check to validate for TDT pattern
    def validate(store, validate_cb, test_resource_configuration)
      verify_check(store, validate_cb, test_resource_configuration)
    end
    
    # Alias test to check for TDT pattern
    def check(store, test_resource_configuration, filepath, expected_result)
      set_expected_result(expected_result)
      test(store, test_resource_configuration, filepath)
    end
  end
end
