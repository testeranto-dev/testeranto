module Rubeno
  class Rubeno
    def initialize_classy_implementations(test_implementation)
      puts "initialize_classy_implementations: starting"
      # Create classy suites
      puts "  suites: #{test_implementation.suites.keys}"
      test_implementation.suites.each do |key, suite_data|
        @suites_overrides[key] = ->(description, givens_dict) do
          puts "    suites_wrapper.#{key} called with description: #{description}"
          {
            'name' => description,
            'givens' => givens_dict
          }
        end
      end
      
      # Create classy givens (BDD pattern)
      if test_implementation.givens
        puts "  givens: #{test_implementation.givens.keys}"
        test_implementation.givens.each do |key, given_cb|
          @given_overrides[key] = ->(features, whens, thens, initial_values = nil) do
            puts "    given_wrapper.#{key} called with features: #{features}"
            given = BaseGiven.new(features, whens, thens, given_cb, initial_values, @test_adapter)
            given._parent = self
            given
          end
        end
      end
      
      # Create classy whens (BDD pattern)
      if test_implementation.whens
        puts "  whens: #{test_implementation.whens.keys}"
        test_implementation.whens.each do |key, when_cb_proc|
          @when_overrides[key] = ->(*args) do
            puts "    when_wrapper.#{key} called with args: #{args}"
            when_cb = when_cb_proc.call(*args)
            when_instance = BaseWhen.new(key, when_cb)
            when_instance.adapter = @test_adapter
            when_instance
          end
        end
      end
      
      # Create classy thens (BDD pattern)
      if test_implementation.thens
        puts "  thens: #{test_implementation.thens.keys}"
        test_implementation.thens.each do |key, then_cb_proc|
          @then_overrides[key] = ->(*args) do
            puts "    then_wrapper.#{key} called with args: #{args}"
            then_cb = then_cb_proc.call(*args)
            then_instance = BaseThen.new(key, then_cb)
            then_instance.adapter = @test_adapter
            then_instance
          end
        end
      end
      
      # Create classy confirms (TDT pattern)
      if test_implementation.confirms
        puts "  confirms: #{test_implementation.confirms.keys}"
        test_implementation.confirms.each do |key, confirm_cb|
          @confirms_overrides[key] = ->(*args) do
            puts "    confirms_wrapper.#{key} called with args: #{args}"
            ->(test_cases, features) do
              puts "      creating BaseConfirm with #{test_cases.length} test cases"
              # In TypeScript, confirm_cb is a function that returns the test function
              actual_confirm_cb = confirm_cb
              if confirm_cb.respond_to?(:call)
                actual_confirm_cb = confirm_cb.call
              end
              confirm = BaseConfirm.new(features, test_cases, actual_confirm_cb, nil)
              confirm.set_parent(self)
              confirm
            end
          end
        end
      end
      
      # Create classy values (TDT pattern)
      if test_implementation.values
        puts "  values: #{test_implementation.values.keys}"
        test_implementation.values.each do |key, value_cb|
          @values_overrides[key] = ->(features, table_rows, confirm_cb, initial_values) do
            puts "    values_wrapper.#{key} called with features: #{features}"
            value = BaseValue.new(features, table_rows, confirm_cb, initial_values)
            value._parent = self
            value
          end
        end
      end
      
      # Create classy shoulds (TDT pattern)
      if test_implementation.shoulds
        puts "  shoulds: #{test_implementation.shoulds.keys}"
        test_implementation.shoulds.each do |key, should_cb_proc|
          @shoulds_overrides[key] = ->(*args) do
            puts "    shoulds_wrapper.#{key} called with args: #{args}"
            should_cb = should_cb_proc.call(*args)
            BaseShould.new(key, should_cb)
          end
        end
      end
      
      # Create classy expecteds (TDT pattern)
      if test_implementation.expecteds
        puts "  expecteds: #{test_implementation.expecteds.keys}"
        test_implementation.expecteds.each do |key, expected_cb_proc|
          @expecteds_overrides[key] = ->(*args) do
            puts "    expecteds_wrapper.#{key} called with args: #{args}"
            expected_cb = expected_cb_proc.call(*args)
            BaseExpected.new(key, expected_cb)
          end
        end
      end
      
      # Create classy describes (Describe-It pattern)
      if test_implementation.describes
        puts "  describes: #{test_implementation.describes.keys}"
        test_implementation.describes.each do |key, describe_cb|
          @describes_overrides[key] = ->(features, its, describe_cb, initial_values) do
            puts "    describes_wrapper.#{key} called with features: #{features}"
            describe = BaseDescribe.new(features, its, describe_cb, initial_values)
            describe._parent = self
            describe
          end
        end
      end
      
      # Create classy its (Describe-It pattern)
      if test_implementation.its
        puts "  its: #{test_implementation.its.keys}"
        test_implementation.its.each do |key, it_cb_proc|
          @its_overrides[key] = ->(*args) do
            puts "    its_wrapper.#{key} called with args: #{args}"
            it_cb = it_cb_proc.call(*args)
            BaseIt.new(key, it_cb)
          end
        end
      end
      
      puts "initialize_classy_implementations: done"
    end
  end
end
