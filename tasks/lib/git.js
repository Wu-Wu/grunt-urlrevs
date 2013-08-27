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

    // repository "git status"
    exports.status = function (callback) {
        // TODO: uncommited images only
        var status = Shell.exec("git status --porcelain", { silent: true });
        callback(_.without(status.output.split("\n"), ''), status.code);
    };

    // repository "git ls-tree"
    exports.lsTree = function () {
        return true;
    };

    // repository "git commit"
    exports.commit = function () {
        return true;
    };

    return exports;
};
