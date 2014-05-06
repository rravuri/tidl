tidl
====

Utilities for working with tidl files.

Project Status
--------------

[![Build Status](https://travis-ci.org/rravuri/tidl.png?branch=master)](https://travis-ci.org/rravuri/tidl) [![Coverage Status](https://coveralls.io/repos/rravuri/tidl/badge.png)](https://coveralls.io/r/rravuri/tidl) [![Dependency Status](https://gemnasium.com/rravuri/tidl.png)](https://gemnasium.com/rravuri/tidl) [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

Usage
-----

### Using node
tidl parser can be installed and managed via [npm](https://npmjs.org/), the [Node.js](http://nodejs.org/) package manager.

tidl parser requires stable [Node.js](http://nodejs.org/) versions `>= 0.8.0`. Odd version numbers of [Node.js](http://nodejs.org/) are considered unstable development versions.


in windows ...
```dos
> mkdir tidl
> cd tidl
> npm install https://github.com/rravuri/tidl/tarball/master
> .\node_modules\.bin\tidl.cmd

  Usage: cli.js [options] [command]

  Commands:

    parse [options] [filename] parse the specified tidl file.

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
    -v --verbose   use verbose logging
>
```

parse a tidl file to output the AST in json

```
> .\node_modules\.bin\tidl.cmd parse filename.idl

```


in linux ...

```dos
$ mkdir tidl
$ cd tidl
$ npm install https://github.com/rravuri/tidl/tarball/master
$ .\node_modules\.bin\tidl

  Usage: cli.js [options] [command]

  Commands:

    parse [options] [filename] parse the specified tidl file.

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
    -v --verbose   use verbose logging
$
```
parse a tidl file to output the AST in json

```
$ .\node_modules\.bin\tidl parse filename.idl

```

Getting the source
------------------

Make sure you have git installed and then run this command from a terminal window (Linux/Unix) or in a "Git Bash Here" window using msysgit for Windows

git clone git://github.com/rravuri/tidl.git tidl

License
-------
Copyright (c) 2013-2015. See the LICENSE file for license rights and limitations (MIT).


Contributors
------------
If you're interested in contributing to tidl, fork it here on github and send me a pull request with your contributions.
