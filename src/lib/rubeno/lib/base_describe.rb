module Rubeno
  # BaseDescribe extends BaseSetup for Describe-It pattern (AAA).
  # Describe can be nested, and Its can mix mutations and assertions.
  class BaseDescribe < BaseSetup
    attr_accessor :its, :adapter
    
    def initialize(features, its, describe_cb, initial_values)
      # Since Its can mix mutations and assertions, we need to handle them differently
      super(features, its, [], describe_cb, initial_values)
      @its = its || []
      @adapter = nil
    end
    
    def setup_that(subject, test_resource_configuration, artifactory, setup_cb, initial_values)
      # This should be implemented by subclasses
      raise NotImplementedError, "Subclasses must implement setup_that"
    end
    
    def after_each(store, key, artifactory)
      if @adapter && @adapter.respond_to?(:after_each)
        @adapter.after_each(store, key, artifactory)
      else
        store
      end
    end
    
    # Alias for Describe-It pattern
    def describe(subject, key, test_resource_configuration, tester, artifactory = nil, suite_ndx = nil)
      setup(subject, key, test_resource_configuration, tester, artifactory, suite_ndx)
    end
  end
end
