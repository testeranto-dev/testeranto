# Framework converter base interface for Ruby
module FrameworkConverter
  def self.name
    raise NotImplementedError, "Subclasses must implement name method"
  end
  
  def self.detect(file_path)
    raise NotImplementedError, "Subclasses must implement detect method"
  end
  
  def self.generate_wrapper(entry_point_path, detection_result, translation_result, files_hash)
    raise NotImplementedError, "Subclasses must implement generate_wrapper method"
  end
  
  def self.translate_to_testeranto(detection_result)
    raise NotImplementedError, "Subclasses must implement translate_to_testeranto method"
  end
end
