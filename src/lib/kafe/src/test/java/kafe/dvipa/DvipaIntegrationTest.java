package kafe.dvipa;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test to verify Dvipa works correctly.
 */
@DvipaTest("Dvipa Integration Tests")
@ExtendWith(DvipaRunner.class)
public class DvipaIntegrationTest {
    
    private String testSubject;
    
    @Given("a test subject")
    public void givenTestSubject() {
        testSubject = "initial";
    }
    
    @When("modifying the subject")
    public void whenModifyingSubject() {
        testSubject = "modified";
    }
    
    @Then("subject should be modified")
    public void thenSubjectShouldBeModified() {
        assertEquals("modified", testSubject);
    }
    
    @Test
    public void testBasicBDDFlow() {
        whenModifyingSubject();
        thenSubjectShouldBeModified();
    }
    
    @Test
    public void testSubjectInitialization() {
        // The @Given method should have been called by DvipaRunner
        // So testSubject should be "initial"
        assertEquals("initial", testSubject);
        whenModifyingSubject();
        thenSubjectShouldBeModified();
    }
}
