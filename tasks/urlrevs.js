/*
 * grunt-contrib-urlrevs
 * https://bitbucket.org/Wu-Wu/grunt-contrib-urlrevs
 *
 * Copyright (c) 2013 Anton Gerasimov
 * Licensed under the MIT license.
 */

"use strict";

module.exports = function (grunt) {

    var git = require("./lib/git").Git(grunt);

    grunt.registerMultiTask("urlrevs", "Manage revisions in css urls", function () {

        grunt.log.writeln("Verifying uncommited changes..");

        git.status(function (output, code) {
            if (!code) {
                if (output.length) {
                    grunt.verbose.writeln("Uncommited changes:\n" + output.join("\n"));
                    grunt.fatal("Changes should be commited before running this task!");
                }
            }
            else {
                grunt.fatal("Unable to get repository status!");
            }
        });

        // not implemented yet

    });

};
