We have a roughed out stakeholder app but we need to address somethings

1) confirm the mechanism by which we supply the app with data. We might have multiple implementations, we need to choose one.

2) The server should precompute this data into a graph format (graph as in graph theory)

3) Our first goal will be to arrange files such that we can recreate the original file tree on the frontend. 

4) Use the grapheovidajo library to visualize this tree.

## Long term Goals

- Use the same data to power the other grapheovidajo components
- Establish "flavors" of edges between nodes. The first flavor is "file-structure

## status

we have the stakeholderApp working again and we need to convert from our homemade graph implementation to the npm package graphology.

