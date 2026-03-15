package kafe.dvipa;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark a method as a Given step in the Dvipa flavored API.
 * Given methods set up the initial state for a test.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Given {
    /**
     * The name of the Given step.
     * If not specified, the method name will be used.
     */
    String value() default "";
    
    /**
     * Description of the Given step.
     */
    String description() default "";
}
