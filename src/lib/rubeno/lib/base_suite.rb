module Rubeno
  class BaseSuite
    attr_accessor :name, :givens, :store, :test_resource_configuration, :index, :failed, :fails, :artifacts, :parent
    
    def initialize(name, givens = {})
      @name = name
      @givens = givens
      @artifacts = []
      @failed = false
      @fails = 0
    end
    
    def add_artifact(path)
      normalized_path = path.gsub('\\', '/')
      @artifacts << normalized_path
    end
    
    def features
      features = []
      seen = {}
      @givens.each_value do |given|
        given.features.each do |feature|
          unless seen[feature]
            features << feature
            seen[feature] = true
          end
        end
      end
      features
    end
    
    def to_obj
      {
        name: @name,
        givens: @givens.values.map(&:to_obj),
        fails: @fails,
        failed: @failed,
        features: features,
        artifacts: @artifacts
      }
    end
    
    def setup(s, tr, artifactory = nil)
      s
    end
    
    def assert_that(t)
      !!t
    end
    
    def after_all(store, artifactory = nil)
      store
    end
    
    def run(input_val, test_resource_configuration)
      @test_resource_configuration = test_resource_configuration
      
      # Create artifactory for suite setup
      suite_artifactory = nil
      if @parent && @parent.respond_to?(:create_artifactory)
        suite_artifactory = @parent.create_artifactory(suite_index: @index)
      end
      
      subject = setup(input_val, test_resource_configuration, suite_artifactory)
      
      @fails = 0
      @failed = false
      
      @givens.each do |g_key, g|
        begin
          # Create artifactory for the given
          given_artifactory = nil
          if @parent && @parent.respond_to?(:create_artifactory)
            given_artifactory = @parent.create_artifactory(given_key: g_key, suite_index: @index)
          end
          
          # Set parent reference if not already set
          g._parent = @parent if g.respond_to?(:_parent=)
          
          @store = g.give(
            subject,
            g_key,
            test_resource_configuration,
            method(:assert_that),
            given_artifactory,
            @index
          )
          @fails += g.fails if g.fails && g.fails > 0
        rescue => e
          @failed = true
          @fails += 1
          puts "Error in given #{g_key}: #{e.message}"
        end
      end
      
      @failed = true if @fails > 0
      
      begin
        after_all(@store, suite_artifactory)
      rescue => e
        puts "Error in after_all: #{e.message}"
      end
      
      self
    end
  end
end
