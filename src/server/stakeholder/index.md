This folder contains server-side stakeholder functionality including markdown processing and graph update handling.

## Key Components

### Markdown Processing
- `markdown.ts` - Utilities for reading/writing markdown files with YAML frontmatter
- Handles bidirectional synchronization between graph nodes and markdown files

### Graph Update Handlers
- `graph.ts` - Handles stakeholder-specific graph updates
- Processes node attribute changes and updates corresponding markdown files

### Utilities
- `utils.ts` - Stakeholder-specific utility functions
- `handlers.ts` - HTTP request handlers for stakeholder API endpoints

## Integration

The stakeholder server components work with the `GraphManager` to provide:
1. Real-time graph updates via WebSocket
2. Markdown file synchronization
3. Feature status tracking
