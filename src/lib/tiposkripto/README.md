# tiposkripto

## the typescript implementation of testeranto

## Supported Patterns

1. **BDD (Behavior Driven Development)**: Given, When, Then (3 verbs) - fully implemented and production-ready
2. **TDT (Table-Driven Testing)**: Value, Should, Expected (3 verbs) - core classes implemented, integration in progress
3. **Describe-It Pattern (AAA/Arrange-Act-Assert)**: Describe, It (2 verbs) - core classes implemented, integration in progress

## Status

- BDD pattern is fully functional and production-ready (uses 3 verbs: Given, When, Then)
- TDT pattern has core classes (BaseValue, BaseShould, BaseExpected) and specification helpers (createTDTSpecification, Confirm) available (uses 3 verbs)
- Describe-It pattern (AAA) has core classes (BaseDescribe, BaseIt) and specification helpers (createDescribeItSpecification, DescribeIt) available (uses 2 verbs)
- BDD is recommended for production use; TDT and Describe-It patterns are available for experimentation
