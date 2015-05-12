'use strict';

module.exports = TranslateStorage;

// @ngInject
function TranslateStorage($window) {
    var langKey = null;
    var hasLocalStorageSupport = (function() {
        var hasSupport = 'localStorage' in $window;
        if (hasSupport) {
            var testKey = 'ngSPA.translate.storageTest';
            try {
                // this check have to be wrapped within a try/catch because on
                // a SecurityError: Dom Exception 18 on iOS
                if ($window.localStorage !== null) {
                    $window.localStorage.setItem(testKey, 'foo');
                    $window.localStorage.removeItem(testKey);
                    hasSupport = true;
                } else {
                    hasSupport = false;
                }
            } catch (e) {
                hasSupport = false;
            }
        }
        return hasSupport;
    })();

    this.get = function(name) {
        if (!langKey && hasLocalStorageSupport) {
            langKey = $window.localStorage.getItem(name);
        }
        return langKey;
    };

    this.set = function(name, value) {
        langKey = value;
        if (hasLocalStorageSupport) {
            $window.localStorage.setItem(name, value);
        }
    };
    this.put = this.set;
}

