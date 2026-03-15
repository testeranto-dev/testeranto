package golingvu

// BaseWhen represents a When condition
type BaseWhen struct {
	Key         string
	WhenCB      interface{}
	AndWhenFunc func(store, whenCB, testResource, pm interface{}) (interface{}, error)
}

// Test executes the When condition
func (bw *BaseWhen) Test(store interface{}, testResourceConfiguration ITTestResourceConfiguration) (interface{}, error) {
	if bw.AndWhenFunc != nil {
		return bw.AndWhenFunc(store, bw.WhenCB, testResourceConfiguration, nil)
	}
	return store, nil
}

// ToObj converts the When condition to a serializable object
func (bw *BaseWhen) ToObj() map[string]interface{} {
	return map[string]interface{}{
		"key":    bw.Key,
		"status": true, // Default status
		"error":  nil,
		"artifacts": []interface{}{},
	}
}
