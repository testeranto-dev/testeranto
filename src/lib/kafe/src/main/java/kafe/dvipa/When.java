package kafe.dvipa;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark a method as a When step in the Dvipa flavored API.
 * When methods perform actions on the test subject.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface When {
    /**
     * The name of the When step.
     * If not specified, the method name will be used.
     */
    String value() default "";
    
    /**
     * Description of the When step.
     */
    String description() default "";
}
