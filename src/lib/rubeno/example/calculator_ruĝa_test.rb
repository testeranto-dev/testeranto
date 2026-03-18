# Example of Ruby-flavored Testeranto (Ruĝa) tests for Calculator
require_relative '../lib/flavored'

# Simple Calculator class for testing
class Calculator
  def initialize
    @display = ""
    @memory = 0
  end
  
  def press(button)
    @display += button.to_s
    self
  end
  
  def enter
    begin
      @display = eval(@display).to_s
    rescue
      @display = "Error"
    end
    self
  end
  
  def memory_store
    @memory = @display.to_f
    clear
  end
  
  def memory_recall
    @display = @memory.to_s
    self
  end
  
  def clear
    @display = ""
    self
  end
  
  def display
    @display
  end
end

# Example 1: Using the suite DSL
puts "=" * 60
puts "Example 1: Suite DSL"
puts "=" * 60

suite = Rubeno::Flavored.suite("Calculator Operations") do
  before_all do |context|
    puts "Suite setup..."
    context[:start_time] = Time.now
    context
  end
  
  after_all do |context|
    puts "Suite teardown. Duration: #{Time.now - context[:start_time]} seconds"
  end
  
  scenario "Basic addition" do
    subject { Calculator.new }
    
    given "a new calculator"
    
    when "pressing 2 + 3" do |calc|
      calc.press("2").press("+").press("3")
    end
    
    when "pressing enter" do |calc|
      calc.enter
    end
    
    then "display shows 5" do |calc|
      raise "Expected 5, got #{calc.display}" unless calc.display == "5"
    end
  end
  
  scenario "Memory operations" do
    subject { Calculator.new }
    
    given "calculator with 123 entered" do |calc|
      calc.press("1").press("2").press("3")
    end
    
    when "storing in memory" do |calc|
      calc.memory_store
    end
    
    when "recalling memory" do |calc|
      calc.memory_recall
    end
    
    then "display shows 123" do |calc|
      raise "Expected 123, got #{calc.display}" unless calc.display == "123"
    end
  end
end

result = suite.run
puts "\nSuite result: #{result[:passed] ? 'PASSED' : 'FAILED'}"
puts "Passed: #{result[:passed_count]}/#{result[:total]}"

# Example 2: Using fluent builder
puts "\n" + "=" * 60
puts "Example 2: Fluent Builder"
puts "=" * 60

test1 = Rubeno::Flavored.given("a new calculator") { Calculator.new }
  .when("pressing 2 + 3") { |calc| calc.press("2").press("+").press("3") }
  .when("pressing enter") { |calc| calc.enter }
  .then("display shows 5") { |calc| raise "Expected 5, got #{calc.display}" unless calc.display == "5" }

result1 = test1.run
puts "Test 1: #{result1[:success] ? '✓' : '✗'}"

test2 = Rubeno::Flavored.given("calculator with memory") do
  calc = Calculator.new
  calc.press("4").press("5").press("6")
  calc
end
  .when("storing in memory") { |calc| calc.memory_store }
  .when("clearing display") { |calc| calc.clear }
  .when("recalling memory") { |calc| calc.memory_recall }
  .then("display shows 456") { |calc| raise "Expected 456, got #{calc.display}" unless calc.display == "456" }

result2 = test2.run
puts "Test 2: #{result2[:success] ? '✓' : '✗'}"

# Example 3: Integration with Minitest (if available)
begin
  require 'minitest/autorun'
  
  class CalculatorRuĝaTest < Minitest::Test
    include Rubeno::Flavored::MinitestIntegration
    
    testeranto_suite "Minitest-integrated Calculator Tests" do
      scenario "Test addition via Minitest" do
        subject { Calculator.new }
        
        given "a new calculator"
        
        when "adding 7 + 8" do |calc|
          calc.press("7").press("+").press("8")
        end
        
        when "pressing enter" do |calc|
          calc.enter
        end
        
        then "result is 15" do |calc|
          raise "Expected 15, got #{calc.display}" unless calc.display == "15"
        end
      end
    end
    
    # Traditional Minitest test that uses flavored API
    def test_fluent_with_minitest
      test = Rubeno::Flavored.given("calculator for minitest") { Calculator.new }
        .when("entering 9 * 9") { |calc| calc.press("9").press("*").press("9") }
        .when("pressing enter") { |calc| calc.enter }
        .then("result is 81") { |calc| assert_equal "81", calc.display }
      
      result = test.run
      assert result[:success], "Fluent test should succeed"
    end
  end
  
  puts "\n" + "=" * 60
  puts "Example 3: Minitest Integration"
  puts "=" * 60
  puts "Run with: ruby -Ilib example/calculator_ruĝa_test.rb"
  
rescue LoadError
  puts "\nMinitest not available, skipping Minitest integration example"
  puts "Install with: gem install minitest"
end

# Example 4: Error handling
puts "\n" + "=" * 60
puts "Example 4: Error Handling"
puts "=" * 60

error_test = Rubeno::Flavored.given("calculator for error test") { Calculator.new }
  .when("dividing by zero") { |calc| calc.press("5").press("/").press("0") }
  .when("pressing enter") { |calc| calc.enter }
  .then("shows error") { |calc| raise "Expected Error, got #{calc.display}" unless calc.display == "Error" }

error_result = error_test.run
puts "Error test: #{error_result[:success] ? '✓' : '✗'}"
puts "  Error message: #{error_result[:error]}" unless error_result[:success]

puts "\n" + "=" * 60
puts "Ruĝa (Ruby-flavored Testeranto) Examples Complete!"
puts "=" * 60
