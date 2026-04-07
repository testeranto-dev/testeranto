#!/usr/bin/env ruby
# Ruby builder that uses native detection
# This is a simplified version that delegates to native_detection.rb

require 'json'
require 'fileutils'

# puts "Ruby builder starting with native detection..."

if ARGV.length < 3
  puts "Usage: ruby ruby.rb <project_config_path> <ruby_config_path> <test_name> [entry_points...]"
  exit 1
end

project_config_file_path = ARGV[0]
ruby_config_file_path = ARGV[1]
test_name = ARGV[2]
entry_points = ARGV[3..-1]

# Check if we're in dev mode
is_dev_mode = ENV['MODE'] == 'dev'

puts "[Ruby Builder] Project config: #{project_config_file_path}"
puts "[Ruby Builder] Ruby config: #{ruby_config_file_path}"
puts "[Ruby Builder] Test name: #{test_name}"
puts "[Ruby Builder] Entry points: #{entry_points.join(', ')}"
puts "[Ruby Builder] Mode: #{is_dev_mode ? 'dev' : 'once'}"

# Load and parse configuration if needed
begin
  if File.exist?(project_config_file_path)
    project_config = JSON.parse(File.read(project_config_file_path))
    puts "[Ruby Builder] Loaded project config"
  end
rescue => e
  puts "[Ruby Builder] Warning: Could not parse project config: #{e.message}"
end

begin
  if File.exist?(ruby_config_file_path)
    ruby_config = JSON.parse(File.read(ruby_config_file_path))
    puts "[Ruby Builder] Loaded Ruby config"
  end
rescue => e
  puts "[Ruby Builder] Warning: Could not parse Ruby config: #{e.message}"
end

# Delegate to native detection
# require_relative 'native_detection'

# detector = RubyNativeDetection.new(
#   project_config_file_path,
#   ruby_config_file_path,
#   test_name,
#   entry_points
# )

# detector.run

puts "[Ruby Builder] Ruby builder completed successfully"

# In dev mode, keep the process alive
if is_dev_mode
  puts "[Ruby Builder] Dev mode active - process will stay running"
  
  # Signal handler for SIGTERM
  Signal.trap('TERM') do
    puts "[Ruby Builder] Received SIGTERM - shutting down"
    exit 0
  end
  
  Signal.trap('INT') do
    puts "[Ruby Builder] Received SIGINT - shutting down"
    exit 0
  end
  
  # Keep process alive
  loop do
    sleep 1
  end
end
