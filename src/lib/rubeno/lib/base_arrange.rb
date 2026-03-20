module Rubeno
  # BaseArrange extends BaseSetup for AAA pattern.
  class BaseArrange < BaseSetup
    def initialize(features, acts, asserts, arrange_cb, initial_values)
      # Map acts to actions, asserts to checks
      super(features, acts, asserts, arrange_cb, initial_values)
    end
    
    # Alias setup to arrange for AAA pattern
    def arrange(subject, key, test_resource_configuration, tester, artifactory = nil, suite_ndx = nil)
      setup(subject, key, test_resource_configuration, tester, artifactory, suite_ndx)
    end
  end
end
