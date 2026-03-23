package golingvu

// BaseDescribe extends BaseSetup for Describe-It pattern
type BaseDescribe struct {
	*BaseSetup
	Its []interface{}
}

// NewBaseDescribe creates a new BaseDescribe instance
func NewBaseDescribe(
	features []string,
	its []interface{},
	describeCB interface{},
	initialValues interface{},
) *BaseDescribe {
	// Map its to actions and checks
	// Since Its can mix mutations and assertions, we need to handle them differently
	baseSetup := NewBaseSetup(features, its, []interface{}{}, describeCB, initialValues)
	return &BaseDescribe{
		BaseSetup: baseSetup,
		Its:       its,
	}
}

// SetupThat implements BaseSetup's abstract method
func (bd *BaseDescribe) SetupThat(
	subject interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	artifactory func(string, interface{}),
	setupCB interface{},
	initialValues interface{},
) (interface{}, error) {
	// This should be implemented by the adapter
	return subject, nil
}

// Describe is an alias for Setup for Describe-It pattern
func (bd *BaseDescribe) Describe(
	subject interface{},
	key string,
	testResourceConfiguration ITTestResourceConfiguration,
	tester func(interface{}) bool,
	artifactory func(string, interface{}),
	suiteNdx *int,
) (interface{}, error) {
	return bd.Setup(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx)
}
