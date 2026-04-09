package main

// Package struct maps the fields we need from 'go list'
type Package struct {
	ImportPath   string   `json:"ImportPath"`
	Dir          string   `json:"Dir"`
	GoFiles      []string `json:"GoFiles"`
	CgoFiles     []string `json:"CgoFiles"`
	CFiles       []string `json:"CFiles"`
	CXXFiles     []string `json:"CXXFiles"`
	HFiles       []string `json:"HFiles"`
	SFiles       []string `json:"SFiles"`
	SwigFiles    []string `json:"SwigFiles"`
	SwigCXXFiles []string `json:"SwigCXXFiles"`
	SysoFiles    []string `json:"SysoFiles"`
	EmbedFiles   []string `json:"EmbedFiles"`
	TestGoFiles  []string `json:"TestGoFiles"`
	Module       *struct {
		Main bool `json:"Main"`
	} `json:"Module"`
}

// TestEntry represents a test entry in the metafile
type TestEntry struct {
	Name   string   `json:"name"`
	Path   string   `json:"path"`
	Inputs []string `json:"inputs"`
	Output string   `json:"output"`
}

// Metafile structure matching esbuild format
type Metafile struct {
	Inputs  map[string]InputEntry  `json:"inputs"`
	Outputs map[string]OutputEntry `json:"outputs"`
}

// InputEntry represents an input file
type InputEntry struct {
	Bytes   int      `json:"bytes"`
	Imports []string `json:"imports"`
}

// OutputEntry represents an output entry
type OutputEntry struct {
	Imports    []string               `json:"imports"`
	Exports    []string               `json:"exports"`
	EntryPoint string                 `json:"entryPoint"`
	Inputs     map[string]InputDetail `json:"inputs"`
	Bytes      int                    `json:"bytes"`
}

// InputDetail represents input file details in output
type InputDetail struct {
	BytesInOutput int `json:"bytesInOutput"`
}

// DetectionResult represents the result of native test detection
type DetectionResult struct {
	IsNativeTest   bool                   `json:"isNativeTest"`
	FrameworkType  string                 `json:"frameworkType"`
	TestStructure  map[string]interface{} `json:"testStructure"`
}

// TestConfig represents configuration for a single test
type TestConfig struct {
	Path string `json:"path"`
}

// GolangConfig represents the Go-specific configuration
type GolangConfig struct {
	Tests map[string]TestConfig `json:"tests"`
}

// Config represents the overall configuration
type Config struct {
	Golang GolangConfig `json:"golang"`
}

// TestInfo represents information about a test
type TestInfo struct {
	Hash  string   `json:"hash"`
	Files []string `json:"files"`
}
