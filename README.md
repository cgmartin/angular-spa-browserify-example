# angular-spa-typescript-example

[![Build Status](https://travis-ci.org/cgmartin/angular-spa-browserify-example.svg?branch=master)](https://travis-ci.org/cgmartin/angular-spa-browserify-example)
[![Dependency Status](https://david-dm.org/cgmartin/angular-spa-browserify-example.svg)](https://david-dm.org/cgmartin/angular-spa-browserify-example)
[![devDependency Status](https://david-dm.org/cgmartin/angular-spa-browserify-example/dev-status.svg)](https://david-dm.org/cgmartin/angular-spa-browserify-example#info=devDependencies)

## Synopsis

Demonstrates using Browserify require('modules') in a client-side Angular single page application with Mocha unit tests and Gulp tasks.

**Caution:** This is an experimental playground that I'm using to learn Browserify. Use at your own risk.
If you run across anything here that could be done better, I'd love the feedback.

This client project is meant to accompany a set of Node.js microservices (REST webservice, Chat Server, Static Server, Reverse Proxy),
and is designed with portability in mind (see [Twelve Factors](http://12factor.net/)).

Application configuration is separated from the application by an initial `/spa-boot.json` request, which can be
deployed as a file or routed to a backing service (depending on environment).

## Features

* Bootstrap angular with dynamic configuration.
* Fake HTTP backend stubs for standalone testing, which are conditionally loaded via separate JS bundle.
* Todo MVC module to demonstrate backend requests
* Server-side logging module, with exception handler using stacktrace.js.
* Unit testing examples with karma/mocha/chai/sinon/proxyquireify.
* Custom LESS bootstrap & font-awesome builds.
* Angular ui-router, I18n, TodoMVC examples.
* No Bower!

## Installation

1. Install [Node.js](https://nodejs.org/download/)
1. Install Gulp/Karma: `npm -g i gulp karma`
1. Clone this repo
1. Install dependencies: `npm i`
1. Start the app in dev mode: `npm start`
1. Point browser to <http://localhost:3000/>

After installation, the following actions are available:

* `npm start` : Builds for development, runs a local webserver, and watches for changes.
* `npm test` : Runs TypeScript file linting and unit tests once.
* `karma start` : Runs unit tests continuously, watching for changes.
* `npm run build` : Builds a production distribution under the `dist/` folder, for deployment to a static webserver or CDN.

## Folder Structure

```
├── coverage                 # Coverage reports
├── dist                     # Build destination
└── src
    ├── app                  # Application Module
    │   ├── config
    │   ├── directive
    │   ├── partials
    │   └── service
    ├── images
    ├── lib                  # Global utilities
    ├── logging              # Server logging module
    │   ├── config
    │   ├── factory
    │   ├── provider
    │   ├── run
    │   └── service
    ├── styles               # Global styles
    ├── todo                 # Todo MVC Module
    │   ├── config
    │   ├── controller
    │   ├── directive
    │   ├── model
    │   ├── partials
    │   ├── service
    │   └── styles
    ├── www-root             # Static files under web root
    │   ├── lang             # Language bundles
    │   └── spa-boot.json    # Boot configuration file
    ├── main.js              # Main JS bundle entrypoint
    ├── stubs.js             # Fake HTTP stub bundle entrypoint
    └── index.html           # SPA index
```

## Libraries & Tools

The functionality has been implemented by integrating the following 3rd-party tools and libraries:

 - [Browserify](http://browserify.org/): Browserify lets you require('modules') in the browser by bundling up all of your dependencies
 - [AngularJS v1](http://angularjs.org/): Superheroic JavaScript MVW Framework
 - [Twitter Bootstrap v3](http://getbootstrap.com/): HTML, CSS, and JS framework for developing responsive, mobile first projects on the web
 - [Font Awesome](http://fontawesome.io/): The iconic font and CSS toolkit
 - [Stacktrace.js](http://www.stacktracejs.com/): Cross-browser stack traces
 - [Gulp](http://gulpjs.com/): Streaming build system and task runner
 - [Node.js](http://nodejs.org/api/): JavaScript runtime environment for server-side development
 - [Karma](http://karma-runner.github.io/): Spectacular Test Runner for Javascript
 - [Mocha](http://mochajs.org/): The fun, simple, flexible JavaScript test framework
 - [Chai](http://chaijs.com/): BDD/TDD assertion library for node and the browser
 - [Sinon](http://sinonjs.org/): Standalone test spies, stubs and mocks for JavaScript
 - [Proxyquireify](https://github.com/thlorenz/proxyquireify): Override dependencies during testing

## License

[MIT License](http://cgm.mit-license.org/)  Copyright © 2015 Christopher Martin
