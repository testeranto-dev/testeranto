public class WrapperGenerator {
    public static String generateNativeTestWrapper(String wrapperClassName, String fullyQualifiedClassName, String frameworkType) {
        return "public class " + wrapperClassName + " {\n" +
               "    public static void main(String[] args) throws Exception {\n" +
               "        System.out.println(\"Running native " + frameworkType + " test: " + fullyQualifiedClassName + "\");\n" +
               "        \n" +
               "        Class<?> testClass = Class.forName(\"" + fullyQualifiedClassName + "\");\n" +
               "        \n" +
               "        try {\n" +
               "            java.lang.reflect.Method mainMethod = testClass.getMethod(\"main\", String[].class);\n" +
               "            mainMethod.invoke(null, (Object) args);\n" +
               "        } catch (NoSuchMethodException e) {\n" +
               "            System.out.println(\"Test class loaded: \" + testClass.getName());\n" +
               "            System.out.println(\"Framework: " + frameworkType + "\");\n" +
               "            System.out.println(\"This is a native test that needs a proper test runner.\");\n" +
               "            \n" +
               "            if (\"" + frameworkType + "\".startsWith(\"junit\")) {\n" +
               "                System.out.println(\"To run JUnit tests, use: java -cp .:junit.jar org.junit.runner.JUnitCore \" + testClass.getName());\n" +
               "            }\n" +
               "        }\n" +
               "    }\n" +
               "}\n";
    }
    
    public static String generateTesterantoWrapper(String wrapperClassName, String fullyQualifiedClassName) {
        String escapedClassName = fullyQualifiedClassName.replace("\\", "\\\\").replace("\"", "\\\"");
        
        return "public class " + wrapperClassName + " {\n" +
               "    public static void main(String[] args) {\n" +
               "        try {\n" +
               "            Class<?> clazz = Class.forName(\"" + escapedClassName + "\");\n" +
               "            java.lang.reflect.Method mainMethod = clazz.getMethod(\"main\", String[].class);\n" +
               "            mainMethod.invoke(null, new Object[]{args});\n" +
               "        } catch (NoSuchMethodException e) {\n" +
               "            System.out.println(\"Class \" + \"" + escapedClassName + "\" + \" doesn't have a main method\");\n" +
               "        } catch (Exception e) {\n" +
               "            System.out.println(\"Error: \" + e.getMessage());\n" +
               "            e.printStackTrace();\n" +
               "        }\n" +
               "    }\n" +
               "}\n";
    }
}
