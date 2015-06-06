/*jshint -W030,-W098 */
var expect = require('chai').expect;
var sinon = require('sinon');
var logConfig = require('./log-config');

describe('app', function() {
    describe('logConfig', function() {

        it('should export', function() {
            expect(logConfig).to.be.a('function');
        });

        it('should configure logConfig', function() {
            [{
                bootConfig: {isLogDebugEnabled: false},
                expected: {debugEnabledCalledWith: false}
            }, {
                bootConfig: {}, // Test default condition
                expected: {debugEnabledCalledWith: true}
            }]
            .forEach(function(testData) {
                var bootConfig = testData.bootConfig;
                var logProvider = {
                    debugEnabled: sinon.spy()
                };
                logConfig(logProvider, bootConfig);
                expect(logProvider.debugEnabled.called).to.be.true;
                expect(logProvider.debugEnabled.getCall(0)
                    .calledWith(testData.expected.debugEnabledCalledWith)).to.be.true;
            });
        });

    });
});
