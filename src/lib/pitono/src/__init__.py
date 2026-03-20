from .Pitono import Pitono, set_default_instance, main
from .simple_adapter import SimpleTestAdapter
from .pitono_types import (
    IUniversalTestAdapter, ITestAdapter, ITTestResourceConfiguration, ITestSpecification, 
    ITestImplementation, ITTestResourceRequest, IFinalResults, ITestArtifactory
)
from .base_suite import BaseSuite
from .base_setup import BaseSetup
from .base_action import BaseAction
from .base_check import BaseCheck
from .base_given import BaseGiven
from .base_when import BaseWhen
from .base_then import BaseThen

# New unified pattern classes
from .base_arrange import BaseArrange
from .base_act import BaseAct
from .base_assert import BaseAssert
from .base_map import BaseMap
from .base_feed import BaseFeed
from .base_validate import BaseValidate

# Import reverse integration
try:
    from .reverse_integration import ReverseIntegration
    _reverse_integration_available = True
except ImportError as e:
    _reverse_integration_available = False
    # Print debug info if needed
    # print(f"Note: Reverse integration module not available: {e}")

# Helper functions for AAA and TDT patterns
def create_aaa_specification(Suite, Arrange, Act, Assert):
    """Create AAA pattern specification helpers."""
    return {
        'Suite': {
            'Default': lambda name, arrangements: Suite.Default(name, arrangements)
        },
        'Arrange': {
            'Default': lambda features, acts, asserts, arrange_cb, initial_values: 
                Arrange.Default(features, acts, asserts, arrange_cb, initial_values)
        },
        'Act': {
            'Default': lambda name, act_cb: Act.Default(name, act_cb)
        },
        'Assert': {
            'Default': lambda name, assert_cb: Assert.Default(name, assert_cb)
        }
    }

def create_tdt_specification(Suite, Map, Feed, Validate):
    """Create TDT pattern specification helpers."""
    return {
        'Suite': {
            'Default': lambda name, maps: Suite.Default(name, maps)
        },
        'Map': {
            'Default': lambda features, feeds, validates, map_cb, initial_values, table_data=None: 
                Map.Default(features, feeds, validates, map_cb, initial_values, table_data or [])
        },
        'Feed': {
            'Default': lambda name, feed_cb: Feed.Default(name, feed_cb)
        },
        'Validate': {
            'Default': lambda name, validate_cb: Validate.Default(name, validate_cb)
        }
    }

# Aliases for backward compatibility
AAA = create_aaa_specification
TDT = create_tdt_specification

__all__ = [
    'Pitono', 'set_default_instance', 'main', 'SimpleTestAdapter',
    'IUniversalTestAdapter', 'ITestAdapter', 'ITestResourceConfiguration', 'ITestSpecification',
    'ITestImplementation', 'ITestResourceRequest', 'IFinalResults', 'ITestArtifactory',
    'BaseSuite', 'BaseSetup', 'BaseAction', 'BaseCheck',
    'BaseGiven', 'BaseWhen', 'BaseThen',
    'BaseArrange', 'BaseAct', 'BaseAssert',
    'BaseMap', 'BaseFeed', 'BaseValidate',
    'create_aaa_specification', 'create_tdt_specification', 'AAA', 'TDT'
]

# Add reverse integration exports if available
if _reverse_integration_available:
    __all__.append('ReverseIntegration')
