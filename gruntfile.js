module.exports = function(grunt) {
	"use strict";
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		bump: {
			files: ['package.json'],
			updateConfigs: ['pkg'],
			commit: false,
			commitMessage: 'Release v%VERSION%',
			commitFiles: ['package.json'], // '-a' for all files
			createTag: false,
			tagName: 'v%VERSION%',
			tagMessage: 'Version %VERSION%',
			push: false,
		},
		uglify: {
			options: {
				report: 'min',
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
					'<%= grunt.template.today("yyyy-mm-dd") %> */'
			},
			build: {
				files: {
					'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': ["lib/<%= pkg.name %>.js"]
				}
			}
		},
		jshint: {
			all: ['Gruntfile.js', 'lib/**/*.js']
		},
		mochaTest: {
			test: {
				options: {
					reporter: 'spec'
				},
				src: ['test/**/*.js']
			},
			coverage: {
				options: {
					reporter: 'html-cov',
					quiet: true,
					captureFile: 'coverage/results/coverage.html'
				},
				src: ['test/**/*.js']
			},
			coveralls:{
				options:{
					reporter:'mocha-lcov-reporter',
					quiet: true,
					captureFile:'coverage/results/lcov.info'
				},
				src:['test/**/*.js']
			}
		},
		clean: {
			coverage: {
				src: ['coverage/','lib/<%= pkg.name %>.js'],
				force:true
			}
		},
		concat: {
			options: {
				separator: "\n", //add a new line after each file
				//added before everything
				banner: '(function () {\n"uses strict;";\nvar tidl={};\n',

					//added after everything
				footer: "var root = this, previous_tidl = root.tidl;\nif (typeof module !== 'undefined' && module.exports) {\nmodule.exports = tidl;\n}\nelse {\nroot.tidl = tidl;\n}\n\ntidl.noConflict = function () {\nroot.tidl = previous_tidl;\nreturn tidl;\n};\n})(this);"
			},
			dist: {
				// the files to concatenate
				src: ['src/**/*.js'],
				// the location of the resulting JS file
				dest: 'lib/<%= pkg.name %>.js'
			}
		},
		copy: {
			main:{
				src:'lib/<%= pkg.name %>.js',
				dest:'dist/<%= pkg.name %>-<%= pkg.version %>.js'
			}
		},
		blanket: {
			coverage: {
				src: ['lib/'],
				dest: 'coverage/lib/'
			}
		},
		coveralls: {
			options: {
				// LCOV coverage file relevant to every target
				src: 'coverage/results/lcov.info',

				// When true, grunt-coveralls will only print a warning rather than
				// an error, to prevent CI builds from failing unnecessarily (e.g. if
				// coveralls.io is down). Optional, defaults to false.
				force: true
			},
			all: {
				// Target-specific LCOV coverage file
				src: 'coverage/results/*.info'
			}
		},
		watch:{
			options: {
				dateFormat: function(time) {
					grunt.log.writeln('The watch finished in ' + time + 'ms at' + (new Date()).toString());
					grunt.log.writeln('Waiting for more changes...');
				},
				spawn:false
			},
			src:{
				files: ['src/**/*.js', 'test/**/*.js'],
				tasks:['qtest']
			},
			configFiles: {
				files: [ 'Gruntfile.js'],
				options: {
					reload: true
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-bump');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-coveralls');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-blanket');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default',['concat']);
	grunt.registerTask('qtest',['concat', 'blanket', 'mochaTest:test']);
	grunt.registerTask('test', ['clean', 'concat', 'jshint', 'blanket', 'copy', 'mochaTest']);
	grunt.registerTask('build', ['concat', 'uglify']);
};