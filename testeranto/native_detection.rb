#!/usr/bin/env ruby
# Ruby native detection for test frameworks
# Similar to testeranto-example-project/testeranto/runtimes/node/native_detection.js

require 'json'
require 'pathname'
require 'fileutils'

class RubyNativeDetection
  def initialize(project_config_path, ruby_config_path, test_name, entry_points)
    @project_config_path = project_config_path
    @ruby_config_path = ruby_config_path
    @test_name = test_name
    @entry_points = entry_points
    @all_tests_info = {}
  end

  def run
    puts "Ruby native detection starting..."
    puts "Test name: #{@test_name}"
    puts "Entry points: #{@entry_points.inspect}"

    # Load source analyzer
    require_relative 'source_analyzer'

    @entry_points.each do |entry_point|
      puts "Processing Ruby test: #{entry_point}"
      
      # Get absolute path to entry point
      entry_point_path = File.expand_path(entry_point)
      
      # Extract all dependencies using SourceAnalyzer
      all_dependencies = SourceAnalyzer.extract_dependencies(entry_point_path)
      
      # Convert to workspace-relative paths
      workspace_root = '/workspace'
      relative_files = SourceAnalyzer.to_workspace_relative_paths(all_dependencies, workspace_root)
      
      # Compute hash of input files
      files_hash = SourceAnalyzer.compute_files_hash(all_dependencies)
      
      # Store test information
      @all_tests_info[entry_point] = {
        "hash" => files_hash,
        "files" => relative_files
      }
      
      # Create the bundle directory structure for the test file
      bundle_path = "testeranto/bundles/#{@test_name}/#{entry_point}"
      
      # Ensure directory exists
      FileUtils.mkdir_p(File.dirname(bundle_path))
      
      # Copy the original test file to the bundle location
      FileUtils.cp(entry_point_path, bundle_path)
      puts "Copied test file to #{bundle_path}"
      
      # Copy all dependencies to the bundle directory, preserving directory structure
      all_dependencies.each do |dep|
        # Skip the entry point itself (already copied)
        next if dep == entry_point_path
        
        # Get relative path from workspace root
        if dep.start_with?(workspace_root)
          rel_path = dep[workspace_root.length..-1]
          # Remove leading slash if present
          rel_path = rel_path[1..-1] if rel_path.start_with?('/')
        else
          # If not under workspace, use relative path from current directory
          rel_path = Pathname.new(dep).relative_path_from(Pathname.new(Dir.pwd)).to_s
        end
        
        # Destination path in bundle
        dest_path = "testeranto/bundles/#{@test_name}/#{rel_path}"
        
        # Ensure destination directory exists
        FileUtils.mkdir_p(File.dirname(dest_path))
        
        # Copy the file
        FileUtils.cp(dep, dest_path)
        puts "Copied dependency #{rel_path} to #{dest_path}"
      end
      
      # Also copy the entry point's directory contents to maintain relative paths
      # This helps with require_relative statements
      entry_dir = File.dirname(entry_point_path)
      Dir.glob(File.join(entry_dir, '*.rb')).each do |rb_file|
        next if rb_file == entry_point_path
        
        rel_to_entry = Pathname.new(rb_file).relative_path_from(Pathname.new(File.dirname(entry_point_path))).to_s
        dest_in_bundle = File.join(File.dirname(bundle_path), rel_to_entry)
        
        FileUtils.mkdir_p(File.dirname(dest_in_bundle))
        FileUtils.cp(rb_file, dest_in_bundle)
        puts "Copied sibling file #{rel_to_entry} to #{dest_in_bundle}"
      end
    end

    # Write single inputFiles.json for all tests
    input_files_path = "testeranto/bundles/#{@test_name}/inputFiles.json"
    FileUtils.mkdir_p(File.dirname(input_files_path))
    File.write(input_files_path, JSON.pretty_generate(@all_tests_info))
    puts "Wrote inputFiles.json for #{@all_tests_info.size} tests to #{input_files_path}"

    puts "Ruby native detection completed"
  end
end

# Main execution
if __FILE__ == $0
  if ARGV.length < 3
    puts "Usage: ruby native_detection.rb <project_config_path> <ruby_config_path> <test_name> [entry_points...]"
    exit 1
  end

  project_config_file_path = ARGV[0]
  ruby_config_file_path = ARGV[1]
  test_name = ARGV[2]
  entry_points = ARGV[3..-1]

  detector = RubyNativeDetection.new(
    project_config_file_path,
    ruby_config_file_path,
    test_name,
    entry_points
  )
  
  detector.run
end
