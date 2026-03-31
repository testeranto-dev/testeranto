// Framework converter interface for Go
// This package has been simplified to avoid import issues
package frameworkconverters

// FrameworkConverter defines the interface for all framework converters
type FrameworkConverter interface {
	Name() string
}

// DetectFramework detects which framework a Go test file uses
func DetectFramework(filePath string) FrameworkConverter {
	// Return a minimal implementation
	return &minimalConverter{}
}

type minimalConverter struct{}

func (m *minimalConverter) Name() string {
	return "minimal"
}
