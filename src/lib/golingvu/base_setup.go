package golingvu

import (
	"fmt"
)

// BaseSetup is the unified base class for all setup phases.
// It covers BDD's Given, AAA's Arrange, and TDT's Map.
type BaseSetup struct {
	Features          []string
	Actions           []interface{}
	Checks            []interface{}
	Error             error
	Fail              interface{}
	Store             interface{}
	RecommendedFsPath string
	SetupCB           interface{}
	InitialValues     interface{}
	Key               string
	Failed            bool
	Artifacts         []string
	Fails             int
	Status            *bool
	Parent            interface{}
	SuiteIndex        *int
}

// NewBaseSetup creates a new BaseSetup instance
func NewBaseSetup(
	features []string,
	actions []interface{},
	checks []interface{},
	setupCB interface{},
	initialValues interface{},
) *BaseSetup {
	return &BaseSetup{
		Features:      features,
		Actions:       actions,
		Checks:        checks,
		SetupCB:       setupCB,
		InitialValues: initialValues,
		Fails:         0,
		Failed:        false,
		Artifacts:     make([]string, 0),
		Status:        nil,
	}
}

// AddArtifact adds an artifact path
func (bs *BaseSetup) AddArtifact(path string) {
	// Normalize path separators
	normalizedPath := path
	// In Go, we don't need to normalize backslashes as much, but we can if needed
	bs.Artifacts = append(bs.Artifacts, normalizedPath)
}

// ToObj converts the instance to a map for serialization
func (bs *BaseSetup) ToObj() map[string]interface{} {
	actionObjs := make([]map[string]interface{}, 0)
	for _, action := range bs.Actions {
		if a, ok := action.(interface{ ToObj() map[string]interface{} }); ok {
			actionObjs = append(actionObjs, a.ToObj())
		} else {
			// Log or handle unexpected type
			actionObjs = append(actionObjs, map[string]interface{}{})
		}
	}

	checkObjs := make([]map[string]interface{}, 0)
	for _, check := range bs.Checks {
		if c, ok := check.(interface{ ToObj() map[string]interface{} }); ok {
			checkObjs = append(checkObjs, c.ToObj())
		} else {
			checkObjs = append(checkObjs, map[string]interface{}{})
		}
	}

	var errorObj interface{}
	if bs.Error != nil {
		errorObj = []interface{}{bs.Error.Error(), bs.Error.Error()}
	} else {
		errorObj = nil
	}

	var status interface{}
	if bs.Status != nil {
		status = *bs.Status
	} else {
		status = nil
	}

	return map[string]interface{}{
		"key":       bs.Key,
		"actions":   actionObjs,
		"checks":    checkObjs,
		"error":     errorObj,
		"failed":    bs.Failed,
		"features":  bs.Features,
		"artifacts": bs.Artifacts,
		"status":    status,
	}
}

// SetupThat should be implemented by concrete types
func (bs *BaseSetup) SetupThat(
	subject interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	artifactory func(string, interface{}),
	setupCB interface{},
	initialValues interface{},
) (interface{}, error) {
	return subject, nil
}

// AfterEach is called after each test
func (bs *BaseSetup) AfterEach(
	store interface{},
	key string,
	artifactory func(string, interface{}),
) (interface{}, error) {
	return store, nil
}

