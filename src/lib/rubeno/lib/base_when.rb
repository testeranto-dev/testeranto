module Rubeno
  class BaseWhen < BaseAction
    def initialize(name, when_cb)
      super(name, when_cb)
    end
    
    def perform_action(store, action_cb, test_resource)
      # Call the action_cb directly
      action_cb.call(store)
    end
    
    # Alias for BDD pattern
    def and_when(store, when_cb, test_resource_configuration, pm)
      perform_action(store, when_cb, test_resource_configuration)
    end
  end
end
