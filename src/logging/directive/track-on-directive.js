'use strict';

var angular = require('angular');

module.exports = trackOnDirective;

/**
 * track-on directive for declarative logging of html elements
 *
 * Use track-on, track-event, track-if, and track-properties attributes
 * for enabling event tracking on specific HTML elements:
 *
 * <a href="file.pdf"
 *    track-on="click"
 *    track-if="myScope.shouldTrack"
 *    track-event="Download"
 *    track-properties="{ category: 'Content Actions' }" ~or~ track-category="Content Actions"
 *    >Download</a>
 *
 * `track-on` lets you specify the DOM event that triggers the event tracking.
 * Without a value it will infer 'change' for form inputs, and 'click' for all other elements.
 *
 * `track-event` is the event name to be sent. Without a value it will infer one from the
 * element type and/or id, name, innerHtml, etc.
 *
 * `track-if` is an optional conditional check. If the attribute value evaluates to a falsey,
 * the event will NOT be fired. Useful for user tracking opt-out, etc.
 *
 * Additional properties (for example, category as required by GA) may be specified
 * by adding `track-*` attributes.
 *
 * Heavily based on: https://github.com/luisfarzati/angulartics
 */
// @ngInject
function trackOnDirective(serverLogger) {
    var namePrefix = 'track';

    return {
        priority: 5,
        restrict: 'A',
        link: trackOnLink
    };

    // @ngInject
    function trackOnLink($scope, $element, $attrs) {
        var eventType = $attrs.trackOn || inferEventType($element[0]);
        var trackingData = {};

        angular.forEach($attrs.$attr, function(attr, name) {
            if (!isProperty(name)) { return; }

            var propName = propertyName(name);
            trackingData[propName] = $attrs[name];
            $attrs.$observe(name, function(value) {
                trackingData[propName] = value;
            });
        });

        angular.element($element[0]).bind(eventType, function($event) {
            if ($attrs.trackIf && (!$scope.$eval($attrs.trackIf))) {
                return; // Cancel this event if we don't pass the track-if condition
            }

            var eventType = $event.type;
            trackingData.tag = getElementTagType($element[0]);
            trackingData.id = $attrs.trackEvent || inferEventName($element[0]);
            trackingData.value = elementValueInterpretation($element[0]);

            // Allow components to pass through an expression that gets merged on to the event properties
            // eg. track-properites='myComponentScope.someConfigExpression.$trackProperties'
            if ($attrs.trackProperties) {
                angular.extend(trackingData, $scope.$eval($attrs.trackProperties));
            }
            serverLogger.trackEvent(eventType, trackingData);
        });
    }

    function elementValueInterpretation(element) {
        var tagType = getElementTagType(element);
        if (tagType === 'input:password' || !isInput(element)) { return null; }

        var interpretation = {
            length: null,
            value: null,
            checked: null
        };
        if (tagType === 'select:') {
            var numSelected = 0;
            if (element.multiple) {
                for (var i = 0; i < element.options.length; i++) {
                    if (element.options[i].selected) { numSelected++; }
                }
            } else if (element.selectedIndex >= 0 && element.options[element.selectedIndex]) {
                numSelected = 1;
                interpretation.length = element.options[element.selectedIndex].value.length;
            }
            interpretation.value = 'selected ' + numSelected + ' item(s)';
        } else {
            interpretation.value = matchValueType(element.value);
            interpretation.length = element.value.length;
            if (['input:radio', 'input:checkbox'].indexOf(tagType) >= 0) {
                interpretation.checked = element.checked;
            }
        }
        return interpretation;
    }

    function matchValueType(value) {
        var valType = 'string';
        if (value === '') {
            valType = 'empty';
        } else if (/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value)) {
            valType = 'email';
        } else if (
            /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/.test(value) ||  // day, month, and year
            /^(\d{4}[\/\-](0?[1-9]|1[012])[\/\-]0?[1-9]|[12][0-9]|3[01])$/.test(value)     // year, month, and day
        ) {
            valType = 'date';
        } else if (/^\s+$/.test(value)) {
            valType = 'whitespace';
        } else if (/^\d+$/.test(value)) {
            valType = 'numeric';
        } else if (/^[a-zA-Z]+$/.test(value)) {
            valType = 'alpha';
        } else if (/^[a-zA-Z0-9]+$/.test(value)) {
            valType = 'alphanumeric';
        }
        return valType;
    }

    function getElementTagType(element) {
        return element.tagName.toLowerCase() + ':' + (element.type || '');
    }

    function isCommand(element) {
        return ['a:', 'button:', 'button:button', 'button:submit', 'input:button', 'input:submit'].indexOf(
                getElementTagType(element)
            ) >= 0;
    }

    function isInput(element) {
        return ['input:checkbox', 'input:color', 'input:date', 'input:datetime', 'input:datetime-local',
                'input:email', 'input:file', 'input:month', 'input:number', 'input:password',
                'input:radio', 'input:range', 'input:search', 'input:tel', 'input:text', 'input:time',
                'input:url', 'input:week', 'textarea:', 'select:'].indexOf(
                getElementTagType(element)
            ) >= 0;
    }

    function inferEventType(element) {
        if (isCommand(element)) { return 'click'; }
        if (isInput(element))   { return 'change'; }
        return 'click';
    }

    function inferEventName(element) {
        if (isCommand(element)) { return element.innerText || element.value; }
        return element.id || element.name || element.tagName;
    }

    function isProperty(name) {
        return (name.substr(0, namePrefix.length) === namePrefix) &&
            ['On', 'Event', 'If', 'Properties', 'EventType'].indexOf(name.substr(namePrefix.length)) === -1;
    }

    function propertyName(name) {
        var s = name.slice(namePrefix.length);
        return (s.length > 0) ? s.toLowerCase() : s;
    }
}