// Setup executes the setup process
func (bs *BaseSetup) Setup(
	subject interface{},
	key string,
	testResourceConfiguration ITTestResourceConfiguration,
	tester func(interface{}) bool,
	artifactory func(string, interface{}),
	suiteNdx *int,
) (interface{}, error) {
	bs.Key = key
	bs.Fails = 0
	bs.SuiteIndex = suiteNdx

	actualArtifactory := artifactory
	if actualArtifactory == nil {
		actualArtifactory = func(fPath string, value interface{}) {}
	}

	setupArtifactory := func(fPath string, value interface{}) {
		actualArtifactory(fmt.Sprintf("setup-%s/%s", key, fPath), value)
	}

	// Call SetupThat
	var err error
	bs.Store, err = bs.SetupThat(
		subject,
		testResourceConfiguration,
		setupArtifactory,
		bs.SetupCB,
		bs.InitialValues,
	)
	if err != nil {
		status := false
		bs.Status = &status
		bs.Failed = true
		bs.Fails++
		bs.Error = err
		return bs.Store, err
	}
	status := true
	bs.Status = &status

	// Process actions
	for actionNdx, actionStep := range bs.Actions {
		if action, ok := actionStep.(interface {
			Test(store interface{}, testResourceConfiguration ITTestResourceConfiguration, artifactory func(string, interface{})) (interface{}, error)
		}); ok {
			// Create artifactory for action context
			actionArtifactory := bs.createArtifactoryForAction(key, actionNdx, suiteNdx)
			// Convert actionArtifactory interface{} to func(string, interface{})
			actionArtifactoryFunc := func(filename string, payload interface{}) {
				if artifactoryObj, ok := actionArtifactory.(interface {
					WriteFileSync(filename string, payload string)
				}); ok {
					// Convert payload to string
					var payloadStr string
					switch v := payload.(type) {
					case string:
						payloadStr = v
					default:
						payloadStr = fmt.Sprintf("%v", v)
					}
					artifactoryObj.WriteFileSync(filename, payloadStr)
				}
			}
			newStore, err := action.Test(bs.Store, testResourceConfiguration, actionArtifactoryFunc)
			if err != nil {
				bs.Failed = true
				bs.Fails++
				bs.Error = err
			} else {
				bs.Store = newStore
			}
		}
	}

	// Process checks
	for checkNdx, checkStep := range bs.Checks {
		if check, ok := checkStep.(interface {
			Test(store interface{}, testResourceConfiguration ITTestResourceConfiguration, filepath string, artifactory func(string, interface{})) (interface{}, error)
		}); ok {
			filepath := ""
			if suiteNdx != nil {
				filepath = fmt.Sprintf("suite-%d/setup-%s/check-%d", *suiteNdx, key, checkNdx)
			} else {
				filepath = fmt.Sprintf("setup-%s/check-%d", key, checkNdx)
			}
			// Create artifactory for check context
			checkArtifactory := bs.createArtifactoryForCheck(key, checkNdx, suiteNdx)
			// Convert checkArtifactory interface{} to func(string, interface{})
			checkArtifactoryFunc := func(filename string, payload interface{}) {
				if artifactoryObj, ok := checkArtifactory.(interface {
					WriteFileSync(filename string, payload string)
				}); ok {
					// Convert payload to string
					var payloadStr string
					switch v := payload.(type) {
					case string:
						payloadStr = v
					default:
						payloadStr = fmt.Sprintf("%v", v)
					}
					artifactoryObj.WriteFileSync(filename, payloadStr)
				}
			}
			result, err := check.Test(bs.Store, testResourceConfiguration, filepath, checkArtifactoryFunc)
			if err != nil {
				bs.Failed = true
				bs.Fails++
				bs.Error = err
			} else {
				tester(result)
			}
		}
	}

	// Cleanup
	_, err = bs.AfterEach(bs.Store, bs.Key, setupArtifactory)
	if err != nil {
		bs.Failed = true
		bs.Fails++
		bs.Error = err
	}

	return bs.Store, nil
}

func (bs *BaseSetup) createArtifactoryForAction(
	key string,
	actionIndex int,
	suiteNdx *int,
) interface{} {
	// If this is a BaseGiven, use its CreateArtifactoryForWhen method
	if bg, ok := bs.Parent.(*BaseGiven); ok {
		return bg.CreateArtifactoryForWhen(key, actionIndex, suiteNdx)
	}
	
	// If parent has createArtifactory method, use it
	if bs.Parent != nil {
		if parent, ok := bs.Parent.(interface {
			CreateArtifactory(context map[string]interface{}) interface{}
		}); ok {
			context := map[string]interface{}{
				"givenKey": key,
				"whenIndex": actionIndex,
			}
			if suiteNdx != nil {
				context["suiteIndex"] = *suiteNdx
			}
			return parent.CreateArtifactory(context)
		}
	}
	
	// Fallback to a simple artifactory
	return struct {
		WriteFileSync func(filename string, payload string)
	}{
		WriteFileSync: func(filename string, payload string) {
			var path string
			if suiteNdx != nil {
				path = fmt.Sprintf("suite-%d/", *suiteNdx)
			}
			path += fmt.Sprintf("setup-%s/", key)
			path += fmt.Sprintf("action-%d %v", actionIndex, filename)
			fmt.Printf("[Artifactory] Would write to: %s\n", path)
		},
	}
}

func (bs *BaseSetup) createArtifactoryForCheck(
	key string,
	checkIndex int,
	suiteNdx *int,
) interface{} {
	// If this is a BaseGiven, use its CreateArtifactoryForThen method
	if bg, ok := bs.Parent.(*BaseGiven); ok {
		return bg.CreateArtifactoryForThen(key, checkIndex, suiteNdx)
	}
	
	// If parent has createArtifactory method, use it
	if bs.Parent != nil {
		if parent, ok := bs.Parent.(interface {
			CreateArtifactory(context map[string]interface{}) interface{}
		}); ok {
			context := map[string]interface{}{
				"givenKey": key,
				"thenIndex": checkIndex,
			}
			if suiteNdx != nil {
				context["suiteIndex"] = *suiteNdx
			}
			return parent.CreateArtifactory(context)
		}
	}
	
	// Fallback to a simple artifactory
	return struct {
		WriteFileSync func(filename string, payload string)
	}{
		WriteFileSync: func(filename string, payload string) {
			var path string
			if suiteNdx != nil {
				path = fmt.Sprintf("suite-%d/", *suiteNdx)
			}
			path += fmt.Sprintf("setup-%s/", key)
			path += fmt.Sprintf("check-%d %v", checkIndex, filename)
			fmt.Printf("[Artifactory] Would write to: %s\n", path)
		},
	}
}
