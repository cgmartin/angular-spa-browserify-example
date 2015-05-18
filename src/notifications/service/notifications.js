'use strict';

var angular = require('angular');

module.exports = Notifications;

/**
 * Notification service
 * Forked & modified from: https://github.com/cgross/angular-notify
 */
function Notifications(notifyConfig, $timeout, $http, $compile, $templateCache, $rootScope) {

    var messageElements = [];
    var openNotificationsScope = [];

    this.notify = function(args) {

        if (typeof args !== 'object') {
            args = { message: args };
        }

        var notification = angular.extend({}, notifyConfig, args);

        var scope = notification.scope ? notification.scope.$new() : $rootScope.$new();
        scope.$position = notification.position;
        scope.$message = notification.message;
        scope.$classes = notification.classes;

        if (notification.maximumOpen > 0) {
            var numToClose = (openNotificationsScope.length + 1) - notification.maximumOpen;
            for (var i = 0; i < numToClose; i++) {
                openNotificationsScope[i].$close();
            }
        }

        $http.get(notification.templateUrl, {cache: $templateCache}).success(function(template) {

            var templateElement = $compile(template)(scope);
            templateElement.bind(
                'webkitTransitionEnd oTransitionEnd otransitionend transitionend msTransitionEnd',
                function(e) {
                    if (e.propertyName === 'opacity' || e.currentTarget.style.opacity === 0 ||
                        (e.originalEvent && e.originalEvent.propertyName === 'opacity')) {

                        templateElement.remove();
                        messageElements.splice(messageElements.indexOf(templateElement), 1);
                        openNotificationsScope.splice(openNotificationsScope.indexOf(scope), 1);
                        layoutMessages();
                    }
                });

            angular.element(notification.container).append(templateElement);
            messageElements.push(templateElement);

            if (scope.$position === 'center') {
                $timeout(function() {
                    scope.$centerMargin = '-' + (templateElement[0].offsetWidth / 2) + 'px';
                });
            }

            scope.$close = function() {
                templateElement.css('opacity', 0).attr('data-closing', 'true');
                layoutMessages();
            };

            var layoutMessages = function() {
                var j = 0;
                var currentY = notification.startTop;
                for (var i = messageElements.length - 1; i >= 0; i --) {
                    var shadowHeight = 10;
                    var element = messageElements[i];
                    var height = element[0].offsetHeight;
                    var top = currentY + height + shadowHeight;
                    if (element.attr('data-closing')) {
                        top += 20;
                    } else {
                        currentY += height + notification.verticalSpacing;
                    }
                    element
                        .css('top', top + 'px')
                        .css('margin-top', '-' + (height + shadowHeight) + 'px')
                        .css('visibility', 'visible');
                    j++;
                }
            };

            $timeout(function() {
                layoutMessages();
            });

            if (notification.duration > 0) {
                $timeout(function() {
                    scope.$close();
                }, notification.duration);
            }

        }).error(function(data) {
            throw new Error('Template specified for notify service (' + notification.templateUrl + ')' +
                ' could not be loaded. ' + data);
        });

        var retVal = {};

        retVal.close = function() {
            if (scope.$close) {
                scope.$close();
            }
        };

        Object.defineProperty(retVal, 'message', {
            get: function() {
                return scope.$message;
            },
            set: function(val) {
                scope.$message = val;
            }
        });

        openNotificationsScope.push(scope);

        return retVal;
    };

    this.closeAll = function() {
        for (var i = messageElements.length - 1; i >= 0; i --) {
            var element = messageElements[i];
            element.css('opacity', 0);
        }
    };
}
