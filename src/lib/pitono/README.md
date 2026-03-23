# Pitono

The python implementation of testeranto.

## Setup

1. Create a virtual environment:

```bash
python3 -m venv venv
```

2. Activate the virtual environment:

```bash
source venv/bin/activate
```

3. Install the package in development mode:

```bash
pip install -e .
```

## Running Tests

Make sure the virtual environment is activated, then run your Python tests normally.

## Artifactory Notes

The artifactory system in Pitono provides file operations for test artifacts. Note that:
- `writeFileSync` is fully implemented for file system operations
- Python is a server-side language and CANNOT capture screenshots or screencasts
- Only the Web runtime (browser environment) can capture visual content
- This is a necessary difference between web and other runtimes

**Important**: Screenshot and screencast functionality is not applicable to the Python implementation. These methods are intentionally omitted because Python cannot capture visual content. Only browser-based implementations (WebTiposkripto) can provide visual capture capabilities.
