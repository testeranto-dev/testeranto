# This is the main entry point for the Rubeno gem
# It loads the actual implementation
require 'rubeno'

# Load flavored version if requested
begin
  require 'rubeno/flavored'
rescue LoadError
  # Flavored version not available, continue with baseline
end
