/*
 * grunt-contrib-urlrevs
 * https://bitbucket.org/Wu-Wu/grunt-contrib-urlrevs
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
            [ 'git', 'ls-tree', '-r', '--abbrev=' + params.abbrev, params.tree, params.path ]
        );

        var tree = {};

        _.forEach(lstree.output.split("\n"), function (item) {
            if (item !== '') {
                var fields = item.split(/\s+/);
                tree[ fields[3].replace(params.cut, '') ] = fields[2];
            }
        });

        callback(tree, lstree.code);
    };

    // repository "git commit"
    exports.commit = function () {
        return true;
    };

    return exports;
};
