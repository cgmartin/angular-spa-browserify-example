/*jshint -W030,-W098 */
var expect = require('chai').expect;
var sinon = require('sinon');
var compileConfig = require('./compile-config');

describe('app', function() {
    describe('compileConfig', function() {

        it('should export', function() {
            expect(compileConfig).to.be.a('function');
        });

        it('should configure compileProvider', function() {
            [{
                bootConfig: {isDebugInfoEnabled: false},
                expected: {debugInfoEnabledCalledWith: false}
            }, {
                bootConfig: {}, // Test default condition
                expected: {debugInfoEnabledCalledWith: true}
            }]
            .forEach(function(testData) {
                var bootConfig = testData.bootConfig;
                var compileProvider = {
                    debugInfoEnabled: sinon.spy()
                };
                compileConfig(compileProvider, bootConfig);
                expect(compileProvider.debugInfoEnabled.called).to.be.true;
                expect(compileProvider.debugInfoEnabled.getCall(0)
                    .calledWith(testData.expected.debugInfoEnabledCalledWith)).to.be.true;
            });
        });

    });
});
