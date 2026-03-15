# Example of Ruby-flavored Testeranto test
require 'rubeno/flavored'

# Define a simple Calculator class to test
class Calculator
  def initialize
    @value = 0
  end
  
  def add(x)
    @value += x
  end
  
  def subtract(x)
    @value -= x
  end
  
  def multiply(x)
    @value *= x
  end
  
  def divide(x)
    @value /= x unless x.zero?
  end
  
  def result
    @value
  end
  
  def clear
    @value = 0
  end
end

# Create a test suite using the flavored DSL
suite = Rubeno::Flavored.suite("Calculator Tests") do
  before_all do
    puts "Starting Calculator tests"
  end
  
  after_all do
    puts "Finished Calculator tests"
  end
  
  before_each do
    puts "Starting a test"
  end
  
  after_each do
    puts "Finished a test"
  end
  
  scenario "Adding numbers" do
    subject { Calculator.new }
    
    given "a new calculator" do |calc|
      # Initial state is already set by subject
    end
    
    when "adding 5" do |calc|
      calc.add(5)
    end
    
    when "adding 3 more" do |calc|
      calc.add(3)
    end
    
    then "result should be 8" do |calc|
      calc.result == 8
    end
  end
  
  scenario "Subtracting numbers" do
    subject { Calculator.new }
    
    given "a calculator with value 10" do |calc|
      calc.add(10) # Set initial value
    end
    
    when "subtracting 4" do |calc|
      calc.subtract(4)
    end
    
    then "result should be 6" do |calc|
      calc.result == 6
    end
  end
  
  scenario "Multiplication" do
    subject { Calculator.new }
    
    given "a calculator with value 3" do |calc|
      calc.add(3)
    end
    
    when "multiplying by 4" do |calc|
      calc.multiply(4)
    end
    
    then "result should be 12" do |calc|
      calc.result == 12
    end
  end
  
  scenario "Division" do
    subject { Calculator.new }
    
    given "a calculator with value 20" do |calc|
      calc.add(20)
    end
    
    when "dividing by 5" do |calc|
      calc.divide(5)
    end
    
    then "result should be 4" do |calc|
      calc.result == 4
    end
  end
  
  scenario "Clear operation" do
    subject { Calculator.new }
    
    given "a calculator with value 15" do |calc|
      calc.add(15)
    end
    
    when "clearing the calculator" do |calc|
      calc.clear
    end
    
    then "result should be 0" do |calc|
      calc.result == 0
    end
  end
end

# Run the tests if this file is executed directly
if __FILE__ == $0
  # Parse command line arguments for test resource configuration
  test_resource_config = ARGV[0] || '{"name":"calculator_test","fs":".","ports":[]}'
  
  puts "Running Calculator tests with configuration: #{test_resource_config}"
  result = suite.run(test_resource_config)
  
  if result.failed
    puts "Tests failed: #{result.fails} failures"
    exit 1
  else
    puts "All tests passed!"
    exit 0
  end
end
