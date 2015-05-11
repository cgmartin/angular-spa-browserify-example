/*jshint -W030,-W098 */
var expect = require('chai').expect;
var sinon = require('sinon');
var translateConfig = require('./translate-config');

describe('app', function() {
    describe('translateConfig', function() {

        it('should export', function() {
            expect(translateConfig).to.be.a('function');
        });

        it('should configure translateProvider', function() {
            [{
                bootConfig: {preferredLanguage: 'fr'},
                expected: {preferredLanguageCalledWith: 'fr'}
            }, {
                bootConfig: {}, // Test default condition
                expected: {preferredLanguageCalledWith: 'en'}
            }]
            .forEach(function(testData) {
                var bootConfig = testData.bootConfig;
                var translateProvider = {
                    preferredLanguage: sinon.spy()
                };
                translateConfig(translateProvider, bootConfig);
                expect(translateProvider.preferredLanguage.called).to.be.true;
                expect(translateProvider.preferredLanguage.getCall(0)
                    .calledWith(testData.expected.preferredLanguageCalledWith)).to.be.true;
            });
        });

    });
});
