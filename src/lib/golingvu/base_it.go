package golingvu

// BaseIt extends BaseAction for Describe-It pattern
type BaseIt struct {
	*BaseAction
	ItCB interface{}
}

// NewBaseIt creates a new BaseIt instance
func NewBaseIt(name string, itCB interface{}) *BaseIt {
	baseAction := NewBaseAction(name, itCB)
	return &BaseIt{
		BaseAction: baseAction,
		ItCB:       itCB,
	}
}

// PerformAction implements BaseAction's abstract method
func (bi *BaseIt) PerformAction(
	store interface{},
	actionCB interface{},
	testResource interface{},
	artifactory func(string, interface{}),
) (interface{}, error) {
	// This should be implemented by the adapter
	// It can perform both mutations and assertions
	return store, nil
}

// PerformIt is an alias for PerformAction for Describe-It pattern
func (bi *BaseIt) PerformIt(
	store interface{},
	itCB interface{},
	testResource interface{},
	artifactory func(string, interface{}),
) (interface{}, error) {
	return bi.PerformAction(store, itCB, testResource, artifactory)
}

// Test executes the It with artifactory
func (bi *BaseIt) Test(
	store interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	artifactory func(string, interface{}),
) (interface{}, error) {
	return bi.PerformAction(store, bi.ItCB, testResourceConfiguration, artifactory)
}
