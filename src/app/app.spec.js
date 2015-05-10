/*jshint -W030 */
var expect = require('chai').expect;
var sinon = require('sinon');
var angular = require('angular');
var angularMocks = require('angular-mocks');
var App = require('./app');

describe('app', function() {
    var app;
    var $httpBackend;
    var bootConfigRequestHandler;

    beforeEach(function() {
        app = new App();
    });

    beforeEach(inject(function($injector) {
        // Set up the mock http service responses
        $httpBackend = $injector.get('$httpBackend');
        // backend definition common for all tests
        bootConfigRequestHandler = $httpBackend
            .when('GET', '/spa-boot.json')
            .respond({
                isDbugInfoEnabled: true,
                isHtml5ModeEnabled: false,
                isStubsEnabled: false,
                apiBaseUrl: '/api/'
            });
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should create default name', function() {
        expect(app.getName()).to.eql('app');
    });

    it('should bootstrap', inject(function($injector) {
        // Clone document in case we want to bootstrap again.
        // Bootstrap is not designed to "unbootstrap", must destroy
        // DOM element to achieve this.
        var documentClone = document.cloneNode(true);

        $httpBackend.expectGET('/spa-boot.json');
        app.bootstrap(false, documentClone, $injector);
        $httpBackend.flush();

        var appModule = angular.module('app');
        expect(appModule).to.be.an('object');
        expect(app.module).to.eql(appModule);
    }));
});
