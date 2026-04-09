package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

func produceOutputArtifacts(projectConfigPath, configKey string) {
	fmt.Printf("[Go Builder] Producing output artifacts for config %s\n", configKey)
	
	// Load project config
	configFile, err := os.ReadFile(projectConfigPath)
	if err != nil {
		fmt.Printf("[Go Builder] Error loading project config: %v\n", err)
		return
	}
	
	var projectConfig map[string]interface{}
	if err := json.Unmarshal(configFile, &projectConfig); err != nil {
		fmt.Printf("[Go Builder] Error parsing project config: %v\n", err)
		return
	}
	
	runtimes, ok := projectConfig["runtimes"].(map[string]interface{})
	if !ok {
		fmt.Printf("[Go Builder] No runtimes found in config\n")
		return
	}
	
	runtimeConfig, ok := runtimes[configKey].(map[string]interface{})
	if !ok {
		fmt.Printf("[Go Builder] No runtime config found for %s\n", configKey)
		return
	}
	
	outputsInterface, ok := runtimeConfig["outputs"].([]interface{})
	if !ok || outputsInterface == nil {
		fmt.Printf("[Go Builder] No outputs defined for %s\n", configKey)
		return
	}
	
	fmt.Printf("[Go Builder] Processing %d output artifacts\n", len(outputsInterface))
	
	// Create output directory
	outputDir := filepath.Join("testeranto", "outputs", configKey)
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		fmt.Printf("[Go Builder] Error creating output directory: %v\n", err)
		return
	}
	
	for _, outputInterface := range outputsInterface {
		entrypoint, ok := outputInterface.(string)
		if !ok {
			continue
		}
		
		sourcePath := entrypoint
		fileName := filepath.Base(entrypoint)
		destPath := filepath.Join(outputDir, fileName)
		
		fmt.Printf("[Go Builder] Copying %s to %s\n", sourcePath, destPath)
		
		// Copy file
		input, err := os.ReadFile(sourcePath)
		if err != nil {
			fmt.Printf("[Go Builder] Failed to read source file %s: %v\n", sourcePath, err)
			continue
		}
		
		if err := os.WriteFile(destPath, input, 0644); err != nil {
			fmt.Printf("[Go Builder] Failed to write destination file %s: %v\n", destPath, err)
			continue
		}
		
		fmt.Printf("[Go Builder] ✅ Copied %s\n", fileName)
	}
	
	fmt.Printf("[Go Builder] Finished producing output artifacts\n")
}
