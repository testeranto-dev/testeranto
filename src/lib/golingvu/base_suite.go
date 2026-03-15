package golingvu

// BaseSuite represents a test suite
type BaseSuite struct {
	Key                       string
	Givens                    map[string]*BaseGiven
	AfterAllFunc              func(store interface{}) interface{}
	AssertThatFunc            func(t interface{}) bool
	SetupFunc                 func(s interface{}, tr ITTestResourceConfiguration) interface{}
	Store                     interface{}
	TestResourceConfiguration ITTestResourceConfiguration
	Index                     int
	Failed                    bool
	Fails                     int
	Artifacts                 []string
}

// Run executes the test suite
func (bs *BaseSuite) Run(input interface{}, testResourceConfiguration ITTestResourceConfiguration) (*BaseSuite, error) {
	bs.TestResourceConfiguration = testResourceConfiguration

	// Setup
	subject := bs.SetupFunc(input, testResourceConfiguration)

	// Run each given
	for gKey, g := range bs.Givens {
		_, err := g.Give(
			subject,
			gKey,
			testResourceConfiguration,
			bs.AssertThatFunc,
			nil, // artifactory is not passed, matching TypeScript
			bs.Index,
		)
		if err != nil {
			bs.Failed = true
			bs.Fails++
			return bs, err
		}
	}

	// After all
	bs.AfterAllFunc(bs.Store)

	return bs, nil
}

// ToObj converts the suite to a serializable object
func (bs *BaseSuite) ToObj() map[string]interface{} {
	givens := make([]map[string]interface{}, 0)
	for _, given := range bs.Givens {
		givens = append(givens, given.ToObj())
	}

	return map[string]interface{}{
		"key":      bs.Key,
		"givens":   givens,
		"fails":    bs.Fails,
		"failed":   bs.Failed,
		"features": bs.Features(),
	}
}

// Features returns the features covered by this suite
func (bs *BaseSuite) Features() []string {
	features := make([]string, 0)
	seen := make(map[string]bool)

	for _, given := range bs.Givens {
		for _, feature := range given.Features {
			if !seen[feature] {
				features = append(features, feature)
				seen[feature] = true
			}
		}
	}
	return features
}

// AddArtifact adds an artifact to the suite
func (bs *BaseSuite) AddArtifact(path string) {
	bs.Artifacts = append(bs.Artifacts, path)
}
