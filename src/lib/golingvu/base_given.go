package golingvu

import (
	"fmt"
)

// BaseGiven extends BaseSetup for BDD pattern
type BaseGiven struct {
	*BaseSetup
	Whens []*BaseWhen
	Thens []*BaseThen
	GivenCB interface{}
}

// NewBaseGiven creates a new BaseGiven instance
func NewBaseGiven(key string, features []string, whens []*BaseWhen, thens []*BaseThen, givenCB, initialValues interface{}) *BaseGiven {
	// Convert whens and thens to actions and checks
	actions := make([]interface{}, len(whens))
	for i, w := range whens {
		actions[i] = w
	}
	
	checks := make([]interface{}, len(thens))
	for i, t := range thens {
		checks[i] = t
	}
	
	baseSetup := NewBaseSetup(features, actions, checks, givenCB, initialValues)
	baseSetup.Key = key
	
	return &BaseGiven{
		BaseSetup: baseSetup,
		Whens:     whens,
		Thens:     thens,
		GivenCB:   givenCB,
	}
}

// GivenThat executes the given condition
func (bg *BaseGiven) GivenThat(
	subject interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	artifactory func(string, interface{}),
	givenCB interface{},
	initialValues interface{},
) (interface{}, error) {
	// This should be implemented by the adapter
	return subject, nil
}

// SetupThat implements BaseSetup's abstract method
func (bg *BaseGiven) SetupThat(
	subject interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	artifactory func(string, interface{}),
	setupCB interface{},
	initialValues interface{},
) (interface{}, error) {
	return bg.GivenThat(subject, testResourceConfiguration, artifactory, setupCB, initialValues)
}

// Give is an alias for Setup for BDD pattern
func (bg *BaseGiven) Give(
	subject interface{},
	key string,
	testResourceConfiguration ITTestResourceConfiguration,
	tester func(interface{}) bool,
	artifactory func(string, interface{}),
	suiteNdx int,
) (interface{}, error) {
	ndx := &suiteNdx
	return bg.Setup(subject, key, testResourceConfiguration, tester, artifactory, ndx)
}

// CreateDefaultArtifactory creates a default artifactory for the given
// This matches BaseGiven.ts's createDefaultArtifactory method
func (bg *BaseGiven) CreateDefaultArtifactory(givenKey string, suiteNdx *int) interface{} {
	// Try to get parent's CreateArtifactory method
	if bg.Parent != nil {
		if parent, ok := bg.Parent.(interface {
			CreateArtifactory(context map[string]interface{}) interface{}
		}); ok {
			context := map[string]interface{}{
				"givenKey": givenKey,
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
			path += fmt.Sprintf("given-%s/", givenKey)
			path += filename
			fmt.Printf("[BaseGiven.CreateDefaultArtifactory] Would write to: %s\n", path)
		},
	}
}

// CreateArtifactoryForWhen creates an artifactory for a when action
// This matches BaseGiven.ts's createArtifactoryForWhen method
func (bg *BaseGiven) CreateArtifactoryForWhen(givenKey string, whenIndex int, suiteNdx *int) interface{} {
	// Try to get parent's CreateArtifactory method
	if bg.Parent != nil {
		if parent, ok := bg.Parent.(interface {
			CreateArtifactory(context map[string]interface{}) interface{}
		}); ok {
			context := map[string]interface{}{
				"givenKey":  givenKey,
				"whenIndex": whenIndex,
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
			path += fmt.Sprintf("given-%s/", givenKey)
			path += fmt.Sprintf("when-%d %v", whenIndex, filename)
			fmt.Printf("[BaseGiven.CreateArtifactoryForWhen] Would write to: %s\n", path)
		},
	}
}

// CreateArtifactoryForThen creates an artifactory for a then check
// This matches BaseGiven.ts's createArtifactoryForThen method
func (bg *BaseGiven) CreateArtifactoryForThen(givenKey string, thenIndex int, suiteNdx *int) interface{} {
	// Try to get parent's CreateArtifactory method
	if bg.Parent != nil {
		if parent, ok := bg.Parent.(interface {
			CreateArtifactory(context map[string]interface{}) interface{}
		}); ok {
			context := map[string]interface{}{
				"givenKey":  givenKey,
				"thenIndex": thenIndex,
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
			path += fmt.Sprintf("given-%s/", givenKey)
			path += fmt.Sprintf("then-%d %v", thenIndex, filename)
			fmt.Printf("[BaseGiven.CreateArtifactoryForThen] Would write to: %s\n", path)
		},
	}
}
