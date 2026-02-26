# For development, allow importing directly
# In production, the package is installed as testeranto_pitono
try:
    from .src import *
except ImportError:
    # When installed as a package, .src doesn't exist
    # because src/ is mapped to testeranto_pitono
    pass
