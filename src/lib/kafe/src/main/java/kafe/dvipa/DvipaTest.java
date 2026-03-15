package kafe.dvipa;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark a test suite in the Dvipa flavored API.
 * This annotation can be placed on a class to indicate it contains
 * BDD-style tests.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface DvipaTest {
    /**
     * The name of the test suite.
     * If not specified, the class name will be used.
     */
    String value() default "";
    
    /**
     * Description of the test suite.
     */
    String description() default "";
}
