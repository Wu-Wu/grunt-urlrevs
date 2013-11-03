/*
 * grunt-urlrevs
 * https://github.com/Wu-Wu/grunt-urlrevs
 *
 * Copyright (c) 2013 Anton Gerasimov
 * Licensed under the MIT license.
 */

"use strict";

var cssParser   = require('css-parse'),
    cssCompiler = require('css-stringify'),
    cssClean    = require('clean-css');

exports.CSS = function (grunt) {
    exports.parseAST = function (content, options) {
        return cssParser(content, options);
    };

    exports.compileAST = function (ast, options) {
        return cssCompiler(ast, options || {}) + "\n";
    };

    exports.cleanCSS = function (content, options) {
        return cssClean.process(content, options || {});
    };

    return exports;
};
