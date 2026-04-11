# views

views allow a user to define a series of react components associated with slices of graph data. Testeranto provides some basic defaults (kanban, gantt, etc) Currently, we have a confusing mix of "vscodeviews" and "Stakeholder views". We are collapsing both itn just "views". stakeholder used static data, while vscode views used the api. We will combine elements of both in "views".

Each view is a react component associated with a slice of data. Our strategy will be: 

1) for every view, we will compile the react component along with an html file. 
2) This react component will watch a json file as it's data store.
3) This react component will have the capacity to send updates to the server, but is obliged to gracefully fallback when in static read-only mode. 
4) The server will update these slices of data, saving the changes to the graph and re-writing the slice json files.
5) The react app is triggered to change it's state, given the changed file
6) The react app also works in static mode, reading the same file but not sending update to the server api.
7) remove the stakeholderApp folder
8) consolidate the api definitions
9) vscode views section contains list of views. clicking on item opens the page in chrome in vscode
