package golingvu

// BaseConfirm extends BaseSetup for TDT pattern
type BaseConfirm struct {
	*BaseSetup
	TestCases [][]interface{}
}

// NewBaseConfirm creates a new BaseConfirm instance
func NewBaseConfirm(
	features []string,
	testCases [][]interface{},
	confirmCB interface{},
	initialValues interface{},
) *BaseConfirm {
	// For TDT, actions will be Should and checks will be Expected
	// We'll process them differently in setup
	baseSetup := NewBaseSetup(features, []interface{}{}, []interface{}{}, confirmCB, initialValues)
	return &BaseConfirm{
		BaseSetup: baseSetup,
		TestCases: testCases,
	}
}

// SetupThat implements BaseSetup's abstract method
func (bc *BaseConfirm) SetupThat(
	subject interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	artifactory func(string, interface{}),
	setupCB interface{},
	initialValues interface{},
) (interface{}, error) {
	// This should be implemented by the adapter
	return subject, nil
}

// Confirm is an alias for Setup for TDT pattern
func (bc *BaseConfirm) Confirm(
	subject interface{},
	key string,
	testResourceConfiguration ITTestResourceConfiguration,
	tester func(interface{}) bool,
	artifactory func(string, interface{}),
	suiteNdx *int,
) (interface{}, error) {
	return bc.Setup(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx)
}
