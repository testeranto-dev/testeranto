---
status: doing
----

We allow the used to define custom "views" which provide insight into the graph via a react component. We also provide as a courtesy views, but these need to retain the capacity to be entirely user-defined. Each view is actually a 2 things: a slice function that trims the graph into the right shape, and path to a react component. This component should inherit from the parent view, which is responsible for fetching the sliced json file. 

Each view will be hosted and is thus availble in browser and vscode. the exension has as ections dedicated to views. 

NOTE: it is important that take care about how files are structured. Slicer functions and their associated type need to be separate from the react view. This will ensure that we do not bundle test component into production code. Put the slicer function and type in their own file, and import that into the test code as well as the config code
  