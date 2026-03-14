---
status: done
---

Our solution for finding ruby imports is not great.

---

You can use the AST to find all files used by a Ruby script, but it is more complex than in languages like JavaScript because Ruby "imports" are just regular method calls (require, require_relative, load) that can appear anywhere in the code.

1. Using the AST (Static Analysis)
   To find every instance of a file being loaded, you must traverse the AST and look for method call nodes where the method name is require, require_relative, or load.
   Top-level vs. Deep: Unlike a regex search, walking the AST allows you to find these calls even if they are nested inside classes, methods, or conditional if blocks.
   Dynamic Paths: A major limitation of AST analysis is dynamic requires (e.g., require "my_lib/#{some_var}"). The AST only sees the logic, not the final string value. For these, you can only identify that a load is happening, not which specific file is targeted.
   +3
   Example with Prism
   Prism is the modern standard for this. You can use a Visitor to find every call:
   ruby
   require "prism"

```ruby
class DependencyFinder < Prism::Visitor
  attr_reader :dependencies

  def initialize
    @dependencies = []
  end

  def visit_call_node(node) # Check if the method being called is a 'require' variant
    if %i[require require_relative load].include?(node.name) # Extract the first argument if it's a static string
    arg = node.arguments&.arguments&.first
    if arg.is_a?(Prism::StringNode)
      @dependencies << { type: node.name, path: arg.content }
    else
    @dependencies << { type: node.name, path: :dynamic_path }
    end
  end
  super # Continue walking the tree
  end
end

result = Prism.parse_file("your_file.rb")
visitor = DependencyFinder.new
result.value.accept(visitor)
puts visitor.dependencies
```

2. Alternative: Runtime Analysis
   If you need to know exactly which files were loaded (including those with dynamic paths), the AST isn't enough. Instead, you can use Ruby's built-in global variable $LOADED_FEATURES.

   How it works: Run your script and then inspect $LOADED_FEATURES. It contains an array of absolute paths for every file required during that execution.
   Pros: It captures everything, including dependencies of your dependencies and dynamic requires.
   Cons: You must actually execute the code, which might have side effects.

   Summary of Tools
   Prism: Best for static analysis and finding all call sites without running the code.
   RuboCop AST: Provides a "Node Pattern" search that makes finding specific method calls very easy if you are already using RuboCop.
   Bundler: If you just need to see gem-level dependencies, Bundler's lockfile is the source of truth.
