# This is the main entry point for the Rubeno gem
# It loads the actual implementation
require 'rubeno'

# Load flavored version
begin
  require_relative 'flavored'
rescue LoadError => e
  warn "Note: Rubeno flavored version not available: #{e.message}"
  # Flavored version not available, continue with baseline
end

# Provide easy access to flavored API
module Rubeno
  # Shortcut to flavored API
  def self.flavored
    Flavored
  end
end
