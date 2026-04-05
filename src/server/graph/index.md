This folder contains the server-side implementation of the graph data store.

## GraphManager

The `GraphManager` class is the central component that:
1. Manages the graphology graph instance
2. Handles graph operations (add/update/remove nodes and edges)
3. Synchronizes with `graph-data.json` file
4. Processes test results into graph nodes
5. Manages markdown file serialization

## Key Features

### Test Result Processing
- Converts test results into graph nodes (features, tests, entrypoints)
- Creates relationships between tests and their features
- Handles BDD/AAA/TDT test patterns

### Markdown Integration
- Parses markdown files with YAML frontmatter into graph nodes
- Serializes graph changes back to markdown files
- Maintains bidirectional synchronization

### File System Integration
- Creates folder nodes for directory structures
- Handles both local file paths and URLs
- Manages input file relationships

## Pure Functions

The folder contains many pure utility functions (suffixed with `Pure`) that:
- Perform specific graph operations without side effects
- Can be tested independently
- Follow functional programming principles
