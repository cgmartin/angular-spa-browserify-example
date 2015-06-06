!function t(e,n,r){function o(s,u){if(!n[s]){if(!e[s]){var a="function"==typeof require&&require;if(!u&&a)return a(s,!0);if(i)return i(s,!0);var c=new Error("Cannot find module '"+s+"'");throw c.code="MODULE_NOT_FOUND",c}var f=n[s]={exports:{}};e[s][0].call(f.exports,function(t){var n=e[s][1][t];return o(n?n:t)},f,f.exports,t,e,n,r)}return n[s].exports}for(var i="function"==typeof require&&require,s=0;s<r.length;s++)o(r[s]);return o}({1:[function(t,e,n){function r(t,e){e.debug("[Run] HTTP stubs setup..."),t.whenGET(/^\/lang\//).passThrough(),i(t,e)}var o=t("angular");t("angular-mocks");var i=t("./todo/todo-stubs"),s=window.SPA.app;s.dependencies.unshift("appStubs"),o.module("appStubs",["ngMockE2E"]).run(r),r.$inject=["$httpBackend","$log"]},{"./todo/todo-stubs":4,angular:"angular","angular-mocks":2}],2:[function(t,e,n){!function(t,e,n){"use strict";function r(t){var e;if(e=t.match(c)){var n=new Date(0),r=0,i=0;return e[9]&&(r=o(e[9]+e[10]),i=o(e[9]+e[11])),n.setUTCFullYear(o(e[1]),o(e[2])-1,o(e[3])),n.setUTCHours(o(e[4]||0)-r,o(e[5]||0)-i,o(e[6]||0),o(e[7]||0)),n}return t}function o(t){return parseInt(t,10)}function i(t,e,n){var r="";for(0>t&&(r="-",t=-t),t=""+t;t.length<e;)t="0"+t;return n&&(t=t.substr(t.length-e)),r+t}function s(t,r,o,i){function s(t,n,r,o){return e.isFunction(t)?t:function(){return e.isNumber(t)?[t,n,r,o]:[200,t,n,r]}}function c(t,s,u,c,f,m,$){function v(t){return e.isString(t)||e.isFunction(t)||t instanceof RegExp?t:e.toJson(t)}function y(e){function o(){var n=e.response(t,s,u,f);w.$$respHeaders=n[2],c(p(n[0]),p(n[1]),w.getAllResponseHeaders(),p(n[3]||""))}function a(){for(var t=0,e=d.length;e>t;t++)if(d[t]===o){d.splice(t,1),c(-1,n,"");break}}return!i&&m&&(m.then?m.then(a):r(a,m)),o}var w=new a,T=h[0],E=!1;if(T&&T.match(t,s)){if(!T.matchData(u))throw new Error("Expected "+T+" with different data\nEXPECTED: "+v(T.data)+"\nGOT:      "+u);if(!T.matchHeaders(f))throw new Error("Expected "+T+" with different headers\nEXPECTED: "+v(T.headers)+"\nGOT:      "+v(f));if(h.shift(),T.response)return void d.push(y(T));E=!0}for(var b,x=-1;b=l[++x];)if(b.match(t,s,u,f||{})){if(b.response)(i?i.defer:g)(y(b));else{if(!b.passThrough)throw new Error("No response defined !");o(t,s,u,c,f,m,$)}return}throw new Error(E?"No response defined !":"Unexpected request: "+t+" "+s+"\n"+(T?"Expected "+T:"No more request expected"))}function f(t){e.forEach(["GET","DELETE","JSONP","HEAD"],function(e){c[t+e]=function(r,o){return c[t](e,r,n,o)}}),e.forEach(["PUT","POST","PATCH"],function(e){c[t+e]=function(n,r,o){return c[t](e,n,r,o)}})}var l=[],h=[],d=[],g=e.bind(d,d.push),p=e.copy;return c.when=function(t,e,r,o){var a=new u(t,e,r,o),c={respond:function(t,e,r,o){return a.passThrough=n,a.response=s(t,e,r,o),c}};return i&&(c.passThrough=function(){return a.response=n,a.passThrough=!0,c}),l.push(a),c},f("when"),c.expect=function(t,e,n,r){var o=new u(t,e,n,r),i={respond:function(t,e,n,r){return o.response=s(t,e,n,r),i}};return h.push(o),i},f("expect"),c.flush=function(n,r){if(r!==!1&&t.$digest(),!d.length)throw new Error("No pending request to flush !");if(e.isDefined(n)&&null!==n)for(;n--;){if(!d.length)throw new Error("No more pending request to flush !");d.shift()()}else for(;d.length;)d.shift()();c.verifyNoOutstandingExpectation(r)},c.verifyNoOutstandingExpectation=function(e){if(e!==!1&&t.$digest(),h.length)throw new Error("Unsatisfied requests: "+h.join(", "))},c.verifyNoOutstandingRequest=function(){if(d.length)throw new Error("Unflushed requests: "+d.length)},c.resetExpectations=function(){h.length=0,d.length=0},c}function u(t,n,r,o){this.data=r,this.headers=o,this.match=function(n,r,o,i){return t!=n?!1:this.matchUrl(r)?e.isDefined(o)&&!this.matchData(o)?!1:e.isDefined(i)&&!this.matchHeaders(i)?!1:!0:!1},this.matchUrl=function(t){return n?e.isFunction(n.test)?n.test(t):e.isFunction(n)?n(t):n==t:!0},this.matchHeaders=function(t){return e.isUndefined(o)?!0:e.isFunction(o)?o(t):e.equals(o,t)},this.matchData=function(t){return e.isUndefined(r)?!0:r&&e.isFunction(r.test)?r.test(t):r&&e.isFunction(r)?r(t):r&&!e.isString(r)?e.equals(e.fromJson(e.toJson(r)),e.fromJson(t)):r==t},this.toString=function(){return t+" "+n}}function a(){a.$$lastInstance=this,this.open=function(t,e,n){this.$$method=t,this.$$url=e,this.$$async=n,this.$$reqHeaders={},this.$$respHeaders={}},this.send=function(t){this.$$data=t},this.setRequestHeader=function(t,e){this.$$reqHeaders[t]=e},this.getResponseHeader=function(t){var r=this.$$respHeaders[t];return r?r:(t=e.lowercase(t),(r=this.$$respHeaders[t])?r:(r=n,e.forEach(this.$$respHeaders,function(n,o){r||e.lowercase(o)!=t||(r=n)}),r))},this.getAllResponseHeaders=function(){var t=[];return e.forEach(this.$$respHeaders,function(e,n){t.push(n+": "+e)}),t.join("\n")},this.abort=e.noop}e.mock={},e.mock.$BrowserProvider=function(){this.$get=function(){return new e.mock.$Browser}},e.mock.$Browser=function(){var t=this;this.isMock=!0,t.$$url="http://server/",t.$$lastUrl=t.$$url,t.pollFns=[],t.$$completeOutstandingRequest=e.noop,t.$$incOutstandingRequestCount=e.noop,t.onUrlChange=function(e){return t.pollFns.push(function(){(t.$$lastUrl!==t.$$url||t.$$state!==t.$$lastState)&&(t.$$lastUrl=t.$$url,t.$$lastState=t.$$state,e(t.$$url,t.$$state))}),e},t.$$applicationDestroyed=e.noop,t.$$checkUrlChange=e.noop,t.deferredFns=[],t.deferredNextId=0,t.defer=function(e,n){return n=n||0,t.deferredFns.push({time:t.defer.now+n,fn:e,id:t.deferredNextId}),t.deferredFns.sort(function(t,e){return t.time-e.time}),t.deferredNextId++},t.defer.now=0,t.defer.cancel=function(r){var o;return e.forEach(t.deferredFns,function(t,e){t.id===r&&(o=e)}),o!==n?(t.deferredFns.splice(o,1),!0):!1},t.defer.flush=function(n){if(e.isDefined(n))t.defer.now+=n;else{if(!t.deferredFns.length)throw new Error("No deferred tasks to be flushed");t.defer.now=t.deferredFns[t.deferredFns.length-1].time}for(;t.deferredFns.length&&t.deferredFns[0].time<=t.defer.now;)t.deferredFns.shift().fn()},t.$$baseHref="/",t.baseHref=function(){return this.$$baseHref}},e.mock.$Browser.prototype={poll:function(){e.forEach(this.pollFns,function(t){t()})},url:function(t,n,r){return e.isUndefined(r)&&(r=null),t?(this.$$url=t,this.$$state=e.copy(r),this):this.$$url},state:function(){return this.$$state},notifyWhenNoOutstandingRequests:function(t){t()}},e.mock.$ExceptionHandlerProvider=function(){var t;this.mode=function(e){switch(e){case"log":case"rethrow":var n=[];t=function(t){if(n.push(1==arguments.length?t:[].slice.call(arguments,0)),"rethrow"===e)throw t},t.errors=n;break;default:throw new Error("Unknown mode '"+e+"', only 'log'/'rethrow' modes are allowed!")}},this.$get=function(){return t},this.mode("rethrow")},e.mock.$LogProvider=function(){function t(t,e,n){return t.concat(Array.prototype.slice.call(e,n))}var n=!0;this.debugEnabled=function(t){return e.isDefined(t)?(n=t,this):n},this.$get=function(){var r={log:function(){r.log.logs.push(t([],arguments,0))},warn:function(){r.warn.logs.push(t([],arguments,0))},info:function(){r.info.logs.push(t([],arguments,0))},error:function(){r.error.logs.push(t([],arguments,0))},debug:function(){n&&r.debug.logs.push(t([],arguments,0))}};return r.reset=function(){r.log.logs=[],r.info.logs=[],r.warn.logs=[],r.error.logs=[],r.debug.logs=[]},r.assertEmpty=function(){var t=[];if(e.forEach(["error","warn","info","log","debug"],function(n){e.forEach(r[n].logs,function(r){e.forEach(r,function(e){t.push("MOCK $log ("+n+"): "+String(e)+"\n"+(e.stack||""))})})}),t.length)throw t.unshift("Expected $log to be empty! Either a message was logged unexpectedly, or an expected log message was not checked and removed:"),t.push(""),new Error(t.join("\n---------\n"))},r.reset(),r}},e.mock.$IntervalProvider=function(){this.$get=["$browser","$rootScope","$q","$$q",function(t,r,o,i){var s=[],u=0,a=0,c=function(c,f,l,h){function d(){if(v.notify(m++),l>0&&m>=l){var o;v.resolve(m),e.forEach(s,function(t,e){t.id===y.$$intervalId&&(o=e)}),o!==n&&s.splice(o,1)}$?t.defer.flush():r.$apply()}var g=arguments.length>4,p=g?Array.prototype.slice.call(arguments,4):[],m=0,$=e.isDefined(h)&&!h,v=($?i:o).defer(),y=v.promise;return l=e.isDefined(l)?l:0,y.then(null,null,g?function(){c.apply(null,p)}:c),y.$$intervalId=u,s.push({nextTime:a+f,delay:f,fn:d,id:u,deferred:v}),s.sort(function(t,e){return t.nextTime-e.nextTime}),u++,y};return c.cancel=function(t){if(!t)return!1;var r;return e.forEach(s,function(e,n){e.id===t.$$intervalId&&(r=n)}),r!==n?(s[r].deferred.reject("canceled"),s.splice(r,1),!0):!1},c.flush=function(t){for(a+=t;s.length&&s[0].nextTime<=a;){var e=s[0];e.fn(),e.nextTime+=e.delay,s.sort(function(t,e){return t.nextTime-e.nextTime})}return t},c}]};var c=/^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?:\:?(\d\d)(?:\:?(\d\d)(?:\.(\d{3}))?)?)?(Z|([+-])(\d\d):?(\d\d)))?$/;if(e.mock.TzDate=function(t,n){var o=new Date(0);if(e.isString(n)){var s=n;if(o.origDate=r(n),n=o.origDate.getTime(),isNaN(n))throw{name:"Illegal Argument",message:"Arg '"+s+"' passed into TzDate constructor is not a valid date string"}}else o.origDate=new Date(n);var u=new Date(n).getTimezoneOffset();o.offsetDiff=60*u*1e3-1e3*t*60*60,o.date=new Date(n+o.offsetDiff),o.getTime=function(){return o.date.getTime()-o.offsetDiff},o.toLocaleDateString=function(){return o.date.toLocaleDateString()},o.getFullYear=function(){return o.date.getFullYear()},o.getMonth=function(){return o.date.getMonth()},o.getDate=function(){return o.date.getDate()},o.getHours=function(){return o.date.getHours()},o.getMinutes=function(){return o.date.getMinutes()},o.getSeconds=function(){return o.date.getSeconds()},o.getMilliseconds=function(){return o.date.getMilliseconds()},o.getTimezoneOffset=function(){return 60*t},o.getUTCFullYear=function(){return o.origDate.getUTCFullYear()},o.getUTCMonth=function(){return o.origDate.getUTCMonth()},o.getUTCDate=function(){return o.origDate.getUTCDate()},o.getUTCHours=function(){return o.origDate.getUTCHours()},o.getUTCMinutes=function(){return o.origDate.getUTCMinutes()},o.getUTCSeconds=function(){return o.origDate.getUTCSeconds()},o.getUTCMilliseconds=function(){return o.origDate.getUTCMilliseconds()},o.getDay=function(){return o.date.getDay()},o.toISOString&&(o.toISOString=function(){return i(o.origDate.getUTCFullYear(),4)+"-"+i(o.origDate.getUTCMonth()+1,2)+"-"+i(o.origDate.getUTCDate(),2)+"T"+i(o.origDate.getUTCHours(),2)+":"+i(o.origDate.getUTCMinutes(),2)+":"+i(o.origDate.getUTCSeconds(),2)+"."+i(o.origDate.getUTCMilliseconds(),3)+"Z"});var a=["getUTCDay","getYear","setDate","setFullYear","setHours","setMilliseconds","setMinutes","setMonth","setSeconds","setTime","setUTCDate","setUTCFullYear","setUTCHours","setUTCMilliseconds","setUTCMinutes","setUTCMonth","setUTCSeconds","setYear","toDateString","toGMTString","toJSON","toLocaleFormat","toLocaleString","toLocaleTimeString","toSource","toString","toTimeString","toUTCString","valueOf"];return e.forEach(a,function(t){o[t]=function(){throw new Error("Method '"+t+"' is not implemented in the TzDate mock")}}),o},e.mock.TzDate.prototype=Date.prototype,e.mock.animate=e.module("ngAnimateMock",["ng"]).config(["$provide",function(t){var n=[];t.value("$$animateReflow",function(t){var e=n.length;return n.push(t),function(){n.splice(e,1)}}),t.decorator("$animate",["$delegate","$$asyncCallback","$timeout","$browser","$$rAF",function(t,r,o,i,s){var u={queue:[],cancel:t.cancel,enabled:t.enabled,triggerCallbackEvents:function(){s.flush(),r.flush()},triggerCallbackPromise:function(){o.flush(0)},triggerCallbacks:function(){this.triggerCallbackEvents(),this.triggerCallbackPromise()},triggerReflow:function(){e.forEach(n,function(t){t()}),n=[]}};return e.forEach(["animate","enter","leave","move","addClass","removeClass","setClass"],function(e){u[e]=function(){return u.queue.push({event:e,element:arguments[0],options:arguments[arguments.length-1],args:arguments}),t[e].apply(t,arguments)}}),u}])}]),e.mock.dump=function(t){function n(t){var o;return e.isElement(t)?(t=e.element(t),o=e.element("<div></div>"),e.forEach(t,function(t){o.append(e.element(t).clone())}),o=o.html()):e.isArray(t)?(o=[],e.forEach(t,function(t){o.push(n(t))}),o="[ "+o.join(", ")+" ]"):o=e.isObject(t)?e.isFunction(t.$eval)&&e.isFunction(t.$apply)?r(t):t instanceof Error?t.stack||""+t.name+": "+t.message:e.toJson(t,!0):String(t),o}function r(t,n){n=n||"  ";var o=[n+"Scope("+t.$id+"): {"];for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&!i.match(/^(\$|this)/)&&o.push("  "+i+": "+e.toJson(t[i]));for(var s=t.$$childHead;s;)o.push(r(s,n+"  ")),s=s.$$nextSibling;return o.push("}"),o.join("\n"+n)}return n(t)},e.mock.$HttpBackendProvider=function(){this.$get=["$rootScope","$timeout",s]},e.mock.$TimeoutDecorator=["$delegate","$browser",function(t,n){function r(t){var n=[];return e.forEach(t,function(t){n.push("{id: "+t.id+", time: "+t.time+"}")}),n.join(", ")}return t.flush=function(t){n.defer.flush(t)},t.verifyNoPendingTasks=function(){if(n.deferredFns.length)throw new Error("Deferred tasks to flush ("+n.deferredFns.length+"): "+r(n.deferredFns))},t}],e.mock.$RAFDecorator=["$delegate",function(t){var e=[],n=function(t){var n=e.length;return e.push(t),function(){e.splice(n,1)}};return n.supported=t.supported,n.flush=function(){if(0===e.length)throw new Error("No rAF callbacks present");for(var t=e.length,n=0;t>n;n++)e[n]();e=e.slice(n)},n}],e.mock.$AsyncCallbackDecorator=["$delegate",function(t){var n=[],r=function(t){n.push(t)};return r.flush=function(){e.forEach(n,function(t){t()}),n=[]},r}],e.mock.$RootElementProvider=function(){this.$get=function(){return e.element("<div ng-app></div>")}},e.mock.$ControllerDecorator=["$delegate",function(t){return function(n,r,o,i){if(o&&"object"==typeof o){var s=t(n,r,!0,i);return e.extend(s.instance,o),s()}return t(n,r,o,i)}}],e.module("ngMock",["ng"]).provider({$browser:e.mock.$BrowserProvider,$exceptionHandler:e.mock.$ExceptionHandlerProvider,$log:e.mock.$LogProvider,$interval:e.mock.$IntervalProvider,$httpBackend:e.mock.$HttpBackendProvider,$rootElement:e.mock.$RootElementProvider}).config(["$provide",function(t){t.decorator("$timeout",e.mock.$TimeoutDecorator),t.decorator("$$rAF",e.mock.$RAFDecorator),t.decorator("$$asyncCallback",e.mock.$AsyncCallbackDecorator),t.decorator("$rootScope",e.mock.$RootScopeDecorator),t.decorator("$controller",e.mock.$ControllerDecorator)}]),e.module("ngMockE2E",["ng"]).config(["$provide",function(t){t.decorator("$httpBackend",e.mock.e2e.$httpBackendDecorator)}]),e.mock.e2e={},e.mock.e2e.$httpBackendDecorator=["$rootScope","$timeout","$delegate","$browser",s],e.mock.$RootScopeDecorator=["$delegate",function(t){function e(){for(var t,e=0,n=[this.$$childHead];n.length;)for(t=n.shift();t;)e+=1,n.push(t.$$childHead),t=t.$$nextSibling;return e}function n(){for(var t,e=this.$$watchers?this.$$watchers.length:0,n=[this.$$childHead];n.length;)for(t=n.shift();t;)e+=t.$$watchers?t.$$watchers.length:0,n.push(t.$$childHead),t=t.$$nextSibling;return e}var r=Object.getPrototypeOf(t);return r.$countChildScopes=e,r.$countWatchers=n,t}],t.jasmine||t.mocha){var f=null,l=[],h=function(){return!!f};e.mock.$$annotate=e.injector.$$annotate,e.injector.$$annotate=function(t){return"function"!=typeof t||t.$inject||l.push(t),e.mock.$$annotate.apply(this,arguments)},(t.beforeEach||t.setup)(function(){l=[],f=this}),(t.afterEach||t.teardown)(function(){var t=f.$injector;l.forEach(function(t){delete t.$inject}),e.forEach(f.$modules,function(t){t&&t.$$hashKey&&(t.$$hashKey=n)}),f.$injector=null,f.$modules=null,f=null,t&&t.get("$rootElement").off(),e.forEach(e.element.fragments,function(t,n){delete e.element.fragments[n]}),a.$$lastInstance=null,e.forEach(e.callbacks,function(t,n){delete e.callbacks[n]}),e.callbacks.counter=0}),t.module=e.mock.module=function(){function t(){if(f.$injector)throw new Error("Injector already created, can not register a module!");var t=f.$modules||(f.$modules=[]);e.forEach(n,function(n){t.push(e.isObject(n)&&!e.isArray(n)?function(t){e.forEach(n,function(e,n){t.value(n,e)})}:n)})}var n=Array.prototype.slice.call(arguments,0);return h()?t():t};var d=function(t,e){this.message=t.message,this.name=t.name,t.line&&(this.line=t.line),t.sourceId&&(this.sourceId=t.sourceId),t.stack&&e&&(this.stack=t.stack+"\n"+e.stack),t.stackArray&&(this.stackArray=t.stackArray)};d.prototype.toString=Error.prototype.toString,t.inject=e.mock.inject=function(){function t(){var t=f.$modules||[],o=!!f.$injectorStrict;t.unshift("ngMock"),t.unshift("ng");var i=f.$injector;i||(o&&e.forEach(t,function(t){"function"==typeof t&&e.injector.$$annotate(t)}),i=f.$injector=e.injector(t,o),f.$injectorStrict=o);for(var s=0,u=n.length;u>s;s++){f.$injectorStrict&&i.annotate(n[s]);try{i.invoke(n[s]||e.noop,this)}catch(a){if(a.stack&&r)throw new d(a,r);throw a}finally{r=null}}}var n=Array.prototype.slice.call(arguments,0),r=new Error("Declaration Location");return h()?t.call(f):t},e.mock.inject.strictDi=function(t){function e(){if(t!==f.$injectorStrict){if(f.$injector)throw new Error("Injector already created, can not modify strict annotations");f.$injectorStrict=t}}return t=arguments.length?!!t:!0,h()?e():e}}}(window,window.angular)},{}],3:[function(t,e,n){var r,n,o;!function(){"use strict";var t,e,n,i,s,u,a,c,f,l,h,d,g,p,m,$,v,y,w,T,E,b,x;if(!r)for(s="2.7",u=1,a="000000",c=1e3,f={},l=function(t){return r.isArray(t)||r.isObject(t)?t:JSON.parse(t)},w=function(t,e){return T(t,function(t){return e.indexOf(t)>=0})},T=function(t,e,n){var r=[];return null==t?r:Array.prototype.filter&&t.filter===Array.prototype.filter?t.filter(e,n):(h(t,function(t,o,i){e.call(n,t,o,i)&&(r[r.length]=t)}),r)},x=function(t){return"[object RegExp]"===Object.prototype.toString.call(t)},b=function(t){var e=o.isArray(t)?[]:o.isObject(t)?{}:null;if(null===t)return t;for(var n in t)e[n]=x(t[n])?t[n].toString():o.isArray(t[n])||o.isObject(t[n])?b(t[n]):t[n];return e},E=function(t){var e=JSON.stringify(t);return null===e.match(/regex/)?e:JSON.stringify(b(t))},h=function(t,e,n){var r,i,s,u;if(t&&(o.isArray(t)&&1===t.length||!o.isArray(t)))e(o.isArray(t)?t[0]:t,0);else for(s=0,t=o.isArray(t)?t:[t],u=t.length;u>s&&(i=t[s],o.isUndefined(i)&&!n||(r=e(i,s),r!==o.EXIT));s++);},d=function(t,e){var n,r,i=0;for(r in t)if(t.hasOwnProperty(r)&&(n=e(t[r],r,i++),n===o.EXIT))break},f.extend=function(t,e){f[t]=function(){return e.apply(this,arguments)}},g=function(t){var e;return o.isString(t)&&/[t][0-9]*[r][0-9]*/i.test(t)?!0:o.isObject(t)&&t.___id&&t.___s?!0:o.isArray(t)?(e=!0,h(t,function(t){return g(t)?void 0:(e=!1,r.EXIT)}),e):!1},m=function(t,e){var n=!0;return h(e,function(e){switch(o.typeOf(e)){case"function":if(!e.apply(t))return n=!1,r.EXIT;break;case"array":n=1===e.length?m(t,e[0]):2===e.length?m(t,e[0])||m(t,e[1]):3===e.length?m(t,e[0])||m(t,e[1])||m(t,e[2]):4===e.length?m(t,e[0])||m(t,e[1])||m(t,e[2])||m(t,e[3]):!1,e.length>4&&h(e,function(e){m(t,e)&&(n=!0)})}}),n},p=function(t){var e=[];return o.isString(t)&&/[t][0-9]*[r][0-9]*/i.test(t)&&(t={___id:t}),o.isArray(t)?(h(t,function(t){e.push(p(t))}),t=function(){var t=this,n=!1;return h(e,function(e){m(t,e)&&(n=!0)}),n}):o.isObject(t)?(o.isObject(t)&&t.___id&&t.___s&&(t={___id:t.___id}),d(t,function(t,n){o.isObject(t)||(t={is:t}),d(t,function(t,i){var s,u=[];s="hasAll"===i?function(t,e){e(t)}:h,s(t,function(t){var e,s=!0;e=function(){var e,u=this[n],a="==",c="!=",f="===",l="<",h=">",d="<=",g=">=",p="!==";return"undefined"==typeof u?!1:(0===i.indexOf("!")&&i!==c&&i!==p&&(s=!1,i=i.substring(1,i.length)),e="regex"===i?t.test(u):"lt"===i||i===l?t>u:"gt"===i||i===h?u>t:"lte"===i||i===d?t>=u:"gte"===i||i===g?u>=t:"left"===i?0===u.indexOf(t):"leftnocase"===i?0===u.toLowerCase().indexOf(t.toLowerCase()):"right"===i?u.substring(u.length-t.length)===t:"rightnocase"===i?u.toLowerCase().substring(u.length-t.length)===t.toLowerCase():"like"===i?u.indexOf(t)>=0:"likenocase"===i?u.toLowerCase().indexOf(t.toLowerCase())>=0:i===f||"is"===i?u===t:i===a?u==t:i===p?u!==t:i===c?u!=t:"isnocase"===i?u.toLowerCase?u.toLowerCase()===t.toLowerCase():u===t:"has"===i?o.has(u,t):"hasall"===i?o.hasAll(u,t):"contains"===i?r.isArray(u)&&u.indexOf(t)>-1:-1!==i.indexOf("is")||r.isNull(u)||r.isUndefined(u)||r.isObject(t)||r.isArray(t)?o[i]&&o.isFunction(o[i])&&0===i.indexOf("is")?o[i](u)===t:o[i]&&o.isFunction(o[i])?o[i](u,t):!1:t===u[i],e=e&&!s?!1:e||s?e:!0)},u.push(e)}),e.push(1===u.length?u[0]:function(){var t=this,e=!1;return h(u,function(n){n.apply(t)&&(e=!0)}),e})})}),t=function(){var t=this,n=!0;return n=(1!==e.length||e[0].apply(t))&&(2!==e.length||e[0].apply(t)&&e[1].apply(t))&&(3!==e.length||e[0].apply(t)&&e[1].apply(t)&&e[2].apply(t))&&(4!==e.length||e[0].apply(t)&&e[1].apply(t)&&e[2].apply(t)&&e[3].apply(t))?!0:!1,e.length>4&&h(e,function(e){m(t,e)||(n=!1)}),n}):o.isFunction(t)?t:void 0},v=function(t,e){var n=function(t,n){var i=0;return o.each(e,function(e){var s,u,a,c,f;if(s=e.split(" "),u=s[0],a=1===s.length?"logical":s[1],"logical"===a)c=$(t[u]),f=$(n[u]),o.each(c.length<=f.length?c:f,function(t,e){return c[e]<f[e]?(i=-1,r.EXIT):c[e]>f[e]?(i=1,r.EXIT):void 0});else if("logicaldesc"===a)c=$(t[u]),f=$(n[u]),o.each(c.length<=f.length?c:f,function(t,e){return c[e]>f[e]?(i=-1,r.EXIT):c[e]<f[e]?(i=1,r.EXIT):void 0});else{if("asec"===a&&t[u]<n[u])return i=-1,o.EXIT;if("asec"===a&&t[u]>n[u])return i=1,o.EXIT;if("desc"===a&&t[u]>n[u])return i=-1,o.EXIT;if("desc"===a&&t[u]<n[u])return i=1,o.EXIT}return 0===i&&"logical"===a&&c.length<f.length?i=-1:0===i&&"logical"===a&&c.length>f.length?i=1:0===i&&"logicaldesc"===a&&c.length>f.length?i=-1:0===i&&"logicaldesc"===a&&c.length<f.length&&(i=1),0!==i?o.EXIT:void 0}),i};return t&&t.push?t.sort(n):t},function(){var t={},e=0;$=function(n){return e>c&&(t={},e=0),t["_"+n]||function(){var r,o,i,s=String(n),u=[],a="_",c="";for(r=0,o=s.length;o>r;r++)i=s.charCodeAt(r),i>=48&&57>=i||46===i?("n"!==c&&(c="n",u.push(a.toLowerCase()),a=""),a+=s.charAt(r)):("s"!==c&&(c="s",u.push(parseFloat(a)),a=""),a+=s.charAt(r));return u.push("n"===c?parseFloat(a):a.toLowerCase()),u.shift(),t["_"+n]=u,e++,u}()}}(),y=function(){this.context({results:this.getDBI().query(this.context())})},f.extend("filter",function(){var t=r.mergeObj(this.context(),{run:null}),e=[];return h(t.q,function(t){e.push(t)}),t.q=e,h(arguments,function(e){t.q.push(p(e)),t.filterRaw.push(e)}),this.getroot(t)}),f.extend("order",function(t){t=t.split(",");var e,n=[];return h(t,function(t){n.push(t.replace(/^\s*/,"").replace(/\s*$/,""))}),e=r.mergeObj(this.context(),{sort:null}),e.order=n,this.getroot(e)}),f.extend("limit",function(t){var e,n=r.mergeObj(this.context(),{});return n.limit=t,n.run&&n.sort&&(e=[],h(n.results,function(n,o){return o+1>t?r.EXIT:void e.push(n)}),n.results=e),this.getroot(n)}),f.extend("start",function(t){var e,n=r.mergeObj(this.context(),{});return n.start=t,n.run&&n.sort&&!n.limit?(e=[],h(n.results,function(n,r){r+1>t&&e.push(n)}),n.results=e):n=r.mergeObj(this.context(),{run:null,start:t}),this.getroot(n)}),f.extend("update",function(t,e,n){var i,s=!0,u={},a=arguments;return!r.isString(t)||2!==arguments.length&&3!==arguments.length?(u=t,2===a.length&&(s=e)):(u[t]=e,3===arguments.length&&(s=n)),i=this,y.call(this),h(this.context().results,function(t){var e=u;r.isFunction(e)?e=e.apply(r.mergeObj(t,{})):o.isFunction(e)&&(e=e(r.mergeObj(t,{}))),r.isObject(e)&&i.getDBI().update(t.___id,e,s)}),this.context().results.length&&this.context({run:null}),this}),f.extend("remove",function(t){var e=this,n=0;return y.call(this),h(this.context().results,function(t){e.getDBI().remove(t.___id),n++}),this.context().results.length&&(this.context({run:null}),e.getDBI().removeCommit(t)),n}),f.extend("count",function(){return y.call(this),this.context().results.length}),f.extend("callback",function(t,e){if(t){var n=this;setTimeout(function(){y.call(n),t.call(n.getroot(n.context()))},e||0)}return null}),f.extend("get",function(){return y.call(this),this.context().results}),f.extend("stringify",function(){return JSON.stringify(this.get())}),f.extend("first",function(){return y.call(this),this.context().results[0]||!1}),f.extend("last",function(){return y.call(this),this.context().results[this.context().results.length-1]||!1}),f.extend("sum",function(){var t=0,e=this;return y.call(e),h(arguments,function(n){h(e.context().results,function(e){t+=e[n]||0})}),t}),f.extend("min",function(t){var e=null;return y.call(this),h(this.context().results,function(n){(null===e||n[t]<e)&&(e=n[t])}),e}),function(){var t=function(){var t,e,n;return t=function(t,e,n){var r,o,i;switch(2===n.length?(r=t[n[0]],i="===",o=e[n[1]]):(r=t[n[0]],i=n[1],o=e[n[2]]),i){case"===":return r===o;case"!==":return r!==o;case"<":return o>r;case">":return r>o;case"<=":return o>=r;case">=":return r>=o;case"==":return r==o;case"!=":return r!=o;default:throw String(i)+" is not supported"}},e=function(t,e){var n,o,i={};for(n in t)t.hasOwnProperty(n)&&(i[n]=t[n]);for(n in e)e.hasOwnProperty(n)&&"___id"!==n&&"___s"!==n&&(o=r.isUndefined(i[n])?"":"right_",i[o+String(n)]=e[n]);return i},n=function(n){var o,i,s=arguments,u=s.length,a=[];if("function"!=typeof n.filter){if(!n.TAFFY)throw"TAFFY DB or result not supplied";o=n()}else o=n;return this.context({results:this.getDBI().query(this.context())}),r.each(this.context().results,function(n){o.each(function(r){var o,c=!0;t:for(i=1;u>i&&(o=s[i],c="function"==typeof o?o(n,r):"object"==typeof o&&o.length?t(n,r,o):!1,c);i++);c&&a.push(e(n,r))})}),r(a)()}}();f.extend("join",t)}(),f.extend("max",function(t){var e=null;return y.call(this),h(this.context().results,function(n){(null===e||n[t]>e)&&(e=n[t])}),e}),f.extend("select",function(){var t=[],e=arguments;return y.call(this),1===arguments.length?h(this.context().results,function(n){t.push(n[e[0]])}):h(this.context().results,function(n){var r=[];h(e,function(t){r.push(n[t])}),t.push(r)}),t}),f.extend("distinct",function(){var t=[],e=arguments;return y.call(this),1===arguments.length?h(this.context().results,function(n){var o=n[e[0]],i=!1;h(t,function(t){return o===t?(i=!0,r.EXIT):void 0}),i||t.push(o)}):h(this.context().results,function(n){var o=[],i=!1;h(e,function(t){o.push(n[t])}),h(t,function(t){var n=!0;return h(e,function(e,i){return o[i]!==t[i]?(n=!1,r.EXIT):void 0}),n?(i=!0,r.EXIT):void 0}),i||t.push(o)}),t}),f.extend("supplant",function(t,e){var n=[];return y.call(this),h(this.context().results,function(e){n.push(t.replace(/\{([^\{\}]*)\}/g,function(t,n){var r=e[n];return"string"==typeof r||"number"==typeof r?r:t}))}),e?n:n.join("")}),f.extend("each",function(t){return y.call(this),h(this.context().results,t),this}),f.extend("map",function(t){var e=[];return y.call(this),h(this.context().results,function(n){e.push(t(n))}),e}),o=function(t){var e,n,i,s=[],c={},$=1,y={template:!1,onInsert:!1,onUpdate:!1,onRemove:!1,onDBChange:!1,storageName:!1,forcePropertyCase:null,cacheSize:100,name:""},w=new Date,T=0,b=0,x={};return n=function(t){var e=[],r=!1;return 0===t.length?s:(h(t,function(t){o.isString(t)&&/[t][0-9]*[r][0-9]*/i.test(t)&&s[c[t]]&&(e.push(s[c[t]]),r=!0),o.isObject(t)&&t.___id&&t.___s&&s[c[t.___id]]&&(e.push(s[c[t.___id]]),r=!0),o.isArray(t)&&h(t,function(t){h(n(t),function(t){e.push(t)})})}),r&&e.length>1&&(e=[]),e)},e={dm:function(t){return t&&(w=t,x={},T=0,b=0),y.onDBChange&&setTimeout(function(){y.onDBChange.call(s)},0),y.storageName&&setTimeout(function(){localStorage.setItem("taffy_"+y.storageName,JSON.stringify(s))}),w},insert:function(t,n){var f=[],g=[],p=l(t);return h(p,function(t,i){var l,p;return o.isArray(t)&&0===i?(h(t,function(t){f.push("lower"===y.forcePropertyCase?t.toLowerCase():"upper"===y.forcePropertyCase?t.toUpperCase():t)}),!0):(o.isArray(t)?(l={},h(t,function(t,e){l[f[e]]=t}),t=l):o.isObject(t)&&y.forcePropertyCase&&(p={},d(t,function(e,n){p["lower"===y.forcePropertyCase?n.toLowerCase():"upper"===y.forcePropertyCase?n.toUpperCase():n]=t[n]}),t=p),$++,t.___id="T"+String(a+u).slice(-6)+"R"+String(a+$).slice(-6),t.___s=!0,g.push(t.___id),y.template&&(t=o.mergeObj(y.template,t)),s.push(t),c[t.___id]=s.length-1,y.onInsert&&(n||r.isUndefined(n))&&y.onInsert.call(t),void e.dm(new Date))}),i(g)},sort:function(t){return s=v(s,t.split(",")),c={},h(s,function(t,e){c[t.___id]=e}),e.dm(new Date),!0},update:function(t,n,i){var u,a,f,l,h={};y.forcePropertyCase&&(d(n,function(t,e){h["lower"===y.forcePropertyCase?e.toLowerCase():"upper"===y.forcePropertyCase?e.toUpperCase():e]=t}),n=h),u=s[c[t]],a=o.mergeObj(u,n),f={},l=!1,d(a,function(t,e){(r.isUndefined(u[e])||u[e]!==t)&&(f[e]=t,l=!0)}),l&&(y.onUpdate&&(i||r.isUndefined(i))&&y.onUpdate.call(a,s[c[t]],f),s[c[t]]=a,e.dm(new Date))},remove:function(t){s[c[t]].___s=!1},removeCommit:function(t){var n;for(n=s.length-1;n>-1;n--)s[n].___s||(y.onRemove&&(t||r.isUndefined(t))&&y.onRemove.call(s[n]),c[s[n].___id]=void 0,s.splice(n,1));c={},h(s,function(t,e){c[t.___id]=e}),e.dm(new Date)},query:function(t){var i,u,a,c,f,l;if(y.cacheSize&&(u="",h(t.filterRaw,function(t){return o.isFunction(t)?(u="nocache",r.EXIT):void 0}),""===u&&(u=E(o.mergeObj(t,{q:!1,run:!1,sort:!1})))),!t.results||!t.run||t.run&&e.dm()>t.run){if(a=[],y.cacheSize&&x[u])return x[u].i=T++,x[u].results;0===t.q.length&&0===t.index.length?(h(s,function(t){a.push(t)}),i=a):(c=n(t.index),h(c,function(e){(0===t.q.length||m(e,t.q))&&a.push(e)}),i=a)}else i=t.results;return!(t.order.length>0)||t.run&&t.sort||(i=v(i,t.order)),i.length&&(t.limit&&t.limit<i.length||t.start)&&(f=[],h(i,function(e,n){if(!t.start||t.start&&n+1>=t.start)if(t.limit){if(l=t.start?n+1-t.start:n,l<t.limit)f.push(e);else if(l>t.limit)return r.EXIT}else f.push(e)}),i=f),y.cacheSize&&"nocache"!==u&&(b++,setTimeout(function(){var t,e;b>=2*y.cacheSize&&(b=0,t=T-y.cacheSize,e={},d(function(n,r){n.i>=t&&(e[r]=n)}),x=e)},0),x[u]={i:T++,results:i}),i}},i=function(){var t,n;return t=r.mergeObj(r.mergeObj(f,{insert:void 0}),{getDBI:function(){return e},getroot:function(t){return i.call(t)},context:function(t){return t&&(n=r.mergeObj(n,t.hasOwnProperty("results")?r.mergeObj(t,{run:new Date,sort:new Date}):t)),n},extend:void 0}),n=this&&this.q?this:{limit:!1,start:!1,q:[],filterRaw:[],index:[],order:[],results:!1,run:null,sort:null,settings:y},h(arguments,function(t){g(t)?n.index.push(t):n.q.push(p(t)),n.filterRaw.push(t)}),t},u++,t&&e.insert(t),i.insert=e.insert,i.merge=function(t,n,r){var o={},s=[],u={};return r=r||!1,n=n||"id",h(t,function(t){var u;o[n]=t[n],s.push(t[n]),u=i(o).first(),u?e.update(u.___id,t,r):e.insert(t,r)}),u[n]=s,i(u)},i.TAFFY=!0,i.sort=e.sort,i.settings=function(t){return t&&(y=r.mergeObj(y,t),t.template&&i().update(t.template)),y},i.store=function(t){var e,n=!1;return localStorage&&(t&&(e=localStorage.getItem("taffy_"+t),e&&e.length>0&&(i.insert(e),n=!0),s.length>0&&setTimeout(function(){localStorage.setItem("taffy_"+y.storageName,JSON.stringify(s))})),i.settings({storageName:t})),i},i},r=o,o.each=h,o.eachin=d,o.extend=f.extend,r.EXIT="TAFFYEXIT",r.mergeObj=function(t,e){var n={};return d(t,function(e,r){n[r]=t[r]}),d(e,function(t,r){n[r]=e[r]}),n},r.has=function(t,e){var n,i=!1;if(t.TAFFY)return i=t(e),i.length>0?!0:!1;switch(o.typeOf(t)){case"object":if(o.isObject(e))d(e,function(n,s){return i!==!0||o.isUndefined(t[s])||!t.hasOwnProperty(s)?(i=!1,r.EXIT):void(i=o.has(t[s],e[s]))});else if(o.isArray(e))h(e,function(n,s){return i=o.has(t,e[s]),i?r.EXIT:void 0});else if(o.isString(e))return r.isUndefined(t[e])?!1:!0;return i;case"array":if(o.isObject(e))h(t,function(n,s){return i=o.has(t[s],e),i===!0?r.EXIT:void 0});else if(o.isArray(e))h(e,function(n,s){return h(t,function(n,u){return i=o.has(t[u],e[s]),i===!0?r.EXIT:void 0}),i===!0?r.EXIT:void 0});else if(o.isString(e)||o.isNumber(e))for(i=!1,n=0;n<t.length;n++)if(i=o.has(t[n],e))return!0;return i;case"string":if(o.isString(e)&&e===t)return!0;break;default:if(o.typeOf(t)===o.typeOf(e)&&t===e)return!0}return!1},r.hasAll=function(t,e){var n,o=r;return o.isArray(e)?(n=!0,h(e,function(e){return n=o.has(t,e),n===!1?r.EXIT:void 0}),n):o.has(t,e)},r.typeOf=function(t){var e=typeof t;return"object"===e&&(t?"number"!=typeof t.length||t.propertyIsEnumerable("length")||(e="array"):e="null"),
e},r.getObjectKeys=function(t){var e=[];return d(t,function(t,n){e.push(n)}),e.sort(),e},r.isSameArray=function(t,e){return r.isArray(t)&&r.isArray(e)&&t.join(",")===e.join(",")?!0:!1},r.isSameObject=function(t,e){var n=r,o=!0;return n.isObject(t)&&n.isObject(e)&&n.isSameArray(n.getObjectKeys(t),n.getObjectKeys(e))?d(t,function(i,s){return n.isObject(t[s])&&n.isObject(e[s])&&n.isSameObject(t[s],e[s])||n.isArray(t[s])&&n.isArray(e[s])&&n.isSameArray(t[s],e[s])||t[s]===e[s]?void 0:(o=!1,r.EXIT)}):o=!1,o},t=["String","Number","Object","Array","Boolean","Null","Function","Undefined"],e=function(t){return function(e){return r.typeOf(e)===t.toLowerCase()?!0:!1}},n=0;n<t.length;n++)i=t[n],r["is"+i]=e(i)}(),"object"==typeof n&&(n.taffy=r)},{}],4:[function(t,e,n){"use strict";function r(t,e){e.debug("[Run] Adding todo stubs...");var n=i();n.store("todos"),0===n().count()&&n.insert([{title:"Do something",isComplete:!0},{title:"Do something else",isComplete:!1}]),t.whenGET("/api/todos").respond(function(){return[200,n().get(),{}]}),t.whenPOST("/api/todos").respond(function(t,e,r){var i=o.fromJson(r);return n().remove(),n.insert(i),[200,{status:!0},{}]})}var o=t("angular"),i=t("taffydb").taffy;e.exports=r},{angular:"angular",taffydb:3}]},{},[1]);
//# sourceMappingURL=stubs.js.map