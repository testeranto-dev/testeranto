We want to generate a static html page with react app. It needs to be able to fetch filesfrom the locall http server, as well as work on github fetching files from the github repo.

This work needs to be made right. We should be providing a static html file that loads our react app. You can see the html app in vscode, or on github pages, where it fetches files from GH.

One more wrinkle- we the user to be able to cusotmize this html report. The user needs to be able to customize their main configs with a custom react component.

We populate a tsx file in the testeranto reports folder that the user can modify, along wity an html to run it.

Bugs

ATM we make a documenation.json file to gather up all documents.

```ts
{
  "files": [
    "lib/python3.14/site-packages/pip-25.3.dist-info/licenses/src/pip/_vendor/idna/LICENSE.md",
    "lib/python3.14/site-packages/pip/_vendor/idna/LICENSE.md",
    "README.md",
    "src/java/README.md",
    "src/rust/README.md"
  ],
  "timestamp": 1773701120945
}
```

ATM the stakeholder report presupposes a data.json file, presumbably to store the test results, which is the other main data component of this app. In both cases, this is a shim. The project config ts file is readily available and we can load it in the browser. From that, all the test.json files can be found. From those test.json file, the features can be inferred. Don't forget to include globDocumentation as well. This means that even on github, we need to do a multi-file lookup, so we good support for this.

All if this data needs to be synthesized into a single data structure that we can link test results to features. A stack holder needs to be able to lookup features from test results and vice-versa.

This is going to be complex so lets plan it out
