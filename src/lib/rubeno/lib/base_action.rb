module Rubeno
  # BaseAction is the unified base class for all action phases.
  # It covers BDD's When, AAA's Act, and TDT's Feed.
  class BaseAction
    attr_accessor :name, :action_cb, :error, :artifacts, :status
    
    def initialize(name, action_cb)
      @name = name
      @action_cb = action_cb
      @artifacts = []
    end
    
    def add_artifact(path)
      if !path.is_a?(String)
        raise "[ARTIFACT ERROR] Expected string, got #{path.class}: #{path.inspect}"
      end
      normalized_path = path.gsub('\\', '/')
      @artifacts << normalized_path
    end
    
    def perform_action(store, action_cb, test_resource)
      # This should be implemented by subclasses
      raise NotImplementedError, "Subclasses must implement perform_action"
    end
    
    def to_obj
      error_str = nil
      if @error
        error_str = "#{@error.class}: #{@error.message}\n#{@error.backtrace}"
      end
      {
        name: @name,
        status: @status,
        error: error_str,
        artifacts: @artifacts
      }
    end
    
    def test(store, test_resource_configuration)
      begin
        result = perform_action(
          store,
          @action_cb,
          test_resource_configuration
        )
        @status = true
        result
      rescue => e
        @status = false
        @error = e
        raise e
      end
    end
  end
end
