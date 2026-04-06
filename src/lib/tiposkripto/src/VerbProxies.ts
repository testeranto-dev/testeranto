import { BaseGiven, BaseWhen, BaseThen, BaseDescribe, BaseIt, BaseConfirm, BaseValue, BaseShould, BaseExpected } from "./verbs";
import { Ibdd_in_any } from "./CoreTypes";

export class VerbProxies<I extends Ibdd_in_any> {
  constructor(
    private givenOverrides: Record<string, any>,
    private whenOverrides: Record<string, any>,
    private thenOverrides: Record<string, any>,
    private describesOverrides: Record<string, any>,
    private itsOverrides: Record<string, any>,
    private confirmsOverrides: Record<string, any>,
    private valuesOverrides: Record<string, any>,
    private shouldsOverrides: Record<string, any>,
    private expectedsOverrides: Record<string, any>
  ) {}

  Given(): Record<string, any> {
    return this.createVerbProxy('Given', this.givenOverrides, this.createMissingGivenHandler.bind(this));
  }

  private createMissingGivenHandler(prop: string): any {
    return (initialValues: any) => {
      console.error(`Given.${prop} is not defined in test implementation`);
      return (
        whens: any[] = [],
        thens: any[] = [],
        features: string[] = [],
      ) => {
        try {
          return new (class extends BaseGiven<I> {
            async givenThat(
              subject: any,
              testResource: any,
              artifactory: any,
              initializer: any,
              initialValues: any,
            ) {
              throw new Error(`Given.${prop} is not implemented`);
            }
          })(
            features,
            whens,
            thens,
            () => { throw new Error(`Given.${prop} is not implemented`); },
            initialValues,
          );
        } catch (e) {
          console.error(`Error creating Given.${prop}:`, e);
          return {
            features: features,
            whens: whens,
            thens: thens,
            givenCB: () => { throw new Error(`Given.${prop} creation failed: ${e.message}`); },
            initialValues: initialValues,
            give: async () => {
              throw new Error(`Given.${prop} creation failed: ${e.message}`);
            },
            toObj: () => ({
              key: `Given_${prop}_error`,
              error: `Given.${prop} creation failed: ${e.message}`,
              failed: true,
              features: features,
            })
          };
        }
      };
    };
  }

