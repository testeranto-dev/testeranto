#!/usr/bin/env ruby
# Ruby builder that uses native detection
# This is a simplified version that delegates to native_detection.rb

require 'json'
require 'fileutils'

puts "Hello ruby builder: #{ARGV}"

# The only argument is the JSON config slice
if ARGV.length < 1
  puts "Usage: ruby ruby.rb <config_json>"
  exit 1
end

config_json = ARGV[2]
begin
    config = JSON.parse(config_json)
    entry_points = config['tests'] || []
    outputs = config['outputs'] || []
    test_name = config['name'] || ''
rescue => e
    puts "[Ruby Builder] Failed to parse config JSON: #{e.message}"
    exit 1
end

if test_name.empty?
    puts "[Ruby Builder] Config must include a name"
    exit 1
end

# Check if we're in dev mode
is_dev_mode = ENV['MODE'] == 'dev'

puts "[Ruby Builder] Test name: #{test_name}"
puts "[Ruby Builder] Entry points: #{entry_points.join(', ')}"
puts "[Ruby Builder] Mode: #{is_dev_mode ? 'dev' : 'once'}"

puts "[Ruby Builder] Ruby builder completed successfully"

# Function to produce output artifacts
def produce_output_artifacts(test_name, outputs)
  puts "[Ruby Builder] Producing output artifacts for config #{test_name}"
  
  if outputs.empty?
    puts "[Ruby Builder] No outputs defined for #{test_name}"
    return
  end
  
  puts "[Ruby Builder] Processing #{outputs.length} output artifacts"
  
  # Create output directory
  output_dir = File.join("testeranto", "outputs", test_name)
  FileUtils.mkdir_p(output_dir)
  
  outputs.each do |entrypoint|
    begin
      source_path = entrypoint
      file_name = File.basename(entrypoint)
      dest_path = File.join(output_dir, file_name)
      
      puts "[Ruby Builder] Copying #{source_path} to #{dest_path}"
      
      # Copy file
      FileUtils.cp(source_path, dest_path)
      
      puts "[Ruby Builder] ✅ Copied #{file_name}"
    rescue => e
      puts "[Ruby Builder] Failed to process output artifact #{entrypoint}: #{e.message}"
    end
  end
  
  puts "[Ruby Builder] Finished producing output artifacts"
end

# Set up signal handlers for graceful shutdown
Signal.trap('TERM') do
  puts "[Ruby Builder] Received SIGTERM - producing output artifacts"
  produce_output_artifacts(test_name, outputs)
  exit 0
end

Signal.trap('INT') do
  puts "[Ruby Builder] Received SIGINT - producing output artifacts"
  produce_output_artifacts(test_name, outputs)
  exit 0
end

# In dev mode, keep the process alive
if is_dev_mode
  puts "[Ruby Builder] Dev mode active - process will stay running"
  
  # Keep process alive
  loop do
    sleep 1
  end
else
  puts "[Ruby Builder] Once mode completed"
end
