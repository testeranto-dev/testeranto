require 'rubygems'

# Load the gemspec
spec = Gem::Specification.load("rubeno.gemspec")

unless spec
  puts "Could not load gemspec."
  exit 1
end

puts "Gem Name: #{spec.name}"
puts "Current Version: #{spec.version}"

# Prompt for next version
print "Enter next version (current is #{spec.version}): "
next_version = gets.chomp.strip

if next_version.empty?
  puts "Version cannot be empty."
  exit 1
end

# Read the gemspec file
gemspec_content = File.read("rubeno.gemspec")

# Update the version in the gemspec content
# Look for lines like: s.version = "0.0.24"
# The block variable is 's' in the gemspec
updated_content = gemspec_content.gsub(/s\.version\s*=\s*["'][^"']*["']/, "s.version = \"#{next_version}\"")

# Write back to the file
File.write("rubeno.gemspec", updated_content)

puts "Updated rubeno.gemspec to version #{next_version}"

# Build the gem
gem_filename = "#{spec.name}-#{next_version}.gem"
puts "Building gem: #{gem_filename}"
system("gem build rubeno.gemspec")

if $?.success?
  puts "Gem built successfully."
  
  # Ask if user wants to publish
  print "Do you want to publish #{gem_filename} to RubyGems? (y/n): "
  answer = gets.chomp.strip.downcase
  
  if answer == 'y' || answer == 'yes'
    puts "Publishing #{gem_filename}..."
    system("gem push #{gem_filename}")
    
    if $?.success?
      puts "Gem published successfully."
    else
      puts "Failed to publish gem."
    end
  else
    puts "Skipping publishing."
  end
else
  puts "Failed to build gem."
  exit 1
end
