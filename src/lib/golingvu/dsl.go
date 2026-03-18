package golingvu

// DSL provides a more readable way to create test specifications
type DSL struct {
	suites  map[string]interface{}
	givens  map[string]interface{}
	whens   map[string]interface{}
	thens   map[string]interface{}
}

// NewDSL creates a new DSL instance
func NewDSL() *DSL {
	return &DSL{
		suites: make(map[string]interface{}),
		givens: make(map[string]interface{}),
		whens:  make(map[string]interface{}),
		thens:  make(map[string]interface{}),
	}
}

// Suite creates a test suite
func (d *DSL) Suite(name string, suiteFunc func(string, map[string]*BaseGiven) *BaseSuite) *DSL {
	d.suites[name] = suiteFunc
	return d
}

// Given creates a given function
func (d *DSL) Given(name string, givenFunc func(string, []string, []*BaseWhen, []*BaseThen, interface{}, interface{}) *BaseGiven) *DSL {
	d.givens[name] = givenFunc
	return d
}

// When creates a when function
func (d *DSL) When(name string, whenFunc func(...interface{}) *BaseWhen) *DSL {
	d.whens[name] = whenFunc
	return d
}

// Then creates a then function
func (d *DSL) Then(name string, thenFunc func(...interface{}) *BaseThen) *DSL {
	d.thens[name] = thenFunc
	return d
}

// BuildSpecification builds a test specification from the DSL
func (d *DSL) BuildSpecification(buildFunc func(*TestBuilder) interface{}) ITestSpecification {
	return func(suites, givens, whens, thens interface{}) interface{} {
		// Type assertions
		suitesMap := suites.(map[string]interface{})
		givensMap := givens.(map[string]interface{})
		whensMap := whens.(map[string]interface{})
		thensMap := thens.(map[string]interface{})
		
		// Merge with DSL functions
		for k, v := range d.suites {
			suitesMap[k] = v
		}
		for k, v := range d.givens {
			givensMap[k] = v
		}
		for k, v := range d.whens {
			whensMap[k] = v
		}
		for k, v := range d.thens {
			thensMap[k] = v
		}
		
		// Create test builder
		builder := &TestBuilder{
			suites:  suitesMap,
			givens:  givensMap,
			whens:   whensMap,
			thens:   thensMap,
		}
		
		return buildFunc(builder)
	}
}

// TestBuilder helps build test specifications
type TestBuilder struct {
	suites  map[string]interface{}
	givens  map[string]interface{}
	whens   map[string]interface{}
	thens   map[string]interface{}
}

// Press creates a press when action
func (tb *TestBuilder) Press(button string) *BaseWhen {
	pressFunc := tb.whens["press"].(func(...interface{}) *BaseWhen)
	return pressFunc(button)
}

// Enter creates an enter when action
func (tb *TestBuilder) Enter() *BaseWhen {
	enterFunc := tb.whens["enter"].(func(...interface{}) *BaseWhen)
	return enterFunc()
}

// Result creates a result then assertion
func (tb *TestBuilder) Result(expected string) *BaseThen {
	resultFunc := tb.thens["result"].(func(...interface{}) *BaseThen)
	return resultFunc(expected)
}

// CreateGiven creates a test case
func (tb *TestBuilder) CreateGiven(
	name string,
	description string,
	pressButtons []string,
	useEnter bool,
	expected string,
) *BaseGiven {
	// Get the appropriate given function based on name
	var givenFunc func(string, []string, []*BaseWhen, []*BaseThen, interface{}, interface{}) *BaseGiven
	
	if name == "testEmptyDisplay" {
		givenFunc = tb.givens["testEmptyDisplay"].(func(string, []string, []*BaseWhen, []*BaseThen, interface{}, interface{}) *BaseGiven)
	} else {
		givenFunc = tb.givens["testSingleDigit"].(func(string, []string, []*BaseWhen, []*BaseThen, interface{}, interface{}) *BaseGiven)
	}
	
	// Create whens
	whensList := make([]*BaseWhen, 0)
	for _, button := range pressButtons {
		whensList = append(whensList, tb.Press(button))
	}
	if useEnter {
		whensList = append(whensList, tb.Enter())
	}
	
	// Create thens
	thensList := []*BaseThen{
		tb.Result(expected),
	}
	
	return givenFunc(
		name,
		[]string{description},
		whensList,
		thensList,
		nil,
		nil,
	)
}

// SimpleSpecification creates a simple test specification
func SimpleSpecification(
	suiteName string,
	tests map[string]struct {
		description string
		features    []string
		press       []string
		enter       bool
		expected    string
	},
) ITestSpecification {
	return func(suites, givens, whens, thens interface{}) interface{} {
		suitesMap := suites.(map[string]interface{})
		givensMap := givens.(map[string]interface{})
		whensMap := whens.(map[string]interface{})
		thensMap := thens.(map[string]interface{})
		
		// Get functions
		suiteFunc := suitesMap["CalculatorSuite"].(func(string, map[string]*BaseGiven) *BaseSuite)
		pressFunc := whensMap["press"].(func(...interface{}) *BaseWhen)
		enterFunc := whensMap["enter"].(func(...interface{}) *BaseWhen)
		resultFunc := thensMap["result"].(func(...interface{}) *BaseThen)
		
		// Helper to create a given
		createGiven := func(name string, description string, features []string, pressButtons []string, useEnter bool, expected string) *BaseGiven {
			whensList := make([]*BaseWhen, 0)
			for _, button := range pressButtons {
				whensList = append(whensList, pressFunc(button))
			}
			if useEnter {
				whensList = append(whensList, enterFunc())
			}
			
			thensList := []*BaseThen{
				resultFunc(expected),
			}
			
			// In TypeScript, the first parameter to Given.Default is an array of features
			// The description should be included as a feature (typically the first one)
			allFeatures := make([]string, 0, 1+len(features))
			allFeatures = append(allFeatures, description)
			allFeatures = append(allFeatures, features...)
			
			// Try to find a specific given function by name
			if givenFuncInterface, exists := givensMap[name]; exists {
				if givenFunc, ok := givenFuncInterface.(func(string, []string, []*BaseWhen, []*BaseThen, interface{}, interface{}) *BaseGiven); ok {
					return givenFunc(
						name,
						allFeatures,
						whensList,
						thensList,
						nil,
						nil,
					)
				}
			}
			
			// Fallback to a default given function
			// Look for any given function that matches the expected signature
			for _, funcInterface := range givensMap {
				if givenFunc, ok := funcInterface.(func(string, []string, []*BaseWhen, []*BaseThen, interface{}, interface{}) *BaseGiven); ok {
					return givenFunc(
						name,
						allFeatures,
						whensList,
						thensList,
						nil,
						nil,
					)
				}
			}
			
			// If no given function is found, create a basic one
			return NewBaseGiven(
				name,
				allFeatures,
				whensList,
				thensList,
				nil,
				nil,
			)
		}
		
		// Create all givens
		givensForSuite := make(map[string]*BaseGiven)
		for name, test := range tests {
			givensForSuite[name] = createGiven(name, test.description, test.features, test.press, test.enter, test.expected)
		}
		
		return []interface{}{
			suiteFunc(suiteName, givensForSuite),
		}
	}
}
