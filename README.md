# angular-spa-browserify-example

[![Build Status](https://travis-ci.org/cgmartin/angular-spa-browserify-example.svg?branch=master)](https://travis-ci.org/cgmartin/angular-spa-browserify-example)
[![Dependency Status](https://david-dm.org/cgmartin/angular-spa-browserify-example.svg)](https://david-dm.org/cgmartin/angular-spa-browserify-example)
[![devDependency Status](https://david-dm.org/cgmartin/angular-spa-browserify-example/dev-status.svg)](https://david-dm.org/cgmartin/angular-spa-browserify-example#info=devDependencies)

## Synopsis

Demonstrates using Browserify require('modules') in a client-side Angular single page application with Mocha unit tests and Gulp tasks.

[Live Demo on Heroku](https://angular-spa-browserify-example.herokuapp.com/)

This client project is meant to accompany a set of Node.js microservices (REST webservice, Chat Server, Static Server, Reverse Proxy),
and is designed with portability in mind (see [Twelve Factors](http://12factor.net/)).

Application configuration is separated from the application by an initial `/spa-boot.js` request, which can be
deployed as a static file or routed to a dynamic backing service.

## Features

* **Manual Bootstrapping**: Bootstrap angular with dynamic configuration (spa-boot.js).
* **Mocked Backend Stubs**: Fake HTTP backend for standalone testing using [ngMockE2E](https://code.angularjs.org/1.3.7/docs/api/ngMockE2E/service/$httpBackend)
  and [TaffyDB](http://www.taffydb.com/). Stub functionality is conditionally loaded via separate JS bundle during bootstrap.
* **Client-side Routing**: via [AngularUI Router](https://github.com/angular-ui/ui-router).
* **Internationalization**: I18n and language selection using [angular-translate](https://github.com/angular-translate/angular-translate).
* **Todo MVC module**: Demonstrates backend requests.
* **Server-side Logging module**: Send client-side log messages, metrics, and event tracking to backend logger.
  Includes a custom exception handler logger and http interceptor request logging.
* **Error module**: Global exception handler and Error router.
* **Notification module**: Provides "toast"-like messaging for errors or events.
* **Unit testing examples**: Using karma, mocha, chai, sinon, and proxyquireify.
* **Custom LESS builds**: Override variables for bootstrap & font-awesome.
* **[Static server](https://github.com/cgmartin/spa-express-static-server)**: Includes error handling, security, and HTML5 mode routing.
* **No Bower!** All dependencies are bundled from npm using browserify.

### Roadmap

* JWT authentication example.
* Route authorization with bearer tokens.
* Social login to Facebook, Google, Twitter, etc.
* Chat module, with disconnected mock websocket server.
* Real backend web service API and chat server (separate repos).

## Installation

1. Install [Node.js](https://nodejs.org/download/)
1. Install Gulp/Karma: `npm -g i gulp karma`
1. Clone this repo
1. Install dependencies: `npm i`
1. Start the app in dev mode: `npm run dev`
1. Point browser to <http://localhost:3000/>

After installation, the following actions are available:

* `npm run dev` : Builds for development, runs a local webserver, and watches for changes.
* `npm test` : Runs TypeScript file linting and unit tests once.
* `karma start` : Runs unit tests continuously, watching for changes.
* `npm run build` : Creates production client assets under the `dist/` folder, for deployment to a static webserver or CDN.
* `npm run deploy` : Builds and prepares all files (client and server) for deployment (i.e. Heroku).

## Folder Structure

```
├── coverage                 # Coverage reports
├── dist                     # Client build destination folder
├── deploy                   # Heroku deployment artifact
├── server                   # Static server source files
│   ├── spa-boot.js          # Boot configuration launcher (actual)
│   └── static-server.js     # Static server
└── client                   # Angular SPA client source files
    ├── app                  # Application module
    ├── error                # Error handling module
    ├── images               # Image assets to optimize
    ├── lib                  # Global utilities
    ├── logging              # Server logging module
    ├── notifications        # Notifications module
    ├── session              # Session module (browser session ID)
    ├── styles               # Global styles
    ├── todo                 # Todo MVC Module
    ├── www-root             # Static files under web root
    │   ├── lang             # Language bundles
    │   └── spa-boot.js      # Boot configuration launcher (sample)
    ├── main.js              # Main JS bundle entrypoint
    ├── stubs.js             # Fake HTTP stub bundle entrypoint
    └── index.html           # SPA index
```

## Deployment

Running `npm run deploy` will prepare the files for deployment under the `./deploy` folder.

While other projects may prefer the simplicity of deploying directly from the source code repository,
having the extra gulp tasks here to generate a deploy artifact grants some extra separation and flexibility.

The following steps illustrate deploying to Heroku, but it is not a requirement.
A different PaaS provider could easily be substituted.

### Heroku first time setup

Run the deploy task and set up a separate git repo within the deploy directory, which will be used for
installation at your PaaS provider.

1. Run `npm run deploy`
1. Go under the deploy directory: `cd deploy`
1. Initialize a new git repository: `git init`
1. Create a Procfile: `echo "web: npm start" > Procfile`
1. Commit everything: `git commit -am "initial commit"`
1. Create an app on Heroku: `heroku create`
1. Deploy the code: `git push heroku master`
1. Set Environment vars: `heroku config:set NODE_ENV=production`

        NODE_ENV:         production
        STATIC_INSTANCE:  1
        STATIC_REV_PROXY: 1
        STATIC_SSL:       1
        STATIC_WEBROOT:   ./www-root

1. Visit the app: `heroku open`

### New releases to Heroku

Re-running the deploy task will overlay the changed files in the deploy repo. Commit the updates and push
to your PaaS provider.

1. Bump the version: `npm version patch` (or minor, major, [etc.](https://docs.npmjs.com/cli/version))
1. Generate the deployment artifacts: `npm run deploy`
1. Go under the deploy directory: `cd deploy`
1. Commit new updates: `git commit -am "new release"`
1. Deploy the code: `git push heroku master`
1. Visit the app: `heroku open`

## Libraries & Tools

The functionality has been implemented by integrating the following 3rd-party tools and libraries:

 - [Browserify](http://browserify.org/): Browserify lets you require('modules') in the browser by bundling up all of your dependencies
 - [AngularJS v1](http://angularjs.org/): Superheroic JavaScript MVW Framework
 - [Twitter Bootstrap v3](http://getbootstrap.com/): HTML, CSS, and JS framework for developing responsive, mobile first projects on the web
 - [Font Awesome](http://fontawesome.io/): The iconic font and CSS toolkit
 - [Stacktrace.js](http://www.stacktracejs.com/): Cross-browser stack traces
 - [SPA Express Static Server](https://github.com/cgmartin/spa-express-static-server): Express static server library for AngularJS SPA clients
 - [TaffyDB](http://www.taffydb.com): JavaScript Database for your browser
 - [Gulp](http://gulpjs.com/): Streaming build system and task runner
 - [Node.js](http://nodejs.org/api/): JavaScript runtime environment for server-side development
 - [Karma](http://karma-runner.github.io/): Spectacular Test Runner for Javascript
 - [Mocha](http://mochajs.org/): The fun, simple, flexible JavaScript test framework
 - [Chai](http://chaijs.com/): BDD/TDD assertion library for node and the browser
 - [Sinon](http://sinonjs.org/): Standalone test spies, stubs and mocks for JavaScript
 - [Proxyquireify](https://github.com/thlorenz/proxyquireify): Override dependencies during testing

## License

[MIT License](http://cgm.mit-license.org/)  Copyright © 2015 Christopher Martin
