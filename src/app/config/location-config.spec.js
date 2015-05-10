/*jshint -W030 */
var expect = require('chai').expect;
var sinon = require('sinon');
var locationConfig = require('./location-config');

describe('app', function() {
    describe('locationConfig', function() {
        it('should export', function() {
            expect(locationConfig).to.be.a('function');
        });

        it('should configure locationProvider', function() {
            [{
                bootConfig: {isHtml5ModeEnabled: true},
                expected: {html5ModeCalledWith: true}
            }, {
                bootConfig: {}, // Test default condition
                expected: {html5ModeCalledWith: false}
            }]
            .forEach(function(testData) {
                var bootConfig = testData.bootConfig;
                var locationProvider = {
                    html5Mode: sinon.spy()
                };
                locationConfig(locationProvider, bootConfig);
                expect(locationProvider.html5Mode.called).to.be.true;
                expect(locationProvider.html5Mode.getCall(0)
                    .calledWith(testData.expected.html5ModeCalledWith)).to.be.true;
            });
        });
    });
});
