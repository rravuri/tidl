#!/usr/bin/env node

;(function(){ // wrapper in case we're in module_context mode
    var tidl = require('../lib/tidl');
    var program = require('commander');
    var pack = require('../package.json');
    var fs=require('fs');
    var path=require('path');
    var util=require('util');
    var Bliss=require('bliss');
    var jsonPath = require('JSONPath'); 
    var glob=require('glob')
    var minimatch=require('minimatch');

    process.title='tidl';

    program
        .version(pack.version)
        .option('-v, --verbose', 'use verbose logging')
        .option('-i, --include <type>','include additional overlay file in the same path [none, all, rest]','all')
        .option('-F, --force','force overwrite existing files in output directory')
        .option('-a, --append','append to existing files in output directory')
        .option('-o, --outputdir <dir>','output directory default:output','output');

    function parse(filename, options) {
        var fullfilename=path.normalize(filename);
        if (!fs.existsSync(fullfilename)){
            console.error(fullfilename + ' file does not exist.');
            return null;
        }
        
        if (program.verbose) {
            console.log('parsing ' + fullfilename);
        }
        
        var idltxt=fs.readFileSync(fullfilename,{encoding:'utf8'});

        var restIdltxt=null;

        if (program.include.toLowerCase()=='all' || 
            program.include.toLowerCase()=='rest'){
            if (fs.existsSync(fullfilename+'.rest')) {
                if (program.verbose) {
                    console.log('parsing '+fullfilename+'.rest');
                }
                restIdltxt=fs.readFileSync(fullfilename+'.rest',{encoding:'utf8'});
            }
            else if (program.verbose){
                console.log(fullfilename+'.rest - overlay file not found.')
            }
        }

        var results=tidl.parseWithAnnotations(idltxt, restIdltxt);

        results.forEach(function(output){
            if (output!==null)
            output.messages.forEach(function(msg, msgindex, messages){
                console.log(fullfilename+'('+msg.line+','+msg.col+') : '+msg.type+' '+msg.code+':'+tidl.Messages[msg.code]);
            });
        });

        return results;
    }

    function generateFile(options, dname, afname, tfile, model,fmodel){
        var gfilename=path.join(dname,afname);
        if (!fs.existsSync(dname)){
            if (program.verbose) {
                console.log('creating directory '+dname);
                fs.mkdirSync(dname);
            }
        }
        if (fs.existsSync(gfilename) && !(program.append)){
            if (!program.force){
                console.error(gfilename+' exists. use -F to force overwrite');
                process.exit(-3);
            }
            else {
                if (program.verbose) {
                    console.log('backing up '+gfilename +' to '+gfilename+'.bak');
                }    
                fs.writeFileSync(gfilename.toLowerCase()+'.bak',fs.readFileSync(gfilename,{encoding:'utf8'}));
            }
        }

        var template=fs.readFileSync(tfile,{encoding:'utf8'});
        bliss = new Bliss();
        var tpl=bliss.compile(template);

        if (program.verbose) {
            console.log('generating '+gfilename.toLowerCase());
        }
        var generatedText=tpl(model,fmodel);
        generatedText=generatedText.replace(/(\s)*(\r\n?|\n)((\s)*(\r\n?|\n))+/g,'\n');
        if (program.append) {
            fs.appendFileSync(gfilename.toLowerCase(),generatedText,{encoding:'utf8'});
        }
        else{
            fs.writeFileSync(gfilename.toLowerCase(),generatedText,{encoding:'utf8'});
        }
    }

    program
        .command('parse [filename]')
        .description('parse the specified tidl file.')
        .option('-f, --format <type>','Output format [json]','json')
        .option('-e, --outputexp <type>','Output JSON Path expression default: $.*','$.*')
        .action(function (filename, options){
            if (program.verbose) {
                console.log('tidl %s',pack.version);
                console.log('input file(s):\t %s',filename);
                console.log('output expression:\t%s',options.outputexp)
                console.log('output format:\t %s\n', options.format);
            }
            if (!filename) {
                console.error('Error: idl file needs to be specified.');
                program.help();
                process.exit(-1);
            }
            var files=[]; 
            //files=filename.split(',');
            files=glob.sync(filename, {});
            
            files.forEach(function(val, index, array){
                var results=parse(val, options);
                if (options.format.toLowerCase()=='json' && results && results[0]){
                    console.log(JSON.stringify(jsonPath.eval(results[0].model,options.outputexp),null,'\t'));
                }
            });
            process.exit(0);
        });
    

    program
        .command('generate [filename] [template]')
        .description('generate from the specified template.')
        .option('-t, --templatetype <type>','template type [bliss]','bliss')
        .option('-x, --exclude <pattern>','exclude the template files that match the pattern')
        .action(function (filename, template, options) {
            if (program.verbose) {
                console.log('tidl %s',pack.version);
                console.log('input file(s):\t %s',filename);
                console.log('output directory:\t %s',program.outputdir);
                console.log('template directory/file:\t %s',template);
                console.log('exclude template pattern:\t %s',options.exclude);
                console.log('template type:\t %s\n', options.templatetype);
            }
            if (!filename) {
                console.error('Error: idl file needs to be specified.');
                program.help();
                process.exit(-1);
            }
            if (!template) {
                console.error('Error: template directory/file needs to be specified.');
                program.help();
                process.exit(-1);
            }
            var fulltemplatefilename=path.normalize(template);
            if (!fs.existsSync(fulltemplatefilename)){
                console.error(fulltemplatefilename+' dir/file does not exist.');
                process.exit(-2);
            }

            var outputdir=path.normalize(program.outputdir);
            if (!fs.existsSync(outputdir)){
                if (program.verbose) {
                    console.log('creating directory '+outputdir);
                    fs.mkdirSync(outputdir);
                }
            }

            var files=glob.sync(filename, {});//filename.split(',');
            files.forEach(function(val, index, array){
                var results=parse(val, options);

                function generate(tfile){
                    var stat=fs.statSync(tfile);
                    if (stat.isDirectory()){
                        var tfiles=fs.readdirSync(tfile);
                        tfiles.forEach(function(file){
                            generate(path.join(tfile,file));
                        });
                        return;
                    }
                    else{
                        if (options.exclude!==undefined){
                            if (minimatch(tfile,options.exclude, {matchBase: true })){
                                if (program.verbose){
                                    console.log('excluding template file: '+ tfile);
                                }
                                return;
                            }
                        }
                        var fname=path.basename(tfile);
                        var dname=path.dirname(tfile);
                        dname=path.join(outputdir, dname.substr(fulltemplatefilename.length));

                        var idx1=fname.indexOf('$');
                        if (idx1!=-1){
                            var idx=fname.lastIndexOf('$');
                            var jpath=fname.substr(idx1,idx).replace(/_/g,'*');
                            var items=jsonPath.eval(results[0].model, jpath);
                            if (util.isArray(items)){
                                if (program.verbose){
                                    console.log('\nGenerating '+items.length+' file(s) for : ' + fname);
                                }
                                items.forEach(function(item){
                                    generateFile(options, dname, fname.substr(0,idx1)+ (item.Name||item)+fname.substr(idx+1), tfile, results[0].model, item);
                                })
                            }
                            else {
                                if (program.verbose){
                                    console.log('\nGenerating 1 file for : ' + fname);
                                }
                                generateFile(options, dname, fname.substr(0,idx1)+ (items.Name||items)+fname.substr(idx+1), tfile, results[0].model, items);
                            }
                            return;
                        }
                        else{
                            if (program.verbose){
                                console.log('');
                            }
                            generateFile(options, dname, fname, tfile, results[0].model,results[0].model);
                        }

                    }
                }

                if (results && results[0]){
                    generate(fulltemplatefilename);
                }
            });

            process.exit(0);
        });

    program.parse(process.argv);
    
    program.help();

})()