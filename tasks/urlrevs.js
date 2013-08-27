/*
 * grunt-contrib-urlrevs
 * https://bitbucket.org/Wu-Wu/grunt-contrib-urlrevs
 *
 * Copyright (c) 2013 Anton Gerasimov
 * Licensed under the MIT license.
 */

"use strict";

module.exports = function (grunt) {
    var ABBREV = 'abbrev',
        TREE   = 'tree',
        FILTER = 'filter',
        CUT    = 'cut',
        PATH   = 'path';

    var git = require("./lib/git").Git(grunt);

    grunt.registerMultiTask("urlrevs", "Manage revisions in css urls", function () {

        var options = {};
        // defaults
        options[ABBREV] = 6;
        options[TREE]   = 'HEAD';
        options[FILTER] = '.(png|jpg|jpeg|gif)';
        options[PATH]   = 'root/i';
        options[CUT]    = 'root';

        options = this.options(options);

        options[ABBREV] = grunt.option(ABBREV) || options[ABBREV];
        options[TREE]   = grunt.option(TREE)   || options[TREE];
        options[FILTER] = grunt.option(FILTER) || options[FILTER];
        options[PATH]   = grunt.option(PATH)   || options[PATH];
        options[CUT]    = grunt.option(CUT)    || options[CUT];

        // show options if verbose
        grunt.verbose.writeflags(options);

        grunt.log.writeln("Verifying uncommited changes..");

        git.status(options[FILTER], function (output, code) {
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

        var lstree_opts = {
            tree:   options[TREE],
            abbrev: options[ABBREV],
            path:   options[PATH],
            cut:    options[CUT]
        };
        grunt.log.writeln("Building images revisions tree..");

        var tree = {};

        git.lsTree(lstree_opts, function (output, code) {
            if (!code) {
                tree = output;
                // console.dir(output);
            }
            else {
                grunt.fatal("Unable to build revisions tree!");
            }
        });

        // not implemented yet

    });

};
