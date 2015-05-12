'use strict';
var path        = require('path');
var _           = require('lodash');
var gulp        = require('gulp-help')(require('gulp'));
var $           = require('gulp-load-plugins')({lazy: true});
var source      = require('vinyl-source-stream');
var buffer      = require('vinyl-buffer');
var runSequence = require('run-sequence');
var merge       = require('merge2');
var args        = require('yargs').argv;
var notifier    = require('node-notifier');
var del         = require('del');
var browserSync = require('browser-sync');
var watchify    = require('watchify');
var browserify  = require('browserify');
var ngHtml2Js   = require('browserify-ng-html2js');

process.setMaxListeners(0);    // Disable max listeners for gulp

var isVerbose = args.verbose;  // Enable extra verbose logging
var isProduction = args.prod;  // Run extra steps (minification) with production flag --prod
var isWatching = false;        // Enable/disable tasks when running watch
var jsBundles;                 // JS Browserify bundles

/************************************************************************
 * Functions/Utilities
 */

// Desktop notifications of errors
function onError(err) {
    // jshint validthis: true
    notifier.notify({
        title: err.plugin + ' Error',
        message: err.message
    });
    $.util.log(err.toString());
    $.util.beep();
    if (isWatching) {
        this.emit('end');
    } else {
        process.exit(1);
    }
}

function verbosePrintFiles(taskName) {
    return $.if(isVerbose, $.print(function(filepath) {
        return taskName + ': ' + filepath;
    }))
}

/************************************************************************
 * Clean temporary folders and files
 */

gulp.task('clean-build', false, function(cb) {
    del(['.tmp', 'dist'], cb);
});

gulp.task('clean-coverage', false, function(cb) {
    del(['coverage'], cb);
});

gulp.task('clean', 'Remove all temporary files', ['clean-build', 'clean-coverage']);

/************************************************************************
 * JavaScript tasks
 */

gulp.task('lint-js', false, function() {
    return gulp.src('src/**/*.js')
        .pipe($.plumber({errorHandler: onError}))
        .pipe(verbosePrintFiles('lint-js'))
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
        .pipe($.jshint.reporter('fail'));
});

// Browserify Bundles
jsBundles = [{
    task: 'main-js',
    src: './src/main.js',
    externals: [/*require.resolve('react', {expose: 'react'})*/]
}, {
    task: 'stubs-js',
    src: './src/stubs.js',
    externals: [/*require.resolve('react', {expose: 'react'})*/]
}].map(createBrowserifyBundle);

function createBrowserifyBundle(bundle) {
    var destDir = 'dist/js';
    var destFile = path.basename(bundle.src);
    var ngHtml2JsOptions = {
        //module: 'app.templates', // optional module name (default: each partial has own module name)
        extension: 'partial.html', // optionally specify what file types to look for
        baseDir: 'src', // optionally specify base directory for filename
        prefix: '' // optionally specify a prefix to be added to the filename
    };

    function initBrowserify() {
        var b = browserify(bundle.src, {
            entry:        true,
            cache:        {},
            packageCache: {},
            fullPaths:    false,
            debug:        true
        }).transform(ngHtml2Js(ngHtml2JsOptions));

        bundle.externals.forEach(function (external) {
            b.external(external);
        });
        return b;
    }

    // Create bundle for single-run gulp task
    gulp.task(bundle.task, false, function() {
        return addJsProcessing(initBrowserify().bundle());
    });

    // Bundle when watchify updates
    function runWatchBundle() {
        if (!bundle.bundler) {
            bundle.bundler = watchify(initBrowserify())
                .on('update', runWatchBundle)
                .on('log', (isVerbose) ? $.util.log : $.util.noop);
        }
        return addJsProcessing(bundle.bundler.bundle());
    }

    function addJsProcessing(stream) {
        return stream
            .on('error', onError.bind(gulp))
            .pipe(source(destFile))
            .pipe(buffer())
            .pipe(verbosePrintFiles(bundle.task))
            .pipe($.if(isProduction, $.sourcemaps.init({loadMaps: true})))
            .pipe($.ngAnnotate({'single_quotes': true}))
            .pipe($.if(isProduction, $.stripDebug()))
            .pipe($.if(isProduction, $.uglify()))
            .pipe($.if(isProduction, $.sourcemaps.write('.')))
            .pipe(gulp.dest(destDir))
            .pipe(browserSync.reload({stream:true}));
    }

    bundle.runWatchBundle = runWatchBundle;
    return bundle;
}

/************************************************************************
 * LESS (and other assets) tasks
 */

// Custom bootstrap/font-awesome builds
var mainCssFiles = [{
    main: 'src/styles/bootstrap.less',
    searchPaths: ['src/styles', 'node_modules/bootstrap/less', 'node_modules/bootstrap-social']
}, {
    main: 'src/styles/font-awesome.less',
    searchPaths: ['src/styles', 'node_modules/font-awesome/less']
}, {
    main: 'node_modules/angular/angular-csp.css'
}];

