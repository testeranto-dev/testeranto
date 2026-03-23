module Rubeno
  # BaseCheck is the unified base class for all verification phases.
  # It covers BDD's Then, AAA's Assert, and TDT's Validate.
  class BaseCheck
    attr_accessor :name, :check_cb, :error, :artifacts, :status
    
    def initialize(name, check_cb)
      @name = name
      @check_cb = check_cb
      @error = false
      @artifacts = []
    end
    
    def add_artifact(path)
      if !path.is_a?(String)
        raise "[ARTIFACT ERROR] Expected string, got #{path.class}: #{path.inspect}"
      end
      normalized_path = path.gsub('\\', '/')
      @artifacts << normalized_path
    end
    
    def to_obj
      {
        name: @name,
        error: @error,
        artifacts: @artifacts,
        status: @status
      }
    end
    
    def verify_check(store, check_cb, test_resource_configuration, artifactory = nil)
      # This should be implemented by subclasses
      raise NotImplementedError, "Subclasses must implement verify_check"
    end
    
    def test(store, test_resource_configuration, filepath, artifactory = nil)
      add_artifact = method(:add_artifact)
      
      begin
        x = verify_check(
          store,
          ->(s) do
            begin
              if @check_cb.respond_to?(:call)
                result = @check_cb.call(s) 
                return result
              else
                return @check_cb
              end
            rescue => e
              @error = true
              raise e
            end
          end,
          test_resource_configuration,
          artifactory
        )
        @status = true
        return x
      rescue => e
        @status = false
        @error = true
        raise e
      end
    end
  end
end
