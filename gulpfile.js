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
var karma       = require('karma');

process.setMaxListeners(0);    // Disable max listeners for gulp

var isVerbose = args.verbose;    // Enable extra verbose logging
var isProduction = args.prod;    // Run extra steps (minification) with production flag --prod
var noBrowserSync = args.nosync; // Disable BrowserSync
var isWatching = false;          // Enable/disable tasks when running watch
var jsBundles;                   // JS Browserify bundles

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
    }));
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
    return gulp.src(['src/client/**/*.js', 'server/**/*.js', 'gulpfile.js', '!src/client/vendor/**'])
        .pipe($.plumber({errorHandler: onError}))
        .pipe(verbosePrintFiles('lint-js'))
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', {verbose: true}))
        .pipe($.if(!isWatching, $.jshint.reporter('fail')));
});

// Browserify Bundles
function JsBundle(task, src, exposed, externals) {
    this.task = task;
    this.src = src;
    this.exposed = exposed || [];     // modules to expose
    this.externals = externals || []; // external modules to exclude from bundle
}

jsBundles = [
    new JsBundle('main-js', './src/client/main.js', ['angular', 'lodash']),
    new JsBundle('stubs-js', './src/client/stubs.js', null, ['angular', 'lodash'])
].map(createBrowserifyBundle);

function createBrowserifyBundle(bundle) {
    var destDir = 'dist/js';
    var destFile = path.basename(bundle.src);
    var ngHtml2JsOptions = {
        //module: 'app.templates', // optional module name (default: each partial has own module name)
        extension: 'partial.html', // specify what file types to look for
        baseDir: 'src/client', // specify base directory for filename
        prefix: '', // optionally specify a prefix to be added to the filename
        requireAngular: true // include `var angular = require('angular');`
    };

    function initBrowserify() {
        var b = browserify(bundle.src, {
            entry:        true,
            cache:        {},
            packageCache: {},
            fullPaths:    false,
            debug:        true
        }).transform(ngHtml2Js(ngHtml2JsOptions));

        bundle.exposed.forEach(function(expose) {
            if (typeof expose === 'string') {
                expose = {resolve: expose, expose: expose};
            }
            b.require(expose.resolve, {expose: expose.expose});
        });

        bundle.externals.forEach(function(external) {
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

function CssBundle(main, searchPaths) {
    this.main = main;
    this.searchPaths = searchPaths || [];
}

// Custom bootstrap/font-awesome builds
var mainCssFiles = [
    new CssBundle('src/client/app/styles/bootstrap.less',
        ['src/client/app/styles', 'node_modules/bootstrap/less', 'node_modules/bootstrap-social']),
    new CssBundle('src/client/app/styles/font-awesome.less',
        ['src/client/app/styles', 'node_modules/font-awesome/less']),
    new CssBundle('node_modules/angular/angular-csp.css')
];

gulp.task('less', false, function() {
    var destDir  = 'dist/css';
    var destFile = 'main.css';

    return gulp
        // Use all less files as newer source
        .src(['src/client/**/*.less'].concat(_.pluck(mainCssFiles, 'main')), {base: '.'})
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
        .src(['src/client/assets/images/**'])
        .pipe($.newer(destDir))
        .pipe($.if(args.verbose, $.print()))
        .pipe($.if(isProduction, $.imagemin({progressive: true})))
        .pipe(gulp.dest(destDir));
});

gulp.task('www-root', false, function() {
    var destDir = 'dist';
    return gulp
        .src(['src/client/www-root/**'])
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
    return gulp.src(['src/client/index.html'])
        .pipe($.newer(destDir))
        .pipe(verbosePrintFiles('index-html'))
        .pipe($.if(isProduction, $.htmlmin({
            collapseWhitespace: true,
            removeComments: true
        })))
        .pipe(gulp.dest(destDir))
        .pipe(browserSync.reload({stream:true}));
});

/************************************************************************
 * Unit testing tasks
 */

gulp.task('karma', false, function(done) {
    var karmaServer = new karma.Server({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true,
        browsers: ['PhantomJS']
    }, done);
    karmaServer.start();
});

gulp.task('test', 'Run unit tests', function(cb) {
    runSequence('clean-coverage', 'lint', 'karma', cb);
});

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
        ['index-html', 'fonts', 'images', 'www-root', 'less']
            .concat(_.pluck(jsBundles, 'task')),
        cb
    );
});

gulp.task('nodemon', false, function(cb) {
    var firstStart = true;
    var serverPort = 8000;
    $.nodemon({
        script: 'src/server/static-server.js',
        ext: 'js',
        env: {
            'NODE_ENV': 'development',
            'PORT': serverPort
        },
        nodeArgs: ['--debug=5800'],
        ignore: [
            'coverage/**', 'node_modules/**',
            'gulpfile.js', '.idea/**', '.git/**'
        ],
        stdout: false // important for 'readable' event
    })
    // The http server might not have started listening yet when
    // the `restart` event has been triggered. It's best to check
    // whether it is already listening for connections or not.
    .on('readable', function() {
        this.stdout.on('data', function(chunk) {
            process.stdout.write(chunk);
            if (/listening at http/.test(chunk)) {
                if (firstStart) {
                    firstStart = false;
                    if (!noBrowserSync) {
                        startBrowserSync(8000);
                    }
                    cb();
                } else {
                    browserSync.reload();
                }
            }
        });
        this.stderr.pipe(process.stdout);
    });
    //.on('change', ['test-server'])
    //.on('start', function() {});
});

// Don't run jsBundles during watch, handled by watchify
gulp.task('build-watch', false, ['clean-build'], function(cb) {
    runSequence(
        ['index-html', 'fonts', 'images', 'www-root', 'less'],
        cb
    );
});

gulp.task('watch', false, function() {
    isWatching = true;
    gulp.watch('src/client/**/*.js',     ['lint-js']);
    gulp.watch('src/client/index.html',  ['index-html']);
    gulp.watch('src/client/**/*.less',   ['less']);
    gulp.watch('src/client/www-root/**', ['www-root']);

    // Run the browserify bundles and merge their streams
    return merge.apply(merge, _.pluck(jsBundles, 'runWatchBundle').map(function(b) {return b();}));
});

gulp.task('serve', 'Watch for file changes and re-run build and lint tasks', ['build-watch'], function(cb) {
    // When watch and nodemon tasks run at same time
    // the server seems to randomly blow up (??)
    runSequence('watch', 'nodemon', cb);
});

function startBrowserSync(port) {
    if (browserSync.active) {
        browserSync.reload();
        return;
    }

    port = port || 8000;
    $.util.log('Starting browser-sync on port ' + port);

    var options = {
        // Start standalone server...
        //server: {
        //    baseDir: './dist'
        //},
        // ...or proxy to separate static server
        proxy: 'localhost:' + port,
        port: 3000,
        files: ['./dist/**'],
        //
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
    };

    browserSync(options);
}
