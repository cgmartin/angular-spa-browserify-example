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
* **JWT Authentication**: Login and logout functionality using JSON Web Tokens.
* **Todo MVC module**: Demonstrates backend requests with authentication.
* **Server-side Logging module**: Send client-side log messages, metrics, and event tracking to backend logger.
  Includes a custom exception handler logger and http interceptor request logging.
* **Error module**: Global exception handler and Error router.
* **Notification module**: Provides "toast"-like messaging for errors or events.
* **Unit testing examples**: Using karma, mocha, chai, sinon, and proxyquireify.
* **Custom LESS builds**: Override variables for bootstrap & font-awesome.
* **[Static server](https://github.com/cgmartin/spa-express-static-server)**: Includes error handling, security, and HTML5 mode routing.
* **No Bower!** All dependencies are bundled from npm using browserify.

### Roadmap

* Route authorization with auth scopes.
* Registration and Forgotten Password functionality.
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
* `npm run build` : Creates production client assets under the `dist/` folder, for deployment with a static webserver or CDN.

## Folder Structure

```
├── coverage                     # Coverage reports
├── dist                         # Client build destination folder
└── src
    ├── server                   # Static server source files
    │   ├── spa-boot-config.js   # Boot configuration for client (actual)
    │   └── static-server.js     # Static server
    │
    └── client                   # Angular SPA client source files
        ├── app                  # Application module
        │   └── styles           # Global styles
        │
        ├── modules              # Feature modules
        │   ├── auth             # Authentication and authorization utilities
        │   ├── chat             # TODO: Chat module
        │   ├── error            # Error handling utilities
        │   ├── home             # Home page module
        │   ├── loading          # Loading indicator utility
        │   ├── logging          # Server logging utilities
        │   ├── nav              # Navigation bar
        │   ├── notifications    # On-screen notification utilities
        │   ├── session          # Session tracking module
        │   └── todo             # Todo MVC example
        │
        ├── assets               # Raw assets to optimize during build
        │   └── images
        │
        ├── www-root             # Static files under web root
        │   ├── lang             # Language bundles
        │   └── spa-boot.js      # Boot configuration launcher (sample)
        │
        ├── vendor               # Copy/pasted 3rd-party vendor scripts
        │
        ├── main.js              # Main JS bundle entrypoint
        ├── stubs.js             # Fake HTTP stub bundle entrypoint
        └── index.html           # SPA index
```

## Deployment

The following steps illustrate deploying to Heroku, but it is not a requirement.
A different PaaS provider could be easily substituted.

### Heroku first time setup

Run the production build task and set up a git remote for your heroku deployment:

1. Run `npm run build`
1. Commit everything: `git commit -am "new release"`
1. Create an app on Heroku: `heroku create`
1. Add the remote heroku branch: i.e. `git remote add production https://git.heroku.com/your-heroku-appname.git`
1. Set Environment vars: i.e. `heroku config:set NODE_ENV=production`

        NODE_ENV:         production
        STATIC_INSTANCE:  1
        STATIC_REV_PROXY: 1
        STATIC_SSL:       1
        STATIC_WEBROOT:   ./www-root

1. Deploy the code: `git push production master`
1. Visit the app: `heroku open`

### New releases to Heroku

Re-running the build task will overlay the changed files in the dist folder. Commit the updates and push
to your PaaS provider.

1. Bump the version: `npm version patch` (or minor, major, [etc.](https://docs.npmjs.com/cli/version))
1. Generate the deployment artifacts: `npm run build`
1. Commit new updates: `git commit -am "new release"`
1. Deploy the code: `git push production master`
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
