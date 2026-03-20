module Rubeno
  class BaseThen < BaseCheck
    def initialize(name, then_cb)
      super(name, then_cb)
    end
    
    def verify_check(store, check_cb, test_resource_configuration)
      # Call the check_cb directly
      check_cb.call(store)
    end
    
    # Alias for BDD pattern
    def but_then(store, then_cb, test_resource_configuration, pm)
      verify_check(store, then_cb, test_resource_configuration)
    end
    
    # Override test to not require filepath for backward compatibility
    def test(store, test_resource_configuration, filepath = nil)
      super(store, test_resource_configuration, filepath)
    end
  end
end
