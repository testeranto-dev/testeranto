package golingvu

import "fmt"

// BaseGiven represents a base Given condition
type BaseGiven struct {
	Features          []string
	Whens             []*BaseWhen
	Thens             []*BaseThen
	Error             error
	Fail              interface{}
	Store             interface{}
	RecommendedFsPath string
	GivenCB           interface{}
	InitialValues     interface{}
	Key               string
	Failed            bool
	Artifacts         []string
	GivenThatFunc     func(subject, testResource, artifactory, initializer, initialValues, pm interface{}) (interface{}, error)
	AfterEachFunc     func(store interface{}, key string, artifactory, pm interface{}) (interface{}, error)
	UberCatcherFunc   func(func())
}

// AddArtifact adds an artifact path
func (bg *BaseGiven) AddArtifact(path string) {
	// Normalize path separators
	// For simplicity, we'll assume paths are already normalized
	bg.Artifacts = append(bg.Artifacts, path)
}

// NewBaseGiven creates a new BaseGiven instance
func NewBaseGiven(key string, features []string, whens []*BaseWhen, thens []*BaseThen, givenCB, initialValues interface{}) *BaseGiven {
	return &BaseGiven{
		Key:           key,
		Features:      features,
		Whens:         whens,
		Thens:         thens,
		GivenCB:       givenCB,
		InitialValues: initialValues,
		Artifacts:     make([]string, 0),
		Failed:        false,
		Fails:         0,
	}
}

// BeforeAll is called before all tests
func (bg *BaseGiven) BeforeAll(store interface{}) interface{} {
	return store
}

// ToObj converts the instance to a map for serialization
func (bg *BaseGiven) ToObj() map[string]interface{} {
	whenObjs := make([]map[string]interface{}, len(bg.Whens))
	for i, w := range bg.Whens {
		whenObjs[i] = w.ToObj()
	}

	thenObjs := make([]map[string]interface{}, len(bg.Thens))
	for i, t := range bg.Thens {
		thenObjs[i] = t.ToObj()
	}

	return map[string]interface{}{
		"key": bg.Key,

		"whens":     whenObjs,
		"thens":     thenObjs,
		"error":     bg.Error,
		"failed":    bg.Failed,
		"features":  bg.Features,
		"artifacts": bg.Artifacts,
	}
}

// GivenThat is an abstract method to be implemented
func (bg *BaseGiven) GivenThat(subject, testResourceConfiguration, artifactory, givenCB, initialValues, pm interface{}) (interface{}, error) {
	// To be implemented by concrete types
	return nil, nil
}

// AfterEach is called after each test
func (bg *BaseGiven) AfterEach(store interface{}, key string, artifactory, pm interface{}) (interface{}, error) {
	return store, nil
}

// UberCatcher handles errors
func (bg *BaseGiven) UberCatcher(e error) {
	bg.Error = e
}

// Give executes the given condition
func (bg *BaseGiven) Give(
	subject interface{},
	key string,
	testResourceConfiguration ITTestResourceConfiguration,
	tester func(interface{}) bool,
	suiteNdx int,
	artifactory func(string, interface{}),
) (interface{}, error) {
	bg.Key = key
	bg.Fails = 0

	// Setup
	store, err := bg.GivenThat(
		subject,
		testResourceConfiguration,
		artifactory,
		bg.GivenCB,
		bg.InitialValues,
		nil, // pm parameter removed
	)
	if err != nil {
		bg.Failed = true
		bg.Fails++
		bg.Error = err
		return nil, err
	}
	bg.Store = store

	// Process Whens
	for whenNdx, when := range bg.Whens {
		_, err := when.Test(
			bg.Store,
			testResourceConfiguration,
		)
		if err != nil {
			bg.Failed = true
			bg.Fails++
			bg.Error = err
			// Continue processing
		}
	}

	// Process Thens
	for thenNdx, then := range bg.Thens {
		result, err := then.Test(
			bg.Store,
			testResourceConfiguration,
		)
		if err != nil {
			bg.Failed = true
			bg.Fails++
			bg.Error = err
			// Continue processing
		} else if !tester(result) {
			bg.Failed = true
			bg.Fails++
		}
	}

	// Cleanup
	_, err = bg.AfterEach(bg.Store, bg.Key, artifactory, nil) // pm parameter removed
	if err != nil {
		bg.Failed = true
		bg.Fails++
		bg.Error = err
	}

	return bg.Store, nil
}
