module Rubeno
  # BaseIt extends BaseAction for Describe-It pattern.
  # Its can mix mutations and assertions, unlike BDD's When which only does mutations.
  class BaseIt < BaseAction
    def initialize(name, it_cb)
      super(name, it_cb)
    end
    
    def perform_action(store, action_cb, test_resource, artifactory = nil)
      # This should be implemented by subclasses
      raise NotImplementedError, "Subclasses must implement perform_action"
    end
    
    # Alias perform_action to performIt
    def perform_it(store, it_cb, test_resource, artifactory = nil)
      perform_action(store, it_cb, test_resource, artifactory)
    end
    
    # Alias for Describe-It pattern
    def it(store, it_cb, test_resource_configuration, artifactory = nil)
      perform_action(store, it_cb, test_resource_configuration, artifactory)
    end
  end
end
