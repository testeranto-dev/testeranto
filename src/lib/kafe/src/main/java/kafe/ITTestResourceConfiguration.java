package kafe;

import java.util.List;
import java.util.Map;

// Test resource configuration
public class ITTestResourceConfiguration {
    public String name;
    public String fs;
    public List<Integer> ports;
    public String browserWsEndpoint;
    public Integer timeout;
    public Integer retries;
    public Map<String, String> environment;
    
    public ITTestResourceConfiguration(
        String name,
        String fs,
        List<Integer> ports,
        String browserWsEndpoint,
        Integer timeout,
        Integer retries,
        Map<String, String> environment
    ) {
        this.name = name;
        this.fs = fs;
        this.ports = ports;
        this.browserWsEndpoint = browserWsEndpoint;
        this.timeout = timeout;
        this.retries = retries;
        this.environment = environment;
    }
}
