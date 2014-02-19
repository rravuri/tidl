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

                var output=tidl.parse(idltxt);
                output.messages.forEach(function(msg, msgindex, messages){
                    console.log(fullfilename+'('+msg.line+','+msg.col+') : '+msg.type+' '+msg.code+':'+tidl.Messages[msg.code]);
                });

                if (options.format.toLowerCase()=='json'){
                    output.model.updateEndpoints();
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