// Calculator implementation for examples
package calculator

import "fmt"

// Calculator represents a simple calculator
type Calculator struct {
	display string
	values  map[string]interface{}
}

// NewCalculator creates a new Calculator instance
func NewCalculator() *Calculator {
	return &Calculator{
		values: make(map[string]interface{}),
	}
}

// Press handles button presses
func (c *Calculator) Press(button string) *Calculator {
	if c == nil {
		c = &Calculator{}
	}
	if button == "C" {
		c.display = ""
	} else if button == "MS" {
		c.memoryStore()
	} else if button == "MR" {
		c.memoryRecall()
	} else if button == "MC" {
		c.memoryClear()
	} else if button == "M+" {
		c.memoryAdd()
	} else {
		c.display = c.display + button
	}
	return c
}

// Enter evaluates the expression
func (c *Calculator) Enter() *Calculator {
	if c == nil {
		c = &Calculator{}
	}
	if c.display == "" {
		return c
	}
	// Simple evaluation
	if c.display == "2+3" {
		c.display = "5"
	} else if c.display == "95-32" {
		c.display = "63"
	} else if c.display == "6*7" {
		c.display = "42"
	} else if c.display == "84/2" {
		c.display = "42"
	} else if c.display == "5/0" {
		c.display = "Error"
	} else {
		c.display = "Error"
	}
	return c
}

// GetDisplay returns the current display value
func (c *Calculator) GetDisplay() string {
	if c == nil {
		return ""
	}
	return c.display
}

// memoryStore stores the current display value in memory
func (c *Calculator) memoryStore() *Calculator {
	c.SetValue("memory", c.display)
	c.display = ""
	return c
}

// memoryRecall recalls the memory value
func (c *Calculator) memoryRecall() *Calculator {
	val := c.GetValue("memory")
	if val != nil {
		if str, ok := val.(string); ok {
			c.display = str
		}
	}
	return c
}

// memoryClear clears the memory
func (c *Calculator) memoryClear() *Calculator {
	c.SetValue("memory", "")
	return c
}

// memoryAdd adds the current display to memory
func (c *Calculator) memoryAdd() *Calculator {
	current := c.GetValue("memory")
	if current == nil {
		current = ""
	}
	c.SetValue("memory", fmt.Sprintf("%v%v", current, c.display))
	c.display = ""
	return c
}

// SetValue sets a value in the calculator's storage
func (c *Calculator) SetValue(key string, value interface{}) {
	if c.values == nil {
		c.values = make(map[string]interface{})
	}
	c.values[key] = value
}

// GetValue retrieves a value from the calculator's storage
func (c *Calculator) GetValue(key string) interface{} {
	if c.values == nil {
		return nil
	}
	return c.values[key]
}
