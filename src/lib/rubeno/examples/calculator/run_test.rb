#!/usr/bin/env ruby

$LOAD_PATH.unshift(File.expand_path('../../../lib', __FILE__))

require_relative 'Calculator.test'

# Run the test
Rubeno::Examples::CalculatorTest.run
puts "Test completed successfully!"
