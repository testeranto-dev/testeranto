import type { Ibdd_in, ITestAdapter } from "../../../lib/tiposkripto/src/CoreTypes";
import { AiderProcessTreeDataProviderCore } from "./AiderProcessTreeDataProviderCore";

export type I = Ibdd_in<
  null, // iinput
  AiderProcessTreeDataProviderCore, // isubject
  any, // istore
  any, // iselection
  () => any, // given
  (context: any) => any, // when
  (result: any) => any // then
>;

export const AiderProcessTreeDataProviderTestAdapter: ITestAdapter<I> = {
  prepareEach: async (subject, initializer) => {
    return initializer();
  },
  execute: async function (store, whenCB, testResource, artifactory) {
    return whenCB(store);
  },
  verify: async (store, thenCB, testResource, artifactory) => {
    return thenCB(store);
  },
  prepareAll: async (input, testResource, artifactory) => {
    return new AiderProcessTreeDataProviderCore();
  },
  cleanupEach: async (store, key, artifactory) => {
    return store;
  },
  cleanupAll: async (store, artifactory) => {
    return undefined;
  },
  assert: (x) => x,
};
