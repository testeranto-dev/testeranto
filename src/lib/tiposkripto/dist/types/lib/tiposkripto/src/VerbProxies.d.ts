import { Ibdd_in_any } from "./CoreTypes";
export declare class VerbProxies<I extends Ibdd_in_any> {
    private givenOverrides;
    private whenOverrides;
    private thenOverrides;
    private describesOverrides;
    private itsOverrides;
    private confirmsOverrides;
    private valuesOverrides;
    private shouldsOverrides;
    private expectedsOverrides;
    constructor(givenOverrides: Record<string, any>, whenOverrides: Record<string, any>, thenOverrides: Record<string, any>, describesOverrides: Record<string, any>, itsOverrides: Record<string, any>, confirmsOverrides: Record<string, any>, valuesOverrides: Record<string, any>, shouldsOverrides: Record<string, any>, expectedsOverrides: Record<string, any>);
    Given(): Record<string, any>;
    private createMissingGivenHandler;
    private createVerbProxy;
    When(): Record<string, any>;
    Then(): Record<string, any>;
    Describe(): Record<string, any>;
    It(): Record<string, any>;
    Confirm(): Record<string, any>;
    Value(): Record<string, any>;
    Should(): Record<string, any>;
    Expect(): Record<string, any>;
    Expected(): Record<string, any>;
}
