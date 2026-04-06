module Rubeno
  class Rubeno
    def initialize_test_jobs
      @test_jobs = []
      @specs.each_with_index do |suite_spec, i|
        # Create a BaseSuite instance
        suite = BaseSuite.new(suite_spec['name'], suite_spec['givens'])
        suite.index = i
        
        # Create a test job
        test_job = {
          suite: suite,
          receiveTestResourceConfig: ->(pm, test_resource_config) { run_test_job(suite, pm, test_resource_config) },
          to_obj: -> { suite.to_obj }
        }
        
        @test_jobs << test_job
      end
    end
    
    def run_test_job(suite, test_resource_config)
      # Run the suite
      suite_done = suite.run(
        @test_subject,
        test_resource_config  # Use the actual test resource configuration
      )
      
      # Create result object
      result = Object.new
      result.instance_variable_set(:@fails, suite_done.fails)
      result.instance_variable_set(:@artifacts, suite_done.artifacts)
      result.instance_variable_set(:@features, suite_done.features)
      
      def result.fails; @fails; end
      def result.artifacts; @artifacts; end
      def result.features; @features; end
      
      result
    end
  end
end
