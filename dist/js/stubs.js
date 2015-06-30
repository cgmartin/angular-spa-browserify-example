(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @license AngularJS v1.4.0
 * (c) 2010-2015 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular, undefined) {

'use strict';

/**
 * @ngdoc object
 * @name angular.mock
 * @description
 *
 * Namespace from 'angular-mocks.js' which contains testing related code.
 */
angular.mock = {};

/**
 * ! This is a private undocumented service !
 *
 * @name $browser
 *
 * @description
 * This service is a mock implementation of {@link ng.$browser}. It provides fake
 * implementation for commonly used browser apis that are hard to test, e.g. setTimeout, xhr,
 * cookies, etc...
 *
 * The api of this service is the same as that of the real {@link ng.$browser $browser}, except
 * that there are several helper methods available which can be used in tests.
 */
angular.mock.$BrowserProvider = function() {
  this.$get = function() {
    return new angular.mock.$Browser();
  };
};

angular.mock.$Browser = function() {
  var self = this;

  this.isMock = true;
  self.$$url = "http://server/";
  self.$$lastUrl = self.$$url; // used by url polling fn
  self.pollFns = [];

  // TODO(vojta): remove this temporary api
  self.$$completeOutstandingRequest = angular.noop;
  self.$$incOutstandingRequestCount = angular.noop;


  // register url polling fn

  self.onUrlChange = function(listener) {
    self.pollFns.push(
      function() {
        if (self.$$lastUrl !== self.$$url || self.$$state !== self.$$lastState) {
          self.$$lastUrl = self.$$url;
          self.$$lastState = self.$$state;
          listener(self.$$url, self.$$state);
        }
      }
    );

    return listener;
  };

  self.$$applicationDestroyed = angular.noop;
  self.$$checkUrlChange = angular.noop;

  self.deferredFns = [];
  self.deferredNextId = 0;

  self.defer = function(fn, delay) {
    delay = delay || 0;
    self.deferredFns.push({time:(self.defer.now + delay), fn:fn, id: self.deferredNextId});
    self.deferredFns.sort(function(a, b) { return a.time - b.time;});
    return self.deferredNextId++;
  };


  /**
   * @name $browser#defer.now
   *
   * @description
   * Current milliseconds mock time.
   */
  self.defer.now = 0;


  self.defer.cancel = function(deferId) {
    var fnIndex;

    angular.forEach(self.deferredFns, function(fn, index) {
      if (fn.id === deferId) fnIndex = index;
    });

    if (fnIndex !== undefined) {
      self.deferredFns.splice(fnIndex, 1);
      return true;
    }

    return false;
  };


  /**
   * @name $browser#defer.flush
   *
   * @description
   * Flushes all pending requests and executes the defer callbacks.
   *
   * @param {number=} number of milliseconds to flush. See {@link #defer.now}
   */
  self.defer.flush = function(delay) {
    if (angular.isDefined(delay)) {
      self.defer.now += delay;
    } else {
      if (self.deferredFns.length) {
        self.defer.now = self.deferredFns[self.deferredFns.length - 1].time;
      } else {
        throw new Error('No deferred tasks to be flushed');
      }
    }

    while (self.deferredFns.length && self.deferredFns[0].time <= self.defer.now) {
      self.deferredFns.shift().fn();
    }
  };

  self.$$baseHref = '/';
  self.baseHref = function() {
    return this.$$baseHref;
  };
};
angular.mock.$Browser.prototype = {

/**
  * @name $browser#poll
  *
  * @description
  * run all fns in pollFns
  */
  poll: function poll() {
    angular.forEach(this.pollFns, function(pollFn) {
      pollFn();
    });
  },

  url: function(url, replace, state) {
    if (angular.isUndefined(state)) {
      state = null;
    }
    if (url) {
      this.$$url = url;
      // Native pushState serializes & copies the object; simulate it.
      this.$$state = angular.copy(state);
      return this;
    }

    return this.$$url;
  },

  state: function() {
    return this.$$state;
  },

  notifyWhenNoOutstandingRequests: function(fn) {
    fn();
  }
};


/**
 * @ngdoc provider
 * @name $exceptionHandlerProvider
 *
 * @description
 * Configures the mock implementation of {@link ng.$exceptionHandler} to rethrow or to log errors
 * passed to the `$exceptionHandler`.
 */

/**
 * @ngdoc service
 * @name $exceptionHandler
 *
 * @description
 * Mock implementation of {@link ng.$exceptionHandler} that rethrows or logs errors passed
 * to it. See {@link ngMock.$exceptionHandlerProvider $exceptionHandlerProvider} for configuration
 * information.
 *
 *
 * ```js
 *   describe('$exceptionHandlerProvider', function() {
 *
 *     it('should capture log messages and exceptions', function() {
 *
 *       module(function($exceptionHandlerProvider) {
 *         $exceptionHandlerProvider.mode('log');
 *       });
 *
 *       inject(function($log, $exceptionHandler, $timeout) {
 *         $timeout(function() { $log.log(1); });
 *         $timeout(function() { $log.log(2); throw 'banana peel'; });
 *         $timeout(function() { $log.log(3); });
 *         expect($exceptionHandler.errors).toEqual([]);
 *         expect($log.assertEmpty());
 *         $timeout.flush();
 *         expect($exceptionHandler.errors).toEqual(['banana peel']);
 *         expect($log.log.logs).toEqual([[1], [2], [3]]);
 *       });
 *     });
 *   });
 * ```
 */

angular.mock.$ExceptionHandlerProvider = function() {
  var handler;

  /**
   * @ngdoc method
   * @name $exceptionHandlerProvider#mode
   *
   * @description
   * Sets the logging mode.
   *
   * @param {string} mode Mode of operation, defaults to `rethrow`.
   *
   *   - `log`: Sometimes it is desirable to test that an error is thrown, for this case the `log`
   *            mode stores an array of errors in `$exceptionHandler.errors`, to allow later
   *            assertion of them. See {@link ngMock.$log#assertEmpty assertEmpty()} and
   *            {@link ngMock.$log#reset reset()}
   *   - `rethrow`: If any errors are passed to the handler in tests, it typically means that there
   *                is a bug in the application or test, so this mock will make these tests fail.
   *                For any implementations that expect exceptions to be thrown, the `rethrow` mode
   *                will also maintain a log of thrown errors.
   */
  this.mode = function(mode) {

    switch (mode) {
      case 'log':
      case 'rethrow':
        var errors = [];
        handler = function(e) {
          if (arguments.length == 1) {
            errors.push(e);
          } else {
            errors.push([].slice.call(arguments, 0));
          }
          if (mode === "rethrow") {
            throw e;
          }
        };
        handler.errors = errors;
        break;
      default:
        throw new Error("Unknown mode '" + mode + "', only 'log'/'rethrow' modes are allowed!");
    }
  };

  this.$get = function() {
    return handler;
  };

  this.mode('rethrow');
};


/**
 * @ngdoc service
 * @name $log
 *
 * @description
 * Mock implementation of {@link ng.$log} that gathers all logged messages in arrays
 * (one array per logging level). These arrays are exposed as `logs` property of each of the
 * level-specific log function, e.g. for level `error` the array is exposed as `$log.error.logs`.
 *
 */
angular.mock.$LogProvider = function() {
  var debug = true;

  function concat(array1, array2, index) {
    return array1.concat(Array.prototype.slice.call(array2, index));
  }

  this.debugEnabled = function(flag) {
    if (angular.isDefined(flag)) {
      debug = flag;
      return this;
    } else {
      return debug;
    }
  };

  this.$get = function() {
    var $log = {
      log: function() { $log.log.logs.push(concat([], arguments, 0)); },
      warn: function() { $log.warn.logs.push(concat([], arguments, 0)); },
      info: function() { $log.info.logs.push(concat([], arguments, 0)); },
      error: function() { $log.error.logs.push(concat([], arguments, 0)); },
      debug: function() {
        if (debug) {
          $log.debug.logs.push(concat([], arguments, 0));
        }
      }
    };

    /**
     * @ngdoc method
     * @name $log#reset
     *
     * @description
     * Reset all of the logging arrays to empty.
     */
    $log.reset = function() {
      /**
       * @ngdoc property
       * @name $log#log.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#log `log()`}.
       *
       * @example
       * ```js
       * $log.log('Some Log');
       * var first = $log.log.logs.unshift();
       * ```
       */
      $log.log.logs = [];
      /**
       * @ngdoc property
       * @name $log#info.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#info `info()`}.
       *
       * @example
       * ```js
       * $log.info('Some Info');
       * var first = $log.info.logs.unshift();
       * ```
       */
      $log.info.logs = [];
      /**
       * @ngdoc property
       * @name $log#warn.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#warn `warn()`}.
       *
       * @example
       * ```js
       * $log.warn('Some Warning');
       * var first = $log.warn.logs.unshift();
       * ```
       */
      $log.warn.logs = [];
      /**
       * @ngdoc property
       * @name $log#error.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#error `error()`}.
       *
       * @example
       * ```js
       * $log.error('Some Error');
       * var first = $log.error.logs.unshift();
       * ```
       */
      $log.error.logs = [];
        /**
       * @ngdoc property
       * @name $log#debug.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#debug `debug()`}.
       *
       * @example
       * ```js
       * $log.debug('Some Error');
       * var first = $log.debug.logs.unshift();
       * ```
       */
      $log.debug.logs = [];
    };

    /**
     * @ngdoc method
     * @name $log#assertEmpty
     *
     * @description
     * Assert that all of the logging methods have no logged messages. If any messages are present,
     * an exception is thrown.
     */
    $log.assertEmpty = function() {
      var errors = [];
      angular.forEach(['error', 'warn', 'info', 'log', 'debug'], function(logLevel) {
        angular.forEach($log[logLevel].logs, function(log) {
          angular.forEach(log, function(logItem) {
            errors.push('MOCK $log (' + logLevel + '): ' + String(logItem) + '\n' +
                        (logItem.stack || ''));
          });
        });
      });
      if (errors.length) {
        errors.unshift("Expected $log to be empty! Either a message was logged unexpectedly, or " +
          "an expected log message was not checked and removed:");
        errors.push('');
        throw new Error(errors.join('\n---------\n'));
      }
    };

    $log.reset();
    return $log;
  };
};


/**
 * @ngdoc service
 * @name $interval
 *
 * @description
 * Mock implementation of the $interval service.
 *
 * Use {@link ngMock.$interval#flush `$interval.flush(millis)`} to
 * move forward by `millis` milliseconds and trigger any functions scheduled to run in that
 * time.
 *
 * @param {function()} fn A function that should be called repeatedly.
 * @param {number} delay Number of milliseconds between each function call.
 * @param {number=} [count=0] Number of times to repeat. If not set, or 0, will repeat
 *   indefinitely.
 * @param {boolean=} [invokeApply=true] If set to `false` skips model dirty checking, otherwise
 *   will invoke `fn` within the {@link ng.$rootScope.Scope#$apply $apply} block.
 * @param {...*=} Pass additional parameters to the executed function.
 * @returns {promise} A promise which will be notified on each iteration.
 */
angular.mock.$IntervalProvider = function() {
  this.$get = ['$browser', '$rootScope', '$q', '$$q',
       function($browser,   $rootScope,   $q,   $$q) {
    var repeatFns = [],
        nextRepeatId = 0,
        now = 0;

    var $interval = function(fn, delay, count, invokeApply) {
      var hasParams = arguments.length > 4,
          args = hasParams ? Array.prototype.slice.call(arguments, 4) : [],
          iteration = 0,
          skipApply = (angular.isDefined(invokeApply) && !invokeApply),
          deferred = (skipApply ? $$q : $q).defer(),
          promise = deferred.promise;

      count = (angular.isDefined(count)) ? count : 0;
      promise.then(null, null, (!hasParams) ? fn : function() {
        fn.apply(null, args);
      });

      promise.$$intervalId = nextRepeatId;

      function tick() {
        deferred.notify(iteration++);

        if (count > 0 && iteration >= count) {
          var fnIndex;
          deferred.resolve(iteration);

          angular.forEach(repeatFns, function(fn, index) {
            if (fn.id === promise.$$intervalId) fnIndex = index;
          });

          if (fnIndex !== undefined) {
            repeatFns.splice(fnIndex, 1);
          }
        }

        if (skipApply) {
          $browser.defer.flush();
        } else {
          $rootScope.$apply();
        }
      }

      repeatFns.push({
        nextTime:(now + delay),
        delay: delay,
        fn: tick,
        id: nextRepeatId,
        deferred: deferred
      });
      repeatFns.sort(function(a, b) { return a.nextTime - b.nextTime;});

      nextRepeatId++;
      return promise;
    };
    /**
     * @ngdoc method
     * @name $interval#cancel
     *
     * @description
     * Cancels a task associated with the `promise`.
     *
     * @param {promise} promise A promise from calling the `$interval` function.
     * @returns {boolean} Returns `true` if the task was successfully cancelled.
     */
    $interval.cancel = function(promise) {
      if (!promise) return false;
      var fnIndex;

      angular.forEach(repeatFns, function(fn, index) {
        if (fn.id === promise.$$intervalId) fnIndex = index;
      });

      if (fnIndex !== undefined) {
        repeatFns[fnIndex].deferred.reject('canceled');
        repeatFns.splice(fnIndex, 1);
        return true;
      }

      return false;
    };

    /**
     * @ngdoc method
     * @name $interval#flush
     * @description
     *
     * Runs interval tasks scheduled to be run in the next `millis` milliseconds.
     *
     * @param {number=} millis maximum timeout amount to flush up until.
     *
     * @return {number} The amount of time moved forward.
     */
    $interval.flush = function(millis) {
      now += millis;
      while (repeatFns.length && repeatFns[0].nextTime <= now) {
        var task = repeatFns[0];
        task.fn();
        task.nextTime += task.delay;
        repeatFns.sort(function(a, b) { return a.nextTime - b.nextTime;});
      }
      return millis;
    };

    return $interval;
  }];
};


/* jshint -W101 */
/* The R_ISO8061_STR regex is never going to fit into the 100 char limit!
 * This directive should go inside the anonymous function but a bug in JSHint means that it would
 * not be enacted early enough to prevent the warning.
 */
var R_ISO8061_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?:\:?(\d\d)(?:\:?(\d\d)(?:\.(\d{3}))?)?)?(Z|([+-])(\d\d):?(\d\d)))?$/;

function jsonStringToDate(string) {
  var match;
  if (match = string.match(R_ISO8061_STR)) {
    var date = new Date(0),
        tzHour = 0,
        tzMin  = 0;
    if (match[9]) {
      tzHour = toInt(match[9] + match[10]);
      tzMin = toInt(match[9] + match[11]);
    }
    date.setUTCFullYear(toInt(match[1]), toInt(match[2]) - 1, toInt(match[3]));
    date.setUTCHours(toInt(match[4] || 0) - tzHour,
                     toInt(match[5] || 0) - tzMin,
                     toInt(match[6] || 0),
                     toInt(match[7] || 0));
    return date;
  }
  return string;
}

function toInt(str) {
  return parseInt(str, 10);
}

function padNumber(num, digits, trim) {
  var neg = '';
  if (num < 0) {
    neg =  '-';
    num = -num;
  }
  num = '' + num;
  while (num.length < digits) num = '0' + num;
  if (trim) {
    num = num.substr(num.length - digits);
  }
  return neg + num;
}


/**
 * @ngdoc type
 * @name angular.mock.TzDate
 * @description
 *
 * *NOTE*: this is not an injectable instance, just a globally available mock class of `Date`.
 *
 * Mock of the Date type which has its timezone specified via constructor arg.
 *
 * The main purpose is to create Date-like instances with timezone fixed to the specified timezone
 * offset, so that we can test code that depends on local timezone settings without dependency on
 * the time zone settings of the machine where the code is running.
 *
 * @param {number} offset Offset of the *desired* timezone in hours (fractions will be honored)
 * @param {(number|string)} timestamp Timestamp representing the desired time in *UTC*
 *
 * @example
 * !!!! WARNING !!!!!
 * This is not a complete Date object so only methods that were implemented can be called safely.
 * To make matters worse, TzDate instances inherit stuff from Date via a prototype.
 *
 * We do our best to intercept calls to "unimplemented" methods, but since the list of methods is
 * incomplete we might be missing some non-standard methods. This can result in errors like:
 * "Date.prototype.foo called on incompatible Object".
 *
 * ```js
 * var newYearInBratislava = new TzDate(-1, '2009-12-31T23:00:00Z');
 * newYearInBratislava.getTimezoneOffset() => -60;
 * newYearInBratislava.getFullYear() => 2010;
 * newYearInBratislava.getMonth() => 0;
 * newYearInBratislava.getDate() => 1;
 * newYearInBratislava.getHours() => 0;
 * newYearInBratislava.getMinutes() => 0;
 * newYearInBratislava.getSeconds() => 0;
 * ```
 *
 */
angular.mock.TzDate = function(offset, timestamp) {
  var self = new Date(0);
  if (angular.isString(timestamp)) {
    var tsStr = timestamp;

    self.origDate = jsonStringToDate(timestamp);

    timestamp = self.origDate.getTime();
    if (isNaN(timestamp)) {
      throw {
        name: "Illegal Argument",
        message: "Arg '" + tsStr + "' passed into TzDate constructor is not a valid date string"
      };
    }
  } else {
    self.origDate = new Date(timestamp);
  }

  var localOffset = new Date(timestamp).getTimezoneOffset();
  self.offsetDiff = localOffset * 60 * 1000 - offset * 1000 * 60 * 60;
  self.date = new Date(timestamp + self.offsetDiff);

  self.getTime = function() {
    return self.date.getTime() - self.offsetDiff;
  };

  self.toLocaleDateString = function() {
    return self.date.toLocaleDateString();
  };

  self.getFullYear = function() {
    return self.date.getFullYear();
  };

  self.getMonth = function() {
    return self.date.getMonth();
  };

  self.getDate = function() {
    return self.date.getDate();
  };

  self.getHours = function() {
    return self.date.getHours();
  };

  self.getMinutes = function() {
    return self.date.getMinutes();
  };

  self.getSeconds = function() {
    return self.date.getSeconds();
  };

  self.getMilliseconds = function() {
    return self.date.getMilliseconds();
  };

  self.getTimezoneOffset = function() {
    return offset * 60;
  };

  self.getUTCFullYear = function() {
    return self.origDate.getUTCFullYear();
  };

  self.getUTCMonth = function() {
    return self.origDate.getUTCMonth();
  };

  self.getUTCDate = function() {
    return self.origDate.getUTCDate();
  };

  self.getUTCHours = function() {
    return self.origDate.getUTCHours();
  };

  self.getUTCMinutes = function() {
    return self.origDate.getUTCMinutes();
  };

  self.getUTCSeconds = function() {
    return self.origDate.getUTCSeconds();
  };

  self.getUTCMilliseconds = function() {
    return self.origDate.getUTCMilliseconds();
  };

  self.getDay = function() {
    return self.date.getDay();
  };

  // provide this method only on browsers that already have it
  if (self.toISOString) {
    self.toISOString = function() {
      return padNumber(self.origDate.getUTCFullYear(), 4) + '-' +
            padNumber(self.origDate.getUTCMonth() + 1, 2) + '-' +
            padNumber(self.origDate.getUTCDate(), 2) + 'T' +
            padNumber(self.origDate.getUTCHours(), 2) + ':' +
            padNumber(self.origDate.getUTCMinutes(), 2) + ':' +
            padNumber(self.origDate.getUTCSeconds(), 2) + '.' +
            padNumber(self.origDate.getUTCMilliseconds(), 3) + 'Z';
    };
  }

  //hide all methods not implemented in this mock that the Date prototype exposes
  var unimplementedMethods = ['getUTCDay',
      'getYear', 'setDate', 'setFullYear', 'setHours', 'setMilliseconds',
      'setMinutes', 'setMonth', 'setSeconds', 'setTime', 'setUTCDate', 'setUTCFullYear',
      'setUTCHours', 'setUTCMilliseconds', 'setUTCMinutes', 'setUTCMonth', 'setUTCSeconds',
      'setYear', 'toDateString', 'toGMTString', 'toJSON', 'toLocaleFormat', 'toLocaleString',
      'toLocaleTimeString', 'toSource', 'toString', 'toTimeString', 'toUTCString', 'valueOf'];

  angular.forEach(unimplementedMethods, function(methodName) {
    self[methodName] = function() {
      throw new Error("Method '" + methodName + "' is not implemented in the TzDate mock");
    };
  });

  return self;
};

//make "tzDateInstance instanceof Date" return true
angular.mock.TzDate.prototype = Date.prototype;
/* jshint +W101 */

angular.mock.animate = angular.module('ngAnimateMock', ['ng'])

  .config(['$provide', function($provide) {

    var reflowQueue = [];
    $provide.value('$$animateReflow', function(fn) {
      var index = reflowQueue.length;
      reflowQueue.push(fn);
      return function cancel() {
        reflowQueue.splice(index, 1);
      };
    });

    $provide.decorator('$animate', ['$delegate', '$$asyncCallback', '$timeout', '$browser', '$$rAF',
                            function($delegate,   $$asyncCallback,   $timeout,   $browser,   $$rAF) {
      var animate = {
        queue: [],
        cancel: $delegate.cancel,
        enabled: $delegate.enabled,
        triggerCallbackEvents: function() {
          $$rAF.flush();
          $$asyncCallback.flush();
        },
        triggerCallbackPromise: function() {
          $timeout.flush(0);
        },
        triggerCallbacks: function() {
          this.triggerCallbackEvents();
          this.triggerCallbackPromise();
        },
        triggerReflow: function() {
          angular.forEach(reflowQueue, function(fn) {
            fn();
          });
          reflowQueue = [];
        }
      };

      angular.forEach(
        ['animate','enter','leave','move','addClass','removeClass','setClass'], function(method) {
        animate[method] = function() {
          animate.queue.push({
            event: method,
            element: arguments[0],
            options: arguments[arguments.length - 1],
            args: arguments
          });
          return $delegate[method].apply($delegate, arguments);
        };
      });

      return animate;
    }]);

  }]);


/**
 * @ngdoc function
 * @name angular.mock.dump
 * @description
 *
 * *NOTE*: this is not an injectable instance, just a globally available function.
 *
 * Method for serializing common angular objects (scope, elements, etc..) into strings, useful for
 * debugging.
 *
 * This method is also available on window, where it can be used to display objects on debug
 * console.
 *
 * @param {*} object - any object to turn into string.
 * @return {string} a serialized string of the argument
 */
angular.mock.dump = function(object) {
  return serialize(object);

  function serialize(object) {
    var out;

    if (angular.isElement(object)) {
      object = angular.element(object);
      out = angular.element('<div></div>');
      angular.forEach(object, function(element) {
        out.append(angular.element(element).clone());
      });
      out = out.html();
    } else if (angular.isArray(object)) {
      out = [];
      angular.forEach(object, function(o) {
        out.push(serialize(o));
      });
      out = '[ ' + out.join(', ') + ' ]';
    } else if (angular.isObject(object)) {
      if (angular.isFunction(object.$eval) && angular.isFunction(object.$apply)) {
        out = serializeScope(object);
      } else if (object instanceof Error) {
        out = object.stack || ('' + object.name + ': ' + object.message);
      } else {
        // TODO(i): this prevents methods being logged,
        // we should have a better way to serialize objects
        out = angular.toJson(object, true);
      }
    } else {
      out = String(object);
    }

    return out;
  }

  function serializeScope(scope, offset) {
    offset = offset ||  '  ';
    var log = [offset + 'Scope(' + scope.$id + '): {'];
    for (var key in scope) {
      if (Object.prototype.hasOwnProperty.call(scope, key) && !key.match(/^(\$|this)/)) {
        log.push('  ' + key + ': ' + angular.toJson(scope[key]));
      }
    }
    var child = scope.$$childHead;
    while (child) {
      log.push(serializeScope(child, offset + '  '));
      child = child.$$nextSibling;
    }
    log.push('}');
    return log.join('\n' + offset);
  }
};

/**
 * @ngdoc service
 * @name $httpBackend
 * @description
 * Fake HTTP backend implementation suitable for unit testing applications that use the
 * {@link ng.$http $http service}.
 *
 * *Note*: For fake HTTP backend implementation suitable for end-to-end testing or backend-less
 * development please see {@link ngMockE2E.$httpBackend e2e $httpBackend mock}.
 *
 * During unit testing, we want our unit tests to run quickly and have no external dependencies so
 * we don’t want to send [XHR](https://developer.mozilla.org/en/xmlhttprequest) or
 * [JSONP](http://en.wikipedia.org/wiki/JSONP) requests to a real server. All we really need is
 * to verify whether a certain request has been sent or not, or alternatively just let the
 * application make requests, respond with pre-trained responses and assert that the end result is
 * what we expect it to be.
 *
 * This mock implementation can be used to respond with static or dynamic responses via the
 * `expect` and `when` apis and their shortcuts (`expectGET`, `whenPOST`, etc).
 *
 * When an Angular application needs some data from a server, it calls the $http service, which
 * sends the request to a real server using $httpBackend service. With dependency injection, it is
 * easy to inject $httpBackend mock (which has the same API as $httpBackend) and use it to verify
 * the requests and respond with some testing data without sending a request to a real server.
 *
 * There are two ways to specify what test data should be returned as http responses by the mock
 * backend when the code under test makes http requests:
 *
 * - `$httpBackend.expect` - specifies a request expectation
 * - `$httpBackend.when` - specifies a backend definition
 *
 *
 * # Request Expectations vs Backend Definitions
 *
 * Request expectations provide a way to make assertions about requests made by the application and
 * to define responses for those requests. The test will fail if the expected requests are not made
 * or they are made in the wrong order.
 *
 * Backend definitions allow you to define a fake backend for your application which doesn't assert
 * if a particular request was made or not, it just returns a trained response if a request is made.
 * The test will pass whether or not the request gets made during testing.
 *
 *
 * <table class="table">
 *   <tr><th width="220px"></th><th>Request expectations</th><th>Backend definitions</th></tr>
 *   <tr>
 *     <th>Syntax</th>
 *     <td>.expect(...).respond(...)</td>
 *     <td>.when(...).respond(...)</td>
 *   </tr>
 *   <tr>
 *     <th>Typical usage</th>
 *     <td>strict unit tests</td>
 *     <td>loose (black-box) unit testing</td>
 *   </tr>
 *   <tr>
 *     <th>Fulfills multiple requests</th>
 *     <td>NO</td>
 *     <td>YES</td>
 *   </tr>
 *   <tr>
 *     <th>Order of requests matters</th>
 *     <td>YES</td>
 *     <td>NO</td>
 *   </tr>
 *   <tr>
 *     <th>Request required</th>
 *     <td>YES</td>
 *     <td>NO</td>
 *   </tr>
 *   <tr>
 *     <th>Response required</th>
 *     <td>optional (see below)</td>
 *     <td>YES</td>
 *   </tr>
 * </table>
 *
 * In cases where both backend definitions and request expectations are specified during unit
 * testing, the request expectations are evaluated first.
 *
 * If a request expectation has no response specified, the algorithm will search your backend
 * definitions for an appropriate response.
 *
 * If a request didn't match any expectation or if the expectation doesn't have the response
 * defined, the backend definitions are evaluated in sequential order to see if any of them match
 * the request. The response from the first matched definition is returned.
 *
 *
 * # Flushing HTTP requests
 *
 * The $httpBackend used in production always responds to requests asynchronously. If we preserved
 * this behavior in unit testing, we'd have to create async unit tests, which are hard to write,
 * to follow and to maintain. But neither can the testing mock respond synchronously; that would
 * change the execution of the code under test. For this reason, the mock $httpBackend has a
 * `flush()` method, which allows the test to explicitly flush pending requests. This preserves
 * the async api of the backend, while allowing the test to execute synchronously.
 *
 *
 * # Unit testing with mock $httpBackend
 * The following code shows how to setup and use the mock backend when unit testing a controller.
 * First we create the controller under test:
 *
  ```js
  // The module code
  angular
    .module('MyApp', [])
    .controller('MyController', MyController);

  // The controller code
  function MyController($scope, $http) {
    var authToken;

    $http.get('/auth.py').success(function(data, status, headers) {
      authToken = headers('A-Token');
      $scope.user = data;
    });

    $scope.saveMessage = function(message) {
      var headers = { 'Authorization': authToken };
      $scope.status = 'Saving...';

      $http.post('/add-msg.py', message, { headers: headers } ).success(function(response) {
        $scope.status = '';
      }).error(function() {
        $scope.status = 'ERROR!';
      });
    };
  }
  ```
 *
 * Now we setup the mock backend and create the test specs:
 *
  ```js
    // testing controller
    describe('MyController', function() {
       var $httpBackend, $rootScope, createController, authRequestHandler;

       // Set up the module
       beforeEach(module('MyApp'));

       beforeEach(inject(function($injector) {
         // Set up the mock http service responses
         $httpBackend = $injector.get('$httpBackend');
         // backend definition common for all tests
         authRequestHandler = $httpBackend.when('GET', '/auth.py')
                                .respond({userId: 'userX'}, {'A-Token': 'xxx'});

         // Get hold of a scope (i.e. the root scope)
         $rootScope = $injector.get('$rootScope');
         // The $controller service is used to create instances of controllers
         var $controller = $injector.get('$controller');

         createController = function() {
           return $controller('MyController', {'$scope' : $rootScope });
         };
       }));


       afterEach(function() {
         $httpBackend.verifyNoOutstandingExpectation();
         $httpBackend.verifyNoOutstandingRequest();
       });


       it('should fetch authentication token', function() {
         $httpBackend.expectGET('/auth.py');
         var controller = createController();
         $httpBackend.flush();
       });


       it('should fail authentication', function() {

         // Notice how you can change the response even after it was set
         authRequestHandler.respond(401, '');

         $httpBackend.expectGET('/auth.py');
         var controller = createController();
         $httpBackend.flush();
         expect($rootScope.status).toBe('Failed...');
       });


       it('should send msg to server', function() {
         var controller = createController();
         $httpBackend.flush();

         // now you don’t care about the authentication, but
         // the controller will still send the request and
         // $httpBackend will respond without you having to
         // specify the expectation and response for this request

         $httpBackend.expectPOST('/add-msg.py', 'message content').respond(201, '');
         $rootScope.saveMessage('message content');
         expect($rootScope.status).toBe('Saving...');
         $httpBackend.flush();
         expect($rootScope.status).toBe('');
       });


       it('should send auth header', function() {
         var controller = createController();
         $httpBackend.flush();

         $httpBackend.expectPOST('/add-msg.py', undefined, function(headers) {
           // check if the header was send, if it wasn't the expectation won't
           // match the request and the test will fail
           return headers['Authorization'] == 'xxx';
         }).respond(201, '');

         $rootScope.saveMessage('whatever');
         $httpBackend.flush();
       });
    });
   ```
 */
angular.mock.$HttpBackendProvider = function() {
  this.$get = ['$rootScope', '$timeout', createHttpBackendMock];
};

/**
 * General factory function for $httpBackend mock.
 * Returns instance for unit testing (when no arguments specified):
 *   - passing through is disabled
 *   - auto flushing is disabled
 *
 * Returns instance for e2e testing (when `$delegate` and `$browser` specified):
 *   - passing through (delegating request to real backend) is enabled
 *   - auto flushing is enabled
 *
 * @param {Object=} $delegate Real $httpBackend instance (allow passing through if specified)
 * @param {Object=} $browser Auto-flushing enabled if specified
 * @return {Object} Instance of $httpBackend mock
 */
function createHttpBackendMock($rootScope, $timeout, $delegate, $browser) {
  var definitions = [],
      expectations = [],
      responses = [],
      responsesPush = angular.bind(responses, responses.push),
      copy = angular.copy;

  function createResponse(status, data, headers, statusText) {
    if (angular.isFunction(status)) return status;

    return function() {
      return angular.isNumber(status)
          ? [status, data, headers, statusText]
          : [200, status, data, headers];
    };
  }

  // TODO(vojta): change params to: method, url, data, headers, callback
  function $httpBackend(method, url, data, callback, headers, timeout, withCredentials) {
    var xhr = new MockXhr(),
        expectation = expectations[0],
        wasExpected = false;

    function prettyPrint(data) {
      return (angular.isString(data) || angular.isFunction(data) || data instanceof RegExp)
          ? data
          : angular.toJson(data);
    }

    function wrapResponse(wrapped) {
      if (!$browser && timeout) {
        timeout.then ? timeout.then(handleTimeout) : $timeout(handleTimeout, timeout);
      }

      return handleResponse;

      function handleResponse() {
        var response = wrapped.response(method, url, data, headers);
        xhr.$$respHeaders = response[2];
        callback(copy(response[0]), copy(response[1]), xhr.getAllResponseHeaders(),
                 copy(response[3] || ''));
      }

      function handleTimeout() {
        for (var i = 0, ii = responses.length; i < ii; i++) {
          if (responses[i] === handleResponse) {
            responses.splice(i, 1);
            callback(-1, undefined, '');
            break;
          }
        }
      }
    }

    if (expectation && expectation.match(method, url)) {
      if (!expectation.matchData(data)) {
        throw new Error('Expected ' + expectation + ' with different data\n' +
            'EXPECTED: ' + prettyPrint(expectation.data) + '\nGOT:      ' + data);
      }

      if (!expectation.matchHeaders(headers)) {
        throw new Error('Expected ' + expectation + ' with different headers\n' +
                        'EXPECTED: ' + prettyPrint(expectation.headers) + '\nGOT:      ' +
                        prettyPrint(headers));
      }

      expectations.shift();

      if (expectation.response) {
        responses.push(wrapResponse(expectation));
        return;
      }
      wasExpected = true;
    }

    var i = -1, definition;
    while ((definition = definitions[++i])) {
      if (definition.match(method, url, data, headers || {})) {
        if (definition.response) {
          // if $browser specified, we do auto flush all requests
          ($browser ? $browser.defer : responsesPush)(wrapResponse(definition));
        } else if (definition.passThrough) {
          $delegate(method, url, data, callback, headers, timeout, withCredentials);
        } else throw new Error('No response defined !');
        return;
      }
    }
    throw wasExpected ?
        new Error('No response defined !') :
        new Error('Unexpected request: ' + method + ' ' + url + '\n' +
                  (expectation ? 'Expected ' + expectation : 'No more request expected'));
  }

  /**
   * @ngdoc method
   * @name $httpBackend#when
   * @description
   * Creates a new backend definition.
   *
   * @param {string} method HTTP method.
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string))=} data HTTP request body or function that receives
   *   data string and returns true if the data is as expected.
   * @param {(Object|function(Object))=} headers HTTP headers or function that receives http header
   *   object and returns true if the headers match the current definition.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   *
   *  - respond –
   *      `{function([status,] data[, headers, statusText])
   *      | function(function(method, url, data, headers)}`
   *    – The respond method takes a set of static data to be returned or a function that can
   *    return an array containing response status (number), response data (string), response
   *    headers (Object), and the text for the status (string). The respond method returns the
   *    `requestHandler` object for possible overrides.
   */
  $httpBackend.when = function(method, url, data, headers) {
    var definition = new MockHttpExpectation(method, url, data, headers),
        chain = {
          respond: function(status, data, headers, statusText) {
            definition.passThrough = undefined;
            definition.response = createResponse(status, data, headers, statusText);
            return chain;
          }
        };

    if ($browser) {
      chain.passThrough = function() {
        definition.response = undefined;
        definition.passThrough = true;
        return chain;
      };
    }

    definitions.push(definition);
    return chain;
  };

  /**
   * @ngdoc method
   * @name $httpBackend#whenGET
   * @description
   * Creates a new backend definition for GET requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenHEAD
   * @description
   * Creates a new backend definition for HEAD requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenDELETE
   * @description
   * Creates a new backend definition for DELETE requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenPOST
   * @description
   * Creates a new backend definition for POST requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string))=} data HTTP request body or function that receives
   *   data string and returns true if the data is as expected.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenPUT
   * @description
   * Creates a new backend definition for PUT requests.  For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string))=} data HTTP request body or function that receives
   *   data string and returns true if the data is as expected.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenJSONP
   * @description
   * Creates a new backend definition for JSONP requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */
  createShortMethods('when');


  /**
   * @ngdoc method
   * @name $httpBackend#expect
   * @description
   * Creates a new request expectation.
   *
   * @param {string} method HTTP method.
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {(Object|function(Object))=} headers HTTP headers or function that receives http header
   *   object and returns true if the headers match the current expectation.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *  request is handled. You can save this object for later use and invoke `respond` again in
   *  order to change how a matched request is handled.
   *
   *  - respond –
   *    `{function([status,] data[, headers, statusText])
   *    | function(function(method, url, data, headers)}`
   *    – The respond method takes a set of static data to be returned or a function that can
   *    return an array containing response status (number), response data (string), response
   *    headers (Object), and the text for the status (string). The respond method returns the
   *    `requestHandler` object for possible overrides.
   */
  $httpBackend.expect = function(method, url, data, headers) {
    var expectation = new MockHttpExpectation(method, url, data, headers),
        chain = {
          respond: function(status, data, headers, statusText) {
            expectation.response = createResponse(status, data, headers, statusText);
            return chain;
          }
        };

    expectations.push(expectation);
    return chain;
  };


  /**
   * @ngdoc method
   * @name $httpBackend#expectGET
   * @description
   * Creates a new request expectation for GET requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled. See #expect for more info.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectHEAD
   * @description
   * Creates a new request expectation for HEAD requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectDELETE
   * @description
   * Creates a new request expectation for DELETE requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectPOST
   * @description
   * Creates a new request expectation for POST requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectPUT
   * @description
   * Creates a new request expectation for PUT requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectPATCH
   * @description
   * Creates a new request expectation for PATCH requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectJSONP
   * @description
   * Creates a new request expectation for JSONP requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives an url
   *   and returns true if the url matches the current definition.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */
  createShortMethods('expect');


  /**
   * @ngdoc method
   * @name $httpBackend#flush
   * @description
   * Flushes all pending requests using the trained responses.
   *
   * @param {number=} count Number of responses to flush (in the order they arrived). If undefined,
   *   all pending requests will be flushed. If there are no pending requests when the flush method
   *   is called an exception is thrown (as this typically a sign of programming error).
   */
  $httpBackend.flush = function(count, digest) {
    if (digest !== false) $rootScope.$digest();
    if (!responses.length) throw new Error('No pending request to flush !');

    if (angular.isDefined(count) && count !== null) {
      while (count--) {
        if (!responses.length) throw new Error('No more pending request to flush !');
        responses.shift()();
      }
    } else {
      while (responses.length) {
        responses.shift()();
      }
    }
    $httpBackend.verifyNoOutstandingExpectation(digest);
  };


  /**
   * @ngdoc method
   * @name $httpBackend#verifyNoOutstandingExpectation
   * @description
   * Verifies that all of the requests defined via the `expect` api were made. If any of the
   * requests were not made, verifyNoOutstandingExpectation throws an exception.
   *
   * Typically, you would call this method following each test case that asserts requests using an
   * "afterEach" clause.
   *
   * ```js
   *   afterEach($httpBackend.verifyNoOutstandingExpectation);
   * ```
   */
  $httpBackend.verifyNoOutstandingExpectation = function(digest) {
    if (digest !== false) $rootScope.$digest();
    if (expectations.length) {
      throw new Error('Unsatisfied requests: ' + expectations.join(', '));
    }
  };


  /**
   * @ngdoc method
   * @name $httpBackend#verifyNoOutstandingRequest
   * @description
   * Verifies that there are no outstanding requests that need to be flushed.
   *
   * Typically, you would call this method following each test case that asserts requests using an
   * "afterEach" clause.
   *
   * ```js
   *   afterEach($httpBackend.verifyNoOutstandingRequest);
   * ```
   */
  $httpBackend.verifyNoOutstandingRequest = function() {
    if (responses.length) {
      throw new Error('Unflushed requests: ' + responses.length);
    }
  };


  /**
   * @ngdoc method
   * @name $httpBackend#resetExpectations
   * @description
   * Resets all request expectations, but preserves all backend definitions. Typically, you would
   * call resetExpectations during a multiple-phase test when you want to reuse the same instance of
   * $httpBackend mock.
   */
  $httpBackend.resetExpectations = function() {
    expectations.length = 0;
    responses.length = 0;
  };

  return $httpBackend;


  function createShortMethods(prefix) {
    angular.forEach(['GET', 'DELETE', 'JSONP', 'HEAD'], function(method) {
     $httpBackend[prefix + method] = function(url, headers) {
       return $httpBackend[prefix](method, url, undefined, headers);
     };
    });

    angular.forEach(['PUT', 'POST', 'PATCH'], function(method) {
      $httpBackend[prefix + method] = function(url, data, headers) {
        return $httpBackend[prefix](method, url, data, headers);
      };
    });
  }
}

function MockHttpExpectation(method, url, data, headers) {

  this.data = data;
  this.headers = headers;

  this.match = function(m, u, d, h) {
    if (method != m) return false;
    if (!this.matchUrl(u)) return false;
    if (angular.isDefined(d) && !this.matchData(d)) return false;
    if (angular.isDefined(h) && !this.matchHeaders(h)) return false;
    return true;
  };

  this.matchUrl = function(u) {
    if (!url) return true;
    if (angular.isFunction(url.test)) return url.test(u);
    if (angular.isFunction(url)) return url(u);
    return url == u;
  };

  this.matchHeaders = function(h) {
    if (angular.isUndefined(headers)) return true;
    if (angular.isFunction(headers)) return headers(h);
    return angular.equals(headers, h);
  };

  this.matchData = function(d) {
    if (angular.isUndefined(data)) return true;
    if (data && angular.isFunction(data.test)) return data.test(d);
    if (data && angular.isFunction(data)) return data(d);
    if (data && !angular.isString(data)) {
      return angular.equals(angular.fromJson(angular.toJson(data)), angular.fromJson(d));
    }
    return data == d;
  };

  this.toString = function() {
    return method + ' ' + url;
  };
}

function createMockXhr() {
  return new MockXhr();
}

function MockXhr() {

  // hack for testing $http, $httpBackend
  MockXhr.$$lastInstance = this;

  this.open = function(method, url, async) {
    this.$$method = method;
    this.$$url = url;
    this.$$async = async;
    this.$$reqHeaders = {};
    this.$$respHeaders = {};
  };

  this.send = function(data) {
    this.$$data = data;
  };

  this.setRequestHeader = function(key, value) {
    this.$$reqHeaders[key] = value;
  };

  this.getResponseHeader = function(name) {
    // the lookup must be case insensitive,
    // that's why we try two quick lookups first and full scan last
    var header = this.$$respHeaders[name];
    if (header) return header;

    name = angular.lowercase(name);
    header = this.$$respHeaders[name];
    if (header) return header;

    header = undefined;
    angular.forEach(this.$$respHeaders, function(headerVal, headerName) {
      if (!header && angular.lowercase(headerName) == name) header = headerVal;
    });
    return header;
  };

  this.getAllResponseHeaders = function() {
    var lines = [];

    angular.forEach(this.$$respHeaders, function(value, key) {
      lines.push(key + ': ' + value);
    });
    return lines.join('\n');
  };

  this.abort = angular.noop;
}


/**
 * @ngdoc service
 * @name $timeout
 * @description
 *
 * This service is just a simple decorator for {@link ng.$timeout $timeout} service
 * that adds a "flush" and "verifyNoPendingTasks" methods.
 */

angular.mock.$TimeoutDecorator = ['$delegate', '$browser', function($delegate, $browser) {

  /**
   * @ngdoc method
   * @name $timeout#flush
   * @description
   *
   * Flushes the queue of pending tasks.
   *
   * @param {number=} delay maximum timeout amount to flush up until
   */
  $delegate.flush = function(delay) {
    $browser.defer.flush(delay);
  };

  /**
   * @ngdoc method
   * @name $timeout#verifyNoPendingTasks
   * @description
   *
   * Verifies that there are no pending tasks that need to be flushed.
   */
  $delegate.verifyNoPendingTasks = function() {
    if ($browser.deferredFns.length) {
      throw new Error('Deferred tasks to flush (' + $browser.deferredFns.length + '): ' +
          formatPendingTasksAsString($browser.deferredFns));
    }
  };

  function formatPendingTasksAsString(tasks) {
    var result = [];
    angular.forEach(tasks, function(task) {
      result.push('{id: ' + task.id + ', ' + 'time: ' + task.time + '}');
    });

    return result.join(', ');
  }

  return $delegate;
}];

angular.mock.$RAFDecorator = ['$delegate', function($delegate) {
  var queue = [];
  var rafFn = function(fn) {
    var index = queue.length;
    queue.push(fn);
    return function() {
      queue.splice(index, 1);
    };
  };

  rafFn.supported = $delegate.supported;

  rafFn.flush = function() {
    if (queue.length === 0) {
      throw new Error('No rAF callbacks present');
    }

    var length = queue.length;
    for (var i = 0; i < length; i++) {
      queue[i]();
    }

    queue = queue.slice(i);
  };

  return rafFn;
}];

angular.mock.$AsyncCallbackDecorator = ['$delegate', function($delegate) {
  var callbacks = [];
  var addFn = function(fn) {
    callbacks.push(fn);
  };
  addFn.flush = function() {
    angular.forEach(callbacks, function(fn) {
      fn();
    });
    callbacks = [];
  };
  return addFn;
}];

/**
 *
 */
angular.mock.$RootElementProvider = function() {
  this.$get = function() {
    return angular.element('<div ng-app></div>');
  };
};

/**
 * @ngdoc service
 * @name $controller
 * @description
 * A decorator for {@link ng.$controller} with additional `bindings` parameter, useful when testing
 * controllers of directives that use {@link $compile#-bindtocontroller- `bindToController`}.
 *
 *
 * ## Example
 *
 * ```js
 *
 * // Directive definition ...
 *
 * myMod.directive('myDirective', {
 *   controller: 'MyDirectiveController',
 *   bindToController: {
 *     name: '@'
 *   }
 * });
 *
 *
 * // Controller definition ...
 *
 * myMod.controller('MyDirectiveController', ['log', function($log) {
 *   $log.info(this.name);
 * })];
 *
 *
 * // In a test ...
 *
 * describe('myDirectiveController', function() {
 *   it('should write the bound name to the log', inject(function($controller, $log) {
 *     var ctrl = $controller('MyDirective', { /* no locals &#42;/ }, { name: 'Clark Kent' });
 *     expect(ctrl.name).toEqual('Clark Kent');
 *     expect($log.info.logs).toEqual(['Clark Kent']);
 *   });
 * });
 *
 * ```
 *
 * @param {Function|string} constructor If called with a function then it's considered to be the
 *    controller constructor function. Otherwise it's considered to be a string which is used
 *    to retrieve the controller constructor using the following steps:
 *
 *    * check if a controller with given name is registered via `$controllerProvider`
 *    * check if evaluating the string on the current scope returns a constructor
 *    * if $controllerProvider#allowGlobals, check `window[constructor]` on the global
 *      `window` object (not recommended)
 *
 *    The string can use the `controller as property` syntax, where the controller instance is published
 *    as the specified property on the `scope`; the `scope` must be injected into `locals` param for this
 *    to work correctly.
 *
 * @param {Object} locals Injection locals for Controller.
 * @param {Object=} bindings Properties to add to the controller before invoking the constructor. This is used
 *                           to simulate the `bindToController` feature and simplify certain kinds of tests.
 * @return {Object} Instance of given controller.
 */
angular.mock.$ControllerDecorator = ['$delegate', function($delegate) {
  return function(expression, locals, later, ident) {
    if (later && typeof later === 'object') {
      var create = $delegate(expression, locals, true, ident);
      angular.extend(create.instance, later);
      return create();
    }
    return $delegate(expression, locals, later, ident);
  };
}];


/**
 * @ngdoc module
 * @name ngMock
 * @packageName angular-mocks
 * @description
 *
 * # ngMock
 *
 * The `ngMock` module provides support to inject and mock Angular services into unit tests.
 * In addition, ngMock also extends various core ng services such that they can be
 * inspected and controlled in a synchronous manner within test code.
 *
 *
 * <div doc-module-components="ngMock"></div>
 *
 */
angular.module('ngMock', ['ng']).provider({
  $browser: angular.mock.$BrowserProvider,
  $exceptionHandler: angular.mock.$ExceptionHandlerProvider,
  $log: angular.mock.$LogProvider,
  $interval: angular.mock.$IntervalProvider,
  $httpBackend: angular.mock.$HttpBackendProvider,
  $rootElement: angular.mock.$RootElementProvider
}).config(['$provide', function($provide) {
  $provide.decorator('$timeout', angular.mock.$TimeoutDecorator);
  $provide.decorator('$$rAF', angular.mock.$RAFDecorator);
  $provide.decorator('$$asyncCallback', angular.mock.$AsyncCallbackDecorator);
  $provide.decorator('$rootScope', angular.mock.$RootScopeDecorator);
  $provide.decorator('$controller', angular.mock.$ControllerDecorator);
}]);

/**
 * @ngdoc module
 * @name ngMockE2E
 * @module ngMockE2E
 * @packageName angular-mocks
 * @description
 *
 * The `ngMockE2E` is an angular module which contains mocks suitable for end-to-end testing.
 * Currently there is only one mock present in this module -
 * the {@link ngMockE2E.$httpBackend e2e $httpBackend} mock.
 */
angular.module('ngMockE2E', ['ng']).config(['$provide', function($provide) {
  $provide.decorator('$httpBackend', angular.mock.e2e.$httpBackendDecorator);
}]);

/**
 * @ngdoc service
 * @name $httpBackend
 * @module ngMockE2E
 * @description
 * Fake HTTP backend implementation suitable for end-to-end testing or backend-less development of
 * applications that use the {@link ng.$http $http service}.
 *
 * *Note*: For fake http backend implementation suitable for unit testing please see
 * {@link ngMock.$httpBackend unit-testing $httpBackend mock}.
 *
 * This implementation can be used to respond with static or dynamic responses via the `when` api
 * and its shortcuts (`whenGET`, `whenPOST`, etc) and optionally pass through requests to the
 * real $httpBackend for specific requests (e.g. to interact with certain remote apis or to fetch
 * templates from a webserver).
 *
 * As opposed to unit-testing, in an end-to-end testing scenario or in scenario when an application
 * is being developed with the real backend api replaced with a mock, it is often desirable for
 * certain category of requests to bypass the mock and issue a real http request (e.g. to fetch
 * templates or static files from the webserver). To configure the backend with this behavior
 * use the `passThrough` request handler of `when` instead of `respond`.
 *
 * Additionally, we don't want to manually have to flush mocked out requests like we do during unit
 * testing. For this reason the e2e $httpBackend flushes mocked out requests
 * automatically, closely simulating the behavior of the XMLHttpRequest object.
 *
 * To setup the application to run with this http backend, you have to create a module that depends
 * on the `ngMockE2E` and your application modules and defines the fake backend:
 *
 * ```js
 *   myAppDev = angular.module('myAppDev', ['myApp', 'ngMockE2E']);
 *   myAppDev.run(function($httpBackend) {
 *     phones = [{name: 'phone1'}, {name: 'phone2'}];
 *
 *     // returns the current list of phones
 *     $httpBackend.whenGET('/phones').respond(phones);
 *
 *     // adds a new phone to the phones array
 *     $httpBackend.whenPOST('/phones').respond(function(method, url, data) {
 *       var phone = angular.fromJson(data);
 *       phones.push(phone);
 *       return [200, phone, {}];
 *     });
 *     $httpBackend.whenGET(/^\/templates\//).passThrough();
 *     //...
 *   });
 * ```
 *
 * Afterwards, bootstrap your app with this new module.
 */

/**
 * @ngdoc method
 * @name $httpBackend#when
 * @module ngMockE2E
 * @description
 * Creates a new backend definition.
 *
 * @param {string} method HTTP method.
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers or function that receives http header
 *   object and returns true if the headers match the current definition.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 *
 *  - respond –
 *    `{function([status,] data[, headers, statusText])
 *    | function(function(method, url, data, headers)}`
 *    – The respond method takes a set of static data to be returned or a function that can return
 *    an array containing response status (number), response data (string), response headers
 *    (Object), and the text for the status (string).
 *  - passThrough – `{function()}` – Any request matching a backend definition with
 *    `passThrough` handler will be passed through to the real backend (an XHR request will be made
 *    to the server.)
 *  - Both methods return the `requestHandler` object for possible overrides.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenGET
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for GET requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenHEAD
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for HEAD requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenDELETE
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for DELETE requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenPOST
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for POST requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenPUT
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for PUT requests.  For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenPATCH
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for PATCH requests.  For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenJSONP
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for JSONP requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */
angular.mock.e2e = {};
angular.mock.e2e.$httpBackendDecorator =
  ['$rootScope', '$timeout', '$delegate', '$browser', createHttpBackendMock];


/**
 * @ngdoc type
 * @name $rootScope.Scope
 * @module ngMock
 * @description
 * {@link ng.$rootScope.Scope Scope} type decorated with helper methods useful for testing. These
 * methods are automatically available on any {@link ng.$rootScope.Scope Scope} instance when
 * `ngMock` module is loaded.
 *
 * In addition to all the regular `Scope` methods, the following helper methods are available:
 */
angular.mock.$RootScopeDecorator = ['$delegate', function($delegate) {

  var $rootScopePrototype = Object.getPrototypeOf($delegate);

  $rootScopePrototype.$countChildScopes = countChildScopes;
  $rootScopePrototype.$countWatchers = countWatchers;

  return $delegate;

  // ------------------------------------------------------------------------------------------ //

  /**
   * @ngdoc method
   * @name $rootScope.Scope#$countChildScopes
   * @module ngMock
   * @description
   * Counts all the direct and indirect child scopes of the current scope.
   *
   * The current scope is excluded from the count. The count includes all isolate child scopes.
   *
   * @returns {number} Total number of child scopes.
   */
  function countChildScopes() {
    // jshint validthis: true
    var count = 0; // exclude the current scope
    var pendingChildHeads = [this.$$childHead];
    var currentScope;

    while (pendingChildHeads.length) {
      currentScope = pendingChildHeads.shift();

      while (currentScope) {
        count += 1;
        pendingChildHeads.push(currentScope.$$childHead);
        currentScope = currentScope.$$nextSibling;
      }
    }

    return count;
  }


  /**
   * @ngdoc method
   * @name $rootScope.Scope#$countWatchers
   * @module ngMock
   * @description
   * Counts all the watchers of direct and indirect child scopes of the current scope.
   *
   * The watchers of the current scope are included in the count and so are all the watchers of
   * isolate child scopes.
   *
   * @returns {number} Total number of watchers.
   */
  function countWatchers() {
    // jshint validthis: true
    var count = this.$$watchers ? this.$$watchers.length : 0; // include the current scope
    var pendingChildHeads = [this.$$childHead];
    var currentScope;

    while (pendingChildHeads.length) {
      currentScope = pendingChildHeads.shift();

      while (currentScope) {
        count += currentScope.$$watchers ? currentScope.$$watchers.length : 0;
        pendingChildHeads.push(currentScope.$$childHead);
        currentScope = currentScope.$$nextSibling;
      }
    }

    return count;
  }
}];


if (window.jasmine || window.mocha) {

  var currentSpec = null,
      annotatedFunctions = [],
      isSpecRunning = function() {
        return !!currentSpec;
      };

  angular.mock.$$annotate = angular.injector.$$annotate;
  angular.injector.$$annotate = function(fn) {
    if (typeof fn === 'function' && !fn.$inject) {
      annotatedFunctions.push(fn);
    }
    return angular.mock.$$annotate.apply(this, arguments);
  };


  (window.beforeEach || window.setup)(function() {
    annotatedFunctions = [];
    currentSpec = this;
  });

  (window.afterEach || window.teardown)(function() {
    var injector = currentSpec.$injector;

    annotatedFunctions.forEach(function(fn) {
      delete fn.$inject;
    });

    angular.forEach(currentSpec.$modules, function(module) {
      if (module && module.$$hashKey) {
        module.$$hashKey = undefined;
      }
    });

    currentSpec.$injector = null;
    currentSpec.$modules = null;
    currentSpec = null;

    if (injector) {
      injector.get('$rootElement').off();
    }

    // clean up jquery's fragment cache
    angular.forEach(angular.element.fragments, function(val, key) {
      delete angular.element.fragments[key];
    });

    MockXhr.$$lastInstance = null;

    angular.forEach(angular.callbacks, function(val, key) {
      delete angular.callbacks[key];
    });
    angular.callbacks.counter = 0;
  });

  /**
   * @ngdoc function
   * @name angular.mock.module
   * @description
   *
   * *NOTE*: This function is also published on window for easy access.<br>
   * *NOTE*: This function is declared ONLY WHEN running tests with jasmine or mocha
   *
   * This function registers a module configuration code. It collects the configuration information
   * which will be used when the injector is created by {@link angular.mock.inject inject}.
   *
   * See {@link angular.mock.inject inject} for usage example
   *
   * @param {...(string|Function|Object)} fns any number of modules which are represented as string
   *        aliases or as anonymous module initialization functions. The modules are used to
   *        configure the injector. The 'ng' and 'ngMock' modules are automatically loaded. If an
   *        object literal is passed they will be registered as values in the module, the key being
   *        the module name and the value being what is returned.
   */
  window.module = angular.mock.module = function() {
    var moduleFns = Array.prototype.slice.call(arguments, 0);
    return isSpecRunning() ? workFn() : workFn;
    /////////////////////
    function workFn() {
      if (currentSpec.$injector) {
        throw new Error('Injector already created, can not register a module!');
      } else {
        var modules = currentSpec.$modules || (currentSpec.$modules = []);
        angular.forEach(moduleFns, function(module) {
          if (angular.isObject(module) && !angular.isArray(module)) {
            modules.push(function($provide) {
              angular.forEach(module, function(value, key) {
                $provide.value(key, value);
              });
            });
          } else {
            modules.push(module);
          }
        });
      }
    }
  };

  /**
   * @ngdoc function
   * @name angular.mock.inject
   * @description
   *
   * *NOTE*: This function is also published on window for easy access.<br>
   * *NOTE*: This function is declared ONLY WHEN running tests with jasmine or mocha
   *
   * The inject function wraps a function into an injectable function. The inject() creates new
   * instance of {@link auto.$injector $injector} per test, which is then used for
   * resolving references.
   *
   *
   * ## Resolving References (Underscore Wrapping)
   * Often, we would like to inject a reference once, in a `beforeEach()` block and reuse this
   * in multiple `it()` clauses. To be able to do this we must assign the reference to a variable
   * that is declared in the scope of the `describe()` block. Since we would, most likely, want
   * the variable to have the same name of the reference we have a problem, since the parameter
   * to the `inject()` function would hide the outer variable.
   *
   * To help with this, the injected parameters can, optionally, be enclosed with underscores.
   * These are ignored by the injector when the reference name is resolved.
   *
   * For example, the parameter `_myService_` would be resolved as the reference `myService`.
   * Since it is available in the function body as _myService_, we can then assign it to a variable
   * defined in an outer scope.
   *
   * ```
   * // Defined out reference variable outside
   * var myService;
   *
   * // Wrap the parameter in underscores
   * beforeEach( inject( function(_myService_){
   *   myService = _myService_;
   * }));
   *
   * // Use myService in a series of tests.
   * it('makes use of myService', function() {
   *   myService.doStuff();
   * });
   *
   * ```
   *
   * See also {@link angular.mock.module angular.mock.module}
   *
   * ## Example
   * Example of what a typical jasmine tests looks like with the inject method.
   * ```js
   *
   *   angular.module('myApplicationModule', [])
   *       .value('mode', 'app')
   *       .value('version', 'v1.0.1');
   *
   *
   *   describe('MyApp', function() {
   *
   *     // You need to load modules that you want to test,
   *     // it loads only the "ng" module by default.
   *     beforeEach(module('myApplicationModule'));
   *
   *
   *     // inject() is used to inject arguments of all given functions
   *     it('should provide a version', inject(function(mode, version) {
   *       expect(version).toEqual('v1.0.1');
   *       expect(mode).toEqual('app');
   *     }));
   *
   *
   *     // The inject and module method can also be used inside of the it or beforeEach
   *     it('should override a version and test the new version is injected', function() {
   *       // module() takes functions or strings (module aliases)
   *       module(function($provide) {
   *         $provide.value('version', 'overridden'); // override version here
   *       });
   *
   *       inject(function(version) {
   *         expect(version).toEqual('overridden');
   *       });
   *     });
   *   });
   *
   * ```
   *
   * @param {...Function} fns any number of functions which will be injected using the injector.
   */



  var ErrorAddingDeclarationLocationStack = function(e, errorForStack) {
    this.message = e.message;
    this.name = e.name;
    if (e.line) this.line = e.line;
    if (e.sourceId) this.sourceId = e.sourceId;
    if (e.stack && errorForStack)
      this.stack = e.stack + '\n' + errorForStack.stack;
    if (e.stackArray) this.stackArray = e.stackArray;
  };
  ErrorAddingDeclarationLocationStack.prototype.toString = Error.prototype.toString;

  window.inject = angular.mock.inject = function() {
    var blockFns = Array.prototype.slice.call(arguments, 0);
    var errorForStack = new Error('Declaration Location');
    return isSpecRunning() ? workFn.call(currentSpec) : workFn;
    /////////////////////
    function workFn() {
      var modules = currentSpec.$modules || [];
      var strictDi = !!currentSpec.$injectorStrict;
      modules.unshift('ngMock');
      modules.unshift('ng');
      var injector = currentSpec.$injector;
      if (!injector) {
        if (strictDi) {
          // If strictDi is enabled, annotate the providerInjector blocks
          angular.forEach(modules, function(moduleFn) {
            if (typeof moduleFn === "function") {
              angular.injector.$$annotate(moduleFn);
            }
          });
        }
        injector = currentSpec.$injector = angular.injector(modules, strictDi);
        currentSpec.$injectorStrict = strictDi;
      }
      for (var i = 0, ii = blockFns.length; i < ii; i++) {
        if (currentSpec.$injectorStrict) {
          // If the injector is strict / strictDi, and the spec wants to inject using automatic
          // annotation, then annotate the function here.
          injector.annotate(blockFns[i]);
        }
        try {
          /* jshint -W040 *//* Jasmine explicitly provides a `this` object when calling functions */
          injector.invoke(blockFns[i] || angular.noop, this);
          /* jshint +W040 */
        } catch (e) {
          if (e.stack && errorForStack) {
            throw new ErrorAddingDeclarationLocationStack(e, errorForStack);
          }
          throw e;
        } finally {
          errorForStack = null;
        }
      }
    }
  };


  angular.mock.inject.strictDi = function(value) {
    value = arguments.length ? !!value : true;
    return isSpecRunning() ? workFn() : workFn;

    function workFn() {
      if (value !== currentSpec.$injectorStrict) {
        if (currentSpec.$injector) {
          throw new Error('Injector already created, can not modify strict annotations');
        } else {
          currentSpec.$injectorStrict = value;
        }
      }
    }
  };
}


})(window, window.angular);

},{}],2:[function(require,module,exports){
/*

 Software License Agreement (BSD License)
 http://taffydb.com
 Copyright (c)
 All rights reserved.


 Redistribution and use of this software in source and binary forms, with or without modification, are permitted provided that the following condition is met:

 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 */

/*jslint        browser : true, continue : true,
 devel  : true, indent  : 2,    maxerr   : 500,
 newcap : true, nomen   : true, plusplus : true,
 regexp : true, sloppy  : true, vars     : false,
 white  : true
*/

// BUILD 193d48d, modified by mmikowski to pass jslint

// Setup TAFFY name space to return an object with methods
var TAFFY, exports, T;
(function () {
  'use strict';
  var
    typeList,     makeTest,     idx,    typeKey,
    version,      TC,           idpad,  cmax,
    API,          protectJSON,  each,   eachin,
    isIndexable,  returnFilter, runFilters,
    numcharsplit, orderByCol,   run,    intersection,
    filter,       makeCid,      safeForJson,
    isRegexp
    ;


  if ( ! TAFFY ){
    // TC = Counter for Taffy DBs on page, used for unique IDs
    // cmax = size of charnumarray conversion cache
    // idpad = zeros to pad record IDs with
    version = '2.7';
    TC      = 1;
    idpad   = '000000';
    cmax    = 1000;
    API     = {};

    protectJSON = function ( t ) {
      // ****************************************
      // *
      // * Takes: a variable
      // * Returns: the variable if object/array or the parsed variable if JSON
      // *
      // ****************************************  
      if ( TAFFY.isArray( t ) || TAFFY.isObject( t ) ){
        return t;
      }
      else {
        return JSON.parse( t );
      }
    };
    
    // gracefully stolen from underscore.js
    intersection = function(array1, array2) {
        return filter(array1, function(item) {
          return array2.indexOf(item) >= 0;
        });
    };

    // gracefully stolen from underscore.js
    filter = function(obj, iterator, context) {
        var results = [];
        if (obj == null) return results;
        if (Array.prototype.filter && obj.filter === Array.prototype.filter) return obj.filter(iterator, context);
        each(obj, function(value, index, list) {
          if (iterator.call(context, value, index, list)) results[results.length] = value;
        });
        return results;
    };
    
    isRegexp = function(aObj) {
        return Object.prototype.toString.call(aObj)==='[object RegExp]';
    }
    
    safeForJson = function(aObj) {
        var myResult = T.isArray(aObj) ? [] : T.isObject(aObj) ? {} : null;
        if(aObj===null) return aObj;
        for(var i in aObj) {
            myResult[i]  = isRegexp(aObj[i]) ? aObj[i].toString() : T.isArray(aObj[i]) || T.isObject(aObj[i]) ? safeForJson(aObj[i]) : aObj[i];
        }
        return myResult;
    }
    
    makeCid = function(aContext) {
        var myCid = JSON.stringify(aContext);
        if(myCid.match(/regex/)===null) return myCid;
        return JSON.stringify(safeForJson(aContext));
    }
    
    each = function ( a, fun, u ) {
      var r, i, x, y;
      // ****************************************
      // *
      // * Takes:
      // * a = an object/value or an array of objects/values
      // * f = a function
      // * u = optional flag to describe how to handle undefined values
      //   in array of values. True: pass them to the functions,
      //   False: skip. Default False;
      // * Purpose: Used to loop over arrays
      // *
      // ****************************************  
      if ( a && ((T.isArray( a ) && a.length === 1) || (!T.isArray( a ))) ){
        fun( (T.isArray( a )) ? a[0] : a, 0 );
      }
      else {
        for ( r, i, x = 0, a = (T.isArray( a )) ? a : [a], y = a.length;
              x < y; x++ )
        {
          i = a[x];
          if ( !T.isUndefined( i ) || (u || false) ){
            r = fun( i, x );
            if ( r === T.EXIT ){
              break;
            }

          }
        }
      }
    };

    eachin = function ( o, fun ) {
      // ****************************************
      // *
      // * Takes:
      // * o = an object
      // * f = a function
      // * Purpose: Used to loop over objects
      // *
      // ****************************************  
      var x = 0, r, i;

      for ( i in o ){
        if ( o.hasOwnProperty( i ) ){
          r = fun( o[i], i, x++ );
          if ( r === T.EXIT ){
            break;
          }
        }
      }

    };

    API.extend = function ( m, f ) {
      // ****************************************
      // *
      // * Takes: method name, function
      // * Purpose: Add a custom method to the API
      // *
      // ****************************************  
      API[m] = function () {
        return f.apply( this, arguments );
      };
    };

    isIndexable = function ( f ) {
      var i;
      // Check to see if record ID
      if ( T.isString( f ) && /[t][0-9]*[r][0-9]*/i.test( f ) ){
        return true;
      }
      // Check to see if record
      if ( T.isObject( f ) && f.___id && f.___s ){
        return true;
      }

      // Check to see if array of indexes
      if ( T.isArray( f ) ){
        i = true;
        each( f, function ( r ) {
          if ( !isIndexable( r ) ){
            i = false;

            return TAFFY.EXIT;
          }
        });
        return i;
      }

      return false;
    };

    runFilters = function ( r, filter ) {
      // ****************************************
      // *
      // * Takes: takes a record and a collection of filters
      // * Returns: true if the record matches, false otherwise
      // ****************************************
      var match = true;


      each( filter, function ( mf ) {
        switch ( T.typeOf( mf ) ){
          case 'function':
            // run function
            if ( !mf.apply( r ) ){
              match = false;
              return TAFFY.EXIT;
            }
            break;
          case 'array':
            // loop array and treat like a SQL or
            match = (mf.length === 1) ? (runFilters( r, mf[0] )) :
              (mf.length === 2) ? (runFilters( r, mf[0] ) ||
                runFilters( r, mf[1] )) :
                (mf.length === 3) ? (runFilters( r, mf[0] ) ||
                  runFilters( r, mf[1] ) || runFilters( r, mf[2] )) :
                  (mf.length === 4) ? (runFilters( r, mf[0] ) ||
                    runFilters( r, mf[1] ) || runFilters( r, mf[2] ) ||
                    runFilters( r, mf[3] )) : false;
            if ( mf.length > 4 ){
              each( mf, function ( f ) {
                if ( runFilters( r, f ) ){
                  match = true;
                }
              });
            }
            break;
        }
      });

      return match;
    };

    returnFilter = function ( f ) {
      // ****************************************
      // *
      // * Takes: filter object
      // * Returns: a filter function
      // * Purpose: Take a filter object and return a function that can be used to compare
      // * a TaffyDB record to see if the record matches a query
      // ****************************************  
      var nf = [];
      if ( T.isString( f ) && /[t][0-9]*[r][0-9]*/i.test( f ) ){
        f = { ___id : f };
      }
      if ( T.isArray( f ) ){
        // if we are working with an array

        each( f, function ( r ) {
          // loop the array and return a filter func for each value
          nf.push( returnFilter( r ) );
        });
        // now build a func to loop over the filters and return true if ANY of the filters match
        // This handles logical OR expressions
        f = function () {
          var that = this, match = false;
          each( nf, function ( f ) {
            if ( runFilters( that, f ) ){
              match = true;
            }
          });
          return match;
        };
        return f;

      }
      // if we are dealing with an Object
      if ( T.isObject( f ) ){
        if ( T.isObject( f ) && f.___id && f.___s ){
          f = { ___id : f.___id };
        }

        // Loop over each value on the object to prep match type and match value
        eachin( f, function ( v, i ) {

          // default match type to IS/Equals
          if ( !T.isObject( v ) ){
            v = {
              'is' : v
            };
          }
          // loop over each value on the value object  - if any
          eachin( v, function ( mtest, s ) {
            // s = match type, e.g. is, hasAll, like, etc
            var c = [], looper;

            // function to loop and apply filter
            looper = (s === 'hasAll') ?
              function ( mtest, func ) {
                func( mtest );
              } : each;

            // loop over each test
            looper( mtest, function ( mtest ) {

              // su = match success
              // f = match false
              var su = true, f = false, matchFunc;


              // push a function onto the filter collection to do the matching
              matchFunc = function () {

                // get the value from the record
                var
                  mvalue   = this[i],
                  eqeq     = '==',
                  bangeq   = '!=',
                  eqeqeq   = '===',
                  lt   = '<',
                  gt   = '>',
                  lteq   = '<=',
                  gteq   = '>=',
                  bangeqeq = '!==',
                  r
                  ;

                if (typeof mvalue === 'undefined') {
                  return false;
                }
                
                if ( (s.indexOf( '!' ) === 0) && s !== bangeq &&
                  s !== bangeqeq )
                {
                  // if the filter name starts with ! as in '!is' then reverse the match logic and remove the !
                  su = false;
                  s = s.substring( 1, s.length );
                }
                // get the match results based on the s/match type
                /*jslint eqeq : true */
                r = (
                  (s === 'regex') ? (mtest.test( mvalue )) : (s === 'lt' || s === lt)
                  ? (mvalue < mtest)  : (s === 'gt' || s === gt)
                  ? (mvalue > mtest)  : (s === 'lte' || s === lteq)
                  ? (mvalue <= mtest) : (s === 'gte' || s === gteq)
                  ? (mvalue >= mtest) : (s === 'left')
                  ? (mvalue.indexOf( mtest ) === 0) : (s === 'leftnocase')
                  ? (mvalue.toLowerCase().indexOf( mtest.toLowerCase() )
                    === 0) : (s === 'right')
                  ? (mvalue.substring( (mvalue.length - mtest.length) )
                    === mtest) : (s === 'rightnocase')
                  ? (mvalue.toLowerCase().substring(
                    (mvalue.length - mtest.length) ) === mtest.toLowerCase())
                    : (s === 'like')
                  ? (mvalue.indexOf( mtest ) >= 0) : (s === 'likenocase')
                  ? (mvalue.toLowerCase().indexOf(mtest.toLowerCase()) >= 0)
                    : (s === eqeqeq || s === 'is')
                  ? (mvalue ===  mtest) : (s === eqeq)
                  ? (mvalue == mtest) : (s === bangeqeq)
                  ? (mvalue !==  mtest) : (s === bangeq)
                  ? (mvalue != mtest) : (s === 'isnocase')
                  ? (mvalue.toLowerCase
                    ? mvalue.toLowerCase() === mtest.toLowerCase()
                      : mvalue === mtest) : (s === 'has')
                  ? (T.has( mvalue, mtest )) : (s === 'hasall')
                  ? (T.hasAll( mvalue, mtest )) : (s === 'contains')
                  ? (TAFFY.isArray(mvalue) && mvalue.indexOf(mtest) > -1) : (
                    s.indexOf( 'is' ) === -1
                      && !TAFFY.isNull( mvalue )
                      && !TAFFY.isUndefined( mvalue )
                      && !TAFFY.isObject( mtest )
                      && !TAFFY.isArray( mtest )
                    )
                  ? (mtest === mvalue[s])
                    : (T[s] && T.isFunction( T[s] )
                    && s.indexOf( 'is' ) === 0)
                  ? T[s]( mvalue ) === mtest
                    : (T[s] && T.isFunction( T[s] ))
                  ? T[s]( mvalue, mtest ) : (false)
                );
                /*jslint eqeq : false */
                r = (r && !su) ? false : (!r && !su) ? true : r;

                return r;
              };
              c.push( matchFunc );

            });
            // if only one filter in the collection push it onto the filter list without the array
            if ( c.length === 1 ){

              nf.push( c[0] );
            }
            else {
              // else build a function to loop over all the filters and return true only if ALL match
              // this is a logical AND
              nf.push( function () {
                var that = this, match = false;
                each( c, function ( f ) {
                  if ( f.apply( that ) ){
                    match = true;
                  }
                });
                return match;
              });
            }
          });
        });
        // finally return a single function that wraps all the other functions and will run a query
        // where all functions have to return true for a record to appear in a query result
        f = function () {
          var that = this, match = true;
          // faster if less than  4 functions
          match = (nf.length === 1 && !nf[0].apply( that )) ? false :
            (nf.length === 2 &&
              (!nf[0].apply( that ) || !nf[1].apply( that ))) ? false :
              (nf.length === 3 &&
                (!nf[0].apply( that ) || !nf[1].apply( that ) ||
                  !nf[2].apply( that ))) ? false :
                (nf.length === 4 &&
                  (!nf[0].apply( that ) || !nf[1].apply( that ) ||
                    !nf[2].apply( that ) || !nf[3].apply( that ))) ? false
                  : true;
          if ( nf.length > 4 ){
            each( nf, function ( f ) {
              if ( !runFilters( that, f ) ){
                match = false;
              }
            });
          }
          return match;
        };
        return f;
      }

      // if function
      if ( T.isFunction( f ) ){
        return f;
      }
    };

    orderByCol = function ( ar, o ) {
      // ****************************************
      // *
      // * Takes: takes an array and a sort object
      // * Returns: the array sorted
      // * Purpose: Accept filters such as "[col], [col2]" or "[col] desc" and sort on those columns
      // *
      // ****************************************

      var sortFunc = function ( a, b ) {
        // function to pass to the native array.sort to sort an array
        var r = 0;

        T.each( o, function ( sd ) {
          // loop over the sort instructions
          // get the column name
          var o, col, dir, c, d;
          o = sd.split( ' ' );
          col = o[0];

          // get the direction
          dir = (o.length === 1) ? "logical" : o[1];


          if ( dir === 'logical' ){
            // if dir is logical than grab the charnum arrays for the two values we are looking at
            c = numcharsplit( a[col] );
            d = numcharsplit( b[col] );
            // loop over the charnumarrays until one value is higher than the other
            T.each( (c.length <= d.length) ? c : d, function ( x, i ) {
              if ( c[i] < d[i] ){
                r = -1;
                return TAFFY.EXIT;
              }
              else if ( c[i] > d[i] ){
                r = 1;
                return TAFFY.EXIT;
              }
            } );
          }
          else if ( dir === 'logicaldesc' ){
            // if logicaldesc than grab the charnum arrays for the two values we are looking at
            c = numcharsplit( a[col] );
            d = numcharsplit( b[col] );
            // loop over the charnumarrays until one value is lower than the other
            T.each( (c.length <= d.length) ? c : d, function ( x, i ) {
              if ( c[i] > d[i] ){
                r = -1;
                return TAFFY.EXIT;
              }
              else if ( c[i] < d[i] ){
                r = 1;
                return TAFFY.EXIT;
              }
            } );
          }
          else if ( dir === 'asec' && a[col] < b[col] ){
            // if asec - default - check to see which is higher
            r = -1;
            return T.EXIT;
          }
          else if ( dir === 'asec' && a[col] > b[col] ){
            // if asec - default - check to see which is higher
            r = 1;
            return T.EXIT;
          }
          else if ( dir === 'desc' && a[col] > b[col] ){
            // if desc check to see which is lower
            r = -1;
            return T.EXIT;

          }
          else if ( dir === 'desc' && a[col] < b[col] ){
            // if desc check to see which is lower
            r = 1;
            return T.EXIT;

          }
          // if r is still 0 and we are doing a logical sort than look to see if one array is longer than the other
          if ( r === 0 && dir === 'logical' && c.length < d.length ){
            r = -1;
          }
          else if ( r === 0 && dir === 'logical' && c.length > d.length ){
            r = 1;
          }
          else if ( r === 0 && dir === 'logicaldesc' && c.length > d.length ){
            r = -1;
          }
          else if ( r === 0 && dir === 'logicaldesc' && c.length < d.length ){
            r = 1;
          }

          if ( r !== 0 ){
            return T.EXIT;
          }


        } );
        return r;
      };
      // call the sort function and return the newly sorted array
      return (ar && ar.push) ? ar.sort( sortFunc ) : ar;


    };

    // ****************************************
    // *
    // * Takes: a string containing numbers and letters and turn it into an array
    // * Returns: return an array of numbers and letters
    // * Purpose: Used for logical sorting. String Example: 12ABC results: [12,'ABC']
    // **************************************** 
    (function () {
      // creates a cache for numchar conversions
      var cache = {}, cachcounter = 0;
      // creates the numcharsplit function
      numcharsplit = function ( thing ) {
        // if over 1000 items exist in the cache, clear it and start over
        if ( cachcounter > cmax ){
          cache = {};
          cachcounter = 0;
        }

        // if a cache can be found for a numchar then return its array value
        return cache['_' + thing] || (function () {
          // otherwise do the conversion
          // make sure it is a string and setup so other variables
          var nthing = String( thing ),
            na = [],
            rv = '_',
            rt = '',
            x, xx, c;

          // loop over the string char by char
          for ( x = 0, xx = nthing.length; x < xx; x++ ){
            // take the char at each location
            c = nthing.charCodeAt( x );
            // check to see if it is a valid number char and append it to the array.
            // if last char was a string push the string to the charnum array
            if ( ( c >= 48 && c <= 57 ) || c === 46 ){
              if ( rt !== 'n' ){
                rt = 'n';
                na.push( rv.toLowerCase() );
                rv = '';
              }
              rv = rv + nthing.charAt( x );
            }
            else {
              // check to see if it is a valid string char and append to string
              // if last char was a number push the whole number to the charnum array
              if ( rt !== 's' ){
                rt = 's';
                na.push( parseFloat( rv ) );
                rv = '';
              }
              rv = rv + nthing.charAt( x );
            }
          }
          // once done, push the last value to the charnum array and remove the first uneeded item
          na.push( (rt === 'n') ? parseFloat( rv ) : rv.toLowerCase() );
          na.shift();
          // add to cache
          cache['_' + thing] = na;
          cachcounter++;
          // return charnum array
          return na;
        }());
      };
    }());

    // ****************************************
    // *
    // * Runs a query
    // **************************************** 


    run = function () {
      this.context( {
        results : this.getDBI().query( this.context() )
      });

    };

    API.extend( 'filter', function () {
      // ****************************************
      // *
      // * Takes: takes unlimited filter objects as arguments
      // * Returns: method collection
      // * Purpose: Take filters as objects and cache functions for later lookup when a query is run
      // **************************************** 
      var
        nc = TAFFY.mergeObj( this.context(), { run : null } ),
        nq = []
      ;
      each( nc.q, function ( v ) {
        nq.push( v );
      });
      nc.q = nq;
      // Hadnle passing of ___ID or a record on lookup.
      each( arguments, function ( f ) {
        nc.q.push( returnFilter( f ) );
        nc.filterRaw.push( f );
      });

      return this.getroot( nc );
    });

    API.extend( 'order', function ( o ) {
      // ****************************************
      // *
      // * Purpose: takes a string and creates an array of order instructions to be used with a query
      // ****************************************

      o = o.split( ',' );
      var x = [], nc;

      each( o, function ( r ) {
        x.push( r.replace( /^\s*/, '' ).replace( /\s*$/, '' ) );
      });

      nc = TAFFY.mergeObj( this.context(), {sort : null} );
      nc.order = x;

      return this.getroot( nc );
    });

    API.extend( 'limit', function ( n ) {
      // ****************************************
      // *
      // * Purpose: takes a limit number to limit the number of rows returned by a query. Will update the results
      // * of a query
      // **************************************** 
      var nc = TAFFY.mergeObj( this.context(), {}),
        limitedresults
        ;

      nc.limit = n;

      if ( nc.run && nc.sort ){
        limitedresults = [];
        each( nc.results, function ( i, x ) {
          if ( (x + 1) > n ){
            return TAFFY.EXIT;
          }
          limitedresults.push( i );
        });
        nc.results = limitedresults;
      }

      return this.getroot( nc );
    });

    API.extend( 'start', function ( n ) {
      // ****************************************
      // *
      // * Purpose: takes a limit number to limit the number of rows returned by a query. Will update the results
      // * of a query
      // **************************************** 
      var nc = TAFFY.mergeObj( this.context(), {} ),
        limitedresults
        ;

      nc.start = n;

      if ( nc.run && nc.sort && !nc.limit ){
        limitedresults = [];
        each( nc.results, function ( i, x ) {
          if ( (x + 1) > n ){
            limitedresults.push( i );
          }
        });
        nc.results = limitedresults;
      }
      else {
        nc = TAFFY.mergeObj( this.context(), {run : null, start : n} );
      }

      return this.getroot( nc );
    });

    API.extend( 'update', function ( arg0, arg1, arg2 ) {
      // ****************************************
      // *
      // * Takes: a object and passes it off DBI update method for all matched records
      // **************************************** 
      var runEvent = true, o = {}, args = arguments, that;
      if ( TAFFY.isString( arg0 ) &&
        (arguments.length === 2 || arguments.length === 3) )
      {
        o[arg0] = arg1;
        if ( arguments.length === 3 ){
          runEvent = arg2;
        }
      }
      else {
        o = arg0;
        if ( args.length === 2 ){
          runEvent = arg1;
        }
      }

      that = this;
      run.call( this );
      each( this.context().results, function ( r ) {
        var c = o;
        if ( TAFFY.isFunction( c ) ){
          c = c.apply( TAFFY.mergeObj( r, {} ) );
        }
        else {
          if ( T.isFunction( c ) ){
            c = c( TAFFY.mergeObj( r, {} ) );
          }
        }
        if ( TAFFY.isObject( c ) ){
          that.getDBI().update( r.___id, c, runEvent );
        }
      });
      if ( this.context().results.length ){
        this.context( { run : null });
      }
      return this;
    });
    API.extend( 'remove', function ( runEvent ) {
      // ****************************************
      // *
      // * Purpose: removes records from the DB via the remove and removeCommit DBI methods
      // **************************************** 
      var that = this, c = 0;
      run.call( this );
      each( this.context().results, function ( r ) {
        that.getDBI().remove( r.___id );
        c++;
      });
      if ( this.context().results.length ){
        this.context( {
          run : null
        });
        that.getDBI().removeCommit( runEvent );
      }

      return c;
    });


    API.extend( 'count', function () {
      // ****************************************
      // *
      // * Returns: The length of a query result
      // **************************************** 
      run.call( this );
      return this.context().results.length;
    });

    API.extend( 'callback', function ( f, delay ) {
      // ****************************************
      // *
      // * Returns null;
      // * Runs a function on return of run.call
      // **************************************** 
      if ( f ){
        var that = this;
        setTimeout( function () {
          run.call( that );
          f.call( that.getroot( that.context() ) );
        }, delay || 0 );
      }


      return null;
    });

    API.extend( 'get', function () {
      // ****************************************
      // *
      // * Returns: An array of all matching records
      // **************************************** 
      run.call( this );
      return this.context().results;
    });

    API.extend( 'stringify', function () {
      // ****************************************
      // *
      // * Returns: An JSON string of all matching records
      // **************************************** 
      return JSON.stringify( this.get() );
    });
    API.extend( 'first', function () {
      // ****************************************
      // *
      // * Returns: The first matching record
      // **************************************** 
      run.call( this );
      return this.context().results[0] || false;
    });
    API.extend( 'last', function () {
      // ****************************************
      // *
      // * Returns: The last matching record
      // **************************************** 
      run.call( this );
      return this.context().results[this.context().results.length - 1] ||
        false;
    });


    API.extend( 'sum', function () {
      // ****************************************
      // *
      // * Takes: column to sum up
      // * Returns: Sums the values of a column
      // **************************************** 
      var total = 0, that = this;
      run.call( that );
      each( arguments, function ( c ) {
        each( that.context().results, function ( r ) {
          total = total + (r[c] || 0);
        });
      });
      return total;
    });

    API.extend( 'min', function ( c ) {
      // ****************************************
      // *
      // * Takes: column to find min
      // * Returns: the lowest value
      // **************************************** 
      var lowest = null;
      run.call( this );
      each( this.context().results, function ( r ) {
        if ( lowest === null || r[c] < lowest ){
          lowest = r[c];
        }
      });
      return lowest;
    });

    //  Taffy innerJoin Extension (OCD edition)
    //  =======================================
    //
    //  How to Use
    //  **********
    //
    //  left_table.innerJoin( right_table, condition1 <,... conditionN> )
    //
    //  A condition can take one of 2 forms:
    //
    //    1. An ARRAY with 2 or 3 values:
    //    A column name from the left table, an optional comparison string,
    //    and column name from the right table.  The condition passes if the test
    //    indicated is true.   If the condition string is omitted, '===' is assumed.
    //    EXAMPLES: [ 'last_used_time', '>=', 'current_use_time' ], [ 'user_id','id' ]
    //
    //    2. A FUNCTION:
    //    The function receives a left table row and right table row during the
    //    cartesian join.  If the function returns true for the rows considered,
    //    the merged row is included in the result set.
    //    EXAMPLE: function (l,r){ return l.name === r.label; }
    //
    //  Conditions are considered in the order they are presented.  Therefore the best
    //  performance is realized when the least expensive and highest prune-rate
    //  conditions are placed first, since if they return false Taffy skips any
    //  further condition tests.
    //
    //  Other notes
    //  ***********
    //
    //  This code passes jslint with the exception of 2 warnings about
    //  the '==' and '!=' lines.  We can't do anything about that short of
    //  deleting the lines.
    //
    //  Credits
    //  *******
    //
    //  Heavily based upon the work of Ian Toltz.
    //  Revisions to API by Michael Mikowski.
    //  Code convention per standards in http://manning.com/mikowski
    (function () {
      var innerJoinFunction = (function () {
        var fnCompareList, fnCombineRow, fnMain;

        fnCompareList = function ( left_row, right_row, arg_list ) {
          var data_lt, data_rt, op_code, error;

          if ( arg_list.length === 2 ){
            data_lt = left_row[arg_list[0]];
            op_code = '===';
            data_rt = right_row[arg_list[1]];
          }
          else {
            data_lt = left_row[arg_list[0]];
            op_code = arg_list[1];
            data_rt = right_row[arg_list[2]];
          }

          /*jslint eqeq : true */
          switch ( op_code ){
            case '===' :
              return data_lt === data_rt;
            case '!==' :
              return data_lt !== data_rt;
            case '<'   :
              return data_lt < data_rt;
            case '>'   :
              return data_lt > data_rt;
            case '<='  :
              return data_lt <= data_rt;
            case '>='  :
              return data_lt >= data_rt;
            case '=='  :
              return data_lt == data_rt;
            case '!='  :
              return data_lt != data_rt;
            default :
              throw String( op_code ) + ' is not supported';
          }
          // 'jslint eqeq : false'  here results in
          // "Unreachable '/*jslint' after 'return'".
          // We don't need it though, as the rule exception
          // is discarded at the end of this functional scope
        };

        fnCombineRow = function ( left_row, right_row ) {
          var out_map = {}, i, prefix;

          for ( i in left_row ){
            if ( left_row.hasOwnProperty( i ) ){
              out_map[i] = left_row[i];
            }
          }
          for ( i in right_row ){
            if ( right_row.hasOwnProperty( i ) && i !== '___id' &&
              i !== '___s' )
            {
              prefix = !TAFFY.isUndefined( out_map[i] ) ? 'right_' : '';
              out_map[prefix + String( i ) ] = right_row[i];
            }
          }
          return out_map;
        };

        fnMain = function ( table ) {
          var
            right_table, i,
            arg_list = arguments,
            arg_length = arg_list.length,
            result_list = []
            ;

          if ( typeof table.filter !== 'function' ){
            if ( table.TAFFY ){ right_table = table(); }
            else {
              throw 'TAFFY DB or result not supplied';
            }
          }
          else { right_table = table; }

          this.context( {
            results : this.getDBI().query( this.context() )
          } );

          TAFFY.each( this.context().results, function ( left_row ) {
            right_table.each( function ( right_row ) {
              var arg_data, is_ok = true;
              CONDITION:
                for ( i = 1; i < arg_length; i++ ){
                  arg_data = arg_list[i];
                  if ( typeof arg_data === 'function' ){
                    is_ok = arg_data( left_row, right_row );
                  }
                  else if ( typeof arg_data === 'object' && arg_data.length ){
                    is_ok = fnCompareList( left_row, right_row, arg_data );
                  }
                  else {
                    is_ok = false;
                  }

                  if ( !is_ok ){ break CONDITION; } // short circuit
                }

              if ( is_ok ){
                result_list.push( fnCombineRow( left_row, right_row ) );
              }
            } );
          } );
          return TAFFY( result_list )();
        };

        return fnMain;
      }());

      API.extend( 'join', innerJoinFunction );
    }());

    API.extend( 'max', function ( c ) {
      // ****************************************
      // *
      // * Takes: column to find max
      // * Returns: the highest value
      // ****************************************
      var highest = null;
      run.call( this );
      each( this.context().results, function ( r ) {
        if ( highest === null || r[c] > highest ){
          highest = r[c];
        }
      });
      return highest;
    });

    API.extend( 'select', function () {
      // ****************************************
      // *
      // * Takes: columns to select values into an array
      // * Returns: array of values
      // * Note if more than one column is given an array of arrays is returned
      // **************************************** 

      var ra = [], args = arguments;
      run.call( this );
      if ( arguments.length === 1 ){

        each( this.context().results, function ( r ) {

          ra.push( r[args[0]] );
        });
      }
      else {
        each( this.context().results, function ( r ) {
          var row = [];
          each( args, function ( c ) {
            row.push( r[c] );
          });
          ra.push( row );
        });
      }
      return ra;
    });
    API.extend( 'distinct', function () {
      // ****************************************
      // *
      // * Takes: columns to select unique alues into an array
      // * Returns: array of values
      // * Note if more than one column is given an array of arrays is returned
      // **************************************** 
      var ra = [], args = arguments;
      run.call( this );
      if ( arguments.length === 1 ){

        each( this.context().results, function ( r ) {
          var v = r[args[0]], dup = false;
          each( ra, function ( d ) {
            if ( v === d ){
              dup = true;
              return TAFFY.EXIT;
            }
          });
          if ( !dup ){
            ra.push( v );
          }
        });
      }
      else {
        each( this.context().results, function ( r ) {
          var row = [], dup = false;
          each( args, function ( c ) {
            row.push( r[c] );
          });
          each( ra, function ( d ) {
            var ldup = true;
            each( args, function ( c, i ) {
              if ( row[i] !== d[i] ){
                ldup = false;
                return TAFFY.EXIT;
              }
            });
            if ( ldup ){
              dup = true;
              return TAFFY.EXIT;
            }
          });
          if ( !dup ){
            ra.push( row );
          }
        });
      }
      return ra;
    });
    API.extend( 'supplant', function ( template, returnarray ) {
      // ****************************************
      // *
      // * Takes: a string template formated with key to be replaced with values from the rows, flag to determine if we want array of strings
      // * Returns: array of values or a string
      // **************************************** 
      var ra = [];
      run.call( this );
      each( this.context().results, function ( r ) {
        // TODO: The curly braces used to be unescaped
        ra.push( template.replace( /\{([^\{\}]*)\}/g, function ( a, b ) {
          var v = r[b];
          return typeof v === 'string' || typeof v === 'number' ? v : a;
        } ) );
      });
      return (!returnarray) ? ra.join( "" ) : ra;
    });


    API.extend( 'each', function ( m ) {
      // ****************************************
      // *
      // * Takes: a function
      // * Purpose: loops over every matching record and applies the function
      // **************************************** 
      run.call( this );
      each( this.context().results, m );
      return this;
    });
    API.extend( 'map', function ( m ) {
      // ****************************************
      // *
      // * Takes: a function
      // * Purpose: loops over every matching record and applies the function, returing the results in an array
      // **************************************** 
      var ra = [];
      run.call( this );
      each( this.context().results, function ( r ) {
        ra.push( m( r ) );
      });
      return ra;
    });



    T = function ( d ) {
      // ****************************************
      // *
      // * T is the main TAFFY object
      // * Takes: an array of objects or JSON
      // * Returns a new TAFFYDB
      // **************************************** 
      var TOb = [],
        ID = {},
        RC = 1,
        settings = {
          template          : false,
          onInsert          : false,
          onUpdate          : false,
          onRemove          : false,
          onDBChange        : false,
          storageName       : false,
          forcePropertyCase : null,
          cacheSize         : 100,
          name              : ''
        },
        dm = new Date(),
        CacheCount = 0,
        CacheClear = 0,
        Cache = {},
        DBI, runIndexes, root
        ;
      // ****************************************
      // *
      // * TOb = this database
      // * ID = collection of the record IDs and locations within the DB, used for fast lookups
      // * RC = record counter, used for creating IDs
      // * settings.template = the template to merge all new records with
      // * settings.onInsert = event given a copy of the newly inserted record
      // * settings.onUpdate = event given the original record, the changes, and the new record
      // * settings.onRemove = event given the removed record
      // * settings.forcePropertyCase = on insert force the proprty case to be lower or upper. default lower, null/undefined will leave case as is
      // * dm = the modify date of the database, used for query caching
      // **************************************** 


      runIndexes = function ( indexes ) {
        // ****************************************
        // *
        // * Takes: a collection of indexes
        // * Returns: collection with records matching indexed filters
        // **************************************** 

        var records = [], UniqueEnforce = false;

        if ( indexes.length === 0 ){
          return TOb;
        }

        each( indexes, function ( f ) {
          // Check to see if record ID
          if ( T.isString( f ) && /[t][0-9]*[r][0-9]*/i.test( f ) &&
            TOb[ID[f]] )
          {
            records.push( TOb[ID[f]] );
            UniqueEnforce = true;
          }
          // Check to see if record
          if ( T.isObject( f ) && f.___id && f.___s &&
            TOb[ID[f.___id]] )
          {
            records.push( TOb[ID[f.___id]] );
            UniqueEnforce = true;
          }
          // Check to see if array of indexes
          if ( T.isArray( f ) ){
            each( f, function ( r ) {
              each( runIndexes( r ), function ( rr ) {
                records.push( rr );
              });

            });
          }
        });
        if ( UniqueEnforce && records.length > 1 ){
          records = [];
        }

        return records;
      };

      DBI = {
        // ****************************************
        // *
        // * The DBI is the internal DataBase Interface that interacts with the data
        // **************************************** 
        dm           : function ( nd ) {
          // ****************************************
          // *
          // * Takes: an optional new modify date
          // * Purpose: used to get and set the DB modify date
          // **************************************** 
          if ( nd ){
            dm = nd;
            Cache = {};
            CacheCount = 0;
            CacheClear = 0;
          }
          if ( settings.onDBChange ){
            setTimeout( function () {
              settings.onDBChange.call( TOb );
            }, 0 );
          }
          if ( settings.storageName ){
            setTimeout( function () {
              localStorage.setItem( 'taffy_' + settings.storageName,
                JSON.stringify( TOb ) );
            });
          }
          return dm;
        },
        insert       : function ( i, runEvent ) {
          // ****************************************
          // *
          // * Takes: a new record to insert
          // * Purpose: merge the object with the template, add an ID, insert into DB, call insert event
          // **************************************** 
          var columns = [],
            records   = [],
            input     = protectJSON( i )
            ;
          each( input, function ( v, i ) {
            var nv, o;
            if ( T.isArray( v ) && i === 0 ){
              each( v, function ( av ) {

                columns.push( (settings.forcePropertyCase === 'lower')
                  ? av.toLowerCase()
                    : (settings.forcePropertyCase === 'upper')
                  ? av.toUpperCase() : av );
              });
              return true;
            }
            else if ( T.isArray( v ) ){
              nv = {};
              each( v, function ( av, ai ) {
                nv[columns[ai]] = av;
              });
              v = nv;

            }
            else if ( T.isObject( v ) && settings.forcePropertyCase ){
              o = {};

              eachin( v, function ( av, ai ) {
                o[(settings.forcePropertyCase === 'lower') ? ai.toLowerCase()
                  : (settings.forcePropertyCase === 'upper')
                  ? ai.toUpperCase() : ai] = v[ai];
              });
              v = o;
            }

            RC++;
            v.___id = 'T' + String( idpad + TC ).slice( -6 ) + 'R' +
              String( idpad + RC ).slice( -6 );
            v.___s = true;
            records.push( v.___id );
            if ( settings.template ){
              v = T.mergeObj( settings.template, v );
            }
            TOb.push( v );

            ID[v.___id] = TOb.length - 1;
            if ( settings.onInsert &&
              (runEvent || TAFFY.isUndefined( runEvent )) )
            {
              settings.onInsert.call( v );
            }
            DBI.dm( new Date() );
          });
          return root( records );
        },
        sort         : function ( o ) {
          // ****************************************
          // *
          // * Purpose: Change the sort order of the DB itself and reset the ID bucket
          // **************************************** 
          TOb = orderByCol( TOb, o.split( ',' ) );
          ID = {};
          each( TOb, function ( r, i ) {
            ID[r.___id] = i;
          });
          DBI.dm( new Date() );
          return true;
        },
        update       : function ( id, changes, runEvent ) {
          // ****************************************
          // *
          // * Takes: the ID of record being changed and the changes
          // * Purpose: Update a record and change some or all values, call the on update method
          // ****************************************

          var nc = {}, or, nr, tc, hasChange;
          if ( settings.forcePropertyCase ){
            eachin( changes, function ( v, p ) {
              nc[(settings.forcePropertyCase === 'lower') ? p.toLowerCase()
                : (settings.forcePropertyCase === 'upper') ? p.toUpperCase()
                : p] = v;
            });
            changes = nc;
          }

          or = TOb[ID[id]];
          nr = T.mergeObj( or, changes );

          tc = {};
          hasChange = false;
          eachin( nr, function ( v, i ) {
            if ( TAFFY.isUndefined( or[i] ) || or[i] !== v ){
              tc[i] = v;
              hasChange = true;
            }
          });
          if ( hasChange ){
            if ( settings.onUpdate &&
              (runEvent || TAFFY.isUndefined( runEvent )) )
            {
              settings.onUpdate.call( nr, TOb[ID[id]], tc );
            }
            TOb[ID[id]] = nr;
            DBI.dm( new Date() );
          }
        },
        remove       : function ( id ) {
          // ****************************************
          // *
          // * Takes: the ID of record to be removed
          // * Purpose: remove a record, changes its ___s value to false
          // **************************************** 
          TOb[ID[id]].___s = false;
        },
        removeCommit : function ( runEvent ) {
          var x;
          // ****************************************
          // *
          // * 
          // * Purpose: loop over all records and remove records with ___s = false, call onRemove event, clear ID
          // ****************************************
          for ( x = TOb.length - 1; x > -1; x-- ){

            if ( !TOb[x].___s ){
              if ( settings.onRemove &&
                (runEvent || TAFFY.isUndefined( runEvent )) )
              {
                settings.onRemove.call( TOb[x] );
              }
              ID[TOb[x].___id] = undefined;
              TOb.splice( x, 1 );
            }
          }
          ID = {};
          each( TOb, function ( r, i ) {
            ID[r.___id] = i;
          });
          DBI.dm( new Date() );
        },
        query : function ( context ) {
          // ****************************************
          // *
          // * Takes: the context object for a query and either returns a cache result or a new query result
          // **************************************** 
          var returnq, cid, results, indexed, limitq, ni;

          if ( settings.cacheSize ) {
            cid = '';
            each( context.filterRaw, function ( r ) {
              if ( T.isFunction( r ) ){
                cid = 'nocache';
                return TAFFY.EXIT;
              }
            });
            if ( cid === '' ){
              cid = makeCid( T.mergeObj( context,
                {q : false, run : false, sort : false} ) );
            }
          }
          // Run a new query if there are no results or the run date has been cleared
          if ( !context.results || !context.run ||
            (context.run && DBI.dm() > context.run) )
          {
            results = [];

            // check Cache

            if ( settings.cacheSize && Cache[cid] ){

              Cache[cid].i = CacheCount++;
              return Cache[cid].results;
            }
            else {
              // if no filter, return DB
              if ( context.q.length === 0 && context.index.length === 0 ){
                each( TOb, function ( r ) {
                  results.push( r );
                });
                returnq = results;
              }
              else {
                // use indexes

                indexed = runIndexes( context.index );

                // run filters
                each( indexed, function ( r ) {
                  // Run filter to see if record matches query
                  if ( context.q.length === 0 || runFilters( r, context.q ) ){
                    results.push( r );
                  }
                });

                returnq = results;
              }
            }


          }
          else {
            // If query exists and run has not been cleared return the cache results
            returnq = context.results;
          }
          // If a custom order array exists and the run has been clear or the sort has been cleared
          if ( context.order.length > 0 && (!context.run || !context.sort) ){
            // order the results
            returnq = orderByCol( returnq, context.order );
          }

          // If a limit on the number of results exists and it is less than the returned results, limit results
          if ( returnq.length &&
            ((context.limit && context.limit < returnq.length) ||
              context.start)
          ) {
            limitq = [];
            each( returnq, function ( r, i ) {
              if ( !context.start ||
                (context.start && (i + 1) >= context.start) )
              {
                if ( context.limit ){
                  ni = (context.start) ? (i + 1) - context.start : i;
                  if ( ni < context.limit ){
                    limitq.push( r );
                  }
                  else if ( ni > context.limit ){
                    return TAFFY.EXIT;
                  }
                }
                else {
                  limitq.push( r );
                }
              }
            });
            returnq = limitq;
          }

          // update cache
          if ( settings.cacheSize && cid !== 'nocache' ){
            CacheClear++;

            setTimeout( function () {
              var bCounter, nc;
              if ( CacheClear >= settings.cacheSize * 2 ){
                CacheClear = 0;
                bCounter = CacheCount - settings.cacheSize;
                nc = {};
                eachin( function ( r, k ) {
                  if ( r.i >= bCounter ){
                    nc[k] = r;
                  }
                });
                Cache = nc;
              }
            }, 0 );

            Cache[cid] = { i : CacheCount++, results : returnq };
          }
          return returnq;
        }
      };


      root = function () {
        var iAPI, context;
        // ****************************************
        // *
        // * The root function that gets returned when a new DB is created
        // * Takes: unlimited filter arguments and creates filters to be run when a query is called
        // **************************************** 
        // ****************************************
        // *
        // * iAPI is the the method collection valiable when a query has been started by calling dbname
        // * Certain methods are or are not avaliable once you have started a query such as insert -- you can only insert into root
        // ****************************************
        iAPI = TAFFY.mergeObj( TAFFY.mergeObj( API, { insert : undefined } ),
          { getDBI  : function () { return DBI; },
            getroot : function ( c ) { return root.call( c ); },
          context : function ( n ) {
            // ****************************************
            // *
            // * The context contains all the information to manage a query including filters, limits, and sorts
            // **************************************** 
            if ( n ){
              context = TAFFY.mergeObj( context,
                n.hasOwnProperty('results')
                  ? TAFFY.mergeObj( n, { run : new Date(), sort: new Date() })
                  : n
              );
            }
            return context;
          },
          extend  : undefined
        });

        context = (this && this.q) ? this : {
          limit     : false,
          start     : false,
          q         : [],
          filterRaw : [],
          index     : [],
          order     : [],
          results   : false,
          run       : null,
          sort      : null,
          settings  : settings
        };
        // ****************************************
        // *
        // * Call the query method to setup a new query
        // **************************************** 
        each( arguments, function ( f ) {

          if ( isIndexable( f ) ){
            context.index.push( f );
          }
          else {
            context.q.push( returnFilter( f ) );
          }
          context.filterRaw.push( f );
        });


        return iAPI;
      };

      // ****************************************
      // *
      // * If new records have been passed on creation of the DB either as JSON or as an array/object, insert them
      // **************************************** 
      TC++;
      if ( d ){
        DBI.insert( d );
      }


      root.insert = DBI.insert;

      root.merge = function ( i, key, runEvent ) {
        var
          search      = {},
          finalSearch = [],
          obj         = {}
          ;

        runEvent    = runEvent || false;
        key         = key      || 'id';

        each( i, function ( o ) {
          var existingObject;
          search[key] = o[key];
          finalSearch.push( o[key] );
          existingObject = root( search ).first();
          if ( existingObject ){
            DBI.update( existingObject.___id, o, runEvent );
          }
          else {
            DBI.insert( o, runEvent );
          }
        });

        obj[key] = finalSearch;
        return root( obj );
      };

      root.TAFFY = true;
      root.sort = DBI.sort;
      // ****************************************
      // *
      // * These are the methods that can be accessed on off the root DB function. Example dbname.insert;
      // **************************************** 
      root.settings = function ( n ) {
        // ****************************************
        // *
        // * Getting and setting for this DB's settings/events
        // **************************************** 
        if ( n ){
          settings = TAFFY.mergeObj( settings, n );
          if ( n.template ){

            root().update( n.template );
          }
        }
        return settings;
      };

      // ****************************************
      // *
      // * These are the methods that can be accessed on off the root DB function. Example dbname.insert;
      // **************************************** 
      root.store = function ( n ) {
        // ****************************************
        // *
        // * Setup localstorage for this DB on a given name
        // * Pull data into the DB as needed
        // **************************************** 
        var r = false, i;
        if ( localStorage ){
          if ( n ){
            i = localStorage.getItem( 'taffy_' + n );
            if ( i && i.length > 0 ){
              root.insert( i );
              r = true;
            }
            if ( TOb.length > 0 ){
              setTimeout( function () {
                localStorage.setItem( 'taffy_' + settings.storageName,
                  JSON.stringify( TOb ) );
              });
            }
          }
          root.settings( {storageName : n} );
        }
        return root;
      };

      // ****************************************
      // *
      // * Return root on DB creation and start having fun
      // **************************************** 
      return root;
    };
    // ****************************************
    // *
    // * Sets the global TAFFY object
    // **************************************** 
    TAFFY = T;


    // ****************************************
    // *
    // * Create public each method
    // *
    // ****************************************   
    T.each = each;

    // ****************************************
    // *
    // * Create public eachin method
    // *
    // ****************************************   
    T.eachin = eachin;
    // ****************************************
    // *
    // * Create public extend method
    // * Add a custom method to the API
    // *
    // ****************************************   
    T.extend = API.extend;


    // ****************************************
    // *
    // * Creates TAFFY.EXIT value that can be returned to stop an each loop
    // *
    // ****************************************  
    TAFFY.EXIT = 'TAFFYEXIT';

    // ****************************************
    // *
    // * Create public utility mergeObj method
    // * Return a new object where items from obj2
    // * have replaced or been added to the items in
    // * obj1
    // * Purpose: Used to combine objs
    // *
    // ****************************************   
    TAFFY.mergeObj = function ( ob1, ob2 ) {
      var c = {};
      eachin( ob1, function ( v, n ) { c[n] = ob1[n]; });
      eachin( ob2, function ( v, n ) { c[n] = ob2[n]; });
      return c;
    };


    // ****************************************
    // *
    // * Create public utility has method
    // * Returns true if a complex object, array
    // * or taffy collection contains the material
    // * provided in the second argument
    // * Purpose: Used to comare objects
    // *
    // ****************************************
    TAFFY.has = function ( var1, var2 ) {

      var re = false, n;

      if ( (var1.TAFFY) ){
        re = var1( var2 );
        if ( re.length > 0 ){
          return true;
        }
        else {
          return false;
        }
      }
      else {

        switch ( T.typeOf( var1 ) ){
          case 'object':
            if ( T.isObject( var2 ) ){
              eachin( var2, function ( v, n ) {
                if ( re === true && !T.isUndefined( var1[n] ) &&
                  var1.hasOwnProperty( n ) )
                {
                  re = T.has( var1[n], var2[n] );
                }
                else {
                  re = false;
                  return TAFFY.EXIT;
                }
              });
            }
            else if ( T.isArray( var2 ) ){
              each( var2, function ( v, n ) {
                re = T.has( var1, var2[n] );
                if ( re ){
                  return TAFFY.EXIT;
                }
              });
            }
            else if ( T.isString( var2 ) ){
              if ( !TAFFY.isUndefined( var1[var2] ) ){
                return true;
              }
              else {
                return false;
              }
            }
            return re;
          case 'array':
            if ( T.isObject( var2 ) ){
              each( var1, function ( v, i ) {
                re = T.has( var1[i], var2 );
                if ( re === true ){
                  return TAFFY.EXIT;
                }
              });
            }
            else if ( T.isArray( var2 ) ){
              each( var2, function ( v2, i2 ) {
                each( var1, function ( v1, i1 ) {
                  re = T.has( var1[i1], var2[i2] );
                  if ( re === true ){
                    return TAFFY.EXIT;
                  }
                });
                if ( re === true ){
                  return TAFFY.EXIT;
                }
              });
            }
            else if ( T.isString( var2 ) || T.isNumber( var2 ) ){
             re = false;
              for ( n = 0; n < var1.length; n++ ){
                re = T.has( var1[n], var2 );
                if ( re ){
                  return true;
                }
              }
            }
            return re;
          case 'string':
            if ( T.isString( var2 ) && var2 === var1 ){
              return true;
            }
            break;
          default:
            if ( T.typeOf( var1 ) === T.typeOf( var2 ) && var1 === var2 ){
              return true;
            }
            break;
        }
      }
      return false;
    };

    // ****************************************
    // *
    // * Create public utility hasAll method
    // * Returns true if a complex object, array
    // * or taffy collection contains the material
    // * provided in the call - for arrays it must
    // * contain all the material in each array item
    // * Purpose: Used to comare objects
    // *
    // ****************************************
    TAFFY.hasAll = function ( var1, var2 ) {

      var T = TAFFY, ar;
      if ( T.isArray( var2 ) ){
        ar = true;
        each( var2, function ( v ) {
          ar = T.has( var1, v );
          if ( ar === false ){
            return TAFFY.EXIT;
          }
        });
        return ar;
      }
      else {
        return T.has( var1, var2 );
      }
    };


    // ****************************************
    // *
    // * typeOf Fixed in JavaScript as public utility
    // *
    // ****************************************
    TAFFY.typeOf = function ( v ) {
      var s = typeof v;
      if ( s === 'object' ){
        if ( v ){
          if ( typeof v.length === 'number' &&
            !(v.propertyIsEnumerable( 'length' )) )
          {
            s = 'array';
          }
        }
        else {
          s = 'null';
        }
      }
      return s;
    };

    // ****************************************
    // *
    // * Create public utility getObjectKeys method
    // * Returns an array of an objects keys
    // * Purpose: Used to get the keys for an object
    // *
    // ****************************************   
    TAFFY.getObjectKeys = function ( ob ) {
      var kA = [];
      eachin( ob, function ( n, h ) {
        kA.push( h );
      });
      kA.sort();
      return kA;
    };

    // ****************************************
    // *
    // * Create public utility isSameArray
    // * Returns an array of an objects keys
    // * Purpose: Used to get the keys for an object
    // *
    // ****************************************   
    TAFFY.isSameArray = function ( ar1, ar2 ) {
      return (TAFFY.isArray( ar1 ) && TAFFY.isArray( ar2 ) &&
        ar1.join( ',' ) === ar2.join( ',' )) ? true : false;
    };

    // ****************************************
    // *
    // * Create public utility isSameObject method
    // * Returns true if objects contain the same
    // * material or false if they do not
    // * Purpose: Used to comare objects
    // *
    // ****************************************   
    TAFFY.isSameObject = function ( ob1, ob2 ) {
      var T = TAFFY, rv = true;

      if ( T.isObject( ob1 ) && T.isObject( ob2 ) ){
        if ( T.isSameArray( T.getObjectKeys( ob1 ),
          T.getObjectKeys( ob2 ) ) )
        {
          eachin( ob1, function ( v, n ) {
            if ( ! ( (T.isObject( ob1[n] ) && T.isObject( ob2[n] ) &&
              T.isSameObject( ob1[n], ob2[n] )) ||
              (T.isArray( ob1[n] ) && T.isArray( ob2[n] ) &&
                T.isSameArray( ob1[n], ob2[n] )) || (ob1[n] === ob2[n]) )
            ) {
              rv = false;
              return TAFFY.EXIT;
            }
          });
        }
        else {
          rv = false;
        }
      }
      else {
        rv = false;
      }
      return rv;
    };

    // ****************************************
    // *
    // * Create public utility is[DataType] methods
    // * Return true if obj is datatype, false otherwise
    // * Purpose: Used to determine if arguments are of certain data type
    // *
    // * mmikowski 2012-08-06 refactored to make much less "magical":
    // *   fewer closures and passes jslint
    // *
    // ****************************************

    typeList = [
      'String',  'Number', 'Object',   'Array',
      'Boolean', 'Null',   'Function', 'Undefined'
    ];
  
    makeTest = function ( thisKey ) {
      return function ( data ) {
        return TAFFY.typeOf( data ) === thisKey.toLowerCase() ? true : false;
      };
    };
  
    for ( idx = 0; idx < typeList.length; idx++ ){
      typeKey = typeList[idx];
      TAFFY['is' + typeKey] = makeTest( typeKey );
    }
  }
}());

if ( typeof(exports) === 'object' ){
  exports.taffy = TAFFY;
}


},{}],3:[function(require,module,exports){
'use strict';

var angular = require('angular');
var taffy = require('taffydb').taffy;

module.exports = todoStubs;

function todoStubs($httpBackend, $log) {
    $log.debug('[Run] Adding todo stubs...');

    // Simulate CRUD in client with TaffyDB
    // http://www.taffydb.com/writingqueries
    var todoDb = taffy();
    todoDb.store('todos');

    // Seed empty data
    if (todoDb().count() === 0) {
        todoDb.insert([
            {title: 'Do something', isComplete: true},
            {title: 'Do something else', isComplete: false}
        ]);
    }

    // GET: /todos
    $httpBackend.whenGET('/api/todos').respond(function() {
        return [200, todoDb().get(), {}];
    });

    // POST: /todos
    $httpBackend.whenPOST('/api/todos').respond(function(method, url, data) {
        var todos = angular.fromJson(data);
        todoDb().remove();
        todoDb.insert(todos);
        return [200, { status: true }, {}];
    });
}

},{"angular":"angular","taffydb":2}],4:[function(require,module,exports){
/*jshint -W098 */
var angular = require('angular');
require('angular-mocks');
var todoStubs = require('./modules/todo/todo-stubs');

// Communicate with globally exposed app
var app = window.SPA.app;
app.dependencies.unshift('appStubs'); // Run first

angular.module('appStubs', ['ngMockE2E']).run(defineFakeBackend);

// @ngInject
function defineFakeBackend($httpBackend, $log) {
    $log.debug('[Run] HTTP stubs setup...');

    // Language bundles
    $httpBackend.whenGET(/^\/lang\//).passThrough();

    // Todo module
    todoStubs($httpBackend, $log);
}
defineFakeBackend.$inject = ['$httpBackend', '$log'];

},{"./modules/todo/todo-stubs":3,"angular":"angular","angular-mocks":1}]},{},[4])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYW5ndWxhci1tb2Nrcy9hbmd1bGFyLW1vY2tzLmpzIiwibm9kZV9tb2R1bGVzL3RhZmZ5ZGIvdGFmZnkuanMiLCJzcmMvY2xpZW50L21vZHVsZXMvdG9kby90b2RvLXN0dWJzLmpzIiwic3JjL2NsaWVudC9zdHVicy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcDVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2orREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQGxpY2Vuc2UgQW5ndWxhckpTIHYxLjQuMFxuICogKGMpIDIwMTAtMjAxNSBHb29nbGUsIEluYy4gaHR0cDovL2FuZ3VsYXJqcy5vcmdcbiAqIExpY2Vuc2U6IE1JVFxuICovXG4oZnVuY3Rpb24od2luZG93LCBhbmd1bGFyLCB1bmRlZmluZWQpIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuZ2RvYyBvYmplY3RcbiAqIEBuYW1lIGFuZ3VsYXIubW9ja1xuICogQGRlc2NyaXB0aW9uXG4gKlxuICogTmFtZXNwYWNlIGZyb20gJ2FuZ3VsYXItbW9ja3MuanMnIHdoaWNoIGNvbnRhaW5zIHRlc3RpbmcgcmVsYXRlZCBjb2RlLlxuICovXG5hbmd1bGFyLm1vY2sgPSB7fTtcblxuLyoqXG4gKiAhIFRoaXMgaXMgYSBwcml2YXRlIHVuZG9jdW1lbnRlZCBzZXJ2aWNlICFcbiAqXG4gKiBAbmFtZSAkYnJvd3NlclxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogVGhpcyBzZXJ2aWNlIGlzIGEgbW9jayBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgbmcuJGJyb3dzZXJ9LiBJdCBwcm92aWRlcyBmYWtlXG4gKiBpbXBsZW1lbnRhdGlvbiBmb3IgY29tbW9ubHkgdXNlZCBicm93c2VyIGFwaXMgdGhhdCBhcmUgaGFyZCB0byB0ZXN0LCBlLmcuIHNldFRpbWVvdXQsIHhocixcbiAqIGNvb2tpZXMsIGV0Yy4uLlxuICpcbiAqIFRoZSBhcGkgb2YgdGhpcyBzZXJ2aWNlIGlzIHRoZSBzYW1lIGFzIHRoYXQgb2YgdGhlIHJlYWwge0BsaW5rIG5nLiRicm93c2VyICRicm93c2VyfSwgZXhjZXB0XG4gKiB0aGF0IHRoZXJlIGFyZSBzZXZlcmFsIGhlbHBlciBtZXRob2RzIGF2YWlsYWJsZSB3aGljaCBjYW4gYmUgdXNlZCBpbiB0ZXN0cy5cbiAqL1xuYW5ndWxhci5tb2NrLiRCcm93c2VyUHJvdmlkZXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy4kZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBhbmd1bGFyLm1vY2suJEJyb3dzZXIoKTtcbiAgfTtcbn07XG5cbmFuZ3VsYXIubW9jay4kQnJvd3NlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdGhpcy5pc01vY2sgPSB0cnVlO1xuICBzZWxmLiQkdXJsID0gXCJodHRwOi8vc2VydmVyL1wiO1xuICBzZWxmLiQkbGFzdFVybCA9IHNlbGYuJCR1cmw7IC8vIHVzZWQgYnkgdXJsIHBvbGxpbmcgZm5cbiAgc2VsZi5wb2xsRm5zID0gW107XG5cbiAgLy8gVE9ETyh2b2p0YSk6IHJlbW92ZSB0aGlzIHRlbXBvcmFyeSBhcGlcbiAgc2VsZi4kJGNvbXBsZXRlT3V0c3RhbmRpbmdSZXF1ZXN0ID0gYW5ndWxhci5ub29wO1xuICBzZWxmLiQkaW5jT3V0c3RhbmRpbmdSZXF1ZXN0Q291bnQgPSBhbmd1bGFyLm5vb3A7XG5cblxuICAvLyByZWdpc3RlciB1cmwgcG9sbGluZyBmblxuXG4gIHNlbGYub25VcmxDaGFuZ2UgPSBmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgIHNlbGYucG9sbEZucy5wdXNoKFxuICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChzZWxmLiQkbGFzdFVybCAhPT0gc2VsZi4kJHVybCB8fCBzZWxmLiQkc3RhdGUgIT09IHNlbGYuJCRsYXN0U3RhdGUpIHtcbiAgICAgICAgICBzZWxmLiQkbGFzdFVybCA9IHNlbGYuJCR1cmw7XG4gICAgICAgICAgc2VsZi4kJGxhc3RTdGF0ZSA9IHNlbGYuJCRzdGF0ZTtcbiAgICAgICAgICBsaXN0ZW5lcihzZWxmLiQkdXJsLCBzZWxmLiQkc3RhdGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcblxuICAgIHJldHVybiBsaXN0ZW5lcjtcbiAgfTtcblxuICBzZWxmLiQkYXBwbGljYXRpb25EZXN0cm95ZWQgPSBhbmd1bGFyLm5vb3A7XG4gIHNlbGYuJCRjaGVja1VybENoYW5nZSA9IGFuZ3VsYXIubm9vcDtcblxuICBzZWxmLmRlZmVycmVkRm5zID0gW107XG4gIHNlbGYuZGVmZXJyZWROZXh0SWQgPSAwO1xuXG4gIHNlbGYuZGVmZXIgPSBmdW5jdGlvbihmbiwgZGVsYXkpIHtcbiAgICBkZWxheSA9IGRlbGF5IHx8IDA7XG4gICAgc2VsZi5kZWZlcnJlZEZucy5wdXNoKHt0aW1lOihzZWxmLmRlZmVyLm5vdyArIGRlbGF5KSwgZm46Zm4sIGlkOiBzZWxmLmRlZmVycmVkTmV4dElkfSk7XG4gICAgc2VsZi5kZWZlcnJlZEZucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEudGltZSAtIGIudGltZTt9KTtcbiAgICByZXR1cm4gc2VsZi5kZWZlcnJlZE5leHRJZCsrO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEBuYW1lICRicm93c2VyI2RlZmVyLm5vd1xuICAgKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQ3VycmVudCBtaWxsaXNlY29uZHMgbW9jayB0aW1lLlxuICAgKi9cbiAgc2VsZi5kZWZlci5ub3cgPSAwO1xuXG5cbiAgc2VsZi5kZWZlci5jYW5jZWwgPSBmdW5jdGlvbihkZWZlcklkKSB7XG4gICAgdmFyIGZuSW5kZXg7XG5cbiAgICBhbmd1bGFyLmZvckVhY2goc2VsZi5kZWZlcnJlZEZucywgZnVuY3Rpb24oZm4sIGluZGV4KSB7XG4gICAgICBpZiAoZm4uaWQgPT09IGRlZmVySWQpIGZuSW5kZXggPSBpbmRleDtcbiAgICB9KTtcblxuICAgIGlmIChmbkluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHNlbGYuZGVmZXJyZWRGbnMuc3BsaWNlKGZuSW5kZXgsIDEpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEBuYW1lICRicm93c2VyI2RlZmVyLmZsdXNoXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBGbHVzaGVzIGFsbCBwZW5kaW5nIHJlcXVlc3RzIGFuZCBleGVjdXRlcyB0aGUgZGVmZXIgY2FsbGJhY2tzLlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcj19IG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZmx1c2guIFNlZSB7QGxpbmsgI2RlZmVyLm5vd31cbiAgICovXG4gIHNlbGYuZGVmZXIuZmx1c2ggPSBmdW5jdGlvbihkZWxheSkge1xuICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChkZWxheSkpIHtcbiAgICAgIHNlbGYuZGVmZXIubm93ICs9IGRlbGF5O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc2VsZi5kZWZlcnJlZEZucy5sZW5ndGgpIHtcbiAgICAgICAgc2VsZi5kZWZlci5ub3cgPSBzZWxmLmRlZmVycmVkRm5zW3NlbGYuZGVmZXJyZWRGbnMubGVuZ3RoIC0gMV0udGltZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZGVmZXJyZWQgdGFza3MgdG8gYmUgZmx1c2hlZCcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHdoaWxlIChzZWxmLmRlZmVycmVkRm5zLmxlbmd0aCAmJiBzZWxmLmRlZmVycmVkRm5zWzBdLnRpbWUgPD0gc2VsZi5kZWZlci5ub3cpIHtcbiAgICAgIHNlbGYuZGVmZXJyZWRGbnMuc2hpZnQoKS5mbigpO1xuICAgIH1cbiAgfTtcblxuICBzZWxmLiQkYmFzZUhyZWYgPSAnLyc7XG4gIHNlbGYuYmFzZUhyZWYgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kJGJhc2VIcmVmO1xuICB9O1xufTtcbmFuZ3VsYXIubW9jay4kQnJvd3Nlci5wcm90b3R5cGUgPSB7XG5cbi8qKlxuICAqIEBuYW1lICRicm93c2VyI3BvbGxcbiAgKlxuICAqIEBkZXNjcmlwdGlvblxuICAqIHJ1biBhbGwgZm5zIGluIHBvbGxGbnNcbiAgKi9cbiAgcG9sbDogZnVuY3Rpb24gcG9sbCgpIHtcbiAgICBhbmd1bGFyLmZvckVhY2godGhpcy5wb2xsRm5zLCBmdW5jdGlvbihwb2xsRm4pIHtcbiAgICAgIHBvbGxGbigpO1xuICAgIH0pO1xuICB9LFxuXG4gIHVybDogZnVuY3Rpb24odXJsLCByZXBsYWNlLCBzdGF0ZSkge1xuICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKHN0YXRlKSkge1xuICAgICAgc3RhdGUgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodXJsKSB7XG4gICAgICB0aGlzLiQkdXJsID0gdXJsO1xuICAgICAgLy8gTmF0aXZlIHB1c2hTdGF0ZSBzZXJpYWxpemVzICYgY29waWVzIHRoZSBvYmplY3Q7IHNpbXVsYXRlIGl0LlxuICAgICAgdGhpcy4kJHN0YXRlID0gYW5ndWxhci5jb3B5KHN0YXRlKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLiQkdXJsO1xuICB9LFxuXG4gIHN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kJHN0YXRlO1xuICB9LFxuXG4gIG5vdGlmeVdoZW5Ob091dHN0YW5kaW5nUmVxdWVzdHM6IGZ1bmN0aW9uKGZuKSB7XG4gICAgZm4oKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIEBuZ2RvYyBwcm92aWRlclxuICogQG5hbWUgJGV4Y2VwdGlvbkhhbmRsZXJQcm92aWRlclxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogQ29uZmlndXJlcyB0aGUgbW9jayBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgbmcuJGV4Y2VwdGlvbkhhbmRsZXJ9IHRvIHJldGhyb3cgb3IgdG8gbG9nIGVycm9yc1xuICogcGFzc2VkIHRvIHRoZSBgJGV4Y2VwdGlvbkhhbmRsZXJgLlxuICovXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lICRleGNlcHRpb25IYW5kbGVyXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBNb2NrIGltcGxlbWVudGF0aW9uIG9mIHtAbGluayBuZy4kZXhjZXB0aW9uSGFuZGxlcn0gdGhhdCByZXRocm93cyBvciBsb2dzIGVycm9ycyBwYXNzZWRcbiAqIHRvIGl0LiBTZWUge0BsaW5rIG5nTW9jay4kZXhjZXB0aW9uSGFuZGxlclByb3ZpZGVyICRleGNlcHRpb25IYW5kbGVyUHJvdmlkZXJ9IGZvciBjb25maWd1cmF0aW9uXG4gKiBpbmZvcm1hdGlvbi5cbiAqXG4gKlxuICogYGBganNcbiAqICAgZGVzY3JpYmUoJyRleGNlcHRpb25IYW5kbGVyUHJvdmlkZXInLCBmdW5jdGlvbigpIHtcbiAqXG4gKiAgICAgaXQoJ3Nob3VsZCBjYXB0dXJlIGxvZyBtZXNzYWdlcyBhbmQgZXhjZXB0aW9ucycsIGZ1bmN0aW9uKCkge1xuICpcbiAqICAgICAgIG1vZHVsZShmdW5jdGlvbigkZXhjZXB0aW9uSGFuZGxlclByb3ZpZGVyKSB7XG4gKiAgICAgICAgICRleGNlcHRpb25IYW5kbGVyUHJvdmlkZXIubW9kZSgnbG9nJyk7XG4gKiAgICAgICB9KTtcbiAqXG4gKiAgICAgICBpbmplY3QoZnVuY3Rpb24oJGxvZywgJGV4Y2VwdGlvbkhhbmRsZXIsICR0aW1lb3V0KSB7XG4gKiAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkgeyAkbG9nLmxvZygxKTsgfSk7XG4gKiAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkgeyAkbG9nLmxvZygyKTsgdGhyb3cgJ2JhbmFuYSBwZWVsJzsgfSk7XG4gKiAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkgeyAkbG9nLmxvZygzKTsgfSk7XG4gKiAgICAgICAgIGV4cGVjdCgkZXhjZXB0aW9uSGFuZGxlci5lcnJvcnMpLnRvRXF1YWwoW10pO1xuICogICAgICAgICBleHBlY3QoJGxvZy5hc3NlcnRFbXB0eSgpKTtcbiAqICAgICAgICAgJHRpbWVvdXQuZmx1c2goKTtcbiAqICAgICAgICAgZXhwZWN0KCRleGNlcHRpb25IYW5kbGVyLmVycm9ycykudG9FcXVhbChbJ2JhbmFuYSBwZWVsJ10pO1xuICogICAgICAgICBleHBlY3QoJGxvZy5sb2cubG9ncykudG9FcXVhbChbWzFdLCBbMl0sIFszXV0pO1xuICogICAgICAgfSk7XG4gKiAgICAgfSk7XG4gKiAgIH0pO1xuICogYGBgXG4gKi9cblxuYW5ndWxhci5tb2NrLiRFeGNlcHRpb25IYW5kbGVyUHJvdmlkZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGhhbmRsZXI7XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJGV4Y2VwdGlvbkhhbmRsZXJQcm92aWRlciNtb2RlXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBTZXRzIHRoZSBsb2dnaW5nIG1vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtb2RlIE1vZGUgb2Ygb3BlcmF0aW9uLCBkZWZhdWx0cyB0byBgcmV0aHJvd2AuXG4gICAqXG4gICAqICAgLSBgbG9nYDogU29tZXRpbWVzIGl0IGlzIGRlc2lyYWJsZSB0byB0ZXN0IHRoYXQgYW4gZXJyb3IgaXMgdGhyb3duLCBmb3IgdGhpcyBjYXNlIHRoZSBgbG9nYFxuICAgKiAgICAgICAgICAgIG1vZGUgc3RvcmVzIGFuIGFycmF5IG9mIGVycm9ycyBpbiBgJGV4Y2VwdGlvbkhhbmRsZXIuZXJyb3JzYCwgdG8gYWxsb3cgbGF0ZXJcbiAgICogICAgICAgICAgICBhc3NlcnRpb24gb2YgdGhlbS4gU2VlIHtAbGluayBuZ01vY2suJGxvZyNhc3NlcnRFbXB0eSBhc3NlcnRFbXB0eSgpfSBhbmRcbiAgICogICAgICAgICAgICB7QGxpbmsgbmdNb2NrLiRsb2cjcmVzZXQgcmVzZXQoKX1cbiAgICogICAtIGByZXRocm93YDogSWYgYW55IGVycm9ycyBhcmUgcGFzc2VkIHRvIHRoZSBoYW5kbGVyIGluIHRlc3RzLCBpdCB0eXBpY2FsbHkgbWVhbnMgdGhhdCB0aGVyZVxuICAgKiAgICAgICAgICAgICAgICBpcyBhIGJ1ZyBpbiB0aGUgYXBwbGljYXRpb24gb3IgdGVzdCwgc28gdGhpcyBtb2NrIHdpbGwgbWFrZSB0aGVzZSB0ZXN0cyBmYWlsLlxuICAgKiAgICAgICAgICAgICAgICBGb3IgYW55IGltcGxlbWVudGF0aW9ucyB0aGF0IGV4cGVjdCBleGNlcHRpb25zIHRvIGJlIHRocm93biwgdGhlIGByZXRocm93YCBtb2RlXG4gICAqICAgICAgICAgICAgICAgIHdpbGwgYWxzbyBtYWludGFpbiBhIGxvZyBvZiB0aHJvd24gZXJyb3JzLlxuICAgKi9cbiAgdGhpcy5tb2RlID0gZnVuY3Rpb24obW9kZSkge1xuXG4gICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICBjYXNlICdsb2cnOlxuICAgICAgY2FzZSAncmV0aHJvdyc6XG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgaGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1vZGUgPT09IFwicmV0aHJvd1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaGFuZGxlci5lcnJvcnMgPSBlcnJvcnM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBtb2RlICdcIiArIG1vZGUgKyBcIicsIG9ubHkgJ2xvZycvJ3JldGhyb3cnIG1vZGVzIGFyZSBhbGxvd2VkIVwiKTtcbiAgICB9XG4gIH07XG5cbiAgdGhpcy4kZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGhhbmRsZXI7XG4gIH07XG5cbiAgdGhpcy5tb2RlKCdyZXRocm93Jyk7XG59O1xuXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lICRsb2dcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqIE1vY2sgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIG5nLiRsb2d9IHRoYXQgZ2F0aGVycyBhbGwgbG9nZ2VkIG1lc3NhZ2VzIGluIGFycmF5c1xuICogKG9uZSBhcnJheSBwZXIgbG9nZ2luZyBsZXZlbCkuIFRoZXNlIGFycmF5cyBhcmUgZXhwb3NlZCBhcyBgbG9nc2AgcHJvcGVydHkgb2YgZWFjaCBvZiB0aGVcbiAqIGxldmVsLXNwZWNpZmljIGxvZyBmdW5jdGlvbiwgZS5nLiBmb3IgbGV2ZWwgYGVycm9yYCB0aGUgYXJyYXkgaXMgZXhwb3NlZCBhcyBgJGxvZy5lcnJvci5sb2dzYC5cbiAqXG4gKi9cbmFuZ3VsYXIubW9jay4kTG9nUHJvdmlkZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRlYnVnID0gdHJ1ZTtcblxuICBmdW5jdGlvbiBjb25jYXQoYXJyYXkxLCBhcnJheTIsIGluZGV4KSB7XG4gICAgcmV0dXJuIGFycmF5MS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyYXkyLCBpbmRleCkpO1xuICB9XG5cbiAgdGhpcy5kZWJ1Z0VuYWJsZWQgPSBmdW5jdGlvbihmbGFnKSB7XG4gICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKGZsYWcpKSB7XG4gICAgICBkZWJ1ZyA9IGZsYWc7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGRlYnVnO1xuICAgIH1cbiAgfTtcblxuICB0aGlzLiRnZXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgJGxvZyA9IHtcbiAgICAgIGxvZzogZnVuY3Rpb24oKSB7ICRsb2cubG9nLmxvZ3MucHVzaChjb25jYXQoW10sIGFyZ3VtZW50cywgMCkpOyB9LFxuICAgICAgd2FybjogZnVuY3Rpb24oKSB7ICRsb2cud2Fybi5sb2dzLnB1c2goY29uY2F0KFtdLCBhcmd1bWVudHMsIDApKTsgfSxcbiAgICAgIGluZm86IGZ1bmN0aW9uKCkgeyAkbG9nLmluZm8ubG9ncy5wdXNoKGNvbmNhdChbXSwgYXJndW1lbnRzLCAwKSk7IH0sXG4gICAgICBlcnJvcjogZnVuY3Rpb24oKSB7ICRsb2cuZXJyb3IubG9ncy5wdXNoKGNvbmNhdChbXSwgYXJndW1lbnRzLCAwKSk7IH0sXG4gICAgICBkZWJ1ZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChkZWJ1Zykge1xuICAgICAgICAgICRsb2cuZGVidWcubG9ncy5wdXNoKGNvbmNhdChbXSwgYXJndW1lbnRzLCAwKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAqIEBuYW1lICRsb2cjcmVzZXRcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAqIFJlc2V0IGFsbCBvZiB0aGUgbG9nZ2luZyBhcnJheXMgdG8gZW1wdHkuXG4gICAgICovXG4gICAgJGxvZy5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAbmdkb2MgcHJvcGVydHlcbiAgICAgICAqIEBuYW1lICRsb2cjbG9nLmxvZ3NcbiAgICAgICAqXG4gICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAqIEFycmF5IG9mIG1lc3NhZ2VzIGxvZ2dlZCB1c2luZyB7QGxpbmsgbmcuJGxvZyNsb2cgYGxvZygpYH0uXG4gICAgICAgKlxuICAgICAgICogQGV4YW1wbGVcbiAgICAgICAqIGBgYGpzXG4gICAgICAgKiAkbG9nLmxvZygnU29tZSBMb2cnKTtcbiAgICAgICAqIHZhciBmaXJzdCA9ICRsb2cubG9nLmxvZ3MudW5zaGlmdCgpO1xuICAgICAgICogYGBgXG4gICAgICAgKi9cbiAgICAgICRsb2cubG9nLmxvZ3MgPSBbXTtcbiAgICAgIC8qKlxuICAgICAgICogQG5nZG9jIHByb3BlcnR5XG4gICAgICAgKiBAbmFtZSAkbG9nI2luZm8ubG9nc1xuICAgICAgICpcbiAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICogQXJyYXkgb2YgbWVzc2FnZXMgbG9nZ2VkIHVzaW5nIHtAbGluayBuZy4kbG9nI2luZm8gYGluZm8oKWB9LlxuICAgICAgICpcbiAgICAgICAqIEBleGFtcGxlXG4gICAgICAgKiBgYGBqc1xuICAgICAgICogJGxvZy5pbmZvKCdTb21lIEluZm8nKTtcbiAgICAgICAqIHZhciBmaXJzdCA9ICRsb2cuaW5mby5sb2dzLnVuc2hpZnQoKTtcbiAgICAgICAqIGBgYFxuICAgICAgICovXG4gICAgICAkbG9nLmluZm8ubG9ncyA9IFtdO1xuICAgICAgLyoqXG4gICAgICAgKiBAbmdkb2MgcHJvcGVydHlcbiAgICAgICAqIEBuYW1lICRsb2cjd2Fybi5sb2dzXG4gICAgICAgKlxuICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgKiBBcnJheSBvZiBtZXNzYWdlcyBsb2dnZWQgdXNpbmcge0BsaW5rIG5nLiRsb2cjd2FybiBgd2FybigpYH0uXG4gICAgICAgKlxuICAgICAgICogQGV4YW1wbGVcbiAgICAgICAqIGBgYGpzXG4gICAgICAgKiAkbG9nLndhcm4oJ1NvbWUgV2FybmluZycpO1xuICAgICAgICogdmFyIGZpcnN0ID0gJGxvZy53YXJuLmxvZ3MudW5zaGlmdCgpO1xuICAgICAgICogYGBgXG4gICAgICAgKi9cbiAgICAgICRsb2cud2Fybi5sb2dzID0gW107XG4gICAgICAvKipcbiAgICAgICAqIEBuZ2RvYyBwcm9wZXJ0eVxuICAgICAgICogQG5hbWUgJGxvZyNlcnJvci5sb2dzXG4gICAgICAgKlxuICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgKiBBcnJheSBvZiBtZXNzYWdlcyBsb2dnZWQgdXNpbmcge0BsaW5rIG5nLiRsb2cjZXJyb3IgYGVycm9yKClgfS5cbiAgICAgICAqXG4gICAgICAgKiBAZXhhbXBsZVxuICAgICAgICogYGBganNcbiAgICAgICAqICRsb2cuZXJyb3IoJ1NvbWUgRXJyb3InKTtcbiAgICAgICAqIHZhciBmaXJzdCA9ICRsb2cuZXJyb3IubG9ncy51bnNoaWZ0KCk7XG4gICAgICAgKiBgYGBcbiAgICAgICAqL1xuICAgICAgJGxvZy5lcnJvci5sb2dzID0gW107XG4gICAgICAgIC8qKlxuICAgICAgICogQG5nZG9jIHByb3BlcnR5XG4gICAgICAgKiBAbmFtZSAkbG9nI2RlYnVnLmxvZ3NcbiAgICAgICAqXG4gICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAqIEFycmF5IG9mIG1lc3NhZ2VzIGxvZ2dlZCB1c2luZyB7QGxpbmsgbmcuJGxvZyNkZWJ1ZyBgZGVidWcoKWB9LlxuICAgICAgICpcbiAgICAgICAqIEBleGFtcGxlXG4gICAgICAgKiBgYGBqc1xuICAgICAgICogJGxvZy5kZWJ1ZygnU29tZSBFcnJvcicpO1xuICAgICAgICogdmFyIGZpcnN0ID0gJGxvZy5kZWJ1Zy5sb2dzLnVuc2hpZnQoKTtcbiAgICAgICAqIGBgYFxuICAgICAgICovXG4gICAgICAkbG9nLmRlYnVnLmxvZ3MgPSBbXTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAqIEBuYW1lICRsb2cjYXNzZXJ0RW1wdHlcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAqIEFzc2VydCB0aGF0IGFsbCBvZiB0aGUgbG9nZ2luZyBtZXRob2RzIGhhdmUgbm8gbG9nZ2VkIG1lc3NhZ2VzLiBJZiBhbnkgbWVzc2FnZXMgYXJlIHByZXNlbnQsXG4gICAgICogYW4gZXhjZXB0aW9uIGlzIHRocm93bi5cbiAgICAgKi9cbiAgICAkbG9nLmFzc2VydEVtcHR5ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZXJyb3JzID0gW107XG4gICAgICBhbmd1bGFyLmZvckVhY2goWydlcnJvcicsICd3YXJuJywgJ2luZm8nLCAnbG9nJywgJ2RlYnVnJ10sIGZ1bmN0aW9uKGxvZ0xldmVsKSB7XG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCgkbG9nW2xvZ0xldmVsXS5sb2dzLCBmdW5jdGlvbihsb2cpIHtcbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2gobG9nLCBmdW5jdGlvbihsb2dJdGVtKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaCgnTU9DSyAkbG9nICgnICsgbG9nTGV2ZWwgKyAnKTogJyArIFN0cmluZyhsb2dJdGVtKSArICdcXG4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgIChsb2dJdGVtLnN0YWNrIHx8ICcnKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICBlcnJvcnMudW5zaGlmdChcIkV4cGVjdGVkICRsb2cgdG8gYmUgZW1wdHkhIEVpdGhlciBhIG1lc3NhZ2Ugd2FzIGxvZ2dlZCB1bmV4cGVjdGVkbHksIG9yIFwiICtcbiAgICAgICAgICBcImFuIGV4cGVjdGVkIGxvZyBtZXNzYWdlIHdhcyBub3QgY2hlY2tlZCBhbmQgcmVtb3ZlZDpcIik7XG4gICAgICAgIGVycm9ycy5wdXNoKCcnKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9ycy5qb2luKCdcXG4tLS0tLS0tLS1cXG4nKSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRsb2cucmVzZXQoKTtcbiAgICByZXR1cm4gJGxvZztcbiAgfTtcbn07XG5cblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgJGludGVydmFsXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBNb2NrIGltcGxlbWVudGF0aW9uIG9mIHRoZSAkaW50ZXJ2YWwgc2VydmljZS5cbiAqXG4gKiBVc2Uge0BsaW5rIG5nTW9jay4kaW50ZXJ2YWwjZmx1c2ggYCRpbnRlcnZhbC5mbHVzaChtaWxsaXMpYH0gdG9cbiAqIG1vdmUgZm9yd2FyZCBieSBgbWlsbGlzYCBtaWxsaXNlY29uZHMgYW5kIHRyaWdnZXIgYW55IGZ1bmN0aW9ucyBzY2hlZHVsZWQgdG8gcnVuIGluIHRoYXRcbiAqIHRpbWUuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbigpfSBmbiBBIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIGJlIGNhbGxlZCByZXBlYXRlZGx5LlxuICogQHBhcmFtIHtudW1iZXJ9IGRlbGF5IE51bWJlciBvZiBtaWxsaXNlY29uZHMgYmV0d2VlbiBlYWNoIGZ1bmN0aW9uIGNhbGwuXG4gKiBAcGFyYW0ge251bWJlcj19IFtjb3VudD0wXSBOdW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0LiBJZiBub3Qgc2V0LCBvciAwLCB3aWxsIHJlcGVhdFxuICogICBpbmRlZmluaXRlbHkuXG4gKiBAcGFyYW0ge2Jvb2xlYW49fSBbaW52b2tlQXBwbHk9dHJ1ZV0gSWYgc2V0IHRvIGBmYWxzZWAgc2tpcHMgbW9kZWwgZGlydHkgY2hlY2tpbmcsIG90aGVyd2lzZVxuICogICB3aWxsIGludm9rZSBgZm5gIHdpdGhpbiB0aGUge0BsaW5rIG5nLiRyb290U2NvcGUuU2NvcGUjJGFwcGx5ICRhcHBseX0gYmxvY2suXG4gKiBAcGFyYW0gey4uLio9fSBQYXNzIGFkZGl0aW9uYWwgcGFyYW1ldGVycyB0byB0aGUgZXhlY3V0ZWQgZnVuY3Rpb24uXG4gKiBAcmV0dXJucyB7cHJvbWlzZX0gQSBwcm9taXNlIHdoaWNoIHdpbGwgYmUgbm90aWZpZWQgb24gZWFjaCBpdGVyYXRpb24uXG4gKi9cbmFuZ3VsYXIubW9jay4kSW50ZXJ2YWxQcm92aWRlciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLiRnZXQgPSBbJyRicm93c2VyJywgJyRyb290U2NvcGUnLCAnJHEnLCAnJCRxJyxcbiAgICAgICBmdW5jdGlvbigkYnJvd3NlciwgICAkcm9vdFNjb3BlLCAgICRxLCAgICQkcSkge1xuICAgIHZhciByZXBlYXRGbnMgPSBbXSxcbiAgICAgICAgbmV4dFJlcGVhdElkID0gMCxcbiAgICAgICAgbm93ID0gMDtcblxuICAgIHZhciAkaW50ZXJ2YWwgPSBmdW5jdGlvbihmbiwgZGVsYXksIGNvdW50LCBpbnZva2VBcHBseSkge1xuICAgICAgdmFyIGhhc1BhcmFtcyA9IGFyZ3VtZW50cy5sZW5ndGggPiA0LFxuICAgICAgICAgIGFyZ3MgPSBoYXNQYXJhbXMgPyBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDQpIDogW10sXG4gICAgICAgICAgaXRlcmF0aW9uID0gMCxcbiAgICAgICAgICBza2lwQXBwbHkgPSAoYW5ndWxhci5pc0RlZmluZWQoaW52b2tlQXBwbHkpICYmICFpbnZva2VBcHBseSksXG4gICAgICAgICAgZGVmZXJyZWQgPSAoc2tpcEFwcGx5ID8gJCRxIDogJHEpLmRlZmVyKCksXG4gICAgICAgICAgcHJvbWlzZSA9IGRlZmVycmVkLnByb21pc2U7XG5cbiAgICAgIGNvdW50ID0gKGFuZ3VsYXIuaXNEZWZpbmVkKGNvdW50KSkgPyBjb3VudCA6IDA7XG4gICAgICBwcm9taXNlLnRoZW4obnVsbCwgbnVsbCwgKCFoYXNQYXJhbXMpID8gZm4gOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICB9KTtcblxuICAgICAgcHJvbWlzZS4kJGludGVydmFsSWQgPSBuZXh0UmVwZWF0SWQ7XG5cbiAgICAgIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgICAgIGRlZmVycmVkLm5vdGlmeShpdGVyYXRpb24rKyk7XG5cbiAgICAgICAgaWYgKGNvdW50ID4gMCAmJiBpdGVyYXRpb24gPj0gY291bnQpIHtcbiAgICAgICAgICB2YXIgZm5JbmRleDtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGl0ZXJhdGlvbik7XG5cbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2gocmVwZWF0Rm5zLCBmdW5jdGlvbihmbiwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChmbi5pZCA9PT0gcHJvbWlzZS4kJGludGVydmFsSWQpIGZuSW5kZXggPSBpbmRleDtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChmbkluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlcGVhdEZucy5zcGxpY2UoZm5JbmRleCwgMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNraXBBcHBseSkge1xuICAgICAgICAgICRicm93c2VyLmRlZmVyLmZsdXNoKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXBlYXRGbnMucHVzaCh7XG4gICAgICAgIG5leHRUaW1lOihub3cgKyBkZWxheSksXG4gICAgICAgIGRlbGF5OiBkZWxheSxcbiAgICAgICAgZm46IHRpY2ssXG4gICAgICAgIGlkOiBuZXh0UmVwZWF0SWQsXG4gICAgICAgIGRlZmVycmVkOiBkZWZlcnJlZFxuICAgICAgfSk7XG4gICAgICByZXBlYXRGbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhLm5leHRUaW1lIC0gYi5uZXh0VGltZTt9KTtcblxuICAgICAgbmV4dFJlcGVhdElkKys7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgKiBAbmFtZSAkaW50ZXJ2YWwjY2FuY2VsXG4gICAgICpcbiAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgKiBDYW5jZWxzIGEgdGFzayBhc3NvY2lhdGVkIHdpdGggdGhlIGBwcm9taXNlYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7cHJvbWlzZX0gcHJvbWlzZSBBIHByb21pc2UgZnJvbSBjYWxsaW5nIHRoZSBgJGludGVydmFsYCBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHRhc2sgd2FzIHN1Y2Nlc3NmdWxseSBjYW5jZWxsZWQuXG4gICAgICovXG4gICAgJGludGVydmFsLmNhbmNlbCA9IGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICAgIGlmICghcHJvbWlzZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgdmFyIGZuSW5kZXg7XG5cbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChyZXBlYXRGbnMsIGZ1bmN0aW9uKGZuLCBpbmRleCkge1xuICAgICAgICBpZiAoZm4uaWQgPT09IHByb21pc2UuJCRpbnRlcnZhbElkKSBmbkluZGV4ID0gaW5kZXg7XG4gICAgICB9KTtcblxuICAgICAgaWYgKGZuSW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXBlYXRGbnNbZm5JbmRleF0uZGVmZXJyZWQucmVqZWN0KCdjYW5jZWxlZCcpO1xuICAgICAgICByZXBlYXRGbnMuc3BsaWNlKGZuSW5kZXgsIDEpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICogQG5hbWUgJGludGVydmFsI2ZsdXNoXG4gICAgICogQGRlc2NyaXB0aW9uXG4gICAgICpcbiAgICAgKiBSdW5zIGludGVydmFsIHRhc2tzIHNjaGVkdWxlZCB0byBiZSBydW4gaW4gdGhlIG5leHQgYG1pbGxpc2AgbWlsbGlzZWNvbmRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXI9fSBtaWxsaXMgbWF4aW11bSB0aW1lb3V0IGFtb3VudCB0byBmbHVzaCB1cCB1bnRpbC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGFtb3VudCBvZiB0aW1lIG1vdmVkIGZvcndhcmQuXG4gICAgICovXG4gICAgJGludGVydmFsLmZsdXNoID0gZnVuY3Rpb24obWlsbGlzKSB7XG4gICAgICBub3cgKz0gbWlsbGlzO1xuICAgICAgd2hpbGUgKHJlcGVhdEZucy5sZW5ndGggJiYgcmVwZWF0Rm5zWzBdLm5leHRUaW1lIDw9IG5vdykge1xuICAgICAgICB2YXIgdGFzayA9IHJlcGVhdEZuc1swXTtcbiAgICAgICAgdGFzay5mbigpO1xuICAgICAgICB0YXNrLm5leHRUaW1lICs9IHRhc2suZGVsYXk7XG4gICAgICAgIHJlcGVhdEZucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEubmV4dFRpbWUgLSBiLm5leHRUaW1lO30pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1pbGxpcztcbiAgICB9O1xuXG4gICAgcmV0dXJuICRpbnRlcnZhbDtcbiAgfV07XG59O1xuXG5cbi8qIGpzaGludCAtVzEwMSAqL1xuLyogVGhlIFJfSVNPODA2MV9TVFIgcmVnZXggaXMgbmV2ZXIgZ29pbmcgdG8gZml0IGludG8gdGhlIDEwMCBjaGFyIGxpbWl0IVxuICogVGhpcyBkaXJlY3RpdmUgc2hvdWxkIGdvIGluc2lkZSB0aGUgYW5vbnltb3VzIGZ1bmN0aW9uIGJ1dCBhIGJ1ZyBpbiBKU0hpbnQgbWVhbnMgdGhhdCBpdCB3b3VsZFxuICogbm90IGJlIGVuYWN0ZWQgZWFybHkgZW5vdWdoIHRvIHByZXZlbnQgdGhlIHdhcm5pbmcuXG4gKi9cbnZhciBSX0lTTzgwNjFfU1RSID0gL14oXFxkezR9KS0/KFxcZFxcZCktPyhcXGRcXGQpKD86VChcXGRcXGQpKD86XFw6PyhcXGRcXGQpKD86XFw6PyhcXGRcXGQpKD86XFwuKFxcZHszfSkpPyk/KT8oWnwoWystXSkoXFxkXFxkKTo/KFxcZFxcZCkpKT8kLztcblxuZnVuY3Rpb24ganNvblN0cmluZ1RvRGF0ZShzdHJpbmcpIHtcbiAgdmFyIG1hdGNoO1xuICBpZiAobWF0Y2ggPSBzdHJpbmcubWF0Y2goUl9JU084MDYxX1NUUikpIHtcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKDApLFxuICAgICAgICB0ekhvdXIgPSAwLFxuICAgICAgICB0ek1pbiAgPSAwO1xuICAgIGlmIChtYXRjaFs5XSkge1xuICAgICAgdHpIb3VyID0gdG9JbnQobWF0Y2hbOV0gKyBtYXRjaFsxMF0pO1xuICAgICAgdHpNaW4gPSB0b0ludChtYXRjaFs5XSArIG1hdGNoWzExXSk7XG4gICAgfVxuICAgIGRhdGUuc2V0VVRDRnVsbFllYXIodG9JbnQobWF0Y2hbMV0pLCB0b0ludChtYXRjaFsyXSkgLSAxLCB0b0ludChtYXRjaFszXSkpO1xuICAgIGRhdGUuc2V0VVRDSG91cnModG9JbnQobWF0Y2hbNF0gfHwgMCkgLSB0ekhvdXIsXG4gICAgICAgICAgICAgICAgICAgICB0b0ludChtYXRjaFs1XSB8fCAwKSAtIHR6TWluLFxuICAgICAgICAgICAgICAgICAgICAgdG9JbnQobWF0Y2hbNl0gfHwgMCksXG4gICAgICAgICAgICAgICAgICAgICB0b0ludChtYXRjaFs3XSB8fCAwKSk7XG4gICAgcmV0dXJuIGRhdGU7XG4gIH1cbiAgcmV0dXJuIHN0cmluZztcbn1cblxuZnVuY3Rpb24gdG9JbnQoc3RyKSB7XG4gIHJldHVybiBwYXJzZUludChzdHIsIDEwKTtcbn1cblxuZnVuY3Rpb24gcGFkTnVtYmVyKG51bSwgZGlnaXRzLCB0cmltKSB7XG4gIHZhciBuZWcgPSAnJztcbiAgaWYgKG51bSA8IDApIHtcbiAgICBuZWcgPSAgJy0nO1xuICAgIG51bSA9IC1udW07XG4gIH1cbiAgbnVtID0gJycgKyBudW07XG4gIHdoaWxlIChudW0ubGVuZ3RoIDwgZGlnaXRzKSBudW0gPSAnMCcgKyBudW07XG4gIGlmICh0cmltKSB7XG4gICAgbnVtID0gbnVtLnN1YnN0cihudW0ubGVuZ3RoIC0gZGlnaXRzKTtcbiAgfVxuICByZXR1cm4gbmVnICsgbnVtO1xufVxuXG5cbi8qKlxuICogQG5nZG9jIHR5cGVcbiAqIEBuYW1lIGFuZ3VsYXIubW9jay5UekRhdGVcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqICpOT1RFKjogdGhpcyBpcyBub3QgYW4gaW5qZWN0YWJsZSBpbnN0YW5jZSwganVzdCBhIGdsb2JhbGx5IGF2YWlsYWJsZSBtb2NrIGNsYXNzIG9mIGBEYXRlYC5cbiAqXG4gKiBNb2NrIG9mIHRoZSBEYXRlIHR5cGUgd2hpY2ggaGFzIGl0cyB0aW1lem9uZSBzcGVjaWZpZWQgdmlhIGNvbnN0cnVjdG9yIGFyZy5cbiAqXG4gKiBUaGUgbWFpbiBwdXJwb3NlIGlzIHRvIGNyZWF0ZSBEYXRlLWxpa2UgaW5zdGFuY2VzIHdpdGggdGltZXpvbmUgZml4ZWQgdG8gdGhlIHNwZWNpZmllZCB0aW1lem9uZVxuICogb2Zmc2V0LCBzbyB0aGF0IHdlIGNhbiB0ZXN0IGNvZGUgdGhhdCBkZXBlbmRzIG9uIGxvY2FsIHRpbWV6b25lIHNldHRpbmdzIHdpdGhvdXQgZGVwZW5kZW5jeSBvblxuICogdGhlIHRpbWUgem9uZSBzZXR0aW5ncyBvZiB0aGUgbWFjaGluZSB3aGVyZSB0aGUgY29kZSBpcyBydW5uaW5nLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXQgT2Zmc2V0IG9mIHRoZSAqZGVzaXJlZCogdGltZXpvbmUgaW4gaG91cnMgKGZyYWN0aW9ucyB3aWxsIGJlIGhvbm9yZWQpXG4gKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gdGltZXN0YW1wIFRpbWVzdGFtcCByZXByZXNlbnRpbmcgdGhlIGRlc2lyZWQgdGltZSBpbiAqVVRDKlxuICpcbiAqIEBleGFtcGxlXG4gKiAhISEhIFdBUk5JTkcgISEhISFcbiAqIFRoaXMgaXMgbm90IGEgY29tcGxldGUgRGF0ZSBvYmplY3Qgc28gb25seSBtZXRob2RzIHRoYXQgd2VyZSBpbXBsZW1lbnRlZCBjYW4gYmUgY2FsbGVkIHNhZmVseS5cbiAqIFRvIG1ha2UgbWF0dGVycyB3b3JzZSwgVHpEYXRlIGluc3RhbmNlcyBpbmhlcml0IHN0dWZmIGZyb20gRGF0ZSB2aWEgYSBwcm90b3R5cGUuXG4gKlxuICogV2UgZG8gb3VyIGJlc3QgdG8gaW50ZXJjZXB0IGNhbGxzIHRvIFwidW5pbXBsZW1lbnRlZFwiIG1ldGhvZHMsIGJ1dCBzaW5jZSB0aGUgbGlzdCBvZiBtZXRob2RzIGlzXG4gKiBpbmNvbXBsZXRlIHdlIG1pZ2h0IGJlIG1pc3Npbmcgc29tZSBub24tc3RhbmRhcmQgbWV0aG9kcy4gVGhpcyBjYW4gcmVzdWx0IGluIGVycm9ycyBsaWtlOlxuICogXCJEYXRlLnByb3RvdHlwZS5mb28gY2FsbGVkIG9uIGluY29tcGF0aWJsZSBPYmplY3RcIi5cbiAqXG4gKiBgYGBqc1xuICogdmFyIG5ld1llYXJJbkJyYXRpc2xhdmEgPSBuZXcgVHpEYXRlKC0xLCAnMjAwOS0xMi0zMVQyMzowMDowMFonKTtcbiAqIG5ld1llYXJJbkJyYXRpc2xhdmEuZ2V0VGltZXpvbmVPZmZzZXQoKSA9PiAtNjA7XG4gKiBuZXdZZWFySW5CcmF0aXNsYXZhLmdldEZ1bGxZZWFyKCkgPT4gMjAxMDtcbiAqIG5ld1llYXJJbkJyYXRpc2xhdmEuZ2V0TW9udGgoKSA9PiAwO1xuICogbmV3WWVhckluQnJhdGlzbGF2YS5nZXREYXRlKCkgPT4gMTtcbiAqIG5ld1llYXJJbkJyYXRpc2xhdmEuZ2V0SG91cnMoKSA9PiAwO1xuICogbmV3WWVhckluQnJhdGlzbGF2YS5nZXRNaW51dGVzKCkgPT4gMDtcbiAqIG5ld1llYXJJbkJyYXRpc2xhdmEuZ2V0U2Vjb25kcygpID0+IDA7XG4gKiBgYGBcbiAqXG4gKi9cbmFuZ3VsYXIubW9jay5UekRhdGUgPSBmdW5jdGlvbihvZmZzZXQsIHRpbWVzdGFtcCkge1xuICB2YXIgc2VsZiA9IG5ldyBEYXRlKDApO1xuICBpZiAoYW5ndWxhci5pc1N0cmluZyh0aW1lc3RhbXApKSB7XG4gICAgdmFyIHRzU3RyID0gdGltZXN0YW1wO1xuXG4gICAgc2VsZi5vcmlnRGF0ZSA9IGpzb25TdHJpbmdUb0RhdGUodGltZXN0YW1wKTtcblxuICAgIHRpbWVzdGFtcCA9IHNlbGYub3JpZ0RhdGUuZ2V0VGltZSgpO1xuICAgIGlmIChpc05hTih0aW1lc3RhbXApKSB7XG4gICAgICB0aHJvdyB7XG4gICAgICAgIG5hbWU6IFwiSWxsZWdhbCBBcmd1bWVudFwiLFxuICAgICAgICBtZXNzYWdlOiBcIkFyZyAnXCIgKyB0c1N0ciArIFwiJyBwYXNzZWQgaW50byBUekRhdGUgY29uc3RydWN0b3IgaXMgbm90IGEgdmFsaWQgZGF0ZSBzdHJpbmdcIlxuICAgICAgfTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgc2VsZi5vcmlnRGF0ZSA9IG5ldyBEYXRlKHRpbWVzdGFtcCk7XG4gIH1cblxuICB2YXIgbG9jYWxPZmZzZXQgPSBuZXcgRGF0ZSh0aW1lc3RhbXApLmdldFRpbWV6b25lT2Zmc2V0KCk7XG4gIHNlbGYub2Zmc2V0RGlmZiA9IGxvY2FsT2Zmc2V0ICogNjAgKiAxMDAwIC0gb2Zmc2V0ICogMTAwMCAqIDYwICogNjA7XG4gIHNlbGYuZGF0ZSA9IG5ldyBEYXRlKHRpbWVzdGFtcCArIHNlbGYub2Zmc2V0RGlmZik7XG5cbiAgc2VsZi5nZXRUaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYuZGF0ZS5nZXRUaW1lKCkgLSBzZWxmLm9mZnNldERpZmY7XG4gIH07XG5cbiAgc2VsZi50b0xvY2FsZURhdGVTdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5kYXRlLnRvTG9jYWxlRGF0ZVN0cmluZygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0RnVsbFllYXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5kYXRlLmdldEZ1bGxZZWFyKCk7XG4gIH07XG5cbiAgc2VsZi5nZXRNb250aCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzZWxmLmRhdGUuZ2V0TW9udGgoKTtcbiAgfTtcblxuICBzZWxmLmdldERhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5kYXRlLmdldERhdGUoKTtcbiAgfTtcblxuICBzZWxmLmdldEhvdXJzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYuZGF0ZS5nZXRIb3VycygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0TWludXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzZWxmLmRhdGUuZ2V0TWludXRlcygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0U2Vjb25kcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzZWxmLmRhdGUuZ2V0U2Vjb25kcygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0TWlsbGlzZWNvbmRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYuZGF0ZS5nZXRNaWxsaXNlY29uZHMoKTtcbiAgfTtcblxuICBzZWxmLmdldFRpbWV6b25lT2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG9mZnNldCAqIDYwO1xuICB9O1xuXG4gIHNlbGYuZ2V0VVRDRnVsbFllYXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5vcmlnRGF0ZS5nZXRVVENGdWxsWWVhcigpO1xuICB9O1xuXG4gIHNlbGYuZ2V0VVRDTW9udGggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5vcmlnRGF0ZS5nZXRVVENNb250aCgpO1xuICB9O1xuXG4gIHNlbGYuZ2V0VVRDRGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzZWxmLm9yaWdEYXRlLmdldFVUQ0RhdGUoKTtcbiAgfTtcblxuICBzZWxmLmdldFVUQ0hvdXJzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYub3JpZ0RhdGUuZ2V0VVRDSG91cnMoKTtcbiAgfTtcblxuICBzZWxmLmdldFVUQ01pbnV0ZXMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5vcmlnRGF0ZS5nZXRVVENNaW51dGVzKCk7XG4gIH07XG5cbiAgc2VsZi5nZXRVVENTZWNvbmRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYub3JpZ0RhdGUuZ2V0VVRDU2Vjb25kcygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0VVRDTWlsbGlzZWNvbmRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYub3JpZ0RhdGUuZ2V0VVRDTWlsbGlzZWNvbmRzKCk7XG4gIH07XG5cbiAgc2VsZi5nZXREYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5kYXRlLmdldERheSgpO1xuICB9O1xuXG4gIC8vIHByb3ZpZGUgdGhpcyBtZXRob2Qgb25seSBvbiBicm93c2VycyB0aGF0IGFscmVhZHkgaGF2ZSBpdFxuICBpZiAoc2VsZi50b0lTT1N0cmluZykge1xuICAgIHNlbGYudG9JU09TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBwYWROdW1iZXIoc2VsZi5vcmlnRGF0ZS5nZXRVVENGdWxsWWVhcigpLCA0KSArICctJyArXG4gICAgICAgICAgICBwYWROdW1iZXIoc2VsZi5vcmlnRGF0ZS5nZXRVVENNb250aCgpICsgMSwgMikgKyAnLScgK1xuICAgICAgICAgICAgcGFkTnVtYmVyKHNlbGYub3JpZ0RhdGUuZ2V0VVRDRGF0ZSgpLCAyKSArICdUJyArXG4gICAgICAgICAgICBwYWROdW1iZXIoc2VsZi5vcmlnRGF0ZS5nZXRVVENIb3VycygpLCAyKSArICc6JyArXG4gICAgICAgICAgICBwYWROdW1iZXIoc2VsZi5vcmlnRGF0ZS5nZXRVVENNaW51dGVzKCksIDIpICsgJzonICtcbiAgICAgICAgICAgIHBhZE51bWJlcihzZWxmLm9yaWdEYXRlLmdldFVUQ1NlY29uZHMoKSwgMikgKyAnLicgK1xuICAgICAgICAgICAgcGFkTnVtYmVyKHNlbGYub3JpZ0RhdGUuZ2V0VVRDTWlsbGlzZWNvbmRzKCksIDMpICsgJ1onO1xuICAgIH07XG4gIH1cblxuICAvL2hpZGUgYWxsIG1ldGhvZHMgbm90IGltcGxlbWVudGVkIGluIHRoaXMgbW9jayB0aGF0IHRoZSBEYXRlIHByb3RvdHlwZSBleHBvc2VzXG4gIHZhciB1bmltcGxlbWVudGVkTWV0aG9kcyA9IFsnZ2V0VVRDRGF5JyxcbiAgICAgICdnZXRZZWFyJywgJ3NldERhdGUnLCAnc2V0RnVsbFllYXInLCAnc2V0SG91cnMnLCAnc2V0TWlsbGlzZWNvbmRzJyxcbiAgICAgICdzZXRNaW51dGVzJywgJ3NldE1vbnRoJywgJ3NldFNlY29uZHMnLCAnc2V0VGltZScsICdzZXRVVENEYXRlJywgJ3NldFVUQ0Z1bGxZZWFyJyxcbiAgICAgICdzZXRVVENIb3VycycsICdzZXRVVENNaWxsaXNlY29uZHMnLCAnc2V0VVRDTWludXRlcycsICdzZXRVVENNb250aCcsICdzZXRVVENTZWNvbmRzJyxcbiAgICAgICdzZXRZZWFyJywgJ3RvRGF0ZVN0cmluZycsICd0b0dNVFN0cmluZycsICd0b0pTT04nLCAndG9Mb2NhbGVGb3JtYXQnLCAndG9Mb2NhbGVTdHJpbmcnLFxuICAgICAgJ3RvTG9jYWxlVGltZVN0cmluZycsICd0b1NvdXJjZScsICd0b1N0cmluZycsICd0b1RpbWVTdHJpbmcnLCAndG9VVENTdHJpbmcnLCAndmFsdWVPZiddO1xuXG4gIGFuZ3VsYXIuZm9yRWFjaCh1bmltcGxlbWVudGVkTWV0aG9kcywgZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgIHNlbGZbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCAnXCIgKyBtZXRob2ROYW1lICsgXCInIGlzIG5vdCBpbXBsZW1lbnRlZCBpbiB0aGUgVHpEYXRlIG1vY2tcIik7XG4gICAgfTtcbiAgfSk7XG5cbiAgcmV0dXJuIHNlbGY7XG59O1xuXG4vL21ha2UgXCJ0ekRhdGVJbnN0YW5jZSBpbnN0YW5jZW9mIERhdGVcIiByZXR1cm4gdHJ1ZVxuYW5ndWxhci5tb2NrLlR6RGF0ZS5wcm90b3R5cGUgPSBEYXRlLnByb3RvdHlwZTtcbi8qIGpzaGludCArVzEwMSAqL1xuXG5hbmd1bGFyLm1vY2suYW5pbWF0ZSA9IGFuZ3VsYXIubW9kdWxlKCduZ0FuaW1hdGVNb2NrJywgWyduZyddKVxuXG4gIC5jb25maWcoWyckcHJvdmlkZScsIGZ1bmN0aW9uKCRwcm92aWRlKSB7XG5cbiAgICB2YXIgcmVmbG93UXVldWUgPSBbXTtcbiAgICAkcHJvdmlkZS52YWx1ZSgnJCRhbmltYXRlUmVmbG93JywgZnVuY3Rpb24oZm4pIHtcbiAgICAgIHZhciBpbmRleCA9IHJlZmxvd1F1ZXVlLmxlbmd0aDtcbiAgICAgIHJlZmxvd1F1ZXVlLnB1c2goZm4pO1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIGNhbmNlbCgpIHtcbiAgICAgICAgcmVmbG93UXVldWUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRhbmltYXRlJywgWyckZGVsZWdhdGUnLCAnJCRhc3luY0NhbGxiYWNrJywgJyR0aW1lb3V0JywgJyRicm93c2VyJywgJyQkckFGJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigkZGVsZWdhdGUsICAgJCRhc3luY0NhbGxiYWNrLCAgICR0aW1lb3V0LCAgICRicm93c2VyLCAgICQkckFGKSB7XG4gICAgICB2YXIgYW5pbWF0ZSA9IHtcbiAgICAgICAgcXVldWU6IFtdLFxuICAgICAgICBjYW5jZWw6ICRkZWxlZ2F0ZS5jYW5jZWwsXG4gICAgICAgIGVuYWJsZWQ6ICRkZWxlZ2F0ZS5lbmFibGVkLFxuICAgICAgICB0cmlnZ2VyQ2FsbGJhY2tFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICQkckFGLmZsdXNoKCk7XG4gICAgICAgICAgJCRhc3luY0NhbGxiYWNrLmZsdXNoKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHRyaWdnZXJDYWxsYmFja1Byb21pc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICR0aW1lb3V0LmZsdXNoKDApO1xuICAgICAgICB9LFxuICAgICAgICB0cmlnZ2VyQ2FsbGJhY2tzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICB0aGlzLnRyaWdnZXJDYWxsYmFja0V2ZW50cygpO1xuICAgICAgICAgIHRoaXMudHJpZ2dlckNhbGxiYWNrUHJvbWlzZSgpO1xuICAgICAgICB9LFxuICAgICAgICB0cmlnZ2VyUmVmbG93OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2gocmVmbG93UXVldWUsIGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgICBmbigpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlZmxvd1F1ZXVlID0gW107XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChcbiAgICAgICAgWydhbmltYXRlJywnZW50ZXInLCdsZWF2ZScsJ21vdmUnLCdhZGRDbGFzcycsJ3JlbW92ZUNsYXNzJywnc2V0Q2xhc3MnXSwgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICAgIGFuaW1hdGVbbWV0aG9kXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuaW1hdGUucXVldWUucHVzaCh7XG4gICAgICAgICAgICBldmVudDogbWV0aG9kLFxuICAgICAgICAgICAgZWxlbWVudDogYXJndW1lbnRzWzBdLFxuICAgICAgICAgICAgb3B0aW9uczogYXJndW1lbnRzW2FyZ3VtZW50cy5sZW5ndGggLSAxXSxcbiAgICAgICAgICAgIGFyZ3M6IGFyZ3VtZW50c1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiAkZGVsZWdhdGVbbWV0aG9kXS5hcHBseSgkZGVsZWdhdGUsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGFuaW1hdGU7XG4gICAgfV0pO1xuXG4gIH1dKTtcblxuXG4vKipcbiAqIEBuZ2RvYyBmdW5jdGlvblxuICogQG5hbWUgYW5ndWxhci5tb2NrLmR1bXBcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqICpOT1RFKjogdGhpcyBpcyBub3QgYW4gaW5qZWN0YWJsZSBpbnN0YW5jZSwganVzdCBhIGdsb2JhbGx5IGF2YWlsYWJsZSBmdW5jdGlvbi5cbiAqXG4gKiBNZXRob2QgZm9yIHNlcmlhbGl6aW5nIGNvbW1vbiBhbmd1bGFyIG9iamVjdHMgKHNjb3BlLCBlbGVtZW50cywgZXRjLi4pIGludG8gc3RyaW5ncywgdXNlZnVsIGZvclxuICogZGVidWdnaW5nLlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIGFsc28gYXZhaWxhYmxlIG9uIHdpbmRvdywgd2hlcmUgaXQgY2FuIGJlIHVzZWQgdG8gZGlzcGxheSBvYmplY3RzIG9uIGRlYnVnXG4gKiBjb25zb2xlLlxuICpcbiAqIEBwYXJhbSB7Kn0gb2JqZWN0IC0gYW55IG9iamVjdCB0byB0dXJuIGludG8gc3RyaW5nLlxuICogQHJldHVybiB7c3RyaW5nfSBhIHNlcmlhbGl6ZWQgc3RyaW5nIG9mIHRoZSBhcmd1bWVudFxuICovXG5hbmd1bGFyLm1vY2suZHVtcCA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICByZXR1cm4gc2VyaWFsaXplKG9iamVjdCk7XG5cbiAgZnVuY3Rpb24gc2VyaWFsaXplKG9iamVjdCkge1xuICAgIHZhciBvdXQ7XG5cbiAgICBpZiAoYW5ndWxhci5pc0VsZW1lbnQob2JqZWN0KSkge1xuICAgICAgb2JqZWN0ID0gYW5ndWxhci5lbGVtZW50KG9iamVjdCk7XG4gICAgICBvdXQgPSBhbmd1bGFyLmVsZW1lbnQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgICBhbmd1bGFyLmZvckVhY2gob2JqZWN0LCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgIG91dC5hcHBlbmQoYW5ndWxhci5lbGVtZW50KGVsZW1lbnQpLmNsb25lKCkpO1xuICAgICAgfSk7XG4gICAgICBvdXQgPSBvdXQuaHRtbCgpO1xuICAgIH0gZWxzZSBpZiAoYW5ndWxhci5pc0FycmF5KG9iamVjdCkpIHtcbiAgICAgIG91dCA9IFtdO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKG9iamVjdCwgZnVuY3Rpb24obykge1xuICAgICAgICBvdXQucHVzaChzZXJpYWxpemUobykpO1xuICAgICAgfSk7XG4gICAgICBvdXQgPSAnWyAnICsgb3V0LmpvaW4oJywgJykgKyAnIF0nO1xuICAgIH0gZWxzZSBpZiAoYW5ndWxhci5pc09iamVjdChvYmplY3QpKSB7XG4gICAgICBpZiAoYW5ndWxhci5pc0Z1bmN0aW9uKG9iamVjdC4kZXZhbCkgJiYgYW5ndWxhci5pc0Z1bmN0aW9uKG9iamVjdC4kYXBwbHkpKSB7XG4gICAgICAgIG91dCA9IHNlcmlhbGl6ZVNjb3BlKG9iamVjdCk7XG4gICAgICB9IGVsc2UgaWYgKG9iamVjdCBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIG91dCA9IG9iamVjdC5zdGFjayB8fCAoJycgKyBvYmplY3QubmFtZSArICc6ICcgKyBvYmplY3QubWVzc2FnZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUT0RPKGkpOiB0aGlzIHByZXZlbnRzIG1ldGhvZHMgYmVpbmcgbG9nZ2VkLFxuICAgICAgICAvLyB3ZSBzaG91bGQgaGF2ZSBhIGJldHRlciB3YXkgdG8gc2VyaWFsaXplIG9iamVjdHNcbiAgICAgICAgb3V0ID0gYW5ndWxhci50b0pzb24ob2JqZWN0LCB0cnVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gU3RyaW5nKG9iamVjdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlcmlhbGl6ZVNjb3BlKHNjb3BlLCBvZmZzZXQpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgfHwgICcgICc7XG4gICAgdmFyIGxvZyA9IFtvZmZzZXQgKyAnU2NvcGUoJyArIHNjb3BlLiRpZCArICcpOiB7J107XG4gICAgZm9yICh2YXIga2V5IGluIHNjb3BlKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNjb3BlLCBrZXkpICYmICFrZXkubWF0Y2goL14oXFwkfHRoaXMpLykpIHtcbiAgICAgICAgbG9nLnB1c2goJyAgJyArIGtleSArICc6ICcgKyBhbmd1bGFyLnRvSnNvbihzY29wZVtrZXldKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBjaGlsZCA9IHNjb3BlLiQkY2hpbGRIZWFkO1xuICAgIHdoaWxlIChjaGlsZCkge1xuICAgICAgbG9nLnB1c2goc2VyaWFsaXplU2NvcGUoY2hpbGQsIG9mZnNldCArICcgICcpKTtcbiAgICAgIGNoaWxkID0gY2hpbGQuJCRuZXh0U2libGluZztcbiAgICB9XG4gICAgbG9nLnB1c2goJ30nKTtcbiAgICByZXR1cm4gbG9nLmpvaW4oJ1xcbicgKyBvZmZzZXQpO1xuICB9XG59O1xuXG4vKipcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmRcbiAqIEBkZXNjcmlwdGlvblxuICogRmFrZSBIVFRQIGJhY2tlbmQgaW1wbGVtZW50YXRpb24gc3VpdGFibGUgZm9yIHVuaXQgdGVzdGluZyBhcHBsaWNhdGlvbnMgdGhhdCB1c2UgdGhlXG4gKiB7QGxpbmsgbmcuJGh0dHAgJGh0dHAgc2VydmljZX0uXG4gKlxuICogKk5vdGUqOiBGb3IgZmFrZSBIVFRQIGJhY2tlbmQgaW1wbGVtZW50YXRpb24gc3VpdGFibGUgZm9yIGVuZC10by1lbmQgdGVzdGluZyBvciBiYWNrZW5kLWxlc3NcbiAqIGRldmVsb3BtZW50IHBsZWFzZSBzZWUge0BsaW5rIG5nTW9ja0UyRS4kaHR0cEJhY2tlbmQgZTJlICRodHRwQmFja2VuZCBtb2NrfS5cbiAqXG4gKiBEdXJpbmcgdW5pdCB0ZXN0aW5nLCB3ZSB3YW50IG91ciB1bml0IHRlc3RzIHRvIHJ1biBxdWlja2x5IGFuZCBoYXZlIG5vIGV4dGVybmFsIGRlcGVuZGVuY2llcyBzb1xuICogd2UgZG9u4oCZdCB3YW50IHRvIHNlbmQgW1hIUl0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4veG1saHR0cHJlcXVlc3QpIG9yXG4gKiBbSlNPTlBdKGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSlNPTlApIHJlcXVlc3RzIHRvIGEgcmVhbCBzZXJ2ZXIuIEFsbCB3ZSByZWFsbHkgbmVlZCBpc1xuICogdG8gdmVyaWZ5IHdoZXRoZXIgYSBjZXJ0YWluIHJlcXVlc3QgaGFzIGJlZW4gc2VudCBvciBub3QsIG9yIGFsdGVybmF0aXZlbHkganVzdCBsZXQgdGhlXG4gKiBhcHBsaWNhdGlvbiBtYWtlIHJlcXVlc3RzLCByZXNwb25kIHdpdGggcHJlLXRyYWluZWQgcmVzcG9uc2VzIGFuZCBhc3NlcnQgdGhhdCB0aGUgZW5kIHJlc3VsdCBpc1xuICogd2hhdCB3ZSBleHBlY3QgaXQgdG8gYmUuXG4gKlxuICogVGhpcyBtb2NrIGltcGxlbWVudGF0aW9uIGNhbiBiZSB1c2VkIHRvIHJlc3BvbmQgd2l0aCBzdGF0aWMgb3IgZHluYW1pYyByZXNwb25zZXMgdmlhIHRoZVxuICogYGV4cGVjdGAgYW5kIGB3aGVuYCBhcGlzIGFuZCB0aGVpciBzaG9ydGN1dHMgKGBleHBlY3RHRVRgLCBgd2hlblBPU1RgLCBldGMpLlxuICpcbiAqIFdoZW4gYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBuZWVkcyBzb21lIGRhdGEgZnJvbSBhIHNlcnZlciwgaXQgY2FsbHMgdGhlICRodHRwIHNlcnZpY2UsIHdoaWNoXG4gKiBzZW5kcyB0aGUgcmVxdWVzdCB0byBhIHJlYWwgc2VydmVyIHVzaW5nICRodHRwQmFja2VuZCBzZXJ2aWNlLiBXaXRoIGRlcGVuZGVuY3kgaW5qZWN0aW9uLCBpdCBpc1xuICogZWFzeSB0byBpbmplY3QgJGh0dHBCYWNrZW5kIG1vY2sgKHdoaWNoIGhhcyB0aGUgc2FtZSBBUEkgYXMgJGh0dHBCYWNrZW5kKSBhbmQgdXNlIGl0IHRvIHZlcmlmeVxuICogdGhlIHJlcXVlc3RzIGFuZCByZXNwb25kIHdpdGggc29tZSB0ZXN0aW5nIGRhdGEgd2l0aG91dCBzZW5kaW5nIGEgcmVxdWVzdCB0byBhIHJlYWwgc2VydmVyLlxuICpcbiAqIFRoZXJlIGFyZSB0d28gd2F5cyB0byBzcGVjaWZ5IHdoYXQgdGVzdCBkYXRhIHNob3VsZCBiZSByZXR1cm5lZCBhcyBodHRwIHJlc3BvbnNlcyBieSB0aGUgbW9ja1xuICogYmFja2VuZCB3aGVuIHRoZSBjb2RlIHVuZGVyIHRlc3QgbWFrZXMgaHR0cCByZXF1ZXN0czpcbiAqXG4gKiAtIGAkaHR0cEJhY2tlbmQuZXhwZWN0YCAtIHNwZWNpZmllcyBhIHJlcXVlc3QgZXhwZWN0YXRpb25cbiAqIC0gYCRodHRwQmFja2VuZC53aGVuYCAtIHNwZWNpZmllcyBhIGJhY2tlbmQgZGVmaW5pdGlvblxuICpcbiAqXG4gKiAjIFJlcXVlc3QgRXhwZWN0YXRpb25zIHZzIEJhY2tlbmQgRGVmaW5pdGlvbnNcbiAqXG4gKiBSZXF1ZXN0IGV4cGVjdGF0aW9ucyBwcm92aWRlIGEgd2F5IHRvIG1ha2UgYXNzZXJ0aW9ucyBhYm91dCByZXF1ZXN0cyBtYWRlIGJ5IHRoZSBhcHBsaWNhdGlvbiBhbmRcbiAqIHRvIGRlZmluZSByZXNwb25zZXMgZm9yIHRob3NlIHJlcXVlc3RzLiBUaGUgdGVzdCB3aWxsIGZhaWwgaWYgdGhlIGV4cGVjdGVkIHJlcXVlc3RzIGFyZSBub3QgbWFkZVxuICogb3IgdGhleSBhcmUgbWFkZSBpbiB0aGUgd3Jvbmcgb3JkZXIuXG4gKlxuICogQmFja2VuZCBkZWZpbml0aW9ucyBhbGxvdyB5b3UgdG8gZGVmaW5lIGEgZmFrZSBiYWNrZW5kIGZvciB5b3VyIGFwcGxpY2F0aW9uIHdoaWNoIGRvZXNuJ3QgYXNzZXJ0XG4gKiBpZiBhIHBhcnRpY3VsYXIgcmVxdWVzdCB3YXMgbWFkZSBvciBub3QsIGl0IGp1c3QgcmV0dXJucyBhIHRyYWluZWQgcmVzcG9uc2UgaWYgYSByZXF1ZXN0IGlzIG1hZGUuXG4gKiBUaGUgdGVzdCB3aWxsIHBhc3Mgd2hldGhlciBvciBub3QgdGhlIHJlcXVlc3QgZ2V0cyBtYWRlIGR1cmluZyB0ZXN0aW5nLlxuICpcbiAqXG4gKiA8dGFibGUgY2xhc3M9XCJ0YWJsZVwiPlxuICogICA8dHI+PHRoIHdpZHRoPVwiMjIwcHhcIj48L3RoPjx0aD5SZXF1ZXN0IGV4cGVjdGF0aW9uczwvdGg+PHRoPkJhY2tlbmQgZGVmaW5pdGlvbnM8L3RoPjwvdHI+XG4gKiAgIDx0cj5cbiAqICAgICA8dGg+U3ludGF4PC90aD5cbiAqICAgICA8dGQ+LmV4cGVjdCguLi4pLnJlc3BvbmQoLi4uKTwvdGQ+XG4gKiAgICAgPHRkPi53aGVuKC4uLikucmVzcG9uZCguLi4pPC90ZD5cbiAqICAgPC90cj5cbiAqICAgPHRyPlxuICogICAgIDx0aD5UeXBpY2FsIHVzYWdlPC90aD5cbiAqICAgICA8dGQ+c3RyaWN0IHVuaXQgdGVzdHM8L3RkPlxuICogICAgIDx0ZD5sb29zZSAoYmxhY2stYm94KSB1bml0IHRlc3Rpbmc8L3RkPlxuICogICA8L3RyPlxuICogICA8dHI+XG4gKiAgICAgPHRoPkZ1bGZpbGxzIG11bHRpcGxlIHJlcXVlc3RzPC90aD5cbiAqICAgICA8dGQ+Tk88L3RkPlxuICogICAgIDx0ZD5ZRVM8L3RkPlxuICogICA8L3RyPlxuICogICA8dHI+XG4gKiAgICAgPHRoPk9yZGVyIG9mIHJlcXVlc3RzIG1hdHRlcnM8L3RoPlxuICogICAgIDx0ZD5ZRVM8L3RkPlxuICogICAgIDx0ZD5OTzwvdGQ+XG4gKiAgIDwvdHI+XG4gKiAgIDx0cj5cbiAqICAgICA8dGg+UmVxdWVzdCByZXF1aXJlZDwvdGg+XG4gKiAgICAgPHRkPllFUzwvdGQ+XG4gKiAgICAgPHRkPk5PPC90ZD5cbiAqICAgPC90cj5cbiAqICAgPHRyPlxuICogICAgIDx0aD5SZXNwb25zZSByZXF1aXJlZDwvdGg+XG4gKiAgICAgPHRkPm9wdGlvbmFsIChzZWUgYmVsb3cpPC90ZD5cbiAqICAgICA8dGQ+WUVTPC90ZD5cbiAqICAgPC90cj5cbiAqIDwvdGFibGU+XG4gKlxuICogSW4gY2FzZXMgd2hlcmUgYm90aCBiYWNrZW5kIGRlZmluaXRpb25zIGFuZCByZXF1ZXN0IGV4cGVjdGF0aW9ucyBhcmUgc3BlY2lmaWVkIGR1cmluZyB1bml0XG4gKiB0ZXN0aW5nLCB0aGUgcmVxdWVzdCBleHBlY3RhdGlvbnMgYXJlIGV2YWx1YXRlZCBmaXJzdC5cbiAqXG4gKiBJZiBhIHJlcXVlc3QgZXhwZWN0YXRpb24gaGFzIG5vIHJlc3BvbnNlIHNwZWNpZmllZCwgdGhlIGFsZ29yaXRobSB3aWxsIHNlYXJjaCB5b3VyIGJhY2tlbmRcbiAqIGRlZmluaXRpb25zIGZvciBhbiBhcHByb3ByaWF0ZSByZXNwb25zZS5cbiAqXG4gKiBJZiBhIHJlcXVlc3QgZGlkbid0IG1hdGNoIGFueSBleHBlY3RhdGlvbiBvciBpZiB0aGUgZXhwZWN0YXRpb24gZG9lc24ndCBoYXZlIHRoZSByZXNwb25zZVxuICogZGVmaW5lZCwgdGhlIGJhY2tlbmQgZGVmaW5pdGlvbnMgYXJlIGV2YWx1YXRlZCBpbiBzZXF1ZW50aWFsIG9yZGVyIHRvIHNlZSBpZiBhbnkgb2YgdGhlbSBtYXRjaFxuICogdGhlIHJlcXVlc3QuIFRoZSByZXNwb25zZSBmcm9tIHRoZSBmaXJzdCBtYXRjaGVkIGRlZmluaXRpb24gaXMgcmV0dXJuZWQuXG4gKlxuICpcbiAqICMgRmx1c2hpbmcgSFRUUCByZXF1ZXN0c1xuICpcbiAqIFRoZSAkaHR0cEJhY2tlbmQgdXNlZCBpbiBwcm9kdWN0aW9uIGFsd2F5cyByZXNwb25kcyB0byByZXF1ZXN0cyBhc3luY2hyb25vdXNseS4gSWYgd2UgcHJlc2VydmVkXG4gKiB0aGlzIGJlaGF2aW9yIGluIHVuaXQgdGVzdGluZywgd2UnZCBoYXZlIHRvIGNyZWF0ZSBhc3luYyB1bml0IHRlc3RzLCB3aGljaCBhcmUgaGFyZCB0byB3cml0ZSxcbiAqIHRvIGZvbGxvdyBhbmQgdG8gbWFpbnRhaW4uIEJ1dCBuZWl0aGVyIGNhbiB0aGUgdGVzdGluZyBtb2NrIHJlc3BvbmQgc3luY2hyb25vdXNseTsgdGhhdCB3b3VsZFxuICogY2hhbmdlIHRoZSBleGVjdXRpb24gb2YgdGhlIGNvZGUgdW5kZXIgdGVzdC4gRm9yIHRoaXMgcmVhc29uLCB0aGUgbW9jayAkaHR0cEJhY2tlbmQgaGFzIGFcbiAqIGBmbHVzaCgpYCBtZXRob2QsIHdoaWNoIGFsbG93cyB0aGUgdGVzdCB0byBleHBsaWNpdGx5IGZsdXNoIHBlbmRpbmcgcmVxdWVzdHMuIFRoaXMgcHJlc2VydmVzXG4gKiB0aGUgYXN5bmMgYXBpIG9mIHRoZSBiYWNrZW5kLCB3aGlsZSBhbGxvd2luZyB0aGUgdGVzdCB0byBleGVjdXRlIHN5bmNocm9ub3VzbHkuXG4gKlxuICpcbiAqICMgVW5pdCB0ZXN0aW5nIHdpdGggbW9jayAkaHR0cEJhY2tlbmRcbiAqIFRoZSBmb2xsb3dpbmcgY29kZSBzaG93cyBob3cgdG8gc2V0dXAgYW5kIHVzZSB0aGUgbW9jayBiYWNrZW5kIHdoZW4gdW5pdCB0ZXN0aW5nIGEgY29udHJvbGxlci5cbiAqIEZpcnN0IHdlIGNyZWF0ZSB0aGUgY29udHJvbGxlciB1bmRlciB0ZXN0OlxuICpcbiAgYGBganNcbiAgLy8gVGhlIG1vZHVsZSBjb2RlXG4gIGFuZ3VsYXJcbiAgICAubW9kdWxlKCdNeUFwcCcsIFtdKVxuICAgIC5jb250cm9sbGVyKCdNeUNvbnRyb2xsZXInLCBNeUNvbnRyb2xsZXIpO1xuXG4gIC8vIFRoZSBjb250cm9sbGVyIGNvZGVcbiAgZnVuY3Rpb24gTXlDb250cm9sbGVyKCRzY29wZSwgJGh0dHApIHtcbiAgICB2YXIgYXV0aFRva2VuO1xuXG4gICAgJGh0dHAuZ2V0KCcvYXV0aC5weScpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSwgc3RhdHVzLCBoZWFkZXJzKSB7XG4gICAgICBhdXRoVG9rZW4gPSBoZWFkZXJzKCdBLVRva2VuJyk7XG4gICAgICAkc2NvcGUudXNlciA9IGRhdGE7XG4gICAgfSk7XG5cbiAgICAkc2NvcGUuc2F2ZU1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICB2YXIgaGVhZGVycyA9IHsgJ0F1dGhvcml6YXRpb24nOiBhdXRoVG9rZW4gfTtcbiAgICAgICRzY29wZS5zdGF0dXMgPSAnU2F2aW5nLi4uJztcblxuICAgICAgJGh0dHAucG9zdCgnL2FkZC1tc2cucHknLCBtZXNzYWdlLCB7IGhlYWRlcnM6IGhlYWRlcnMgfSApLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgJHNjb3BlLnN0YXR1cyA9ICcnO1xuICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5zdGF0dXMgPSAnRVJST1IhJztcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cbiAgYGBgXG4gKlxuICogTm93IHdlIHNldHVwIHRoZSBtb2NrIGJhY2tlbmQgYW5kIGNyZWF0ZSB0aGUgdGVzdCBzcGVjczpcbiAqXG4gIGBgYGpzXG4gICAgLy8gdGVzdGluZyBjb250cm9sbGVyXG4gICAgZGVzY3JpYmUoJ015Q29udHJvbGxlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgIHZhciAkaHR0cEJhY2tlbmQsICRyb290U2NvcGUsIGNyZWF0ZUNvbnRyb2xsZXIsIGF1dGhSZXF1ZXN0SGFuZGxlcjtcblxuICAgICAgIC8vIFNldCB1cCB0aGUgbW9kdWxlXG4gICAgICAgYmVmb3JlRWFjaChtb2R1bGUoJ015QXBwJykpO1xuXG4gICAgICAgYmVmb3JlRWFjaChpbmplY3QoZnVuY3Rpb24oJGluamVjdG9yKSB7XG4gICAgICAgICAvLyBTZXQgdXAgdGhlIG1vY2sgaHR0cCBzZXJ2aWNlIHJlc3BvbnNlc1xuICAgICAgICAgJGh0dHBCYWNrZW5kID0gJGluamVjdG9yLmdldCgnJGh0dHBCYWNrZW5kJyk7XG4gICAgICAgICAvLyBiYWNrZW5kIGRlZmluaXRpb24gY29tbW9uIGZvciBhbGwgdGVzdHNcbiAgICAgICAgIGF1dGhSZXF1ZXN0SGFuZGxlciA9ICRodHRwQmFja2VuZC53aGVuKCdHRVQnLCAnL2F1dGgucHknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVzcG9uZCh7dXNlcklkOiAndXNlclgnfSwgeydBLVRva2VuJzogJ3h4eCd9KTtcblxuICAgICAgICAgLy8gR2V0IGhvbGQgb2YgYSBzY29wZSAoaS5lLiB0aGUgcm9vdCBzY29wZSlcbiAgICAgICAgICRyb290U2NvcGUgPSAkaW5qZWN0b3IuZ2V0KCckcm9vdFNjb3BlJyk7XG4gICAgICAgICAvLyBUaGUgJGNvbnRyb2xsZXIgc2VydmljZSBpcyB1c2VkIHRvIGNyZWF0ZSBpbnN0YW5jZXMgb2YgY29udHJvbGxlcnNcbiAgICAgICAgIHZhciAkY29udHJvbGxlciA9ICRpbmplY3Rvci5nZXQoJyRjb250cm9sbGVyJyk7XG5cbiAgICAgICAgIGNyZWF0ZUNvbnRyb2xsZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgcmV0dXJuICRjb250cm9sbGVyKCdNeUNvbnRyb2xsZXInLCB7JyRzY29wZScgOiAkcm9vdFNjb3BlIH0pO1xuICAgICAgICAgfTtcbiAgICAgICB9KSk7XG5cblxuICAgICAgIGFmdGVyRWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICRodHRwQmFja2VuZC52ZXJpZnlOb091dHN0YW5kaW5nRXhwZWN0YXRpb24oKTtcbiAgICAgICAgICRodHRwQmFja2VuZC52ZXJpZnlOb091dHN0YW5kaW5nUmVxdWVzdCgpO1xuICAgICAgIH0pO1xuXG5cbiAgICAgICBpdCgnc2hvdWxkIGZldGNoIGF1dGhlbnRpY2F0aW9uIHRva2VuJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAkaHR0cEJhY2tlbmQuZXhwZWN0R0VUKCcvYXV0aC5weScpO1xuICAgICAgICAgdmFyIGNvbnRyb2xsZXIgPSBjcmVhdGVDb250cm9sbGVyKCk7XG4gICAgICAgICAkaHR0cEJhY2tlbmQuZmx1c2goKTtcbiAgICAgICB9KTtcblxuXG4gICAgICAgaXQoJ3Nob3VsZCBmYWlsIGF1dGhlbnRpY2F0aW9uJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgIC8vIE5vdGljZSBob3cgeW91IGNhbiBjaGFuZ2UgdGhlIHJlc3BvbnNlIGV2ZW4gYWZ0ZXIgaXQgd2FzIHNldFxuICAgICAgICAgYXV0aFJlcXVlc3RIYW5kbGVyLnJlc3BvbmQoNDAxLCAnJyk7XG5cbiAgICAgICAgICRodHRwQmFja2VuZC5leHBlY3RHRVQoJy9hdXRoLnB5Jyk7XG4gICAgICAgICB2YXIgY29udHJvbGxlciA9IGNyZWF0ZUNvbnRyb2xsZXIoKTtcbiAgICAgICAgICRodHRwQmFja2VuZC5mbHVzaCgpO1xuICAgICAgICAgZXhwZWN0KCRyb290U2NvcGUuc3RhdHVzKS50b0JlKCdGYWlsZWQuLi4nKTtcbiAgICAgICB9KTtcblxuXG4gICAgICAgaXQoJ3Nob3VsZCBzZW5kIG1zZyB0byBzZXJ2ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgIHZhciBjb250cm9sbGVyID0gY3JlYXRlQ29udHJvbGxlcigpO1xuICAgICAgICAgJGh0dHBCYWNrZW5kLmZsdXNoKCk7XG5cbiAgICAgICAgIC8vIG5vdyB5b3UgZG9u4oCZdCBjYXJlIGFib3V0IHRoZSBhdXRoZW50aWNhdGlvbiwgYnV0XG4gICAgICAgICAvLyB0aGUgY29udHJvbGxlciB3aWxsIHN0aWxsIHNlbmQgdGhlIHJlcXVlc3QgYW5kXG4gICAgICAgICAvLyAkaHR0cEJhY2tlbmQgd2lsbCByZXNwb25kIHdpdGhvdXQgeW91IGhhdmluZyB0b1xuICAgICAgICAgLy8gc3BlY2lmeSB0aGUgZXhwZWN0YXRpb24gYW5kIHJlc3BvbnNlIGZvciB0aGlzIHJlcXVlc3RcblxuICAgICAgICAgJGh0dHBCYWNrZW5kLmV4cGVjdFBPU1QoJy9hZGQtbXNnLnB5JywgJ21lc3NhZ2UgY29udGVudCcpLnJlc3BvbmQoMjAxLCAnJyk7XG4gICAgICAgICAkcm9vdFNjb3BlLnNhdmVNZXNzYWdlKCdtZXNzYWdlIGNvbnRlbnQnKTtcbiAgICAgICAgIGV4cGVjdCgkcm9vdFNjb3BlLnN0YXR1cykudG9CZSgnU2F2aW5nLi4uJyk7XG4gICAgICAgICAkaHR0cEJhY2tlbmQuZmx1c2goKTtcbiAgICAgICAgIGV4cGVjdCgkcm9vdFNjb3BlLnN0YXR1cykudG9CZSgnJyk7XG4gICAgICAgfSk7XG5cblxuICAgICAgIGl0KCdzaG91bGQgc2VuZCBhdXRoIGhlYWRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgdmFyIGNvbnRyb2xsZXIgPSBjcmVhdGVDb250cm9sbGVyKCk7XG4gICAgICAgICAkaHR0cEJhY2tlbmQuZmx1c2goKTtcblxuICAgICAgICAgJGh0dHBCYWNrZW5kLmV4cGVjdFBPU1QoJy9hZGQtbXNnLnB5JywgdW5kZWZpbmVkLCBmdW5jdGlvbihoZWFkZXJzKSB7XG4gICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBoZWFkZXIgd2FzIHNlbmQsIGlmIGl0IHdhc24ndCB0aGUgZXhwZWN0YXRpb24gd29uJ3RcbiAgICAgICAgICAgLy8gbWF0Y2ggdGhlIHJlcXVlc3QgYW5kIHRoZSB0ZXN0IHdpbGwgZmFpbFxuICAgICAgICAgICByZXR1cm4gaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID09ICd4eHgnO1xuICAgICAgICAgfSkucmVzcG9uZCgyMDEsICcnKTtcblxuICAgICAgICAgJHJvb3RTY29wZS5zYXZlTWVzc2FnZSgnd2hhdGV2ZXInKTtcbiAgICAgICAgICRodHRwQmFja2VuZC5mbHVzaCgpO1xuICAgICAgIH0pO1xuICAgIH0pO1xuICAgYGBgXG4gKi9cbmFuZ3VsYXIubW9jay4kSHR0cEJhY2tlbmRQcm92aWRlciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLiRnZXQgPSBbJyRyb290U2NvcGUnLCAnJHRpbWVvdXQnLCBjcmVhdGVIdHRwQmFja2VuZE1vY2tdO1xufTtcblxuLyoqXG4gKiBHZW5lcmFsIGZhY3RvcnkgZnVuY3Rpb24gZm9yICRodHRwQmFja2VuZCBtb2NrLlxuICogUmV0dXJucyBpbnN0YW5jZSBmb3IgdW5pdCB0ZXN0aW5nICh3aGVuIG5vIGFyZ3VtZW50cyBzcGVjaWZpZWQpOlxuICogICAtIHBhc3NpbmcgdGhyb3VnaCBpcyBkaXNhYmxlZFxuICogICAtIGF1dG8gZmx1c2hpbmcgaXMgZGlzYWJsZWRcbiAqXG4gKiBSZXR1cm5zIGluc3RhbmNlIGZvciBlMmUgdGVzdGluZyAod2hlbiBgJGRlbGVnYXRlYCBhbmQgYCRicm93c2VyYCBzcGVjaWZpZWQpOlxuICogICAtIHBhc3NpbmcgdGhyb3VnaCAoZGVsZWdhdGluZyByZXF1ZXN0IHRvIHJlYWwgYmFja2VuZCkgaXMgZW5hYmxlZFxuICogICAtIGF1dG8gZmx1c2hpbmcgaXMgZW5hYmxlZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0PX0gJGRlbGVnYXRlIFJlYWwgJGh0dHBCYWNrZW5kIGluc3RhbmNlIChhbGxvdyBwYXNzaW5nIHRocm91Z2ggaWYgc3BlY2lmaWVkKVxuICogQHBhcmFtIHtPYmplY3Q9fSAkYnJvd3NlciBBdXRvLWZsdXNoaW5nIGVuYWJsZWQgaWYgc3BlY2lmaWVkXG4gKiBAcmV0dXJuIHtPYmplY3R9IEluc3RhbmNlIG9mICRodHRwQmFja2VuZCBtb2NrXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUh0dHBCYWNrZW5kTW9jaygkcm9vdFNjb3BlLCAkdGltZW91dCwgJGRlbGVnYXRlLCAkYnJvd3Nlcikge1xuICB2YXIgZGVmaW5pdGlvbnMgPSBbXSxcbiAgICAgIGV4cGVjdGF0aW9ucyA9IFtdLFxuICAgICAgcmVzcG9uc2VzID0gW10sXG4gICAgICByZXNwb25zZXNQdXNoID0gYW5ndWxhci5iaW5kKHJlc3BvbnNlcywgcmVzcG9uc2VzLnB1c2gpLFxuICAgICAgY29weSA9IGFuZ3VsYXIuY29weTtcblxuICBmdW5jdGlvbiBjcmVhdGVSZXNwb25zZShzdGF0dXMsIGRhdGEsIGhlYWRlcnMsIHN0YXR1c1RleHQpIHtcbiAgICBpZiAoYW5ndWxhci5pc0Z1bmN0aW9uKHN0YXR1cykpIHJldHVybiBzdGF0dXM7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYW5ndWxhci5pc051bWJlcihzdGF0dXMpXG4gICAgICAgICAgPyBbc3RhdHVzLCBkYXRhLCBoZWFkZXJzLCBzdGF0dXNUZXh0XVxuICAgICAgICAgIDogWzIwMCwgc3RhdHVzLCBkYXRhLCBoZWFkZXJzXTtcbiAgICB9O1xuICB9XG5cbiAgLy8gVE9ETyh2b2p0YSk6IGNoYW5nZSBwYXJhbXMgdG86IG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzLCBjYWxsYmFja1xuICBmdW5jdGlvbiAkaHR0cEJhY2tlbmQobWV0aG9kLCB1cmwsIGRhdGEsIGNhbGxiYWNrLCBoZWFkZXJzLCB0aW1lb3V0LCB3aXRoQ3JlZGVudGlhbHMpIHtcbiAgICB2YXIgeGhyID0gbmV3IE1vY2tYaHIoKSxcbiAgICAgICAgZXhwZWN0YXRpb24gPSBleHBlY3RhdGlvbnNbMF0sXG4gICAgICAgIHdhc0V4cGVjdGVkID0gZmFsc2U7XG5cbiAgICBmdW5jdGlvbiBwcmV0dHlQcmludChkYXRhKSB7XG4gICAgICByZXR1cm4gKGFuZ3VsYXIuaXNTdHJpbmcoZGF0YSkgfHwgYW5ndWxhci5pc0Z1bmN0aW9uKGRhdGEpIHx8IGRhdGEgaW5zdGFuY2VvZiBSZWdFeHApXG4gICAgICAgICAgPyBkYXRhXG4gICAgICAgICAgOiBhbmd1bGFyLnRvSnNvbihkYXRhKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3cmFwUmVzcG9uc2Uod3JhcHBlZCkge1xuICAgICAgaWYgKCEkYnJvd3NlciAmJiB0aW1lb3V0KSB7XG4gICAgICAgIHRpbWVvdXQudGhlbiA/IHRpbWVvdXQudGhlbihoYW5kbGVUaW1lb3V0KSA6ICR0aW1lb3V0KGhhbmRsZVRpbWVvdXQsIHRpbWVvdXQpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaGFuZGxlUmVzcG9uc2U7XG5cbiAgICAgIGZ1bmN0aW9uIGhhbmRsZVJlc3BvbnNlKCkge1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSB3cmFwcGVkLnJlc3BvbnNlKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzKTtcbiAgICAgICAgeGhyLiQkcmVzcEhlYWRlcnMgPSByZXNwb25zZVsyXTtcbiAgICAgICAgY2FsbGJhY2soY29weShyZXNwb25zZVswXSksIGNvcHkocmVzcG9uc2VbMV0pLCB4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCksXG4gICAgICAgICAgICAgICAgIGNvcHkocmVzcG9uc2VbM10gfHwgJycpKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gaGFuZGxlVGltZW91dCgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gcmVzcG9uc2VzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICBpZiAocmVzcG9uc2VzW2ldID09PSBoYW5kbGVSZXNwb25zZSkge1xuICAgICAgICAgICAgcmVzcG9uc2VzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKC0xLCB1bmRlZmluZWQsICcnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChleHBlY3RhdGlvbiAmJiBleHBlY3RhdGlvbi5tYXRjaChtZXRob2QsIHVybCkpIHtcbiAgICAgIGlmICghZXhwZWN0YXRpb24ubWF0Y2hEYXRhKGRhdGEpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgJyArIGV4cGVjdGF0aW9uICsgJyB3aXRoIGRpZmZlcmVudCBkYXRhXFxuJyArXG4gICAgICAgICAgICAnRVhQRUNURUQ6ICcgKyBwcmV0dHlQcmludChleHBlY3RhdGlvbi5kYXRhKSArICdcXG5HT1Q6ICAgICAgJyArIGRhdGEpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWV4cGVjdGF0aW9uLm1hdGNoSGVhZGVycyhoZWFkZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkICcgKyBleHBlY3RhdGlvbiArICcgd2l0aCBkaWZmZXJlbnQgaGVhZGVyc1xcbicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ0VYUEVDVEVEOiAnICsgcHJldHR5UHJpbnQoZXhwZWN0YXRpb24uaGVhZGVycykgKyAnXFxuR09UOiAgICAgICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldHR5UHJpbnQoaGVhZGVycykpO1xuICAgICAgfVxuXG4gICAgICBleHBlY3RhdGlvbnMuc2hpZnQoKTtcblxuICAgICAgaWYgKGV4cGVjdGF0aW9uLnJlc3BvbnNlKSB7XG4gICAgICAgIHJlc3BvbnNlcy5wdXNoKHdyYXBSZXNwb25zZShleHBlY3RhdGlvbikpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB3YXNFeHBlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIGkgPSAtMSwgZGVmaW5pdGlvbjtcbiAgICB3aGlsZSAoKGRlZmluaXRpb24gPSBkZWZpbml0aW9uc1srK2ldKSkge1xuICAgICAgaWYgKGRlZmluaXRpb24ubWF0Y2gobWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMgfHwge30pKSB7XG4gICAgICAgIGlmIChkZWZpbml0aW9uLnJlc3BvbnNlKSB7XG4gICAgICAgICAgLy8gaWYgJGJyb3dzZXIgc3BlY2lmaWVkLCB3ZSBkbyBhdXRvIGZsdXNoIGFsbCByZXF1ZXN0c1xuICAgICAgICAgICgkYnJvd3NlciA/ICRicm93c2VyLmRlZmVyIDogcmVzcG9uc2VzUHVzaCkod3JhcFJlc3BvbnNlKGRlZmluaXRpb24pKTtcbiAgICAgICAgfSBlbHNlIGlmIChkZWZpbml0aW9uLnBhc3NUaHJvdWdoKSB7XG4gICAgICAgICAgJGRlbGVnYXRlKG1ldGhvZCwgdXJsLCBkYXRhLCBjYWxsYmFjaywgaGVhZGVycywgdGltZW91dCwgd2l0aENyZWRlbnRpYWxzKTtcbiAgICAgICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcignTm8gcmVzcG9uc2UgZGVmaW5lZCAhJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgd2FzRXhwZWN0ZWQgP1xuICAgICAgICBuZXcgRXJyb3IoJ05vIHJlc3BvbnNlIGRlZmluZWQgIScpIDpcbiAgICAgICAgbmV3IEVycm9yKCdVbmV4cGVjdGVkIHJlcXVlc3Q6ICcgKyBtZXRob2QgKyAnICcgKyB1cmwgKyAnXFxuJyArXG4gICAgICAgICAgICAgICAgICAoZXhwZWN0YXRpb24gPyAnRXhwZWN0ZWQgJyArIGV4cGVjdGF0aW9uIDogJ05vIG1vcmUgcmVxdWVzdCBleHBlY3RlZCcpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCN3aGVuXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCBIVFRQIG1ldGhvZC5cbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gICAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpKT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlc1xuICAgKiAgIGRhdGEgc3RyaW5nIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRhdGEgaXMgYXMgZXhwZWN0ZWQuXG4gICAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgaHR0cCBoZWFkZXJcbiAgICogICBvYmplY3QgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgaGVhZGVycyBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogICByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqICAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKlxuICAgKiAgLSByZXNwb25kIOKAk1xuICAgKiAgICAgIGB7ZnVuY3Rpb24oW3N0YXR1cyxdIGRhdGFbLCBoZWFkZXJzLCBzdGF0dXNUZXh0XSlcbiAgICogICAgICB8IGZ1bmN0aW9uKGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzKX1gXG4gICAqICAgIOKAkyBUaGUgcmVzcG9uZCBtZXRob2QgdGFrZXMgYSBzZXQgb2Ygc3RhdGljIGRhdGEgdG8gYmUgcmV0dXJuZWQgb3IgYSBmdW5jdGlvbiB0aGF0IGNhblxuICAgKiAgICByZXR1cm4gYW4gYXJyYXkgY29udGFpbmluZyByZXNwb25zZSBzdGF0dXMgKG51bWJlciksIHJlc3BvbnNlIGRhdGEgKHN0cmluZyksIHJlc3BvbnNlXG4gICAqICAgIGhlYWRlcnMgKE9iamVjdCksIGFuZCB0aGUgdGV4dCBmb3IgdGhlIHN0YXR1cyAoc3RyaW5nKS4gVGhlIHJlc3BvbmQgbWV0aG9kIHJldHVybnMgdGhlXG4gICAqICAgIGByZXF1ZXN0SGFuZGxlcmAgb2JqZWN0IGZvciBwb3NzaWJsZSBvdmVycmlkZXMuXG4gICAqL1xuICAkaHR0cEJhY2tlbmQud2hlbiA9IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzKSB7XG4gICAgdmFyIGRlZmluaXRpb24gPSBuZXcgTW9ja0h0dHBFeHBlY3RhdGlvbihtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycyksXG4gICAgICAgIGNoYWluID0ge1xuICAgICAgICAgIHJlc3BvbmQ6IGZ1bmN0aW9uKHN0YXR1cywgZGF0YSwgaGVhZGVycywgc3RhdHVzVGV4dCkge1xuICAgICAgICAgICAgZGVmaW5pdGlvbi5wYXNzVGhyb3VnaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGRlZmluaXRpb24ucmVzcG9uc2UgPSBjcmVhdGVSZXNwb25zZShzdGF0dXMsIGRhdGEsIGhlYWRlcnMsIHN0YXR1c1RleHQpO1xuICAgICAgICAgICAgcmV0dXJuIGNoYWluO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgIGlmICgkYnJvd3Nlcikge1xuICAgICAgY2hhaW4ucGFzc1Rocm91Z2ggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZGVmaW5pdGlvbi5yZXNwb25zZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgZGVmaW5pdGlvbi5wYXNzVGhyb3VnaCA9IHRydWU7XG4gICAgICAgIHJldHVybiBjaGFpbjtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZGVmaW5pdGlvbnMucHVzaChkZWZpbml0aW9uKTtcbiAgICByZXR1cm4gY2hhaW47XG4gIH07XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJGh0dHBCYWNrZW5kI3doZW5HRVRcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBHRVQgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycy5cbiAgICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBtZXRob2QgdGhhdCBjb250cm9scyBob3cgYSBtYXRjaGVkXG4gICAqIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlbkhFQURcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBIRUFEIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gICAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoT2JqZWN0fGZ1bmN0aW9uKE9iamVjdCkpPX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqIG9yZGVyIHRvIGNoYW5nZSBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJGh0dHBCYWNrZW5kI3doZW5ERUxFVEVcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBERUxFVEUgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycy5cbiAgICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBtZXRob2QgdGhhdCBjb250cm9scyBob3cgYSBtYXRjaGVkXG4gICAqIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlblBPU1RcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBQT1NUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gICAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpKT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlc1xuICAgKiAgIGRhdGEgc3RyaW5nIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRhdGEgaXMgYXMgZXhwZWN0ZWQuXG4gICAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlIGByZXNwb25kYCBhZ2FpbiBpblxuICAgKiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCN3aGVuUFVUXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgUFVUIHJlcXVlc3RzLiAgRm9yIG1vcmUgaW5mbyBzZWUgYHdoZW4oKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBhIHVybFxuICAgKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaGVzIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gICAqIEBwYXJhbSB7KHN0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKSk9fSBkYXRhIEhUVFAgcmVxdWVzdCBib2R5IG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXNcbiAgICogICBkYXRhIHN0cmluZyBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBkYXRhIGlzIGFzIGV4cGVjdGVkLlxuICAgKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycy5cbiAgICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBtZXRob2QgdGhhdCBjb250cm9scyBob3cgYSBtYXRjaGVkXG4gICAqIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlbkpTT05QXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgSlNPTlAgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlIGByZXNwb25kYCBhZ2FpbiBpblxuICAgKiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuICBjcmVhdGVTaG9ydE1ldGhvZHMoJ3doZW4nKTtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCBIVFRQIG1ldGhvZC5cbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gICAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfE9iamVjdCk9fSBkYXRhIEhUVFAgcmVxdWVzdCBib2R5IG9yIGZ1bmN0aW9uIHRoYXRcbiAgICogIHJlY2VpdmVzIGRhdGEgc3RyaW5nIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRhdGEgaXMgYXMgZXhwZWN0ZWQsIG9yIE9iamVjdCBpZiByZXF1ZXN0IGJvZHlcbiAgICogIGlzIGluIEpTT04gZm9ybWF0LlxuICAgKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycyBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGh0dHAgaGVhZGVyXG4gICAqICAgb2JqZWN0IGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGhlYWRlcnMgbWF0Y2ggdGhlIGN1cnJlbnQgZXhwZWN0YXRpb24uXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiAgcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlIGByZXNwb25kYCBhZ2FpbiBpblxuICAgKiAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKlxuICAgKiAgLSByZXNwb25kIOKAk1xuICAgKiAgICBge2Z1bmN0aW9uKFtzdGF0dXMsXSBkYXRhWywgaGVhZGVycywgc3RhdHVzVGV4dF0pXG4gICAqICAgIHwgZnVuY3Rpb24oZnVuY3Rpb24obWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMpfWBcbiAgICogICAg4oCTIFRoZSByZXNwb25kIG1ldGhvZCB0YWtlcyBhIHNldCBvZiBzdGF0aWMgZGF0YSB0byBiZSByZXR1cm5lZCBvciBhIGZ1bmN0aW9uIHRoYXQgY2FuXG4gICAqICAgIHJldHVybiBhbiBhcnJheSBjb250YWluaW5nIHJlc3BvbnNlIHN0YXR1cyAobnVtYmVyKSwgcmVzcG9uc2UgZGF0YSAoc3RyaW5nKSwgcmVzcG9uc2VcbiAgICogICAgaGVhZGVycyAoT2JqZWN0KSwgYW5kIHRoZSB0ZXh0IGZvciB0aGUgc3RhdHVzIChzdHJpbmcpLiBUaGUgcmVzcG9uZCBtZXRob2QgcmV0dXJucyB0aGVcbiAgICogICAgYHJlcXVlc3RIYW5kbGVyYCBvYmplY3QgZm9yIHBvc3NpYmxlIG92ZXJyaWRlcy5cbiAgICovXG4gICRodHRwQmFja2VuZC5leHBlY3QgPSBmdW5jdGlvbihtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycykge1xuICAgIHZhciBleHBlY3RhdGlvbiA9IG5ldyBNb2NrSHR0cEV4cGVjdGF0aW9uKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzKSxcbiAgICAgICAgY2hhaW4gPSB7XG4gICAgICAgICAgcmVzcG9uZDogZnVuY3Rpb24oc3RhdHVzLCBkYXRhLCBoZWFkZXJzLCBzdGF0dXNUZXh0KSB7XG4gICAgICAgICAgICBleHBlY3RhdGlvbi5yZXNwb25zZSA9IGNyZWF0ZVJlc3BvbnNlKHN0YXR1cywgZGF0YSwgaGVhZGVycywgc3RhdHVzVGV4dCk7XG4gICAgICAgICAgICByZXR1cm4gY2hhaW47XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgZXhwZWN0YXRpb25zLnB1c2goZXhwZWN0YXRpb24pO1xuICAgIHJldHVybiBjaGFpbjtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RHRVRcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbiBmb3IgR0VUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgZXhwZWN0KClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0ge09iamVjdD19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlIGByZXNwb25kYCBhZ2FpbiBpblxuICAgKiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuIFNlZSAjZXhwZWN0IGZvciBtb3JlIGluZm8uXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RIRUFEXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDcmVhdGVzIGEgbmV3IHJlcXVlc3QgZXhwZWN0YXRpb24gZm9yIEhFQUQgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGBleHBlY3QoKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBhIHVybFxuICAgKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaGVzIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gICAqIEBwYXJhbSB7T2JqZWN0PX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiAgIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogICBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RERUxFVEVcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbiBmb3IgREVMRVRFIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgZXhwZWN0KClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0ge09iamVjdD19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogICByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqICAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjZXhwZWN0UE9TVFxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQ3JlYXRlcyBhIG5ldyByZXF1ZXN0IGV4cGVjdGF0aW9uIGZvciBQT1NUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgZXhwZWN0KClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0geyhzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl8T2JqZWN0KT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkgb3IgZnVuY3Rpb24gdGhhdFxuICAgKiAgcmVjZWl2ZXMgZGF0YSBzdHJpbmcgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgZGF0YSBpcyBhcyBleHBlY3RlZCwgb3IgT2JqZWN0IGlmIHJlcXVlc3QgYm9keVxuICAgKiAgaXMgaW4gSlNPTiBmb3JtYXQuXG4gICAqIEBwYXJhbSB7T2JqZWN0PX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiAgIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogICBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RQVVRcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbiBmb3IgUFVUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgZXhwZWN0KClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0geyhzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl8T2JqZWN0KT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkgb3IgZnVuY3Rpb24gdGhhdFxuICAgKiAgcmVjZWl2ZXMgZGF0YSBzdHJpbmcgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgZGF0YSBpcyBhcyBleHBlY3RlZCwgb3IgT2JqZWN0IGlmIHJlcXVlc3QgYm9keVxuICAgKiAgaXMgaW4gSlNPTiBmb3JtYXQuXG4gICAqIEBwYXJhbSB7T2JqZWN0PX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiAgIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogICBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RQQVRDSFxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQ3JlYXRlcyBhIG5ldyByZXF1ZXN0IGV4cGVjdGF0aW9uIGZvciBQQVRDSCByZXF1ZXN0cy4gRm9yIG1vcmUgaW5mbyBzZWUgYGV4cGVjdCgpYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gICAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfE9iamVjdCk9fSBkYXRhIEhUVFAgcmVxdWVzdCBib2R5IG9yIGZ1bmN0aW9uIHRoYXRcbiAgICogIHJlY2VpdmVzIGRhdGEgc3RyaW5nIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRhdGEgaXMgYXMgZXhwZWN0ZWQsIG9yIE9iamVjdCBpZiByZXF1ZXN0IGJvZHlcbiAgICogIGlzIGluIEpTT04gZm9ybWF0LlxuICAgKiBAcGFyYW0ge09iamVjdD19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogICByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqICAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjZXhwZWN0SlNPTlBcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbiBmb3IgSlNPTlAgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGBleHBlY3QoKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBhbiB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogICByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqICAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cbiAgY3JlYXRlU2hvcnRNZXRob2RzKCdleHBlY3QnKTtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNmbHVzaFxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogRmx1c2hlcyBhbGwgcGVuZGluZyByZXF1ZXN0cyB1c2luZyB0aGUgdHJhaW5lZCByZXNwb25zZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gY291bnQgTnVtYmVyIG9mIHJlc3BvbnNlcyB0byBmbHVzaCAoaW4gdGhlIG9yZGVyIHRoZXkgYXJyaXZlZCkuIElmIHVuZGVmaW5lZCxcbiAgICogICBhbGwgcGVuZGluZyByZXF1ZXN0cyB3aWxsIGJlIGZsdXNoZWQuIElmIHRoZXJlIGFyZSBubyBwZW5kaW5nIHJlcXVlc3RzIHdoZW4gdGhlIGZsdXNoIG1ldGhvZFxuICAgKiAgIGlzIGNhbGxlZCBhbiBleGNlcHRpb24gaXMgdGhyb3duIChhcyB0aGlzIHR5cGljYWxseSBhIHNpZ24gb2YgcHJvZ3JhbW1pbmcgZXJyb3IpLlxuICAgKi9cbiAgJGh0dHBCYWNrZW5kLmZsdXNoID0gZnVuY3Rpb24oY291bnQsIGRpZ2VzdCkge1xuICAgIGlmIChkaWdlc3QgIT09IGZhbHNlKSAkcm9vdFNjb3BlLiRkaWdlc3QoKTtcbiAgICBpZiAoIXJlc3BvbnNlcy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcignTm8gcGVuZGluZyByZXF1ZXN0IHRvIGZsdXNoICEnKTtcblxuICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChjb3VudCkgJiYgY291bnQgIT09IG51bGwpIHtcbiAgICAgIHdoaWxlIChjb3VudC0tKSB7XG4gICAgICAgIGlmICghcmVzcG9uc2VzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCdObyBtb3JlIHBlbmRpbmcgcmVxdWVzdCB0byBmbHVzaCAhJyk7XG4gICAgICAgIHJlc3BvbnNlcy5zaGlmdCgpKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHdoaWxlIChyZXNwb25zZXMubGVuZ3RoKSB7XG4gICAgICAgIHJlc3BvbnNlcy5zaGlmdCgpKCk7XG4gICAgICB9XG4gICAgfVxuICAgICRodHRwQmFja2VuZC52ZXJpZnlOb091dHN0YW5kaW5nRXhwZWN0YXRpb24oZGlnZXN0KTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCN2ZXJpZnlOb091dHN0YW5kaW5nRXhwZWN0YXRpb25cbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFZlcmlmaWVzIHRoYXQgYWxsIG9mIHRoZSByZXF1ZXN0cyBkZWZpbmVkIHZpYSB0aGUgYGV4cGVjdGAgYXBpIHdlcmUgbWFkZS4gSWYgYW55IG9mIHRoZVxuICAgKiByZXF1ZXN0cyB3ZXJlIG5vdCBtYWRlLCB2ZXJpZnlOb091dHN0YW5kaW5nRXhwZWN0YXRpb24gdGhyb3dzIGFuIGV4Y2VwdGlvbi5cbiAgICpcbiAgICogVHlwaWNhbGx5LCB5b3Ugd291bGQgY2FsbCB0aGlzIG1ldGhvZCBmb2xsb3dpbmcgZWFjaCB0ZXN0IGNhc2UgdGhhdCBhc3NlcnRzIHJlcXVlc3RzIHVzaW5nIGFuXG4gICAqIFwiYWZ0ZXJFYWNoXCIgY2xhdXNlLlxuICAgKlxuICAgKiBgYGBqc1xuICAgKiAgIGFmdGVyRWFjaCgkaHR0cEJhY2tlbmQudmVyaWZ5Tm9PdXRzdGFuZGluZ0V4cGVjdGF0aW9uKTtcbiAgICogYGBgXG4gICAqL1xuICAkaHR0cEJhY2tlbmQudmVyaWZ5Tm9PdXRzdGFuZGluZ0V4cGVjdGF0aW9uID0gZnVuY3Rpb24oZGlnZXN0KSB7XG4gICAgaWYgKGRpZ2VzdCAhPT0gZmFsc2UpICRyb290U2NvcGUuJGRpZ2VzdCgpO1xuICAgIGlmIChleHBlY3RhdGlvbnMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc2F0aXNmaWVkIHJlcXVlc3RzOiAnICsgZXhwZWN0YXRpb25zLmpvaW4oJywgJykpO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCN2ZXJpZnlOb091dHN0YW5kaW5nUmVxdWVzdFxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVmVyaWZpZXMgdGhhdCB0aGVyZSBhcmUgbm8gb3V0c3RhbmRpbmcgcmVxdWVzdHMgdGhhdCBuZWVkIHRvIGJlIGZsdXNoZWQuXG4gICAqXG4gICAqIFR5cGljYWxseSwgeW91IHdvdWxkIGNhbGwgdGhpcyBtZXRob2QgZm9sbG93aW5nIGVhY2ggdGVzdCBjYXNlIHRoYXQgYXNzZXJ0cyByZXF1ZXN0cyB1c2luZyBhblxuICAgKiBcImFmdGVyRWFjaFwiIGNsYXVzZS5cbiAgICpcbiAgICogYGBganNcbiAgICogICBhZnRlckVhY2goJGh0dHBCYWNrZW5kLnZlcmlmeU5vT3V0c3RhbmRpbmdSZXF1ZXN0KTtcbiAgICogYGBgXG4gICAqL1xuICAkaHR0cEJhY2tlbmQudmVyaWZ5Tm9PdXRzdGFuZGluZ1JlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAocmVzcG9uc2VzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmZsdXNoZWQgcmVxdWVzdHM6ICcgKyByZXNwb25zZXMubGVuZ3RoKTtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjcmVzZXRFeHBlY3RhdGlvbnNcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFJlc2V0cyBhbGwgcmVxdWVzdCBleHBlY3RhdGlvbnMsIGJ1dCBwcmVzZXJ2ZXMgYWxsIGJhY2tlbmQgZGVmaW5pdGlvbnMuIFR5cGljYWxseSwgeW91IHdvdWxkXG4gICAqIGNhbGwgcmVzZXRFeHBlY3RhdGlvbnMgZHVyaW5nIGEgbXVsdGlwbGUtcGhhc2UgdGVzdCB3aGVuIHlvdSB3YW50IHRvIHJldXNlIHRoZSBzYW1lIGluc3RhbmNlIG9mXG4gICAqICRodHRwQmFja2VuZCBtb2NrLlxuICAgKi9cbiAgJGh0dHBCYWNrZW5kLnJlc2V0RXhwZWN0YXRpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgZXhwZWN0YXRpb25zLmxlbmd0aCA9IDA7XG4gICAgcmVzcG9uc2VzLmxlbmd0aCA9IDA7XG4gIH07XG5cbiAgcmV0dXJuICRodHRwQmFja2VuZDtcblxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNob3J0TWV0aG9kcyhwcmVmaXgpIHtcbiAgICBhbmd1bGFyLmZvckVhY2goWydHRVQnLCAnREVMRVRFJywgJ0pTT05QJywgJ0hFQUQnXSwgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICRodHRwQmFja2VuZFtwcmVmaXggKyBtZXRob2RdID0gZnVuY3Rpb24odXJsLCBoZWFkZXJzKSB7XG4gICAgICAgcmV0dXJuICRodHRwQmFja2VuZFtwcmVmaXhdKG1ldGhvZCwgdXJsLCB1bmRlZmluZWQsIGhlYWRlcnMpO1xuICAgICB9O1xuICAgIH0pO1xuXG4gICAgYW5ndWxhci5mb3JFYWNoKFsnUFVUJywgJ1BPU1QnLCAnUEFUQ0gnXSwgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICAkaHR0cEJhY2tlbmRbcHJlZml4ICsgbWV0aG9kXSA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgaGVhZGVycykge1xuICAgICAgICByZXR1cm4gJGh0dHBCYWNrZW5kW3ByZWZpeF0obWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBNb2NrSHR0cEV4cGVjdGF0aW9uKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzKSB7XG5cbiAgdGhpcy5kYXRhID0gZGF0YTtcbiAgdGhpcy5oZWFkZXJzID0gaGVhZGVycztcblxuICB0aGlzLm1hdGNoID0gZnVuY3Rpb24obSwgdSwgZCwgaCkge1xuICAgIGlmIChtZXRob2QgIT0gbSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghdGhpcy5tYXRjaFVybCh1KSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChkKSAmJiAhdGhpcy5tYXRjaERhdGEoZCkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoaCkgJiYgIXRoaXMubWF0Y2hIZWFkZXJzKGgpKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgdGhpcy5tYXRjaFVybCA9IGZ1bmN0aW9uKHUpIHtcbiAgICBpZiAoIXVybCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGFuZ3VsYXIuaXNGdW5jdGlvbih1cmwudGVzdCkpIHJldHVybiB1cmwudGVzdCh1KTtcbiAgICBpZiAoYW5ndWxhci5pc0Z1bmN0aW9uKHVybCkpIHJldHVybiB1cmwodSk7XG4gICAgcmV0dXJuIHVybCA9PSB1O1xuICB9O1xuXG4gIHRoaXMubWF0Y2hIZWFkZXJzID0gZnVuY3Rpb24oaCkge1xuICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKGhlYWRlcnMpKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoYW5ndWxhci5pc0Z1bmN0aW9uKGhlYWRlcnMpKSByZXR1cm4gaGVhZGVycyhoKTtcbiAgICByZXR1cm4gYW5ndWxhci5lcXVhbHMoaGVhZGVycywgaCk7XG4gIH07XG5cbiAgdGhpcy5tYXRjaERhdGEgPSBmdW5jdGlvbihkKSB7XG4gICAgaWYgKGFuZ3VsYXIuaXNVbmRlZmluZWQoZGF0YSkpIHJldHVybiB0cnVlO1xuICAgIGlmIChkYXRhICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihkYXRhLnRlc3QpKSByZXR1cm4gZGF0YS50ZXN0KGQpO1xuICAgIGlmIChkYXRhICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihkYXRhKSkgcmV0dXJuIGRhdGEoZCk7XG4gICAgaWYgKGRhdGEgJiYgIWFuZ3VsYXIuaXNTdHJpbmcoZGF0YSkpIHtcbiAgICAgIHJldHVybiBhbmd1bGFyLmVxdWFscyhhbmd1bGFyLmZyb21Kc29uKGFuZ3VsYXIudG9Kc29uKGRhdGEpKSwgYW5ndWxhci5mcm9tSnNvbihkKSk7XG4gICAgfVxuICAgIHJldHVybiBkYXRhID09IGQ7XG4gIH07XG5cbiAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBtZXRob2QgKyAnICcgKyB1cmw7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU1vY2tYaHIoKSB7XG4gIHJldHVybiBuZXcgTW9ja1hocigpO1xufVxuXG5mdW5jdGlvbiBNb2NrWGhyKCkge1xuXG4gIC8vIGhhY2sgZm9yIHRlc3RpbmcgJGh0dHAsICRodHRwQmFja2VuZFxuICBNb2NrWGhyLiQkbGFzdEluc3RhbmNlID0gdGhpcztcblxuICB0aGlzLm9wZW4gPSBmdW5jdGlvbihtZXRob2QsIHVybCwgYXN5bmMpIHtcbiAgICB0aGlzLiQkbWV0aG9kID0gbWV0aG9kO1xuICAgIHRoaXMuJCR1cmwgPSB1cmw7XG4gICAgdGhpcy4kJGFzeW5jID0gYXN5bmM7XG4gICAgdGhpcy4kJHJlcUhlYWRlcnMgPSB7fTtcbiAgICB0aGlzLiQkcmVzcEhlYWRlcnMgPSB7fTtcbiAgfTtcblxuICB0aGlzLnNlbmQgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdGhpcy4kJGRhdGEgPSBkYXRhO1xuICB9O1xuXG4gIHRoaXMuc2V0UmVxdWVzdEhlYWRlciA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICB0aGlzLiQkcmVxSGVhZGVyc1trZXldID0gdmFsdWU7XG4gIH07XG5cbiAgdGhpcy5nZXRSZXNwb25zZUhlYWRlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAvLyB0aGUgbG9va3VwIG11c3QgYmUgY2FzZSBpbnNlbnNpdGl2ZSxcbiAgICAvLyB0aGF0J3Mgd2h5IHdlIHRyeSB0d28gcXVpY2sgbG9va3VwcyBmaXJzdCBhbmQgZnVsbCBzY2FuIGxhc3RcbiAgICB2YXIgaGVhZGVyID0gdGhpcy4kJHJlc3BIZWFkZXJzW25hbWVdO1xuICAgIGlmIChoZWFkZXIpIHJldHVybiBoZWFkZXI7XG5cbiAgICBuYW1lID0gYW5ndWxhci5sb3dlcmNhc2UobmFtZSk7XG4gICAgaGVhZGVyID0gdGhpcy4kJHJlc3BIZWFkZXJzW25hbWVdO1xuICAgIGlmIChoZWFkZXIpIHJldHVybiBoZWFkZXI7XG5cbiAgICBoZWFkZXIgPSB1bmRlZmluZWQ7XG4gICAgYW5ndWxhci5mb3JFYWNoKHRoaXMuJCRyZXNwSGVhZGVycywgZnVuY3Rpb24oaGVhZGVyVmFsLCBoZWFkZXJOYW1lKSB7XG4gICAgICBpZiAoIWhlYWRlciAmJiBhbmd1bGFyLmxvd2VyY2FzZShoZWFkZXJOYW1lKSA9PSBuYW1lKSBoZWFkZXIgPSBoZWFkZXJWYWw7XG4gICAgfSk7XG4gICAgcmV0dXJuIGhlYWRlcjtcbiAgfTtcblxuICB0aGlzLmdldEFsbFJlc3BvbnNlSGVhZGVycyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsaW5lcyA9IFtdO1xuXG4gICAgYW5ndWxhci5mb3JFYWNoKHRoaXMuJCRyZXNwSGVhZGVycywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgbGluZXMucHVzaChrZXkgKyAnOiAnICsgdmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbiAgfTtcblxuICB0aGlzLmFib3J0ID0gYW5ndWxhci5ub29wO1xufVxuXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lICR0aW1lb3V0XG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBUaGlzIHNlcnZpY2UgaXMganVzdCBhIHNpbXBsZSBkZWNvcmF0b3IgZm9yIHtAbGluayBuZy4kdGltZW91dCAkdGltZW91dH0gc2VydmljZVxuICogdGhhdCBhZGRzIGEgXCJmbHVzaFwiIGFuZCBcInZlcmlmeU5vUGVuZGluZ1Rhc2tzXCIgbWV0aG9kcy5cbiAqL1xuXG5hbmd1bGFyLm1vY2suJFRpbWVvdXREZWNvcmF0b3IgPSBbJyRkZWxlZ2F0ZScsICckYnJvd3NlcicsIGZ1bmN0aW9uKCRkZWxlZ2F0ZSwgJGJyb3dzZXIpIHtcblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkdGltZW91dCNmbHVzaFxuICAgKiBAZGVzY3JpcHRpb25cbiAgICpcbiAgICogRmx1c2hlcyB0aGUgcXVldWUgb2YgcGVuZGluZyB0YXNrcy5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXI9fSBkZWxheSBtYXhpbXVtIHRpbWVvdXQgYW1vdW50IHRvIGZsdXNoIHVwIHVudGlsXG4gICAqL1xuICAkZGVsZWdhdGUuZmx1c2ggPSBmdW5jdGlvbihkZWxheSkge1xuICAgICRicm93c2VyLmRlZmVyLmZsdXNoKGRlbGF5KTtcbiAgfTtcblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkdGltZW91dCN2ZXJpZnlOb1BlbmRpbmdUYXNrc1xuICAgKiBAZGVzY3JpcHRpb25cbiAgICpcbiAgICogVmVyaWZpZXMgdGhhdCB0aGVyZSBhcmUgbm8gcGVuZGluZyB0YXNrcyB0aGF0IG5lZWQgdG8gYmUgZmx1c2hlZC5cbiAgICovXG4gICRkZWxlZ2F0ZS52ZXJpZnlOb1BlbmRpbmdUYXNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICgkYnJvd3Nlci5kZWZlcnJlZEZucy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRGVmZXJyZWQgdGFza3MgdG8gZmx1c2ggKCcgKyAkYnJvd3Nlci5kZWZlcnJlZEZucy5sZW5ndGggKyAnKTogJyArXG4gICAgICAgICAgZm9ybWF0UGVuZGluZ1Rhc2tzQXNTdHJpbmcoJGJyb3dzZXIuZGVmZXJyZWRGbnMpKTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gZm9ybWF0UGVuZGluZ1Rhc2tzQXNTdHJpbmcodGFza3MpIHtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgYW5ndWxhci5mb3JFYWNoKHRhc2tzLCBmdW5jdGlvbih0YXNrKSB7XG4gICAgICByZXN1bHQucHVzaCgne2lkOiAnICsgdGFzay5pZCArICcsICcgKyAndGltZTogJyArIHRhc2sudGltZSArICd9Jyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0LmpvaW4oJywgJyk7XG4gIH1cblxuICByZXR1cm4gJGRlbGVnYXRlO1xufV07XG5cbmFuZ3VsYXIubW9jay4kUkFGRGVjb3JhdG9yID0gWyckZGVsZWdhdGUnLCBmdW5jdGlvbigkZGVsZWdhdGUpIHtcbiAgdmFyIHF1ZXVlID0gW107XG4gIHZhciByYWZGbiA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIGluZGV4ID0gcXVldWUubGVuZ3RoO1xuICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHF1ZXVlLnNwbGljZShpbmRleCwgMSk7XG4gICAgfTtcbiAgfTtcblxuICByYWZGbi5zdXBwb3J0ZWQgPSAkZGVsZWdhdGUuc3VwcG9ydGVkO1xuXG4gIHJhZkZuLmZsdXNoID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByQUYgY2FsbGJhY2tzIHByZXNlbnQnKTtcbiAgICB9XG5cbiAgICB2YXIgbGVuZ3RoID0gcXVldWUubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHF1ZXVlW2ldKCk7XG4gICAgfVxuXG4gICAgcXVldWUgPSBxdWV1ZS5zbGljZShpKTtcbiAgfTtcblxuICByZXR1cm4gcmFmRm47XG59XTtcblxuYW5ndWxhci5tb2NrLiRBc3luY0NhbGxiYWNrRGVjb3JhdG9yID0gWyckZGVsZWdhdGUnLCBmdW5jdGlvbigkZGVsZWdhdGUpIHtcbiAgdmFyIGNhbGxiYWNrcyA9IFtdO1xuICB2YXIgYWRkRm4gPSBmdW5jdGlvbihmbikge1xuICAgIGNhbGxiYWNrcy5wdXNoKGZuKTtcbiAgfTtcbiAgYWRkRm4uZmx1c2ggPSBmdW5jdGlvbigpIHtcbiAgICBhbmd1bGFyLmZvckVhY2goY2FsbGJhY2tzLCBmdW5jdGlvbihmbikge1xuICAgICAgZm4oKTtcbiAgICB9KTtcbiAgICBjYWxsYmFja3MgPSBbXTtcbiAgfTtcbiAgcmV0dXJuIGFkZEZuO1xufV07XG5cbi8qKlxuICpcbiAqL1xuYW5ndWxhci5tb2NrLiRSb290RWxlbWVudFByb3ZpZGVyID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuJGdldCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBhbmd1bGFyLmVsZW1lbnQoJzxkaXYgbmctYXBwPjwvZGl2PicpO1xuICB9O1xufTtcblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgJGNvbnRyb2xsZXJcbiAqIEBkZXNjcmlwdGlvblxuICogQSBkZWNvcmF0b3IgZm9yIHtAbGluayBuZy4kY29udHJvbGxlcn0gd2l0aCBhZGRpdGlvbmFsIGBiaW5kaW5nc2AgcGFyYW1ldGVyLCB1c2VmdWwgd2hlbiB0ZXN0aW5nXG4gKiBjb250cm9sbGVycyBvZiBkaXJlY3RpdmVzIHRoYXQgdXNlIHtAbGluayAkY29tcGlsZSMtYmluZHRvY29udHJvbGxlci0gYGJpbmRUb0NvbnRyb2xsZXJgfS5cbiAqXG4gKlxuICogIyMgRXhhbXBsZVxuICpcbiAqIGBgYGpzXG4gKlxuICogLy8gRGlyZWN0aXZlIGRlZmluaXRpb24gLi4uXG4gKlxuICogbXlNb2QuZGlyZWN0aXZlKCdteURpcmVjdGl2ZScsIHtcbiAqICAgY29udHJvbGxlcjogJ015RGlyZWN0aXZlQ29udHJvbGxlcicsXG4gKiAgIGJpbmRUb0NvbnRyb2xsZXI6IHtcbiAqICAgICBuYW1lOiAnQCdcbiAqICAgfVxuICogfSk7XG4gKlxuICpcbiAqIC8vIENvbnRyb2xsZXIgZGVmaW5pdGlvbiAuLi5cbiAqXG4gKiBteU1vZC5jb250cm9sbGVyKCdNeURpcmVjdGl2ZUNvbnRyb2xsZXInLCBbJ2xvZycsIGZ1bmN0aW9uKCRsb2cpIHtcbiAqICAgJGxvZy5pbmZvKHRoaXMubmFtZSk7XG4gKiB9KV07XG4gKlxuICpcbiAqIC8vIEluIGEgdGVzdCAuLi5cbiAqXG4gKiBkZXNjcmliZSgnbXlEaXJlY3RpdmVDb250cm9sbGVyJywgZnVuY3Rpb24oKSB7XG4gKiAgIGl0KCdzaG91bGQgd3JpdGUgdGhlIGJvdW5kIG5hbWUgdG8gdGhlIGxvZycsIGluamVjdChmdW5jdGlvbigkY29udHJvbGxlciwgJGxvZykge1xuICogICAgIHZhciBjdHJsID0gJGNvbnRyb2xsZXIoJ015RGlyZWN0aXZlJywgeyAvKiBubyBsb2NhbHMgJiM0MjsvIH0sIHsgbmFtZTogJ0NsYXJrIEtlbnQnIH0pO1xuICogICAgIGV4cGVjdChjdHJsLm5hbWUpLnRvRXF1YWwoJ0NsYXJrIEtlbnQnKTtcbiAqICAgICBleHBlY3QoJGxvZy5pbmZvLmxvZ3MpLnRvRXF1YWwoWydDbGFyayBLZW50J10pO1xuICogICB9KTtcbiAqIH0pO1xuICpcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb258c3RyaW5nfSBjb25zdHJ1Y3RvciBJZiBjYWxsZWQgd2l0aCBhIGZ1bmN0aW9uIHRoZW4gaXQncyBjb25zaWRlcmVkIHRvIGJlIHRoZVxuICogICAgY29udHJvbGxlciBjb25zdHJ1Y3RvciBmdW5jdGlvbi4gT3RoZXJ3aXNlIGl0J3MgY29uc2lkZXJlZCB0byBiZSBhIHN0cmluZyB3aGljaCBpcyB1c2VkXG4gKiAgICB0byByZXRyaWV2ZSB0aGUgY29udHJvbGxlciBjb25zdHJ1Y3RvciB1c2luZyB0aGUgZm9sbG93aW5nIHN0ZXBzOlxuICpcbiAqICAgICogY2hlY2sgaWYgYSBjb250cm9sbGVyIHdpdGggZ2l2ZW4gbmFtZSBpcyByZWdpc3RlcmVkIHZpYSBgJGNvbnRyb2xsZXJQcm92aWRlcmBcbiAqICAgICogY2hlY2sgaWYgZXZhbHVhdGluZyB0aGUgc3RyaW5nIG9uIHRoZSBjdXJyZW50IHNjb3BlIHJldHVybnMgYSBjb25zdHJ1Y3RvclxuICogICAgKiBpZiAkY29udHJvbGxlclByb3ZpZGVyI2FsbG93R2xvYmFscywgY2hlY2sgYHdpbmRvd1tjb25zdHJ1Y3Rvcl1gIG9uIHRoZSBnbG9iYWxcbiAqICAgICAgYHdpbmRvd2Agb2JqZWN0IChub3QgcmVjb21tZW5kZWQpXG4gKlxuICogICAgVGhlIHN0cmluZyBjYW4gdXNlIHRoZSBgY29udHJvbGxlciBhcyBwcm9wZXJ0eWAgc3ludGF4LCB3aGVyZSB0aGUgY29udHJvbGxlciBpbnN0YW5jZSBpcyBwdWJsaXNoZWRcbiAqICAgIGFzIHRoZSBzcGVjaWZpZWQgcHJvcGVydHkgb24gdGhlIGBzY29wZWA7IHRoZSBgc2NvcGVgIG11c3QgYmUgaW5qZWN0ZWQgaW50byBgbG9jYWxzYCBwYXJhbSBmb3IgdGhpc1xuICogICAgdG8gd29yayBjb3JyZWN0bHkuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGxvY2FscyBJbmplY3Rpb24gbG9jYWxzIGZvciBDb250cm9sbGVyLlxuICogQHBhcmFtIHtPYmplY3Q9fSBiaW5kaW5ncyBQcm9wZXJ0aWVzIHRvIGFkZCB0byB0aGUgY29udHJvbGxlciBiZWZvcmUgaW52b2tpbmcgdGhlIGNvbnN0cnVjdG9yLiBUaGlzIGlzIHVzZWRcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgdG8gc2ltdWxhdGUgdGhlIGBiaW5kVG9Db250cm9sbGVyYCBmZWF0dXJlIGFuZCBzaW1wbGlmeSBjZXJ0YWluIGtpbmRzIG9mIHRlc3RzLlxuICogQHJldHVybiB7T2JqZWN0fSBJbnN0YW5jZSBvZiBnaXZlbiBjb250cm9sbGVyLlxuICovXG5hbmd1bGFyLm1vY2suJENvbnRyb2xsZXJEZWNvcmF0b3IgPSBbJyRkZWxlZ2F0ZScsIGZ1bmN0aW9uKCRkZWxlZ2F0ZSkge1xuICByZXR1cm4gZnVuY3Rpb24oZXhwcmVzc2lvbiwgbG9jYWxzLCBsYXRlciwgaWRlbnQpIHtcbiAgICBpZiAobGF0ZXIgJiYgdHlwZW9mIGxhdGVyID09PSAnb2JqZWN0Jykge1xuICAgICAgdmFyIGNyZWF0ZSA9ICRkZWxlZ2F0ZShleHByZXNzaW9uLCBsb2NhbHMsIHRydWUsIGlkZW50KTtcbiAgICAgIGFuZ3VsYXIuZXh0ZW5kKGNyZWF0ZS5pbnN0YW5jZSwgbGF0ZXIpO1xuICAgICAgcmV0dXJuIGNyZWF0ZSgpO1xuICAgIH1cbiAgICByZXR1cm4gJGRlbGVnYXRlKGV4cHJlc3Npb24sIGxvY2FscywgbGF0ZXIsIGlkZW50KTtcbiAgfTtcbn1dO1xuXG5cbi8qKlxuICogQG5nZG9jIG1vZHVsZVxuICogQG5hbWUgbmdNb2NrXG4gKiBAcGFja2FnZU5hbWUgYW5ndWxhci1tb2Nrc1xuICogQGRlc2NyaXB0aW9uXG4gKlxuICogIyBuZ01vY2tcbiAqXG4gKiBUaGUgYG5nTW9ja2AgbW9kdWxlIHByb3ZpZGVzIHN1cHBvcnQgdG8gaW5qZWN0IGFuZCBtb2NrIEFuZ3VsYXIgc2VydmljZXMgaW50byB1bml0IHRlc3RzLlxuICogSW4gYWRkaXRpb24sIG5nTW9jayBhbHNvIGV4dGVuZHMgdmFyaW91cyBjb3JlIG5nIHNlcnZpY2VzIHN1Y2ggdGhhdCB0aGV5IGNhbiBiZVxuICogaW5zcGVjdGVkIGFuZCBjb250cm9sbGVkIGluIGEgc3luY2hyb25vdXMgbWFubmVyIHdpdGhpbiB0ZXN0IGNvZGUuXG4gKlxuICpcbiAqIDxkaXYgZG9jLW1vZHVsZS1jb21wb25lbnRzPVwibmdNb2NrXCI+PC9kaXY+XG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnbmdNb2NrJywgWyduZyddKS5wcm92aWRlcih7XG4gICRicm93c2VyOiBhbmd1bGFyLm1vY2suJEJyb3dzZXJQcm92aWRlcixcbiAgJGV4Y2VwdGlvbkhhbmRsZXI6IGFuZ3VsYXIubW9jay4kRXhjZXB0aW9uSGFuZGxlclByb3ZpZGVyLFxuICAkbG9nOiBhbmd1bGFyLm1vY2suJExvZ1Byb3ZpZGVyLFxuICAkaW50ZXJ2YWw6IGFuZ3VsYXIubW9jay4kSW50ZXJ2YWxQcm92aWRlcixcbiAgJGh0dHBCYWNrZW5kOiBhbmd1bGFyLm1vY2suJEh0dHBCYWNrZW5kUHJvdmlkZXIsXG4gICRyb290RWxlbWVudDogYW5ndWxhci5tb2NrLiRSb290RWxlbWVudFByb3ZpZGVyXG59KS5jb25maWcoWyckcHJvdmlkZScsIGZ1bmN0aW9uKCRwcm92aWRlKSB7XG4gICRwcm92aWRlLmRlY29yYXRvcignJHRpbWVvdXQnLCBhbmd1bGFyLm1vY2suJFRpbWVvdXREZWNvcmF0b3IpO1xuICAkcHJvdmlkZS5kZWNvcmF0b3IoJyQkckFGJywgYW5ndWxhci5tb2NrLiRSQUZEZWNvcmF0b3IpO1xuICAkcHJvdmlkZS5kZWNvcmF0b3IoJyQkYXN5bmNDYWxsYmFjaycsIGFuZ3VsYXIubW9jay4kQXN5bmNDYWxsYmFja0RlY29yYXRvcik7XG4gICRwcm92aWRlLmRlY29yYXRvcignJHJvb3RTY29wZScsIGFuZ3VsYXIubW9jay4kUm9vdFNjb3BlRGVjb3JhdG9yKTtcbiAgJHByb3ZpZGUuZGVjb3JhdG9yKCckY29udHJvbGxlcicsIGFuZ3VsYXIubW9jay4kQ29udHJvbGxlckRlY29yYXRvcik7XG59XSk7XG5cbi8qKlxuICogQG5nZG9jIG1vZHVsZVxuICogQG5hbWUgbmdNb2NrRTJFXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQHBhY2thZ2VOYW1lIGFuZ3VsYXItbW9ja3NcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFRoZSBgbmdNb2NrRTJFYCBpcyBhbiBhbmd1bGFyIG1vZHVsZSB3aGljaCBjb250YWlucyBtb2NrcyBzdWl0YWJsZSBmb3IgZW5kLXRvLWVuZCB0ZXN0aW5nLlxuICogQ3VycmVudGx5IHRoZXJlIGlzIG9ubHkgb25lIG1vY2sgcHJlc2VudCBpbiB0aGlzIG1vZHVsZSAtXG4gKiB0aGUge0BsaW5rIG5nTW9ja0UyRS4kaHR0cEJhY2tlbmQgZTJlICRodHRwQmFja2VuZH0gbW9jay5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ25nTW9ja0UyRScsIFsnbmcnXSkuY29uZmlnKFsnJHByb3ZpZGUnLCBmdW5jdGlvbigkcHJvdmlkZSkge1xuICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRodHRwQmFja2VuZCcsIGFuZ3VsYXIubW9jay5lMmUuJGh0dHBCYWNrZW5kRGVjb3JhdG9yKTtcbn1dKTtcblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgJGh0dHBCYWNrZW5kXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQGRlc2NyaXB0aW9uXG4gKiBGYWtlIEhUVFAgYmFja2VuZCBpbXBsZW1lbnRhdGlvbiBzdWl0YWJsZSBmb3IgZW5kLXRvLWVuZCB0ZXN0aW5nIG9yIGJhY2tlbmQtbGVzcyBkZXZlbG9wbWVudCBvZlxuICogYXBwbGljYXRpb25zIHRoYXQgdXNlIHRoZSB7QGxpbmsgbmcuJGh0dHAgJGh0dHAgc2VydmljZX0uXG4gKlxuICogKk5vdGUqOiBGb3IgZmFrZSBodHRwIGJhY2tlbmQgaW1wbGVtZW50YXRpb24gc3VpdGFibGUgZm9yIHVuaXQgdGVzdGluZyBwbGVhc2Ugc2VlXG4gKiB7QGxpbmsgbmdNb2NrLiRodHRwQmFja2VuZCB1bml0LXRlc3RpbmcgJGh0dHBCYWNrZW5kIG1vY2t9LlxuICpcbiAqIFRoaXMgaW1wbGVtZW50YXRpb24gY2FuIGJlIHVzZWQgdG8gcmVzcG9uZCB3aXRoIHN0YXRpYyBvciBkeW5hbWljIHJlc3BvbnNlcyB2aWEgdGhlIGB3aGVuYCBhcGlcbiAqIGFuZCBpdHMgc2hvcnRjdXRzIChgd2hlbkdFVGAsIGB3aGVuUE9TVGAsIGV0YykgYW5kIG9wdGlvbmFsbHkgcGFzcyB0aHJvdWdoIHJlcXVlc3RzIHRvIHRoZVxuICogcmVhbCAkaHR0cEJhY2tlbmQgZm9yIHNwZWNpZmljIHJlcXVlc3RzIChlLmcuIHRvIGludGVyYWN0IHdpdGggY2VydGFpbiByZW1vdGUgYXBpcyBvciB0byBmZXRjaFxuICogdGVtcGxhdGVzIGZyb20gYSB3ZWJzZXJ2ZXIpLlxuICpcbiAqIEFzIG9wcG9zZWQgdG8gdW5pdC10ZXN0aW5nLCBpbiBhbiBlbmQtdG8tZW5kIHRlc3Rpbmcgc2NlbmFyaW8gb3IgaW4gc2NlbmFyaW8gd2hlbiBhbiBhcHBsaWNhdGlvblxuICogaXMgYmVpbmcgZGV2ZWxvcGVkIHdpdGggdGhlIHJlYWwgYmFja2VuZCBhcGkgcmVwbGFjZWQgd2l0aCBhIG1vY2ssIGl0IGlzIG9mdGVuIGRlc2lyYWJsZSBmb3JcbiAqIGNlcnRhaW4gY2F0ZWdvcnkgb2YgcmVxdWVzdHMgdG8gYnlwYXNzIHRoZSBtb2NrIGFuZCBpc3N1ZSBhIHJlYWwgaHR0cCByZXF1ZXN0IChlLmcuIHRvIGZldGNoXG4gKiB0ZW1wbGF0ZXMgb3Igc3RhdGljIGZpbGVzIGZyb20gdGhlIHdlYnNlcnZlcikuIFRvIGNvbmZpZ3VyZSB0aGUgYmFja2VuZCB3aXRoIHRoaXMgYmVoYXZpb3JcbiAqIHVzZSB0aGUgYHBhc3NUaHJvdWdoYCByZXF1ZXN0IGhhbmRsZXIgb2YgYHdoZW5gIGluc3RlYWQgb2YgYHJlc3BvbmRgLlxuICpcbiAqIEFkZGl0aW9uYWxseSwgd2UgZG9uJ3Qgd2FudCB0byBtYW51YWxseSBoYXZlIHRvIGZsdXNoIG1vY2tlZCBvdXQgcmVxdWVzdHMgbGlrZSB3ZSBkbyBkdXJpbmcgdW5pdFxuICogdGVzdGluZy4gRm9yIHRoaXMgcmVhc29uIHRoZSBlMmUgJGh0dHBCYWNrZW5kIGZsdXNoZXMgbW9ja2VkIG91dCByZXF1ZXN0c1xuICogYXV0b21hdGljYWxseSwgY2xvc2VseSBzaW11bGF0aW5nIHRoZSBiZWhhdmlvciBvZiB0aGUgWE1MSHR0cFJlcXVlc3Qgb2JqZWN0LlxuICpcbiAqIFRvIHNldHVwIHRoZSBhcHBsaWNhdGlvbiB0byBydW4gd2l0aCB0aGlzIGh0dHAgYmFja2VuZCwgeW91IGhhdmUgdG8gY3JlYXRlIGEgbW9kdWxlIHRoYXQgZGVwZW5kc1xuICogb24gdGhlIGBuZ01vY2tFMkVgIGFuZCB5b3VyIGFwcGxpY2F0aW9uIG1vZHVsZXMgYW5kIGRlZmluZXMgdGhlIGZha2UgYmFja2VuZDpcbiAqXG4gKiBgYGBqc1xuICogICBteUFwcERldiA9IGFuZ3VsYXIubW9kdWxlKCdteUFwcERldicsIFsnbXlBcHAnLCAnbmdNb2NrRTJFJ10pO1xuICogICBteUFwcERldi5ydW4oZnVuY3Rpb24oJGh0dHBCYWNrZW5kKSB7XG4gKiAgICAgcGhvbmVzID0gW3tuYW1lOiAncGhvbmUxJ30sIHtuYW1lOiAncGhvbmUyJ31dO1xuICpcbiAqICAgICAvLyByZXR1cm5zIHRoZSBjdXJyZW50IGxpc3Qgb2YgcGhvbmVzXG4gKiAgICAgJGh0dHBCYWNrZW5kLndoZW5HRVQoJy9waG9uZXMnKS5yZXNwb25kKHBob25lcyk7XG4gKlxuICogICAgIC8vIGFkZHMgYSBuZXcgcGhvbmUgdG8gdGhlIHBob25lcyBhcnJheVxuICogICAgICRodHRwQmFja2VuZC53aGVuUE9TVCgnL3Bob25lcycpLnJlc3BvbmQoZnVuY3Rpb24obWV0aG9kLCB1cmwsIGRhdGEpIHtcbiAqICAgICAgIHZhciBwaG9uZSA9IGFuZ3VsYXIuZnJvbUpzb24oZGF0YSk7XG4gKiAgICAgICBwaG9uZXMucHVzaChwaG9uZSk7XG4gKiAgICAgICByZXR1cm4gWzIwMCwgcGhvbmUsIHt9XTtcbiAqICAgICB9KTtcbiAqICAgICAkaHR0cEJhY2tlbmQud2hlbkdFVCgvXlxcL3RlbXBsYXRlc1xcLy8pLnBhc3NUaHJvdWdoKCk7XG4gKiAgICAgLy8uLi5cbiAqICAgfSk7XG4gKiBgYGBcbiAqXG4gKiBBZnRlcndhcmRzLCBib290c3RyYXAgeW91ciBhcHAgd2l0aCB0aGlzIG5ldyBtb2R1bGUuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2MgbWV0aG9kXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlblxuICogQG1vZHVsZSBuZ01vY2tFMkVcbiAqIEBkZXNjcmlwdGlvblxuICogQ3JlYXRlcyBhIG5ldyBiYWNrZW5kIGRlZmluaXRpb24uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCBIVFRQIG1ldGhvZC5cbiAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBhIHVybFxuICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cCk9fSBkYXRhIEhUVFAgcmVxdWVzdCBib2R5LlxuICogQHBhcmFtIHsoT2JqZWN0fGZ1bmN0aW9uKE9iamVjdCkpPX0gaGVhZGVycyBIVFRQIGhlYWRlcnMgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBodHRwIGhlYWRlclxuICogICBvYmplY3QgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgaGVhZGVycyBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKlxuICogIC0gcmVzcG9uZCDigJNcbiAqICAgIGB7ZnVuY3Rpb24oW3N0YXR1cyxdIGRhdGFbLCBoZWFkZXJzLCBzdGF0dXNUZXh0XSlcbiAqICAgIHwgZnVuY3Rpb24oZnVuY3Rpb24obWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMpfWBcbiAqICAgIOKAkyBUaGUgcmVzcG9uZCBtZXRob2QgdGFrZXMgYSBzZXQgb2Ygc3RhdGljIGRhdGEgdG8gYmUgcmV0dXJuZWQgb3IgYSBmdW5jdGlvbiB0aGF0IGNhbiByZXR1cm5cbiAqICAgIGFuIGFycmF5IGNvbnRhaW5pbmcgcmVzcG9uc2Ugc3RhdHVzIChudW1iZXIpLCByZXNwb25zZSBkYXRhIChzdHJpbmcpLCByZXNwb25zZSBoZWFkZXJzXG4gKiAgICAoT2JqZWN0KSwgYW5kIHRoZSB0ZXh0IGZvciB0aGUgc3RhdHVzIChzdHJpbmcpLlxuICogIC0gcGFzc1Rocm91Z2gg4oCTIGB7ZnVuY3Rpb24oKX1gIOKAkyBBbnkgcmVxdWVzdCBtYXRjaGluZyBhIGJhY2tlbmQgZGVmaW5pdGlvbiB3aXRoXG4gKiAgICBgcGFzc1Rocm91Z2hgIGhhbmRsZXIgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaCB0byB0aGUgcmVhbCBiYWNrZW5kIChhbiBYSFIgcmVxdWVzdCB3aWxsIGJlIG1hZGVcbiAqICAgIHRvIHRoZSBzZXJ2ZXIuKVxuICogIC0gQm90aCBtZXRob2RzIHJldHVybiB0aGUgYHJlcXVlc3RIYW5kbGVyYCBvYmplY3QgZm9yIHBvc3NpYmxlIG92ZXJyaWRlcy5cbiAqL1xuXG4vKipcbiAqIEBuZ2RvYyBtZXRob2RcbiAqIEBuYW1lICRodHRwQmFja2VuZCN3aGVuR0VUXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQGRlc2NyaXB0aW9uXG4gKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgR0VUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2MgbWV0aG9kXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlbkhFQURcbiAqIEBtb2R1bGUgbmdNb2NrRTJFXG4gKiBAZGVzY3JpcHRpb25cbiAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBIRUFEIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2MgbWV0aG9kXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlbkRFTEVURVxuICogQG1vZHVsZSBuZ01vY2tFMkVcbiAqIEBkZXNjcmlwdGlvblxuICogQ3JlYXRlcyBhIG5ldyBiYWNrZW5kIGRlZmluaXRpb24gZm9yIERFTEVURSByZXF1ZXN0cy4gRm9yIG1vcmUgaW5mbyBzZWUgYHdoZW4oKWAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaGVzIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycy5cbiAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgYW5kIGBwYXNzVGhyb3VnaGAgbWV0aG9kcyB0aGF0XG4gKiAgIGNvbnRyb2wgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2VcbiAqICAgYHJlc3BvbmRgIG9yIGBwYXNzVGhyb3VnaGAgYWdhaW4gaW4gb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICovXG5cbi8qKlxuICogQG5nZG9jIG1ldGhvZFxuICogQG5hbWUgJGh0dHBCYWNrZW5kI3doZW5QT1NUXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQGRlc2NyaXB0aW9uXG4gKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgUE9TVCByZXF1ZXN0cy4gRm9yIG1vcmUgaW5mbyBzZWUgYHdoZW4oKWAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaGVzIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gKiBAcGFyYW0geyhzdHJpbmd8UmVnRXhwKT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkuXG4gKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycy5cbiAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgYW5kIGBwYXNzVGhyb3VnaGAgbWV0aG9kcyB0aGF0XG4gKiAgIGNvbnRyb2wgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2VcbiAqICAgYHJlc3BvbmRgIG9yIGBwYXNzVGhyb3VnaGAgYWdhaW4gaW4gb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICovXG5cbi8qKlxuICogQG5nZG9jIG1ldGhvZFxuICogQG5hbWUgJGh0dHBCYWNrZW5kI3doZW5QVVRcbiAqIEBtb2R1bGUgbmdNb2NrRTJFXG4gKiBAZGVzY3JpcHRpb25cbiAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBQVVQgcmVxdWVzdHMuICBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSB7KHN0cmluZ3xSZWdFeHApPX0gZGF0YSBIVFRQIHJlcXVlc3QgYm9keS5cbiAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2MgbWV0aG9kXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlblBBVENIXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQGRlc2NyaXB0aW9uXG4gKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgUEFUQ0ggcmVxdWVzdHMuICBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSB7KHN0cmluZ3xSZWdFeHApPX0gZGF0YSBIVFRQIHJlcXVlc3QgYm9keS5cbiAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2MgbWV0aG9kXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlbkpTT05QXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQGRlc2NyaXB0aW9uXG4gKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgSlNPTlAgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBhIHVybFxuICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKi9cbmFuZ3VsYXIubW9jay5lMmUgPSB7fTtcbmFuZ3VsYXIubW9jay5lMmUuJGh0dHBCYWNrZW5kRGVjb3JhdG9yID1cbiAgWyckcm9vdFNjb3BlJywgJyR0aW1lb3V0JywgJyRkZWxlZ2F0ZScsICckYnJvd3NlcicsIGNyZWF0ZUh0dHBCYWNrZW5kTW9ja107XG5cblxuLyoqXG4gKiBAbmdkb2MgdHlwZVxuICogQG5hbWUgJHJvb3RTY29wZS5TY29wZVxuICogQG1vZHVsZSBuZ01vY2tcbiAqIEBkZXNjcmlwdGlvblxuICoge0BsaW5rIG5nLiRyb290U2NvcGUuU2NvcGUgU2NvcGV9IHR5cGUgZGVjb3JhdGVkIHdpdGggaGVscGVyIG1ldGhvZHMgdXNlZnVsIGZvciB0ZXN0aW5nLiBUaGVzZVxuICogbWV0aG9kcyBhcmUgYXV0b21hdGljYWxseSBhdmFpbGFibGUgb24gYW55IHtAbGluayBuZy4kcm9vdFNjb3BlLlNjb3BlIFNjb3BlfSBpbnN0YW5jZSB3aGVuXG4gKiBgbmdNb2NrYCBtb2R1bGUgaXMgbG9hZGVkLlxuICpcbiAqIEluIGFkZGl0aW9uIHRvIGFsbCB0aGUgcmVndWxhciBgU2NvcGVgIG1ldGhvZHMsIHRoZSBmb2xsb3dpbmcgaGVscGVyIG1ldGhvZHMgYXJlIGF2YWlsYWJsZTpcbiAqL1xuYW5ndWxhci5tb2NrLiRSb290U2NvcGVEZWNvcmF0b3IgPSBbJyRkZWxlZ2F0ZScsIGZ1bmN0aW9uKCRkZWxlZ2F0ZSkge1xuXG4gIHZhciAkcm9vdFNjb3BlUHJvdG90eXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKCRkZWxlZ2F0ZSk7XG5cbiAgJHJvb3RTY29wZVByb3RvdHlwZS4kY291bnRDaGlsZFNjb3BlcyA9IGNvdW50Q2hpbGRTY29wZXM7XG4gICRyb290U2NvcGVQcm90b3R5cGUuJGNvdW50V2F0Y2hlcnMgPSBjb3VudFdhdGNoZXJzO1xuXG4gIHJldHVybiAkZGVsZWdhdGU7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJHJvb3RTY29wZS5TY29wZSMkY291bnRDaGlsZFNjb3Blc1xuICAgKiBAbW9kdWxlIG5nTW9ja1xuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQ291bnRzIGFsbCB0aGUgZGlyZWN0IGFuZCBpbmRpcmVjdCBjaGlsZCBzY29wZXMgb2YgdGhlIGN1cnJlbnQgc2NvcGUuXG4gICAqXG4gICAqIFRoZSBjdXJyZW50IHNjb3BlIGlzIGV4Y2x1ZGVkIGZyb20gdGhlIGNvdW50LiBUaGUgY291bnQgaW5jbHVkZXMgYWxsIGlzb2xhdGUgY2hpbGQgc2NvcGVzLlxuICAgKlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUb3RhbCBudW1iZXIgb2YgY2hpbGQgc2NvcGVzLlxuICAgKi9cbiAgZnVuY3Rpb24gY291bnRDaGlsZFNjb3BlcygpIHtcbiAgICAvLyBqc2hpbnQgdmFsaWR0aGlzOiB0cnVlXG4gICAgdmFyIGNvdW50ID0gMDsgLy8gZXhjbHVkZSB0aGUgY3VycmVudCBzY29wZVxuICAgIHZhciBwZW5kaW5nQ2hpbGRIZWFkcyA9IFt0aGlzLiQkY2hpbGRIZWFkXTtcbiAgICB2YXIgY3VycmVudFNjb3BlO1xuXG4gICAgd2hpbGUgKHBlbmRpbmdDaGlsZEhlYWRzLmxlbmd0aCkge1xuICAgICAgY3VycmVudFNjb3BlID0gcGVuZGluZ0NoaWxkSGVhZHMuc2hpZnQoKTtcblxuICAgICAgd2hpbGUgKGN1cnJlbnRTY29wZSkge1xuICAgICAgICBjb3VudCArPSAxO1xuICAgICAgICBwZW5kaW5nQ2hpbGRIZWFkcy5wdXNoKGN1cnJlbnRTY29wZS4kJGNoaWxkSGVhZCk7XG4gICAgICAgIGN1cnJlbnRTY29wZSA9IGN1cnJlbnRTY29wZS4kJG5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb3VudDtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJHJvb3RTY29wZS5TY29wZSMkY291bnRXYXRjaGVyc1xuICAgKiBAbW9kdWxlIG5nTW9ja1xuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQ291bnRzIGFsbCB0aGUgd2F0Y2hlcnMgb2YgZGlyZWN0IGFuZCBpbmRpcmVjdCBjaGlsZCBzY29wZXMgb2YgdGhlIGN1cnJlbnQgc2NvcGUuXG4gICAqXG4gICAqIFRoZSB3YXRjaGVycyBvZiB0aGUgY3VycmVudCBzY29wZSBhcmUgaW5jbHVkZWQgaW4gdGhlIGNvdW50IGFuZCBzbyBhcmUgYWxsIHRoZSB3YXRjaGVycyBvZlxuICAgKiBpc29sYXRlIGNoaWxkIHNjb3Blcy5cbiAgICpcbiAgICogQHJldHVybnMge251bWJlcn0gVG90YWwgbnVtYmVyIG9mIHdhdGNoZXJzLlxuICAgKi9cbiAgZnVuY3Rpb24gY291bnRXYXRjaGVycygpIHtcbiAgICAvLyBqc2hpbnQgdmFsaWR0aGlzOiB0cnVlXG4gICAgdmFyIGNvdW50ID0gdGhpcy4kJHdhdGNoZXJzID8gdGhpcy4kJHdhdGNoZXJzLmxlbmd0aCA6IDA7IC8vIGluY2x1ZGUgdGhlIGN1cnJlbnQgc2NvcGVcbiAgICB2YXIgcGVuZGluZ0NoaWxkSGVhZHMgPSBbdGhpcy4kJGNoaWxkSGVhZF07XG4gICAgdmFyIGN1cnJlbnRTY29wZTtcblxuICAgIHdoaWxlIChwZW5kaW5nQ2hpbGRIZWFkcy5sZW5ndGgpIHtcbiAgICAgIGN1cnJlbnRTY29wZSA9IHBlbmRpbmdDaGlsZEhlYWRzLnNoaWZ0KCk7XG5cbiAgICAgIHdoaWxlIChjdXJyZW50U2NvcGUpIHtcbiAgICAgICAgY291bnQgKz0gY3VycmVudFNjb3BlLiQkd2F0Y2hlcnMgPyBjdXJyZW50U2NvcGUuJCR3YXRjaGVycy5sZW5ndGggOiAwO1xuICAgICAgICBwZW5kaW5nQ2hpbGRIZWFkcy5wdXNoKGN1cnJlbnRTY29wZS4kJGNoaWxkSGVhZCk7XG4gICAgICAgIGN1cnJlbnRTY29wZSA9IGN1cnJlbnRTY29wZS4kJG5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb3VudDtcbiAgfVxufV07XG5cblxuaWYgKHdpbmRvdy5qYXNtaW5lIHx8IHdpbmRvdy5tb2NoYSkge1xuXG4gIHZhciBjdXJyZW50U3BlYyA9IG51bGwsXG4gICAgICBhbm5vdGF0ZWRGdW5jdGlvbnMgPSBbXSxcbiAgICAgIGlzU3BlY1J1bm5pbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhY3VycmVudFNwZWM7XG4gICAgICB9O1xuXG4gIGFuZ3VsYXIubW9jay4kJGFubm90YXRlID0gYW5ndWxhci5pbmplY3Rvci4kJGFubm90YXRlO1xuICBhbmd1bGFyLmluamVjdG9yLiQkYW5ub3RhdGUgPSBmdW5jdGlvbihmbikge1xuICAgIGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicgJiYgIWZuLiRpbmplY3QpIHtcbiAgICAgIGFubm90YXRlZEZ1bmN0aW9ucy5wdXNoKGZuKTtcbiAgICB9XG4gICAgcmV0dXJuIGFuZ3VsYXIubW9jay4kJGFubm90YXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG5cblxuICAod2luZG93LmJlZm9yZUVhY2ggfHwgd2luZG93LnNldHVwKShmdW5jdGlvbigpIHtcbiAgICBhbm5vdGF0ZWRGdW5jdGlvbnMgPSBbXTtcbiAgICBjdXJyZW50U3BlYyA9IHRoaXM7XG4gIH0pO1xuXG4gICh3aW5kb3cuYWZ0ZXJFYWNoIHx8IHdpbmRvdy50ZWFyZG93bikoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGluamVjdG9yID0gY3VycmVudFNwZWMuJGluamVjdG9yO1xuXG4gICAgYW5ub3RhdGVkRnVuY3Rpb25zLmZvckVhY2goZnVuY3Rpb24oZm4pIHtcbiAgICAgIGRlbGV0ZSBmbi4kaW5qZWN0O1xuICAgIH0pO1xuXG4gICAgYW5ndWxhci5mb3JFYWNoKGN1cnJlbnRTcGVjLiRtb2R1bGVzLCBmdW5jdGlvbihtb2R1bGUpIHtcbiAgICAgIGlmIChtb2R1bGUgJiYgbW9kdWxlLiQkaGFzaEtleSkge1xuICAgICAgICBtb2R1bGUuJCRoYXNoS2V5ID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY3VycmVudFNwZWMuJGluamVjdG9yID0gbnVsbDtcbiAgICBjdXJyZW50U3BlYy4kbW9kdWxlcyA9IG51bGw7XG4gICAgY3VycmVudFNwZWMgPSBudWxsO1xuXG4gICAgaWYgKGluamVjdG9yKSB7XG4gICAgICBpbmplY3Rvci5nZXQoJyRyb290RWxlbWVudCcpLm9mZigpO1xuICAgIH1cblxuICAgIC8vIGNsZWFuIHVwIGpxdWVyeSdzIGZyYWdtZW50IGNhY2hlXG4gICAgYW5ndWxhci5mb3JFYWNoKGFuZ3VsYXIuZWxlbWVudC5mcmFnbWVudHMsIGZ1bmN0aW9uKHZhbCwga2V5KSB7XG4gICAgICBkZWxldGUgYW5ndWxhci5lbGVtZW50LmZyYWdtZW50c1trZXldO1xuICAgIH0pO1xuXG4gICAgTW9ja1hoci4kJGxhc3RJbnN0YW5jZSA9IG51bGw7XG5cbiAgICBhbmd1bGFyLmZvckVhY2goYW5ndWxhci5jYWxsYmFja3MsIGZ1bmN0aW9uKHZhbCwga2V5KSB7XG4gICAgICBkZWxldGUgYW5ndWxhci5jYWxsYmFja3Nba2V5XTtcbiAgICB9KTtcbiAgICBhbmd1bGFyLmNhbGxiYWNrcy5jb3VudGVyID0gMDtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgKiBAbmFtZSBhbmd1bGFyLm1vY2subW9kdWxlXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKlxuICAgKiAqTk9URSo6IFRoaXMgZnVuY3Rpb24gaXMgYWxzbyBwdWJsaXNoZWQgb24gd2luZG93IGZvciBlYXN5IGFjY2Vzcy48YnI+XG4gICAqICpOT1RFKjogVGhpcyBmdW5jdGlvbiBpcyBkZWNsYXJlZCBPTkxZIFdIRU4gcnVubmluZyB0ZXN0cyB3aXRoIGphc21pbmUgb3IgbW9jaGFcbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbiByZWdpc3RlcnMgYSBtb2R1bGUgY29uZmlndXJhdGlvbiBjb2RlLiBJdCBjb2xsZWN0cyB0aGUgY29uZmlndXJhdGlvbiBpbmZvcm1hdGlvblxuICAgKiB3aGljaCB3aWxsIGJlIHVzZWQgd2hlbiB0aGUgaW5qZWN0b3IgaXMgY3JlYXRlZCBieSB7QGxpbmsgYW5ndWxhci5tb2NrLmluamVjdCBpbmplY3R9LlxuICAgKlxuICAgKiBTZWUge0BsaW5rIGFuZ3VsYXIubW9jay5pbmplY3QgaW5qZWN0fSBmb3IgdXNhZ2UgZXhhbXBsZVxuICAgKlxuICAgKiBAcGFyYW0gey4uLihzdHJpbmd8RnVuY3Rpb258T2JqZWN0KX0gZm5zIGFueSBudW1iZXIgb2YgbW9kdWxlcyB3aGljaCBhcmUgcmVwcmVzZW50ZWQgYXMgc3RyaW5nXG4gICAqICAgICAgICBhbGlhc2VzIG9yIGFzIGFub255bW91cyBtb2R1bGUgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb25zLiBUaGUgbW9kdWxlcyBhcmUgdXNlZCB0b1xuICAgKiAgICAgICAgY29uZmlndXJlIHRoZSBpbmplY3Rvci4gVGhlICduZycgYW5kICduZ01vY2snIG1vZHVsZXMgYXJlIGF1dG9tYXRpY2FsbHkgbG9hZGVkLiBJZiBhblxuICAgKiAgICAgICAgb2JqZWN0IGxpdGVyYWwgaXMgcGFzc2VkIHRoZXkgd2lsbCBiZSByZWdpc3RlcmVkIGFzIHZhbHVlcyBpbiB0aGUgbW9kdWxlLCB0aGUga2V5IGJlaW5nXG4gICAqICAgICAgICB0aGUgbW9kdWxlIG5hbWUgYW5kIHRoZSB2YWx1ZSBiZWluZyB3aGF0IGlzIHJldHVybmVkLlxuICAgKi9cbiAgd2luZG93Lm1vZHVsZSA9IGFuZ3VsYXIubW9jay5tb2R1bGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbW9kdWxlRm5zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICByZXR1cm4gaXNTcGVjUnVubmluZygpID8gd29ya0ZuKCkgOiB3b3JrRm47XG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgZnVuY3Rpb24gd29ya0ZuKCkge1xuICAgICAgaWYgKGN1cnJlbnRTcGVjLiRpbmplY3Rvcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdG9yIGFscmVhZHkgY3JlYXRlZCwgY2FuIG5vdCByZWdpc3RlciBhIG1vZHVsZSEnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBtb2R1bGVzID0gY3VycmVudFNwZWMuJG1vZHVsZXMgfHwgKGN1cnJlbnRTcGVjLiRtb2R1bGVzID0gW10pO1xuICAgICAgICBhbmd1bGFyLmZvckVhY2gobW9kdWxlRm5zLCBmdW5jdGlvbihtb2R1bGUpIHtcbiAgICAgICAgICBpZiAoYW5ndWxhci5pc09iamVjdChtb2R1bGUpICYmICFhbmd1bGFyLmlzQXJyYXkobW9kdWxlKSkge1xuICAgICAgICAgICAgbW9kdWxlcy5wdXNoKGZ1bmN0aW9uKCRwcm92aWRlKSB7XG4gICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChtb2R1bGUsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS52YWx1ZShrZXksIHZhbHVlKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlcy5wdXNoKG1vZHVsZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgKiBAbmFtZSBhbmd1bGFyLm1vY2suaW5qZWN0XG4gICAqIEBkZXNjcmlwdGlvblxuICAgKlxuICAgKiAqTk9URSo6IFRoaXMgZnVuY3Rpb24gaXMgYWxzbyBwdWJsaXNoZWQgb24gd2luZG93IGZvciBlYXN5IGFjY2Vzcy48YnI+XG4gICAqICpOT1RFKjogVGhpcyBmdW5jdGlvbiBpcyBkZWNsYXJlZCBPTkxZIFdIRU4gcnVubmluZyB0ZXN0cyB3aXRoIGphc21pbmUgb3IgbW9jaGFcbiAgICpcbiAgICogVGhlIGluamVjdCBmdW5jdGlvbiB3cmFwcyBhIGZ1bmN0aW9uIGludG8gYW4gaW5qZWN0YWJsZSBmdW5jdGlvbi4gVGhlIGluamVjdCgpIGNyZWF0ZXMgbmV3XG4gICAqIGluc3RhbmNlIG9mIHtAbGluayBhdXRvLiRpbmplY3RvciAkaW5qZWN0b3J9IHBlciB0ZXN0LCB3aGljaCBpcyB0aGVuIHVzZWQgZm9yXG4gICAqIHJlc29sdmluZyByZWZlcmVuY2VzLlxuICAgKlxuICAgKlxuICAgKiAjIyBSZXNvbHZpbmcgUmVmZXJlbmNlcyAoVW5kZXJzY29yZSBXcmFwcGluZylcbiAgICogT2Z0ZW4sIHdlIHdvdWxkIGxpa2UgdG8gaW5qZWN0IGEgcmVmZXJlbmNlIG9uY2UsIGluIGEgYGJlZm9yZUVhY2goKWAgYmxvY2sgYW5kIHJldXNlIHRoaXNcbiAgICogaW4gbXVsdGlwbGUgYGl0KClgIGNsYXVzZXMuIFRvIGJlIGFibGUgdG8gZG8gdGhpcyB3ZSBtdXN0IGFzc2lnbiB0aGUgcmVmZXJlbmNlIHRvIGEgdmFyaWFibGVcbiAgICogdGhhdCBpcyBkZWNsYXJlZCBpbiB0aGUgc2NvcGUgb2YgdGhlIGBkZXNjcmliZSgpYCBibG9jay4gU2luY2Ugd2Ugd291bGQsIG1vc3QgbGlrZWx5LCB3YW50XG4gICAqIHRoZSB2YXJpYWJsZSB0byBoYXZlIHRoZSBzYW1lIG5hbWUgb2YgdGhlIHJlZmVyZW5jZSB3ZSBoYXZlIGEgcHJvYmxlbSwgc2luY2UgdGhlIHBhcmFtZXRlclxuICAgKiB0byB0aGUgYGluamVjdCgpYCBmdW5jdGlvbiB3b3VsZCBoaWRlIHRoZSBvdXRlciB2YXJpYWJsZS5cbiAgICpcbiAgICogVG8gaGVscCB3aXRoIHRoaXMsIHRoZSBpbmplY3RlZCBwYXJhbWV0ZXJzIGNhbiwgb3B0aW9uYWxseSwgYmUgZW5jbG9zZWQgd2l0aCB1bmRlcnNjb3Jlcy5cbiAgICogVGhlc2UgYXJlIGlnbm9yZWQgYnkgdGhlIGluamVjdG9yIHdoZW4gdGhlIHJlZmVyZW5jZSBuYW1lIGlzIHJlc29sdmVkLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgdGhlIHBhcmFtZXRlciBgX215U2VydmljZV9gIHdvdWxkIGJlIHJlc29sdmVkIGFzIHRoZSByZWZlcmVuY2UgYG15U2VydmljZWAuXG4gICAqIFNpbmNlIGl0IGlzIGF2YWlsYWJsZSBpbiB0aGUgZnVuY3Rpb24gYm9keSBhcyBfbXlTZXJ2aWNlXywgd2UgY2FuIHRoZW4gYXNzaWduIGl0IHRvIGEgdmFyaWFibGVcbiAgICogZGVmaW5lZCBpbiBhbiBvdXRlciBzY29wZS5cbiAgICpcbiAgICogYGBgXG4gICAqIC8vIERlZmluZWQgb3V0IHJlZmVyZW5jZSB2YXJpYWJsZSBvdXRzaWRlXG4gICAqIHZhciBteVNlcnZpY2U7XG4gICAqXG4gICAqIC8vIFdyYXAgdGhlIHBhcmFtZXRlciBpbiB1bmRlcnNjb3Jlc1xuICAgKiBiZWZvcmVFYWNoKCBpbmplY3QoIGZ1bmN0aW9uKF9teVNlcnZpY2VfKXtcbiAgICogICBteVNlcnZpY2UgPSBfbXlTZXJ2aWNlXztcbiAgICogfSkpO1xuICAgKlxuICAgKiAvLyBVc2UgbXlTZXJ2aWNlIGluIGEgc2VyaWVzIG9mIHRlc3RzLlxuICAgKiBpdCgnbWFrZXMgdXNlIG9mIG15U2VydmljZScsIGZ1bmN0aW9uKCkge1xuICAgKiAgIG15U2VydmljZS5kb1N0dWZmKCk7XG4gICAqIH0pO1xuICAgKlxuICAgKiBgYGBcbiAgICpcbiAgICogU2VlIGFsc28ge0BsaW5rIGFuZ3VsYXIubW9jay5tb2R1bGUgYW5ndWxhci5tb2NrLm1vZHVsZX1cbiAgICpcbiAgICogIyMgRXhhbXBsZVxuICAgKiBFeGFtcGxlIG9mIHdoYXQgYSB0eXBpY2FsIGphc21pbmUgdGVzdHMgbG9va3MgbGlrZSB3aXRoIHRoZSBpbmplY3QgbWV0aG9kLlxuICAgKiBgYGBqc1xuICAgKlxuICAgKiAgIGFuZ3VsYXIubW9kdWxlKCdteUFwcGxpY2F0aW9uTW9kdWxlJywgW10pXG4gICAqICAgICAgIC52YWx1ZSgnbW9kZScsICdhcHAnKVxuICAgKiAgICAgICAudmFsdWUoJ3ZlcnNpb24nLCAndjEuMC4xJyk7XG4gICAqXG4gICAqXG4gICAqICAgZGVzY3JpYmUoJ015QXBwJywgZnVuY3Rpb24oKSB7XG4gICAqXG4gICAqICAgICAvLyBZb3UgbmVlZCB0byBsb2FkIG1vZHVsZXMgdGhhdCB5b3Ugd2FudCB0byB0ZXN0LFxuICAgKiAgICAgLy8gaXQgbG9hZHMgb25seSB0aGUgXCJuZ1wiIG1vZHVsZSBieSBkZWZhdWx0LlxuICAgKiAgICAgYmVmb3JlRWFjaChtb2R1bGUoJ215QXBwbGljYXRpb25Nb2R1bGUnKSk7XG4gICAqXG4gICAqXG4gICAqICAgICAvLyBpbmplY3QoKSBpcyB1c2VkIHRvIGluamVjdCBhcmd1bWVudHMgb2YgYWxsIGdpdmVuIGZ1bmN0aW9uc1xuICAgKiAgICAgaXQoJ3Nob3VsZCBwcm92aWRlIGEgdmVyc2lvbicsIGluamVjdChmdW5jdGlvbihtb2RlLCB2ZXJzaW9uKSB7XG4gICAqICAgICAgIGV4cGVjdCh2ZXJzaW9uKS50b0VxdWFsKCd2MS4wLjEnKTtcbiAgICogICAgICAgZXhwZWN0KG1vZGUpLnRvRXF1YWwoJ2FwcCcpO1xuICAgKiAgICAgfSkpO1xuICAgKlxuICAgKlxuICAgKiAgICAgLy8gVGhlIGluamVjdCBhbmQgbW9kdWxlIG1ldGhvZCBjYW4gYWxzbyBiZSB1c2VkIGluc2lkZSBvZiB0aGUgaXQgb3IgYmVmb3JlRWFjaFxuICAgKiAgICAgaXQoJ3Nob3VsZCBvdmVycmlkZSBhIHZlcnNpb24gYW5kIHRlc3QgdGhlIG5ldyB2ZXJzaW9uIGlzIGluamVjdGVkJywgZnVuY3Rpb24oKSB7XG4gICAqICAgICAgIC8vIG1vZHVsZSgpIHRha2VzIGZ1bmN0aW9ucyBvciBzdHJpbmdzIChtb2R1bGUgYWxpYXNlcylcbiAgICogICAgICAgbW9kdWxlKGZ1bmN0aW9uKCRwcm92aWRlKSB7XG4gICAqICAgICAgICAgJHByb3ZpZGUudmFsdWUoJ3ZlcnNpb24nLCAnb3ZlcnJpZGRlbicpOyAvLyBvdmVycmlkZSB2ZXJzaW9uIGhlcmVcbiAgICogICAgICAgfSk7XG4gICAqXG4gICAqICAgICAgIGluamVjdChmdW5jdGlvbih2ZXJzaW9uKSB7XG4gICAqICAgICAgICAgZXhwZWN0KHZlcnNpb24pLnRvRXF1YWwoJ292ZXJyaWRkZW4nKTtcbiAgICogICAgICAgfSk7XG4gICAqICAgICB9KTtcbiAgICogICB9KTtcbiAgICpcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IGZucyBhbnkgbnVtYmVyIG9mIGZ1bmN0aW9ucyB3aGljaCB3aWxsIGJlIGluamVjdGVkIHVzaW5nIHRoZSBpbmplY3Rvci5cbiAgICovXG5cblxuXG4gIHZhciBFcnJvckFkZGluZ0RlY2xhcmF0aW9uTG9jYXRpb25TdGFjayA9IGZ1bmN0aW9uKGUsIGVycm9yRm9yU3RhY2spIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBlLm1lc3NhZ2U7XG4gICAgdGhpcy5uYW1lID0gZS5uYW1lO1xuICAgIGlmIChlLmxpbmUpIHRoaXMubGluZSA9IGUubGluZTtcbiAgICBpZiAoZS5zb3VyY2VJZCkgdGhpcy5zb3VyY2VJZCA9IGUuc291cmNlSWQ7XG4gICAgaWYgKGUuc3RhY2sgJiYgZXJyb3JGb3JTdGFjaylcbiAgICAgIHRoaXMuc3RhY2sgPSBlLnN0YWNrICsgJ1xcbicgKyBlcnJvckZvclN0YWNrLnN0YWNrO1xuICAgIGlmIChlLnN0YWNrQXJyYXkpIHRoaXMuc3RhY2tBcnJheSA9IGUuc3RhY2tBcnJheTtcbiAgfTtcbiAgRXJyb3JBZGRpbmdEZWNsYXJhdGlvbkxvY2F0aW9uU3RhY2sucHJvdG90eXBlLnRvU3RyaW5nID0gRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4gIHdpbmRvdy5pbmplY3QgPSBhbmd1bGFyLm1vY2suaW5qZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGJsb2NrRm5zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICB2YXIgZXJyb3JGb3JTdGFjayA9IG5ldyBFcnJvcignRGVjbGFyYXRpb24gTG9jYXRpb24nKTtcbiAgICByZXR1cm4gaXNTcGVjUnVubmluZygpID8gd29ya0ZuLmNhbGwoY3VycmVudFNwZWMpIDogd29ya0ZuO1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGZ1bmN0aW9uIHdvcmtGbigpIHtcbiAgICAgIHZhciBtb2R1bGVzID0gY3VycmVudFNwZWMuJG1vZHVsZXMgfHwgW107XG4gICAgICB2YXIgc3RyaWN0RGkgPSAhIWN1cnJlbnRTcGVjLiRpbmplY3RvclN0cmljdDtcbiAgICAgIG1vZHVsZXMudW5zaGlmdCgnbmdNb2NrJyk7XG4gICAgICBtb2R1bGVzLnVuc2hpZnQoJ25nJyk7XG4gICAgICB2YXIgaW5qZWN0b3IgPSBjdXJyZW50U3BlYy4kaW5qZWN0b3I7XG4gICAgICBpZiAoIWluamVjdG9yKSB7XG4gICAgICAgIGlmIChzdHJpY3REaSkge1xuICAgICAgICAgIC8vIElmIHN0cmljdERpIGlzIGVuYWJsZWQsIGFubm90YXRlIHRoZSBwcm92aWRlckluamVjdG9yIGJsb2Nrc1xuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChtb2R1bGVzLCBmdW5jdGlvbihtb2R1bGVGbikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGVGbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgIGFuZ3VsYXIuaW5qZWN0b3IuJCRhbm5vdGF0ZShtb2R1bGVGbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaW5qZWN0b3IgPSBjdXJyZW50U3BlYy4kaW5qZWN0b3IgPSBhbmd1bGFyLmluamVjdG9yKG1vZHVsZXMsIHN0cmljdERpKTtcbiAgICAgICAgY3VycmVudFNwZWMuJGluamVjdG9yU3RyaWN0ID0gc3RyaWN0RGk7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBibG9ja0Zucy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgIGlmIChjdXJyZW50U3BlYy4kaW5qZWN0b3JTdHJpY3QpIHtcbiAgICAgICAgICAvLyBJZiB0aGUgaW5qZWN0b3IgaXMgc3RyaWN0IC8gc3RyaWN0RGksIGFuZCB0aGUgc3BlYyB3YW50cyB0byBpbmplY3QgdXNpbmcgYXV0b21hdGljXG4gICAgICAgICAgLy8gYW5ub3RhdGlvbiwgdGhlbiBhbm5vdGF0ZSB0aGUgZnVuY3Rpb24gaGVyZS5cbiAgICAgICAgICBpbmplY3Rvci5hbm5vdGF0ZShibG9ja0Zuc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvKiBqc2hpbnQgLVcwNDAgKi8vKiBKYXNtaW5lIGV4cGxpY2l0bHkgcHJvdmlkZXMgYSBgdGhpc2Agb2JqZWN0IHdoZW4gY2FsbGluZyBmdW5jdGlvbnMgKi9cbiAgICAgICAgICBpbmplY3Rvci5pbnZva2UoYmxvY2tGbnNbaV0gfHwgYW5ndWxhci5ub29wLCB0aGlzKTtcbiAgICAgICAgICAvKiBqc2hpbnQgK1cwNDAgKi9cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGlmIChlLnN0YWNrICYmIGVycm9yRm9yU3RhY2spIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvckFkZGluZ0RlY2xhcmF0aW9uTG9jYXRpb25TdGFjayhlLCBlcnJvckZvclN0YWNrKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBlcnJvckZvclN0YWNrID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuXG4gIGFuZ3VsYXIubW9jay5pbmplY3Quc3RyaWN0RGkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhbHVlID0gYXJndW1lbnRzLmxlbmd0aCA/ICEhdmFsdWUgOiB0cnVlO1xuICAgIHJldHVybiBpc1NwZWNSdW5uaW5nKCkgPyB3b3JrRm4oKSA6IHdvcmtGbjtcblxuICAgIGZ1bmN0aW9uIHdvcmtGbigpIHtcbiAgICAgIGlmICh2YWx1ZSAhPT0gY3VycmVudFNwZWMuJGluamVjdG9yU3RyaWN0KSB7XG4gICAgICAgIGlmIChjdXJyZW50U3BlYy4kaW5qZWN0b3IpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdG9yIGFscmVhZHkgY3JlYXRlZCwgY2FuIG5vdCBtb2RpZnkgc3RyaWN0IGFubm90YXRpb25zJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudFNwZWMuJGluamVjdG9yU3RyaWN0ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cblxufSkod2luZG93LCB3aW5kb3cuYW5ndWxhcik7XG4iLCIvKlxyXG5cclxuIFNvZnR3YXJlIExpY2Vuc2UgQWdyZWVtZW50IChCU0QgTGljZW5zZSlcclxuIGh0dHA6Ly90YWZmeWRiLmNvbVxyXG4gQ29weXJpZ2h0IChjKVxyXG4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuXHJcblxyXG4gUmVkaXN0cmlidXRpb24gYW5kIHVzZSBvZiB0aGlzIHNvZnR3YXJlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXQgbW9kaWZpY2F0aW9uLCBhcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb24gaXMgbWV0OlxyXG5cclxuICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxyXG5cclxuIFRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiIEFORCBBTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFIERJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFQgT1dORVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1RcclxuIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTiBBTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVCAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJUyBTT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS5cclxuXHJcbiAqL1xyXG5cclxuLypqc2xpbnQgICAgICAgIGJyb3dzZXIgOiB0cnVlLCBjb250aW51ZSA6IHRydWUsXHJcbiBkZXZlbCAgOiB0cnVlLCBpbmRlbnQgIDogMiwgICAgbWF4ZXJyICAgOiA1MDAsXHJcbiBuZXdjYXAgOiB0cnVlLCBub21lbiAgIDogdHJ1ZSwgcGx1c3BsdXMgOiB0cnVlLFxyXG4gcmVnZXhwIDogdHJ1ZSwgc2xvcHB5ICA6IHRydWUsIHZhcnMgICAgIDogZmFsc2UsXHJcbiB3aGl0ZSAgOiB0cnVlXHJcbiovXHJcblxyXG4vLyBCVUlMRCAxOTNkNDhkLCBtb2RpZmllZCBieSBtbWlrb3dza2kgdG8gcGFzcyBqc2xpbnRcclxuXHJcbi8vIFNldHVwIFRBRkZZIG5hbWUgc3BhY2UgdG8gcmV0dXJuIGFuIG9iamVjdCB3aXRoIG1ldGhvZHNcclxudmFyIFRBRkZZLCBleHBvcnRzLCBUO1xyXG4oZnVuY3Rpb24gKCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuICB2YXJcclxuICAgIHR5cGVMaXN0LCAgICAgbWFrZVRlc3QsICAgICBpZHgsICAgIHR5cGVLZXksXHJcbiAgICB2ZXJzaW9uLCAgICAgIFRDLCAgICAgICAgICAgaWRwYWQsICBjbWF4LFxyXG4gICAgQVBJLCAgICAgICAgICBwcm90ZWN0SlNPTiwgIGVhY2gsICAgZWFjaGluLFxyXG4gICAgaXNJbmRleGFibGUsICByZXR1cm5GaWx0ZXIsIHJ1bkZpbHRlcnMsXHJcbiAgICBudW1jaGFyc3BsaXQsIG9yZGVyQnlDb2wsICAgcnVuLCAgICBpbnRlcnNlY3Rpb24sXHJcbiAgICBmaWx0ZXIsICAgICAgIG1ha2VDaWQsICAgICAgc2FmZUZvckpzb24sXHJcbiAgICBpc1JlZ2V4cFxyXG4gICAgO1xyXG5cclxuXHJcbiAgaWYgKCAhIFRBRkZZICl7XHJcbiAgICAvLyBUQyA9IENvdW50ZXIgZm9yIFRhZmZ5IERCcyBvbiBwYWdlLCB1c2VkIGZvciB1bmlxdWUgSURzXHJcbiAgICAvLyBjbWF4ID0gc2l6ZSBvZiBjaGFybnVtYXJyYXkgY29udmVyc2lvbiBjYWNoZVxyXG4gICAgLy8gaWRwYWQgPSB6ZXJvcyB0byBwYWQgcmVjb3JkIElEcyB3aXRoXHJcbiAgICB2ZXJzaW9uID0gJzIuNyc7XHJcbiAgICBUQyAgICAgID0gMTtcclxuICAgIGlkcGFkICAgPSAnMDAwMDAwJztcclxuICAgIGNtYXggICAgPSAxMDAwO1xyXG4gICAgQVBJICAgICA9IHt9O1xyXG5cclxuICAgIHByb3RlY3RKU09OID0gZnVuY3Rpb24gKCB0ICkge1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBUYWtlczogYSB2YXJpYWJsZVxyXG4gICAgICAvLyAqIFJldHVybnM6IHRoZSB2YXJpYWJsZSBpZiBvYmplY3QvYXJyYXkgb3IgdGhlIHBhcnNlZCB2YXJpYWJsZSBpZiBKU09OXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAgXHJcbiAgICAgIGlmICggVEFGRlkuaXNBcnJheSggdCApIHx8IFRBRkZZLmlzT2JqZWN0KCB0ICkgKXtcclxuICAgICAgICByZXR1cm4gdDtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSggdCApO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICAvLyBncmFjZWZ1bGx5IHN0b2xlbiBmcm9tIHVuZGVyc2NvcmUuanNcclxuICAgIGludGVyc2VjdGlvbiA9IGZ1bmN0aW9uKGFycmF5MSwgYXJyYXkyKSB7XHJcbiAgICAgICAgcmV0dXJuIGZpbHRlcihhcnJheTEsIGZ1bmN0aW9uKGl0ZW0pIHtcclxuICAgICAgICAgIHJldHVybiBhcnJheTIuaW5kZXhPZihpdGVtKSA+PSAwO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBncmFjZWZ1bGx5IHN0b2xlbiBmcm9tIHVuZGVyc2NvcmUuanNcclxuICAgIGZpbHRlciA9IGZ1bmN0aW9uKG9iaiwgaXRlcmF0b3IsIGNvbnRleHQpIHtcclxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgIGlmIChvYmogPT0gbnVsbCkgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICAgICAgaWYgKEFycmF5LnByb3RvdHlwZS5maWx0ZXIgJiYgb2JqLmZpbHRlciA9PT0gQXJyYXkucHJvdG90eXBlLmZpbHRlcikgcmV0dXJuIG9iai5maWx0ZXIoaXRlcmF0b3IsIGNvbnRleHQpO1xyXG4gICAgICAgIGVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIGxpc3QpIHtcclxuICAgICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQsIHZhbHVlLCBpbmRleCwgbGlzdCkpIHJlc3VsdHNbcmVzdWx0cy5sZW5ndGhdID0gdmFsdWU7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBpc1JlZ2V4cCA9IGZ1bmN0aW9uKGFPYmopIHtcclxuICAgICAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFPYmopPT09J1tvYmplY3QgUmVnRXhwXSc7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHNhZmVGb3JKc29uID0gZnVuY3Rpb24oYU9iaikge1xyXG4gICAgICAgIHZhciBteVJlc3VsdCA9IFQuaXNBcnJheShhT2JqKSA/IFtdIDogVC5pc09iamVjdChhT2JqKSA/IHt9IDogbnVsbDtcclxuICAgICAgICBpZihhT2JqPT09bnVsbCkgcmV0dXJuIGFPYmo7XHJcbiAgICAgICAgZm9yKHZhciBpIGluIGFPYmopIHtcclxuICAgICAgICAgICAgbXlSZXN1bHRbaV0gID0gaXNSZWdleHAoYU9ialtpXSkgPyBhT2JqW2ldLnRvU3RyaW5nKCkgOiBULmlzQXJyYXkoYU9ialtpXSkgfHwgVC5pc09iamVjdChhT2JqW2ldKSA/IHNhZmVGb3JKc29uKGFPYmpbaV0pIDogYU9ialtpXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG15UmVzdWx0O1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBtYWtlQ2lkID0gZnVuY3Rpb24oYUNvbnRleHQpIHtcclxuICAgICAgICB2YXIgbXlDaWQgPSBKU09OLnN0cmluZ2lmeShhQ29udGV4dCk7XHJcbiAgICAgICAgaWYobXlDaWQubWF0Y2goL3JlZ2V4Lyk9PT1udWxsKSByZXR1cm4gbXlDaWQ7XHJcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHNhZmVGb3JKc29uKGFDb250ZXh0KSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGVhY2ggPSBmdW5jdGlvbiAoIGEsIGZ1biwgdSApIHtcclxuICAgICAgdmFyIHIsIGksIHgsIHk7XHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgLy8gKlxyXG4gICAgICAvLyAqIFRha2VzOlxyXG4gICAgICAvLyAqIGEgPSBhbiBvYmplY3QvdmFsdWUgb3IgYW4gYXJyYXkgb2Ygb2JqZWN0cy92YWx1ZXNcclxuICAgICAgLy8gKiBmID0gYSBmdW5jdGlvblxyXG4gICAgICAvLyAqIHUgPSBvcHRpb25hbCBmbGFnIHRvIGRlc2NyaWJlIGhvdyB0byBoYW5kbGUgdW5kZWZpbmVkIHZhbHVlc1xyXG4gICAgICAvLyAgIGluIGFycmF5IG9mIHZhbHVlcy4gVHJ1ZTogcGFzcyB0aGVtIHRvIHRoZSBmdW5jdGlvbnMsXHJcbiAgICAgIC8vICAgRmFsc2U6IHNraXAuIERlZmF1bHQgRmFsc2U7XHJcbiAgICAgIC8vICogUHVycG9zZTogVXNlZCB0byBsb29wIG92ZXIgYXJyYXlzXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAgXHJcbiAgICAgIGlmICggYSAmJiAoKFQuaXNBcnJheSggYSApICYmIGEubGVuZ3RoID09PSAxKSB8fCAoIVQuaXNBcnJheSggYSApKSkgKXtcclxuICAgICAgICBmdW4oIChULmlzQXJyYXkoIGEgKSkgPyBhWzBdIDogYSwgMCApO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGZvciAoIHIsIGksIHggPSAwLCBhID0gKFQuaXNBcnJheSggYSApKSA/IGEgOiBbYV0sIHkgPSBhLmxlbmd0aDtcclxuICAgICAgICAgICAgICB4IDwgeTsgeCsrIClcclxuICAgICAgICB7XHJcbiAgICAgICAgICBpID0gYVt4XTtcclxuICAgICAgICAgIGlmICggIVQuaXNVbmRlZmluZWQoIGkgKSB8fCAodSB8fCBmYWxzZSkgKXtcclxuICAgICAgICAgICAgciA9IGZ1biggaSwgeCApO1xyXG4gICAgICAgICAgICBpZiAoIHIgPT09IFQuRVhJVCApe1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBlYWNoaW4gPSBmdW5jdGlvbiAoIG8sIGZ1biApIHtcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAvLyAqXHJcbiAgICAgIC8vICogVGFrZXM6XHJcbiAgICAgIC8vICogbyA9IGFuIG9iamVjdFxyXG4gICAgICAvLyAqIGYgPSBhIGZ1bmN0aW9uXHJcbiAgICAgIC8vICogUHVycG9zZTogVXNlZCB0byBsb29wIG92ZXIgb2JqZWN0c1xyXG4gICAgICAvLyAqXHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogIFxyXG4gICAgICB2YXIgeCA9IDAsIHIsIGk7XHJcblxyXG4gICAgICBmb3IgKCBpIGluIG8gKXtcclxuICAgICAgICBpZiAoIG8uaGFzT3duUHJvcGVydHkoIGkgKSApe1xyXG4gICAgICAgICAgciA9IGZ1biggb1tpXSwgaSwgeCsrICk7XHJcbiAgICAgICAgICBpZiAoIHIgPT09IFQuRVhJVCApe1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIEFQSS5leHRlbmQgPSBmdW5jdGlvbiAoIG0sIGYgKSB7XHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgLy8gKlxyXG4gICAgICAvLyAqIFRha2VzOiBtZXRob2QgbmFtZSwgZnVuY3Rpb25cclxuICAgICAgLy8gKiBQdXJwb3NlOiBBZGQgYSBjdXN0b20gbWV0aG9kIHRvIHRoZSBBUElcclxuICAgICAgLy8gKlxyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICBcclxuICAgICAgQVBJW21dID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBmLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcclxuICAgICAgfTtcclxuICAgIH07XHJcblxyXG4gICAgaXNJbmRleGFibGUgPSBmdW5jdGlvbiAoIGYgKSB7XHJcbiAgICAgIHZhciBpO1xyXG4gICAgICAvLyBDaGVjayB0byBzZWUgaWYgcmVjb3JkIElEXHJcbiAgICAgIGlmICggVC5pc1N0cmluZyggZiApICYmIC9bdF1bMC05XSpbcl1bMC05XSovaS50ZXN0KCBmICkgKXtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICAvLyBDaGVjayB0byBzZWUgaWYgcmVjb3JkXHJcbiAgICAgIGlmICggVC5pc09iamVjdCggZiApICYmIGYuX19faWQgJiYgZi5fX19zICl7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiBhcnJheSBvZiBpbmRleGVzXHJcbiAgICAgIGlmICggVC5pc0FycmF5KCBmICkgKXtcclxuICAgICAgICBpID0gdHJ1ZTtcclxuICAgICAgICBlYWNoKCBmLCBmdW5jdGlvbiAoIHIgKSB7XHJcbiAgICAgICAgICBpZiAoICFpc0luZGV4YWJsZSggciApICl7XHJcbiAgICAgICAgICAgIGkgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBUQUZGWS5FWElUO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG5cclxuICAgIHJ1bkZpbHRlcnMgPSBmdW5jdGlvbiAoIHIsIGZpbHRlciApIHtcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAvLyAqXHJcbiAgICAgIC8vICogVGFrZXM6IHRha2VzIGEgcmVjb3JkIGFuZCBhIGNvbGxlY3Rpb24gb2YgZmlsdGVyc1xyXG4gICAgICAvLyAqIFJldHVybnM6IHRydWUgaWYgdGhlIHJlY29yZCBtYXRjaGVzLCBmYWxzZSBvdGhlcndpc2VcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICB2YXIgbWF0Y2ggPSB0cnVlO1xyXG5cclxuXHJcbiAgICAgIGVhY2goIGZpbHRlciwgZnVuY3Rpb24gKCBtZiApIHtcclxuICAgICAgICBzd2l0Y2ggKCBULnR5cGVPZiggbWYgKSApe1xyXG4gICAgICAgICAgY2FzZSAnZnVuY3Rpb24nOlxyXG4gICAgICAgICAgICAvLyBydW4gZnVuY3Rpb25cclxuICAgICAgICAgICAgaWYgKCAhbWYuYXBwbHkoIHIgKSApe1xyXG4gICAgICAgICAgICAgIG1hdGNoID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIFRBRkZZLkVYSVQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICBjYXNlICdhcnJheSc6XHJcbiAgICAgICAgICAgIC8vIGxvb3AgYXJyYXkgYW5kIHRyZWF0IGxpa2UgYSBTUUwgb3JcclxuICAgICAgICAgICAgbWF0Y2ggPSAobWYubGVuZ3RoID09PSAxKSA/IChydW5GaWx0ZXJzKCByLCBtZlswXSApKSA6XHJcbiAgICAgICAgICAgICAgKG1mLmxlbmd0aCA9PT0gMikgPyAocnVuRmlsdGVycyggciwgbWZbMF0gKSB8fFxyXG4gICAgICAgICAgICAgICAgcnVuRmlsdGVycyggciwgbWZbMV0gKSkgOlxyXG4gICAgICAgICAgICAgICAgKG1mLmxlbmd0aCA9PT0gMykgPyAocnVuRmlsdGVycyggciwgbWZbMF0gKSB8fFxyXG4gICAgICAgICAgICAgICAgICBydW5GaWx0ZXJzKCByLCBtZlsxXSApIHx8IHJ1bkZpbHRlcnMoIHIsIG1mWzJdICkpIDpcclxuICAgICAgICAgICAgICAgICAgKG1mLmxlbmd0aCA9PT0gNCkgPyAocnVuRmlsdGVycyggciwgbWZbMF0gKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIHJ1bkZpbHRlcnMoIHIsIG1mWzFdICkgfHwgcnVuRmlsdGVycyggciwgbWZbMl0gKSB8fFxyXG4gICAgICAgICAgICAgICAgICAgIHJ1bkZpbHRlcnMoIHIsIG1mWzNdICkpIDogZmFsc2U7XHJcbiAgICAgICAgICAgIGlmICggbWYubGVuZ3RoID4gNCApe1xyXG4gICAgICAgICAgICAgIGVhY2goIG1mLCBmdW5jdGlvbiAoIGYgKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHJ1bkZpbHRlcnMoIHIsIGYgKSApe1xyXG4gICAgICAgICAgICAgICAgICBtYXRjaCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuXHJcbiAgICAgIHJldHVybiBtYXRjaDtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuRmlsdGVyID0gZnVuY3Rpb24gKCBmICkge1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBUYWtlczogZmlsdGVyIG9iamVjdFxyXG4gICAgICAvLyAqIFJldHVybnM6IGEgZmlsdGVyIGZ1bmN0aW9uXHJcbiAgICAgIC8vICogUHVycG9zZTogVGFrZSBhIGZpbHRlciBvYmplY3QgYW5kIHJldHVybiBhIGZ1bmN0aW9uIHRoYXQgY2FuIGJlIHVzZWQgdG8gY29tcGFyZVxyXG4gICAgICAvLyAqIGEgVGFmZnlEQiByZWNvcmQgdG8gc2VlIGlmIHRoZSByZWNvcmQgbWF0Y2hlcyBhIHF1ZXJ5XHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogIFxyXG4gICAgICB2YXIgbmYgPSBbXTtcclxuICAgICAgaWYgKCBULmlzU3RyaW5nKCBmICkgJiYgL1t0XVswLTldKltyXVswLTldKi9pLnRlc3QoIGYgKSApe1xyXG4gICAgICAgIGYgPSB7IF9fX2lkIDogZiB9O1xyXG4gICAgICB9XHJcbiAgICAgIGlmICggVC5pc0FycmF5KCBmICkgKXtcclxuICAgICAgICAvLyBpZiB3ZSBhcmUgd29ya2luZyB3aXRoIGFuIGFycmF5XHJcblxyXG4gICAgICAgIGVhY2goIGYsIGZ1bmN0aW9uICggciApIHtcclxuICAgICAgICAgIC8vIGxvb3AgdGhlIGFycmF5IGFuZCByZXR1cm4gYSBmaWx0ZXIgZnVuYyBmb3IgZWFjaCB2YWx1ZVxyXG4gICAgICAgICAgbmYucHVzaCggcmV0dXJuRmlsdGVyKCByICkgKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBub3cgYnVpbGQgYSBmdW5jIHRvIGxvb3Agb3ZlciB0aGUgZmlsdGVycyBhbmQgcmV0dXJuIHRydWUgaWYgQU5ZIG9mIHRoZSBmaWx0ZXJzIG1hdGNoXHJcbiAgICAgICAgLy8gVGhpcyBoYW5kbGVzIGxvZ2ljYWwgT1IgZXhwcmVzc2lvbnNcclxuICAgICAgICBmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLCBtYXRjaCA9IGZhbHNlO1xyXG4gICAgICAgICAgZWFjaCggbmYsIGZ1bmN0aW9uICggZiApIHtcclxuICAgICAgICAgICAgaWYgKCBydW5GaWx0ZXJzKCB0aGF0LCBmICkgKXtcclxuICAgICAgICAgICAgICBtYXRjaCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgcmV0dXJuIG1hdGNoO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIGY7XHJcblxyXG4gICAgICB9XHJcbiAgICAgIC8vIGlmIHdlIGFyZSBkZWFsaW5nIHdpdGggYW4gT2JqZWN0XHJcbiAgICAgIGlmICggVC5pc09iamVjdCggZiApICl7XHJcbiAgICAgICAgaWYgKCBULmlzT2JqZWN0KCBmICkgJiYgZi5fX19pZCAmJiBmLl9fX3MgKXtcclxuICAgICAgICAgIGYgPSB7IF9fX2lkIDogZi5fX19pZCB9O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTG9vcCBvdmVyIGVhY2ggdmFsdWUgb24gdGhlIG9iamVjdCB0byBwcmVwIG1hdGNoIHR5cGUgYW5kIG1hdGNoIHZhbHVlXHJcbiAgICAgICAgZWFjaGluKCBmLCBmdW5jdGlvbiAoIHYsIGkgKSB7XHJcblxyXG4gICAgICAgICAgLy8gZGVmYXVsdCBtYXRjaCB0eXBlIHRvIElTL0VxdWFsc1xyXG4gICAgICAgICAgaWYgKCAhVC5pc09iamVjdCggdiApICl7XHJcbiAgICAgICAgICAgIHYgPSB7XHJcbiAgICAgICAgICAgICAgJ2lzJyA6IHZcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIGxvb3Agb3ZlciBlYWNoIHZhbHVlIG9uIHRoZSB2YWx1ZSBvYmplY3QgIC0gaWYgYW55XHJcbiAgICAgICAgICBlYWNoaW4oIHYsIGZ1bmN0aW9uICggbXRlc3QsIHMgKSB7XHJcbiAgICAgICAgICAgIC8vIHMgPSBtYXRjaCB0eXBlLCBlLmcuIGlzLCBoYXNBbGwsIGxpa2UsIGV0Y1xyXG4gICAgICAgICAgICB2YXIgYyA9IFtdLCBsb29wZXI7XHJcblxyXG4gICAgICAgICAgICAvLyBmdW5jdGlvbiB0byBsb29wIGFuZCBhcHBseSBmaWx0ZXJcclxuICAgICAgICAgICAgbG9vcGVyID0gKHMgPT09ICdoYXNBbGwnKSA/XHJcbiAgICAgICAgICAgICAgZnVuY3Rpb24gKCBtdGVzdCwgZnVuYyApIHtcclxuICAgICAgICAgICAgICAgIGZ1bmMoIG10ZXN0ICk7XHJcbiAgICAgICAgICAgICAgfSA6IGVhY2g7XHJcblxyXG4gICAgICAgICAgICAvLyBsb29wIG92ZXIgZWFjaCB0ZXN0XHJcbiAgICAgICAgICAgIGxvb3BlciggbXRlc3QsIGZ1bmN0aW9uICggbXRlc3QgKSB7XHJcblxyXG4gICAgICAgICAgICAgIC8vIHN1ID0gbWF0Y2ggc3VjY2Vzc1xyXG4gICAgICAgICAgICAgIC8vIGYgPSBtYXRjaCBmYWxzZVxyXG4gICAgICAgICAgICAgIHZhciBzdSA9IHRydWUsIGYgPSBmYWxzZSwgbWF0Y2hGdW5jO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgLy8gcHVzaCBhIGZ1bmN0aW9uIG9udG8gdGhlIGZpbHRlciBjb2xsZWN0aW9uIHRvIGRvIHRoZSBtYXRjaGluZ1xyXG4gICAgICAgICAgICAgIG1hdGNoRnVuYyA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIHZhbHVlIGZyb20gdGhlIHJlY29yZFxyXG4gICAgICAgICAgICAgICAgdmFyXHJcbiAgICAgICAgICAgICAgICAgIG12YWx1ZSAgID0gdGhpc1tpXSxcclxuICAgICAgICAgICAgICAgICAgZXFlcSAgICAgPSAnPT0nLFxyXG4gICAgICAgICAgICAgICAgICBiYW5nZXEgICA9ICchPScsXHJcbiAgICAgICAgICAgICAgICAgIGVxZXFlcSAgID0gJz09PScsXHJcbiAgICAgICAgICAgICAgICAgIGx0ICAgPSAnPCcsXHJcbiAgICAgICAgICAgICAgICAgIGd0ICAgPSAnPicsXHJcbiAgICAgICAgICAgICAgICAgIGx0ZXEgICA9ICc8PScsXHJcbiAgICAgICAgICAgICAgICAgIGd0ZXEgICA9ICc+PScsXHJcbiAgICAgICAgICAgICAgICAgIGJhbmdlcWVxID0gJyE9PScsXHJcbiAgICAgICAgICAgICAgICAgIHJcclxuICAgICAgICAgICAgICAgICAgO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbXZhbHVlID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmICggKHMuaW5kZXhPZiggJyEnICkgPT09IDApICYmIHMgIT09IGJhbmdlcSAmJlxyXG4gICAgICAgICAgICAgICAgICBzICE9PSBiYW5nZXFlcSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSBmaWx0ZXIgbmFtZSBzdGFydHMgd2l0aCAhIGFzIGluICchaXMnIHRoZW4gcmV2ZXJzZSB0aGUgbWF0Y2ggbG9naWMgYW5kIHJlbW92ZSB0aGUgIVxyXG4gICAgICAgICAgICAgICAgICBzdSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICBzID0gcy5zdWJzdHJpbmcoIDEsIHMubGVuZ3RoICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIG1hdGNoIHJlc3VsdHMgYmFzZWQgb24gdGhlIHMvbWF0Y2ggdHlwZVxyXG4gICAgICAgICAgICAgICAgLypqc2xpbnQgZXFlcSA6IHRydWUgKi9cclxuICAgICAgICAgICAgICAgIHIgPSAoXHJcbiAgICAgICAgICAgICAgICAgIChzID09PSAncmVnZXgnKSA/IChtdGVzdC50ZXN0KCBtdmFsdWUgKSkgOiAocyA9PT0gJ2x0JyB8fCBzID09PSBsdClcclxuICAgICAgICAgICAgICAgICAgPyAobXZhbHVlIDwgbXRlc3QpICA6IChzID09PSAnZ3QnIHx8IHMgPT09IGd0KVxyXG4gICAgICAgICAgICAgICAgICA/IChtdmFsdWUgPiBtdGVzdCkgIDogKHMgPT09ICdsdGUnIHx8IHMgPT09IGx0ZXEpXHJcbiAgICAgICAgICAgICAgICAgID8gKG12YWx1ZSA8PSBtdGVzdCkgOiAocyA9PT0gJ2d0ZScgfHwgcyA9PT0gZ3RlcSlcclxuICAgICAgICAgICAgICAgICAgPyAobXZhbHVlID49IG10ZXN0KSA6IChzID09PSAnbGVmdCcpXHJcbiAgICAgICAgICAgICAgICAgID8gKG12YWx1ZS5pbmRleE9mKCBtdGVzdCApID09PSAwKSA6IChzID09PSAnbGVmdG5vY2FzZScpXHJcbiAgICAgICAgICAgICAgICAgID8gKG12YWx1ZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoIG10ZXN0LnRvTG93ZXJDYXNlKCkgKVxyXG4gICAgICAgICAgICAgICAgICAgID09PSAwKSA6IChzID09PSAncmlnaHQnKVxyXG4gICAgICAgICAgICAgICAgICA/IChtdmFsdWUuc3Vic3RyaW5nKCAobXZhbHVlLmxlbmd0aCAtIG10ZXN0Lmxlbmd0aCkgKVxyXG4gICAgICAgICAgICAgICAgICAgID09PSBtdGVzdCkgOiAocyA9PT0gJ3JpZ2h0bm9jYXNlJylcclxuICAgICAgICAgICAgICAgICAgPyAobXZhbHVlLnRvTG93ZXJDYXNlKCkuc3Vic3RyaW5nKFxyXG4gICAgICAgICAgICAgICAgICAgIChtdmFsdWUubGVuZ3RoIC0gbXRlc3QubGVuZ3RoKSApID09PSBtdGVzdC50b0xvd2VyQ2FzZSgpKVxyXG4gICAgICAgICAgICAgICAgICAgIDogKHMgPT09ICdsaWtlJylcclxuICAgICAgICAgICAgICAgICAgPyAobXZhbHVlLmluZGV4T2YoIG10ZXN0ICkgPj0gMCkgOiAocyA9PT0gJ2xpa2Vub2Nhc2UnKVxyXG4gICAgICAgICAgICAgICAgICA/IChtdmFsdWUudG9Mb3dlckNhc2UoKS5pbmRleE9mKG10ZXN0LnRvTG93ZXJDYXNlKCkpID49IDApXHJcbiAgICAgICAgICAgICAgICAgICAgOiAocyA9PT0gZXFlcWVxIHx8IHMgPT09ICdpcycpXHJcbiAgICAgICAgICAgICAgICAgID8gKG12YWx1ZSA9PT0gIG10ZXN0KSA6IChzID09PSBlcWVxKVxyXG4gICAgICAgICAgICAgICAgICA/IChtdmFsdWUgPT0gbXRlc3QpIDogKHMgPT09IGJhbmdlcWVxKVxyXG4gICAgICAgICAgICAgICAgICA/IChtdmFsdWUgIT09ICBtdGVzdCkgOiAocyA9PT0gYmFuZ2VxKVxyXG4gICAgICAgICAgICAgICAgICA/IChtdmFsdWUgIT0gbXRlc3QpIDogKHMgPT09ICdpc25vY2FzZScpXHJcbiAgICAgICAgICAgICAgICAgID8gKG12YWx1ZS50b0xvd2VyQ2FzZVxyXG4gICAgICAgICAgICAgICAgICAgID8gbXZhbHVlLnRvTG93ZXJDYXNlKCkgPT09IG10ZXN0LnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgICAgICAgICAgIDogbXZhbHVlID09PSBtdGVzdCkgOiAocyA9PT0gJ2hhcycpXHJcbiAgICAgICAgICAgICAgICAgID8gKFQuaGFzKCBtdmFsdWUsIG10ZXN0ICkpIDogKHMgPT09ICdoYXNhbGwnKVxyXG4gICAgICAgICAgICAgICAgICA/IChULmhhc0FsbCggbXZhbHVlLCBtdGVzdCApKSA6IChzID09PSAnY29udGFpbnMnKVxyXG4gICAgICAgICAgICAgICAgICA/IChUQUZGWS5pc0FycmF5KG12YWx1ZSkgJiYgbXZhbHVlLmluZGV4T2YobXRlc3QpID4gLTEpIDogKFxyXG4gICAgICAgICAgICAgICAgICAgIHMuaW5kZXhPZiggJ2lzJyApID09PSAtMVxyXG4gICAgICAgICAgICAgICAgICAgICAgJiYgIVRBRkZZLmlzTnVsbCggbXZhbHVlIClcclxuICAgICAgICAgICAgICAgICAgICAgICYmICFUQUZGWS5pc1VuZGVmaW5lZCggbXZhbHVlIClcclxuICAgICAgICAgICAgICAgICAgICAgICYmICFUQUZGWS5pc09iamVjdCggbXRlc3QgKVxyXG4gICAgICAgICAgICAgICAgICAgICAgJiYgIVRBRkZZLmlzQXJyYXkoIG10ZXN0IClcclxuICAgICAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgICAgID8gKG10ZXN0ID09PSBtdmFsdWVbc10pXHJcbiAgICAgICAgICAgICAgICAgICAgOiAoVFtzXSAmJiBULmlzRnVuY3Rpb24oIFRbc10gKVxyXG4gICAgICAgICAgICAgICAgICAgICYmIHMuaW5kZXhPZiggJ2lzJyApID09PSAwKVxyXG4gICAgICAgICAgICAgICAgICA/IFRbc10oIG12YWx1ZSApID09PSBtdGVzdFxyXG4gICAgICAgICAgICAgICAgICAgIDogKFRbc10gJiYgVC5pc0Z1bmN0aW9uKCBUW3NdICkpXHJcbiAgICAgICAgICAgICAgICAgID8gVFtzXSggbXZhbHVlLCBtdGVzdCApIDogKGZhbHNlKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIC8qanNsaW50IGVxZXEgOiBmYWxzZSAqL1xyXG4gICAgICAgICAgICAgICAgciA9IChyICYmICFzdSkgPyBmYWxzZSA6ICghciAmJiAhc3UpID8gdHJ1ZSA6IHI7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHI7XHJcbiAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICBjLnB1c2goIG1hdGNoRnVuYyApO1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vIGlmIG9ubHkgb25lIGZpbHRlciBpbiB0aGUgY29sbGVjdGlvbiBwdXNoIGl0IG9udG8gdGhlIGZpbHRlciBsaXN0IHdpdGhvdXQgdGhlIGFycmF5XHJcbiAgICAgICAgICAgIGlmICggYy5sZW5ndGggPT09IDEgKXtcclxuXHJcbiAgICAgICAgICAgICAgbmYucHVzaCggY1swXSApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgIC8vIGVsc2UgYnVpbGQgYSBmdW5jdGlvbiB0byBsb29wIG92ZXIgYWxsIHRoZSBmaWx0ZXJzIGFuZCByZXR1cm4gdHJ1ZSBvbmx5IGlmIEFMTCBtYXRjaFxyXG4gICAgICAgICAgICAgIC8vIHRoaXMgaXMgYSBsb2dpY2FsIEFORFxyXG4gICAgICAgICAgICAgIG5mLnB1c2goIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0aGF0ID0gdGhpcywgbWF0Y2ggPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGVhY2goIGMsIGZ1bmN0aW9uICggZiApIHtcclxuICAgICAgICAgICAgICAgICAgaWYgKCBmLmFwcGx5KCB0aGF0ICkgKXtcclxuICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGNoO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBmaW5hbGx5IHJldHVybiBhIHNpbmdsZSBmdW5jdGlvbiB0aGF0IHdyYXBzIGFsbCB0aGUgb3RoZXIgZnVuY3Rpb25zIGFuZCB3aWxsIHJ1biBhIHF1ZXJ5XHJcbiAgICAgICAgLy8gd2hlcmUgYWxsIGZ1bmN0aW9ucyBoYXZlIHRvIHJldHVybiB0cnVlIGZvciBhIHJlY29yZCB0byBhcHBlYXIgaW4gYSBxdWVyeSByZXN1bHRcclxuICAgICAgICBmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgdmFyIHRoYXQgPSB0aGlzLCBtYXRjaCA9IHRydWU7XHJcbiAgICAgICAgICAvLyBmYXN0ZXIgaWYgbGVzcyB0aGFuICA0IGZ1bmN0aW9uc1xyXG4gICAgICAgICAgbWF0Y2ggPSAobmYubGVuZ3RoID09PSAxICYmICFuZlswXS5hcHBseSggdGhhdCApKSA/IGZhbHNlIDpcclxuICAgICAgICAgICAgKG5mLmxlbmd0aCA9PT0gMiAmJlxyXG4gICAgICAgICAgICAgICghbmZbMF0uYXBwbHkoIHRoYXQgKSB8fCAhbmZbMV0uYXBwbHkoIHRoYXQgKSkpID8gZmFsc2UgOlxyXG4gICAgICAgICAgICAgIChuZi5sZW5ndGggPT09IDMgJiZcclxuICAgICAgICAgICAgICAgICghbmZbMF0uYXBwbHkoIHRoYXQgKSB8fCAhbmZbMV0uYXBwbHkoIHRoYXQgKSB8fFxyXG4gICAgICAgICAgICAgICAgICAhbmZbMl0uYXBwbHkoIHRoYXQgKSkpID8gZmFsc2UgOlxyXG4gICAgICAgICAgICAgICAgKG5mLmxlbmd0aCA9PT0gNCAmJlxyXG4gICAgICAgICAgICAgICAgICAoIW5mWzBdLmFwcGx5KCB0aGF0ICkgfHwgIW5mWzFdLmFwcGx5KCB0aGF0ICkgfHxcclxuICAgICAgICAgICAgICAgICAgICAhbmZbMl0uYXBwbHkoIHRoYXQgKSB8fCAhbmZbM10uYXBwbHkoIHRoYXQgKSkpID8gZmFsc2VcclxuICAgICAgICAgICAgICAgICAgOiB0cnVlO1xyXG4gICAgICAgICAgaWYgKCBuZi5sZW5ndGggPiA0ICl7XHJcbiAgICAgICAgICAgIGVhY2goIG5mLCBmdW5jdGlvbiAoIGYgKSB7XHJcbiAgICAgICAgICAgICAgaWYgKCAhcnVuRmlsdGVycyggdGhhdCwgZiApICl7XHJcbiAgICAgICAgICAgICAgICBtYXRjaCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gbWF0Y2g7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4gZjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy8gaWYgZnVuY3Rpb25cclxuICAgICAgaWYgKCBULmlzRnVuY3Rpb24oIGYgKSApe1xyXG4gICAgICAgIHJldHVybiBmO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIG9yZGVyQnlDb2wgPSBmdW5jdGlvbiAoIGFyLCBvICkge1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBUYWtlczogdGFrZXMgYW4gYXJyYXkgYW5kIGEgc29ydCBvYmplY3RcclxuICAgICAgLy8gKiBSZXR1cm5zOiB0aGUgYXJyYXkgc29ydGVkXHJcbiAgICAgIC8vICogUHVycG9zZTogQWNjZXB0IGZpbHRlcnMgc3VjaCBhcyBcIltjb2xdLCBbY29sMl1cIiBvciBcIltjb2xdIGRlc2NcIiBhbmQgc29ydCBvbiB0aG9zZSBjb2x1bW5zXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxuICAgICAgdmFyIHNvcnRGdW5jID0gZnVuY3Rpb24gKCBhLCBiICkge1xyXG4gICAgICAgIC8vIGZ1bmN0aW9uIHRvIHBhc3MgdG8gdGhlIG5hdGl2ZSBhcnJheS5zb3J0IHRvIHNvcnQgYW4gYXJyYXlcclxuICAgICAgICB2YXIgciA9IDA7XHJcblxyXG4gICAgICAgIFQuZWFjaCggbywgZnVuY3Rpb24gKCBzZCApIHtcclxuICAgICAgICAgIC8vIGxvb3Agb3ZlciB0aGUgc29ydCBpbnN0cnVjdGlvbnNcclxuICAgICAgICAgIC8vIGdldCB0aGUgY29sdW1uIG5hbWVcclxuICAgICAgICAgIHZhciBvLCBjb2wsIGRpciwgYywgZDtcclxuICAgICAgICAgIG8gPSBzZC5zcGxpdCggJyAnICk7XHJcbiAgICAgICAgICBjb2wgPSBvWzBdO1xyXG5cclxuICAgICAgICAgIC8vIGdldCB0aGUgZGlyZWN0aW9uXHJcbiAgICAgICAgICBkaXIgPSAoby5sZW5ndGggPT09IDEpID8gXCJsb2dpY2FsXCIgOiBvWzFdO1xyXG5cclxuXHJcbiAgICAgICAgICBpZiAoIGRpciA9PT0gJ2xvZ2ljYWwnICl7XHJcbiAgICAgICAgICAgIC8vIGlmIGRpciBpcyBsb2dpY2FsIHRoYW4gZ3JhYiB0aGUgY2hhcm51bSBhcnJheXMgZm9yIHRoZSB0d28gdmFsdWVzIHdlIGFyZSBsb29raW5nIGF0XHJcbiAgICAgICAgICAgIGMgPSBudW1jaGFyc3BsaXQoIGFbY29sXSApO1xyXG4gICAgICAgICAgICBkID0gbnVtY2hhcnNwbGl0KCBiW2NvbF0gKTtcclxuICAgICAgICAgICAgLy8gbG9vcCBvdmVyIHRoZSBjaGFybnVtYXJyYXlzIHVudGlsIG9uZSB2YWx1ZSBpcyBoaWdoZXIgdGhhbiB0aGUgb3RoZXJcclxuICAgICAgICAgICAgVC5lYWNoKCAoYy5sZW5ndGggPD0gZC5sZW5ndGgpID8gYyA6IGQsIGZ1bmN0aW9uICggeCwgaSApIHtcclxuICAgICAgICAgICAgICBpZiAoIGNbaV0gPCBkW2ldICl7XHJcbiAgICAgICAgICAgICAgICByID0gLTE7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gVEFGRlkuRVhJVDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSBpZiAoIGNbaV0gPiBkW2ldICl7XHJcbiAgICAgICAgICAgICAgICByID0gMTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBUQUZGWS5FWElUO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoIGRpciA9PT0gJ2xvZ2ljYWxkZXNjJyApe1xyXG4gICAgICAgICAgICAvLyBpZiBsb2dpY2FsZGVzYyB0aGFuIGdyYWIgdGhlIGNoYXJudW0gYXJyYXlzIGZvciB0aGUgdHdvIHZhbHVlcyB3ZSBhcmUgbG9va2luZyBhdFxyXG4gICAgICAgICAgICBjID0gbnVtY2hhcnNwbGl0KCBhW2NvbF0gKTtcclxuICAgICAgICAgICAgZCA9IG51bWNoYXJzcGxpdCggYltjb2xdICk7XHJcbiAgICAgICAgICAgIC8vIGxvb3Agb3ZlciB0aGUgY2hhcm51bWFycmF5cyB1bnRpbCBvbmUgdmFsdWUgaXMgbG93ZXIgdGhhbiB0aGUgb3RoZXJcclxuICAgICAgICAgICAgVC5lYWNoKCAoYy5sZW5ndGggPD0gZC5sZW5ndGgpID8gYyA6IGQsIGZ1bmN0aW9uICggeCwgaSApIHtcclxuICAgICAgICAgICAgICBpZiAoIGNbaV0gPiBkW2ldICl7XHJcbiAgICAgICAgICAgICAgICByID0gLTE7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gVEFGRlkuRVhJVDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSBpZiAoIGNbaV0gPCBkW2ldICl7XHJcbiAgICAgICAgICAgICAgICByID0gMTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBUQUZGWS5FWElUO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoIGRpciA9PT0gJ2FzZWMnICYmIGFbY29sXSA8IGJbY29sXSApe1xyXG4gICAgICAgICAgICAvLyBpZiBhc2VjIC0gZGVmYXVsdCAtIGNoZWNrIHRvIHNlZSB3aGljaCBpcyBoaWdoZXJcclxuICAgICAgICAgICAgciA9IC0xO1xyXG4gICAgICAgICAgICByZXR1cm4gVC5FWElUO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoIGRpciA9PT0gJ2FzZWMnICYmIGFbY29sXSA+IGJbY29sXSApe1xyXG4gICAgICAgICAgICAvLyBpZiBhc2VjIC0gZGVmYXVsdCAtIGNoZWNrIHRvIHNlZSB3aGljaCBpcyBoaWdoZXJcclxuICAgICAgICAgICAgciA9IDE7XHJcbiAgICAgICAgICAgIHJldHVybiBULkVYSVQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmICggZGlyID09PSAnZGVzYycgJiYgYVtjb2xdID4gYltjb2xdICl7XHJcbiAgICAgICAgICAgIC8vIGlmIGRlc2MgY2hlY2sgdG8gc2VlIHdoaWNoIGlzIGxvd2VyXHJcbiAgICAgICAgICAgIHIgPSAtMTtcclxuICAgICAgICAgICAgcmV0dXJuIFQuRVhJVDtcclxuXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIGlmICggZGlyID09PSAnZGVzYycgJiYgYVtjb2xdIDwgYltjb2xdICl7XHJcbiAgICAgICAgICAgIC8vIGlmIGRlc2MgY2hlY2sgdG8gc2VlIHdoaWNoIGlzIGxvd2VyXHJcbiAgICAgICAgICAgIHIgPSAxO1xyXG4gICAgICAgICAgICByZXR1cm4gVC5FWElUO1xyXG5cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIGlmIHIgaXMgc3RpbGwgMCBhbmQgd2UgYXJlIGRvaW5nIGEgbG9naWNhbCBzb3J0IHRoYW4gbG9vayB0byBzZWUgaWYgb25lIGFycmF5IGlzIGxvbmdlciB0aGFuIHRoZSBvdGhlclxyXG4gICAgICAgICAgaWYgKCByID09PSAwICYmIGRpciA9PT0gJ2xvZ2ljYWwnICYmIGMubGVuZ3RoIDwgZC5sZW5ndGggKXtcclxuICAgICAgICAgICAgciA9IC0xO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSBpZiAoIHIgPT09IDAgJiYgZGlyID09PSAnbG9naWNhbCcgJiYgYy5sZW5ndGggPiBkLmxlbmd0aCApe1xyXG4gICAgICAgICAgICByID0gMTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2UgaWYgKCByID09PSAwICYmIGRpciA9PT0gJ2xvZ2ljYWxkZXNjJyAmJiBjLmxlbmd0aCA+IGQubGVuZ3RoICl7XHJcbiAgICAgICAgICAgIHIgPSAtMTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2UgaWYgKCByID09PSAwICYmIGRpciA9PT0gJ2xvZ2ljYWxkZXNjJyAmJiBjLmxlbmd0aCA8IGQubGVuZ3RoICl7XHJcbiAgICAgICAgICAgIHIgPSAxO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIGlmICggciAhPT0gMCApe1xyXG4gICAgICAgICAgICByZXR1cm4gVC5FWElUO1xyXG4gICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgfSApO1xyXG4gICAgICAgIHJldHVybiByO1xyXG4gICAgICB9O1xyXG4gICAgICAvLyBjYWxsIHRoZSBzb3J0IGZ1bmN0aW9uIGFuZCByZXR1cm4gdGhlIG5ld2x5IHNvcnRlZCBhcnJheVxyXG4gICAgICByZXR1cm4gKGFyICYmIGFyLnB1c2gpID8gYXIuc29ydCggc29ydEZ1bmMgKSA6IGFyO1xyXG5cclxuXHJcbiAgICB9O1xyXG5cclxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vICpcclxuICAgIC8vICogVGFrZXM6IGEgc3RyaW5nIGNvbnRhaW5pbmcgbnVtYmVycyBhbmQgbGV0dGVycyBhbmQgdHVybiBpdCBpbnRvIGFuIGFycmF5XHJcbiAgICAvLyAqIFJldHVybnM6IHJldHVybiBhbiBhcnJheSBvZiBudW1iZXJzIGFuZCBsZXR0ZXJzXHJcbiAgICAvLyAqIFB1cnBvc2U6IFVzZWQgZm9yIGxvZ2ljYWwgc29ydGluZy4gU3RyaW5nIEV4YW1wbGU6IDEyQUJDIHJlc3VsdHM6IFsxMiwnQUJDJ11cclxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcbiAgICAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAvLyBjcmVhdGVzIGEgY2FjaGUgZm9yIG51bWNoYXIgY29udmVyc2lvbnNcclxuICAgICAgdmFyIGNhY2hlID0ge30sIGNhY2hjb3VudGVyID0gMDtcclxuICAgICAgLy8gY3JlYXRlcyB0aGUgbnVtY2hhcnNwbGl0IGZ1bmN0aW9uXHJcbiAgICAgIG51bWNoYXJzcGxpdCA9IGZ1bmN0aW9uICggdGhpbmcgKSB7XHJcbiAgICAgICAgLy8gaWYgb3ZlciAxMDAwIGl0ZW1zIGV4aXN0IGluIHRoZSBjYWNoZSwgY2xlYXIgaXQgYW5kIHN0YXJ0IG92ZXJcclxuICAgICAgICBpZiAoIGNhY2hjb3VudGVyID4gY21heCApe1xyXG4gICAgICAgICAgY2FjaGUgPSB7fTtcclxuICAgICAgICAgIGNhY2hjb3VudGVyID0gMDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlmIGEgY2FjaGUgY2FuIGJlIGZvdW5kIGZvciBhIG51bWNoYXIgdGhlbiByZXR1cm4gaXRzIGFycmF5IHZhbHVlXHJcbiAgICAgICAgcmV0dXJuIGNhY2hlWydfJyArIHRoaW5nXSB8fCAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgLy8gb3RoZXJ3aXNlIGRvIHRoZSBjb252ZXJzaW9uXHJcbiAgICAgICAgICAvLyBtYWtlIHN1cmUgaXQgaXMgYSBzdHJpbmcgYW5kIHNldHVwIHNvIG90aGVyIHZhcmlhYmxlc1xyXG4gICAgICAgICAgdmFyIG50aGluZyA9IFN0cmluZyggdGhpbmcgKSxcclxuICAgICAgICAgICAgbmEgPSBbXSxcclxuICAgICAgICAgICAgcnYgPSAnXycsXHJcbiAgICAgICAgICAgIHJ0ID0gJycsXHJcbiAgICAgICAgICAgIHgsIHh4LCBjO1xyXG5cclxuICAgICAgICAgIC8vIGxvb3Agb3ZlciB0aGUgc3RyaW5nIGNoYXIgYnkgY2hhclxyXG4gICAgICAgICAgZm9yICggeCA9IDAsIHh4ID0gbnRoaW5nLmxlbmd0aDsgeCA8IHh4OyB4KysgKXtcclxuICAgICAgICAgICAgLy8gdGFrZSB0aGUgY2hhciBhdCBlYWNoIGxvY2F0aW9uXHJcbiAgICAgICAgICAgIGMgPSBudGhpbmcuY2hhckNvZGVBdCggeCApO1xyXG4gICAgICAgICAgICAvLyBjaGVjayB0byBzZWUgaWYgaXQgaXMgYSB2YWxpZCBudW1iZXIgY2hhciBhbmQgYXBwZW5kIGl0IHRvIHRoZSBhcnJheS5cclxuICAgICAgICAgICAgLy8gaWYgbGFzdCBjaGFyIHdhcyBhIHN0cmluZyBwdXNoIHRoZSBzdHJpbmcgdG8gdGhlIGNoYXJudW0gYXJyYXlcclxuICAgICAgICAgICAgaWYgKCAoIGMgPj0gNDggJiYgYyA8PSA1NyApIHx8IGMgPT09IDQ2ICl7XHJcbiAgICAgICAgICAgICAgaWYgKCBydCAhPT0gJ24nICl7XHJcbiAgICAgICAgICAgICAgICBydCA9ICduJztcclxuICAgICAgICAgICAgICAgIG5hLnB1c2goIHJ2LnRvTG93ZXJDYXNlKCkgKTtcclxuICAgICAgICAgICAgICAgIHJ2ID0gJyc7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJ2ID0gcnYgKyBudGhpbmcuY2hhckF0KCB4ICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgLy8gY2hlY2sgdG8gc2VlIGlmIGl0IGlzIGEgdmFsaWQgc3RyaW5nIGNoYXIgYW5kIGFwcGVuZCB0byBzdHJpbmdcclxuICAgICAgICAgICAgICAvLyBpZiBsYXN0IGNoYXIgd2FzIGEgbnVtYmVyIHB1c2ggdGhlIHdob2xlIG51bWJlciB0byB0aGUgY2hhcm51bSBhcnJheVxyXG4gICAgICAgICAgICAgIGlmICggcnQgIT09ICdzJyApe1xyXG4gICAgICAgICAgICAgICAgcnQgPSAncyc7XHJcbiAgICAgICAgICAgICAgICBuYS5wdXNoKCBwYXJzZUZsb2F0KCBydiApICk7XHJcbiAgICAgICAgICAgICAgICBydiA9ICcnO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBydiA9IHJ2ICsgbnRoaW5nLmNoYXJBdCggeCApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBvbmNlIGRvbmUsIHB1c2ggdGhlIGxhc3QgdmFsdWUgdG8gdGhlIGNoYXJudW0gYXJyYXkgYW5kIHJlbW92ZSB0aGUgZmlyc3QgdW5lZWRlZCBpdGVtXHJcbiAgICAgICAgICBuYS5wdXNoKCAocnQgPT09ICduJykgPyBwYXJzZUZsb2F0KCBydiApIDogcnYudG9Mb3dlckNhc2UoKSApO1xyXG4gICAgICAgICAgbmEuc2hpZnQoKTtcclxuICAgICAgICAgIC8vIGFkZCB0byBjYWNoZVxyXG4gICAgICAgICAgY2FjaGVbJ18nICsgdGhpbmddID0gbmE7XHJcbiAgICAgICAgICBjYWNoY291bnRlcisrO1xyXG4gICAgICAgICAgLy8gcmV0dXJuIGNoYXJudW0gYXJyYXlcclxuICAgICAgICAgIHJldHVybiBuYTtcclxuICAgICAgICB9KCkpO1xyXG4gICAgICB9O1xyXG4gICAgfSgpKTtcclxuXHJcbiAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAvLyAqXHJcbiAgICAvLyAqIFJ1bnMgYSBxdWVyeVxyXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuXHJcblxyXG4gICAgcnVuID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICB0aGlzLmNvbnRleHQoIHtcclxuICAgICAgICByZXN1bHRzIDogdGhpcy5nZXREQkkoKS5xdWVyeSggdGhpcy5jb250ZXh0KCkgKVxyXG4gICAgICB9KTtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIEFQSS5leHRlbmQoICdmaWx0ZXInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgLy8gKlxyXG4gICAgICAvLyAqIFRha2VzOiB0YWtlcyB1bmxpbWl0ZWQgZmlsdGVyIG9iamVjdHMgYXMgYXJndW1lbnRzXHJcbiAgICAgIC8vICogUmV0dXJuczogbWV0aG9kIGNvbGxlY3Rpb25cclxuICAgICAgLy8gKiBQdXJwb3NlOiBUYWtlIGZpbHRlcnMgYXMgb2JqZWN0cyBhbmQgY2FjaGUgZnVuY3Rpb25zIGZvciBsYXRlciBsb29rdXAgd2hlbiBhIHF1ZXJ5IGlzIHJ1blxyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIFxyXG4gICAgICB2YXJcclxuICAgICAgICBuYyA9IFRBRkZZLm1lcmdlT2JqKCB0aGlzLmNvbnRleHQoKSwgeyBydW4gOiBudWxsIH0gKSxcclxuICAgICAgICBucSA9IFtdXHJcbiAgICAgIDtcclxuICAgICAgZWFjaCggbmMucSwgZnVuY3Rpb24gKCB2ICkge1xyXG4gICAgICAgIG5xLnB1c2goIHYgKTtcclxuICAgICAgfSk7XHJcbiAgICAgIG5jLnEgPSBucTtcclxuICAgICAgLy8gSGFkbmxlIHBhc3Npbmcgb2YgX19fSUQgb3IgYSByZWNvcmQgb24gbG9va3VwLlxyXG4gICAgICBlYWNoKCBhcmd1bWVudHMsIGZ1bmN0aW9uICggZiApIHtcclxuICAgICAgICBuYy5xLnB1c2goIHJldHVybkZpbHRlciggZiApICk7XHJcbiAgICAgICAgbmMuZmlsdGVyUmF3LnB1c2goIGYgKTtcclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5nZXRyb290KCBuYyApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgQVBJLmV4dGVuZCggJ29yZGVyJywgZnVuY3Rpb24gKCBvICkge1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBQdXJwb3NlOiB0YWtlcyBhIHN0cmluZyBhbmQgY3JlYXRlcyBhbiBhcnJheSBvZiBvcmRlciBpbnN0cnVjdGlvbnMgdG8gYmUgdXNlZCB3aXRoIGEgcXVlcnlcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxuICAgICAgbyA9IG8uc3BsaXQoICcsJyApO1xyXG4gICAgICB2YXIgeCA9IFtdLCBuYztcclxuXHJcbiAgICAgIGVhY2goIG8sIGZ1bmN0aW9uICggciApIHtcclxuICAgICAgICB4LnB1c2goIHIucmVwbGFjZSggL15cXHMqLywgJycgKS5yZXBsYWNlKCAvXFxzKiQvLCAnJyApICk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgbmMgPSBUQUZGWS5tZXJnZU9iaiggdGhpcy5jb250ZXh0KCksIHtzb3J0IDogbnVsbH0gKTtcclxuICAgICAgbmMub3JkZXIgPSB4O1xyXG5cclxuICAgICAgcmV0dXJuIHRoaXMuZ2V0cm9vdCggbmMgKTtcclxuICAgIH0pO1xyXG5cclxuICAgIEFQSS5leHRlbmQoICdsaW1pdCcsIGZ1bmN0aW9uICggbiApIHtcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAvLyAqXHJcbiAgICAgIC8vICogUHVycG9zZTogdGFrZXMgYSBsaW1pdCBudW1iZXIgdG8gbGltaXQgdGhlIG51bWJlciBvZiByb3dzIHJldHVybmVkIGJ5IGEgcXVlcnkuIFdpbGwgdXBkYXRlIHRoZSByZXN1bHRzXHJcbiAgICAgIC8vICogb2YgYSBxdWVyeVxyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIFxyXG4gICAgICB2YXIgbmMgPSBUQUZGWS5tZXJnZU9iaiggdGhpcy5jb250ZXh0KCksIHt9KSxcclxuICAgICAgICBsaW1pdGVkcmVzdWx0c1xyXG4gICAgICAgIDtcclxuXHJcbiAgICAgIG5jLmxpbWl0ID0gbjtcclxuXHJcbiAgICAgIGlmICggbmMucnVuICYmIG5jLnNvcnQgKXtcclxuICAgICAgICBsaW1pdGVkcmVzdWx0cyA9IFtdO1xyXG4gICAgICAgIGVhY2goIG5jLnJlc3VsdHMsIGZ1bmN0aW9uICggaSwgeCApIHtcclxuICAgICAgICAgIGlmICggKHggKyAxKSA+IG4gKXtcclxuICAgICAgICAgICAgcmV0dXJuIFRBRkZZLkVYSVQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBsaW1pdGVkcmVzdWx0cy5wdXNoKCBpICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgbmMucmVzdWx0cyA9IGxpbWl0ZWRyZXN1bHRzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gdGhpcy5nZXRyb290KCBuYyApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgQVBJLmV4dGVuZCggJ3N0YXJ0JywgZnVuY3Rpb24gKCBuICkge1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBQdXJwb3NlOiB0YWtlcyBhIGxpbWl0IG51bWJlciB0byBsaW1pdCB0aGUgbnVtYmVyIG9mIHJvd3MgcmV0dXJuZWQgYnkgYSBxdWVyeS4gV2lsbCB1cGRhdGUgdGhlIHJlc3VsdHNcclxuICAgICAgLy8gKiBvZiBhIHF1ZXJ5XHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcbiAgICAgIHZhciBuYyA9IFRBRkZZLm1lcmdlT2JqKCB0aGlzLmNvbnRleHQoKSwge30gKSxcclxuICAgICAgICBsaW1pdGVkcmVzdWx0c1xyXG4gICAgICAgIDtcclxuXHJcbiAgICAgIG5jLnN0YXJ0ID0gbjtcclxuXHJcbiAgICAgIGlmICggbmMucnVuICYmIG5jLnNvcnQgJiYgIW5jLmxpbWl0ICl7XHJcbiAgICAgICAgbGltaXRlZHJlc3VsdHMgPSBbXTtcclxuICAgICAgICBlYWNoKCBuYy5yZXN1bHRzLCBmdW5jdGlvbiAoIGksIHggKSB7XHJcbiAgICAgICAgICBpZiAoICh4ICsgMSkgPiBuICl7XHJcbiAgICAgICAgICAgIGxpbWl0ZWRyZXN1bHRzLnB1c2goIGkgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBuYy5yZXN1bHRzID0gbGltaXRlZHJlc3VsdHM7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgbmMgPSBUQUZGWS5tZXJnZU9iaiggdGhpcy5jb250ZXh0KCksIHtydW4gOiBudWxsLCBzdGFydCA6IG59ICk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiB0aGlzLmdldHJvb3QoIG5jICk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBBUEkuZXh0ZW5kKCAndXBkYXRlJywgZnVuY3Rpb24gKCBhcmcwLCBhcmcxLCBhcmcyICkge1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBUYWtlczogYSBvYmplY3QgYW5kIHBhc3NlcyBpdCBvZmYgREJJIHVwZGF0ZSBtZXRob2QgZm9yIGFsbCBtYXRjaGVkIHJlY29yZHNcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuICAgICAgdmFyIHJ1bkV2ZW50ID0gdHJ1ZSwgbyA9IHt9LCBhcmdzID0gYXJndW1lbnRzLCB0aGF0O1xyXG4gICAgICBpZiAoIFRBRkZZLmlzU3RyaW5nKCBhcmcwICkgJiZcclxuICAgICAgICAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMiB8fCBhcmd1bWVudHMubGVuZ3RoID09PSAzKSApXHJcbiAgICAgIHtcclxuICAgICAgICBvW2FyZzBdID0gYXJnMTtcclxuICAgICAgICBpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT09IDMgKXtcclxuICAgICAgICAgIHJ1bkV2ZW50ID0gYXJnMjtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgbyA9IGFyZzA7XHJcbiAgICAgICAgaWYgKCBhcmdzLmxlbmd0aCA9PT0gMiApe1xyXG4gICAgICAgICAgcnVuRXZlbnQgPSBhcmcxO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG5cclxuICAgICAgdGhhdCA9IHRoaXM7XHJcbiAgICAgIHJ1bi5jYWxsKCB0aGlzICk7XHJcbiAgICAgIGVhY2goIHRoaXMuY29udGV4dCgpLnJlc3VsdHMsIGZ1bmN0aW9uICggciApIHtcclxuICAgICAgICB2YXIgYyA9IG87XHJcbiAgICAgICAgaWYgKCBUQUZGWS5pc0Z1bmN0aW9uKCBjICkgKXtcclxuICAgICAgICAgIGMgPSBjLmFwcGx5KCBUQUZGWS5tZXJnZU9iaiggciwge30gKSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGlmICggVC5pc0Z1bmN0aW9uKCBjICkgKXtcclxuICAgICAgICAgICAgYyA9IGMoIFRBRkZZLm1lcmdlT2JqKCByLCB7fSApICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICggVEFGRlkuaXNPYmplY3QoIGMgKSApe1xyXG4gICAgICAgICAgdGhhdC5nZXREQkkoKS51cGRhdGUoIHIuX19faWQsIGMsIHJ1bkV2ZW50ICk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgaWYgKCB0aGlzLmNvbnRleHQoKS5yZXN1bHRzLmxlbmd0aCApe1xyXG4gICAgICAgIHRoaXMuY29udGV4dCggeyBydW4gOiBudWxsIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSk7XHJcbiAgICBBUEkuZXh0ZW5kKCAncmVtb3ZlJywgZnVuY3Rpb24gKCBydW5FdmVudCApIHtcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAvLyAqXHJcbiAgICAgIC8vICogUHVycG9zZTogcmVtb3ZlcyByZWNvcmRzIGZyb20gdGhlIERCIHZpYSB0aGUgcmVtb3ZlIGFuZCByZW1vdmVDb21taXQgREJJIG1ldGhvZHNcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuICAgICAgdmFyIHRoYXQgPSB0aGlzLCBjID0gMDtcclxuICAgICAgcnVuLmNhbGwoIHRoaXMgKTtcclxuICAgICAgZWFjaCggdGhpcy5jb250ZXh0KCkucmVzdWx0cywgZnVuY3Rpb24gKCByICkge1xyXG4gICAgICAgIHRoYXQuZ2V0REJJKCkucmVtb3ZlKCByLl9fX2lkICk7XHJcbiAgICAgICAgYysrO1xyXG4gICAgICB9KTtcclxuICAgICAgaWYgKCB0aGlzLmNvbnRleHQoKS5yZXN1bHRzLmxlbmd0aCApe1xyXG4gICAgICAgIHRoaXMuY29udGV4dCgge1xyXG4gICAgICAgICAgcnVuIDogbnVsbFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoYXQuZ2V0REJJKCkucmVtb3ZlQ29tbWl0KCBydW5FdmVudCApO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gYztcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICBBUEkuZXh0ZW5kKCAnY291bnQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgLy8gKlxyXG4gICAgICAvLyAqIFJldHVybnM6IFRoZSBsZW5ndGggb2YgYSBxdWVyeSByZXN1bHRcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuICAgICAgcnVuLmNhbGwoIHRoaXMgKTtcclxuICAgICAgcmV0dXJuIHRoaXMuY29udGV4dCgpLnJlc3VsdHMubGVuZ3RoO1xyXG4gICAgfSk7XHJcblxyXG4gICAgQVBJLmV4dGVuZCggJ2NhbGxiYWNrJywgZnVuY3Rpb24gKCBmLCBkZWxheSApIHtcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAvLyAqXHJcbiAgICAgIC8vICogUmV0dXJucyBudWxsO1xyXG4gICAgICAvLyAqIFJ1bnMgYSBmdW5jdGlvbiBvbiByZXR1cm4gb2YgcnVuLmNhbGxcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuICAgICAgaWYgKCBmICl7XHJcbiAgICAgICAgdmFyIHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIHJ1bi5jYWxsKCB0aGF0ICk7XHJcbiAgICAgICAgICBmLmNhbGwoIHRoYXQuZ2V0cm9vdCggdGhhdC5jb250ZXh0KCkgKSApO1xyXG4gICAgICAgIH0sIGRlbGF5IHx8IDAgKTtcclxuICAgICAgfVxyXG5cclxuXHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfSk7XHJcblxyXG4gICAgQVBJLmV4dGVuZCggJ2dldCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAvLyAqXHJcbiAgICAgIC8vICogUmV0dXJuczogQW4gYXJyYXkgb2YgYWxsIG1hdGNoaW5nIHJlY29yZHNcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuICAgICAgcnVuLmNhbGwoIHRoaXMgKTtcclxuICAgICAgcmV0dXJuIHRoaXMuY29udGV4dCgpLnJlc3VsdHM7XHJcbiAgICB9KTtcclxuXHJcbiAgICBBUEkuZXh0ZW5kKCAnc3RyaW5naWZ5JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBSZXR1cm5zOiBBbiBKU09OIHN0cmluZyBvZiBhbGwgbWF0Y2hpbmcgcmVjb3Jkc1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIFxyXG4gICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoIHRoaXMuZ2V0KCkgKTtcclxuICAgIH0pO1xyXG4gICAgQVBJLmV4dGVuZCggJ2ZpcnN0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBSZXR1cm5zOiBUaGUgZmlyc3QgbWF0Y2hpbmcgcmVjb3JkXHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcbiAgICAgIHJ1bi5jYWxsKCB0aGlzICk7XHJcbiAgICAgIHJldHVybiB0aGlzLmNvbnRleHQoKS5yZXN1bHRzWzBdIHx8IGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICBBUEkuZXh0ZW5kKCAnbGFzdCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAvLyAqXHJcbiAgICAgIC8vICogUmV0dXJuczogVGhlIGxhc3QgbWF0Y2hpbmcgcmVjb3JkXHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcbiAgICAgIHJ1bi5jYWxsKCB0aGlzICk7XHJcbiAgICAgIHJldHVybiB0aGlzLmNvbnRleHQoKS5yZXN1bHRzW3RoaXMuY29udGV4dCgpLnJlc3VsdHMubGVuZ3RoIC0gMV0gfHxcclxuICAgICAgICBmYWxzZTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICBBUEkuZXh0ZW5kKCAnc3VtJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBUYWtlczogY29sdW1uIHRvIHN1bSB1cFxyXG4gICAgICAvLyAqIFJldHVybnM6IFN1bXMgdGhlIHZhbHVlcyBvZiBhIGNvbHVtblxyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIFxyXG4gICAgICB2YXIgdG90YWwgPSAwLCB0aGF0ID0gdGhpcztcclxuICAgICAgcnVuLmNhbGwoIHRoYXQgKTtcclxuICAgICAgZWFjaCggYXJndW1lbnRzLCBmdW5jdGlvbiAoIGMgKSB7XHJcbiAgICAgICAgZWFjaCggdGhhdC5jb250ZXh0KCkucmVzdWx0cywgZnVuY3Rpb24gKCByICkge1xyXG4gICAgICAgICAgdG90YWwgPSB0b3RhbCArIChyW2NdIHx8IDApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIHRvdGFsO1xyXG4gICAgfSk7XHJcblxyXG4gICAgQVBJLmV4dGVuZCggJ21pbicsIGZ1bmN0aW9uICggYyApIHtcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAvLyAqXHJcbiAgICAgIC8vICogVGFrZXM6IGNvbHVtbiB0byBmaW5kIG1pblxyXG4gICAgICAvLyAqIFJldHVybnM6IHRoZSBsb3dlc3QgdmFsdWVcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuICAgICAgdmFyIGxvd2VzdCA9IG51bGw7XHJcbiAgICAgIHJ1bi5jYWxsKCB0aGlzICk7XHJcbiAgICAgIGVhY2goIHRoaXMuY29udGV4dCgpLnJlc3VsdHMsIGZ1bmN0aW9uICggciApIHtcclxuICAgICAgICBpZiAoIGxvd2VzdCA9PT0gbnVsbCB8fCByW2NdIDwgbG93ZXN0ICl7XHJcbiAgICAgICAgICBsb3dlc3QgPSByW2NdO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiBsb3dlc3Q7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyAgVGFmZnkgaW5uZXJKb2luIEV4dGVuc2lvbiAoT0NEIGVkaXRpb24pXHJcbiAgICAvLyAgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbiAgICAvL1xyXG4gICAgLy8gIEhvdyB0byBVc2VcclxuICAgIC8vICAqKioqKioqKioqXHJcbiAgICAvL1xyXG4gICAgLy8gIGxlZnRfdGFibGUuaW5uZXJKb2luKCByaWdodF90YWJsZSwgY29uZGl0aW9uMSA8LC4uLiBjb25kaXRpb25OPiApXHJcbiAgICAvL1xyXG4gICAgLy8gIEEgY29uZGl0aW9uIGNhbiB0YWtlIG9uZSBvZiAyIGZvcm1zOlxyXG4gICAgLy9cclxuICAgIC8vICAgIDEuIEFuIEFSUkFZIHdpdGggMiBvciAzIHZhbHVlczpcclxuICAgIC8vICAgIEEgY29sdW1uIG5hbWUgZnJvbSB0aGUgbGVmdCB0YWJsZSwgYW4gb3B0aW9uYWwgY29tcGFyaXNvbiBzdHJpbmcsXHJcbiAgICAvLyAgICBhbmQgY29sdW1uIG5hbWUgZnJvbSB0aGUgcmlnaHQgdGFibGUuICBUaGUgY29uZGl0aW9uIHBhc3NlcyBpZiB0aGUgdGVzdFxyXG4gICAgLy8gICAgaW5kaWNhdGVkIGlzIHRydWUuICAgSWYgdGhlIGNvbmRpdGlvbiBzdHJpbmcgaXMgb21pdHRlZCwgJz09PScgaXMgYXNzdW1lZC5cclxuICAgIC8vICAgIEVYQU1QTEVTOiBbICdsYXN0X3VzZWRfdGltZScsICc+PScsICdjdXJyZW50X3VzZV90aW1lJyBdLCBbICd1c2VyX2lkJywnaWQnIF1cclxuICAgIC8vXHJcbiAgICAvLyAgICAyLiBBIEZVTkNUSU9OOlxyXG4gICAgLy8gICAgVGhlIGZ1bmN0aW9uIHJlY2VpdmVzIGEgbGVmdCB0YWJsZSByb3cgYW5kIHJpZ2h0IHRhYmxlIHJvdyBkdXJpbmcgdGhlXHJcbiAgICAvLyAgICBjYXJ0ZXNpYW4gam9pbi4gIElmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUgZm9yIHRoZSByb3dzIGNvbnNpZGVyZWQsXHJcbiAgICAvLyAgICB0aGUgbWVyZ2VkIHJvdyBpcyBpbmNsdWRlZCBpbiB0aGUgcmVzdWx0IHNldC5cclxuICAgIC8vICAgIEVYQU1QTEU6IGZ1bmN0aW9uIChsLHIpeyByZXR1cm4gbC5uYW1lID09PSByLmxhYmVsOyB9XHJcbiAgICAvL1xyXG4gICAgLy8gIENvbmRpdGlvbnMgYXJlIGNvbnNpZGVyZWQgaW4gdGhlIG9yZGVyIHRoZXkgYXJlIHByZXNlbnRlZC4gIFRoZXJlZm9yZSB0aGUgYmVzdFxyXG4gICAgLy8gIHBlcmZvcm1hbmNlIGlzIHJlYWxpemVkIHdoZW4gdGhlIGxlYXN0IGV4cGVuc2l2ZSBhbmQgaGlnaGVzdCBwcnVuZS1yYXRlXHJcbiAgICAvLyAgY29uZGl0aW9ucyBhcmUgcGxhY2VkIGZpcnN0LCBzaW5jZSBpZiB0aGV5IHJldHVybiBmYWxzZSBUYWZmeSBza2lwcyBhbnlcclxuICAgIC8vICBmdXJ0aGVyIGNvbmRpdGlvbiB0ZXN0cy5cclxuICAgIC8vXHJcbiAgICAvLyAgT3RoZXIgbm90ZXNcclxuICAgIC8vICAqKioqKioqKioqKlxyXG4gICAgLy9cclxuICAgIC8vICBUaGlzIGNvZGUgcGFzc2VzIGpzbGludCB3aXRoIHRoZSBleGNlcHRpb24gb2YgMiB3YXJuaW5ncyBhYm91dFxyXG4gICAgLy8gIHRoZSAnPT0nIGFuZCAnIT0nIGxpbmVzLiAgV2UgY2FuJ3QgZG8gYW55dGhpbmcgYWJvdXQgdGhhdCBzaG9ydCBvZlxyXG4gICAgLy8gIGRlbGV0aW5nIHRoZSBsaW5lcy5cclxuICAgIC8vXHJcbiAgICAvLyAgQ3JlZGl0c1xyXG4gICAgLy8gICoqKioqKipcclxuICAgIC8vXHJcbiAgICAvLyAgSGVhdmlseSBiYXNlZCB1cG9uIHRoZSB3b3JrIG9mIElhbiBUb2x0ei5cclxuICAgIC8vICBSZXZpc2lvbnMgdG8gQVBJIGJ5IE1pY2hhZWwgTWlrb3dza2kuXHJcbiAgICAvLyAgQ29kZSBjb252ZW50aW9uIHBlciBzdGFuZGFyZHMgaW4gaHR0cDovL21hbm5pbmcuY29tL21pa293c2tpXHJcbiAgICAoZnVuY3Rpb24gKCkge1xyXG4gICAgICB2YXIgaW5uZXJKb2luRnVuY3Rpb24gPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBmbkNvbXBhcmVMaXN0LCBmbkNvbWJpbmVSb3csIGZuTWFpbjtcclxuXHJcbiAgICAgICAgZm5Db21wYXJlTGlzdCA9IGZ1bmN0aW9uICggbGVmdF9yb3csIHJpZ2h0X3JvdywgYXJnX2xpc3QgKSB7XHJcbiAgICAgICAgICB2YXIgZGF0YV9sdCwgZGF0YV9ydCwgb3BfY29kZSwgZXJyb3I7XHJcblxyXG4gICAgICAgICAgaWYgKCBhcmdfbGlzdC5sZW5ndGggPT09IDIgKXtcclxuICAgICAgICAgICAgZGF0YV9sdCA9IGxlZnRfcm93W2FyZ19saXN0WzBdXTtcclxuICAgICAgICAgICAgb3BfY29kZSA9ICc9PT0nO1xyXG4gICAgICAgICAgICBkYXRhX3J0ID0gcmlnaHRfcm93W2FyZ19saXN0WzFdXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBkYXRhX2x0ID0gbGVmdF9yb3dbYXJnX2xpc3RbMF1dO1xyXG4gICAgICAgICAgICBvcF9jb2RlID0gYXJnX2xpc3RbMV07XHJcbiAgICAgICAgICAgIGRhdGFfcnQgPSByaWdodF9yb3dbYXJnX2xpc3RbMl1dO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8qanNsaW50IGVxZXEgOiB0cnVlICovXHJcbiAgICAgICAgICBzd2l0Y2ggKCBvcF9jb2RlICl7XHJcbiAgICAgICAgICAgIGNhc2UgJz09PScgOlxyXG4gICAgICAgICAgICAgIHJldHVybiBkYXRhX2x0ID09PSBkYXRhX3J0O1xyXG4gICAgICAgICAgICBjYXNlICchPT0nIDpcclxuICAgICAgICAgICAgICByZXR1cm4gZGF0YV9sdCAhPT0gZGF0YV9ydDtcclxuICAgICAgICAgICAgY2FzZSAnPCcgICA6XHJcbiAgICAgICAgICAgICAgcmV0dXJuIGRhdGFfbHQgPCBkYXRhX3J0O1xyXG4gICAgICAgICAgICBjYXNlICc+JyAgIDpcclxuICAgICAgICAgICAgICByZXR1cm4gZGF0YV9sdCA+IGRhdGFfcnQ7XHJcbiAgICAgICAgICAgIGNhc2UgJzw9JyAgOlxyXG4gICAgICAgICAgICAgIHJldHVybiBkYXRhX2x0IDw9IGRhdGFfcnQ7XHJcbiAgICAgICAgICAgIGNhc2UgJz49JyAgOlxyXG4gICAgICAgICAgICAgIHJldHVybiBkYXRhX2x0ID49IGRhdGFfcnQ7XHJcbiAgICAgICAgICAgIGNhc2UgJz09JyAgOlxyXG4gICAgICAgICAgICAgIHJldHVybiBkYXRhX2x0ID09IGRhdGFfcnQ7XHJcbiAgICAgICAgICAgIGNhc2UgJyE9JyAgOlxyXG4gICAgICAgICAgICAgIHJldHVybiBkYXRhX2x0ICE9IGRhdGFfcnQ7XHJcbiAgICAgICAgICAgIGRlZmF1bHQgOlxyXG4gICAgICAgICAgICAgIHRocm93IFN0cmluZyggb3BfY29kZSApICsgJyBpcyBub3Qgc3VwcG9ydGVkJztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vICdqc2xpbnQgZXFlcSA6IGZhbHNlJyAgaGVyZSByZXN1bHRzIGluXHJcbiAgICAgICAgICAvLyBcIlVucmVhY2hhYmxlICcvKmpzbGludCcgYWZ0ZXIgJ3JldHVybidcIi5cclxuICAgICAgICAgIC8vIFdlIGRvbid0IG5lZWQgaXQgdGhvdWdoLCBhcyB0aGUgcnVsZSBleGNlcHRpb25cclxuICAgICAgICAgIC8vIGlzIGRpc2NhcmRlZCBhdCB0aGUgZW5kIG9mIHRoaXMgZnVuY3Rpb25hbCBzY29wZVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZuQ29tYmluZVJvdyA9IGZ1bmN0aW9uICggbGVmdF9yb3csIHJpZ2h0X3JvdyApIHtcclxuICAgICAgICAgIHZhciBvdXRfbWFwID0ge30sIGksIHByZWZpeDtcclxuXHJcbiAgICAgICAgICBmb3IgKCBpIGluIGxlZnRfcm93ICl7XHJcbiAgICAgICAgICAgIGlmICggbGVmdF9yb3cuaGFzT3duUHJvcGVydHkoIGkgKSApe1xyXG4gICAgICAgICAgICAgIG91dF9tYXBbaV0gPSBsZWZ0X3Jvd1tpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZm9yICggaSBpbiByaWdodF9yb3cgKXtcclxuICAgICAgICAgICAgaWYgKCByaWdodF9yb3cuaGFzT3duUHJvcGVydHkoIGkgKSAmJiBpICE9PSAnX19faWQnICYmXHJcbiAgICAgICAgICAgICAgaSAhPT0gJ19fX3MnIClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIHByZWZpeCA9ICFUQUZGWS5pc1VuZGVmaW5lZCggb3V0X21hcFtpXSApID8gJ3JpZ2h0XycgOiAnJztcclxuICAgICAgICAgICAgICBvdXRfbWFwW3ByZWZpeCArIFN0cmluZyggaSApIF0gPSByaWdodF9yb3dbaV07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiBvdXRfbWFwO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGZuTWFpbiA9IGZ1bmN0aW9uICggdGFibGUgKSB7XHJcbiAgICAgICAgICB2YXJcclxuICAgICAgICAgICAgcmlnaHRfdGFibGUsIGksXHJcbiAgICAgICAgICAgIGFyZ19saXN0ID0gYXJndW1lbnRzLFxyXG4gICAgICAgICAgICBhcmdfbGVuZ3RoID0gYXJnX2xpc3QubGVuZ3RoLFxyXG4gICAgICAgICAgICByZXN1bHRfbGlzdCA9IFtdXHJcbiAgICAgICAgICAgIDtcclxuXHJcbiAgICAgICAgICBpZiAoIHR5cGVvZiB0YWJsZS5maWx0ZXIgIT09ICdmdW5jdGlvbicgKXtcclxuICAgICAgICAgICAgaWYgKCB0YWJsZS5UQUZGWSApeyByaWdodF90YWJsZSA9IHRhYmxlKCk7IH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgdGhyb3cgJ1RBRkZZIERCIG9yIHJlc3VsdCBub3Qgc3VwcGxpZWQnO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHsgcmlnaHRfdGFibGUgPSB0YWJsZTsgfVxyXG5cclxuICAgICAgICAgIHRoaXMuY29udGV4dCgge1xyXG4gICAgICAgICAgICByZXN1bHRzIDogdGhpcy5nZXREQkkoKS5xdWVyeSggdGhpcy5jb250ZXh0KCkgKVxyXG4gICAgICAgICAgfSApO1xyXG5cclxuICAgICAgICAgIFRBRkZZLmVhY2goIHRoaXMuY29udGV4dCgpLnJlc3VsdHMsIGZ1bmN0aW9uICggbGVmdF9yb3cgKSB7XHJcbiAgICAgICAgICAgIHJpZ2h0X3RhYmxlLmVhY2goIGZ1bmN0aW9uICggcmlnaHRfcm93ICkge1xyXG4gICAgICAgICAgICAgIHZhciBhcmdfZGF0YSwgaXNfb2sgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIENPTkRJVElPTjpcclxuICAgICAgICAgICAgICAgIGZvciAoIGkgPSAxOyBpIDwgYXJnX2xlbmd0aDsgaSsrICl7XHJcbiAgICAgICAgICAgICAgICAgIGFyZ19kYXRhID0gYXJnX2xpc3RbaV07XHJcbiAgICAgICAgICAgICAgICAgIGlmICggdHlwZW9mIGFyZ19kYXRhID09PSAnZnVuY3Rpb24nICl7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNfb2sgPSBhcmdfZGF0YSggbGVmdF9yb3csIHJpZ2h0X3JvdyApO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCB0eXBlb2YgYXJnX2RhdGEgPT09ICdvYmplY3QnICYmIGFyZ19kYXRhLmxlbmd0aCApe1xyXG4gICAgICAgICAgICAgICAgICAgIGlzX29rID0gZm5Db21wYXJlTGlzdCggbGVmdF9yb3csIHJpZ2h0X3JvdywgYXJnX2RhdGEgKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpc19vayA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICBpZiAoICFpc19vayApeyBicmVhayBDT05ESVRJT047IH0gLy8gc2hvcnQgY2lyY3VpdFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICBpZiAoIGlzX29rICl7XHJcbiAgICAgICAgICAgICAgICByZXN1bHRfbGlzdC5wdXNoKCBmbkNvbWJpbmVSb3coIGxlZnRfcm93LCByaWdodF9yb3cgKSApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgfSApO1xyXG4gICAgICAgICAgcmV0dXJuIFRBRkZZKCByZXN1bHRfbGlzdCApKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZuTWFpbjtcclxuICAgICAgfSgpKTtcclxuXHJcbiAgICAgIEFQSS5leHRlbmQoICdqb2luJywgaW5uZXJKb2luRnVuY3Rpb24gKTtcclxuICAgIH0oKSk7XHJcblxyXG4gICAgQVBJLmV4dGVuZCggJ21heCcsIGZ1bmN0aW9uICggYyApIHtcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAvLyAqXHJcbiAgICAgIC8vICogVGFrZXM6IGNvbHVtbiB0byBmaW5kIG1heFxyXG4gICAgICAvLyAqIFJldHVybnM6IHRoZSBoaWdoZXN0IHZhbHVlXHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgdmFyIGhpZ2hlc3QgPSBudWxsO1xyXG4gICAgICBydW4uY2FsbCggdGhpcyApO1xyXG4gICAgICBlYWNoKCB0aGlzLmNvbnRleHQoKS5yZXN1bHRzLCBmdW5jdGlvbiAoIHIgKSB7XHJcbiAgICAgICAgaWYgKCBoaWdoZXN0ID09PSBudWxsIHx8IHJbY10gPiBoaWdoZXN0ICl7XHJcbiAgICAgICAgICBoaWdoZXN0ID0gcltjXTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICByZXR1cm4gaGlnaGVzdDtcclxuICAgIH0pO1xyXG5cclxuICAgIEFQSS5leHRlbmQoICdzZWxlY3QnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgLy8gKlxyXG4gICAgICAvLyAqIFRha2VzOiBjb2x1bW5zIHRvIHNlbGVjdCB2YWx1ZXMgaW50byBhbiBhcnJheVxyXG4gICAgICAvLyAqIFJldHVybnM6IGFycmF5IG9mIHZhbHVlc1xyXG4gICAgICAvLyAqIE5vdGUgaWYgbW9yZSB0aGFuIG9uZSBjb2x1bW4gaXMgZ2l2ZW4gYW4gYXJyYXkgb2YgYXJyYXlzIGlzIHJldHVybmVkXHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcblxyXG4gICAgICB2YXIgcmEgPSBbXSwgYXJncyA9IGFyZ3VtZW50cztcclxuICAgICAgcnVuLmNhbGwoIHRoaXMgKTtcclxuICAgICAgaWYgKCBhcmd1bWVudHMubGVuZ3RoID09PSAxICl7XHJcblxyXG4gICAgICAgIGVhY2goIHRoaXMuY29udGV4dCgpLnJlc3VsdHMsIGZ1bmN0aW9uICggciApIHtcclxuXHJcbiAgICAgICAgICByYS5wdXNoKCByW2FyZ3NbMF1dICk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgZWFjaCggdGhpcy5jb250ZXh0KCkucmVzdWx0cywgZnVuY3Rpb24gKCByICkge1xyXG4gICAgICAgICAgdmFyIHJvdyA9IFtdO1xyXG4gICAgICAgICAgZWFjaCggYXJncywgZnVuY3Rpb24gKCBjICkge1xyXG4gICAgICAgICAgICByb3cucHVzaCggcltjXSApO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICByYS5wdXNoKCByb3cgKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmE7XHJcbiAgICB9KTtcclxuICAgIEFQSS5leHRlbmQoICdkaXN0aW5jdCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAvLyAqXHJcbiAgICAgIC8vICogVGFrZXM6IGNvbHVtbnMgdG8gc2VsZWN0IHVuaXF1ZSBhbHVlcyBpbnRvIGFuIGFycmF5XHJcbiAgICAgIC8vICogUmV0dXJuczogYXJyYXkgb2YgdmFsdWVzXHJcbiAgICAgIC8vICogTm90ZSBpZiBtb3JlIHRoYW4gb25lIGNvbHVtbiBpcyBnaXZlbiBhbiBhcnJheSBvZiBhcnJheXMgaXMgcmV0dXJuZWRcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuICAgICAgdmFyIHJhID0gW10sIGFyZ3MgPSBhcmd1bWVudHM7XHJcbiAgICAgIHJ1bi5jYWxsKCB0aGlzICk7XHJcbiAgICAgIGlmICggYXJndW1lbnRzLmxlbmd0aCA9PT0gMSApe1xyXG5cclxuICAgICAgICBlYWNoKCB0aGlzLmNvbnRleHQoKS5yZXN1bHRzLCBmdW5jdGlvbiAoIHIgKSB7XHJcbiAgICAgICAgICB2YXIgdiA9IHJbYXJnc1swXV0sIGR1cCA9IGZhbHNlO1xyXG4gICAgICAgICAgZWFjaCggcmEsIGZ1bmN0aW9uICggZCApIHtcclxuICAgICAgICAgICAgaWYgKCB2ID09PSBkICl7XHJcbiAgICAgICAgICAgICAgZHVwID0gdHJ1ZTtcclxuICAgICAgICAgICAgICByZXR1cm4gVEFGRlkuRVhJVDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBpZiAoICFkdXAgKXtcclxuICAgICAgICAgICAgcmEucHVzaCggdiApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIGVhY2goIHRoaXMuY29udGV4dCgpLnJlc3VsdHMsIGZ1bmN0aW9uICggciApIHtcclxuICAgICAgICAgIHZhciByb3cgPSBbXSwgZHVwID0gZmFsc2U7XHJcbiAgICAgICAgICBlYWNoKCBhcmdzLCBmdW5jdGlvbiAoIGMgKSB7XHJcbiAgICAgICAgICAgIHJvdy5wdXNoKCByW2NdICk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIGVhY2goIHJhLCBmdW5jdGlvbiAoIGQgKSB7XHJcbiAgICAgICAgICAgIHZhciBsZHVwID0gdHJ1ZTtcclxuICAgICAgICAgICAgZWFjaCggYXJncywgZnVuY3Rpb24gKCBjLCBpICkge1xyXG4gICAgICAgICAgICAgIGlmICggcm93W2ldICE9PSBkW2ldICl7XHJcbiAgICAgICAgICAgICAgICBsZHVwID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gVEFGRlkuRVhJVDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpZiAoIGxkdXAgKXtcclxuICAgICAgICAgICAgICBkdXAgPSB0cnVlO1xyXG4gICAgICAgICAgICAgIHJldHVybiBUQUZGWS5FWElUO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIGlmICggIWR1cCApe1xyXG4gICAgICAgICAgICByYS5wdXNoKCByb3cgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcmE7XHJcbiAgICB9KTtcclxuICAgIEFQSS5leHRlbmQoICdzdXBwbGFudCcsIGZ1bmN0aW9uICggdGVtcGxhdGUsIHJldHVybmFycmF5ICkge1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBUYWtlczogYSBzdHJpbmcgdGVtcGxhdGUgZm9ybWF0ZWQgd2l0aCBrZXkgdG8gYmUgcmVwbGFjZWQgd2l0aCB2YWx1ZXMgZnJvbSB0aGUgcm93cywgZmxhZyB0byBkZXRlcm1pbmUgaWYgd2Ugd2FudCBhcnJheSBvZiBzdHJpbmdzXHJcbiAgICAgIC8vICogUmV0dXJuczogYXJyYXkgb2YgdmFsdWVzIG9yIGEgc3RyaW5nXHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcbiAgICAgIHZhciByYSA9IFtdO1xyXG4gICAgICBydW4uY2FsbCggdGhpcyApO1xyXG4gICAgICBlYWNoKCB0aGlzLmNvbnRleHQoKS5yZXN1bHRzLCBmdW5jdGlvbiAoIHIgKSB7XHJcbiAgICAgICAgLy8gVE9ETzogVGhlIGN1cmx5IGJyYWNlcyB1c2VkIHRvIGJlIHVuZXNjYXBlZFxyXG4gICAgICAgIHJhLnB1c2goIHRlbXBsYXRlLnJlcGxhY2UoIC9cXHsoW15cXHtcXH1dKilcXH0vZywgZnVuY3Rpb24gKCBhLCBiICkge1xyXG4gICAgICAgICAgdmFyIHYgPSByW2JdO1xyXG4gICAgICAgICAgcmV0dXJuIHR5cGVvZiB2ID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgdiA9PT0gJ251bWJlcicgPyB2IDogYTtcclxuICAgICAgICB9ICkgKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiAoIXJldHVybmFycmF5KSA/IHJhLmpvaW4oIFwiXCIgKSA6IHJhO1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIEFQSS5leHRlbmQoICdlYWNoJywgZnVuY3Rpb24gKCBtICkge1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBUYWtlczogYSBmdW5jdGlvblxyXG4gICAgICAvLyAqIFB1cnBvc2U6IGxvb3BzIG92ZXIgZXZlcnkgbWF0Y2hpbmcgcmVjb3JkIGFuZCBhcHBsaWVzIHRoZSBmdW5jdGlvblxyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIFxyXG4gICAgICBydW4uY2FsbCggdGhpcyApO1xyXG4gICAgICBlYWNoKCB0aGlzLmNvbnRleHQoKS5yZXN1bHRzLCBtICk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfSk7XHJcbiAgICBBUEkuZXh0ZW5kKCAnbWFwJywgZnVuY3Rpb24gKCBtICkge1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBUYWtlczogYSBmdW5jdGlvblxyXG4gICAgICAvLyAqIFB1cnBvc2U6IGxvb3BzIG92ZXIgZXZlcnkgbWF0Y2hpbmcgcmVjb3JkIGFuZCBhcHBsaWVzIHRoZSBmdW5jdGlvbiwgcmV0dXJpbmcgdGhlIHJlc3VsdHMgaW4gYW4gYXJyYXlcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuICAgICAgdmFyIHJhID0gW107XHJcbiAgICAgIHJ1bi5jYWxsKCB0aGlzICk7XHJcbiAgICAgIGVhY2goIHRoaXMuY29udGV4dCgpLnJlc3VsdHMsIGZ1bmN0aW9uICggciApIHtcclxuICAgICAgICByYS5wdXNoKCBtKCByICkgKTtcclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybiByYTtcclxuICAgIH0pO1xyXG5cclxuXHJcblxyXG4gICAgVCA9IGZ1bmN0aW9uICggZCApIHtcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAvLyAqXHJcbiAgICAgIC8vICogVCBpcyB0aGUgbWFpbiBUQUZGWSBvYmplY3RcclxuICAgICAgLy8gKiBUYWtlczogYW4gYXJyYXkgb2Ygb2JqZWN0cyBvciBKU09OXHJcbiAgICAgIC8vICogUmV0dXJucyBhIG5ldyBUQUZGWURCXHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcbiAgICAgIHZhciBUT2IgPSBbXSxcclxuICAgICAgICBJRCA9IHt9LFxyXG4gICAgICAgIFJDID0gMSxcclxuICAgICAgICBzZXR0aW5ncyA9IHtcclxuICAgICAgICAgIHRlbXBsYXRlICAgICAgICAgIDogZmFsc2UsXHJcbiAgICAgICAgICBvbkluc2VydCAgICAgICAgICA6IGZhbHNlLFxyXG4gICAgICAgICAgb25VcGRhdGUgICAgICAgICAgOiBmYWxzZSxcclxuICAgICAgICAgIG9uUmVtb3ZlICAgICAgICAgIDogZmFsc2UsXHJcbiAgICAgICAgICBvbkRCQ2hhbmdlICAgICAgICA6IGZhbHNlLFxyXG4gICAgICAgICAgc3RvcmFnZU5hbWUgICAgICAgOiBmYWxzZSxcclxuICAgICAgICAgIGZvcmNlUHJvcGVydHlDYXNlIDogbnVsbCxcclxuICAgICAgICAgIGNhY2hlU2l6ZSAgICAgICAgIDogMTAwLFxyXG4gICAgICAgICAgbmFtZSAgICAgICAgICAgICAgOiAnJ1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZG0gPSBuZXcgRGF0ZSgpLFxyXG4gICAgICAgIENhY2hlQ291bnQgPSAwLFxyXG4gICAgICAgIENhY2hlQ2xlYXIgPSAwLFxyXG4gICAgICAgIENhY2hlID0ge30sXHJcbiAgICAgICAgREJJLCBydW5JbmRleGVzLCByb290XHJcbiAgICAgICAgO1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBUT2IgPSB0aGlzIGRhdGFiYXNlXHJcbiAgICAgIC8vICogSUQgPSBjb2xsZWN0aW9uIG9mIHRoZSByZWNvcmQgSURzIGFuZCBsb2NhdGlvbnMgd2l0aGluIHRoZSBEQiwgdXNlZCBmb3IgZmFzdCBsb29rdXBzXHJcbiAgICAgIC8vICogUkMgPSByZWNvcmQgY291bnRlciwgdXNlZCBmb3IgY3JlYXRpbmcgSURzXHJcbiAgICAgIC8vICogc2V0dGluZ3MudGVtcGxhdGUgPSB0aGUgdGVtcGxhdGUgdG8gbWVyZ2UgYWxsIG5ldyByZWNvcmRzIHdpdGhcclxuICAgICAgLy8gKiBzZXR0aW5ncy5vbkluc2VydCA9IGV2ZW50IGdpdmVuIGEgY29weSBvZiB0aGUgbmV3bHkgaW5zZXJ0ZWQgcmVjb3JkXHJcbiAgICAgIC8vICogc2V0dGluZ3Mub25VcGRhdGUgPSBldmVudCBnaXZlbiB0aGUgb3JpZ2luYWwgcmVjb3JkLCB0aGUgY2hhbmdlcywgYW5kIHRoZSBuZXcgcmVjb3JkXHJcbiAgICAgIC8vICogc2V0dGluZ3Mub25SZW1vdmUgPSBldmVudCBnaXZlbiB0aGUgcmVtb3ZlZCByZWNvcmRcclxuICAgICAgLy8gKiBzZXR0aW5ncy5mb3JjZVByb3BlcnR5Q2FzZSA9IG9uIGluc2VydCBmb3JjZSB0aGUgcHJvcHJ0eSBjYXNlIHRvIGJlIGxvd2VyIG9yIHVwcGVyLiBkZWZhdWx0IGxvd2VyLCBudWxsL3VuZGVmaW5lZCB3aWxsIGxlYXZlIGNhc2UgYXMgaXNcclxuICAgICAgLy8gKiBkbSA9IHRoZSBtb2RpZnkgZGF0ZSBvZiB0aGUgZGF0YWJhc2UsIHVzZWQgZm9yIHF1ZXJ5IGNhY2hpbmdcclxuICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuXHJcblxyXG4gICAgICBydW5JbmRleGVzID0gZnVuY3Rpb24gKCBpbmRleGVzICkge1xyXG4gICAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICAvLyAqXHJcbiAgICAgICAgLy8gKiBUYWtlczogYSBjb2xsZWN0aW9uIG9mIGluZGV4ZXNcclxuICAgICAgICAvLyAqIFJldHVybnM6IGNvbGxlY3Rpb24gd2l0aCByZWNvcmRzIG1hdGNoaW5nIGluZGV4ZWQgZmlsdGVyc1xyXG4gICAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcblxyXG4gICAgICAgIHZhciByZWNvcmRzID0gW10sIFVuaXF1ZUVuZm9yY2UgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCBpbmRleGVzLmxlbmd0aCA9PT0gMCApe1xyXG4gICAgICAgICAgcmV0dXJuIFRPYjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVhY2goIGluZGV4ZXMsIGZ1bmN0aW9uICggZiApIHtcclxuICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiByZWNvcmQgSURcclxuICAgICAgICAgIGlmICggVC5pc1N0cmluZyggZiApICYmIC9bdF1bMC05XSpbcl1bMC05XSovaS50ZXN0KCBmICkgJiZcclxuICAgICAgICAgICAgVE9iW0lEW2ZdXSApXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHJlY29yZHMucHVzaCggVE9iW0lEW2ZdXSApO1xyXG4gICAgICAgICAgICBVbmlxdWVFbmZvcmNlID0gdHJ1ZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiByZWNvcmRcclxuICAgICAgICAgIGlmICggVC5pc09iamVjdCggZiApICYmIGYuX19faWQgJiYgZi5fX19zICYmXHJcbiAgICAgICAgICAgIFRPYltJRFtmLl9fX2lkXV0gKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICByZWNvcmRzLnB1c2goIFRPYltJRFtmLl9fX2lkXV0gKTtcclxuICAgICAgICAgICAgVW5pcXVlRW5mb3JjZSA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgYXJyYXkgb2YgaW5kZXhlc1xyXG4gICAgICAgICAgaWYgKCBULmlzQXJyYXkoIGYgKSApe1xyXG4gICAgICAgICAgICBlYWNoKCBmLCBmdW5jdGlvbiAoIHIgKSB7XHJcbiAgICAgICAgICAgICAgZWFjaCggcnVuSW5kZXhlcyggciApLCBmdW5jdGlvbiAoIHJyICkge1xyXG4gICAgICAgICAgICAgICAgcmVjb3Jkcy5wdXNoKCByciApO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKCBVbmlxdWVFbmZvcmNlICYmIHJlY29yZHMubGVuZ3RoID4gMSApe1xyXG4gICAgICAgICAgcmVjb3JkcyA9IFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlY29yZHM7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBEQkkgPSB7XHJcbiAgICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIC8vICpcclxuICAgICAgICAvLyAqIFRoZSBEQkkgaXMgdGhlIGludGVybmFsIERhdGFCYXNlIEludGVyZmFjZSB0aGF0IGludGVyYWN0cyB3aXRoIHRoZSBkYXRhXHJcbiAgICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuICAgICAgICBkbSAgICAgICAgICAgOiBmdW5jdGlvbiAoIG5kICkge1xyXG4gICAgICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgICAgLy8gKlxyXG4gICAgICAgICAgLy8gKiBUYWtlczogYW4gb3B0aW9uYWwgbmV3IG1vZGlmeSBkYXRlXHJcbiAgICAgICAgICAvLyAqIFB1cnBvc2U6IHVzZWQgdG8gZ2V0IGFuZCBzZXQgdGhlIERCIG1vZGlmeSBkYXRlXHJcbiAgICAgICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIFxyXG4gICAgICAgICAgaWYgKCBuZCApe1xyXG4gICAgICAgICAgICBkbSA9IG5kO1xyXG4gICAgICAgICAgICBDYWNoZSA9IHt9O1xyXG4gICAgICAgICAgICBDYWNoZUNvdW50ID0gMDtcclxuICAgICAgICAgICAgQ2FjaGVDbGVhciA9IDA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoIHNldHRpbmdzLm9uREJDaGFuZ2UgKXtcclxuICAgICAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIHNldHRpbmdzLm9uREJDaGFuZ2UuY2FsbCggVE9iICk7XHJcbiAgICAgICAgICAgIH0sIDAgKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICggc2V0dGluZ3Muc3RvcmFnZU5hbWUgKXtcclxuICAgICAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCAndGFmZnlfJyArIHNldHRpbmdzLnN0b3JhZ2VOYW1lLFxyXG4gICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoIFRPYiApICk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuIGRtO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaW5zZXJ0ICAgICAgIDogZnVuY3Rpb24gKCBpLCBydW5FdmVudCApIHtcclxuICAgICAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICAgIC8vICpcclxuICAgICAgICAgIC8vICogVGFrZXM6IGEgbmV3IHJlY29yZCB0byBpbnNlcnRcclxuICAgICAgICAgIC8vICogUHVycG9zZTogbWVyZ2UgdGhlIG9iamVjdCB3aXRoIHRoZSB0ZW1wbGF0ZSwgYWRkIGFuIElELCBpbnNlcnQgaW50byBEQiwgY2FsbCBpbnNlcnQgZXZlbnRcclxuICAgICAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcbiAgICAgICAgICB2YXIgY29sdW1ucyA9IFtdLFxyXG4gICAgICAgICAgICByZWNvcmRzICAgPSBbXSxcclxuICAgICAgICAgICAgaW5wdXQgICAgID0gcHJvdGVjdEpTT04oIGkgKVxyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgICBlYWNoKCBpbnB1dCwgZnVuY3Rpb24gKCB2LCBpICkge1xyXG4gICAgICAgICAgICB2YXIgbnYsIG87XHJcbiAgICAgICAgICAgIGlmICggVC5pc0FycmF5KCB2ICkgJiYgaSA9PT0gMCApe1xyXG4gICAgICAgICAgICAgIGVhY2goIHYsIGZ1bmN0aW9uICggYXYgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgY29sdW1ucy5wdXNoKCAoc2V0dGluZ3MuZm9yY2VQcm9wZXJ0eUNhc2UgPT09ICdsb3dlcicpXHJcbiAgICAgICAgICAgICAgICAgID8gYXYudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIDogKHNldHRpbmdzLmZvcmNlUHJvcGVydHlDYXNlID09PSAndXBwZXInKVxyXG4gICAgICAgICAgICAgICAgICA/IGF2LnRvVXBwZXJDYXNlKCkgOiBhdiApO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBULmlzQXJyYXkoIHYgKSApe1xyXG4gICAgICAgICAgICAgIG52ID0ge307XHJcbiAgICAgICAgICAgICAgZWFjaCggdiwgZnVuY3Rpb24gKCBhdiwgYWkgKSB7XHJcbiAgICAgICAgICAgICAgICBudltjb2x1bW5zW2FpXV0gPSBhdjtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB2ID0gbnY7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBULmlzT2JqZWN0KCB2ICkgJiYgc2V0dGluZ3MuZm9yY2VQcm9wZXJ0eUNhc2UgKXtcclxuICAgICAgICAgICAgICBvID0ge307XHJcblxyXG4gICAgICAgICAgICAgIGVhY2hpbiggdiwgZnVuY3Rpb24gKCBhdiwgYWkgKSB7XHJcbiAgICAgICAgICAgICAgICBvWyhzZXR0aW5ncy5mb3JjZVByb3BlcnR5Q2FzZSA9PT0gJ2xvd2VyJykgPyBhaS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgICAgICAgICAgIDogKHNldHRpbmdzLmZvcmNlUHJvcGVydHlDYXNlID09PSAndXBwZXInKVxyXG4gICAgICAgICAgICAgICAgICA/IGFpLnRvVXBwZXJDYXNlKCkgOiBhaV0gPSB2W2FpXTtcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICB2ID0gbztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgUkMrKztcclxuICAgICAgICAgICAgdi5fX19pZCA9ICdUJyArIFN0cmluZyggaWRwYWQgKyBUQyApLnNsaWNlKCAtNiApICsgJ1InICtcclxuICAgICAgICAgICAgICBTdHJpbmcoIGlkcGFkICsgUkMgKS5zbGljZSggLTYgKTtcclxuICAgICAgICAgICAgdi5fX19zID0gdHJ1ZTtcclxuICAgICAgICAgICAgcmVjb3Jkcy5wdXNoKCB2Ll9fX2lkICk7XHJcbiAgICAgICAgICAgIGlmICggc2V0dGluZ3MudGVtcGxhdGUgKXtcclxuICAgICAgICAgICAgICB2ID0gVC5tZXJnZU9iaiggc2V0dGluZ3MudGVtcGxhdGUsIHYgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBUT2IucHVzaCggdiApO1xyXG5cclxuICAgICAgICAgICAgSURbdi5fX19pZF0gPSBUT2IubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgaWYgKCBzZXR0aW5ncy5vbkluc2VydCAmJlxyXG4gICAgICAgICAgICAgIChydW5FdmVudCB8fCBUQUZGWS5pc1VuZGVmaW5lZCggcnVuRXZlbnQgKSkgKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgc2V0dGluZ3Mub25JbnNlcnQuY2FsbCggdiApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIERCSS5kbSggbmV3IERhdGUoKSApO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICByZXR1cm4gcm9vdCggcmVjb3JkcyApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc29ydCAgICAgICAgIDogZnVuY3Rpb24gKCBvICkge1xyXG4gICAgICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgICAgLy8gKlxyXG4gICAgICAgICAgLy8gKiBQdXJwb3NlOiBDaGFuZ2UgdGhlIHNvcnQgb3JkZXIgb2YgdGhlIERCIGl0c2VsZiBhbmQgcmVzZXQgdGhlIElEIGJ1Y2tldFxyXG4gICAgICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuICAgICAgICAgIFRPYiA9IG9yZGVyQnlDb2woIFRPYiwgby5zcGxpdCggJywnICkgKTtcclxuICAgICAgICAgIElEID0ge307XHJcbiAgICAgICAgICBlYWNoKCBUT2IsIGZ1bmN0aW9uICggciwgaSApIHtcclxuICAgICAgICAgICAgSURbci5fX19pZF0gPSBpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBEQkkuZG0oIG5ldyBEYXRlKCkgKTtcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgdXBkYXRlICAgICAgIDogZnVuY3Rpb24gKCBpZCwgY2hhbmdlcywgcnVuRXZlbnQgKSB7XHJcbiAgICAgICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgICAvLyAqXHJcbiAgICAgICAgICAvLyAqIFRha2VzOiB0aGUgSUQgb2YgcmVjb3JkIGJlaW5nIGNoYW5nZWQgYW5kIHRoZSBjaGFuZ2VzXHJcbiAgICAgICAgICAvLyAqIFB1cnBvc2U6IFVwZGF0ZSBhIHJlY29yZCBhbmQgY2hhbmdlIHNvbWUgb3IgYWxsIHZhbHVlcywgY2FsbCB0aGUgb24gdXBkYXRlIG1ldGhvZFxyXG4gICAgICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxuICAgICAgICAgIHZhciBuYyA9IHt9LCBvciwgbnIsIHRjLCBoYXNDaGFuZ2U7XHJcbiAgICAgICAgICBpZiAoIHNldHRpbmdzLmZvcmNlUHJvcGVydHlDYXNlICl7XHJcbiAgICAgICAgICAgIGVhY2hpbiggY2hhbmdlcywgZnVuY3Rpb24gKCB2LCBwICkge1xyXG4gICAgICAgICAgICAgIG5jWyhzZXR0aW5ncy5mb3JjZVByb3BlcnR5Q2FzZSA9PT0gJ2xvd2VyJykgPyBwLnRvTG93ZXJDYXNlKClcclxuICAgICAgICAgICAgICAgIDogKHNldHRpbmdzLmZvcmNlUHJvcGVydHlDYXNlID09PSAndXBwZXInKSA/IHAudG9VcHBlckNhc2UoKVxyXG4gICAgICAgICAgICAgICAgOiBwXSA9IHY7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBjaGFuZ2VzID0gbmM7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgb3IgPSBUT2JbSURbaWRdXTtcclxuICAgICAgICAgIG5yID0gVC5tZXJnZU9iaiggb3IsIGNoYW5nZXMgKTtcclxuXHJcbiAgICAgICAgICB0YyA9IHt9O1xyXG4gICAgICAgICAgaGFzQ2hhbmdlID0gZmFsc2U7XHJcbiAgICAgICAgICBlYWNoaW4oIG5yLCBmdW5jdGlvbiAoIHYsIGkgKSB7XHJcbiAgICAgICAgICAgIGlmICggVEFGRlkuaXNVbmRlZmluZWQoIG9yW2ldICkgfHwgb3JbaV0gIT09IHYgKXtcclxuICAgICAgICAgICAgICB0Y1tpXSA9IHY7XHJcbiAgICAgICAgICAgICAgaGFzQ2hhbmdlID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBpZiAoIGhhc0NoYW5nZSApe1xyXG4gICAgICAgICAgICBpZiAoIHNldHRpbmdzLm9uVXBkYXRlICYmXHJcbiAgICAgICAgICAgICAgKHJ1bkV2ZW50IHx8IFRBRkZZLmlzVW5kZWZpbmVkKCBydW5FdmVudCApKSApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICBzZXR0aW5ncy5vblVwZGF0ZS5jYWxsKCBuciwgVE9iW0lEW2lkXV0sIHRjICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgVE9iW0lEW2lkXV0gPSBucjtcclxuICAgICAgICAgICAgREJJLmRtKCBuZXcgRGF0ZSgpICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICByZW1vdmUgICAgICAgOiBmdW5jdGlvbiAoIGlkICkge1xyXG4gICAgICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgICAgLy8gKlxyXG4gICAgICAgICAgLy8gKiBUYWtlczogdGhlIElEIG9mIHJlY29yZCB0byBiZSByZW1vdmVkXHJcbiAgICAgICAgICAvLyAqIFB1cnBvc2U6IHJlbW92ZSBhIHJlY29yZCwgY2hhbmdlcyBpdHMgX19fcyB2YWx1ZSB0byBmYWxzZVxyXG4gICAgICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuICAgICAgICAgIFRPYltJRFtpZF1dLl9fX3MgPSBmYWxzZTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlbW92ZUNvbW1pdCA6IGZ1bmN0aW9uICggcnVuRXZlbnQgKSB7XHJcbiAgICAgICAgICB2YXIgeDtcclxuICAgICAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICAgIC8vICpcclxuICAgICAgICAgIC8vICogXHJcbiAgICAgICAgICAvLyAqIFB1cnBvc2U6IGxvb3Agb3ZlciBhbGwgcmVjb3JkcyBhbmQgcmVtb3ZlIHJlY29yZHMgd2l0aCBfX19zID0gZmFsc2UsIGNhbGwgb25SZW1vdmUgZXZlbnQsIGNsZWFyIElEXHJcbiAgICAgICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgICBmb3IgKCB4ID0gVE9iLmxlbmd0aCAtIDE7IHggPiAtMTsgeC0tICl7XHJcblxyXG4gICAgICAgICAgICBpZiAoICFUT2JbeF0uX19fcyApe1xyXG4gICAgICAgICAgICAgIGlmICggc2V0dGluZ3Mub25SZW1vdmUgJiZcclxuICAgICAgICAgICAgICAgIChydW5FdmVudCB8fCBUQUZGWS5pc1VuZGVmaW5lZCggcnVuRXZlbnQgKSkgKVxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNldHRpbmdzLm9uUmVtb3ZlLmNhbGwoIFRPYlt4XSApO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBJRFtUT2JbeF0uX19faWRdID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgIFRPYi5zcGxpY2UoIHgsIDEgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgSUQgPSB7fTtcclxuICAgICAgICAgIGVhY2goIFRPYiwgZnVuY3Rpb24gKCByLCBpICkge1xyXG4gICAgICAgICAgICBJRFtyLl9fX2lkXSA9IGk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICAgIERCSS5kbSggbmV3IERhdGUoKSApO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcXVlcnkgOiBmdW5jdGlvbiAoIGNvbnRleHQgKSB7XHJcbiAgICAgICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgICAvLyAqXHJcbiAgICAgICAgICAvLyAqIFRha2VzOiB0aGUgY29udGV4dCBvYmplY3QgZm9yIGEgcXVlcnkgYW5kIGVpdGhlciByZXR1cm5zIGEgY2FjaGUgcmVzdWx0IG9yIGEgbmV3IHF1ZXJ5IHJlc3VsdFxyXG4gICAgICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuICAgICAgICAgIHZhciByZXR1cm5xLCBjaWQsIHJlc3VsdHMsIGluZGV4ZWQsIGxpbWl0cSwgbmk7XHJcblxyXG4gICAgICAgICAgaWYgKCBzZXR0aW5ncy5jYWNoZVNpemUgKSB7XHJcbiAgICAgICAgICAgIGNpZCA9ICcnO1xyXG4gICAgICAgICAgICBlYWNoKCBjb250ZXh0LmZpbHRlclJhdywgZnVuY3Rpb24gKCByICkge1xyXG4gICAgICAgICAgICAgIGlmICggVC5pc0Z1bmN0aW9uKCByICkgKXtcclxuICAgICAgICAgICAgICAgIGNpZCA9ICdub2NhY2hlJztcclxuICAgICAgICAgICAgICAgIHJldHVybiBUQUZGWS5FWElUO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGlmICggY2lkID09PSAnJyApe1xyXG4gICAgICAgICAgICAgIGNpZCA9IG1ha2VDaWQoIFQubWVyZ2VPYmooIGNvbnRleHQsXHJcbiAgICAgICAgICAgICAgICB7cSA6IGZhbHNlLCBydW4gOiBmYWxzZSwgc29ydCA6IGZhbHNlfSApICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIFJ1biBhIG5ldyBxdWVyeSBpZiB0aGVyZSBhcmUgbm8gcmVzdWx0cyBvciB0aGUgcnVuIGRhdGUgaGFzIGJlZW4gY2xlYXJlZFxyXG4gICAgICAgICAgaWYgKCAhY29udGV4dC5yZXN1bHRzIHx8ICFjb250ZXh0LnJ1biB8fFxyXG4gICAgICAgICAgICAoY29udGV4dC5ydW4gJiYgREJJLmRtKCkgPiBjb250ZXh0LnJ1bikgKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICByZXN1bHRzID0gW107XHJcblxyXG4gICAgICAgICAgICAvLyBjaGVjayBDYWNoZVxyXG5cclxuICAgICAgICAgICAgaWYgKCBzZXR0aW5ncy5jYWNoZVNpemUgJiYgQ2FjaGVbY2lkXSApe1xyXG5cclxuICAgICAgICAgICAgICBDYWNoZVtjaWRdLmkgPSBDYWNoZUNvdW50Kys7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIENhY2hlW2NpZF0ucmVzdWx0cztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyBpZiBubyBmaWx0ZXIsIHJldHVybiBEQlxyXG4gICAgICAgICAgICAgIGlmICggY29udGV4dC5xLmxlbmd0aCA9PT0gMCAmJiBjb250ZXh0LmluZGV4Lmxlbmd0aCA9PT0gMCApe1xyXG4gICAgICAgICAgICAgICAgZWFjaCggVE9iLCBmdW5jdGlvbiAoIHIgKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCggciApO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm5xID0gcmVzdWx0cztcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyB1c2UgaW5kZXhlc1xyXG5cclxuICAgICAgICAgICAgICAgIGluZGV4ZWQgPSBydW5JbmRleGVzKCBjb250ZXh0LmluZGV4ICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gcnVuIGZpbHRlcnNcclxuICAgICAgICAgICAgICAgIGVhY2goIGluZGV4ZWQsIGZ1bmN0aW9uICggciApIHtcclxuICAgICAgICAgICAgICAgICAgLy8gUnVuIGZpbHRlciB0byBzZWUgaWYgcmVjb3JkIG1hdGNoZXMgcXVlcnlcclxuICAgICAgICAgICAgICAgICAgaWYgKCBjb250ZXh0LnEubGVuZ3RoID09PSAwIHx8IHJ1bkZpbHRlcnMoIHIsIGNvbnRleHQucSApICl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKCByICk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybnEgPSByZXN1bHRzO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgLy8gSWYgcXVlcnkgZXhpc3RzIGFuZCBydW4gaGFzIG5vdCBiZWVuIGNsZWFyZWQgcmV0dXJuIHRoZSBjYWNoZSByZXN1bHRzXHJcbiAgICAgICAgICAgIHJldHVybnEgPSBjb250ZXh0LnJlc3VsdHM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBJZiBhIGN1c3RvbSBvcmRlciBhcnJheSBleGlzdHMgYW5kIHRoZSBydW4gaGFzIGJlZW4gY2xlYXIgb3IgdGhlIHNvcnQgaGFzIGJlZW4gY2xlYXJlZFxyXG4gICAgICAgICAgaWYgKCBjb250ZXh0Lm9yZGVyLmxlbmd0aCA+IDAgJiYgKCFjb250ZXh0LnJ1biB8fCAhY29udGV4dC5zb3J0KSApe1xyXG4gICAgICAgICAgICAvLyBvcmRlciB0aGUgcmVzdWx0c1xyXG4gICAgICAgICAgICByZXR1cm5xID0gb3JkZXJCeUNvbCggcmV0dXJucSwgY29udGV4dC5vcmRlciApO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIC8vIElmIGEgbGltaXQgb24gdGhlIG51bWJlciBvZiByZXN1bHRzIGV4aXN0cyBhbmQgaXQgaXMgbGVzcyB0aGFuIHRoZSByZXR1cm5lZCByZXN1bHRzLCBsaW1pdCByZXN1bHRzXHJcbiAgICAgICAgICBpZiAoIHJldHVybnEubGVuZ3RoICYmXHJcbiAgICAgICAgICAgICgoY29udGV4dC5saW1pdCAmJiBjb250ZXh0LmxpbWl0IDwgcmV0dXJucS5sZW5ndGgpIHx8XHJcbiAgICAgICAgICAgICAgY29udGV4dC5zdGFydClcclxuICAgICAgICAgICkge1xyXG4gICAgICAgICAgICBsaW1pdHEgPSBbXTtcclxuICAgICAgICAgICAgZWFjaCggcmV0dXJucSwgZnVuY3Rpb24gKCByLCBpICkge1xyXG4gICAgICAgICAgICAgIGlmICggIWNvbnRleHQuc3RhcnQgfHxcclxuICAgICAgICAgICAgICAgIChjb250ZXh0LnN0YXJ0ICYmIChpICsgMSkgPj0gY29udGV4dC5zdGFydCkgKVxyXG4gICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmICggY29udGV4dC5saW1pdCApe1xyXG4gICAgICAgICAgICAgICAgICBuaSA9IChjb250ZXh0LnN0YXJ0KSA/IChpICsgMSkgLSBjb250ZXh0LnN0YXJ0IDogaTtcclxuICAgICAgICAgICAgICAgICAgaWYgKCBuaSA8IGNvbnRleHQubGltaXQgKXtcclxuICAgICAgICAgICAgICAgICAgICBsaW1pdHEucHVzaCggciApO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBuaSA+IGNvbnRleHQubGltaXQgKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gVEFGRlkuRVhJVDtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIGxpbWl0cS5wdXNoKCByICk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgcmV0dXJucSA9IGxpbWl0cTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAvLyB1cGRhdGUgY2FjaGVcclxuICAgICAgICAgIGlmICggc2V0dGluZ3MuY2FjaGVTaXplICYmIGNpZCAhPT0gJ25vY2FjaGUnICl7XHJcbiAgICAgICAgICAgIENhY2hlQ2xlYXIrKztcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICB2YXIgYkNvdW50ZXIsIG5jO1xyXG4gICAgICAgICAgICAgIGlmICggQ2FjaGVDbGVhciA+PSBzZXR0aW5ncy5jYWNoZVNpemUgKiAyICl7XHJcbiAgICAgICAgICAgICAgICBDYWNoZUNsZWFyID0gMDtcclxuICAgICAgICAgICAgICAgIGJDb3VudGVyID0gQ2FjaGVDb3VudCAtIHNldHRpbmdzLmNhY2hlU2l6ZTtcclxuICAgICAgICAgICAgICAgIG5jID0ge307XHJcbiAgICAgICAgICAgICAgICBlYWNoaW4oIGZ1bmN0aW9uICggciwgayApIHtcclxuICAgICAgICAgICAgICAgICAgaWYgKCByLmkgPj0gYkNvdW50ZXIgKXtcclxuICAgICAgICAgICAgICAgICAgICBuY1trXSA9IHI7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgQ2FjaGUgPSBuYztcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sIDAgKTtcclxuXHJcbiAgICAgICAgICAgIENhY2hlW2NpZF0gPSB7IGkgOiBDYWNoZUNvdW50KyssIHJlc3VsdHMgOiByZXR1cm5xIH07XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gcmV0dXJucTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG5cclxuICAgICAgcm9vdCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgaUFQSSwgY29udGV4dDtcclxuICAgICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgLy8gKlxyXG4gICAgICAgIC8vICogVGhlIHJvb3QgZnVuY3Rpb24gdGhhdCBnZXRzIHJldHVybmVkIHdoZW4gYSBuZXcgREIgaXMgY3JlYXRlZFxyXG4gICAgICAgIC8vICogVGFrZXM6IHVubGltaXRlZCBmaWx0ZXIgYXJndW1lbnRzIGFuZCBjcmVhdGVzIGZpbHRlcnMgdG8gYmUgcnVuIHdoZW4gYSBxdWVyeSBpcyBjYWxsZWRcclxuICAgICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIFxyXG4gICAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICAvLyAqXHJcbiAgICAgICAgLy8gKiBpQVBJIGlzIHRoZSB0aGUgbWV0aG9kIGNvbGxlY3Rpb24gdmFsaWFibGUgd2hlbiBhIHF1ZXJ5IGhhcyBiZWVuIHN0YXJ0ZWQgYnkgY2FsbGluZyBkYm5hbWVcclxuICAgICAgICAvLyAqIENlcnRhaW4gbWV0aG9kcyBhcmUgb3IgYXJlIG5vdCBhdmFsaWFibGUgb25jZSB5b3UgaGF2ZSBzdGFydGVkIGEgcXVlcnkgc3VjaCBhcyBpbnNlcnQgLS0geW91IGNhbiBvbmx5IGluc2VydCBpbnRvIHJvb3RcclxuICAgICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgICAgaUFQSSA9IFRBRkZZLm1lcmdlT2JqKCBUQUZGWS5tZXJnZU9iaiggQVBJLCB7IGluc2VydCA6IHVuZGVmaW5lZCB9ICksXHJcbiAgICAgICAgICB7IGdldERCSSAgOiBmdW5jdGlvbiAoKSB7IHJldHVybiBEQkk7IH0sXHJcbiAgICAgICAgICAgIGdldHJvb3QgOiBmdW5jdGlvbiAoIGMgKSB7IHJldHVybiByb290LmNhbGwoIGMgKTsgfSxcclxuICAgICAgICAgIGNvbnRleHQgOiBmdW5jdGlvbiAoIG4gKSB7XHJcbiAgICAgICAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgICAgICAgLy8gKlxyXG4gICAgICAgICAgICAvLyAqIFRoZSBjb250ZXh0IGNvbnRhaW5zIGFsbCB0aGUgaW5mb3JtYXRpb24gdG8gbWFuYWdlIGEgcXVlcnkgaW5jbHVkaW5nIGZpbHRlcnMsIGxpbWl0cywgYW5kIHNvcnRzXHJcbiAgICAgICAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcbiAgICAgICAgICAgIGlmICggbiApe1xyXG4gICAgICAgICAgICAgIGNvbnRleHQgPSBUQUZGWS5tZXJnZU9iaiggY29udGV4dCxcclxuICAgICAgICAgICAgICAgIG4uaGFzT3duUHJvcGVydHkoJ3Jlc3VsdHMnKVxyXG4gICAgICAgICAgICAgICAgICA/IFRBRkZZLm1lcmdlT2JqKCBuLCB7IHJ1biA6IG5ldyBEYXRlKCksIHNvcnQ6IG5ldyBEYXRlKCkgfSlcclxuICAgICAgICAgICAgICAgICAgOiBuXHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gY29udGV4dDtcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICBleHRlbmQgIDogdW5kZWZpbmVkXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnRleHQgPSAodGhpcyAmJiB0aGlzLnEpID8gdGhpcyA6IHtcclxuICAgICAgICAgIGxpbWl0ICAgICA6IGZhbHNlLFxyXG4gICAgICAgICAgc3RhcnQgICAgIDogZmFsc2UsXHJcbiAgICAgICAgICBxICAgICAgICAgOiBbXSxcclxuICAgICAgICAgIGZpbHRlclJhdyA6IFtdLFxyXG4gICAgICAgICAgaW5kZXggICAgIDogW10sXHJcbiAgICAgICAgICBvcmRlciAgICAgOiBbXSxcclxuICAgICAgICAgIHJlc3VsdHMgICA6IGZhbHNlLFxyXG4gICAgICAgICAgcnVuICAgICAgIDogbnVsbCxcclxuICAgICAgICAgIHNvcnQgICAgICA6IG51bGwsXHJcbiAgICAgICAgICBzZXR0aW5ncyAgOiBzZXR0aW5nc1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIC8vICpcclxuICAgICAgICAvLyAqIENhbGwgdGhlIHF1ZXJ5IG1ldGhvZCB0byBzZXR1cCBhIG5ldyBxdWVyeVxyXG4gICAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcbiAgICAgICAgZWFjaCggYXJndW1lbnRzLCBmdW5jdGlvbiAoIGYgKSB7XHJcblxyXG4gICAgICAgICAgaWYgKCBpc0luZGV4YWJsZSggZiApICl7XHJcbiAgICAgICAgICAgIGNvbnRleHQuaW5kZXgucHVzaCggZiApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnRleHQucS5wdXNoKCByZXR1cm5GaWx0ZXIoIGYgKSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgY29udGV4dC5maWx0ZXJSYXcucHVzaCggZiApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgcmV0dXJuIGlBUEk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBJZiBuZXcgcmVjb3JkcyBoYXZlIGJlZW4gcGFzc2VkIG9uIGNyZWF0aW9uIG9mIHRoZSBEQiBlaXRoZXIgYXMgSlNPTiBvciBhcyBhbiBhcnJheS9vYmplY3QsIGluc2VydCB0aGVtXHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcbiAgICAgIFRDKys7XHJcbiAgICAgIGlmICggZCApe1xyXG4gICAgICAgIERCSS5pbnNlcnQoIGQgKTtcclxuICAgICAgfVxyXG5cclxuXHJcbiAgICAgIHJvb3QuaW5zZXJ0ID0gREJJLmluc2VydDtcclxuXHJcbiAgICAgIHJvb3QubWVyZ2UgPSBmdW5jdGlvbiAoIGksIGtleSwgcnVuRXZlbnQgKSB7XHJcbiAgICAgICAgdmFyXHJcbiAgICAgICAgICBzZWFyY2ggICAgICA9IHt9LFxyXG4gICAgICAgICAgZmluYWxTZWFyY2ggPSBbXSxcclxuICAgICAgICAgIG9iaiAgICAgICAgID0ge31cclxuICAgICAgICAgIDtcclxuXHJcbiAgICAgICAgcnVuRXZlbnQgICAgPSBydW5FdmVudCB8fCBmYWxzZTtcclxuICAgICAgICBrZXkgICAgICAgICA9IGtleSAgICAgIHx8ICdpZCc7XHJcblxyXG4gICAgICAgIGVhY2goIGksIGZ1bmN0aW9uICggbyApIHtcclxuICAgICAgICAgIHZhciBleGlzdGluZ09iamVjdDtcclxuICAgICAgICAgIHNlYXJjaFtrZXldID0gb1trZXldO1xyXG4gICAgICAgICAgZmluYWxTZWFyY2gucHVzaCggb1trZXldICk7XHJcbiAgICAgICAgICBleGlzdGluZ09iamVjdCA9IHJvb3QoIHNlYXJjaCApLmZpcnN0KCk7XHJcbiAgICAgICAgICBpZiAoIGV4aXN0aW5nT2JqZWN0ICl7XHJcbiAgICAgICAgICAgIERCSS51cGRhdGUoIGV4aXN0aW5nT2JqZWN0Ll9fX2lkLCBvLCBydW5FdmVudCApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIERCSS5pbnNlcnQoIG8sIHJ1bkV2ZW50ICk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG9ialtrZXldID0gZmluYWxTZWFyY2g7XHJcbiAgICAgICAgcmV0dXJuIHJvb3QoIG9iaiApO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgcm9vdC5UQUZGWSA9IHRydWU7XHJcbiAgICAgIHJvb3Quc29ydCA9IERCSS5zb3J0O1xyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBUaGVzZSBhcmUgdGhlIG1ldGhvZHMgdGhhdCBjYW4gYmUgYWNjZXNzZWQgb24gb2ZmIHRoZSByb290IERCIGZ1bmN0aW9uLiBFeGFtcGxlIGRibmFtZS5pbnNlcnQ7XHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcbiAgICAgIHJvb3Quc2V0dGluZ3MgPSBmdW5jdGlvbiAoIG4gKSB7XHJcbiAgICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIC8vICpcclxuICAgICAgICAvLyAqIEdldHRpbmcgYW5kIHNldHRpbmcgZm9yIHRoaXMgREIncyBzZXR0aW5ncy9ldmVudHNcclxuICAgICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIFxyXG4gICAgICAgIGlmICggbiApe1xyXG4gICAgICAgICAgc2V0dGluZ3MgPSBUQUZGWS5tZXJnZU9iaiggc2V0dGluZ3MsIG4gKTtcclxuICAgICAgICAgIGlmICggbi50ZW1wbGF0ZSApe1xyXG5cclxuICAgICAgICAgICAgcm9vdCgpLnVwZGF0ZSggbi50ZW1wbGF0ZSApO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2V0dGluZ3M7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAgIC8vICpcclxuICAgICAgLy8gKiBUaGVzZSBhcmUgdGhlIG1ldGhvZHMgdGhhdCBjYW4gYmUgYWNjZXNzZWQgb24gb2ZmIHRoZSByb290IERCIGZ1bmN0aW9uLiBFeGFtcGxlIGRibmFtZS5pbnNlcnQ7XHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcbiAgICAgIHJvb3Quc3RvcmUgPSBmdW5jdGlvbiAoIG4gKSB7XHJcbiAgICAgICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgICAgIC8vICpcclxuICAgICAgICAvLyAqIFNldHVwIGxvY2Fsc3RvcmFnZSBmb3IgdGhpcyBEQiBvbiBhIGdpdmVuIG5hbWVcclxuICAgICAgICAvLyAqIFB1bGwgZGF0YSBpbnRvIHRoZSBEQiBhcyBuZWVkZWRcclxuICAgICAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIFxyXG4gICAgICAgIHZhciByID0gZmFsc2UsIGk7XHJcbiAgICAgICAgaWYgKCBsb2NhbFN0b3JhZ2UgKXtcclxuICAgICAgICAgIGlmICggbiApe1xyXG4gICAgICAgICAgICBpID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oICd0YWZmeV8nICsgbiApO1xyXG4gICAgICAgICAgICBpZiAoIGkgJiYgaS5sZW5ndGggPiAwICl7XHJcbiAgICAgICAgICAgICAgcm9vdC5pbnNlcnQoIGkgKTtcclxuICAgICAgICAgICAgICByID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoIFRPYi5sZW5ndGggPiAwICl7XHJcbiAgICAgICAgICAgICAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oICd0YWZmeV8nICsgc2V0dGluZ3Muc3RvcmFnZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KCBUT2IgKSApO1xyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByb290LnNldHRpbmdzKCB7c3RvcmFnZU5hbWUgOiBufSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcm9vdDtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgICAgLy8gKlxyXG4gICAgICAvLyAqIFJldHVybiByb290IG9uIERCIGNyZWF0aW9uIGFuZCBzdGFydCBoYXZpbmcgZnVuXHJcbiAgICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogXHJcbiAgICAgIHJldHVybiByb290O1xyXG4gICAgfTtcclxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vICpcclxuICAgIC8vICogU2V0cyB0aGUgZ2xvYmFsIFRBRkZZIG9iamVjdFxyXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBcclxuICAgIFRBRkZZID0gVDtcclxuXHJcblxyXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8gKlxyXG4gICAgLy8gKiBDcmVhdGUgcHVibGljIGVhY2ggbWV0aG9kXHJcbiAgICAvLyAqXHJcbiAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICAgXHJcbiAgICBULmVhY2ggPSBlYWNoO1xyXG5cclxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vICpcclxuICAgIC8vICogQ3JlYXRlIHB1YmxpYyBlYWNoaW4gbWV0aG9kXHJcbiAgICAvLyAqXHJcbiAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICAgXHJcbiAgICBULmVhY2hpbiA9IGVhY2hpbjtcclxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vICpcclxuICAgIC8vICogQ3JlYXRlIHB1YmxpYyBleHRlbmQgbWV0aG9kXHJcbiAgICAvLyAqIEFkZCBhIGN1c3RvbSBtZXRob2QgdG8gdGhlIEFQSVxyXG4gICAgLy8gKlxyXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAgIFxyXG4gICAgVC5leHRlbmQgPSBBUEkuZXh0ZW5kO1xyXG5cclxuXHJcbiAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICAvLyAqXHJcbiAgICAvLyAqIENyZWF0ZXMgVEFGRlkuRVhJVCB2YWx1ZSB0aGF0IGNhbiBiZSByZXR1cm5lZCB0byBzdG9wIGFuIGVhY2ggbG9vcFxyXG4gICAgLy8gKlxyXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAgXHJcbiAgICBUQUZGWS5FWElUID0gJ1RBRkZZRVhJVCc7XHJcblxyXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8gKlxyXG4gICAgLy8gKiBDcmVhdGUgcHVibGljIHV0aWxpdHkgbWVyZ2VPYmogbWV0aG9kXHJcbiAgICAvLyAqIFJldHVybiBhIG5ldyBvYmplY3Qgd2hlcmUgaXRlbXMgZnJvbSBvYmoyXHJcbiAgICAvLyAqIGhhdmUgcmVwbGFjZWQgb3IgYmVlbiBhZGRlZCB0byB0aGUgaXRlbXMgaW5cclxuICAgIC8vICogb2JqMVxyXG4gICAgLy8gKiBQdXJwb3NlOiBVc2VkIHRvIGNvbWJpbmUgb2Jqc1xyXG4gICAgLy8gKlxyXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAgIFxyXG4gICAgVEFGRlkubWVyZ2VPYmogPSBmdW5jdGlvbiAoIG9iMSwgb2IyICkge1xyXG4gICAgICB2YXIgYyA9IHt9O1xyXG4gICAgICBlYWNoaW4oIG9iMSwgZnVuY3Rpb24gKCB2LCBuICkgeyBjW25dID0gb2IxW25dOyB9KTtcclxuICAgICAgZWFjaGluKCBvYjIsIGZ1bmN0aW9uICggdiwgbiApIHsgY1tuXSA9IG9iMltuXTsgfSk7XHJcbiAgICAgIHJldHVybiBjO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8gKlxyXG4gICAgLy8gKiBDcmVhdGUgcHVibGljIHV0aWxpdHkgaGFzIG1ldGhvZFxyXG4gICAgLy8gKiBSZXR1cm5zIHRydWUgaWYgYSBjb21wbGV4IG9iamVjdCwgYXJyYXlcclxuICAgIC8vICogb3IgdGFmZnkgY29sbGVjdGlvbiBjb250YWlucyB0aGUgbWF0ZXJpYWxcclxuICAgIC8vICogcHJvdmlkZWQgaW4gdGhlIHNlY29uZCBhcmd1bWVudFxyXG4gICAgLy8gKiBQdXJwb3NlOiBVc2VkIHRvIGNvbWFyZSBvYmplY3RzXHJcbiAgICAvLyAqXHJcbiAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICBUQUZGWS5oYXMgPSBmdW5jdGlvbiAoIHZhcjEsIHZhcjIgKSB7XHJcblxyXG4gICAgICB2YXIgcmUgPSBmYWxzZSwgbjtcclxuXHJcbiAgICAgIGlmICggKHZhcjEuVEFGRlkpICl7XHJcbiAgICAgICAgcmUgPSB2YXIxKCB2YXIyICk7XHJcbiAgICAgICAgaWYgKCByZS5sZW5ndGggPiAwICl7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG5cclxuICAgICAgICBzd2l0Y2ggKCBULnR5cGVPZiggdmFyMSApICl7XHJcbiAgICAgICAgICBjYXNlICdvYmplY3QnOlxyXG4gICAgICAgICAgICBpZiAoIFQuaXNPYmplY3QoIHZhcjIgKSApe1xyXG4gICAgICAgICAgICAgIGVhY2hpbiggdmFyMiwgZnVuY3Rpb24gKCB2LCBuICkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCByZSA9PT0gdHJ1ZSAmJiAhVC5pc1VuZGVmaW5lZCggdmFyMVtuXSApICYmXHJcbiAgICAgICAgICAgICAgICAgIHZhcjEuaGFzT3duUHJvcGVydHkoIG4gKSApXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIHJlID0gVC5oYXMoIHZhcjFbbl0sIHZhcjJbbl0gKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICByZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gVEFGRlkuRVhJVDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICggVC5pc0FycmF5KCB2YXIyICkgKXtcclxuICAgICAgICAgICAgICBlYWNoKCB2YXIyLCBmdW5jdGlvbiAoIHYsIG4gKSB7XHJcbiAgICAgICAgICAgICAgICByZSA9IFQuaGFzKCB2YXIxLCB2YXIyW25dICk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHJlICl7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBUQUZGWS5FWElUO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBULmlzU3RyaW5nKCB2YXIyICkgKXtcclxuICAgICAgICAgICAgICBpZiAoICFUQUZGWS5pc1VuZGVmaW5lZCggdmFyMVt2YXIyXSApICl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZTtcclxuICAgICAgICAgIGNhc2UgJ2FycmF5JzpcclxuICAgICAgICAgICAgaWYgKCBULmlzT2JqZWN0KCB2YXIyICkgKXtcclxuICAgICAgICAgICAgICBlYWNoKCB2YXIxLCBmdW5jdGlvbiAoIHYsIGkgKSB7XHJcbiAgICAgICAgICAgICAgICByZSA9IFQuaGFzKCB2YXIxW2ldLCB2YXIyICk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIHJlID09PSB0cnVlICl7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiBUQUZGWS5FWElUO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKCBULmlzQXJyYXkoIHZhcjIgKSApe1xyXG4gICAgICAgICAgICAgIGVhY2goIHZhcjIsIGZ1bmN0aW9uICggdjIsIGkyICkge1xyXG4gICAgICAgICAgICAgICAgZWFjaCggdmFyMSwgZnVuY3Rpb24gKCB2MSwgaTEgKSB7XHJcbiAgICAgICAgICAgICAgICAgIHJlID0gVC5oYXMoIHZhcjFbaTFdLCB2YXIyW2kyXSApO1xyXG4gICAgICAgICAgICAgICAgICBpZiAoIHJlID09PSB0cnVlICl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFRBRkZZLkVYSVQ7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCByZSA9PT0gdHJ1ZSApe1xyXG4gICAgICAgICAgICAgICAgICByZXR1cm4gVEFGRlkuRVhJVDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICggVC5pc1N0cmluZyggdmFyMiApIHx8IFQuaXNOdW1iZXIoIHZhcjIgKSApe1xyXG4gICAgICAgICAgICAgcmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICBmb3IgKCBuID0gMDsgbiA8IHZhcjEubGVuZ3RoOyBuKysgKXtcclxuICAgICAgICAgICAgICAgIHJlID0gVC5oYXMoIHZhcjFbbl0sIHZhcjIgKTtcclxuICAgICAgICAgICAgICAgIGlmICggcmUgKXtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZTtcclxuICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XHJcbiAgICAgICAgICAgIGlmICggVC5pc1N0cmluZyggdmFyMiApICYmIHZhcjIgPT09IHZhcjEgKXtcclxuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGlmICggVC50eXBlT2YoIHZhcjEgKSA9PT0gVC50eXBlT2YoIHZhcjIgKSAmJiB2YXIxID09PSB2YXIyICl7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8gKlxyXG4gICAgLy8gKiBDcmVhdGUgcHVibGljIHV0aWxpdHkgaGFzQWxsIG1ldGhvZFxyXG4gICAgLy8gKiBSZXR1cm5zIHRydWUgaWYgYSBjb21wbGV4IG9iamVjdCwgYXJyYXlcclxuICAgIC8vICogb3IgdGFmZnkgY29sbGVjdGlvbiBjb250YWlucyB0aGUgbWF0ZXJpYWxcclxuICAgIC8vICogcHJvdmlkZWQgaW4gdGhlIGNhbGwgLSBmb3IgYXJyYXlzIGl0IG11c3RcclxuICAgIC8vICogY29udGFpbiBhbGwgdGhlIG1hdGVyaWFsIGluIGVhY2ggYXJyYXkgaXRlbVxyXG4gICAgLy8gKiBQdXJwb3NlOiBVc2VkIHRvIGNvbWFyZSBvYmplY3RzXHJcbiAgICAvLyAqXHJcbiAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbiAgICBUQUZGWS5oYXNBbGwgPSBmdW5jdGlvbiAoIHZhcjEsIHZhcjIgKSB7XHJcblxyXG4gICAgICB2YXIgVCA9IFRBRkZZLCBhcjtcclxuICAgICAgaWYgKCBULmlzQXJyYXkoIHZhcjIgKSApe1xyXG4gICAgICAgIGFyID0gdHJ1ZTtcclxuICAgICAgICBlYWNoKCB2YXIyLCBmdW5jdGlvbiAoIHYgKSB7XHJcbiAgICAgICAgICBhciA9IFQuaGFzKCB2YXIxLCB2ICk7XHJcbiAgICAgICAgICBpZiAoIGFyID09PSBmYWxzZSApe1xyXG4gICAgICAgICAgICByZXR1cm4gVEFGRlkuRVhJVDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gYXI7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIFQuaGFzKCB2YXIxLCB2YXIyICk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vICpcclxuICAgIC8vICogdHlwZU9mIEZpeGVkIGluIEphdmFTY3JpcHQgYXMgcHVibGljIHV0aWxpdHlcclxuICAgIC8vICpcclxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgIFRBRkZZLnR5cGVPZiA9IGZ1bmN0aW9uICggdiApIHtcclxuICAgICAgdmFyIHMgPSB0eXBlb2YgdjtcclxuICAgICAgaWYgKCBzID09PSAnb2JqZWN0JyApe1xyXG4gICAgICAgIGlmICggdiApe1xyXG4gICAgICAgICAgaWYgKCB0eXBlb2Ygdi5sZW5ndGggPT09ICdudW1iZXInICYmXHJcbiAgICAgICAgICAgICEodi5wcm9wZXJ0eUlzRW51bWVyYWJsZSggJ2xlbmd0aCcgKSkgKVxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzID0gJ2FycmF5JztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBzID0gJ251bGwnO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gcztcclxuICAgIH07XHJcblxyXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8gKlxyXG4gICAgLy8gKiBDcmVhdGUgcHVibGljIHV0aWxpdHkgZ2V0T2JqZWN0S2V5cyBtZXRob2RcclxuICAgIC8vICogUmV0dXJucyBhbiBhcnJheSBvZiBhbiBvYmplY3RzIGtleXNcclxuICAgIC8vICogUHVycG9zZTogVXNlZCB0byBnZXQgdGhlIGtleXMgZm9yIGFuIG9iamVjdFxyXG4gICAgLy8gKlxyXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAgIFxyXG4gICAgVEFGRlkuZ2V0T2JqZWN0S2V5cyA9IGZ1bmN0aW9uICggb2IgKSB7XHJcbiAgICAgIHZhciBrQSA9IFtdO1xyXG4gICAgICBlYWNoaW4oIG9iLCBmdW5jdGlvbiAoIG4sIGggKSB7XHJcbiAgICAgICAga0EucHVzaCggaCApO1xyXG4gICAgICB9KTtcclxuICAgICAga0Euc29ydCgpO1xyXG4gICAgICByZXR1cm4ga0E7XHJcbiAgICB9O1xyXG5cclxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vICpcclxuICAgIC8vICogQ3JlYXRlIHB1YmxpYyB1dGlsaXR5IGlzU2FtZUFycmF5XHJcbiAgICAvLyAqIFJldHVybnMgYW4gYXJyYXkgb2YgYW4gb2JqZWN0cyBrZXlzXHJcbiAgICAvLyAqIFB1cnBvc2U6IFVzZWQgdG8gZ2V0IHRoZSBrZXlzIGZvciBhbiBvYmplY3RcclxuICAgIC8vICpcclxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogICBcclxuICAgIFRBRkZZLmlzU2FtZUFycmF5ID0gZnVuY3Rpb24gKCBhcjEsIGFyMiApIHtcclxuICAgICAgcmV0dXJuIChUQUZGWS5pc0FycmF5KCBhcjEgKSAmJiBUQUZGWS5pc0FycmF5KCBhcjIgKSAmJlxyXG4gICAgICAgIGFyMS5qb2luKCAnLCcgKSA9PT0gYXIyLmpvaW4oICcsJyApKSA/IHRydWUgOiBmYWxzZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8gKlxyXG4gICAgLy8gKiBDcmVhdGUgcHVibGljIHV0aWxpdHkgaXNTYW1lT2JqZWN0IG1ldGhvZFxyXG4gICAgLy8gKiBSZXR1cm5zIHRydWUgaWYgb2JqZWN0cyBjb250YWluIHRoZSBzYW1lXHJcbiAgICAvLyAqIG1hdGVyaWFsIG9yIGZhbHNlIGlmIHRoZXkgZG8gbm90XHJcbiAgICAvLyAqIFB1cnBvc2U6IFVzZWQgdG8gY29tYXJlIG9iamVjdHNcclxuICAgIC8vICpcclxuICAgIC8vICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogICBcclxuICAgIFRBRkZZLmlzU2FtZU9iamVjdCA9IGZ1bmN0aW9uICggb2IxLCBvYjIgKSB7XHJcbiAgICAgIHZhciBUID0gVEFGRlksIHJ2ID0gdHJ1ZTtcclxuXHJcbiAgICAgIGlmICggVC5pc09iamVjdCggb2IxICkgJiYgVC5pc09iamVjdCggb2IyICkgKXtcclxuICAgICAgICBpZiAoIFQuaXNTYW1lQXJyYXkoIFQuZ2V0T2JqZWN0S2V5cyggb2IxICksXHJcbiAgICAgICAgICBULmdldE9iamVjdEtleXMoIG9iMiApICkgKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgIGVhY2hpbiggb2IxLCBmdW5jdGlvbiAoIHYsIG4gKSB7XHJcbiAgICAgICAgICAgIGlmICggISAoIChULmlzT2JqZWN0KCBvYjFbbl0gKSAmJiBULmlzT2JqZWN0KCBvYjJbbl0gKSAmJlxyXG4gICAgICAgICAgICAgIFQuaXNTYW1lT2JqZWN0KCBvYjFbbl0sIG9iMltuXSApKSB8fFxyXG4gICAgICAgICAgICAgIChULmlzQXJyYXkoIG9iMVtuXSApICYmIFQuaXNBcnJheSggb2IyW25dICkgJiZcclxuICAgICAgICAgICAgICAgIFQuaXNTYW1lQXJyYXkoIG9iMVtuXSwgb2IyW25dICkpIHx8IChvYjFbbl0gPT09IG9iMltuXSkgKVxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICBydiA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgIHJldHVybiBUQUZGWS5FWElUO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBydiA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBydiA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBydjtcclxuICAgIH07XHJcblxyXG4gICAgLy8gKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG4gICAgLy8gKlxyXG4gICAgLy8gKiBDcmVhdGUgcHVibGljIHV0aWxpdHkgaXNbRGF0YVR5cGVdIG1ldGhvZHNcclxuICAgIC8vICogUmV0dXJuIHRydWUgaWYgb2JqIGlzIGRhdGF0eXBlLCBmYWxzZSBvdGhlcndpc2VcclxuICAgIC8vICogUHVycG9zZTogVXNlZCB0byBkZXRlcm1pbmUgaWYgYXJndW1lbnRzIGFyZSBvZiBjZXJ0YWluIGRhdGEgdHlwZVxyXG4gICAgLy8gKlxyXG4gICAgLy8gKiBtbWlrb3dza2kgMjAxMi0wOC0wNiByZWZhY3RvcmVkIHRvIG1ha2UgbXVjaCBsZXNzIFwibWFnaWNhbFwiOlxyXG4gICAgLy8gKiAgIGZld2VyIGNsb3N1cmVzIGFuZCBwYXNzZXMganNsaW50XHJcbiAgICAvLyAqXHJcbiAgICAvLyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcblxyXG4gICAgdHlwZUxpc3QgPSBbXHJcbiAgICAgICdTdHJpbmcnLCAgJ051bWJlcicsICdPYmplY3QnLCAgICdBcnJheScsXHJcbiAgICAgICdCb29sZWFuJywgJ051bGwnLCAgICdGdW5jdGlvbicsICdVbmRlZmluZWQnXHJcbiAgICBdO1xyXG4gIFxyXG4gICAgbWFrZVRlc3QgPSBmdW5jdGlvbiAoIHRoaXNLZXkgKSB7XHJcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoIGRhdGEgKSB7XHJcbiAgICAgICAgcmV0dXJuIFRBRkZZLnR5cGVPZiggZGF0YSApID09PSB0aGlzS2V5LnRvTG93ZXJDYXNlKCkgPyB0cnVlIDogZmFsc2U7XHJcbiAgICAgIH07XHJcbiAgICB9O1xyXG4gIFxyXG4gICAgZm9yICggaWR4ID0gMDsgaWR4IDwgdHlwZUxpc3QubGVuZ3RoOyBpZHgrKyApe1xyXG4gICAgICB0eXBlS2V5ID0gdHlwZUxpc3RbaWR4XTtcclxuICAgICAgVEFGRllbJ2lzJyArIHR5cGVLZXldID0gbWFrZVRlc3QoIHR5cGVLZXkgKTtcclxuICAgIH1cclxuICB9XHJcbn0oKSk7XHJcblxyXG5pZiAoIHR5cGVvZihleHBvcnRzKSA9PT0gJ29iamVjdCcgKXtcclxuICBleHBvcnRzLnRhZmZ5ID0gVEFGRlk7XHJcbn1cclxuXHJcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGFuZ3VsYXIgPSByZXF1aXJlKCdhbmd1bGFyJyk7XG52YXIgdGFmZnkgPSByZXF1aXJlKCd0YWZmeWRiJykudGFmZnk7XG5cbm1vZHVsZS5leHBvcnRzID0gdG9kb1N0dWJzO1xuXG5mdW5jdGlvbiB0b2RvU3R1YnMoJGh0dHBCYWNrZW5kLCAkbG9nKSB7XG4gICAgJGxvZy5kZWJ1ZygnW1J1bl0gQWRkaW5nIHRvZG8gc3R1YnMuLi4nKTtcblxuICAgIC8vIFNpbXVsYXRlIENSVUQgaW4gY2xpZW50IHdpdGggVGFmZnlEQlxuICAgIC8vIGh0dHA6Ly93d3cudGFmZnlkYi5jb20vd3JpdGluZ3F1ZXJpZXNcbiAgICB2YXIgdG9kb0RiID0gdGFmZnkoKTtcbiAgICB0b2RvRGIuc3RvcmUoJ3RvZG9zJyk7XG5cbiAgICAvLyBTZWVkIGVtcHR5IGRhdGFcbiAgICBpZiAodG9kb0RiKCkuY291bnQoKSA9PT0gMCkge1xuICAgICAgICB0b2RvRGIuaW5zZXJ0KFtcbiAgICAgICAgICAgIHt0aXRsZTogJ0RvIHNvbWV0aGluZycsIGlzQ29tcGxldGU6IHRydWV9LFxuICAgICAgICAgICAge3RpdGxlOiAnRG8gc29tZXRoaW5nIGVsc2UnLCBpc0NvbXBsZXRlOiBmYWxzZX1cbiAgICAgICAgXSk7XG4gICAgfVxuXG4gICAgLy8gR0VUOiAvdG9kb3NcbiAgICAkaHR0cEJhY2tlbmQud2hlbkdFVCgnL2FwaS90b2RvcycpLnJlc3BvbmQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbMjAwLCB0b2RvRGIoKS5nZXQoKSwge31dO1xuICAgIH0pO1xuXG4gICAgLy8gUE9TVDogL3RvZG9zXG4gICAgJGh0dHBCYWNrZW5kLndoZW5QT1NUKCcvYXBpL3RvZG9zJykucmVzcG9uZChmdW5jdGlvbihtZXRob2QsIHVybCwgZGF0YSkge1xuICAgICAgICB2YXIgdG9kb3MgPSBhbmd1bGFyLmZyb21Kc29uKGRhdGEpO1xuICAgICAgICB0b2RvRGIoKS5yZW1vdmUoKTtcbiAgICAgICAgdG9kb0RiLmluc2VydCh0b2Rvcyk7XG4gICAgICAgIHJldHVybiBbMjAwLCB7IHN0YXR1czogdHJ1ZSB9LCB7fV07XG4gICAgfSk7XG59XG4iLCIvKmpzaGludCAtVzA5OCAqL1xudmFyIGFuZ3VsYXIgPSByZXF1aXJlKCdhbmd1bGFyJyk7XG5yZXF1aXJlKCdhbmd1bGFyLW1vY2tzJyk7XG52YXIgdG9kb1N0dWJzID0gcmVxdWlyZSgnLi9tb2R1bGVzL3RvZG8vdG9kby1zdHVicycpO1xuXG4vLyBDb21tdW5pY2F0ZSB3aXRoIGdsb2JhbGx5IGV4cG9zZWQgYXBwXG52YXIgYXBwID0gd2luZG93LlNQQS5hcHA7XG5hcHAuZGVwZW5kZW5jaWVzLnVuc2hpZnQoJ2FwcFN0dWJzJyk7IC8vIFJ1biBmaXJzdFxuXG5hbmd1bGFyLm1vZHVsZSgnYXBwU3R1YnMnLCBbJ25nTW9ja0UyRSddKS5ydW4oZGVmaW5lRmFrZUJhY2tlbmQpO1xuXG4vLyBAbmdJbmplY3RcbmZ1bmN0aW9uIGRlZmluZUZha2VCYWNrZW5kKCRodHRwQmFja2VuZCwgJGxvZykge1xuICAgICRsb2cuZGVidWcoJ1tSdW5dIEhUVFAgc3R1YnMgc2V0dXAuLi4nKTtcblxuICAgIC8vIExhbmd1YWdlIGJ1bmRsZXNcbiAgICAkaHR0cEJhY2tlbmQud2hlbkdFVCgvXlxcL2xhbmdcXC8vKS5wYXNzVGhyb3VnaCgpO1xuXG4gICAgLy8gVG9kbyBtb2R1bGVcbiAgICB0b2RvU3R1YnMoJGh0dHBCYWNrZW5kLCAkbG9nKTtcbn1cbiJdfQ==
