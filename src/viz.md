we use the grafeovidajo library to viusalize data which we present to the user through the[stakeholder app](src/serverClasses/index.tsx) the grafeovidajo library works by mapping graph data to a 2 screen.

Our index.html comes loaded with this graph data and grafeovidajo handles it from there.

## graph

there is a parent/child relation to create the file structure
each feature is a node
many features are markdown files, rather than plain strings. these need to be paresd to retreaive their yaml frontmatter data.
this frontmatter is used to, among other things, link it to other features.
yml front matter will have things like:

```md
---
status: todo
points: 5
dependsUpon: ./someOtherFeature.md
---

# hello this is a markdown doc
```

This graph is precomputed and embedded in the html. The front end presents it. WE can still use fetch command, so we do not necessarily need to embed the file contents int the graph, only theirilfenames.

## grafeovidajo

the grafeovidajo library works by mapping graph data to 2d plain. We need to achieve the falling charts

- esenhow matric
- gantt
- kanban
- tree
- flowchat
- etc
