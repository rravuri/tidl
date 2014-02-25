module.exports = function (grunt) {
	"use strict";
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		bump: {
			files : ['package.json'],
			updateConfigs : ['pkg'],
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
			build:{
				files: {
					'public/<%= pkg.name %>-<%= pkg.version %>.min.js': [ "lib/main.js"]
				}
			}
		},
		jshint: {
			all: ['Gruntfile.js', 'lib/**/*.js']
		}
	});

	grunt.loadNpmTasks('grunt-bump');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('build', ['uglify']);
};