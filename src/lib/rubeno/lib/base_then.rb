module Rubeno
  class BaseThen < BaseCheck
    attr_accessor :adapter
    
    def initialize(name, then_cb)
      super(name, then_cb)
      @adapter = nil
    end
    
    def verify_check(store, check_cb, test_resource_configuration, artifactory = nil)
      # This should call the adapter's verify method if available
      if @adapter && @adapter.respond_to?(:verify)
        @adapter.verify(store, check_cb, test_resource_configuration, artifactory)
      else
        # Fallback to calling the check_cb directly
        if check_cb.respond_to?(:call)
          check_cb.call(store)
        else
          store
        end
      end
    end
    
    # Alias for BDD pattern - kept for compatibility but uses universal method internally
    def but_then(store, then_cb, test_resource_configuration, artifactory = nil)
      verify_check(store, then_cb, test_resource_configuration, artifactory)
    end
    
    # Override test to not require filepath for backward compatibility
    def test(store, test_resource_configuration, filepath = nil, artifactory = nil)
      super(store, test_resource_configuration, filepath, artifactory)
    end
  end
end
