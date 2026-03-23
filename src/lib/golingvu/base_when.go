package golingvu

// BaseWhen represents a When condition
type BaseWhen struct {
	*BaseAction
	Key         string
	WhenCB      interface{}
	AndWhenFunc func(store, whenCB, testResource interface{}, artifactory func(string, interface{})) (interface{}, error)
}

// NewBaseWhen creates a new BaseWhen
func NewBaseWhen(key string, whenCB interface{}) *BaseWhen {
	baseAction := NewBaseAction(key, whenCB)
	return &BaseWhen{
		BaseAction: baseAction,
		Key:        key,
		WhenCB:     whenCB,
	}
}

// PerformAction implements BaseAction's abstract method
func (bw *BaseWhen) PerformAction(
	store interface{},
	actionCB interface{},
	testResource interface{},
	artifactory func(string, interface{}),
) (interface{}, error) {
	if bw.AndWhenFunc != nil {
		return bw.AndWhenFunc(store, actionCB, testResource, artifactory)
	}
	return store, nil
}

// Test executes the When condition with artifactory
func (bw *BaseWhen) Test(store interface{}, testResourceConfiguration ITTestResourceConfiguration, artifactory func(string, interface{})) (interface{}, error) {
	return bw.PerformAction(store, bw.WhenCB, testResourceConfiguration, artifactory)
}

// ToObj converts the When condition to a serializable object
func (bw *BaseWhen) ToObj() map[string]interface{} {
	baseObj := bw.BaseAction.ToObj()
	baseObj["key"] = bw.Key
	return baseObj
}
