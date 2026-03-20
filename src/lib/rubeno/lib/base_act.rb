module Rubeno
  # BaseAct extends BaseAction to support AAA pattern.
  class BaseAct < BaseAction
    def initialize(name, act_cb)
      super(name, act_cb)
    end
    
    # Alias perform_action to perform_act for AAA pattern
    def perform_act(store, act_cb, test_resource)
      perform_action(store, act_cb, test_resource)
    end
    
    # Alias test to act for AAA pattern
    def act(store, test_resource_configuration)
      test(store, test_resource_configuration)
    end
  end
end
