"""
Flavored (Pythonic) version of Pitono with decorator-based syntax.
"""
# Since flavored.py is in the same directory as this __init__.py,
# we can import directly from it
from .flavored import (
    suite, given, when, then, 
    TestSuite, PitonoTestCase,
    TestStep, TestScenario
)

__all__ = [
    'suite', 'given', 'when', 'then',
    'TestSuite', 'PitonoTestCase',
    'TestStep', 'TestScenario'
]
