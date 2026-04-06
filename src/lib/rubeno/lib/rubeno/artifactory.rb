module Rubeno
  class Rubeno
    # Create an artifactory that tracks context
    # Note: Ruby is a server-side language and CANNOT capture screenshots or screencasts
    # Only the Web runtime (browser environment) can do visual captures
    # This is a necessary difference between web and other runtimes
    def create_artifactory(context = {})
      base_path = @test_resource_configuration&.fs || "testeranto"
      
      puts "[Artifactory] Base path: #{base_path}"
      puts "[Artifactory] Context: #{context}"
      
      # Return an object with artifactory methods
      {
        write_file_sync: lambda do |filename, payload|
          # Construct path based on context
          path = ""
          
          # Add suite context if available
          if context[:suite_index]
            path += "suite-#{context[:suite_index]}/"
          end
          
          # Add given context if available
          if context[:given_key]
            path += "given-#{context[:given_key]}/"
          end
          
          # Add when or then context
          if context[:when_index]
            path += "when-#{context[:when_index]} "
          elsif context[:then_index]
            path += "then-#{context[:then_index]} "
          end
          
          # Add the filename
          path += filename
          
          # Ensure it has a .txt extension if not present
          unless path.match(/\.[a-zA-Z0-9]+$/)
            path += ".txt"
          end
          
          # Prepend the base path
          base_path_clean = base_path.gsub(/\/$/, '')
          path_clean = path.gsub(/^\//, '')
          full_path = "#{base_path_clean}/#{path_clean}"
          
          puts "[Artifactory] Full path: #{full_path}"
          
          # Write the file
          write_file_sync(full_path, payload)
        end
        
        # Note: We do NOT include screenshot, open_screencast, or close_screencast methods
        # because Ruby is a server-side language and cannot capture visual content
        # This is a necessary difference between web and other runtimes
      }
    end
    
    # Abstract method to be implemented by concrete runtimes
    def write_file_sync(filename, payload)
      # Ensure directory exists
      dir = File.dirname(filename)
      FileUtils.mkdir_p(dir) unless Dir.exist?(dir)
      
      # Write file
      File.write(filename, payload)
      puts "[write_file_sync] Wrote to #{filename}"
    end
  end
end
