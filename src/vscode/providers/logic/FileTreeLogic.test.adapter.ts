import type { Ibdd_in, ITestAdapter } from "../../../lib/tiposkripto/src/CoreTypes";
import { FileTreeLogic } from "./FileTreeLogic";

export type I = Ibdd_in<
  null, // iinput
  FileTreeLogic, // isubject
  any, // istore
  any, // iselection
  () => any, // given
  (context: any) => any, // when
  (result: any) => any // then
>;

export const FileTreeLogicTestAdapter: ITestAdapter<I> = {
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
    return new FileTreeLogic();
  },
  cleanupEach: async (store, key, artifactory) => {
    return store;
  },
  cleanupAll: async (store, artifactory) => {
    return undefined;
  },
  assert: (x) => x,
};
