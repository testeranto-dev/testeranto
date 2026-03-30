export * from './Decorators';
export * from './FluentBuilder';
import { given, flavored } from './FluentBuilder';
import { suite, given as givenDecorator, when, then, runSuite } from './Decorators';
export { given, flavored, suite, givenDecorator, when, then, runSuite };
declare const _default: {
    given: typeof given;
    flavored: {
        given: typeof given;
    };
    suite: typeof suite;
    givenDecorator: typeof givenDecorator;
    when: typeof when;
    then: typeof then;
    runSuite: typeof runSuite;
};
export default _default;
