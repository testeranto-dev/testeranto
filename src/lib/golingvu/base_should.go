package golingvu

// BaseShould extends BaseAction for TDT pattern
type BaseShould struct {
	*BaseAction
	CurrentRow []interface{}
	RowIndex   int
}

// NewBaseShould creates a new BaseShould instance
func NewBaseShould(name string, shouldCB interface{}) *BaseShould {
	baseAction := NewBaseAction(name, shouldCB)
	return &BaseShould{
		BaseAction: baseAction,
		RowIndex:   -1,
		CurrentRow: []interface{}{},
	}
}

// PerformAction implements BaseAction's abstract method
func (bs *BaseShould) PerformAction(
	store interface{},
	actionCB interface{},
	testResource interface{},
	artifactory func(string, interface{}),
) (interface{}, error) {
	// This should be implemented by the adapter
	return store, nil
}

// SetRowData sets current row data
func (bs *BaseShould) SetRowData(rowIndex int, rowData []interface{}) {
	bs.RowIndex = rowIndex
	bs.CurrentRow = rowData
}

// ProcessRow processes the current row
func (bs *BaseShould) ProcessRow(
	store interface{},
	testResourceConfiguration ITTestResourceConfiguration,
	artifactory func(string, interface{}),
) (interface{}, error) {
	return bs.Test(store, testResourceConfiguration, artifactory)
}
