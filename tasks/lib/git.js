/*
 * grunt-contrib-urlrevs
 * https://bitbucket.org/Wu-Wu/grunt-contrib-urlrevs
 *
 * Copyright (c) 2013 Anton Gerasimov
 * Licensed under the MIT license.
 */

"use strict";

exports.Git = function (grunt) {
    var exports = {};

    // repository "git status"
    exports.status = function () {
        return true;
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
