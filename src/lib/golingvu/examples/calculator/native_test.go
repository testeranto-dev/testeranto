// Native Go test example for Calculator
package calculator_test

import (
	"testing"
	"github.com/testeranto-dev/testeranto/src/lib/golingvu/examples/calculator"
)

func TestCalculatorInitialDisplay(t *testing.T) {
	calc := &calculator.Calculator{}
	if calc.GetDisplay() != "" {
		t.Errorf("Expected empty display, got %s", calc.GetDisplay())
	}
}

func TestCalculatorSingleDigit(t *testing.T) {
	calc := &calculator.Calculator{}
	calc.Press("2")
	if calc.GetDisplay() != "2" {
		t.Errorf("Expected '2', got %s", calc.GetDisplay())
	}
}

func TestCalculatorMultipleDigits(t *testing.T) {
	calc := &calculator.Calculator{}
	calc.Press("2")
	calc.Press("2")
	if calc.GetDisplay() != "22" {
		t.Errorf("Expected '22', got %s", calc.GetDisplay())
	}
}

func TestCalculatorAddition(t *testing.T) {
	calc := &calculator.Calculator{}
	calc.Press("2")
	calc.Press("+")
	calc.Press("3")
	calc.Enter()
	if calc.GetDisplay() != "5" {
		t.Errorf("Expected '5', got %s", calc.GetDisplay())
	}
}

func TestCalculatorSubtraction(t *testing.T) {
	calc := &calculator.Calculator{}
	calc.Press("9")
	calc.Press("5")
	calc.Press("-")
	calc.Press("3")
	calc.Press("2")
	calc.Enter()
	if calc.GetDisplay() != "63" {
		t.Errorf("Expected '63', got %s", calc.GetDisplay())
	}
}

func TestCalculatorMultiplication(t *testing.T) {
	calc := &calculator.Calculator{}
	calc.Press("6")
	calc.Press("*")
	calc.Press("7")
	calc.Enter()
	if calc.GetDisplay() != "42" {
		t.Errorf("Expected '42', got %s", calc.GetDisplay())
	}
}

func TestCalculatorClear(t *testing.T) {
	calc := &calculator.Calculator{}
	calc.Press("1")
	calc.Press("2")
	calc.Press("3")
	calc.Press("C")
	calc.Press("4")
	if calc.GetDisplay() != "4" {
		t.Errorf("Expected '4', got %s", calc.GetDisplay())
	}
}

func TestCalculatorDecimal(t *testing.T) {
	calc := &calculator.Calculator{}
	calc.Press("3")
	calc.Press(".")
	calc.Press("1")
	calc.Press("4")
	if calc.GetDisplay() != "3.14" {
		t.Errorf("Expected '3.14', got %s", calc.GetDisplay())
	}
}

func TestCalculatorDivisionByZero(t *testing.T) {
	calc := &calculator.Calculator{}
	calc.Press("5")
	calc.Press("/")
	calc.Press("0")
	calc.Enter()
	if calc.GetDisplay() != "Error" {
		t.Errorf("Expected 'Error', got %s", calc.GetDisplay())
	}
}
