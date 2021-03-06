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
            abbrev      : 6,
            branch      : 'HEAD',
            filter      : '\\.(png|jpg|jpeg|gif)',
            path        : 'root/i',
            prefix      : 'root',
            valid       : [ '^\\/' ],
            skip        : [ '^https?:\\/\\/', '^\\/\\/', '^data:image\\/(sv|pn)g', '^%23' ],
            implant     : true,
            upcased     : true,
            autocommit  : true,
            message     : 'Wave a magic wand (by urlrevs)'
        });

        // show options if verbose
        grunt.verbose.writeflags(options);

        grunt.verbose.writeln("Verifying uncommited changes..");

        git.status(options.filter, function (output, code) {
            if (!code) {
                if (output.length) {
                    if (options.autocommit) {
                        git.commit({ message: options.message, path: options.path }, function (message, success) {
                            if (!success) {
                                grunt.fatal(message);
                            }
                            else {
                                grunt.log.ok(message);
                            }
                        });
                    }
                    else {
                        grunt.verbose.writeln("Uncommited changes:\n" + output.join("\n"));
                        grunt.fatal("Commit changes manually or set option 'autocommit: true' please.");
                    }
                }
            }
            else {
                grunt.fatal("Unable to get repository status!");
            }
        });

        var lstree_opts = {
            branch      : options.branch,
            abbrev      : options.abbrev,
            path        : options.path,
            prefix      : options.prefix
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

                if (/^(\s+)?$/.test(url)) {
                    grunt.fatal("Empty URLs are not supported!");
                }

                if (_.some(reSkip, function (re) { return re.test(url); })) {
                    // return AS IS
                    return match;
                }

                // is valid url?
                var isValid = _.some(reValid, function (re) { return re.test(url); });
                if (!isValid) {
                    grunt.fatal("Invalid URL: " + url);
                }

                // is file an image?
                if (reFilter.test(url)) {
                    // trim revision if any
                    url = url.replace(/(\?(.*))/g, '');             // ..query string parameter
                    url = url.replace(/\.(~[0-9A-F]*\.)/ig, '.');   // ..part of pathname

                    // is file exists?
                    if (!fs.existsSync(options.prefix + url)) {
                        grunt.fatal("File for " + url + " does not exist!");
                    }

                    var rev = tree[url];

                    if (typeof rev !== 'undefined') {
                        // uppercase revision
                        if (options.upcased) {
                            rev = rev.toUpperCase();
                        }

                        // implant revision into filename
                        if (options.implant) {
                            rev = '~' + rev;
                            url = url.replace(/(.*)\.(.*)/i, function (match, file, ext) { return [file, rev, ext].join('.'); });
                        }
                        else {
                            url += '?' + rev;
                        }
                    }
                }

                return util.format("url('%s')", url);
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
