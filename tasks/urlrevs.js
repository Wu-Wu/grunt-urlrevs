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
        BRANCH = 'branch',
        FILTER = 'filter',
        PREFIX = 'prefix',
        PATH   = 'path';

    var git  = require('./lib/git').Git(grunt),
        fs   = require('fs'),
        util = require('util');

    grunt.registerMultiTask("urlrevs", "Manage revisions in css urls", function () {

        var options = {};
        // defaults
        options[ABBREV] = 6;
        options[BRANCH] = 'HEAD';
        options[FILTER] = '\\.(png|jpg|jpeg|gif)';
        options[PATH]   = 'root/i';
        options[PREFIX] = 'root';

        options = this.options(options);

        options[ABBREV] = grunt.option(ABBREV) || options[ABBREV];
        options[BRANCH] = grunt.option(BRANCH) || options[BRANCH];
        options[FILTER] = grunt.option(FILTER) || options[FILTER];
        options[PATH]   = grunt.option(PATH)   || options[PATH];
        options[PREFIX] = grunt.option(PREFIX) || options[PREFIX];

        // show options if verbose
        grunt.verbose.writeflags(options);

        grunt.verbose.writeln("Verifying uncommited changes..");

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
            branch: options[BRANCH],
            abbrev: options[ABBREV],
            path:   options[PATH],
            prefix: options[PREFIX]
        };
        grunt.verbose.writeln("Building images revisions tree..");

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

        var files = this.filesSrc;

        var regex = new RegExp(options[FILTER], 'i');

        var changeUrls = function (filename, next) {
            grunt.log.writeln("Processing " + (filename).cyan + "...");

            var content = grunt.file.read(filename).toString();

            var css = content.replace(/url(?:\s+)?\(([^\)]+)\)/igm, function (match, url) {
                // trim spaces, quotes
                url = url.replace(/^\s+|\s+$/g, '');
                url = url.replace(/['"]/g, '');

                // grunt.log.writeln(url);

                if (/^(\s+)?$/.test(url)) {
                    grunt.fatal("Empty URLs are not supported!");
                }

                if (!/^\//.test(url)) {
                    grunt.fatal("Relative URLs are not supported: " + url);
                }

                // is file an image?
                if (regex.test(url)) {
                    // trim revision if any
                    url = url.replace(/(\?(.*))/g, '');

                    // is file exists?
                    if (!fs.existsSync(options[PREFIX] + url)) {
                        grunt.fatal("File for " + url + " does not exist!");
                    }
                    return util.format("url('%s?%s')", url, tree[url]);
                }
                else {
                    // not image - without revision
                    return util.format("url('%s')", url);
                }
            });

            // save changes
            grunt.file.write(filename, css);
            next();
        };

        if (files.length > 0) {
            grunt.util.async.forEachLimit(files, 30, function (file, next) {
                changeUrls(file, next);
            }.bind(this), this.async());
        }
        else {
            grunt.log.writeln('No files to processing');
        }
    });
};
