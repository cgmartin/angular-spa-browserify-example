/*jshint -W030, -W098 */
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
angularStub.module.returns(angularStub);
angularStub.config.returns(angularStub);
angularStub.service.returns(angularStub);
angularStub.factory.returns(angularStub);
angularStub.directive.returns(angularStub);
angularStub.constant.returns(angularStub);
angularStub.run.returns(angularStub);

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

var App = proxyquire('./app', {
    scriptjs: scriptjsStub,
    'angular': angularStub,
    'angular-ui-router': 'angular-ui-router',
    'angular-translate': 'angular-translate',
    './config': configStub,
    './partials': partialsStub,
    './service': serviceStub,
    './directive': directiveStub,
    // By default proxyquireify calls the function defined on the
    // original dependency whenever it is not found on the stub.
    '@noCallThru': true  // Prevent call thru for all contained stubs.
});

describe('app', function() {
    var app;
    var injectorStub;
    var httpStub;
    var spaBootJsonPromise;

    beforeEach(function() {
        app = new App();

        spaBootJsonPromise = { then: sinon.stub() };
        spaBootJsonPromise.then.yields({ data: { isStubsEnabled: false } });

        httpStub = { get: sinon.stub() };
        httpStub.get.withArgs('/spa-boot.json').returns(spaBootJsonPromise);

        injectorStub = { get: sinon.stub() };
        injectorStub.get.withArgs('$http').returns(httpStub);
    });

    afterEach(function() {
        scriptjsStub.reset();
    });

    it('should bootstrap', function() {
        var documentClone = document.cloneNode(true);
        app.bootstrap(false, documentClone, injectorStub);
        expect(app.module).to.be.a('object');
    });

    it('should bootstrap with stubs', function() {
        spaBootJsonPromise.then.yields({ data: { isStubsEnabled: true } });
        scriptjsStub.yields();

        var documentClone = document.cloneNode(true);
        app.bootstrap(false, documentClone, injectorStub);
        expect(app.module).to.be.a('object');
    });
});
