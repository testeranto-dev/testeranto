module Rubeno
  class BaseWhen < BaseAction
    attr_accessor :adapter
    
    def initialize(name, when_cb)
      super(name, when_cb)
      @adapter = nil
    end
    
    def perform_action(store, action_cb, test_resource, artifactory = nil)
      # Default implementation that can be overridden
      # This should call the adapter's execute method
      if @adapter && @adapter.respond_to?(:execute)
        @adapter.execute(store, action_cb, test_resource, artifactory)
      else
        # Fallback to calling the action_cb directly
        if action_cb.respond_to?(:call)
          action_cb.call(store)
        else
          store
        end
      end
    end
    
    # Alias for BDD pattern - kept for compatibility but uses universal method internally
    def and_when(store, when_cb, test_resource_configuration, artifactory = nil)
      perform_action(store, when_cb, test_resource_configuration, artifactory)
    end
  end
end
