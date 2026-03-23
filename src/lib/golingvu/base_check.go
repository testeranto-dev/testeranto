package golingvu

// BaseCheck is the unified base class for all verification phases
type BaseCheck struct {
	Name     string
	CheckCB  interface{}
	Error    bool
	Artifacts []string
	Status   *bool
}

// NewBaseCheck creates a new BaseCheck
func NewBaseCheck(name string, checkCB interface{}) *BaseCheck {
	return &BaseCheck{
		Name:     name,
		CheckCB:  checkCB,
		Error:    false,
		Artifacts: make([]string, 0),
	}
}

// AddArtifact adds an artifact
func (bc *BaseCheck) AddArtifact(path string) {
	bc.Artifacts = append(bc.Artifacts, path)
}

// ToObj converts to a serializable object
func (bc *BaseCheck) ToObj() map[string]interface{} {
	var status interface{}
	if bc.Status != nil {
		status = *bc.Status
	} else {
		status = nil
	}
	
	return map[string]interface{}{
		"name":     bc.Name,
		"error":    bc.Error,
		"artifacts": bc.Artifacts,
		"status":   status,
	}
}

// VerifyCheck is the abstract method to be implemented by concrete types
func (bc *BaseCheck) VerifyCheck(
	store interface{},
	checkCB interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	artifactory func(string, interface{}),
) (interface{}, error) {
	// This should be implemented by concrete types
	return store, nil
}

// Test executes the check
func (bc *BaseCheck) Test(
	store interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	filepath string,
	artifactory func(string, interface{}),
) (interface{}, error) {
	return bc.VerifyCheck(store, bc.CheckCB, testResourceConfiguration, artifactory)
}
