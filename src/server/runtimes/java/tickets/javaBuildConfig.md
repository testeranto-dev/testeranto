---
status: in progress
title: javaBuildConfig
description: ''
priority: medium
---

The java runtime has a bug which makes in incongruent with the other runtimes. It was trying to import a config file as a json file, but the actual config file is a java file. 

ex: [java.java](../../../../../../testeranto-example-project/testeranto/runtimes/java/java.java)

In this file, we should put user defined configs for the java build system.