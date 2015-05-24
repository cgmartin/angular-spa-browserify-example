'use strict';
// Karma configuration

module.exports = function karmaConfig(config) {
    var karmaCfg = {
        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['mocha', 'chai', 'sinon', 'browserify'],

        // list of files / patterns to load in the browser
        files: [
            'src/client/**/*.spec.js'
        ],

        // list of files to exclude
        exclude: [],

        // preprocess matching files before serving them to the browser
        // info: http://karma-runner.github.io/0.10/config/preprocessors.html
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'src/client/**/*.spec.js': ['browserify'],
            //'src/**/!(*spec).js': ['coverage'] // coverage is handled by browserify-istanbul
        },

        browserify: {
            debug: false,
            plugin: ['proxyquireify/plugin'],
            transform: [
                ['browserify-ng-html2js', {
                    //module: 'app.templates', // optional module name (default: each partial has own module name)
                    extension: 'partial.html', // optionally specify what file types to look for
                    baseDir: 'src/client', // optionally specify base directory for filename
                    prefix: '' // optionally specify a prefix to be added to the filename
                }],
                ['browserify-istanbul', {
                    ignore: []
                }]
            ],
            //configure: function(bundle) {
            //    bundle.on('prebundle', function() {
            //        bundle.external('foo');
            //    });
            //}
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: [
            //'progress',
            'mocha',
            'notify',
            'coverage'
        ],

        notifyReporter: {
            reportEachFailure: true, // Default: false, Will notify on every failed sepc
            reportSuccess: false     // Default: true, Will notify when a suite was successful
        },

        coverageReporter: {
            dir: './coverage',
            reporters: [
                // html reports issue: https://github.com/karma-runner/karma-coverage/issues/16
                //{type: 'html', subdir: 'report-html'},
                {type: 'lcovonly', subdir: 'report-lcov'},
                {type: 'text-summary'}
            ]
        },

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['PhantomJS', 'Chrome'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false
    };

    config.set(karmaCfg);
};
