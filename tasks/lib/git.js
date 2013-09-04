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
            [ 'git', 'status', '--porcelain', '--untracked-files=all' ]
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

    // repository "git commit"
    exports.commit = function (params, callback) {
        var adding,
            commiting,
            retmsg = 'Successfully commited.',
            result = false;

        // trying to add files
        adding = runCommand(
            [ 'git', 'add', params.path ]
        );

        if (!adding.code) {
            // trying to commit changes
            commiting = runCommand(
                [ 'git', 'commit', '-m "' + params.message + '"' ]
            );

            if (commiting.code) {
                retmsg = 'Unable to commit changes.';
            }
            else {
                result = true;
            }
        }
        else {
            retmsg = 'Unable to add files.';
        }

        callback(retmsg, result);
    };

    return exports;
};
