/*
 * grunt-urlrevs
 * https://github.com/Wu-Wu/grunt-urlrevs
 *
 * Copyright (c) 2013 Anton Gerasimov
 * Licensed under the MIT license.
 */

"use strict";

var Shell = require("shelljs");

exports.Git = function (grunt) {
    var exports = {};

    var _ = grunt.util._;

    // run any sync command and return result
    var runCommand = function (cmd) {
        // console.log(cmd.join(" ").cyan);
        return Shell.exec(cmd.join(" "), { silent: true });
    };

    // repository "git status"
    exports.status = function (masks, callback) {
        var regex = new RegExp(masks, 'i');

        var status = runCommand(
            [ 'git', 'status', '--porcelain' ]
        );

        callback(
            _.filter(status.output.split("\n"), function (filename) { return regex.test(filename); }),
            status.code
        );
    };

    // repository "git ls-tree"
    exports.lsTree = function (params, callback) {
        var lstree = runCommand(
            [ 'git', 'ls-tree', '-r', '--abbrev=12', params.branch, params.path ]
        );

        var tree = {};

        _.forEach(lstree.output.split("\n"), function (item) {
            if (item !== '') {
                var fields = item.split(/\s+/);
                tree[ fields[3].replace(params.prefix, '') ] = fields[2].substring(0, params.abbrev);
            }
        });

        callback(tree, lstree.code);
    };

    return exports;
};
