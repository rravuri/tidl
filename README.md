tidl
====

Utilities for working with tidl files.

* [Current Status](#current-Status)
* [Usage](#usage)
* [Getting the source](#getting-the-source)
* [License](#license)
* [Contributors](#contributors)

Current Status
--------------

[![Build Status](https://travis-ci.org/rravuri/tidl.png?branch=master)](https://travis-ci.org/rravuri/tidl) [![Coverage Status](https://coveralls.io/repos/rravuri/tidl/badge.png)](https://coveralls.io/r/rravuri/tidl) [![Dependency Status](https://gemnasium.com/rravuri/tidl.png)](https://gemnasium.com/rravuri/tidl) [![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/)

Usage
-----

### Installing the parser
tidl parser can be installed and managed via [npm](https://npmjs.org/), the [Node.js](http://nodejs.org/) package manager.

tidl parser requires stable [Node.js](http://nodejs.org/) versions `>= 0.10.0`. Odd version numbers of [Node.js](http://nodejs.org/) are considered unstable development versions.


in windows ...
```dos
> npm install https://github.com/rravuri/tidl/tarball/master -g
...
...
> tidl.cmd

  Usage: cli.js [options] [command]

  Commands:

  parse [options] [filename] parse the specified tidl file.
  generate [options] [filename] [template] generate from the specified template


Options:

  -h, --help             output usage information
  -V, --version          output the version number
  -v, --verbose          use verbose logging
  -i, --include <type>   include additional overlay file in the same path [none, all, rest]
  -F, --force            force overwrite existing files in output directory
  -a, --append           append to existing files in output directory
  -o, --outputdir <dir>  output directory default:output
>
```

parse a tidl file to output the AST in json

```
> tidl.cmd parse filename.idl

```


in linux ommit the `.cmd` from in the command line...

```dos
$ npm install https://github.com/rravuri/tidl/tarball/master -g
$ tidl parse filename.idl

```

### Uninstalling the parser
tidl parser can be uninstalled and managed via [npm](https://npmjs.org/), the [Node.js](http://nodejs.org/) package manager.
```dos
> npm uninstall tidl -g
unbuild tidl@x.y.z
```

Getting the source
------------------

Make sure you have git installed and then run this command from a terminal window (Linux/Unix) or in a "Git Bash Here" window using msysgit for Windows

`git clone git://github.com/rravuri/tidl.git tidl`

License
-------
Copyright (c) 2013-2015. See the LICENSE file for license rights and limitations (MIT).


Contributors
------------
If you're interested in contributing to tidl, fork it here on github and send me a pull request with your contributions.
