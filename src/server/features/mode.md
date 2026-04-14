the server has a 2 modes- once and dev. Dev runs continuously, once runs only once.

the server has several states- running and shutdown. Running is normal operation. If the mode is dev, pressing q will initiate the gracefull shutdown. in once mode, this happens immediately, such that everything just runs once, then stops. Pressing ctrl-c kills the  process. 