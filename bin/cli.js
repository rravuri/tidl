#!/usr/bin/env node

;
(function() { // wrapper in case we're in module_context mode
    var tidl = require('../lib/tidl');
    var program = require('commander');
    var pack = require('../package.json');
    var fs = require('fs');
    var path = require('path');
    var util = require('util');
    var Bliss = require('bliss');
    var jsonPath = require('JSONPath');
    var glob = require('glob');
    var minimatch = require('minimatch');
    var fromjs=require('fromjs');

	var urlpattern = /^(http\:\/\/|https\:\/\/).*/i;
	
	function isUrl(path) {
		return urlpattern.test(path);
	}

	function filenameFromUrl(url){
		
	}

    process.title = 'tidl';

    program
        .version(pack.version)
        .option('-v, --verbose', 'use verbose logging')
        .option('-i, --include <type>', 'include additional overlay file in the same path [none, all, rest]', 'all')
        .option('-F, --force', 'force overwrite existing files in output directory')
        .option('-a, --append', 'append to existing files in output directory')
        .option('-o, --outputdir <dir>', 'output directory default:output', 'output');

    function parse(filename, options) {
        var fullfilename = path.normalize(filename);
        if (!fs.existsSync(fullfilename)) {
            console.error(fullfilename + ' file does not exist.');
            return null;
        }

        if (program.verbose) {
            console.log('parsing ' + fullfilename);
        }

        var idltxt = fs.readFileSync(fullfilename, {
            encoding: 'utf8'
        });

        var restIdltxt = null;

        if (program.include.toLowerCase() == 'all' ||
            program.include.toLowerCase() == 'rest') {
            if (fs.existsSync(fullfilename + '.rest')) {
                if (program.verbose) {
                    console.log('parsing ' + fullfilename + '.rest');
                }
                restIdltxt = fs.readFileSync(fullfilename + '.rest', {
                    encoding: 'utf8'
                });
            } else if (program.verbose) {
                console.log(fullfilename + '.rest - overlay file not found.');
            }
        }

        var results = tidl.parseWithAnnotations(idltxt, restIdltxt);

        results.forEach(function(output) {
            if (output !== null)
                output.messages.forEach(function(msg, msgindex, messages) {
                    console.log(fullfilename + '(' + msg.line + ',' + msg.col + ') : ' + msg.type + ' ' + msg.code + ':' + tidl.Messages[msg.code]);
                });
        });

        return results;
    }

    function generateFile(options, dname, afname, tfile, model, fmodel) {
        var gfilename = path.join(dname, afname);
        if (!fs.existsSync(dname)) {
            if (program.verbose) {
                console.log('creating directory ' + dname);
                fs.mkdirSync(dname);
            }
        }
        if (fs.existsSync(gfilename) && !(program.append)) {
            if (!program.force) {
                console.error(gfilename + ' exists. use -F to force overwrite');
                process.exit(-3);
            } else {
                if (program.verbose) {
                    console.log('backing up ' + gfilename + ' to ' + gfilename + '.bak');
                }
                fs.writeFileSync(gfilename.toLowerCase() + '.bak', fs.readFileSync(gfilename, {
                    encoding: 'utf8'
                }));
            }
        }

        var template = fs.readFileSync(tfile, {
            encoding: 'utf8'
        });
        bliss = new Bliss({
            context: {
                fromjs: fromjs
            }
        });
        var tpl = bliss.compile(template);

        if (program.verbose) {
            console.log('generating ' + gfilename.toLowerCase());
        }
        var generatedText = tpl(model, fmodel);
        generatedText = generatedText.replace(/(\s)*(\r\n?|\n)((\s)*(\r\n?|\n))+/g, '\n');
        if (program.append) {
            fs.appendFileSync(gfilename.toLowerCase(), generatedText, {
                encoding: 'utf8'
            });
        } else {
            fs.writeFileSync(gfilename.toLowerCase(), generatedText, {
                encoding: 'utf8'
            });
        }
    }

    program
        .command('parse [idlfilepath]')
        .description('parse the specified tidl file.')
        .option('-f, --format <type>', 'Output format [json]', 'json')
        .option('-e, --outputexp <type>', 'Output JSON Path expression default: $.model', '$.model')
        .action(function(idlfilepath, options) {
            if (program.verbose) {
                console.log('tidl %s', pack.version);
                console.log('input file(s):\t %s', idlfilepath);
                console.log('output expression:\t%s', options.outputexp);
                console.log('output format:\t %s\n', options.format);
            }
            if (!idlfilepath) {
                console.error('Error: idl file needs to be specified.');
                program.help();
                process.exit(-1);
            }

			function parseFile(filename, options) {
            	var files = [];
            	//files=filename.split(',');
            	files = glob.sync(filename, {});

	            files.forEach(function(val, index, array) {
                	var results = parse(val, options);
                	if (options.format.toLowerCase() == 'json' && results && results[0]) {
                    	console.log(JSON.stringify(jsonPath.eval(results[0], options.outputexp), null, '\t'));
                	}
            	});
            	process.exit(0);
			}

			if (!isUrl(idlfilepath)) return parseFile(idlfilepath, options);

			var tfilename=path.join(require('os').tmpdir(),'download.idl');

			request(idlfilepath).pipe(fs.createWriteStream(tfilename))
				.on('close', function() {
					if (fs.existsSync(tfilename+'.rest')) {
						fs.unlinkSync(tfilename+'.rest');
					}
					parseFile(tfilename, options);
				});
        });


    program
        .command('generate [idlfilepath] [template]')
        .description('generate from the specified template.')
        .option('-t, --templatetype <type>', 'template type [bliss]', 'bliss')
        .option('-x, --exclude <pattern>', 'exclude the template files that match the pattern')
        .action(function(idlfilepath, template, options){
            if (program.verbose) {
                console.log('tidl %s', pack.version);
                console.log('input file(s):\t %s', idlfilepath);
                console.log('output directory:\t %s', program.outputdir);
                console.log('template directory/file:\t %s', template);
                console.log('exclude template pattern:\t %s', options.exclude);
                console.log('template type:\t %s\n', options.templatetype);
            }

			if (isUrl(idlfilepath)) {
				var tfilename=path.join(require('os').tmpdir(),'download.idl');
				request(idlfilepath)
					.pipe(fs.createWriteStream(tfilename))
					.on('close', function() {
						if (fs.existsSync(tfilename+'.rest')) {
							fs.unlinkSync(tfilename+'.rest');
						}
						handlegenerate(tfilename, template, options);
					});
				return;
			}
			
			handlegenerate(idlfilepath, template, options);
		});
			
	function handlegenerate (filename, template, options) {
            if (!filename) {
                console.error('Error: idl file/url needs to be specified.');
                program.help();
                process.exit(-1);
            }
            if (!template) {
                console.error('Error: template directory/file/url needs to be specified.');
                program.help();
                process.exit(-1);
            }
            var fulltemplatefilename;
			 
			if ( isUrl(template) &&
				template.toLowerCase().substr(template.length-4, 4)=='.zip') {
    			var request=require('request');
				var unzip=require('unzip');
				var fstream=require('fstream');
				var tdir=require('os').tmpdir();
                console.error('extracting '+template+' to ' + tdir);
                var firstentry=true;
				var writer=fstream.Writer(tdir);

				// HTTP GET Request
				request(template)
   		 			// Write File
    				.pipe(unzip.Parse()).on('entry', function (entry) {
    					//var size = entry.size;
    					if (firstentry) {
							if (entry.type=='Directory') {
								fulltemplatefilename=path.join(tdir, entry.path);
							}
						}
						console.log('\t' + entry.type + ' : ' + entry.path);
    					entry.autodrain();
  					})
					.pipe(writer)
					.on('close', function(){
						console.log('finished extracting.');
						processtemplate(fulltemplatefilename, filename, options);
					});
			}
			else {
				fulltemplatefilename = path.normalize(template);
				processtemplate(fulltemplatefilename, filename, options);
			}

        }

		function processtemplate(fulltemplatefilename, filename, options) {
			
            if (!fs.existsSync(fulltemplatefilename)) {
                console.error(fulltemplatefilename + ' dir/file does not exist.');
                process.exit(-2);
            }

            var outputdir = path.normalize(program.outputdir);
            if (!fs.existsSync(outputdir)) {
                if (program.verbose) {
                    console.log('creating directory ' + outputdir);
                    fs.mkdirSync(outputdir);
                }
            }

            var files = glob.sync(filename, {}); 
            var ignorefile = path.join(fulltemplatefilename, '.tidlignore');
            if (fs.statSync(fulltemplatefilename).isDirectory()) {
                if (fs.existsSync(ignorefile)) {
                    var igf=fs.readFileSync(ignorefile).toString().replace(/\r\n/g,';');
                    options.exclude=options.exclude? (options.exclude+';'+igf) : igf;
                }
            }

            if (program.verbose) {
                console.log('Ignore patten: '+options.exclude);
            }

            files.forEach(function(val, index, array) {

                function generate(tfile) {

                    if (options.exclude !== undefined) {
                        if ( fromjs(options.exclude.split(';'))
                            .any(function(pattern){ 
                                return minimatch(tfile, pattern, { matchBase: true });
                            }) ) {
                            if (program.verbose) {
                                console.log('excluding template file: ' + tfile);
                            }
                            return;
                        }
                    }
                    var stat = fs.statSync(tfile);
                    if (stat.isDirectory()) {
                        var tfiles = fs.readdirSync(tfile);
                        tfiles.forEach(function(file) {
                            generate(path.join(tfile, file));
                        });
                        return;
                    } else {
                        var fname = path.basename(tfile);
                        if (fname=='.tidlignore') return;
                        var dname = path.dirname(tfile);
                        dname = path.join(outputdir, dname.substr(fulltemplatefilename.length));

                        var idx1 = fname.indexOf('$');
                        if (idx1 != -1) {
                            var idx = fname.lastIndexOf('$');
                            var jpath = fname.substr(idx1, idx).replace(/_/g, '*');
                            var items = jsonPath.eval(results[0].model, jpath);
                            if (util.isArray(items)) {
                                if (program.verbose) {
                                    console.log('\nGenerating ' + items.length + ' file(s) for : ' + fname);
                                }
                                items.forEach(function(item) {
                                    generateFile(options, dname, fname.substr(0, idx1) + (item.Name || item) + fname.substr(idx + 1), tfile, results[0].model, item);
                                });
                            } else {
                                if (program.verbose) {
                                    console.log('\nGenerating 1 file for : ' + fname);
                                }
                                generateFile(options, dname, fname.substr(0, idx1) + (items.Name || items) + fname.substr(idx + 1), tfile, results[0].model, items);
                            }
                            return;
                        } else {
                            if (program.verbose) {
                                console.log('');
                            }
                            generateFile(options, dname, fname, tfile, results[0].model, results[0].model);
                        }

                    }
                }


                var results = parse(val, options);

                if (results && results[0]) {
                    generate(fulltemplatefilename);
                }
            });

            process.exit(0);
        }

    program.parse(process.argv);

   if (!program.args.length) program.help();

   //if (program.args[0]!='generate' || program.args[0]!=='parse') program.help();

})();
