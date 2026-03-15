package kafe.dvipa;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark a method as a Then step in the Dvipa flavored API.
 * Then methods make assertions about the test subject.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Then {
    /**
     * The name of the Then step.
     * If not specified, the method name will be used.
     */
    String value() default "";
    
    /**
     * Description of the Then step.
     */
    String description() default "";
}
