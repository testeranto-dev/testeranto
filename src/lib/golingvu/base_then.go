package golingvu

// BaseThen represents a Then condition
type BaseThen struct {
	*BaseCheck
	Key         string
	ThenCB      interface{}
	ButThenFunc func(store, thenCB, testResource interface{}, artifactory func(string, interface{})) (interface{}, error)
}

// NewBaseThen creates a new BaseThen
func NewBaseThen(key string, thenCB interface{}) *BaseThen {
	baseCheck := NewBaseCheck(key, thenCB)
	return &BaseThen{
		BaseCheck: baseCheck,
		Key:       key,
		ThenCB:    thenCB,
	}
}

// VerifyCheck implements BaseCheck's abstract method
func (bt *BaseThen) VerifyCheck(
	store interface{},
	checkCB interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	artifactory func(string, interface{}),
) (interface{}, error) {
	if bt.ButThenFunc != nil {
		return bt.ButThenFunc(store, checkCB, testResourceConfiguration, artifactory)
	}
	return store, nil
}

// Test executes the Then condition with artifactory
func (bt *BaseThen) Test(store interface{}, testResourceConfiguration ITTestResourceConfiguration, filepath string, artifactory func(string, interface{})) (interface{}, error) {
	return bt.VerifyCheck(store, bt.ThenCB, testResourceConfiguration, artifactory)
}

// ToObj converts the Then condition to a serializable object
func (bt *BaseThen) ToObj() map[string]interface{} {
	baseObj := bt.BaseCheck.ToObj()
	baseObj["key"] = bt.Key
	return baseObj
}
