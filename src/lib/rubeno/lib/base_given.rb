module Rubeno
  class BaseGiven < BaseSetup
    def initialize(features, whens, thens, given_cb, initial_values, adapter = nil)
      # Map whens to actions, thens to checks
      super(features, whens, thens, given_cb, initial_values)
      @adapter = adapter
    end
    
    def setup_that(subject, test_resource_configuration, artifactory, setup_cb, initial_values)
      # Use the adapter's before_each method if available
      if @adapter
        @adapter.before_each(subject, setup_cb, test_resource_configuration, initial_values, nil)
      else
        # Fallback to just returning the subject
        subject
      end
    end
    
    def after_each(store, key, artifactory)
      store
    end
    
    # Alias for BDD pattern
    def give(subject, key, test_resource_configuration, tester, artifactory = nil, suite_ndx = nil)
      setup(subject, key, test_resource_configuration, tester, artifactory, suite_ndx)
    end
  end
end
