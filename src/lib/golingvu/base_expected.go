package golingvu

// BaseExpected extends BaseCheck for TDT pattern
type BaseExpected struct {
	*BaseCheck
	ExpectedValue interface{}
}

// NewBaseExpected creates a new BaseExpected instance
func NewBaseExpected(name string, expectedCB interface{}) *BaseExpected {
	baseCheck := NewBaseCheck(name, expectedCB)
	return &BaseExpected{
		BaseCheck: baseCheck,
	}
}

// VerifyCheck implements BaseCheck's abstract method
func (be *BaseExpected) VerifyCheck(
	store interface{},
	checkCB interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	artifactory func(string, interface{}),
) (interface{}, error) {
	// This should be implemented by the adapter
	return store, nil
}

// SetExpectedValue sets the expected value
func (be *BaseExpected) SetExpectedValue(expected interface{}) {
	be.ExpectedValue = expected
}

// ValidateRow validates the current row
func (be *BaseExpected) ValidateRow(
	store interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	filepath string,
	expectedValue interface{},
	artifactory func(string, interface{}),
) (interface{}, error) {
	be.SetExpectedValue(expectedValue)
	return be.Test(store, testResourceConfiguration, filepath, artifactory)
}
