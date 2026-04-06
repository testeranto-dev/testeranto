module Rubeno
  class Rubeno
    def suites_wrapper
      puts "suites_wrapper: creating wrapper with methods: #{@suites_overrides.keys}"
      # Return an object that responds to method calls for suite types
      wrapper = Object.new
      @suites_overrides.each do |suite_name, suite_proc|
        wrapper.define_singleton_method(suite_name.to_sym) do |description, givens_dict|
          puts "suites_wrapper.#{suite_name} called with description: #{description}"
          suite_proc.call(description, givens_dict)
        end
      end
      puts "suites_wrapper: returning wrapper"
      wrapper
    end
    
    def given_wrapper
      puts "given_wrapper: creating wrapper with methods: #{@given_overrides.keys}"
      wrapper = Object.new
      @given_overrides.each do |given_name, given_proc|
        wrapper.define_singleton_method(given_name.to_sym) do |features, whens, thens, initial_values = nil|
          puts "given_wrapper.#{given_name} called with features: #{features}"
          given_proc.call(features, whens, thens, initial_values)
        end
      end
      puts "given_wrapper: returning wrapper"
      wrapper
    end
    
    def when_wrapper
      puts "when_wrapper: creating wrapper with methods: #{@when_overrides.keys}"
      wrapper = Object.new
      @when_overrides.each do |when_name, when_proc|
        wrapper.define_singleton_method(when_name.to_sym) do |*args|
          puts "when_wrapper.#{when_name} called with args: #{args}"
          when_proc.call(*args)
        end
      end
      puts "when_wrapper: returning wrapper"
      wrapper
    end
    
    def then_wrapper
      puts "then_wrapper: creating wrapper with methods: #{@then_overrides.keys}"
      wrapper = Object.new
      @then_overrides.each do |then_name, then_proc|
        wrapper.define_singleton_method(then_name.to_sym) do |*args|
          puts "then_wrapper.#{then_name} called with args: #{args}"
          then_proc.call(*args)
        end
      end
      puts "then_wrapper: returning wrapper"
      wrapper
    end
    
    def values_wrapper
      puts "values_wrapper: creating wrapper with methods: #{@values_overrides.keys}"
      wrapper = Object.new
      @values_overrides.each do |value_name, value_proc|
        wrapper.define_singleton_method(value_name.to_sym) do |features, table_rows, confirm_cb, initial_values|
          puts "values_wrapper.#{value_name} called with features: #{features}"
          value_proc.call(features, table_rows, confirm_cb, initial_values)
        end
      end
      puts "values_wrapper: returning wrapper"
      wrapper
    end
    
    def shoulds_wrapper
      puts "shoulds_wrapper: creating wrapper with methods: #{@shoulds_overrides.keys}"
      wrapper = Object.new
      @shoulds_overrides.each do |should_name, should_proc|
        wrapper.define_singleton_method(should_name.to_sym) do |*args|
          puts "shoulds_wrapper.#{should_name} called with args: #{args}"
          should_proc.call(*args)
        end
      end
      puts "shoulds_wrapper: returning wrapper"
      wrapper
    end
    
    def expecteds_wrapper
      puts "expecteds_wrapper: creating wrapper with methods: #{@expecteds_overrides.keys}"
      wrapper = Object.new
      @expecteds_overrides.each do |expected_name, expected_proc|
        wrapper.define_singleton_method(expected_name.to_sym) do |*args|
          puts "expecteds_wrapper.#{expected_name} called with args: #{args}"
          expected_proc.call(*args)
        end
      end
      puts "expecteds_wrapper: returning wrapper"
      wrapper
    end

    def confirms_wrapper
      puts "confirms_wrapper: creating wrapper with methods: #{@confirms_overrides.keys}"
      wrapper = Object.new
      @confirms_overrides.each do |confirm_name, confirm_proc|
        wrapper.define_singleton_method(confirm_name.to_sym) do |*args|
          puts "confirms_wrapper.#{confirm_name} called with args: #{args}"
          confirm_proc.call(*args)
        end
      end
      puts "confirms_wrapper: returning wrapper"
      wrapper
    end
    
    def describes_wrapper
      puts "describes_wrapper: creating wrapper with methods: #{@describes_overrides.keys}"
      wrapper = Object.new
      @describes_overrides.each do |describe_name, describe_proc|
        wrapper.define_singleton_method(describe_name.to_sym) do |features, its, describe_cb, initial_values|
          puts "describes_wrapper.#{describe_name} called with features: #{features}"
          describe_proc.call(features, its, describe_cb, initial_values)
        end
      end
      puts "describes_wrapper: returning wrapper"
      wrapper
    end
    
    def its_wrapper
      puts "its_wrapper: creating wrapper with methods: #{@its_overrides.keys}"
      wrapper = Object.new
      @its_overrides.each do |it_name, it_proc|
        wrapper.define_singleton_method(it_name.to_sym) do |*args|
          puts "its_wrapper.#{it_name} called with args: #{args}"
          it_proc.call(*args)
        end
      end
      puts "its_wrapper: returning wrapper"
      wrapper
    end
  end
end
