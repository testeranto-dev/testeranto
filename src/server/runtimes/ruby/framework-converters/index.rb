# Framework converter interface for Ruby
# Export all converters

require_relative 'base'
require_relative 'rspec'
require_relative 'minitest'
require_relative 'test_unit'
require_relative 'generic'

module FrameworkConverters
  # List of all available converters
  ALL_CONVERTERS = [
    RSpecConverter,
    MinitestConverter,
    TestUnitConverter,
    GenericConverter
  ]
  
  # Detect the appropriate converter for a given file
  def self.detect_converter(file_path)
    ALL_CONVERTERS.each do |converter|
      if converter.detect(file_path)
        return converter
      end
    end
    
    # Fallback to generic converter
    GenericConverter
  end
  
  # Get converter by name
  def self.get_converter(name)
    ALL_CONVERTERS.find { |c| c.name == name } || GenericConverter
  end
end
