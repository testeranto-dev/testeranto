---
status: defunct
title: featureReporter
description: ''
priority: medium
---

We need to gather up features attached to tests and reveal them to the user. We tag our tests with "features" which are strings. These get passed into the final tests.json files. We need a way of rolling these features up and reavel them to the user via the vs code extension.

A feature can be a plain string (ex: "the button should be read") but it can also take the form of an internal files (ex: "file:../README.md")

These features need to be presented in a tree resembling the source code tree.
