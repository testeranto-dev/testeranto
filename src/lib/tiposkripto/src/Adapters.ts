import { ITestResourceConfiguration } from "./types";
import {
  TestTypeParams_any,
  IUniversalTestAdapter,
  IArtifactory,
  ITestAdapter,
} from "./CoreTypes";

export const BaseAdapter = <
  T extends TestTypeParams_any,
>(): IUniversalTestAdapter<T> => ({
  prepareAll: async (
    input: T["iinput"],
    testResource: ITestResourceConfiguration,
    artifactory?: IArtifactory,
  ) => {
    return input as unknown as T["isubject"];
  },
  prepareEach: async function (
    subject: T["isubject"],
    initializer: (c?: any) => T["given"],
    testResource: ITestResourceConfiguration,
    initialValues: any,
    artifactory?: IArtifactory,
  ): Promise<T["istore"]> {
    return subject as unknown as T["istore"];
  },
  cleanupEach: async (
    store: T["istore"],
    key: string,
    artifactory?: IArtifactory,
  ) => Promise.resolve(store),
  cleanupAll: (store: T["istore"], artifactory: IArtifactory) => undefined,
  verify: async (
    store: T["istore"],
    checkCb: T["then"],
    testResource: ITestResourceConfiguration,
    artifactory?: IArtifactory,
  ) => {
    return (checkCb as any)(store);
  },
  execute: async (
    store: T["istore"],
    actionCB: T["when"],
    testResource: ITestResourceConfiguration,
    artifactory?: IArtifactory,
  ) => {
    return (actionCB as any)(store);
  },
  assert: (x: T["then"]) => x,
});

export const DefaultAdapter = <T extends TestTypeParams_any>(
  p: Partial<ITestAdapter<T>>,
): IUniversalTestAdapter<T> => {
  const base = BaseAdapter<T>();

  // Create adapter with new method names
  // ITestAdapter is now IUniversalTestAdapter, so we can use the methods directly
  const adapter: IUniversalTestAdapter<T> = {
    prepareAll: p.prepareAll || base.prepareAll,
    prepareEach: p.prepareEach || base.prepareEach,
    execute: p.execute || base.execute,
    verify: p.verify || base.verify,
    cleanupEach: p.cleanupEach || base.cleanupEach,
    cleanupAll: p.cleanupAll || base.cleanupAll,
    assert: p.assert || base.assert,
  };

  return adapter;
};
