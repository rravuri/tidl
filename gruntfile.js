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
					'public/<%= pkg.name %>-<%= pkg.version %>.min.js': ["lib/main.js"]
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
				src: ['coverage/test/**/*.js']
			},
			coverage: {
				options: {
					reporter: 'mocha-lcov-reporter',
					quiet: false,
					captureFile: 'coverage/results/lcov.info'
				},
				src: ['coverage/test/**/*.js']
			}
		},
		clean: {
			coverage: {
				src: ['coverage/']
			}
		},
		copy: {
			coverage: {
				src: ['test/**'],
				dest: 'coverage/'
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
		}
	});

	grunt.loadNpmTasks('grunt-bump');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-coveralls');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-blanket');

	grunt.registerTask('test', ['clean', 'jshint', 'blanket', 'copy', 'mochaTest', 'coveralls']);
	grunt.registerTask('build', ['uglify']);
};