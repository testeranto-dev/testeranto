Server manages Docker containers and test execution.

Responsibilities:
1. Build orchestration
2. Container management (BDD, checks, aider)
3. Dependency tracking
4. Resource optimization

Container types:
- Test services (BDD, static checks, aider)
- Special services (Chrome for web)
- Builder services


# serverClasses

The server is formed as a "tower" of inheritance, each class adding a concern. The server is the stateful business logic which delegates to utility functions. 