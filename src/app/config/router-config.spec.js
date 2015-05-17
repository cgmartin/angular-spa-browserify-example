/*jshint -W030,-W098 */
var expect = require('chai').expect;
var sinon = require('sinon');
var routerConfig = require('./router-config');

describe('app', function() {
    describe('routerConfig', function() {
        it('should export', function() {
            expect(routerConfig).to.be.a('function');
        });

        it('should configure stateProvider', function() {
            var stateProvider = {
                state: sinon.stub()
            };
            stateProvider.state.returns(stateProvider); // For chaining

            var urlRouterProvider = {
                when: sinon.stub(),
                otherwise: sinon.spy()
            };
            routerConfig(stateProvider, urlRouterProvider);
            expect(stateProvider.state.called).to.be.true;
            expect(urlRouterProvider.when.called).to.be.true;
            //expect(urlRouterProvider.otherwise.called).to.be.true;
        });
    });
});
