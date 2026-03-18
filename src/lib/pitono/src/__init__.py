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

# Import reverse integration
try:
    from .reverse_integration import ReverseIntegration
    _reverse_integration_available = True
except ImportError as e:
    _reverse_integration_available = False
    # Print debug info if needed
    # print(f"Note: Reverse integration module not available: {e}")

__all__ = [
    'Pitono', 'set_default_instance', 'main', 'SimpleTestAdapter',
    'ITestAdapter', 'ITTestResourceConfiguration', 'ITestSpecification',
    'ITestImplementation', 'ITestResourceRequest', 'IFinalResults',
    'BaseSuite', 'BaseGiven', 'BaseWhen', 'BaseThen'
]

# Add reverse integration exports if available
if _reverse_integration_available:
    __all__.append('ReverseIntegration')
