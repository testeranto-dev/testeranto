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
from .base_value import BaseValue
from .base_should import BaseShould
from .base_expected import BaseExpected
from .base_describe import BaseDescribe
from .base_it import BaseIt

# Helper functions for TDT and Describe-It patterns
def create_tdt_specification(Suite, Value, Should, Expected):
    """Create TDT pattern specification helpers."""
    return {
        'Suite': {
            'Default': lambda name, values: Suite.Default(name, values)
        },
        'Value': {
            'Default': lambda features, table_rows, confirm_cb, initial_values: 
                Value.Default(features, table_rows, confirm_cb, initial_values)
        },
        'Should': {
            'Default': lambda name, should_cb: Should.Default(name, should_cb)
        },
        'Expected': {
            'Default': lambda name, expected_cb: Expected.Default(name, expected_cb)
        }
    }

def create_describe_it_specification(Suite, Describe, It):
    """Create Describe-It pattern specification helpers."""
    return {
        'Suite': {
            'Default': lambda name, describes: Suite.Default(name, describes)
        },
        'Describe': {
            'Default': lambda features, its, describe_cb, initial_values: 
                Describe.Default(features, its, describe_cb, initial_values)
        },
        'It': {
            'Default': lambda name, it_cb: It.Default(name, it_cb)
        }
    }

# Aliases
TDT = create_tdt_specification
DescribeIt = create_describe_it_specification

__all__ = [
    'Pitono', 'set_default_instance', 'main', 'SimpleTestAdapter',
    'IUniversalTestAdapter', 'ITestAdapter', 'ITestResourceConfiguration', 'ITestSpecification',
    'ITestImplementation', 'ITestResourceRequest', 'IFinalResults', 'ITestArtifactory',
    'BaseSuite', 'BaseSetup', 'BaseAction', 'BaseCheck',
    'BaseGiven', 'BaseWhen', 'BaseThen',
    'BaseValue', 'BaseShould', 'BaseExpected',
    'BaseDescribe', 'BaseIt',
    'create_tdt_specification', 'create_describe_it_specification',
    'TDT', 'DescribeIt'
]
