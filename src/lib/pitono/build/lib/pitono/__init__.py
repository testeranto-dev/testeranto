from .Pitono import Pitono, set_default_instance, main
from .simple_adapter import SimpleTestAdapter
from .pitono_types import (
    ITestAdapter, ITTestResourceConfiguration, ITestSpecification, 
    ITestImplementation, ITTestResourceRequest, IFinalResults
)
from .base_suite import BaseSuite
from .base_given import BaseGiven
from .base_when import BaseWhen
from .base_then import BaseThen

# Try to import flavored version
try:
    from .flavored import suite, given, when, then, TestSuite, PitonoTestCase
    _flavored_available = True
except ImportError:
    # flavored module might not exist yet
    _flavored_available = False
    # Print debug info if needed
    # print(f"Note: Flavored module not available: {e}")

__all__ = [
    'Pitono', 'set_default_instance', 'main', 'SimpleTestAdapter',
    'ITestAdapter', 'ITTestResourceConfiguration', 'ITestSpecification',
    'ITestImplementation', 'ITTestResourceRequest', 'IFinalResults',
    'BaseSuite', 'BaseGiven', 'BaseWhen', 'BaseThen'
]

# Add flavored exports if available
if _flavored_available:
    __all__.extend(['suite', 'given', 'when', 'then', 'TestSuite', 'PitonoTestCase'])
