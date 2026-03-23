require 'types'

module Rubeno
  class SimpleTestAdapter
    include ITestAdapter
    
    # Universal adapter methods only
    def prepare_all(input_val, test_resource, artifactory = nil)
      puts "[SimpleTestAdapter] prepare_all called with artifactory: #{artifactory ? 'present' : 'nil'}"
      input_val
    end
    
    def prepare_each(subject, initializer, test_resource, initial_values, artifactory = nil)
      puts "[SimpleTestAdapter] prepare_each called with artifactory: #{artifactory ? 'present' : 'nil'}"
      if initializer.respond_to?(:call)
        initializer.call(subject)
      else
        subject
      end
    end
    
    def execute(store, action_cb, test_resource, artifactory = nil)
      puts "[SimpleTestAdapter] execute called with artifactory: #{artifactory ? 'present' : 'nil'}"
      if action_cb.respond_to?(:call)
        action_cb.call(store)
      else
        store
      end
    end
    
    def verify(store, check_cb, test_resource, artifactory = nil)
      puts "[SimpleTestAdapter] verify called with artifactory: #{artifactory ? 'present' : 'nil'}"
      if check_cb.respond_to?(:call)
        check_cb.call(store)
      else
        store
      end
    end
    
    def cleanup_each(store, key, artifactory = nil)
      puts "[SimpleTestAdapter] cleanup_each called with artifactory: #{artifactory ? 'present' : 'nil'}"
      store
    end
    
    def cleanup_all(store, artifactory = nil)
      puts "[SimpleTestAdapter] cleanup_all called with artifactory: #{artifactory ? 'present' : 'nil'}"
      store
    end
    
    # Assertion - standardized name across all languages
    def assert(x)
      !!x
    end
  end
end