  private createVerbProxy(verbName: string, overrides: Record<string, any>, missingHandler: (prop: string) => any): Record<string, any> {
    const actualOverrides = overrides || {};
    return new Proxy(actualOverrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            return missingHandler(prop);
          }
        }
        return target[prop];
      }
    });
  }

  When(): Record<string, any> {
    const overrides = this.whenOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args: any[]) => {
              console.error(`When.${prop} is not defined in test implementation`);
              try {
                return new (class extends BaseWhen<I> {
                  async andWhen(
                    store: any,
                    whenCB: any,
                    testResource: any,
                    artifactory: any,
                  ) {
                    throw new Error(`When.${prop} is not implemented`);
                  }
                })(`${prop}: ${args && args.toString()}`, () => {
                  throw new Error(`When.${prop} is not implemented`);
                });
              } catch (e) {
                console.error(`Error creating When.${prop}:`, e);
                return {
                  name: `${prop}_error`,
                  test: async () => {
                    throw new Error(`When.${prop} creation failed: ${e.message}`);
                  },
                  toObj: () => ({
                    name: `When_${prop}_error`,
                    error: `When.${prop} creation failed: ${e.message}`,
                    status: false,
                  })
                };
              }
            };
          }
        }
        return target[prop];
      }
    });
  }

  Then(): Record<string, any> {
    const overrides = this.thenOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args: any[]) => {
              console.error(`Then.${prop} is not defined in test implementation`);
              return new (class extends BaseThen<I> {
                async butThen(
                  store: any,
                  thenCB: any,
                  testResourceConfiguration: any,
                  artifactory: any,
                ) {
                  throw new Error(`Then.${prop} is not implemented`);
                }
              })(`${prop}: ${args && args.toString()}`, async () => {
                throw new Error(`Then.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }

  Describe(): Record<string, any> {
    const overrides = this.describesOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            return (initialValues: any) => {
              console.error(`Describe.${prop} is not defined in test implementation`);
              return (its: any[], features: string[]) => {
                return new BaseDescribe<any>(
                  features,
                  its,
                  () => {
                    throw new Error(`Describe.${prop} is not implemented`);
                  },
                  initialValues,
                );
              };
            };
          }
        }
        return target[prop];
      }
    });
  }

  It(): Record<string, any> {
    const overrides = this.itsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args: any[]) => {
              console.error(`It.${prop} is not defined in test implementation`);
              return new (class extends BaseIt<I> {
                constructor(name: string, itCB: any) {
                  super(name, itCB);
                }
              })(`${prop}: ${args && args.toString()}`, () => {
                throw new Error(`It.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }

  Confirm(): Record<string, any> {
    const overrides = this.confirmsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args: any[]) => {
              console.error(`Confirm.${prop} is not defined in test implementation`);
              return (testCases: any[][], features: string[]) => {
                return new (class extends BaseConfirm<I> {
                  constructor(
                    features: string[],
                    testCases: any[][],
                    confirmCB: any,
                    initialValues: any,
                  ) {
                    super(features, testCases, confirmCB, initialValues);
                  }
                })(
                  features,
                  testCases,
                  () => {
                    throw new Error(`Confirm.${prop} is not implemented`);
                  },
                  undefined,
                );
              };
            };
          }
        }
        return target[prop];
      }
    });
  }

  Value(): Record<string, any> {
    const overrides = this.valuesOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args: any[]) => {
              console.error(`Value.${prop} is not defined in test implementation`);
              return (features: string[], tableRows: any[][], confirmCB: any, initialValues: any) => {
                return new (class extends BaseValue<I> {
                  constructor(
                    features: string[],
                    tableRows: any[][],
                    confirmCB: any,
                    initialValues: any,
                  ) {
                    super(features, tableRows, confirmCB, initialValues);
                  }
                })(
                  features,
                  tableRows,
                  () => {
                    throw new Error(`Value.${prop} is not implemented`);
                  },
                  initialValues,
                );
              };
            };
          }
        }
        return target[prop];
      }
    });
  }

  Should(): Record<string, any> {
    const overrides = this.shouldsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args: any[]) => {
              console.error(`Should.${prop} is not defined in test implementation`);
              return new (class extends BaseShould<I> {
                constructor(name: string, shouldCB: any) {
                  super(name, shouldCB);
                }
              })(`${prop}: ${args && args.toString()}`, () => {
                throw new Error(`Should.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }

  Expect(): Record<string, any> {
    const overrides = this.expectedsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args: any[]) => {
              console.error(`Expect.${prop} is not defined in test implementation`);
              return new (class extends BaseExpected<I> {
                constructor(name: string, expectedCB: any) {
                  super(name, expectedCB);
                }
                async validateRow(
                  store: any,
                  testResourceConfiguration: any,
                  filepath: string,
                  expectedValue: any,
                  artifactory?: any,
                ) {
                  throw new Error(`Expect.${prop} is not implemented`);
                }
              })(`${prop}: ${args && args.toString()}`, async () => {
                throw new Error(`Expect.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }

  Expected(): Record<string, any> {
    const overrides = this.expectedsOverrides || {};
    return new Proxy(overrides, {
      get(target, prop) {
        if (typeof prop === 'string') {
          if (prop in target) {
            return target[prop];
          } else {
            return (...args: any[]) => {
              console.error(`Expected.${prop} is not defined in test implementation`);
              return new (class extends BaseExpected<I> {
                constructor(name: string, expectedCB: any) {
                  super(name, expectedCB);
                }
                async validateRow(
                  store: any,
                  testResourceConfiguration: any,
                  filepath: string,
                  expectedValue: any,
                  artifactory?: any,
                ) {
                  throw new Error(`Expected.${prop} is not implemented`);
                }
              })(`${prop}: ${args && args.toString()}`, async () => {
                throw new Error(`Expected.${prop} is not implemented`);
              });
            };
          }
        }
        return target[prop];
      }
    });
  }
}
