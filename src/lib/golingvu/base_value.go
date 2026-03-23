package golingvu

// BaseValue extends BaseSetup for TDT pattern
type BaseValue struct {
	*BaseSetup
	TableRows [][]interface{}
}

// NewBaseValue creates a new BaseValue instance
func NewBaseValue(
	features []string,
	tableRows [][]interface{},
	confirmCB interface{},
	initialValues interface{},
) *BaseValue {
	// For TDT, actions will be Should and checks will be Expected
	// We'll process them differently in setup
	baseSetup := NewBaseSetup(features, []interface{}{}, []interface{}{}, confirmCB, initialValues)
	return &BaseValue{
		BaseSetup: baseSetup,
		TableRows: tableRows,
	}
}

// SetupThat implements BaseSetup's abstract method
func (bv *BaseValue) SetupThat(
	subject interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	artifactory func(string, interface{}),
	setupCB interface{},
	initialValues interface{},
) (interface{}, error) {
	// This should be implemented by the adapter
	return subject, nil
}

// Value is an alias for Setup for TDT pattern
func (bv *BaseValue) Value(
	subject interface{},
	key string,
	testResourceConfiguration ITTestResourceConfiguration,
	tester func(interface{}) bool,
	artifactory func(string, interface{}),
	suiteNdx *int,
) (interface{}, error) {
	return bv.Setup(subject, key, testResourceConfiguration, tester, artifactory, suiteNdx)
}
