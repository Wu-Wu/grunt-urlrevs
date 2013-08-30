/*
 * grunt-urlrevs
 * https://github.com/Wu-Wu/grunt-urlrevs
 *
 * Copyright (c) 2013 Anton Gerasimov
 * Licensed under the MIT license.
 */

"use strict";

module.exports = function (grunt) {
    var git  = require('./lib/git').Git(grunt),
        fs   = require('fs'),
        util = require('util');

    grunt.registerMultiTask("urlrevs", "Manage revisions in css urls", function () {

        var options = this.options({
            abbrev : 6,
            branch : 'HEAD',
            filter : '\\.(png|jpg|jpeg|gif)',
            path   : 'root/i',
            prefix : 'root',
            valid  : [ '^\\/', '^https?:\\/\\/', '^data:image' ],
            skip   : [ '^https?:\\/\\/', '^\\/\\/', '^data:image' ]
        });

        // show options if verbose
        grunt.verbose.writeflags(options);

        grunt.verbose.writeln("Verifying uncommited changes..");

        git.status(options.filter, function (output, code) {
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
            branch: options.branch,
            abbrev: options.abbrev,
            path:   options.path,
            prefix: options.prefix
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

        // creates RegExp object from string
        var reCreateNew = function (re) {
            return new RegExp(re, 'i');
        };

        var files = this.filesSrc;
        var _ = grunt.util._;

        // compile some regexes..
        var reFilter = reCreateNew(options.filter),       // ..images
            reValid  = _.map(options.valid, reCreateNew), // ..allowed urls
            reSkip   = _.map(options.skip, reCreateNew);  // ..skipped urls

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

                // is valid url?
                var isValid = _.some(reValid, function (re) { return re.test(url); });
                if (!isValid) {
                    grunt.fatal("Invalid URL: " + url);
                }

                // is file an image and should not be skipped?
                if (reFilter.test(url) && !_.some(reSkip, function (re) { return re.test(url); })) {
                    // trim revision if any
                    url = url.replace(/(\?(.*))/g, '');

                    // is file exists?
                    if (!fs.existsSync(options.prefix + url)) {
                        grunt.fatal("File for " + url + " does not exist!");
                    }
                    return util.format("url('%s?%s')", url, tree[url]);
                }
                else {
                    // not image or should be skipped
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
