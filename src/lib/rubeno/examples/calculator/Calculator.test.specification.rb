module Rubeno
  module Examples
    module CalculatorTestSpecification
      def self.call(given_wrapper, when_wrapper, then_wrapper, 
                    describes_wrapper, its_wrapper, 
                    confirms_wrapper, values_wrapper, shoulds_wrapper)
        [
          # TDT pattern: Confirm creates a BaseConfirm instance
          confirms_wrapper.addition.().(
            [
              [values_wrapper.of.([1, 1]), shoulds_wrapper.be_equal_to.(2222)],
              [values_wrapper.of.([2, 3]), shoulds_wrapper.be_greater_than.(4)],
            ],
            ["./Readme.md"],
          ),
          
          # AAA pattern: Describe creates a BaseDescribe instance
          describes_wrapper.a_simple_calculator.("some input").(
            [
              its_wrapper.can_save_1_memory.(),
              its_wrapper.can_save_2_memories.(),
            ],
            ["./Readme.md"],
          ),
          
          # BDD pattern: Given creates a BaseGiven instance
          given_wrapper.default.("some input").(
            [
              when_wrapper.press.("5"),
              when_wrapper.press.("+"),
              when_wrapper.press.("3"),
              when_wrapper.enter.(),
            ],
            [then_wrapper.result.("8")],
            ["./Readme.md"],
          ),
          
          confirms_wrapper.addition.().(
            [
              [values_wrapper.of.([3, 3]), shoulds_wrapper.be_equal_to.(3)],
            ],
            ["./Readme.md"],
          ),
          
          confirms_wrapper.addition.().(
            [
              [values_wrapper.of.([3, 32]), shoulds_wrapper.be_equal_to.(32)],
            ],
            ["./Readme.md"],
          ),
          
          confirms_wrapper.addition.().(
            [
              [values_wrapper.of.([3, 332]), shoulds_wrapper.be_equal_to.(332)],
            ],
            ["./Readme.md"],
          ),
        ]
      end
    end
  end
end
