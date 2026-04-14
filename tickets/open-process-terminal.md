we have a url for attaching to a running docker process called "openProcessTerminal". 

We should be able to curl that endpoint to get a shell command, and then be able to run it in the terminal 

"stty sane && printf '\\e[?2004l' && printf '\\e[?1l' && stty cooked && docker exec -it 776823ea1f00ebe2c59d614c1c080a25e532f394b6625ef9c8a3e7f21c3a2826 /bin/sh" drops into the shell which is wrong. it should connect to aider