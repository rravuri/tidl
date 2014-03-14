#!/usr/bin/env node

;(function(){ // wrapper in case we're in module_context mode
    var tidl = require('../lib/main');
    var program = require('commander');
    var pack = require('../package.json');
    var fs=require('fs');
    var util=require('util');

    process.title='tidl';

    program
        .version(pack.version)
        .option('-v --verbose', 'use verbose logging');

    program
        .command('parse [filename]')
        .description('parse the specified tidl file.')
        .option('-i, --include <type>','include additional overlay file in the same path [none, all, rest]','all')
        .option('-f, --format <type>','Output format [json]','json')
        .action(function(filename, options) {
            if (program.verbose) {
                console.log('tidl %s',pack.version);
                console.log('input file(s):\t %s',filename);
                console.log('output format:\t %s', options.format);
            }
            var files=filename.split(',');
            files.forEach(function(val, index, array) {
                var fullfilename=fs.realpathSync(val);
                if (!fs.existsSync(fullfilename)){
                    console.error('% file does not exist.');
                    return;
                }


                var idltxt=fs.readFileSync(fullfilename,{encoding:'utf8'});

                var restIdltxt=null;

                if (options.include.toLowerCase()=='all' || 
                    options.include.toLowerCase()=='rest'){
                    if (fs.existsSync(fullfilename+'.rest')) {
                        restIdltxt=fs.readFileSync(fullfilename+'.rest',{encoding:'utf8'});
                    }
                    else if (program.verbose){
                        console.log('rest overlay file not found.')
                    }
                }

                var output=tidl.parse(idltxt);
                var restOutput=null;
                if (restIdltxt!==null){
                    restOutput = tidl.parse(restIdltxt);
                }

                output.messages.forEach(function(msg, msgindex, messages){
                    console.log(fullfilename+'('+msg.line+','+msg.col+') : '+msg.type+' '+msg.code+':'+tidl.Messages[msg.code]);
                });

                if (restOutput!==null) {
                    output.model.updateEndpoints(restOutput.model);
                }
                else {
                    output.model.updateEndpoints();
                }
                if (options.format.toLowerCase()=='json'){
                    console.log(util.inspect(output.model, { 
                        showHidden: false, 
                        colors: false,
                        depth: null 
                    }));
                }
            });
            process.exit(0);
        });
    
    program.parse(process.argv);
    
    program.help();
    // if (program.args.length==0){
    //}

    //console.log(' args: %j', program.args);

})()