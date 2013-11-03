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
            valid       : [ '^\\/', '^https?:\\/\\/', '^data:image' ],
            skip        : [ '^https?:\\/\\/', '^\\/\\/', '^data:image' ],
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

        var cssParser   = require('css-parse'),
            cssCompiler = require('css-stringify'),
            cssClean    = require('clean-css');

        var maxLength = 70;

        var properties = {
            'background': 1,
            'background-image': 1
        };

        var changeUrls = function (filename, next) {
            grunt.log.writeln("Processing " + (filename).cyan + "...");

            // build AST
            var ast = cssParser(grunt.file.read(filename).toString(), { position: true });

            // source file should be minified?
            var isMin = _.last(ast["stylesheet"]["rules"]).position.end.line > 1 ? false : true;

            // grunt.log.writeln("Minify CSS: " + (isMin ? ("YES").green : ("NO").yellow));

            _.forEach(ast["stylesheet"]["rules"], function (rules) {
                _.forEach(rules["declarations"], function (decl) {
                    if (decl.type === "declaration" && properties[ decl.property ]) {
                        var value = decl.value;

                        // var subval = value.length > maxLength ? value.substring(0, maxLength - 1) : value;
                        // grunt.log.writeln("OLD.DECL: " + (subval).magenta);

                        value = value.replace(/url(?:\s+)?\(([^\)]+)\)/im, function (match, url) {
                            // trim spaces, quotes
                            url = url.replace(/^\s+|\s+$/g, '');
                            url = url.replace(/['"]/g, '');

                            if (/^(\s+)?$/.test(url)) {
                                grunt.fatal("Empty URLs are not supported!");
                            }

                            var suburl = url.length > maxLength ? url.substring(0, maxLength - 1) : url;
                            // grunt.log.writeln("OLD.URL : " + (suburl).blue);

                            if (_.some(reSkip, function (re) { return re.test(url); })) {
                                return;
                            }

                            // is valid url?
                            var isValid = _.some(reValid, function (re) { return re.test(url); });
                            if (!isValid) {
                                grunt.fatal("Invalid URL: " + suburl);
                            }

                            // skip if not image
                            if (!reFilter.test(url)) {
                                return;
                            }

                            // trim revision if any
                            url = url.replace(/(\?(.*))/g, '');             // ..query string parameter
                            url = url.replace(/\.(~[0-9A-F]*\.)/ig, '.');   // ..part of pathname

                            // is file exists?
                            if (!fs.existsSync(options.prefix + url)) {
                                grunt.fatal("File for " + url + " does not exist!");
                            }

                            var rev = tree[url];

                            if (typeof rev !== "undefined") {
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

                            // grunt.log.writeln("NEW.URL : " + (url).green);
                            return util.format("url('%s')", url);
                        });

                        if (typeof value !== "undefined" && !/^undefined/.test(value)) {
                            // var subval = value.length > maxLength ? value.substring(0, maxLength - 1) : value;
                            // grunt.log.writeln("VALUE   : " + (subval).red);
                            decl.value = value;
                        }
                    }
                });
            });

            // compile AST to CSS-string
            var content = cssCompiler(ast, { compress: false }) + "\n";

            if (isMin) {
                content = cssClean.process(content, {});
            }

            // save changes
            grunt.file.write(filename, content);
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
