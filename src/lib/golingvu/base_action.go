package golingvu

import (
	"fmt"
)

// BaseAction is the unified base class for all action phases
type BaseAction struct {
	Name     string
	ActionCB interface{}
	Error    error
	Artifacts []string
	Status   *bool
}

// NewBaseAction creates a new BaseAction
func NewBaseAction(name string, actionCB interface{}) *BaseAction {
	return &BaseAction{
		Name:     name,
		ActionCB: actionCB,
		Artifacts: make([]string, 0),
	}
}

// AddArtifact adds an artifact
func (ba *BaseAction) AddArtifact(path string) {
	ba.Artifacts = append(ba.Artifacts, path)
}

// ToObj converts to a serializable object
func (ba *BaseAction) ToObj() map[string]interface{} {
	var errorObj interface{}
	if ba.Error != nil {
		errorObj = fmt.Sprintf("%v", ba.Error)
	} else {
		errorObj = nil
	}
	
	var status interface{}
	if ba.Status != nil {
		status = *ba.Status
	} else {
		status = nil
	}
	
	return map[string]interface{}{
		"name":     ba.Name,
		"status":   status,
		"error":    errorObj,
		"artifacts": ba.Artifacts,
	}
}

// PerformAction is the abstract method to be implemented by concrete types
func (ba *BaseAction) PerformAction(
	store interface{},
	actionCB interface{},
	testResource interface{},
	artifactory func(string, interface{}),
) (interface{}, error) {
	// This should be implemented by concrete types
	return store, nil
}

// Test executes the action
func (ba *BaseAction) Test(
	store interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	artifactory func(string, interface{}),
) (interface{}, error) {
	return ba.PerformAction(store, ba.ActionCB, testResourceConfiguration, artifactory)
}
