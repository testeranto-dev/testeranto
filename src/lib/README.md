These are the 6 BDD libs

- tiposkripto (web and node runtimes)
- golingvu (golang)
- pitono (python)
- rubeno (ruby)
- kafe (java)
- rusto (rust)

Each is an implementation of a Testeranto test. Each test should come online with a "test resource configuration" as a command line parameter (in the case of node, python and pitono). For webtests, this should be passed as a query parameter. As each test completes, it should transmit its results back to the server via websockets (this is to accommodate web tests which cannot write to fs directly).

## Publishing

Each package has a `publish.sh` script that handles building and publishing to its respective package registry. Make sure the scripts are executable:

```bash
chmod +x */publish.sh
```

The scripts follow a consistent pattern:
1. Error handling with `set -e`
2. Change to the script's directory
3. Show current version
4. Prompt for new version
5. Update version in relevant files
6. Build the package
7. Ask for confirmation before publishing
8. Publish if confirmed

### Version Management
- **tiposkripto**: Uses `npm version` to update `package.json`
- **pitono**: Updates both `pyproject.toml` and `setup.py`
- **rubeno**: Uses `publish.rb` which updates `rubeno.gemspec`
- **rusto**: Updates `Cargo.toml`
- **kafe**: Updates `pom.xml`
- **golingvu**: Uses git tags for versioning

Note: Some scripts may have publishing commands commented out for safety. Uncomment them when ready to publish.
