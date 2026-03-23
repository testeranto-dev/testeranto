The artifactory system provides a consistent way for tests to write logging artifacts across all runtimes.

Each runtime implementation has a `writeFileSync` function in common.
The web runtime also includes a `screenshot` function for browser automation.

The artifactory is passed as the last argument to every step in an adapter:

```ts
export const BaseAdapter = <
  T extends TestTypeParams_any,
>(): IUniversalTestAdapter<T> => ({
  ...
  cleanupAll: (store: T["istore"], artifactory: IArtifactory) => undefined,
  ...
  // all the other operations use artifactory for the last param as well
});
```

While other runtimes have direct filesystem access, the web runtime communicates through exposed browser functions. The artifactory system ensures:

1) A consistent interface for saving test artifacts
2) Artifacts are organized according to test structure
3) Automatic path generation based on test context

If `writeFileSync` is called by a Given with argument "hello" in the web runtime, the path will be:
`testeranto > reports > WEB_CONFIG_KEY > PATH_TO_TEST_ENTRYPOINT > Given.GIVEN_NAME > hello.txt`

If `writeFileSync` is called by a When with argument "aloha" in the web runtime, the path will be:
`testeranto > reports > WEB_CONFIG_KEY > PATH_TO_TEST_ENTRYPOINT > Given.GIVEN_NAME > When.WHEN_INDEX aloha.txt`

If `screenshot` is called by a Then with argument "hola" in the web runtime, the path will be:
`testeranto > reports > WEB_CONFIG_KEY > PATH_TO_TEST_ENTRYPOINT > Given.GIVEN_NAME > Then.THEN_INDEX hola.txt`
````
