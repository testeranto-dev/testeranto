module Rubeno
  # BaseAssert extends BaseCheck to support AAA pattern.
  class BaseAssert < BaseCheck
    def initialize(name, assert_cb)
      super(name, assert_cb)
    end
    
    # Alias verify_check to verify_assert for AAA pattern
    def verify_assert(store, assert_cb, test_resource_configuration)
      verify_check(store, assert_cb, test_resource_configuration)
    end
    
    # Alias test to verify for AAA pattern
    def verify(store, test_resource_configuration, filepath = nil)
      test(store, test_resource_configuration, filepath)
    end
  end
end
