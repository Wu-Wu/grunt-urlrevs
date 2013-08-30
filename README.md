grunt-urlrevs
=============

> Manage revisions in CSS urls.

## Getting Started

This plugin requires Grunt ~0.4.1

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-urlrevs
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-urlrevs');
```

## The "urlrevs" task

Builds image revisions tree, finds CSS files and replaces each occurences of links to images in `url()` directives.

### Overview

In your project's Gruntfile, add a section named `urlrevs` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
    urlrevs: {
        some_target: {
            options: {
                // Target-specific options go here.
            },
            src: [
                // Specify the files you want to edit
            ]
        }
    }
})
```

Each target defines a specific task that can be run.

### Options

#### options.abbrev
Type: `Integer`
Default value: `6`

The length of the revision.

#### options.branch
Type: `String`
Default value: `HEAD`

Traversed branch.

#### options.filter
Type: `RegExp`
Default value: `\\.(png|jpg|jpeg|gif)`

Regular expression to filter files in stage of building revisions tree and replacing revisions in urls.

#### options.prefix
Type: `String`
Default value: `root`

Prefix to cut when generate absulute image url.

#### options.path
Type: `String`
Default value: `root/i`

Path to search files in stage of building tree. Relative to repository root directory.

#### options.valid
Type: `Array`
Default value: `[ '^\\/', '^https?:\\/\\/', '^data:image' ]`

All valid URL masks represented as a list of `RexExp`-like strings.

#### options.skip
Type: `Array`
Default value: `[ '^https?:\\/\\/', '^\\/\\/', '^data:image' ]`

Defined URL masks which should be excluded during processing. Represented as a list of `RexExp`-like strings.

### Usage Example

```js
grunt.initConfig({
    urlrevs: {
        live: {
            options: {
                abbrev: 6,
                branch: 'HEAD',
                filter: '\\.(png|jpg|jpeg|gif|bmp)',
                prefix: 'root',
                path: 'root/i',
                valid: [ '^\\/', '^https?:\\/\\/' ],
                skip: [ '^https?:\\/\\/' ]
            },
            src: [
                'root/css/**/*.css'
            ]
        }
    },
});

grunt.loadNpmTasks('grunt-urlrevs');
grunt.registerTask('default', ['urlrevs:live']);
```

## License
_grunt-urlrevs_ is licensed under the [MIT license][].

[MIT license]: http://www.tldrlegal.com/license/mit-license
