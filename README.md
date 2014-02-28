tidl
====

Utilities for working with tidl files.

Code Status
-----------

[![Build Status](https://travis-ci.org/rravuri/tidl.png?branch=master)](https://travis-ci.org/rravuri/tidl)

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


License
-------
Copyright (c) 2013-2015. See the LICENSE file for license rights and limitations (MIT).