gulp.task('less', false, function() {
    var destDir  = 'dist/css';
    var destFile = 'main.css';

    return gulp
        // Use all less files as newer source
        .src(['src/**/*.less'].concat(_.pluck(mainCssFiles, 'main')), {base: '.'})
        .pipe($.newer(destDir + '/' + destFile))
        // Only process the main less file(s), with their individual search paths
        .pipe($.filter(_.pluck(mainCssFiles, 'main')))
        .pipe($.foreach(function(stream, file) {
            var relFilePath = file.path.replace(file.cwd + '/', '');
            return stream
                .pipe(verbosePrintFiles('less'))
                .pipe($.less({
                    paths: _.find(mainCssFiles, 'main', relFilePath).searchPaths || []
                }));
        }))
        .pipe($.concat(destFile))
        .pipe($.autoprefixer({
            browsers: ['last 2 versions'],
            cascade: true
        }))
        .pipe($.if(isProduction, $.minifyCss()))
        .pipe(gulp.dest(destDir))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('fonts', false, function() {
    var destDir = 'dist/fonts';
    return gulp
        .src(['node_modules/font-awesome/fonts/**'])
        .pipe($.newer(destDir))
        .pipe(verbosePrintFiles('fonts'))
        .pipe(gulp.dest(destDir));
});

gulp.task('images', function() {
    var destDir = 'dist/img';
    return gulp
        .src(['src/images/**'])
        .pipe($.newer(destDir))
        .pipe($.if(args.verbose, $.print()))
        .pipe($.if(isProduction, $.imagemin({progressive: true})))
        .pipe(gulp.dest(destDir));
});


gulp.task('www-root', false, function() {
    var destDir = 'dist';
    return gulp
        .src(['src/www-root/**'])
        .pipe($.newer(destDir))
        .pipe(verbosePrintFiles('www-root'))
        .pipe(gulp.dest(destDir))
        .pipe(browserSync.reload({stream:true}));
});

/************************************************************************
 * HTML file tasks
 */

gulp.task('index-html', false, function() {
    var destDir = 'dist';
    return gulp.src(['src/index.html'])
        .pipe($.newer(destDir))
        .pipe(verbosePrintFiles('index-html'))
        .pipe($.if(isProduction, $.htmlmin({
            collapseWhitespace: true,
            removeComments: true
        })))
        .pipe(gulp.dest(destDir))
        .pipe(browserSync.reload({stream:true}));
});

// Replaced by browserify-ng-html2js
//gulp.task('partials', false, function() {
//    var destDir  = 'dist/js';
//    var destFile = 'partials.js';
//    return gulp.src('src/**/*.partial.html')
//        .pipe($.newer(destDir + '/' + destFile))
//        .pipe(verbosePrintFiles('partials'))
//        .pipe($.if(isProduction, $.htmlmin({
//            collapseWhitespace: true,
//            removeComments: true
//        })))
//        .pipe($.ngHtml2js({
//            moduleName: 'app.templates',
//            prefix: ''
//        }))
//        .pipe($.concat(destFile))
//        .pipe($.if(isProduction, $.uglify()))
//        .pipe(gulp.dest(destDir))
//        .pipe(browserSync.reload({stream:true}));
//});

/************************************************************************
 * Build / Watch / Reload tasks
 */

gulp.task('lint', 'Lints all JavaScript files', function(cb) {
    runSequence('lint-js', cb);
});

gulp.task('build', 'Builds the source files into a distributable package', function(cb) {
    runSequence('clean-build', 'build-iterate', cb);
}, {
    options: {
        'prod':    'Enable production minification, sourcemaps, etc.',
        'verbose': 'Display debugging information'
    }
});

gulp.task('build-iterate', false, function(cb) {
    runSequence(
        'lint',
        ['index-html', 'fonts', 'images', 'www-root', 'less']
            .concat(_.pluck(jsBundles, 'task')),
        cb
    );
});

gulp.task('watch', 'Watch for file changes and re-run build and lint tasks', ['build-watch'], function() {
    isWatching = true;

    var port = 8000;
    $.util.log('Starting browser-sync on port ' + port);

    browserSync({
        // Start server...
        server: {
            baseDir: './dist'
        },
        // ...or proxy to separate static server
        //proxy: 'localhost:' + port,
        //port: 3000,
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'info',
        logPrefix: 'ngSPA',
        notify: true,
        minify: false,
        reloadDelay: 1000,
        browser: ['google chrome'],
        open: false
    });

    gulp.watch('src/**/*.js',     ['lint-js']);
    gulp.watch('src/index.html',  ['index-html']);
    gulp.watch('src/**/*.less',   ['less']);
    gulp.watch('src/www-root/**', ['www-root']);

    // Run the browserify bundles and merge their streams
    return merge.apply(merge, _.pluck(jsBundles, 'runWatchBundle').map(function(b) {return b();}));
});

// Don't run jsBundles during watch, handled by watchify
gulp.task('build-watch', false, ['clean-build'], function(cb) {
    runSequence(
        'lint',
        ['index-html', 'fonts', 'images', 'www-root', 'less'],
        cb
    );
});
