/*jshint -W030, -W098 */
var _ = require('lodash');
var expect = require('chai').expect;
var sinon = require('sinon');

// Example mocking with proxyquireify
// https://github.com/thlorenz/proxyquireify
var proxyquire = require('proxyquireify')(require);
var scriptjsStub = sinon.stub();

var angularStub = {
    module: sinon.stub(),
    config: sinon.stub(),
    service: sinon.stub(),
    factory: sinon.stub(),
    directive: sinon.stub(),
    constant: sinon.stub(),
    run: sinon.stub(),
    bootstrap: sinon.stub()
};
// Support chaining
_.forEach(angularStub, function(v) { v.returns(angularStub); });

var configStub = {
    log: 'logConfig',
    compile: 'compileConfig',
    location: 'locationConfig',
    router: 'routerConfig',
    translate: 'translateConfig'
};
var partialsStub = {
    nav: {name: 'nav'},
    home: {name: 'home'},
    login: {name: 'login'},
    chat: {name: 'chat'}
};
var serviceStub = {
    translateStorage: 'translateStorage'
};
var directiveStub = {
    spaNav: 'spaNav'
};

// Mock App's require statements
var App = proxyquire('./app', {
    scriptjs: scriptjsStub,
    'angular': angularStub,
    'angular-ui-router': 'angular-ui-router',
    'angular-translate': 'angular-translate',
    './config': configStub,
    './partials': partialsStub,
    './service': serviceStub,
    './directive': directiveStub,
    '../modules/session/session-module': 'session',
    '../modules/logging/logging-module': 'logging',
    '../modules/error/error-module': 'error',
    '../modules/notifications/notifications-module': 'notifications',
    '../modules/auth/auth-module': 'auth',
    '../modules/todo/todo-module': 'todo',
    // By default proxyquireify calls the function defined on the
    // original dependency whenever it is not found on the stub.
    '@noCallThru': true  // Prevent call thru for all contained stubs.
});

describe('app', function() {
    var app;
    var injectorStub;
    var httpStub;
    var spaBootServicePromise;

    beforeEach(function() {
        // Example setup for service call at boot time...
        spaBootServicePromise = { then: sinon.stub() };
        spaBootServicePromise.then.yields({ data: { foo: 'bar' } });

        httpStub = { get: sinon.stub() };
        httpStub.get.withArgs('/api/boot-service').returns(spaBootServicePromise);

        injectorStub = { get: sinon.stub() };
        injectorStub.get.withArgs('$http').returns(httpStub);
    });

    afterEach(function() {
        scriptjsStub.reset();
    });

    it('should bootstrap', function() {
        var documentClone = document.cloneNode(true);
        app = new App();
        app.bootstrap(false, documentClone, injectorStub);
        expect(app.module).to.be.a('object');
    });

    it('should bootstrap with stubs', function() {
        app = new App({ isStubsEnabled: true });
        //spaBootServicePromise.then.yields({ data: { foo: 'something-else' } });
        scriptjsStub.yields();

        var documentClone = document.cloneNode(true);
        app.bootstrap(false, documentClone, injectorStub);
        expect(app.module).to.be.a('object');
    });
});
