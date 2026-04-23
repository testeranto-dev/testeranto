"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // node_modules/react/cjs/react.production.js
  var require_react_production = __commonJS({
    "node_modules/react/cjs/react.production.js"(exports) {
      "use strict";
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element");
      var REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal");
      var REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
      var REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode");
      var REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler");
      var REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer");
      var REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context");
      var REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref");
      var REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense");
      var REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo");
      var REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy");
      var REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity");
      var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      var ReactNoopUpdateQueue = {
        isMounted: function() {
          return false;
        },
        enqueueForceUpdate: function() {
        },
        enqueueReplaceState: function() {
        },
        enqueueSetState: function() {
        }
      };
      var assign3 = Object.assign;
      var emptyObject = {};
      function Component(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      Component.prototype.isReactComponent = {};
      Component.prototype.setState = function(partialState, callback) {
        if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
          throw Error(
            "takes an object of state variables to update or a function which returns an object of state variables."
          );
        this.updater.enqueueSetState(this, partialState, callback, "setState");
      };
      Component.prototype.forceUpdate = function(callback) {
        this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
      };
      function ComponentDummy() {
      }
      ComponentDummy.prototype = Component.prototype;
      function PureComponent(props, context, updater) {
        this.props = props;
        this.context = context;
        this.refs = emptyObject;
        this.updater = updater || ReactNoopUpdateQueue;
      }
      var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
      pureComponentPrototype.constructor = PureComponent;
      assign3(pureComponentPrototype, Component.prototype);
      pureComponentPrototype.isPureReactComponent = true;
      var isArrayImpl = Array.isArray;
      function noop() {
      }
      var ReactSharedInternals = { H: null, A: null, T: null, S: null };
      var hasOwnProperty2 = Object.prototype.hasOwnProperty;
      function ReactElement(type, key, props) {
        var refProp = props.ref;
        return {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          ref: void 0 !== refProp ? refProp : null,
          props
        };
      }
      function cloneAndReplaceKey(oldElement, newKey) {
        return ReactElement(oldElement.type, newKey, oldElement.props);
      }
      function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
      }
      function escape(key) {
        var escaperLookup = { "=": "=0", ":": "=2" };
        return "$" + key.replace(/[=:]/g, function(match) {
          return escaperLookup[match];
        });
      }
      var userProvidedKeyEscapeRegex = /\/+/g;
      function getElementKey(element, index) {
        return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
      }
      function resolveThenable(thenable) {
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
          default:
            switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
              function(fulfilledValue) {
                "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
              },
              function(error) {
                "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
              }
            )), thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenable.reason;
            }
        }
        throw thenable;
      }
      function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
        var type = typeof children;
        if ("undefined" === type || "boolean" === type) children = null;
        var invokeCallback = false;
        if (null === children) invokeCallback = true;
        else
          switch (type) {
            case "bigint":
            case "string":
            case "number":
              invokeCallback = true;
              break;
            case "object":
              switch (children.$$typeof) {
                case REACT_ELEMENT_TYPE:
                case REACT_PORTAL_TYPE:
                  invokeCallback = true;
                  break;
                case REACT_LAZY_TYPE:
                  return invokeCallback = children._init, mapIntoArray(
                    invokeCallback(children._payload),
                    array,
                    escapedPrefix,
                    nameSoFar,
                    callback
                  );
              }
          }
        if (invokeCallback)
          return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c2) {
            return c2;
          })) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(
            callback,
            escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(
              userProvidedKeyEscapeRegex,
              "$&/"
            ) + "/") + invokeCallback
          )), array.push(callback)), 1;
        invokeCallback = 0;
        var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
        if (isArrayImpl(children))
          for (var i2 = 0; i2 < children.length; i2++)
            nameSoFar = children[i2], type = nextNamePrefix + getElementKey(nameSoFar, i2), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if (i2 = getIteratorFn(children), "function" === typeof i2)
          for (children = i2.call(children), i2 = 0; !(nameSoFar = children.next()).done; )
            nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i2++), invokeCallback += mapIntoArray(
              nameSoFar,
              array,
              escapedPrefix,
              type,
              callback
            );
        else if ("object" === type) {
          if ("function" === typeof children.then)
            return mapIntoArray(
              resolveThenable(children),
              array,
              escapedPrefix,
              nameSoFar,
              callback
            );
          array = String(children);
          throw Error(
            "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
          );
        }
        return invokeCallback;
      }
      function mapChildren(children, func, context) {
        if (null == children) return children;
        var result = [], count = 0;
        mapIntoArray(children, result, "", "", function(child) {
          return func.call(context, child, count++);
        });
        return result;
      }
      function lazyInitializer(payload) {
        if (-1 === payload._status) {
          var ctor = payload._result;
          ctor = ctor();
          ctor.then(
            function(moduleObject) {
              if (0 === payload._status || -1 === payload._status)
                payload._status = 1, payload._result = moduleObject;
            },
            function(error) {
              if (0 === payload._status || -1 === payload._status)
                payload._status = 2, payload._result = error;
            }
          );
          -1 === payload._status && (payload._status = 0, payload._result = ctor);
        }
        if (1 === payload._status) return payload._result.default;
        throw payload._result;
      }
      var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      };
      var Children = {
        map: mapChildren,
        forEach: function(children, forEachFunc, forEachContext) {
          mapChildren(
            children,
            function() {
              forEachFunc.apply(this, arguments);
            },
            forEachContext
          );
        },
        count: function(children) {
          var n2 = 0;
          mapChildren(children, function() {
            n2++;
          });
          return n2;
        },
        toArray: function(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        },
        only: function(children) {
          if (!isValidElement(children))
            throw Error(
              "React.Children.only expected to receive a single React element child."
            );
          return children;
        }
      };
      exports.Activity = REACT_ACTIVITY_TYPE;
      exports.Children = Children;
      exports.Component = Component;
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.Profiler = REACT_PROFILER_TYPE;
      exports.PureComponent = PureComponent;
      exports.StrictMode = REACT_STRICT_MODE_TYPE;
      exports.Suspense = REACT_SUSPENSE_TYPE;
      exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
      exports.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function(size) {
          return ReactSharedInternals.H.useMemoCache(size);
        }
      };
      exports.cache = function(fn) {
        return function() {
          return fn.apply(null, arguments);
        };
      };
      exports.cacheSignal = function() {
        return null;
      };
      exports.cloneElement = function(element, config, children) {
        if (null === element || void 0 === element)
          throw Error(
            "The argument must be a React element, but you passed " + element + "."
          );
        var props = assign3({}, element.props), key = element.key;
        if (null != config)
          for (propName in void 0 !== config.key && (key = "" + config.key), config)
            !hasOwnProperty2.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
        var propName = arguments.length - 2;
        if (1 === propName) props.children = children;
        else if (1 < propName) {
          for (var childArray = Array(propName), i2 = 0; i2 < propName; i2++)
            childArray[i2] = arguments[i2 + 2];
          props.children = childArray;
        }
        return ReactElement(element.type, key, props);
      };
      exports.createContext = function(defaultValue) {
        defaultValue = {
          $$typeof: REACT_CONTEXT_TYPE,
          _currentValue: defaultValue,
          _currentValue2: defaultValue,
          _threadCount: 0,
          Provider: null,
          Consumer: null
        };
        defaultValue.Provider = defaultValue;
        defaultValue.Consumer = {
          $$typeof: REACT_CONSUMER_TYPE,
          _context: defaultValue
        };
        return defaultValue;
      };
      exports.createElement = function(type, config, children) {
        var propName, props = {}, key = null;
        if (null != config)
          for (propName in void 0 !== config.key && (key = "" + config.key), config)
            hasOwnProperty2.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
        var childrenLength = arguments.length - 2;
        if (1 === childrenLength) props.children = children;
        else if (1 < childrenLength) {
          for (var childArray = Array(childrenLength), i2 = 0; i2 < childrenLength; i2++)
            childArray[i2] = arguments[i2 + 2];
          props.children = childArray;
        }
        if (type && type.defaultProps)
          for (propName in childrenLength = type.defaultProps, childrenLength)
            void 0 === props[propName] && (props[propName] = childrenLength[propName]);
        return ReactElement(type, key, props);
      };
      exports.createRef = function() {
        return { current: null };
      };
      exports.forwardRef = function(render) {
        return { $$typeof: REACT_FORWARD_REF_TYPE, render };
      };
      exports.isValidElement = isValidElement;
      exports.lazy = function(ctor) {
        return {
          $$typeof: REACT_LAZY_TYPE,
          _payload: { _status: -1, _result: ctor },
          _init: lazyInitializer
        };
      };
      exports.memo = function(type, compare) {
        return {
          $$typeof: REACT_MEMO_TYPE,
          type,
          compare: void 0 === compare ? null : compare
        };
      };
      exports.startTransition = function(scope) {
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        ReactSharedInternals.T = currentTransition;
        try {
          var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop, reportGlobalError);
        } catch (error) {
          reportGlobalError(error);
        } finally {
          null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      };
      exports.unstable_useCacheRefresh = function() {
        return ReactSharedInternals.H.useCacheRefresh();
      };
      exports.use = function(usable) {
        return ReactSharedInternals.H.use(usable);
      };
      exports.useActionState = function(action, initialState, permalink) {
        return ReactSharedInternals.H.useActionState(action, initialState, permalink);
      };
      exports.useCallback = function(callback, deps) {
        return ReactSharedInternals.H.useCallback(callback, deps);
      };
      exports.useContext = function(Context) {
        return ReactSharedInternals.H.useContext(Context);
      };
      exports.useDebugValue = function() {
      };
      exports.useDeferredValue = function(value, initialValue) {
        return ReactSharedInternals.H.useDeferredValue(value, initialValue);
      };
      exports.useEffect = function(create, deps) {
        return ReactSharedInternals.H.useEffect(create, deps);
      };
      exports.useEffectEvent = function(callback) {
        return ReactSharedInternals.H.useEffectEvent(callback);
      };
      exports.useId = function() {
        return ReactSharedInternals.H.useId();
      };
      exports.useImperativeHandle = function(ref, create, deps) {
        return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
      };
      exports.useInsertionEffect = function(create, deps) {
        return ReactSharedInternals.H.useInsertionEffect(create, deps);
      };
      exports.useLayoutEffect = function(create, deps) {
        return ReactSharedInternals.H.useLayoutEffect(create, deps);
      };
      exports.useMemo = function(create, deps) {
        return ReactSharedInternals.H.useMemo(create, deps);
      };
      exports.useOptimistic = function(passthrough, reducer) {
        return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
      };
      exports.useReducer = function(reducer, initialArg, init) {
        return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
      };
      exports.useRef = function(initialValue) {
        return ReactSharedInternals.H.useRef(initialValue);
      };
      exports.useState = function(initialState) {
        return ReactSharedInternals.H.useState(initialState);
      };
      exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
        return ReactSharedInternals.H.useSyncExternalStore(
          subscribe,
          getSnapshot,
          getServerSnapshot
        );
      };
      exports.useTransition = function() {
        return ReactSharedInternals.H.useTransition();
      };
      exports.version = "19.2.4";
    }
  });

  // node_modules/react/index.js
  var require_react = __commonJS({
    "node_modules/react/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_production();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/scheduler/cjs/scheduler.production.js
  var require_scheduler_production = __commonJS({
    "node_modules/scheduler/cjs/scheduler.production.js"(exports) {
      "use strict";
      function push(heap, node) {
        var index = heap.length;
        heap.push(node);
        a: for (; 0 < index; ) {
          var parentIndex = index - 1 >>> 1, parent = heap[parentIndex];
          if (0 < compare(parent, node))
            heap[parentIndex] = node, heap[index] = parent, index = parentIndex;
          else break a;
        }
      }
      function peek(heap) {
        return 0 === heap.length ? null : heap[0];
      }
      function pop(heap) {
        if (0 === heap.length) return null;
        var first = heap[0], last = heap.pop();
        if (last !== first) {
          heap[0] = last;
          a: for (var index = 0, length = heap.length, halfLength = length >>> 1; index < halfLength; ) {
            var leftIndex = 2 * (index + 1) - 1, left = heap[leftIndex], rightIndex = leftIndex + 1, right = heap[rightIndex];
            if (0 > compare(left, last))
              rightIndex < length && 0 > compare(right, left) ? (heap[index] = right, heap[rightIndex] = last, index = rightIndex) : (heap[index] = left, heap[leftIndex] = last, index = leftIndex);
            else if (rightIndex < length && 0 > compare(right, last))
              heap[index] = right, heap[rightIndex] = last, index = rightIndex;
            else break a;
          }
        }
        return first;
      }
      function compare(a2, b2) {
        var diff = a2.sortIndex - b2.sortIndex;
        return 0 !== diff ? diff : a2.id - b2.id;
      }
      exports.unstable_now = void 0;
      if ("object" === typeof performance && "function" === typeof performance.now) {
        localPerformance = performance;
        exports.unstable_now = function() {
          return localPerformance.now();
        };
      } else {
        localDate = Date, initialTime = localDate.now();
        exports.unstable_now = function() {
          return localDate.now() - initialTime;
        };
      }
      var localPerformance;
      var localDate;
      var initialTime;
      var taskQueue = [];
      var timerQueue = [];
      var taskIdCounter = 1;
      var currentTask = null;
      var currentPriorityLevel = 3;
      var isPerformingWork = false;
      var isHostCallbackScheduled = false;
      var isHostTimeoutScheduled = false;
      var needsPaint = false;
      var localSetTimeout = "function" === typeof setTimeout ? setTimeout : null;
      var localClearTimeout = "function" === typeof clearTimeout ? clearTimeout : null;
      var localSetImmediate = "undefined" !== typeof setImmediate ? setImmediate : null;
      function advanceTimers(currentTime) {
        for (var timer = peek(timerQueue); null !== timer; ) {
          if (null === timer.callback) pop(timerQueue);
          else if (timer.startTime <= currentTime)
            pop(timerQueue), timer.sortIndex = timer.expirationTime, push(taskQueue, timer);
          else break;
          timer = peek(timerQueue);
        }
      }
      function handleTimeout(currentTime) {
        isHostTimeoutScheduled = false;
        advanceTimers(currentTime);
        if (!isHostCallbackScheduled)
          if (null !== peek(taskQueue))
            isHostCallbackScheduled = true, isMessageLoopRunning || (isMessageLoopRunning = true, schedulePerformWorkUntilDeadline());
          else {
            var firstTimer = peek(timerQueue);
            null !== firstTimer && requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
          }
      }
      var isMessageLoopRunning = false;
      var taskTimeoutID = -1;
      var frameInterval = 5;
      var startTime = -1;
      function shouldYieldToHost() {
        return needsPaint ? true : exports.unstable_now() - startTime < frameInterval ? false : true;
      }
      function performWorkUntilDeadline() {
        needsPaint = false;
        if (isMessageLoopRunning) {
          var currentTime = exports.unstable_now();
          startTime = currentTime;
          var hasMoreWork = true;
          try {
            a: {
              isHostCallbackScheduled = false;
              isHostTimeoutScheduled && (isHostTimeoutScheduled = false, localClearTimeout(taskTimeoutID), taskTimeoutID = -1);
              isPerformingWork = true;
              var previousPriorityLevel = currentPriorityLevel;
              try {
                b: {
                  advanceTimers(currentTime);
                  for (currentTask = peek(taskQueue); null !== currentTask && !(currentTask.expirationTime > currentTime && shouldYieldToHost()); ) {
                    var callback = currentTask.callback;
                    if ("function" === typeof callback) {
                      currentTask.callback = null;
                      currentPriorityLevel = currentTask.priorityLevel;
                      var continuationCallback = callback(
                        currentTask.expirationTime <= currentTime
                      );
                      currentTime = exports.unstable_now();
                      if ("function" === typeof continuationCallback) {
                        currentTask.callback = continuationCallback;
                        advanceTimers(currentTime);
                        hasMoreWork = true;
                        break b;
                      }
                      currentTask === peek(taskQueue) && pop(taskQueue);
                      advanceTimers(currentTime);
                    } else pop(taskQueue);
                    currentTask = peek(taskQueue);
                  }
                  if (null !== currentTask) hasMoreWork = true;
                  else {
                    var firstTimer = peek(timerQueue);
                    null !== firstTimer && requestHostTimeout(
                      handleTimeout,
                      firstTimer.startTime - currentTime
                    );
                    hasMoreWork = false;
                  }
                }
                break a;
              } finally {
                currentTask = null, currentPriorityLevel = previousPriorityLevel, isPerformingWork = false;
              }
              hasMoreWork = void 0;
            }
          } finally {
            hasMoreWork ? schedulePerformWorkUntilDeadline() : isMessageLoopRunning = false;
          }
        }
      }
      var schedulePerformWorkUntilDeadline;
      if ("function" === typeof localSetImmediate)
        schedulePerformWorkUntilDeadline = function() {
          localSetImmediate(performWorkUntilDeadline);
        };
      else if ("undefined" !== typeof MessageChannel) {
        channel = new MessageChannel(), port = channel.port2;
        channel.port1.onmessage = performWorkUntilDeadline;
        schedulePerformWorkUntilDeadline = function() {
          port.postMessage(null);
        };
      } else
        schedulePerformWorkUntilDeadline = function() {
          localSetTimeout(performWorkUntilDeadline, 0);
        };
      var channel;
      var port;
      function requestHostTimeout(callback, ms) {
        taskTimeoutID = localSetTimeout(function() {
          callback(exports.unstable_now());
        }, ms);
      }
      exports.unstable_IdlePriority = 5;
      exports.unstable_ImmediatePriority = 1;
      exports.unstable_LowPriority = 4;
      exports.unstable_NormalPriority = 3;
      exports.unstable_Profiling = null;
      exports.unstable_UserBlockingPriority = 2;
      exports.unstable_cancelCallback = function(task) {
        task.callback = null;
      };
      exports.unstable_forceFrameRate = function(fps) {
        0 > fps || 125 < fps ? console.error(
          "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
        ) : frameInterval = 0 < fps ? Math.floor(1e3 / fps) : 5;
      };
      exports.unstable_getCurrentPriorityLevel = function() {
        return currentPriorityLevel;
      };
      exports.unstable_next = function(eventHandler) {
        switch (currentPriorityLevel) {
          case 1:
          case 2:
          case 3:
            var priorityLevel = 3;
            break;
          default:
            priorityLevel = currentPriorityLevel;
        }
        var previousPriorityLevel = currentPriorityLevel;
        currentPriorityLevel = priorityLevel;
        try {
          return eventHandler();
        } finally {
          currentPriorityLevel = previousPriorityLevel;
        }
      };
      exports.unstable_requestPaint = function() {
        needsPaint = true;
      };
      exports.unstable_runWithPriority = function(priorityLevel, eventHandler) {
        switch (priorityLevel) {
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
            break;
          default:
            priorityLevel = 3;
        }
        var previousPriorityLevel = currentPriorityLevel;
        currentPriorityLevel = priorityLevel;
        try {
          return eventHandler();
        } finally {
          currentPriorityLevel = previousPriorityLevel;
        }
      };
      exports.unstable_scheduleCallback = function(priorityLevel, callback, options) {
        var currentTime = exports.unstable_now();
        "object" === typeof options && null !== options ? (options = options.delay, options = "number" === typeof options && 0 < options ? currentTime + options : currentTime) : options = currentTime;
        switch (priorityLevel) {
          case 1:
            var timeout = -1;
            break;
          case 2:
            timeout = 250;
            break;
          case 5:
            timeout = 1073741823;
            break;
          case 4:
            timeout = 1e4;
            break;
          default:
            timeout = 5e3;
        }
        timeout = options + timeout;
        priorityLevel = {
          id: taskIdCounter++,
          callback,
          priorityLevel,
          startTime: options,
          expirationTime: timeout,
          sortIndex: -1
        };
        options > currentTime ? (priorityLevel.sortIndex = options, push(timerQueue, priorityLevel), null === peek(taskQueue) && priorityLevel === peek(timerQueue) && (isHostTimeoutScheduled ? (localClearTimeout(taskTimeoutID), taskTimeoutID = -1) : isHostTimeoutScheduled = true, requestHostTimeout(handleTimeout, options - currentTime))) : (priorityLevel.sortIndex = timeout, push(taskQueue, priorityLevel), isHostCallbackScheduled || isPerformingWork || (isHostCallbackScheduled = true, isMessageLoopRunning || (isMessageLoopRunning = true, schedulePerformWorkUntilDeadline())));
        return priorityLevel;
      };
      exports.unstable_shouldYield = shouldYieldToHost;
      exports.unstable_wrapCallback = function(callback) {
        var parentPriorityLevel = currentPriorityLevel;
        return function() {
          var previousPriorityLevel = currentPriorityLevel;
          currentPriorityLevel = parentPriorityLevel;
          try {
            return callback.apply(this, arguments);
          } finally {
            currentPriorityLevel = previousPriorityLevel;
          }
        };
      };
    }
  });

  // node_modules/scheduler/index.js
  var require_scheduler = __commonJS({
    "node_modules/scheduler/index.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_scheduler_production();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/cjs/react-dom.production.js
  var require_react_dom_production = __commonJS({
    "node_modules/react-dom/cjs/react-dom.production.js"(exports) {
      "use strict";
      var React4 = require_react();
      function formatProdErrorMessage(code) {
        var url = "https://react.dev/errors/" + code;
        if (1 < arguments.length) {
          url += "?args[]=" + encodeURIComponent(arguments[1]);
          for (var i2 = 2; i2 < arguments.length; i2++)
            url += "&args[]=" + encodeURIComponent(arguments[i2]);
        }
        return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      function noop() {
      }
      var Internals = {
        d: {
          f: noop,
          r: function() {
            throw Error(formatProdErrorMessage(522));
          },
          D: noop,
          C: noop,
          L: noop,
          m: noop,
          X: noop,
          S: noop,
          M: noop
        },
        p: 0,
        findDOMNode: null
      };
      var REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal");
      function createPortal$1(children, containerInfo, implementation) {
        var key = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
        return {
          $$typeof: REACT_PORTAL_TYPE,
          key: null == key ? null : "" + key,
          children,
          containerInfo,
          implementation
        };
      }
      var ReactSharedInternals = React4.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      function getCrossOriginStringAs(as, input) {
        if ("font" === as) return "";
        if ("string" === typeof input)
          return "use-credentials" === input ? input : "";
      }
      exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
      exports.createPortal = function(children, container) {
        var key = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
        if (!container || 1 !== container.nodeType && 9 !== container.nodeType && 11 !== container.nodeType)
          throw Error(formatProdErrorMessage(299));
        return createPortal$1(children, container, null, key);
      };
      exports.flushSync = function(fn) {
        var previousTransition = ReactSharedInternals.T, previousUpdatePriority = Internals.p;
        try {
          if (ReactSharedInternals.T = null, Internals.p = 2, fn) return fn();
        } finally {
          ReactSharedInternals.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f();
        }
      };
      exports.preconnect = function(href, options) {
        "string" === typeof href && (options ? (options = options.crossOrigin, options = "string" === typeof options ? "use-credentials" === options ? options : "" : void 0) : options = null, Internals.d.C(href, options));
      };
      exports.prefetchDNS = function(href) {
        "string" === typeof href && Internals.d.D(href);
      };
      exports.preinit = function(href, options) {
        if ("string" === typeof href && options && "string" === typeof options.as) {
          var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin), integrity = "string" === typeof options.integrity ? options.integrity : void 0, fetchPriority = "string" === typeof options.fetchPriority ? options.fetchPriority : void 0;
          "style" === as ? Internals.d.S(
            href,
            "string" === typeof options.precedence ? options.precedence : void 0,
            {
              crossOrigin,
              integrity,
              fetchPriority
            }
          ) : "script" === as && Internals.d.X(href, {
            crossOrigin,
            integrity,
            fetchPriority,
            nonce: "string" === typeof options.nonce ? options.nonce : void 0
          });
        }
      };
      exports.preinitModule = function(href, options) {
        if ("string" === typeof href)
          if ("object" === typeof options && null !== options) {
            if (null == options.as || "script" === options.as) {
              var crossOrigin = getCrossOriginStringAs(
                options.as,
                options.crossOrigin
              );
              Internals.d.M(href, {
                crossOrigin,
                integrity: "string" === typeof options.integrity ? options.integrity : void 0,
                nonce: "string" === typeof options.nonce ? options.nonce : void 0
              });
            }
          } else null == options && Internals.d.M(href);
      };
      exports.preload = function(href, options) {
        if ("string" === typeof href && "object" === typeof options && null !== options && "string" === typeof options.as) {
          var as = options.as, crossOrigin = getCrossOriginStringAs(as, options.crossOrigin);
          Internals.d.L(href, as, {
            crossOrigin,
            integrity: "string" === typeof options.integrity ? options.integrity : void 0,
            nonce: "string" === typeof options.nonce ? options.nonce : void 0,
            type: "string" === typeof options.type ? options.type : void 0,
            fetchPriority: "string" === typeof options.fetchPriority ? options.fetchPriority : void 0,
            referrerPolicy: "string" === typeof options.referrerPolicy ? options.referrerPolicy : void 0,
            imageSrcSet: "string" === typeof options.imageSrcSet ? options.imageSrcSet : void 0,
            imageSizes: "string" === typeof options.imageSizes ? options.imageSizes : void 0,
            media: "string" === typeof options.media ? options.media : void 0
          });
        }
      };
      exports.preloadModule = function(href, options) {
        if ("string" === typeof href)
          if (options) {
            var crossOrigin = getCrossOriginStringAs(options.as, options.crossOrigin);
            Internals.d.m(href, {
              as: "string" === typeof options.as && "script" !== options.as ? options.as : void 0,
              crossOrigin,
              integrity: "string" === typeof options.integrity ? options.integrity : void 0
            });
          } else Internals.d.m(href);
      };
      exports.requestFormReset = function(form) {
        Internals.d.r(form);
      };
      exports.unstable_batchedUpdates = function(fn, a2) {
        return fn(a2);
      };
      exports.useFormState = function(action, initialState, permalink) {
        return ReactSharedInternals.H.useFormState(action, initialState, permalink);
      };
      exports.useFormStatus = function() {
        return ReactSharedInternals.H.useHostTransitionStatus();
      };
      exports.version = "19.2.4";
    }
  });

  // node_modules/react-dom/index.js
  var require_react_dom = __commonJS({
    "node_modules/react-dom/index.js"(exports, module) {
      "use strict";
      function checkDCE() {
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
          return;
        }
        if (false) {
          throw new Error("^_^");
        }
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
        } catch (err) {
          console.error(err);
        }
      }
      if (true) {
        checkDCE();
        module.exports = require_react_dom_production();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react-dom/cjs/react-dom-client.production.js
  var require_react_dom_client_production = __commonJS({
    "node_modules/react-dom/cjs/react-dom-client.production.js"(exports) {
      "use strict";
      var Scheduler = require_scheduler();
      var React4 = require_react();
      var ReactDOM2 = require_react_dom();
      function formatProdErrorMessage(code) {
        var url = "https://react.dev/errors/" + code;
        if (1 < arguments.length) {
          url += "?args[]=" + encodeURIComponent(arguments[1]);
          for (var i2 = 2; i2 < arguments.length; i2++)
            url += "&args[]=" + encodeURIComponent(arguments[i2]);
        }
        return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
      }
      function isValidContainer(node) {
        return !(!node || 1 !== node.nodeType && 9 !== node.nodeType && 11 !== node.nodeType);
      }
      function getNearestMountedFiber(fiber) {
        var node = fiber, nearestMounted = fiber;
        if (fiber.alternate) for (; node.return; ) node = node.return;
        else {
          fiber = node;
          do
            node = fiber, 0 !== (node.flags & 4098) && (nearestMounted = node.return), fiber = node.return;
          while (fiber);
        }
        return 3 === node.tag ? nearestMounted : null;
      }
      function getSuspenseInstanceFromFiber(fiber) {
        if (13 === fiber.tag) {
          var suspenseState = fiber.memoizedState;
          null === suspenseState && (fiber = fiber.alternate, null !== fiber && (suspenseState = fiber.memoizedState));
          if (null !== suspenseState) return suspenseState.dehydrated;
        }
        return null;
      }
      function getActivityInstanceFromFiber(fiber) {
        if (31 === fiber.tag) {
          var activityState = fiber.memoizedState;
          null === activityState && (fiber = fiber.alternate, null !== fiber && (activityState = fiber.memoizedState));
          if (null !== activityState) return activityState.dehydrated;
        }
        return null;
      }
      function assertIsMounted(fiber) {
        if (getNearestMountedFiber(fiber) !== fiber)
          throw Error(formatProdErrorMessage(188));
      }
      function findCurrentFiberUsingSlowPath(fiber) {
        var alternate = fiber.alternate;
        if (!alternate) {
          alternate = getNearestMountedFiber(fiber);
          if (null === alternate) throw Error(formatProdErrorMessage(188));
          return alternate !== fiber ? null : fiber;
        }
        for (var a2 = fiber, b2 = alternate; ; ) {
          var parentA = a2.return;
          if (null === parentA) break;
          var parentB = parentA.alternate;
          if (null === parentB) {
            b2 = parentA.return;
            if (null !== b2) {
              a2 = b2;
              continue;
            }
            break;
          }
          if (parentA.child === parentB.child) {
            for (parentB = parentA.child; parentB; ) {
              if (parentB === a2) return assertIsMounted(parentA), fiber;
              if (parentB === b2) return assertIsMounted(parentA), alternate;
              parentB = parentB.sibling;
            }
            throw Error(formatProdErrorMessage(188));
          }
          if (a2.return !== b2.return) a2 = parentA, b2 = parentB;
          else {
            for (var didFindChild = false, child$0 = parentA.child; child$0; ) {
              if (child$0 === a2) {
                didFindChild = true;
                a2 = parentA;
                b2 = parentB;
                break;
              }
              if (child$0 === b2) {
                didFindChild = true;
                b2 = parentA;
                a2 = parentB;
                break;
              }
              child$0 = child$0.sibling;
            }
            if (!didFindChild) {
              for (child$0 = parentB.child; child$0; ) {
                if (child$0 === a2) {
                  didFindChild = true;
                  a2 = parentB;
                  b2 = parentA;
                  break;
                }
                if (child$0 === b2) {
                  didFindChild = true;
                  b2 = parentB;
                  a2 = parentA;
                  break;
                }
                child$0 = child$0.sibling;
              }
              if (!didFindChild) throw Error(formatProdErrorMessage(189));
            }
          }
          if (a2.alternate !== b2) throw Error(formatProdErrorMessage(190));
        }
        if (3 !== a2.tag) throw Error(formatProdErrorMessage(188));
        return a2.stateNode.current === a2 ? fiber : alternate;
      }
      function findCurrentHostFiberImpl(node) {
        var tag = node.tag;
        if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return node;
        for (node = node.child; null !== node; ) {
          tag = findCurrentHostFiberImpl(node);
          if (null !== tag) return tag;
          node = node.sibling;
        }
        return null;
      }
      var assign3 = Object.assign;
      var REACT_LEGACY_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.element");
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element");
      var REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal");
      var REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
      var REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode");
      var REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler");
      var REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer");
      var REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context");
      var REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref");
      var REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense");
      var REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list");
      var REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo");
      var REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy");
      var REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity");
      var REACT_MEMO_CACHE_SENTINEL = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel");
      var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
      function getIteratorFn(maybeIterable) {
        if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
        maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
        return "function" === typeof maybeIterable ? maybeIterable : null;
      }
      var REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference");
      function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type)
          return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch (type) {
          case REACT_FRAGMENT_TYPE:
            return "Fragment";
          case REACT_PROFILER_TYPE:
            return "Profiler";
          case REACT_STRICT_MODE_TYPE:
            return "StrictMode";
          case REACT_SUSPENSE_TYPE:
            return "Suspense";
          case REACT_SUSPENSE_LIST_TYPE:
            return "SuspenseList";
          case REACT_ACTIVITY_TYPE:
            return "Activity";
        }
        if ("object" === typeof type)
          switch (type.$$typeof) {
            case REACT_PORTAL_TYPE:
              return "Portal";
            case REACT_CONTEXT_TYPE:
              return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
              return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
              var innerType = type.render;
              type = type.displayName;
              type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
              return type;
            case REACT_MEMO_TYPE:
              return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
              innerType = type._payload;
              type = type._init;
              try {
                return getComponentNameFromType(type(innerType));
              } catch (x) {
              }
          }
        return null;
      }
      var isArrayImpl = Array.isArray;
      var ReactSharedInternals = React4.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      var ReactDOMSharedInternals = ReactDOM2.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      var sharedNotPendingObject = {
        pending: false,
        data: null,
        method: null,
        action: null
      };
      var valueStack = [];
      var index = -1;
      function createCursor(defaultValue) {
        return { current: defaultValue };
      }
      function pop(cursor) {
        0 > index || (cursor.current = valueStack[index], valueStack[index] = null, index--);
      }
      function push(cursor, value) {
        index++;
        valueStack[index] = cursor.current;
        cursor.current = value;
      }
      var contextStackCursor = createCursor(null);
      var contextFiberStackCursor = createCursor(null);
      var rootInstanceStackCursor = createCursor(null);
      var hostTransitionProviderCursor = createCursor(null);
      function pushHostContainer(fiber, nextRootInstance) {
        push(rootInstanceStackCursor, nextRootInstance);
        push(contextFiberStackCursor, fiber);
        push(contextStackCursor, null);
        switch (nextRootInstance.nodeType) {
          case 9:
          case 11:
            fiber = (fiber = nextRootInstance.documentElement) ? (fiber = fiber.namespaceURI) ? getOwnHostContext(fiber) : 0 : 0;
            break;
          default:
            if (fiber = nextRootInstance.tagName, nextRootInstance = nextRootInstance.namespaceURI)
              nextRootInstance = getOwnHostContext(nextRootInstance), fiber = getChildHostContextProd(nextRootInstance, fiber);
            else
              switch (fiber) {
                case "svg":
                  fiber = 1;
                  break;
                case "math":
                  fiber = 2;
                  break;
                default:
                  fiber = 0;
              }
        }
        pop(contextStackCursor);
        push(contextStackCursor, fiber);
      }
      function popHostContainer() {
        pop(contextStackCursor);
        pop(contextFiberStackCursor);
        pop(rootInstanceStackCursor);
      }
      function pushHostContext(fiber) {
        null !== fiber.memoizedState && push(hostTransitionProviderCursor, fiber);
        var context = contextStackCursor.current;
        var JSCompiler_inline_result = getChildHostContextProd(context, fiber.type);
        context !== JSCompiler_inline_result && (push(contextFiberStackCursor, fiber), push(contextStackCursor, JSCompiler_inline_result));
      }
      function popHostContext(fiber) {
        contextFiberStackCursor.current === fiber && (pop(contextStackCursor), pop(contextFiberStackCursor));
        hostTransitionProviderCursor.current === fiber && (pop(hostTransitionProviderCursor), HostTransitionContext._currentValue = sharedNotPendingObject);
      }
      var prefix;
      var suffix;
      function describeBuiltInComponentFrame(name) {
        if (void 0 === prefix)
          try {
            throw Error();
          } catch (x) {
            var match = x.stack.trim().match(/\n( *(at )?)/);
            prefix = match && match[1] || "";
            suffix = -1 < x.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < x.stack.indexOf("@") ? "@unknown:0:0" : "";
          }
        return "\n" + prefix + name + suffix;
      }
      var reentry = false;
      function describeNativeComponentFrame(fn, construct) {
        if (!fn || reentry) return "";
        reentry = true;
        var previousPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
          var RunInRootFrame = {
            DetermineComponentFrameRoot: function() {
              try {
                if (construct) {
                  var Fake = function() {
                    throw Error();
                  };
                  Object.defineProperty(Fake.prototype, "props", {
                    set: function() {
                      throw Error();
                    }
                  });
                  if ("object" === typeof Reflect && Reflect.construct) {
                    try {
                      Reflect.construct(Fake, []);
                    } catch (x) {
                      var control = x;
                    }
                    Reflect.construct(fn, [], Fake);
                  } else {
                    try {
                      Fake.call();
                    } catch (x$1) {
                      control = x$1;
                    }
                    fn.call(Fake.prototype);
                  }
                } else {
                  try {
                    throw Error();
                  } catch (x$2) {
                    control = x$2;
                  }
                  (Fake = fn()) && "function" === typeof Fake.catch && Fake.catch(function() {
                  });
                }
              } catch (sample) {
                if (sample && control && "string" === typeof sample.stack)
                  return [sample.stack, control.stack];
              }
              return [null, null];
            }
          };
          RunInRootFrame.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
          var namePropDescriptor = Object.getOwnPropertyDescriptor(
            RunInRootFrame.DetermineComponentFrameRoot,
            "name"
          );
          namePropDescriptor && namePropDescriptor.configurable && Object.defineProperty(
            RunInRootFrame.DetermineComponentFrameRoot,
            "name",
            { value: "DetermineComponentFrameRoot" }
          );
          var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(), sampleStack = _RunInRootFrame$Deter[0], controlStack = _RunInRootFrame$Deter[1];
          if (sampleStack && controlStack) {
            var sampleLines = sampleStack.split("\n"), controlLines = controlStack.split("\n");
            for (namePropDescriptor = RunInRootFrame = 0; RunInRootFrame < sampleLines.length && !sampleLines[RunInRootFrame].includes("DetermineComponentFrameRoot"); )
              RunInRootFrame++;
            for (; namePropDescriptor < controlLines.length && !controlLines[namePropDescriptor].includes(
              "DetermineComponentFrameRoot"
            ); )
              namePropDescriptor++;
            if (RunInRootFrame === sampleLines.length || namePropDescriptor === controlLines.length)
              for (RunInRootFrame = sampleLines.length - 1, namePropDescriptor = controlLines.length - 1; 1 <= RunInRootFrame && 0 <= namePropDescriptor && sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]; )
                namePropDescriptor--;
            for (; 1 <= RunInRootFrame && 0 <= namePropDescriptor; RunInRootFrame--, namePropDescriptor--)
              if (sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
                if (1 !== RunInRootFrame || 1 !== namePropDescriptor) {
                  do
                    if (RunInRootFrame--, namePropDescriptor--, 0 > namePropDescriptor || sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
                      var frame = "\n" + sampleLines[RunInRootFrame].replace(" at new ", " at ");
                      fn.displayName && frame.includes("<anonymous>") && (frame = frame.replace("<anonymous>", fn.displayName));
                      return frame;
                    }
                  while (1 <= RunInRootFrame && 0 <= namePropDescriptor);
                }
                break;
              }
          }
        } finally {
          reentry = false, Error.prepareStackTrace = previousPrepareStackTrace;
        }
        return (previousPrepareStackTrace = fn ? fn.displayName || fn.name : "") ? describeBuiltInComponentFrame(previousPrepareStackTrace) : "";
      }
      function describeFiber(fiber, childFiber) {
        switch (fiber.tag) {
          case 26:
          case 27:
          case 5:
            return describeBuiltInComponentFrame(fiber.type);
          case 16:
            return describeBuiltInComponentFrame("Lazy");
          case 13:
            return fiber.child !== childFiber && null !== childFiber ? describeBuiltInComponentFrame("Suspense Fallback") : describeBuiltInComponentFrame("Suspense");
          case 19:
            return describeBuiltInComponentFrame("SuspenseList");
          case 0:
          case 15:
            return describeNativeComponentFrame(fiber.type, false);
          case 11:
            return describeNativeComponentFrame(fiber.type.render, false);
          case 1:
            return describeNativeComponentFrame(fiber.type, true);
          case 31:
            return describeBuiltInComponentFrame("Activity");
          default:
            return "";
        }
      }
      function getStackByFiberInDevAndProd(workInProgress2) {
        try {
          var info = "", previous = null;
          do
            info += describeFiber(workInProgress2, previous), previous = workInProgress2, workInProgress2 = workInProgress2.return;
          while (workInProgress2);
          return info;
        } catch (x) {
          return "\nError generating stack: " + x.message + "\n" + x.stack;
        }
      }
      var hasOwnProperty2 = Object.prototype.hasOwnProperty;
      var scheduleCallback$3 = Scheduler.unstable_scheduleCallback;
      var cancelCallback$1 = Scheduler.unstable_cancelCallback;
      var shouldYield = Scheduler.unstable_shouldYield;
      var requestPaint = Scheduler.unstable_requestPaint;
      var now = Scheduler.unstable_now;
      var getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel;
      var ImmediatePriority = Scheduler.unstable_ImmediatePriority;
      var UserBlockingPriority = Scheduler.unstable_UserBlockingPriority;
      var NormalPriority$1 = Scheduler.unstable_NormalPriority;
      var LowPriority = Scheduler.unstable_LowPriority;
      var IdlePriority = Scheduler.unstable_IdlePriority;
      var log$1 = Scheduler.log;
      var unstable_setDisableYieldValue = Scheduler.unstable_setDisableYieldValue;
      var rendererID = null;
      var injectedHook = null;
      function setIsStrictModeForDevtools(newIsStrictMode) {
        "function" === typeof log$1 && unstable_setDisableYieldValue(newIsStrictMode);
        if (injectedHook && "function" === typeof injectedHook.setStrictMode)
          try {
            injectedHook.setStrictMode(rendererID, newIsStrictMode);
          } catch (err) {
          }
      }
      var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback;
      var log = Math.log;
      var LN2 = Math.LN2;
      function clz32Fallback(x) {
        x >>>= 0;
        return 0 === x ? 32 : 31 - (log(x) / LN2 | 0) | 0;
      }
      var nextTransitionUpdateLane = 256;
      var nextTransitionDeferredLane = 262144;
      var nextRetryLane = 4194304;
      function getHighestPriorityLanes(lanes) {
        var pendingSyncLanes = lanes & 42;
        if (0 !== pendingSyncLanes) return pendingSyncLanes;
        switch (lanes & -lanes) {
          case 1:
            return 1;
          case 2:
            return 2;
          case 4:
            return 4;
          case 8:
            return 8;
          case 16:
            return 16;
          case 32:
            return 32;
          case 64:
            return 64;
          case 128:
            return 128;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
            return lanes & 261888;
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return lanes & 3932160;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return lanes & 62914560;
          case 67108864:
            return 67108864;
          case 134217728:
            return 134217728;
          case 268435456:
            return 268435456;
          case 536870912:
            return 536870912;
          case 1073741824:
            return 0;
          default:
            return lanes;
        }
      }
      function getNextLanes(root2, wipLanes, rootHasPendingCommit) {
        var pendingLanes = root2.pendingLanes;
        if (0 === pendingLanes) return 0;
        var nextLanes = 0, suspendedLanes = root2.suspendedLanes, pingedLanes = root2.pingedLanes;
        root2 = root2.warmLanes;
        var nonIdlePendingLanes = pendingLanes & 134217727;
        0 !== nonIdlePendingLanes ? (pendingLanes = nonIdlePendingLanes & ~suspendedLanes, 0 !== pendingLanes ? nextLanes = getHighestPriorityLanes(pendingLanes) : (pingedLanes &= nonIdlePendingLanes, 0 !== pingedLanes ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = nonIdlePendingLanes & ~root2, 0 !== rootHasPendingCommit && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))))) : (nonIdlePendingLanes = pendingLanes & ~suspendedLanes, 0 !== nonIdlePendingLanes ? nextLanes = getHighestPriorityLanes(nonIdlePendingLanes) : 0 !== pingedLanes ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = pendingLanes & ~root2, 0 !== rootHasPendingCommit && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))));
        return 0 === nextLanes ? 0 : 0 !== wipLanes && wipLanes !== nextLanes && 0 === (wipLanes & suspendedLanes) && (suspendedLanes = nextLanes & -nextLanes, rootHasPendingCommit = wipLanes & -wipLanes, suspendedLanes >= rootHasPendingCommit || 32 === suspendedLanes && 0 !== (rootHasPendingCommit & 4194048)) ? wipLanes : nextLanes;
      }
      function checkIfRootIsPrerendering(root2, renderLanes2) {
        return 0 === (root2.pendingLanes & ~(root2.suspendedLanes & ~root2.pingedLanes) & renderLanes2);
      }
      function computeExpirationTime(lane, currentTime) {
        switch (lane) {
          case 1:
          case 2:
          case 4:
          case 8:
          case 64:
            return currentTime + 250;
          case 16:
          case 32:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return currentTime + 5e3;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return -1;
          case 67108864:
          case 134217728:
          case 268435456:
          case 536870912:
          case 1073741824:
            return -1;
          default:
            return -1;
        }
      }
      function claimNextRetryLane() {
        var lane = nextRetryLane;
        nextRetryLane <<= 1;
        0 === (nextRetryLane & 62914560) && (nextRetryLane = 4194304);
        return lane;
      }
      function createLaneMap(initial) {
        for (var laneMap = [], i2 = 0; 31 > i2; i2++) laneMap.push(initial);
        return laneMap;
      }
      function markRootUpdated$1(root2, updateLane) {
        root2.pendingLanes |= updateLane;
        268435456 !== updateLane && (root2.suspendedLanes = 0, root2.pingedLanes = 0, root2.warmLanes = 0);
      }
      function markRootFinished(root2, finishedLanes, remainingLanes, spawnedLane, updatedLanes, suspendedRetryLanes) {
        var previouslyPendingLanes = root2.pendingLanes;
        root2.pendingLanes = remainingLanes;
        root2.suspendedLanes = 0;
        root2.pingedLanes = 0;
        root2.warmLanes = 0;
        root2.expiredLanes &= remainingLanes;
        root2.entangledLanes &= remainingLanes;
        root2.errorRecoveryDisabledLanes &= remainingLanes;
        root2.shellSuspendCounter = 0;
        var entanglements = root2.entanglements, expirationTimes = root2.expirationTimes, hiddenUpdates = root2.hiddenUpdates;
        for (remainingLanes = previouslyPendingLanes & ~remainingLanes; 0 < remainingLanes; ) {
          var index$7 = 31 - clz32(remainingLanes), lane = 1 << index$7;
          entanglements[index$7] = 0;
          expirationTimes[index$7] = -1;
          var hiddenUpdatesForLane = hiddenUpdates[index$7];
          if (null !== hiddenUpdatesForLane)
            for (hiddenUpdates[index$7] = null, index$7 = 0; index$7 < hiddenUpdatesForLane.length; index$7++) {
              var update = hiddenUpdatesForLane[index$7];
              null !== update && (update.lane &= -536870913);
            }
          remainingLanes &= ~lane;
        }
        0 !== spawnedLane && markSpawnedDeferredLane(root2, spawnedLane, 0);
        0 !== suspendedRetryLanes && 0 === updatedLanes && 0 !== root2.tag && (root2.suspendedLanes |= suspendedRetryLanes & ~(previouslyPendingLanes & ~finishedLanes));
      }
      function markSpawnedDeferredLane(root2, spawnedLane, entangledLanes) {
        root2.pendingLanes |= spawnedLane;
        root2.suspendedLanes &= ~spawnedLane;
        var spawnedLaneIndex = 31 - clz32(spawnedLane);
        root2.entangledLanes |= spawnedLane;
        root2.entanglements[spawnedLaneIndex] = root2.entanglements[spawnedLaneIndex] | 1073741824 | entangledLanes & 261930;
      }
      function markRootEntangled(root2, entangledLanes) {
        var rootEntangledLanes = root2.entangledLanes |= entangledLanes;
        for (root2 = root2.entanglements; rootEntangledLanes; ) {
          var index$8 = 31 - clz32(rootEntangledLanes), lane = 1 << index$8;
          lane & entangledLanes | root2[index$8] & entangledLanes && (root2[index$8] |= entangledLanes);
          rootEntangledLanes &= ~lane;
        }
      }
      function getBumpedLaneForHydration(root2, renderLanes2) {
        var renderLane = renderLanes2 & -renderLanes2;
        renderLane = 0 !== (renderLane & 42) ? 1 : getBumpedLaneForHydrationByLane(renderLane);
        return 0 !== (renderLane & (root2.suspendedLanes | renderLanes2)) ? 0 : renderLane;
      }
      function getBumpedLaneForHydrationByLane(lane) {
        switch (lane) {
          case 2:
            lane = 1;
            break;
          case 8:
            lane = 4;
            break;
          case 32:
            lane = 16;
            break;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            lane = 128;
            break;
          case 268435456:
            lane = 134217728;
            break;
          default:
            lane = 0;
        }
        return lane;
      }
      function lanesToEventPriority(lanes) {
        lanes &= -lanes;
        return 2 < lanes ? 8 < lanes ? 0 !== (lanes & 134217727) ? 32 : 268435456 : 8 : 2;
      }
      function resolveUpdatePriority() {
        var updatePriority = ReactDOMSharedInternals.p;
        if (0 !== updatePriority) return updatePriority;
        updatePriority = window.event;
        return void 0 === updatePriority ? 32 : getEventPriority(updatePriority.type);
      }
      function runWithPriority(priority, fn) {
        var previousPriority = ReactDOMSharedInternals.p;
        try {
          return ReactDOMSharedInternals.p = priority, fn();
        } finally {
          ReactDOMSharedInternals.p = previousPriority;
        }
      }
      var randomKey = Math.random().toString(36).slice(2);
      var internalInstanceKey = "__reactFiber$" + randomKey;
      var internalPropsKey = "__reactProps$" + randomKey;
      var internalContainerInstanceKey = "__reactContainer$" + randomKey;
      var internalEventHandlersKey = "__reactEvents$" + randomKey;
      var internalEventHandlerListenersKey = "__reactListeners$" + randomKey;
      var internalEventHandlesSetKey = "__reactHandles$" + randomKey;
      var internalRootNodeResourcesKey = "__reactResources$" + randomKey;
      var internalHoistableMarker = "__reactMarker$" + randomKey;
      function detachDeletedInstance(node) {
        delete node[internalInstanceKey];
        delete node[internalPropsKey];
        delete node[internalEventHandlersKey];
        delete node[internalEventHandlerListenersKey];
        delete node[internalEventHandlesSetKey];
      }
      function getClosestInstanceFromNode(targetNode) {
        var targetInst = targetNode[internalInstanceKey];
        if (targetInst) return targetInst;
        for (var parentNode = targetNode.parentNode; parentNode; ) {
          if (targetInst = parentNode[internalContainerInstanceKey] || parentNode[internalInstanceKey]) {
            parentNode = targetInst.alternate;
            if (null !== targetInst.child || null !== parentNode && null !== parentNode.child)
              for (targetNode = getParentHydrationBoundary(targetNode); null !== targetNode; ) {
                if (parentNode = targetNode[internalInstanceKey]) return parentNode;
                targetNode = getParentHydrationBoundary(targetNode);
              }
            return targetInst;
          }
          targetNode = parentNode;
          parentNode = targetNode.parentNode;
        }
        return null;
      }
      function getInstanceFromNode(node) {
        if (node = node[internalInstanceKey] || node[internalContainerInstanceKey]) {
          var tag = node.tag;
          if (5 === tag || 6 === tag || 13 === tag || 31 === tag || 26 === tag || 27 === tag || 3 === tag)
            return node;
        }
        return null;
      }
      function getNodeFromInstance(inst) {
        var tag = inst.tag;
        if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return inst.stateNode;
        throw Error(formatProdErrorMessage(33));
      }
      function getResourcesFromRoot(root2) {
        var resources = root2[internalRootNodeResourcesKey];
        resources || (resources = root2[internalRootNodeResourcesKey] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() });
        return resources;
      }
      function markNodeAsHoistable(node) {
        node[internalHoistableMarker] = true;
      }
      var allNativeEvents = /* @__PURE__ */ new Set();
      var registrationNameDependencies = {};
      function registerTwoPhaseEvent(registrationName, dependencies) {
        registerDirectEvent(registrationName, dependencies);
        registerDirectEvent(registrationName + "Capture", dependencies);
      }
      function registerDirectEvent(registrationName, dependencies) {
        registrationNameDependencies[registrationName] = dependencies;
        for (registrationName = 0; registrationName < dependencies.length; registrationName++)
          allNativeEvents.add(dependencies[registrationName]);
      }
      var VALID_ATTRIBUTE_NAME_REGEX = RegExp(
        "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
      );
      var illegalAttributeNameCache = {};
      var validatedAttributeNameCache = {};
      function isAttributeNameSafe(attributeName) {
        if (hasOwnProperty2.call(validatedAttributeNameCache, attributeName))
          return true;
        if (hasOwnProperty2.call(illegalAttributeNameCache, attributeName)) return false;
        if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName))
          return validatedAttributeNameCache[attributeName] = true;
        illegalAttributeNameCache[attributeName] = true;
        return false;
      }
      function setValueForAttribute(node, name, value) {
        if (isAttributeNameSafe(name))
          if (null === value) node.removeAttribute(name);
          else {
            switch (typeof value) {
              case "undefined":
              case "function":
              case "symbol":
                node.removeAttribute(name);
                return;
              case "boolean":
                var prefix$10 = name.toLowerCase().slice(0, 5);
                if ("data-" !== prefix$10 && "aria-" !== prefix$10) {
                  node.removeAttribute(name);
                  return;
                }
            }
            node.setAttribute(name, "" + value);
          }
      }
      function setValueForKnownAttribute(node, name, value) {
        if (null === value) node.removeAttribute(name);
        else {
          switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
              node.removeAttribute(name);
              return;
          }
          node.setAttribute(name, "" + value);
        }
      }
      function setValueForNamespacedAttribute(node, namespace, name, value) {
        if (null === value) node.removeAttribute(name);
        else {
          switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
              node.removeAttribute(name);
              return;
          }
          node.setAttributeNS(namespace, name, "" + value);
        }
      }
      function getToStringValue(value) {
        switch (typeof value) {
          case "bigint":
          case "boolean":
          case "number":
          case "string":
          case "undefined":
            return value;
          case "object":
            return value;
          default:
            return "";
        }
      }
      function isCheckable(elem) {
        var type = elem.type;
        return (elem = elem.nodeName) && "input" === elem.toLowerCase() && ("checkbox" === type || "radio" === type);
      }
      function trackValueOnNode(node, valueField, currentValue) {
        var descriptor = Object.getOwnPropertyDescriptor(
          node.constructor.prototype,
          valueField
        );
        if (!node.hasOwnProperty(valueField) && "undefined" !== typeof descriptor && "function" === typeof descriptor.get && "function" === typeof descriptor.set) {
          var get = descriptor.get, set = descriptor.set;
          Object.defineProperty(node, valueField, {
            configurable: true,
            get: function() {
              return get.call(this);
            },
            set: function(value) {
              currentValue = "" + value;
              set.call(this, value);
            }
          });
          Object.defineProperty(node, valueField, {
            enumerable: descriptor.enumerable
          });
          return {
            getValue: function() {
              return currentValue;
            },
            setValue: function(value) {
              currentValue = "" + value;
            },
            stopTracking: function() {
              node._valueTracker = null;
              delete node[valueField];
            }
          };
        }
      }
      function track(node) {
        if (!node._valueTracker) {
          var valueField = isCheckable(node) ? "checked" : "value";
          node._valueTracker = trackValueOnNode(
            node,
            valueField,
            "" + node[valueField]
          );
        }
      }
      function updateValueIfChanged(node) {
        if (!node) return false;
        var tracker = node._valueTracker;
        if (!tracker) return true;
        var lastValue = tracker.getValue();
        var value = "";
        node && (value = isCheckable(node) ? node.checked ? "true" : "false" : node.value);
        node = value;
        return node !== lastValue ? (tracker.setValue(node), true) : false;
      }
      function getActiveElement(doc) {
        doc = doc || ("undefined" !== typeof document ? document : void 0);
        if ("undefined" === typeof doc) return null;
        try {
          return doc.activeElement || doc.body;
        } catch (e2) {
          return doc.body;
        }
      }
      var escapeSelectorAttributeValueInsideDoubleQuotesRegex = /[\n"\\]/g;
      function escapeSelectorAttributeValueInsideDoubleQuotes(value) {
        return value.replace(
          escapeSelectorAttributeValueInsideDoubleQuotesRegex,
          function(ch) {
            return "\\" + ch.charCodeAt(0).toString(16) + " ";
          }
        );
      }
      function updateInput(element, value, defaultValue, lastDefaultValue, checked, defaultChecked, type, name) {
        element.name = "";
        null != type && "function" !== typeof type && "symbol" !== typeof type && "boolean" !== typeof type ? element.type = type : element.removeAttribute("type");
        if (null != value)
          if ("number" === type) {
            if (0 === value && "" === element.value || element.value != value)
              element.value = "" + getToStringValue(value);
          } else
            element.value !== "" + getToStringValue(value) && (element.value = "" + getToStringValue(value));
        else
          "submit" !== type && "reset" !== type || element.removeAttribute("value");
        null != value ? setDefaultValue(element, type, getToStringValue(value)) : null != defaultValue ? setDefaultValue(element, type, getToStringValue(defaultValue)) : null != lastDefaultValue && element.removeAttribute("value");
        null == checked && null != defaultChecked && (element.defaultChecked = !!defaultChecked);
        null != checked && (element.checked = checked && "function" !== typeof checked && "symbol" !== typeof checked);
        null != name && "function" !== typeof name && "symbol" !== typeof name && "boolean" !== typeof name ? element.name = "" + getToStringValue(name) : element.removeAttribute("name");
      }
      function initInput(element, value, defaultValue, checked, defaultChecked, type, name, isHydrating2) {
        null != type && "function" !== typeof type && "symbol" !== typeof type && "boolean" !== typeof type && (element.type = type);
        if (null != value || null != defaultValue) {
          if (!("submit" !== type && "reset" !== type || void 0 !== value && null !== value)) {
            track(element);
            return;
          }
          defaultValue = null != defaultValue ? "" + getToStringValue(defaultValue) : "";
          value = null != value ? "" + getToStringValue(value) : defaultValue;
          isHydrating2 || value === element.value || (element.value = value);
          element.defaultValue = value;
        }
        checked = null != checked ? checked : defaultChecked;
        checked = "function" !== typeof checked && "symbol" !== typeof checked && !!checked;
        element.checked = isHydrating2 ? element.checked : !!checked;
        element.defaultChecked = !!checked;
        null != name && "function" !== typeof name && "symbol" !== typeof name && "boolean" !== typeof name && (element.name = name);
        track(element);
      }
      function setDefaultValue(node, type, value) {
        "number" === type && getActiveElement(node.ownerDocument) === node || node.defaultValue === "" + value || (node.defaultValue = "" + value);
      }
      function updateOptions(node, multiple, propValue, setDefaultSelected) {
        node = node.options;
        if (multiple) {
          multiple = {};
          for (var i2 = 0; i2 < propValue.length; i2++)
            multiple["$" + propValue[i2]] = true;
          for (propValue = 0; propValue < node.length; propValue++)
            i2 = multiple.hasOwnProperty("$" + node[propValue].value), node[propValue].selected !== i2 && (node[propValue].selected = i2), i2 && setDefaultSelected && (node[propValue].defaultSelected = true);
        } else {
          propValue = "" + getToStringValue(propValue);
          multiple = null;
          for (i2 = 0; i2 < node.length; i2++) {
            if (node[i2].value === propValue) {
              node[i2].selected = true;
              setDefaultSelected && (node[i2].defaultSelected = true);
              return;
            }
            null !== multiple || node[i2].disabled || (multiple = node[i2]);
          }
          null !== multiple && (multiple.selected = true);
        }
      }
      function updateTextarea(element, value, defaultValue) {
        if (null != value && (value = "" + getToStringValue(value), value !== element.value && (element.value = value), null == defaultValue)) {
          element.defaultValue !== value && (element.defaultValue = value);
          return;
        }
        element.defaultValue = null != defaultValue ? "" + getToStringValue(defaultValue) : "";
      }
      function initTextarea(element, value, defaultValue, children) {
        if (null == value) {
          if (null != children) {
            if (null != defaultValue) throw Error(formatProdErrorMessage(92));
            if (isArrayImpl(children)) {
              if (1 < children.length) throw Error(formatProdErrorMessage(93));
              children = children[0];
            }
            defaultValue = children;
          }
          null == defaultValue && (defaultValue = "");
          value = defaultValue;
        }
        defaultValue = getToStringValue(value);
        element.defaultValue = defaultValue;
        children = element.textContent;
        children === defaultValue && "" !== children && null !== children && (element.value = children);
        track(element);
      }
      function setTextContent(node, text) {
        if (text) {
          var firstChild = node.firstChild;
          if (firstChild && firstChild === node.lastChild && 3 === firstChild.nodeType) {
            firstChild.nodeValue = text;
            return;
          }
        }
        node.textContent = text;
      }
      var unitlessNumbers = new Set(
        "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
          " "
        )
      );
      function setValueForStyle(style2, styleName, value) {
        var isCustomProperty = 0 === styleName.indexOf("--");
        null == value || "boolean" === typeof value || "" === value ? isCustomProperty ? style2.setProperty(styleName, "") : "float" === styleName ? style2.cssFloat = "" : style2[styleName] = "" : isCustomProperty ? style2.setProperty(styleName, value) : "number" !== typeof value || 0 === value || unitlessNumbers.has(styleName) ? "float" === styleName ? style2.cssFloat = value : style2[styleName] = ("" + value).trim() : style2[styleName] = value + "px";
      }
      function setValueForStyles(node, styles, prevStyles) {
        if (null != styles && "object" !== typeof styles)
          throw Error(formatProdErrorMessage(62));
        node = node.style;
        if (null != prevStyles) {
          for (var styleName in prevStyles)
            !prevStyles.hasOwnProperty(styleName) || null != styles && styles.hasOwnProperty(styleName) || (0 === styleName.indexOf("--") ? node.setProperty(styleName, "") : "float" === styleName ? node.cssFloat = "" : node[styleName] = "");
          for (var styleName$16 in styles)
            styleName = styles[styleName$16], styles.hasOwnProperty(styleName$16) && prevStyles[styleName$16] !== styleName && setValueForStyle(node, styleName$16, styleName);
        } else
          for (var styleName$17 in styles)
            styles.hasOwnProperty(styleName$17) && setValueForStyle(node, styleName$17, styles[styleName$17]);
      }
      function isCustomElement(tagName) {
        if (-1 === tagName.indexOf("-")) return false;
        switch (tagName) {
          case "annotation-xml":
          case "color-profile":
          case "font-face":
          case "font-face-src":
          case "font-face-uri":
          case "font-face-format":
          case "font-face-name":
          case "missing-glyph":
            return false;
          default:
            return true;
        }
      }
      var aliases = /* @__PURE__ */ new Map([
        ["acceptCharset", "accept-charset"],
        ["htmlFor", "for"],
        ["httpEquiv", "http-equiv"],
        ["crossOrigin", "crossorigin"],
        ["accentHeight", "accent-height"],
        ["alignmentBaseline", "alignment-baseline"],
        ["arabicForm", "arabic-form"],
        ["baselineShift", "baseline-shift"],
        ["capHeight", "cap-height"],
        ["clipPath", "clip-path"],
        ["clipRule", "clip-rule"],
        ["colorInterpolation", "color-interpolation"],
        ["colorInterpolationFilters", "color-interpolation-filters"],
        ["colorProfile", "color-profile"],
        ["colorRendering", "color-rendering"],
        ["dominantBaseline", "dominant-baseline"],
        ["enableBackground", "enable-background"],
        ["fillOpacity", "fill-opacity"],
        ["fillRule", "fill-rule"],
        ["floodColor", "flood-color"],
        ["floodOpacity", "flood-opacity"],
        ["fontFamily", "font-family"],
        ["fontSize", "font-size"],
        ["fontSizeAdjust", "font-size-adjust"],
        ["fontStretch", "font-stretch"],
        ["fontStyle", "font-style"],
        ["fontVariant", "font-variant"],
        ["fontWeight", "font-weight"],
        ["glyphName", "glyph-name"],
        ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
        ["glyphOrientationVertical", "glyph-orientation-vertical"],
        ["horizAdvX", "horiz-adv-x"],
        ["horizOriginX", "horiz-origin-x"],
        ["imageRendering", "image-rendering"],
        ["letterSpacing", "letter-spacing"],
        ["lightingColor", "lighting-color"],
        ["markerEnd", "marker-end"],
        ["markerMid", "marker-mid"],
        ["markerStart", "marker-start"],
        ["overlinePosition", "overline-position"],
        ["overlineThickness", "overline-thickness"],
        ["paintOrder", "paint-order"],
        ["panose-1", "panose-1"],
        ["pointerEvents", "pointer-events"],
        ["renderingIntent", "rendering-intent"],
        ["shapeRendering", "shape-rendering"],
        ["stopColor", "stop-color"],
        ["stopOpacity", "stop-opacity"],
        ["strikethroughPosition", "strikethrough-position"],
        ["strikethroughThickness", "strikethrough-thickness"],
        ["strokeDasharray", "stroke-dasharray"],
        ["strokeDashoffset", "stroke-dashoffset"],
        ["strokeLinecap", "stroke-linecap"],
        ["strokeLinejoin", "stroke-linejoin"],
        ["strokeMiterlimit", "stroke-miterlimit"],
        ["strokeOpacity", "stroke-opacity"],
        ["strokeWidth", "stroke-width"],
        ["textAnchor", "text-anchor"],
        ["textDecoration", "text-decoration"],
        ["textRendering", "text-rendering"],
        ["transformOrigin", "transform-origin"],
        ["underlinePosition", "underline-position"],
        ["underlineThickness", "underline-thickness"],
        ["unicodeBidi", "unicode-bidi"],
        ["unicodeRange", "unicode-range"],
        ["unitsPerEm", "units-per-em"],
        ["vAlphabetic", "v-alphabetic"],
        ["vHanging", "v-hanging"],
        ["vIdeographic", "v-ideographic"],
        ["vMathematical", "v-mathematical"],
        ["vectorEffect", "vector-effect"],
        ["vertAdvY", "vert-adv-y"],
        ["vertOriginX", "vert-origin-x"],
        ["vertOriginY", "vert-origin-y"],
        ["wordSpacing", "word-spacing"],
        ["writingMode", "writing-mode"],
        ["xmlnsXlink", "xmlns:xlink"],
        ["xHeight", "x-height"]
      ]);
      var isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
      function sanitizeURL(url) {
        return isJavaScriptProtocol.test("" + url) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : url;
      }
      function noop$1() {
      }
      var currentReplayingEvent = null;
      function getEventTarget(nativeEvent) {
        nativeEvent = nativeEvent.target || nativeEvent.srcElement || window;
        nativeEvent.correspondingUseElement && (nativeEvent = nativeEvent.correspondingUseElement);
        return 3 === nativeEvent.nodeType ? nativeEvent.parentNode : nativeEvent;
      }
      var restoreTarget = null;
      var restoreQueue = null;
      function restoreStateOfTarget(target) {
        var internalInstance = getInstanceFromNode(target);
        if (internalInstance && (target = internalInstance.stateNode)) {
          var props = target[internalPropsKey] || null;
          a: switch (target = internalInstance.stateNode, internalInstance.type) {
            case "input":
              updateInput(
                target,
                props.value,
                props.defaultValue,
                props.defaultValue,
                props.checked,
                props.defaultChecked,
                props.type,
                props.name
              );
              internalInstance = props.name;
              if ("radio" === props.type && null != internalInstance) {
                for (props = target; props.parentNode; ) props = props.parentNode;
                props = props.querySelectorAll(
                  'input[name="' + escapeSelectorAttributeValueInsideDoubleQuotes(
                    "" + internalInstance
                  ) + '"][type="radio"]'
                );
                for (internalInstance = 0; internalInstance < props.length; internalInstance++) {
                  var otherNode = props[internalInstance];
                  if (otherNode !== target && otherNode.form === target.form) {
                    var otherProps = otherNode[internalPropsKey] || null;
                    if (!otherProps) throw Error(formatProdErrorMessage(90));
                    updateInput(
                      otherNode,
                      otherProps.value,
                      otherProps.defaultValue,
                      otherProps.defaultValue,
                      otherProps.checked,
                      otherProps.defaultChecked,
                      otherProps.type,
                      otherProps.name
                    );
                  }
                }
                for (internalInstance = 0; internalInstance < props.length; internalInstance++)
                  otherNode = props[internalInstance], otherNode.form === target.form && updateValueIfChanged(otherNode);
              }
              break a;
            case "textarea":
              updateTextarea(target, props.value, props.defaultValue);
              break a;
            case "select":
              internalInstance = props.value, null != internalInstance && updateOptions(target, !!props.multiple, internalInstance, false);
          }
        }
      }
      var isInsideEventHandler = false;
      function batchedUpdates$1(fn, a2, b2) {
        if (isInsideEventHandler) return fn(a2, b2);
        isInsideEventHandler = true;
        try {
          var JSCompiler_inline_result = fn(a2);
          return JSCompiler_inline_result;
        } finally {
          if (isInsideEventHandler = false, null !== restoreTarget || null !== restoreQueue) {
            if (flushSyncWork$1(), restoreTarget && (a2 = restoreTarget, fn = restoreQueue, restoreQueue = restoreTarget = null, restoreStateOfTarget(a2), fn))
              for (a2 = 0; a2 < fn.length; a2++) restoreStateOfTarget(fn[a2]);
          }
        }
      }
      function getListener(inst, registrationName) {
        var stateNode = inst.stateNode;
        if (null === stateNode) return null;
        var props = stateNode[internalPropsKey] || null;
        if (null === props) return null;
        stateNode = props[registrationName];
        a: switch (registrationName) {
          case "onClick":
          case "onClickCapture":
          case "onDoubleClick":
          case "onDoubleClickCapture":
          case "onMouseDown":
          case "onMouseDownCapture":
          case "onMouseMove":
          case "onMouseMoveCapture":
          case "onMouseUp":
          case "onMouseUpCapture":
          case "onMouseEnter":
            (props = !props.disabled) || (inst = inst.type, props = !("button" === inst || "input" === inst || "select" === inst || "textarea" === inst));
            inst = !props;
            break a;
          default:
            inst = false;
        }
        if (inst) return null;
        if (stateNode && "function" !== typeof stateNode)
          throw Error(
            formatProdErrorMessage(231, registrationName, typeof stateNode)
          );
        return stateNode;
      }
      var canUseDOM = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement);
      var passiveBrowserEventsSupported = false;
      if (canUseDOM)
        try {
          options = {};
          Object.defineProperty(options, "passive", {
            get: function() {
              passiveBrowserEventsSupported = true;
            }
          });
          window.addEventListener("test", options, options);
          window.removeEventListener("test", options, options);
        } catch (e2) {
          passiveBrowserEventsSupported = false;
        }
      var options;
      var root = null;
      var startText = null;
      var fallbackText = null;
      function getData() {
        if (fallbackText) return fallbackText;
        var start, startValue = startText, startLength = startValue.length, end, endValue = "value" in root ? root.value : root.textContent, endLength = endValue.length;
        for (start = 0; start < startLength && startValue[start] === endValue[start]; start++) ;
        var minEnd = startLength - start;
        for (end = 1; end <= minEnd && startValue[startLength - end] === endValue[endLength - end]; end++) ;
        return fallbackText = endValue.slice(start, 1 < end ? 1 - end : void 0);
      }
      function getEventCharCode(nativeEvent) {
        var keyCode = nativeEvent.keyCode;
        "charCode" in nativeEvent ? (nativeEvent = nativeEvent.charCode, 0 === nativeEvent && 13 === keyCode && (nativeEvent = 13)) : nativeEvent = keyCode;
        10 === nativeEvent && (nativeEvent = 13);
        return 32 <= nativeEvent || 13 === nativeEvent ? nativeEvent : 0;
      }
      function functionThatReturnsTrue() {
        return true;
      }
      function functionThatReturnsFalse() {
        return false;
      }
      function createSyntheticEvent(Interface) {
        function SyntheticBaseEvent(reactName, reactEventType, targetInst, nativeEvent, nativeEventTarget) {
          this._reactName = reactName;
          this._targetInst = targetInst;
          this.type = reactEventType;
          this.nativeEvent = nativeEvent;
          this.target = nativeEventTarget;
          this.currentTarget = null;
          for (var propName in Interface)
            Interface.hasOwnProperty(propName) && (reactName = Interface[propName], this[propName] = reactName ? reactName(nativeEvent) : nativeEvent[propName]);
          this.isDefaultPrevented = (null != nativeEvent.defaultPrevented ? nativeEvent.defaultPrevented : false === nativeEvent.returnValue) ? functionThatReturnsTrue : functionThatReturnsFalse;
          this.isPropagationStopped = functionThatReturnsFalse;
          return this;
        }
        assign3(SyntheticBaseEvent.prototype, {
          preventDefault: function() {
            this.defaultPrevented = true;
            var event = this.nativeEvent;
            event && (event.preventDefault ? event.preventDefault() : "unknown" !== typeof event.returnValue && (event.returnValue = false), this.isDefaultPrevented = functionThatReturnsTrue);
          },
          stopPropagation: function() {
            var event = this.nativeEvent;
            event && (event.stopPropagation ? event.stopPropagation() : "unknown" !== typeof event.cancelBubble && (event.cancelBubble = true), this.isPropagationStopped = functionThatReturnsTrue);
          },
          persist: function() {
          },
          isPersistent: functionThatReturnsTrue
        });
        return SyntheticBaseEvent;
      }
      var EventInterface = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function(event) {
          return event.timeStamp || Date.now();
        },
        defaultPrevented: 0,
        isTrusted: 0
      };
      var SyntheticEvent = createSyntheticEvent(EventInterface);
      var UIEventInterface = assign3({}, EventInterface, { view: 0, detail: 0 });
      var SyntheticUIEvent = createSyntheticEvent(UIEventInterface);
      var lastMovementX;
      var lastMovementY;
      var lastMouseEvent;
      var MouseEventInterface = assign3({}, UIEventInterface, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: getEventModifierState,
        button: 0,
        buttons: 0,
        relatedTarget: function(event) {
          return void 0 === event.relatedTarget ? event.fromElement === event.srcElement ? event.toElement : event.fromElement : event.relatedTarget;
        },
        movementX: function(event) {
          if ("movementX" in event) return event.movementX;
          event !== lastMouseEvent && (lastMouseEvent && "mousemove" === event.type ? (lastMovementX = event.screenX - lastMouseEvent.screenX, lastMovementY = event.screenY - lastMouseEvent.screenY) : lastMovementY = lastMovementX = 0, lastMouseEvent = event);
          return lastMovementX;
        },
        movementY: function(event) {
          return "movementY" in event ? event.movementY : lastMovementY;
        }
      });
      var SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface);
      var DragEventInterface = assign3({}, MouseEventInterface, { dataTransfer: 0 });
      var SyntheticDragEvent = createSyntheticEvent(DragEventInterface);
      var FocusEventInterface = assign3({}, UIEventInterface, { relatedTarget: 0 });
      var SyntheticFocusEvent = createSyntheticEvent(FocusEventInterface);
      var AnimationEventInterface = assign3({}, EventInterface, {
        animationName: 0,
        elapsedTime: 0,
        pseudoElement: 0
      });
      var SyntheticAnimationEvent = createSyntheticEvent(AnimationEventInterface);
      var ClipboardEventInterface = assign3({}, EventInterface, {
        clipboardData: function(event) {
          return "clipboardData" in event ? event.clipboardData : window.clipboardData;
        }
      });
      var SyntheticClipboardEvent = createSyntheticEvent(ClipboardEventInterface);
      var CompositionEventInterface = assign3({}, EventInterface, { data: 0 });
      var SyntheticCompositionEvent = createSyntheticEvent(CompositionEventInterface);
      var normalizeKey = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
      };
      var translateToKey = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
      };
      var modifierKeyToProp = {
        Alt: "altKey",
        Control: "ctrlKey",
        Meta: "metaKey",
        Shift: "shiftKey"
      };
      function modifierStateGetter(keyArg) {
        var nativeEvent = this.nativeEvent;
        return nativeEvent.getModifierState ? nativeEvent.getModifierState(keyArg) : (keyArg = modifierKeyToProp[keyArg]) ? !!nativeEvent[keyArg] : false;
      }
      function getEventModifierState() {
        return modifierStateGetter;
      }
      var KeyboardEventInterface = assign3({}, UIEventInterface, {
        key: function(nativeEvent) {
          if (nativeEvent.key) {
            var key = normalizeKey[nativeEvent.key] || nativeEvent.key;
            if ("Unidentified" !== key) return key;
          }
          return "keypress" === nativeEvent.type ? (nativeEvent = getEventCharCode(nativeEvent), 13 === nativeEvent ? "Enter" : String.fromCharCode(nativeEvent)) : "keydown" === nativeEvent.type || "keyup" === nativeEvent.type ? translateToKey[nativeEvent.keyCode] || "Unidentified" : "";
        },
        code: 0,
        location: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        repeat: 0,
        locale: 0,
        getModifierState: getEventModifierState,
        charCode: function(event) {
          return "keypress" === event.type ? getEventCharCode(event) : 0;
        },
        keyCode: function(event) {
          return "keydown" === event.type || "keyup" === event.type ? event.keyCode : 0;
        },
        which: function(event) {
          return "keypress" === event.type ? getEventCharCode(event) : "keydown" === event.type || "keyup" === event.type ? event.keyCode : 0;
        }
      });
      var SyntheticKeyboardEvent = createSyntheticEvent(KeyboardEventInterface);
      var PointerEventInterface = assign3({}, MouseEventInterface, {
        pointerId: 0,
        width: 0,
        height: 0,
        pressure: 0,
        tangentialPressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 0,
        isPrimary: 0
      });
      var SyntheticPointerEvent = createSyntheticEvent(PointerEventInterface);
      var TouchEventInterface = assign3({}, UIEventInterface, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: getEventModifierState
      });
      var SyntheticTouchEvent = createSyntheticEvent(TouchEventInterface);
      var TransitionEventInterface = assign3({}, EventInterface, {
        propertyName: 0,
        elapsedTime: 0,
        pseudoElement: 0
      });
      var SyntheticTransitionEvent = createSyntheticEvent(TransitionEventInterface);
      var WheelEventInterface = assign3({}, MouseEventInterface, {
        deltaX: function(event) {
          return "deltaX" in event ? event.deltaX : "wheelDeltaX" in event ? -event.wheelDeltaX : 0;
        },
        deltaY: function(event) {
          return "deltaY" in event ? event.deltaY : "wheelDeltaY" in event ? -event.wheelDeltaY : "wheelDelta" in event ? -event.wheelDelta : 0;
        },
        deltaZ: 0,
        deltaMode: 0
      });
      var SyntheticWheelEvent = createSyntheticEvent(WheelEventInterface);
      var ToggleEventInterface = assign3({}, EventInterface, {
        newState: 0,
        oldState: 0
      });
      var SyntheticToggleEvent = createSyntheticEvent(ToggleEventInterface);
      var END_KEYCODES = [9, 13, 27, 32];
      var canUseCompositionEvent = canUseDOM && "CompositionEvent" in window;
      var documentMode = null;
      canUseDOM && "documentMode" in document && (documentMode = document.documentMode);
      var canUseTextInputEvent = canUseDOM && "TextEvent" in window && !documentMode;
      var useFallbackCompositionData = canUseDOM && (!canUseCompositionEvent || documentMode && 8 < documentMode && 11 >= documentMode);
      var SPACEBAR_CHAR = String.fromCharCode(32);
      var hasSpaceKeypress = false;
      function isFallbackCompositionEnd(domEventName, nativeEvent) {
        switch (domEventName) {
          case "keyup":
            return -1 !== END_KEYCODES.indexOf(nativeEvent.keyCode);
          case "keydown":
            return 229 !== nativeEvent.keyCode;
          case "keypress":
          case "mousedown":
          case "focusout":
            return true;
          default:
            return false;
        }
      }
      function getDataFromCustomEvent(nativeEvent) {
        nativeEvent = nativeEvent.detail;
        return "object" === typeof nativeEvent && "data" in nativeEvent ? nativeEvent.data : null;
      }
      var isComposing = false;
      function getNativeBeforeInputChars(domEventName, nativeEvent) {
        switch (domEventName) {
          case "compositionend":
            return getDataFromCustomEvent(nativeEvent);
          case "keypress":
            if (32 !== nativeEvent.which) return null;
            hasSpaceKeypress = true;
            return SPACEBAR_CHAR;
          case "textInput":
            return domEventName = nativeEvent.data, domEventName === SPACEBAR_CHAR && hasSpaceKeypress ? null : domEventName;
          default:
            return null;
        }
      }
      function getFallbackBeforeInputChars(domEventName, nativeEvent) {
        if (isComposing)
          return "compositionend" === domEventName || !canUseCompositionEvent && isFallbackCompositionEnd(domEventName, nativeEvent) ? (domEventName = getData(), fallbackText = startText = root = null, isComposing = false, domEventName) : null;
        switch (domEventName) {
          case "paste":
            return null;
          case "keypress":
            if (!(nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) || nativeEvent.ctrlKey && nativeEvent.altKey) {
              if (nativeEvent.char && 1 < nativeEvent.char.length)
                return nativeEvent.char;
              if (nativeEvent.which) return String.fromCharCode(nativeEvent.which);
            }
            return null;
          case "compositionend":
            return useFallbackCompositionData && "ko" !== nativeEvent.locale ? null : nativeEvent.data;
          default:
            return null;
        }
      }
      var supportedInputTypes = {
        color: true,
        date: true,
        datetime: true,
        "datetime-local": true,
        email: true,
        month: true,
        number: true,
        password: true,
        range: true,
        search: true,
        tel: true,
        text: true,
        time: true,
        url: true,
        week: true
      };
      function isTextInputElement(elem) {
        var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
        return "input" === nodeName ? !!supportedInputTypes[elem.type] : "textarea" === nodeName ? true : false;
      }
      function createAndAccumulateChangeEvent(dispatchQueue, inst, nativeEvent, target) {
        restoreTarget ? restoreQueue ? restoreQueue.push(target) : restoreQueue = [target] : restoreTarget = target;
        inst = accumulateTwoPhaseListeners(inst, "onChange");
        0 < inst.length && (nativeEvent = new SyntheticEvent(
          "onChange",
          "change",
          null,
          nativeEvent,
          target
        ), dispatchQueue.push({ event: nativeEvent, listeners: inst }));
      }
      var activeElement$1 = null;
      var activeElementInst$1 = null;
      function runEventInBatch(dispatchQueue) {
        processDispatchQueue(dispatchQueue, 0);
      }
      function getInstIfValueChanged(targetInst) {
        var targetNode = getNodeFromInstance(targetInst);
        if (updateValueIfChanged(targetNode)) return targetInst;
      }
      function getTargetInstForChangeEvent(domEventName, targetInst) {
        if ("change" === domEventName) return targetInst;
      }
      var isInputEventSupported = false;
      if (canUseDOM) {
        if (canUseDOM) {
          isSupported$jscomp$inline_427 = "oninput" in document;
          if (!isSupported$jscomp$inline_427) {
            element$jscomp$inline_428 = document.createElement("div");
            element$jscomp$inline_428.setAttribute("oninput", "return;");
            isSupported$jscomp$inline_427 = "function" === typeof element$jscomp$inline_428.oninput;
          }
          JSCompiler_inline_result$jscomp$286 = isSupported$jscomp$inline_427;
        } else JSCompiler_inline_result$jscomp$286 = false;
        isInputEventSupported = JSCompiler_inline_result$jscomp$286 && (!document.documentMode || 9 < document.documentMode);
      }
      var JSCompiler_inline_result$jscomp$286;
      var isSupported$jscomp$inline_427;
      var element$jscomp$inline_428;
      function stopWatchingForValueChange() {
        activeElement$1 && (activeElement$1.detachEvent("onpropertychange", handlePropertyChange), activeElementInst$1 = activeElement$1 = null);
      }
      function handlePropertyChange(nativeEvent) {
        if ("value" === nativeEvent.propertyName && getInstIfValueChanged(activeElementInst$1)) {
          var dispatchQueue = [];
          createAndAccumulateChangeEvent(
            dispatchQueue,
            activeElementInst$1,
            nativeEvent,
            getEventTarget(nativeEvent)
          );
          batchedUpdates$1(runEventInBatch, dispatchQueue);
        }
      }
      function handleEventsForInputEventPolyfill(domEventName, target, targetInst) {
        "focusin" === domEventName ? (stopWatchingForValueChange(), activeElement$1 = target, activeElementInst$1 = targetInst, activeElement$1.attachEvent("onpropertychange", handlePropertyChange)) : "focusout" === domEventName && stopWatchingForValueChange();
      }
      function getTargetInstForInputEventPolyfill(domEventName) {
        if ("selectionchange" === domEventName || "keyup" === domEventName || "keydown" === domEventName)
          return getInstIfValueChanged(activeElementInst$1);
      }
      function getTargetInstForClickEvent(domEventName, targetInst) {
        if ("click" === domEventName) return getInstIfValueChanged(targetInst);
      }
      function getTargetInstForInputOrChangeEvent(domEventName, targetInst) {
        if ("input" === domEventName || "change" === domEventName)
          return getInstIfValueChanged(targetInst);
      }
      function is(x, y2) {
        return x === y2 && (0 !== x || 1 / x === 1 / y2) || x !== x && y2 !== y2;
      }
      var objectIs = "function" === typeof Object.is ? Object.is : is;
      function shallowEqual(objA, objB) {
        if (objectIs(objA, objB)) return true;
        if ("object" !== typeof objA || null === objA || "object" !== typeof objB || null === objB)
          return false;
        var keysA = Object.keys(objA), keysB = Object.keys(objB);
        if (keysA.length !== keysB.length) return false;
        for (keysB = 0; keysB < keysA.length; keysB++) {
          var currentKey = keysA[keysB];
          if (!hasOwnProperty2.call(objB, currentKey) || !objectIs(objA[currentKey], objB[currentKey]))
            return false;
        }
        return true;
      }
      function getLeafNode(node) {
        for (; node && node.firstChild; ) node = node.firstChild;
        return node;
      }
      function getNodeForCharacterOffset(root2, offset) {
        var node = getLeafNode(root2);
        root2 = 0;
        for (var nodeEnd; node; ) {
          if (3 === node.nodeType) {
            nodeEnd = root2 + node.textContent.length;
            if (root2 <= offset && nodeEnd >= offset)
              return { node, offset: offset - root2 };
            root2 = nodeEnd;
          }
          a: {
            for (; node; ) {
              if (node.nextSibling) {
                node = node.nextSibling;
                break a;
              }
              node = node.parentNode;
            }
            node = void 0;
          }
          node = getLeafNode(node);
        }
      }
      function containsNode(outerNode, innerNode) {
        return outerNode && innerNode ? outerNode === innerNode ? true : outerNode && 3 === outerNode.nodeType ? false : innerNode && 3 === innerNode.nodeType ? containsNode(outerNode, innerNode.parentNode) : "contains" in outerNode ? outerNode.contains(innerNode) : outerNode.compareDocumentPosition ? !!(outerNode.compareDocumentPosition(innerNode) & 16) : false : false;
      }
      function getActiveElementDeep(containerInfo) {
        containerInfo = null != containerInfo && null != containerInfo.ownerDocument && null != containerInfo.ownerDocument.defaultView ? containerInfo.ownerDocument.defaultView : window;
        for (var element = getActiveElement(containerInfo.document); element instanceof containerInfo.HTMLIFrameElement; ) {
          try {
            var JSCompiler_inline_result = "string" === typeof element.contentWindow.location.href;
          } catch (err) {
            JSCompiler_inline_result = false;
          }
          if (JSCompiler_inline_result) containerInfo = element.contentWindow;
          else break;
          element = getActiveElement(containerInfo.document);
        }
        return element;
      }
      function hasSelectionCapabilities(elem) {
        var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
        return nodeName && ("input" === nodeName && ("text" === elem.type || "search" === elem.type || "tel" === elem.type || "url" === elem.type || "password" === elem.type) || "textarea" === nodeName || "true" === elem.contentEditable);
      }
      var skipSelectionChangeEvent = canUseDOM && "documentMode" in document && 11 >= document.documentMode;
      var activeElement = null;
      var activeElementInst = null;
      var lastSelection = null;
      var mouseDown = false;
      function constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget) {
        var doc = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget.document : 9 === nativeEventTarget.nodeType ? nativeEventTarget : nativeEventTarget.ownerDocument;
        mouseDown || null == activeElement || activeElement !== getActiveElement(doc) || (doc = activeElement, "selectionStart" in doc && hasSelectionCapabilities(doc) ? doc = { start: doc.selectionStart, end: doc.selectionEnd } : (doc = (doc.ownerDocument && doc.ownerDocument.defaultView || window).getSelection(), doc = {
          anchorNode: doc.anchorNode,
          anchorOffset: doc.anchorOffset,
          focusNode: doc.focusNode,
          focusOffset: doc.focusOffset
        }), lastSelection && shallowEqual(lastSelection, doc) || (lastSelection = doc, doc = accumulateTwoPhaseListeners(activeElementInst, "onSelect"), 0 < doc.length && (nativeEvent = new SyntheticEvent(
          "onSelect",
          "select",
          null,
          nativeEvent,
          nativeEventTarget
        ), dispatchQueue.push({ event: nativeEvent, listeners: doc }), nativeEvent.target = activeElement)));
      }
      function makePrefixMap(styleProp, eventName) {
        var prefixes = {};
        prefixes[styleProp.toLowerCase()] = eventName.toLowerCase();
        prefixes["Webkit" + styleProp] = "webkit" + eventName;
        prefixes["Moz" + styleProp] = "moz" + eventName;
        return prefixes;
      }
      var vendorPrefixes = {
        animationend: makePrefixMap("Animation", "AnimationEnd"),
        animationiteration: makePrefixMap("Animation", "AnimationIteration"),
        animationstart: makePrefixMap("Animation", "AnimationStart"),
        transitionrun: makePrefixMap("Transition", "TransitionRun"),
        transitionstart: makePrefixMap("Transition", "TransitionStart"),
        transitioncancel: makePrefixMap("Transition", "TransitionCancel"),
        transitionend: makePrefixMap("Transition", "TransitionEnd")
      };
      var prefixedEventNames = {};
      var style = {};
      canUseDOM && (style = document.createElement("div").style, "AnimationEvent" in window || (delete vendorPrefixes.animationend.animation, delete vendorPrefixes.animationiteration.animation, delete vendorPrefixes.animationstart.animation), "TransitionEvent" in window || delete vendorPrefixes.transitionend.transition);
      function getVendorPrefixedEventName(eventName) {
        if (prefixedEventNames[eventName]) return prefixedEventNames[eventName];
        if (!vendorPrefixes[eventName]) return eventName;
        var prefixMap = vendorPrefixes[eventName], styleProp;
        for (styleProp in prefixMap)
          if (prefixMap.hasOwnProperty(styleProp) && styleProp in style)
            return prefixedEventNames[eventName] = prefixMap[styleProp];
        return eventName;
      }
      var ANIMATION_END = getVendorPrefixedEventName("animationend");
      var ANIMATION_ITERATION = getVendorPrefixedEventName("animationiteration");
      var ANIMATION_START = getVendorPrefixedEventName("animationstart");
      var TRANSITION_RUN = getVendorPrefixedEventName("transitionrun");
      var TRANSITION_START = getVendorPrefixedEventName("transitionstart");
      var TRANSITION_CANCEL = getVendorPrefixedEventName("transitioncancel");
      var TRANSITION_END = getVendorPrefixedEventName("transitionend");
      var topLevelEventsToReactNames = /* @__PURE__ */ new Map();
      var simpleEventPluginEvents = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
        " "
      );
      simpleEventPluginEvents.push("scrollEnd");
      function registerSimpleEvent(domEventName, reactName) {
        topLevelEventsToReactNames.set(domEventName, reactName);
        registerTwoPhaseEvent(reactName, [domEventName]);
      }
      var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
        if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
          var event = new window.ErrorEvent("error", {
            bubbles: true,
            cancelable: true,
            message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
            error
          });
          if (!window.dispatchEvent(event)) return;
        } else if ("object" === typeof process && "function" === typeof process.emit) {
          process.emit("uncaughtException", error);
          return;
        }
        console.error(error);
      };
      var concurrentQueues = [];
      var concurrentQueuesIndex = 0;
      var concurrentlyUpdatedLanes = 0;
      function finishQueueingConcurrentUpdates() {
        for (var endIndex = concurrentQueuesIndex, i2 = concurrentlyUpdatedLanes = concurrentQueuesIndex = 0; i2 < endIndex; ) {
          var fiber = concurrentQueues[i2];
          concurrentQueues[i2++] = null;
          var queue = concurrentQueues[i2];
          concurrentQueues[i2++] = null;
          var update = concurrentQueues[i2];
          concurrentQueues[i2++] = null;
          var lane = concurrentQueues[i2];
          concurrentQueues[i2++] = null;
          if (null !== queue && null !== update) {
            var pending = queue.pending;
            null === pending ? update.next = update : (update.next = pending.next, pending.next = update);
            queue.pending = update;
          }
          0 !== lane && markUpdateLaneFromFiberToRoot(fiber, update, lane);
        }
      }
      function enqueueUpdate$1(fiber, queue, update, lane) {
        concurrentQueues[concurrentQueuesIndex++] = fiber;
        concurrentQueues[concurrentQueuesIndex++] = queue;
        concurrentQueues[concurrentQueuesIndex++] = update;
        concurrentQueues[concurrentQueuesIndex++] = lane;
        concurrentlyUpdatedLanes |= lane;
        fiber.lanes |= lane;
        fiber = fiber.alternate;
        null !== fiber && (fiber.lanes |= lane);
      }
      function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
        enqueueUpdate$1(fiber, queue, update, lane);
        return getRootForUpdatedFiber(fiber);
      }
      function enqueueConcurrentRenderForLane(fiber, lane) {
        enqueueUpdate$1(fiber, null, null, lane);
        return getRootForUpdatedFiber(fiber);
      }
      function markUpdateLaneFromFiberToRoot(sourceFiber, update, lane) {
        sourceFiber.lanes |= lane;
        var alternate = sourceFiber.alternate;
        null !== alternate && (alternate.lanes |= lane);
        for (var isHidden = false, parent = sourceFiber.return; null !== parent; )
          parent.childLanes |= lane, alternate = parent.alternate, null !== alternate && (alternate.childLanes |= lane), 22 === parent.tag && (sourceFiber = parent.stateNode, null === sourceFiber || sourceFiber._visibility & 1 || (isHidden = true)), sourceFiber = parent, parent = parent.return;
        return 3 === sourceFiber.tag ? (parent = sourceFiber.stateNode, isHidden && null !== update && (isHidden = 31 - clz32(lane), sourceFiber = parent.hiddenUpdates, alternate = sourceFiber[isHidden], null === alternate ? sourceFiber[isHidden] = [update] : alternate.push(update), update.lane = lane | 536870912), parent) : null;
      }
      function getRootForUpdatedFiber(sourceFiber) {
        if (50 < nestedUpdateCount)
          throw nestedUpdateCount = 0, rootWithNestedUpdates = null, Error(formatProdErrorMessage(185));
        for (var parent = sourceFiber.return; null !== parent; )
          sourceFiber = parent, parent = sourceFiber.return;
        return 3 === sourceFiber.tag ? sourceFiber.stateNode : null;
      }
      var emptyContextObject = {};
      function FiberNode(tag, pendingProps, key, mode) {
        this.tag = tag;
        this.key = key;
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
        this.index = 0;
        this.refCleanup = this.ref = null;
        this.pendingProps = pendingProps;
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
        this.mode = mode;
        this.subtreeFlags = this.flags = 0;
        this.deletions = null;
        this.childLanes = this.lanes = 0;
        this.alternate = null;
      }
      function createFiberImplClass(tag, pendingProps, key, mode) {
        return new FiberNode(tag, pendingProps, key, mode);
      }
      function shouldConstruct(Component) {
        Component = Component.prototype;
        return !(!Component || !Component.isReactComponent);
      }
      function createWorkInProgress(current, pendingProps) {
        var workInProgress2 = current.alternate;
        null === workInProgress2 ? (workInProgress2 = createFiberImplClass(
          current.tag,
          pendingProps,
          current.key,
          current.mode
        ), workInProgress2.elementType = current.elementType, workInProgress2.type = current.type, workInProgress2.stateNode = current.stateNode, workInProgress2.alternate = current, current.alternate = workInProgress2) : (workInProgress2.pendingProps = pendingProps, workInProgress2.type = current.type, workInProgress2.flags = 0, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null);
        workInProgress2.flags = current.flags & 65011712;
        workInProgress2.childLanes = current.childLanes;
        workInProgress2.lanes = current.lanes;
        workInProgress2.child = current.child;
        workInProgress2.memoizedProps = current.memoizedProps;
        workInProgress2.memoizedState = current.memoizedState;
        workInProgress2.updateQueue = current.updateQueue;
        pendingProps = current.dependencies;
        workInProgress2.dependencies = null === pendingProps ? null : { lanes: pendingProps.lanes, firstContext: pendingProps.firstContext };
        workInProgress2.sibling = current.sibling;
        workInProgress2.index = current.index;
        workInProgress2.ref = current.ref;
        workInProgress2.refCleanup = current.refCleanup;
        return workInProgress2;
      }
      function resetWorkInProgress(workInProgress2, renderLanes2) {
        workInProgress2.flags &= 65011714;
        var current = workInProgress2.alternate;
        null === current ? (workInProgress2.childLanes = 0, workInProgress2.lanes = renderLanes2, workInProgress2.child = null, workInProgress2.subtreeFlags = 0, workInProgress2.memoizedProps = null, workInProgress2.memoizedState = null, workInProgress2.updateQueue = null, workInProgress2.dependencies = null, workInProgress2.stateNode = null) : (workInProgress2.childLanes = current.childLanes, workInProgress2.lanes = current.lanes, workInProgress2.child = current.child, workInProgress2.subtreeFlags = 0, workInProgress2.deletions = null, workInProgress2.memoizedProps = current.memoizedProps, workInProgress2.memoizedState = current.memoizedState, workInProgress2.updateQueue = current.updateQueue, workInProgress2.type = current.type, renderLanes2 = current.dependencies, workInProgress2.dependencies = null === renderLanes2 ? null : {
          lanes: renderLanes2.lanes,
          firstContext: renderLanes2.firstContext
        });
        return workInProgress2;
      }
      function createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, lanes) {
        var fiberTag = 0;
        owner = type;
        if ("function" === typeof type) shouldConstruct(type) && (fiberTag = 1);
        else if ("string" === typeof type)
          fiberTag = isHostHoistableType(
            type,
            pendingProps,
            contextStackCursor.current
          ) ? 26 : "html" === type || "head" === type || "body" === type ? 27 : 5;
        else
          a: switch (type) {
            case REACT_ACTIVITY_TYPE:
              return type = createFiberImplClass(31, pendingProps, key, mode), type.elementType = REACT_ACTIVITY_TYPE, type.lanes = lanes, type;
            case REACT_FRAGMENT_TYPE:
              return createFiberFromFragment(pendingProps.children, mode, lanes, key);
            case REACT_STRICT_MODE_TYPE:
              fiberTag = 8;
              mode |= 24;
              break;
            case REACT_PROFILER_TYPE:
              return type = createFiberImplClass(12, pendingProps, key, mode | 2), type.elementType = REACT_PROFILER_TYPE, type.lanes = lanes, type;
            case REACT_SUSPENSE_TYPE:
              return type = createFiberImplClass(13, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_TYPE, type.lanes = lanes, type;
            case REACT_SUSPENSE_LIST_TYPE:
              return type = createFiberImplClass(19, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_LIST_TYPE, type.lanes = lanes, type;
            default:
              if ("object" === typeof type && null !== type)
                switch (type.$$typeof) {
                  case REACT_CONTEXT_TYPE:
                    fiberTag = 10;
                    break a;
                  case REACT_CONSUMER_TYPE:
                    fiberTag = 9;
                    break a;
                  case REACT_FORWARD_REF_TYPE:
                    fiberTag = 11;
                    break a;
                  case REACT_MEMO_TYPE:
                    fiberTag = 14;
                    break a;
                  case REACT_LAZY_TYPE:
                    fiberTag = 16;
                    owner = null;
                    break a;
                }
              fiberTag = 29;
              pendingProps = Error(
                formatProdErrorMessage(130, null === type ? "null" : typeof type, "")
              );
              owner = null;
          }
        key = createFiberImplClass(fiberTag, pendingProps, key, mode);
        key.elementType = type;
        key.type = owner;
        key.lanes = lanes;
        return key;
      }
      function createFiberFromFragment(elements, mode, lanes, key) {
        elements = createFiberImplClass(7, elements, key, mode);
        elements.lanes = lanes;
        return elements;
      }
      function createFiberFromText(content, mode, lanes) {
        content = createFiberImplClass(6, content, null, mode);
        content.lanes = lanes;
        return content;
      }
      function createFiberFromDehydratedFragment(dehydratedNode) {
        var fiber = createFiberImplClass(18, null, null, 0);
        fiber.stateNode = dehydratedNode;
        return fiber;
      }
      function createFiberFromPortal(portal, mode, lanes) {
        mode = createFiberImplClass(
          4,
          null !== portal.children ? portal.children : [],
          portal.key,
          mode
        );
        mode.lanes = lanes;
        mode.stateNode = {
          containerInfo: portal.containerInfo,
          pendingChildren: null,
          implementation: portal.implementation
        };
        return mode;
      }
      var CapturedStacks = /* @__PURE__ */ new WeakMap();
      function createCapturedValueAtFiber(value, source) {
        if ("object" === typeof value && null !== value) {
          var existing = CapturedStacks.get(value);
          if (void 0 !== existing) return existing;
          source = {
            value,
            source,
            stack: getStackByFiberInDevAndProd(source)
          };
          CapturedStacks.set(value, source);
          return source;
        }
        return {
          value,
          source,
          stack: getStackByFiberInDevAndProd(source)
        };
      }
      var forkStack = [];
      var forkStackIndex = 0;
      var treeForkProvider = null;
      var treeForkCount = 0;
      var idStack = [];
      var idStackIndex = 0;
      var treeContextProvider = null;
      var treeContextId = 1;
      var treeContextOverflow = "";
      function pushTreeFork(workInProgress2, totalChildren) {
        forkStack[forkStackIndex++] = treeForkCount;
        forkStack[forkStackIndex++] = treeForkProvider;
        treeForkProvider = workInProgress2;
        treeForkCount = totalChildren;
      }
      function pushTreeId(workInProgress2, totalChildren, index2) {
        idStack[idStackIndex++] = treeContextId;
        idStack[idStackIndex++] = treeContextOverflow;
        idStack[idStackIndex++] = treeContextProvider;
        treeContextProvider = workInProgress2;
        var baseIdWithLeadingBit = treeContextId;
        workInProgress2 = treeContextOverflow;
        var baseLength = 32 - clz32(baseIdWithLeadingBit) - 1;
        baseIdWithLeadingBit &= ~(1 << baseLength);
        index2 += 1;
        var length = 32 - clz32(totalChildren) + baseLength;
        if (30 < length) {
          var numberOfOverflowBits = baseLength - baseLength % 5;
          length = (baseIdWithLeadingBit & (1 << numberOfOverflowBits) - 1).toString(32);
          baseIdWithLeadingBit >>= numberOfOverflowBits;
          baseLength -= numberOfOverflowBits;
          treeContextId = 1 << 32 - clz32(totalChildren) + baseLength | index2 << baseLength | baseIdWithLeadingBit;
          treeContextOverflow = length + workInProgress2;
        } else
          treeContextId = 1 << length | index2 << baseLength | baseIdWithLeadingBit, treeContextOverflow = workInProgress2;
      }
      function pushMaterializedTreeId(workInProgress2) {
        null !== workInProgress2.return && (pushTreeFork(workInProgress2, 1), pushTreeId(workInProgress2, 1, 0));
      }
      function popTreeContext(workInProgress2) {
        for (; workInProgress2 === treeForkProvider; )
          treeForkProvider = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null, treeForkCount = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null;
        for (; workInProgress2 === treeContextProvider; )
          treeContextProvider = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextOverflow = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextId = idStack[--idStackIndex], idStack[idStackIndex] = null;
      }
      function restoreSuspendedTreeContext(workInProgress2, suspendedContext) {
        idStack[idStackIndex++] = treeContextId;
        idStack[idStackIndex++] = treeContextOverflow;
        idStack[idStackIndex++] = treeContextProvider;
        treeContextId = suspendedContext.id;
        treeContextOverflow = suspendedContext.overflow;
        treeContextProvider = workInProgress2;
      }
      var hydrationParentFiber = null;
      var nextHydratableInstance = null;
      var isHydrating = false;
      var hydrationErrors = null;
      var rootOrSingletonContext = false;
      var HydrationMismatchException = Error(formatProdErrorMessage(519));
      function throwOnHydrationMismatch(fiber) {
        var error = Error(
          formatProdErrorMessage(
            418,
            1 < arguments.length && void 0 !== arguments[1] && arguments[1] ? "text" : "HTML",
            ""
          )
        );
        queueHydrationError(createCapturedValueAtFiber(error, fiber));
        throw HydrationMismatchException;
      }
      function prepareToHydrateHostInstance(fiber) {
        var instance = fiber.stateNode, type = fiber.type, props = fiber.memoizedProps;
        instance[internalInstanceKey] = fiber;
        instance[internalPropsKey] = props;
        switch (type) {
          case "dialog":
            listenToNonDelegatedEvent("cancel", instance);
            listenToNonDelegatedEvent("close", instance);
            break;
          case "iframe":
          case "object":
          case "embed":
            listenToNonDelegatedEvent("load", instance);
            break;
          case "video":
          case "audio":
            for (type = 0; type < mediaEventTypes.length; type++)
              listenToNonDelegatedEvent(mediaEventTypes[type], instance);
            break;
          case "source":
            listenToNonDelegatedEvent("error", instance);
            break;
          case "img":
          case "image":
          case "link":
            listenToNonDelegatedEvent("error", instance);
            listenToNonDelegatedEvent("load", instance);
            break;
          case "details":
            listenToNonDelegatedEvent("toggle", instance);
            break;
          case "input":
            listenToNonDelegatedEvent("invalid", instance);
            initInput(
              instance,
              props.value,
              props.defaultValue,
              props.checked,
              props.defaultChecked,
              props.type,
              props.name,
              true
            );
            break;
          case "select":
            listenToNonDelegatedEvent("invalid", instance);
            break;
          case "textarea":
            listenToNonDelegatedEvent("invalid", instance), initTextarea(instance, props.value, props.defaultValue, props.children);
        }
        type = props.children;
        "string" !== typeof type && "number" !== typeof type && "bigint" !== typeof type || instance.textContent === "" + type || true === props.suppressHydrationWarning || checkForUnmatchedText(instance.textContent, type) ? (null != props.popover && (listenToNonDelegatedEvent("beforetoggle", instance), listenToNonDelegatedEvent("toggle", instance)), null != props.onScroll && listenToNonDelegatedEvent("scroll", instance), null != props.onScrollEnd && listenToNonDelegatedEvent("scrollend", instance), null != props.onClick && (instance.onclick = noop$1), instance = true) : instance = false;
        instance || throwOnHydrationMismatch(fiber, true);
      }
      function popToNextHostParent(fiber) {
        for (hydrationParentFiber = fiber.return; hydrationParentFiber; )
          switch (hydrationParentFiber.tag) {
            case 5:
            case 31:
            case 13:
              rootOrSingletonContext = false;
              return;
            case 27:
            case 3:
              rootOrSingletonContext = true;
              return;
            default:
              hydrationParentFiber = hydrationParentFiber.return;
          }
      }
      function popHydrationState(fiber) {
        if (fiber !== hydrationParentFiber) return false;
        if (!isHydrating) return popToNextHostParent(fiber), isHydrating = true, false;
        var tag = fiber.tag, JSCompiler_temp;
        if (JSCompiler_temp = 3 !== tag && 27 !== tag) {
          if (JSCompiler_temp = 5 === tag)
            JSCompiler_temp = fiber.type, JSCompiler_temp = !("form" !== JSCompiler_temp && "button" !== JSCompiler_temp) || shouldSetTextContent(fiber.type, fiber.memoizedProps);
          JSCompiler_temp = !JSCompiler_temp;
        }
        JSCompiler_temp && nextHydratableInstance && throwOnHydrationMismatch(fiber);
        popToNextHostParent(fiber);
        if (13 === tag) {
          fiber = fiber.memoizedState;
          fiber = null !== fiber ? fiber.dehydrated : null;
          if (!fiber) throw Error(formatProdErrorMessage(317));
          nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
        } else if (31 === tag) {
          fiber = fiber.memoizedState;
          fiber = null !== fiber ? fiber.dehydrated : null;
          if (!fiber) throw Error(formatProdErrorMessage(317));
          nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
        } else
          27 === tag ? (tag = nextHydratableInstance, isSingletonScope(fiber.type) ? (fiber = previousHydratableOnEnteringScopedSingleton, previousHydratableOnEnteringScopedSingleton = null, nextHydratableInstance = fiber) : nextHydratableInstance = tag) : nextHydratableInstance = hydrationParentFiber ? getNextHydratable(fiber.stateNode.nextSibling) : null;
        return true;
      }
      function resetHydrationState() {
        nextHydratableInstance = hydrationParentFiber = null;
        isHydrating = false;
      }
      function upgradeHydrationErrorsToRecoverable() {
        var queuedErrors = hydrationErrors;
        null !== queuedErrors && (null === workInProgressRootRecoverableErrors ? workInProgressRootRecoverableErrors = queuedErrors : workInProgressRootRecoverableErrors.push.apply(
          workInProgressRootRecoverableErrors,
          queuedErrors
        ), hydrationErrors = null);
        return queuedErrors;
      }
      function queueHydrationError(error) {
        null === hydrationErrors ? hydrationErrors = [error] : hydrationErrors.push(error);
      }
      var valueCursor = createCursor(null);
      var currentlyRenderingFiber$1 = null;
      var lastContextDependency = null;
      function pushProvider(providerFiber, context, nextValue) {
        push(valueCursor, context._currentValue);
        context._currentValue = nextValue;
      }
      function popProvider(context) {
        context._currentValue = valueCursor.current;
        pop(valueCursor);
      }
      function scheduleContextWorkOnParentPath(parent, renderLanes2, propagationRoot) {
        for (; null !== parent; ) {
          var alternate = parent.alternate;
          (parent.childLanes & renderLanes2) !== renderLanes2 ? (parent.childLanes |= renderLanes2, null !== alternate && (alternate.childLanes |= renderLanes2)) : null !== alternate && (alternate.childLanes & renderLanes2) !== renderLanes2 && (alternate.childLanes |= renderLanes2);
          if (parent === propagationRoot) break;
          parent = parent.return;
        }
      }
      function propagateContextChanges(workInProgress2, contexts, renderLanes2, forcePropagateEntireTree) {
        var fiber = workInProgress2.child;
        null !== fiber && (fiber.return = workInProgress2);
        for (; null !== fiber; ) {
          var list = fiber.dependencies;
          if (null !== list) {
            var nextFiber = fiber.child;
            list = list.firstContext;
            a: for (; null !== list; ) {
              var dependency = list;
              list = fiber;
              for (var i2 = 0; i2 < contexts.length; i2++)
                if (dependency.context === contexts[i2]) {
                  list.lanes |= renderLanes2;
                  dependency = list.alternate;
                  null !== dependency && (dependency.lanes |= renderLanes2);
                  scheduleContextWorkOnParentPath(
                    list.return,
                    renderLanes2,
                    workInProgress2
                  );
                  forcePropagateEntireTree || (nextFiber = null);
                  break a;
                }
              list = dependency.next;
            }
          } else if (18 === fiber.tag) {
            nextFiber = fiber.return;
            if (null === nextFiber) throw Error(formatProdErrorMessage(341));
            nextFiber.lanes |= renderLanes2;
            list = nextFiber.alternate;
            null !== list && (list.lanes |= renderLanes2);
            scheduleContextWorkOnParentPath(nextFiber, renderLanes2, workInProgress2);
            nextFiber = null;
          } else nextFiber = fiber.child;
          if (null !== nextFiber) nextFiber.return = fiber;
          else
            for (nextFiber = fiber; null !== nextFiber; ) {
              if (nextFiber === workInProgress2) {
                nextFiber = null;
                break;
              }
              fiber = nextFiber.sibling;
              if (null !== fiber) {
                fiber.return = nextFiber.return;
                nextFiber = fiber;
                break;
              }
              nextFiber = nextFiber.return;
            }
          fiber = nextFiber;
        }
      }
      function propagateParentContextChanges(current, workInProgress2, renderLanes2, forcePropagateEntireTree) {
        current = null;
        for (var parent = workInProgress2, isInsidePropagationBailout = false; null !== parent; ) {
          if (!isInsidePropagationBailout) {
            if (0 !== (parent.flags & 524288)) isInsidePropagationBailout = true;
            else if (0 !== (parent.flags & 262144)) break;
          }
          if (10 === parent.tag) {
            var currentParent = parent.alternate;
            if (null === currentParent) throw Error(formatProdErrorMessage(387));
            currentParent = currentParent.memoizedProps;
            if (null !== currentParent) {
              var context = parent.type;
              objectIs(parent.pendingProps.value, currentParent.value) || (null !== current ? current.push(context) : current = [context]);
            }
          } else if (parent === hostTransitionProviderCursor.current) {
            currentParent = parent.alternate;
            if (null === currentParent) throw Error(formatProdErrorMessage(387));
            currentParent.memoizedState.memoizedState !== parent.memoizedState.memoizedState && (null !== current ? current.push(HostTransitionContext) : current = [HostTransitionContext]);
          }
          parent = parent.return;
        }
        null !== current && propagateContextChanges(
          workInProgress2,
          current,
          renderLanes2,
          forcePropagateEntireTree
        );
        workInProgress2.flags |= 262144;
      }
      function checkIfContextChanged(currentDependencies) {
        for (currentDependencies = currentDependencies.firstContext; null !== currentDependencies; ) {
          if (!objectIs(
            currentDependencies.context._currentValue,
            currentDependencies.memoizedValue
          ))
            return true;
          currentDependencies = currentDependencies.next;
        }
        return false;
      }
      function prepareToReadContext(workInProgress2) {
        currentlyRenderingFiber$1 = workInProgress2;
        lastContextDependency = null;
        workInProgress2 = workInProgress2.dependencies;
        null !== workInProgress2 && (workInProgress2.firstContext = null);
      }
      function readContext(context) {
        return readContextForConsumer(currentlyRenderingFiber$1, context);
      }
      function readContextDuringReconciliation(consumer, context) {
        null === currentlyRenderingFiber$1 && prepareToReadContext(consumer);
        return readContextForConsumer(consumer, context);
      }
      function readContextForConsumer(consumer, context) {
        var value = context._currentValue;
        context = { context, memoizedValue: value, next: null };
        if (null === lastContextDependency) {
          if (null === consumer) throw Error(formatProdErrorMessage(308));
          lastContextDependency = context;
          consumer.dependencies = { lanes: 0, firstContext: context };
          consumer.flags |= 524288;
        } else lastContextDependency = lastContextDependency.next = context;
        return value;
      }
      var AbortControllerLocal = "undefined" !== typeof AbortController ? AbortController : function() {
        var listeners = [], signal = this.signal = {
          aborted: false,
          addEventListener: function(type, listener) {
            listeners.push(listener);
          }
        };
        this.abort = function() {
          signal.aborted = true;
          listeners.forEach(function(listener) {
            return listener();
          });
        };
      };
      var scheduleCallback$2 = Scheduler.unstable_scheduleCallback;
      var NormalPriority = Scheduler.unstable_NormalPriority;
      var CacheContext = {
        $$typeof: REACT_CONTEXT_TYPE,
        Consumer: null,
        Provider: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0
      };
      function createCache() {
        return {
          controller: new AbortControllerLocal(),
          data: /* @__PURE__ */ new Map(),
          refCount: 0
        };
      }
      function releaseCache(cache) {
        cache.refCount--;
        0 === cache.refCount && scheduleCallback$2(NormalPriority, function() {
          cache.controller.abort();
        });
      }
      var currentEntangledListeners = null;
      var currentEntangledPendingCount = 0;
      var currentEntangledLane = 0;
      var currentEntangledActionThenable = null;
      function entangleAsyncAction(transition, thenable) {
        if (null === currentEntangledListeners) {
          var entangledListeners = currentEntangledListeners = [];
          currentEntangledPendingCount = 0;
          currentEntangledLane = requestTransitionLane();
          currentEntangledActionThenable = {
            status: "pending",
            value: void 0,
            then: function(resolve) {
              entangledListeners.push(resolve);
            }
          };
        }
        currentEntangledPendingCount++;
        thenable.then(pingEngtangledActionScope, pingEngtangledActionScope);
        return thenable;
      }
      function pingEngtangledActionScope() {
        if (0 === --currentEntangledPendingCount && null !== currentEntangledListeners) {
          null !== currentEntangledActionThenable && (currentEntangledActionThenable.status = "fulfilled");
          var listeners = currentEntangledListeners;
          currentEntangledListeners = null;
          currentEntangledLane = 0;
          currentEntangledActionThenable = null;
          for (var i2 = 0; i2 < listeners.length; i2++) (0, listeners[i2])();
        }
      }
      function chainThenableValue(thenable, result) {
        var listeners = [], thenableWithOverride = {
          status: "pending",
          value: null,
          reason: null,
          then: function(resolve) {
            listeners.push(resolve);
          }
        };
        thenable.then(
          function() {
            thenableWithOverride.status = "fulfilled";
            thenableWithOverride.value = result;
            for (var i2 = 0; i2 < listeners.length; i2++) (0, listeners[i2])(result);
          },
          function(error) {
            thenableWithOverride.status = "rejected";
            thenableWithOverride.reason = error;
            for (error = 0; error < listeners.length; error++)
              (0, listeners[error])(void 0);
          }
        );
        return thenableWithOverride;
      }
      var prevOnStartTransitionFinish = ReactSharedInternals.S;
      ReactSharedInternals.S = function(transition, returnValue) {
        globalMostRecentTransitionTime = now();
        "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && entangleAsyncAction(transition, returnValue);
        null !== prevOnStartTransitionFinish && prevOnStartTransitionFinish(transition, returnValue);
      };
      var resumedCache = createCursor(null);
      function peekCacheFromPool() {
        var cacheResumedFromPreviousRender = resumedCache.current;
        return null !== cacheResumedFromPreviousRender ? cacheResumedFromPreviousRender : workInProgressRoot.pooledCache;
      }
      function pushTransition(offscreenWorkInProgress, prevCachePool) {
        null === prevCachePool ? push(resumedCache, resumedCache.current) : push(resumedCache, prevCachePool.pool);
      }
      function getSuspendedCache() {
        var cacheFromPool = peekCacheFromPool();
        return null === cacheFromPool ? null : { parent: CacheContext._currentValue, pool: cacheFromPool };
      }
      var SuspenseException = Error(formatProdErrorMessage(460));
      var SuspenseyCommitException = Error(formatProdErrorMessage(474));
      var SuspenseActionException = Error(formatProdErrorMessage(542));
      var noopSuspenseyCommitThenable = { then: function() {
      } };
      function isThenableResolved(thenable) {
        thenable = thenable.status;
        return "fulfilled" === thenable || "rejected" === thenable;
      }
      function trackUsedThenable(thenableState2, thenable, index2) {
        index2 = thenableState2[index2];
        void 0 === index2 ? thenableState2.push(thenable) : index2 !== thenable && (thenable.then(noop$1, noop$1), thenable = index2);
        switch (thenable.status) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenableState2 = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState2), thenableState2;
          default:
            if ("string" === typeof thenable.status) thenable.then(noop$1, noop$1);
            else {
              thenableState2 = workInProgressRoot;
              if (null !== thenableState2 && 100 < thenableState2.shellSuspendCounter)
                throw Error(formatProdErrorMessage(482));
              thenableState2 = thenable;
              thenableState2.status = "pending";
              thenableState2.then(
                function(fulfilledValue) {
                  if ("pending" === thenable.status) {
                    var fulfilledThenable = thenable;
                    fulfilledThenable.status = "fulfilled";
                    fulfilledThenable.value = fulfilledValue;
                  }
                },
                function(error) {
                  if ("pending" === thenable.status) {
                    var rejectedThenable = thenable;
                    rejectedThenable.status = "rejected";
                    rejectedThenable.reason = error;
                  }
                }
              );
            }
            switch (thenable.status) {
              case "fulfilled":
                return thenable.value;
              case "rejected":
                throw thenableState2 = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState2), thenableState2;
            }
            suspendedThenable = thenable;
            throw SuspenseException;
        }
      }
      function resolveLazy(lazyType) {
        try {
          var init = lazyType._init;
          return init(lazyType._payload);
        } catch (x) {
          if (null !== x && "object" === typeof x && "function" === typeof x.then)
            throw suspendedThenable = x, SuspenseException;
          throw x;
        }
      }
      var suspendedThenable = null;
      function getSuspendedThenable() {
        if (null === suspendedThenable) throw Error(formatProdErrorMessage(459));
        var thenable = suspendedThenable;
        suspendedThenable = null;
        return thenable;
      }
      function checkIfUseWrappedInAsyncCatch(rejectedReason) {
        if (rejectedReason === SuspenseException || rejectedReason === SuspenseActionException)
          throw Error(formatProdErrorMessage(483));
      }
      var thenableState$1 = null;
      var thenableIndexCounter$1 = 0;
      function unwrapThenable(thenable) {
        var index2 = thenableIndexCounter$1;
        thenableIndexCounter$1 += 1;
        null === thenableState$1 && (thenableState$1 = []);
        return trackUsedThenable(thenableState$1, thenable, index2);
      }
      function coerceRef(workInProgress2, element) {
        element = element.props.ref;
        workInProgress2.ref = void 0 !== element ? element : null;
      }
      function throwOnInvalidObjectTypeImpl(returnFiber, newChild) {
        if (newChild.$$typeof === REACT_LEGACY_ELEMENT_TYPE)
          throw Error(formatProdErrorMessage(525));
        returnFiber = Object.prototype.toString.call(newChild);
        throw Error(
          formatProdErrorMessage(
            31,
            "[object Object]" === returnFiber ? "object with keys {" + Object.keys(newChild).join(", ") + "}" : returnFiber
          )
        );
      }
      function createChildReconciler(shouldTrackSideEffects) {
        function deleteChild(returnFiber, childToDelete) {
          if (shouldTrackSideEffects) {
            var deletions = returnFiber.deletions;
            null === deletions ? (returnFiber.deletions = [childToDelete], returnFiber.flags |= 16) : deletions.push(childToDelete);
          }
        }
        function deleteRemainingChildren(returnFiber, currentFirstChild) {
          if (!shouldTrackSideEffects) return null;
          for (; null !== currentFirstChild; )
            deleteChild(returnFiber, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
          return null;
        }
        function mapRemainingChildren(currentFirstChild) {
          for (var existingChildren = /* @__PURE__ */ new Map(); null !== currentFirstChild; )
            null !== currentFirstChild.key ? existingChildren.set(currentFirstChild.key, currentFirstChild) : existingChildren.set(currentFirstChild.index, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
          return existingChildren;
        }
        function useFiber(fiber, pendingProps) {
          fiber = createWorkInProgress(fiber, pendingProps);
          fiber.index = 0;
          fiber.sibling = null;
          return fiber;
        }
        function placeChild(newFiber, lastPlacedIndex, newIndex) {
          newFiber.index = newIndex;
          if (!shouldTrackSideEffects)
            return newFiber.flags |= 1048576, lastPlacedIndex;
          newIndex = newFiber.alternate;
          if (null !== newIndex)
            return newIndex = newIndex.index, newIndex < lastPlacedIndex ? (newFiber.flags |= 67108866, lastPlacedIndex) : newIndex;
          newFiber.flags |= 67108866;
          return lastPlacedIndex;
        }
        function placeSingleChild(newFiber) {
          shouldTrackSideEffects && null === newFiber.alternate && (newFiber.flags |= 67108866);
          return newFiber;
        }
        function updateTextNode(returnFiber, current, textContent, lanes) {
          if (null === current || 6 !== current.tag)
            return current = createFiberFromText(textContent, returnFiber.mode, lanes), current.return = returnFiber, current;
          current = useFiber(current, textContent);
          current.return = returnFiber;
          return current;
        }
        function updateElement(returnFiber, current, element, lanes) {
          var elementType = element.type;
          if (elementType === REACT_FRAGMENT_TYPE)
            return updateFragment(
              returnFiber,
              current,
              element.props.children,
              lanes,
              element.key
            );
          if (null !== current && (current.elementType === elementType || "object" === typeof elementType && null !== elementType && elementType.$$typeof === REACT_LAZY_TYPE && resolveLazy(elementType) === current.type))
            return current = useFiber(current, element.props), coerceRef(current, element), current.return = returnFiber, current;
          current = createFiberFromTypeAndProps(
            element.type,
            element.key,
            element.props,
            null,
            returnFiber.mode,
            lanes
          );
          coerceRef(current, element);
          current.return = returnFiber;
          return current;
        }
        function updatePortal(returnFiber, current, portal, lanes) {
          if (null === current || 4 !== current.tag || current.stateNode.containerInfo !== portal.containerInfo || current.stateNode.implementation !== portal.implementation)
            return current = createFiberFromPortal(portal, returnFiber.mode, lanes), current.return = returnFiber, current;
          current = useFiber(current, portal.children || []);
          current.return = returnFiber;
          return current;
        }
        function updateFragment(returnFiber, current, fragment, lanes, key) {
          if (null === current || 7 !== current.tag)
            return current = createFiberFromFragment(
              fragment,
              returnFiber.mode,
              lanes,
              key
            ), current.return = returnFiber, current;
          current = useFiber(current, fragment);
          current.return = returnFiber;
          return current;
        }
        function createChild(returnFiber, newChild, lanes) {
          if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild)
            return newChild = createFiberFromText(
              "" + newChild,
              returnFiber.mode,
              lanes
            ), newChild.return = returnFiber, newChild;
          if ("object" === typeof newChild && null !== newChild) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return lanes = createFiberFromTypeAndProps(
                  newChild.type,
                  newChild.key,
                  newChild.props,
                  null,
                  returnFiber.mode,
                  lanes
                ), coerceRef(lanes, newChild), lanes.return = returnFiber, lanes;
              case REACT_PORTAL_TYPE:
                return newChild = createFiberFromPortal(
                  newChild,
                  returnFiber.mode,
                  lanes
                ), newChild.return = returnFiber, newChild;
              case REACT_LAZY_TYPE:
                return newChild = resolveLazy(newChild), createChild(returnFiber, newChild, lanes);
            }
            if (isArrayImpl(newChild) || getIteratorFn(newChild))
              return newChild = createFiberFromFragment(
                newChild,
                returnFiber.mode,
                lanes,
                null
              ), newChild.return = returnFiber, newChild;
            if ("function" === typeof newChild.then)
              return createChild(returnFiber, unwrapThenable(newChild), lanes);
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return createChild(
                returnFiber,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return null;
        }
        function updateSlot(returnFiber, oldFiber, newChild, lanes) {
          var key = null !== oldFiber ? oldFiber.key : null;
          if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild)
            return null !== key ? null : updateTextNode(returnFiber, oldFiber, "" + newChild, lanes);
          if ("object" === typeof newChild && null !== newChild) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return newChild.key === key ? updateElement(returnFiber, oldFiber, newChild, lanes) : null;
              case REACT_PORTAL_TYPE:
                return newChild.key === key ? updatePortal(returnFiber, oldFiber, newChild, lanes) : null;
              case REACT_LAZY_TYPE:
                return newChild = resolveLazy(newChild), updateSlot(returnFiber, oldFiber, newChild, lanes);
            }
            if (isArrayImpl(newChild) || getIteratorFn(newChild))
              return null !== key ? null : updateFragment(returnFiber, oldFiber, newChild, lanes, null);
            if ("function" === typeof newChild.then)
              return updateSlot(
                returnFiber,
                oldFiber,
                unwrapThenable(newChild),
                lanes
              );
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return updateSlot(
                returnFiber,
                oldFiber,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return null;
        }
        function updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes) {
          if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild)
            return existingChildren = existingChildren.get(newIdx) || null, updateTextNode(returnFiber, existingChildren, "" + newChild, lanes);
          if ("object" === typeof newChild && null !== newChild) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                return existingChildren = existingChildren.get(
                  null === newChild.key ? newIdx : newChild.key
                ) || null, updateElement(returnFiber, existingChildren, newChild, lanes);
              case REACT_PORTAL_TYPE:
                return existingChildren = existingChildren.get(
                  null === newChild.key ? newIdx : newChild.key
                ) || null, updatePortal(returnFiber, existingChildren, newChild, lanes);
              case REACT_LAZY_TYPE:
                return newChild = resolveLazy(newChild), updateFromMap(
                  existingChildren,
                  returnFiber,
                  newIdx,
                  newChild,
                  lanes
                );
            }
            if (isArrayImpl(newChild) || getIteratorFn(newChild))
              return existingChildren = existingChildren.get(newIdx) || null, updateFragment(returnFiber, existingChildren, newChild, lanes, null);
            if ("function" === typeof newChild.then)
              return updateFromMap(
                existingChildren,
                returnFiber,
                newIdx,
                unwrapThenable(newChild),
                lanes
              );
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return updateFromMap(
                existingChildren,
                returnFiber,
                newIdx,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return null;
        }
        function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {
          for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null; null !== oldFiber && newIdx < newChildren.length; newIdx++) {
            oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
            var newFiber = updateSlot(
              returnFiber,
              oldFiber,
              newChildren[newIdx],
              lanes
            );
            if (null === newFiber) {
              null === oldFiber && (oldFiber = nextOldFiber);
              break;
            }
            shouldTrackSideEffects && oldFiber && null === newFiber.alternate && deleteChild(returnFiber, oldFiber);
            currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
            null === previousNewFiber ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber;
            previousNewFiber = newFiber;
            oldFiber = nextOldFiber;
          }
          if (newIdx === newChildren.length)
            return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
          if (null === oldFiber) {
            for (; newIdx < newChildren.length; newIdx++)
              oldFiber = createChild(returnFiber, newChildren[newIdx], lanes), null !== oldFiber && (currentFirstChild = placeChild(
                oldFiber,
                currentFirstChild,
                newIdx
              ), null === previousNewFiber ? resultingFirstChild = oldFiber : previousNewFiber.sibling = oldFiber, previousNewFiber = oldFiber);
            isHydrating && pushTreeFork(returnFiber, newIdx);
            return resultingFirstChild;
          }
          for (oldFiber = mapRemainingChildren(oldFiber); newIdx < newChildren.length; newIdx++)
            nextOldFiber = updateFromMap(
              oldFiber,
              returnFiber,
              newIdx,
              newChildren[newIdx],
              lanes
            ), null !== nextOldFiber && (shouldTrackSideEffects && null !== nextOldFiber.alternate && oldFiber.delete(
              null === nextOldFiber.key ? newIdx : nextOldFiber.key
            ), currentFirstChild = placeChild(
              nextOldFiber,
              currentFirstChild,
              newIdx
            ), null === previousNewFiber ? resultingFirstChild = nextOldFiber : previousNewFiber.sibling = nextOldFiber, previousNewFiber = nextOldFiber);
          shouldTrackSideEffects && oldFiber.forEach(function(child) {
            return deleteChild(returnFiber, child);
          });
          isHydrating && pushTreeFork(returnFiber, newIdx);
          return resultingFirstChild;
        }
        function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildren, lanes) {
          if (null == newChildren) throw Error(formatProdErrorMessage(151));
          for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null, step = newChildren.next(); null !== oldFiber && !step.done; newIdx++, step = newChildren.next()) {
            oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
            var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
            if (null === newFiber) {
              null === oldFiber && (oldFiber = nextOldFiber);
              break;
            }
            shouldTrackSideEffects && oldFiber && null === newFiber.alternate && deleteChild(returnFiber, oldFiber);
            currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
            null === previousNewFiber ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber;
            previousNewFiber = newFiber;
            oldFiber = nextOldFiber;
          }
          if (step.done)
            return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
          if (null === oldFiber) {
            for (; !step.done; newIdx++, step = newChildren.next())
              step = createChild(returnFiber, step.value, lanes), null !== step && (currentFirstChild = placeChild(step, currentFirstChild, newIdx), null === previousNewFiber ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
            isHydrating && pushTreeFork(returnFiber, newIdx);
            return resultingFirstChild;
          }
          for (oldFiber = mapRemainingChildren(oldFiber); !step.done; newIdx++, step = newChildren.next())
            step = updateFromMap(oldFiber, returnFiber, newIdx, step.value, lanes), null !== step && (shouldTrackSideEffects && null !== step.alternate && oldFiber.delete(null === step.key ? newIdx : step.key), currentFirstChild = placeChild(step, currentFirstChild, newIdx), null === previousNewFiber ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
          shouldTrackSideEffects && oldFiber.forEach(function(child) {
            return deleteChild(returnFiber, child);
          });
          isHydrating && pushTreeFork(returnFiber, newIdx);
          return resultingFirstChild;
        }
        function reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes) {
          "object" === typeof newChild && null !== newChild && newChild.type === REACT_FRAGMENT_TYPE && null === newChild.key && (newChild = newChild.props.children);
          if ("object" === typeof newChild && null !== newChild) {
            switch (newChild.$$typeof) {
              case REACT_ELEMENT_TYPE:
                a: {
                  for (var key = newChild.key; null !== currentFirstChild; ) {
                    if (currentFirstChild.key === key) {
                      key = newChild.type;
                      if (key === REACT_FRAGMENT_TYPE) {
                        if (7 === currentFirstChild.tag) {
                          deleteRemainingChildren(
                            returnFiber,
                            currentFirstChild.sibling
                          );
                          lanes = useFiber(
                            currentFirstChild,
                            newChild.props.children
                          );
                          lanes.return = returnFiber;
                          returnFiber = lanes;
                          break a;
                        }
                      } else if (currentFirstChild.elementType === key || "object" === typeof key && null !== key && key.$$typeof === REACT_LAZY_TYPE && resolveLazy(key) === currentFirstChild.type) {
                        deleteRemainingChildren(
                          returnFiber,
                          currentFirstChild.sibling
                        );
                        lanes = useFiber(currentFirstChild, newChild.props);
                        coerceRef(lanes, newChild);
                        lanes.return = returnFiber;
                        returnFiber = lanes;
                        break a;
                      }
                      deleteRemainingChildren(returnFiber, currentFirstChild);
                      break;
                    } else deleteChild(returnFiber, currentFirstChild);
                    currentFirstChild = currentFirstChild.sibling;
                  }
                  newChild.type === REACT_FRAGMENT_TYPE ? (lanes = createFiberFromFragment(
                    newChild.props.children,
                    returnFiber.mode,
                    lanes,
                    newChild.key
                  ), lanes.return = returnFiber, returnFiber = lanes) : (lanes = createFiberFromTypeAndProps(
                    newChild.type,
                    newChild.key,
                    newChild.props,
                    null,
                    returnFiber.mode,
                    lanes
                  ), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes);
                }
                return placeSingleChild(returnFiber);
              case REACT_PORTAL_TYPE:
                a: {
                  for (key = newChild.key; null !== currentFirstChild; ) {
                    if (currentFirstChild.key === key)
                      if (4 === currentFirstChild.tag && currentFirstChild.stateNode.containerInfo === newChild.containerInfo && currentFirstChild.stateNode.implementation === newChild.implementation) {
                        deleteRemainingChildren(
                          returnFiber,
                          currentFirstChild.sibling
                        );
                        lanes = useFiber(currentFirstChild, newChild.children || []);
                        lanes.return = returnFiber;
                        returnFiber = lanes;
                        break a;
                      } else {
                        deleteRemainingChildren(returnFiber, currentFirstChild);
                        break;
                      }
                    else deleteChild(returnFiber, currentFirstChild);
                    currentFirstChild = currentFirstChild.sibling;
                  }
                  lanes = createFiberFromPortal(newChild, returnFiber.mode, lanes);
                  lanes.return = returnFiber;
                  returnFiber = lanes;
                }
                return placeSingleChild(returnFiber);
              case REACT_LAZY_TYPE:
                return newChild = resolveLazy(newChild), reconcileChildFibersImpl(
                  returnFiber,
                  currentFirstChild,
                  newChild,
                  lanes
                );
            }
            if (isArrayImpl(newChild))
              return reconcileChildrenArray(
                returnFiber,
                currentFirstChild,
                newChild,
                lanes
              );
            if (getIteratorFn(newChild)) {
              key = getIteratorFn(newChild);
              if ("function" !== typeof key) throw Error(formatProdErrorMessage(150));
              newChild = key.call(newChild);
              return reconcileChildrenIterator(
                returnFiber,
                currentFirstChild,
                newChild,
                lanes
              );
            }
            if ("function" === typeof newChild.then)
              return reconcileChildFibersImpl(
                returnFiber,
                currentFirstChild,
                unwrapThenable(newChild),
                lanes
              );
            if (newChild.$$typeof === REACT_CONTEXT_TYPE)
              return reconcileChildFibersImpl(
                returnFiber,
                currentFirstChild,
                readContextDuringReconciliation(returnFiber, newChild),
                lanes
              );
            throwOnInvalidObjectTypeImpl(returnFiber, newChild);
          }
          return "string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild ? (newChild = "" + newChild, null !== currentFirstChild && 6 === currentFirstChild.tag ? (deleteRemainingChildren(returnFiber, currentFirstChild.sibling), lanes = useFiber(currentFirstChild, newChild), lanes.return = returnFiber, returnFiber = lanes) : (deleteRemainingChildren(returnFiber, currentFirstChild), lanes = createFiberFromText(newChild, returnFiber.mode, lanes), lanes.return = returnFiber, returnFiber = lanes), placeSingleChild(returnFiber)) : deleteRemainingChildren(returnFiber, currentFirstChild);
        }
        return function(returnFiber, currentFirstChild, newChild, lanes) {
          try {
            thenableIndexCounter$1 = 0;
            var firstChildFiber = reconcileChildFibersImpl(
              returnFiber,
              currentFirstChild,
              newChild,
              lanes
            );
            thenableState$1 = null;
            return firstChildFiber;
          } catch (x) {
            if (x === SuspenseException || x === SuspenseActionException) throw x;
            var fiber = createFiberImplClass(29, x, null, returnFiber.mode);
            fiber.lanes = lanes;
            fiber.return = returnFiber;
            return fiber;
          } finally {
          }
        };
      }
      var reconcileChildFibers = createChildReconciler(true);
      var mountChildFibers = createChildReconciler(false);
      var hasForceUpdate = false;
      function initializeUpdateQueue(fiber) {
        fiber.updateQueue = {
          baseState: fiber.memoizedState,
          firstBaseUpdate: null,
          lastBaseUpdate: null,
          shared: { pending: null, lanes: 0, hiddenCallbacks: null },
          callbacks: null
        };
      }
      function cloneUpdateQueue(current, workInProgress2) {
        current = current.updateQueue;
        workInProgress2.updateQueue === current && (workInProgress2.updateQueue = {
          baseState: current.baseState,
          firstBaseUpdate: current.firstBaseUpdate,
          lastBaseUpdate: current.lastBaseUpdate,
          shared: current.shared,
          callbacks: null
        });
      }
      function createUpdate(lane) {
        return { lane, tag: 0, payload: null, callback: null, next: null };
      }
      function enqueueUpdate(fiber, update, lane) {
        var updateQueue = fiber.updateQueue;
        if (null === updateQueue) return null;
        updateQueue = updateQueue.shared;
        if (0 !== (executionContext & 2)) {
          var pending = updateQueue.pending;
          null === pending ? update.next = update : (update.next = pending.next, pending.next = update);
          updateQueue.pending = update;
          update = getRootForUpdatedFiber(fiber);
          markUpdateLaneFromFiberToRoot(fiber, null, lane);
          return update;
        }
        enqueueUpdate$1(fiber, updateQueue, update, lane);
        return getRootForUpdatedFiber(fiber);
      }
      function entangleTransitions(root2, fiber, lane) {
        fiber = fiber.updateQueue;
        if (null !== fiber && (fiber = fiber.shared, 0 !== (lane & 4194048))) {
          var queueLanes = fiber.lanes;
          queueLanes &= root2.pendingLanes;
          lane |= queueLanes;
          fiber.lanes = lane;
          markRootEntangled(root2, lane);
        }
      }
      function enqueueCapturedUpdate(workInProgress2, capturedUpdate) {
        var queue = workInProgress2.updateQueue, current = workInProgress2.alternate;
        if (null !== current && (current = current.updateQueue, queue === current)) {
          var newFirst = null, newLast = null;
          queue = queue.firstBaseUpdate;
          if (null !== queue) {
            do {
              var clone = {
                lane: queue.lane,
                tag: queue.tag,
                payload: queue.payload,
                callback: null,
                next: null
              };
              null === newLast ? newFirst = newLast = clone : newLast = newLast.next = clone;
              queue = queue.next;
            } while (null !== queue);
            null === newLast ? newFirst = newLast = capturedUpdate : newLast = newLast.next = capturedUpdate;
          } else newFirst = newLast = capturedUpdate;
          queue = {
            baseState: current.baseState,
            firstBaseUpdate: newFirst,
            lastBaseUpdate: newLast,
            shared: current.shared,
            callbacks: current.callbacks
          };
          workInProgress2.updateQueue = queue;
          return;
        }
        workInProgress2 = queue.lastBaseUpdate;
        null === workInProgress2 ? queue.firstBaseUpdate = capturedUpdate : workInProgress2.next = capturedUpdate;
        queue.lastBaseUpdate = capturedUpdate;
      }
      var didReadFromEntangledAsyncAction = false;
      function suspendIfUpdateReadFromEntangledAsyncAction() {
        if (didReadFromEntangledAsyncAction) {
          var entangledActionThenable = currentEntangledActionThenable;
          if (null !== entangledActionThenable) throw entangledActionThenable;
        }
      }
      function processUpdateQueue(workInProgress$jscomp$0, props, instance$jscomp$0, renderLanes2) {
        didReadFromEntangledAsyncAction = false;
        var queue = workInProgress$jscomp$0.updateQueue;
        hasForceUpdate = false;
        var firstBaseUpdate = queue.firstBaseUpdate, lastBaseUpdate = queue.lastBaseUpdate, pendingQueue = queue.shared.pending;
        if (null !== pendingQueue) {
          queue.shared.pending = null;
          var lastPendingUpdate = pendingQueue, firstPendingUpdate = lastPendingUpdate.next;
          lastPendingUpdate.next = null;
          null === lastBaseUpdate ? firstBaseUpdate = firstPendingUpdate : lastBaseUpdate.next = firstPendingUpdate;
          lastBaseUpdate = lastPendingUpdate;
          var current = workInProgress$jscomp$0.alternate;
          null !== current && (current = current.updateQueue, pendingQueue = current.lastBaseUpdate, pendingQueue !== lastBaseUpdate && (null === pendingQueue ? current.firstBaseUpdate = firstPendingUpdate : pendingQueue.next = firstPendingUpdate, current.lastBaseUpdate = lastPendingUpdate));
        }
        if (null !== firstBaseUpdate) {
          var newState = queue.baseState;
          lastBaseUpdate = 0;
          current = firstPendingUpdate = lastPendingUpdate = null;
          pendingQueue = firstBaseUpdate;
          do {
            var updateLane = pendingQueue.lane & -536870913, isHiddenUpdate = updateLane !== pendingQueue.lane;
            if (isHiddenUpdate ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes2 & updateLane) === updateLane) {
              0 !== updateLane && updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction = true);
              null !== current && (current = current.next = {
                lane: 0,
                tag: pendingQueue.tag,
                payload: pendingQueue.payload,
                callback: null,
                next: null
              });
              a: {
                var workInProgress2 = workInProgress$jscomp$0, update = pendingQueue;
                updateLane = props;
                var instance = instance$jscomp$0;
                switch (update.tag) {
                  case 1:
                    workInProgress2 = update.payload;
                    if ("function" === typeof workInProgress2) {
                      newState = workInProgress2.call(instance, newState, updateLane);
                      break a;
                    }
                    newState = workInProgress2;
                    break a;
                  case 3:
                    workInProgress2.flags = workInProgress2.flags & -65537 | 128;
                  case 0:
                    workInProgress2 = update.payload;
                    updateLane = "function" === typeof workInProgress2 ? workInProgress2.call(instance, newState, updateLane) : workInProgress2;
                    if (null === updateLane || void 0 === updateLane) break a;
                    newState = assign3({}, newState, updateLane);
                    break a;
                  case 2:
                    hasForceUpdate = true;
                }
              }
              updateLane = pendingQueue.callback;
              null !== updateLane && (workInProgress$jscomp$0.flags |= 64, isHiddenUpdate && (workInProgress$jscomp$0.flags |= 8192), isHiddenUpdate = queue.callbacks, null === isHiddenUpdate ? queue.callbacks = [updateLane] : isHiddenUpdate.push(updateLane));
            } else
              isHiddenUpdate = {
                lane: updateLane,
                tag: pendingQueue.tag,
                payload: pendingQueue.payload,
                callback: pendingQueue.callback,
                next: null
              }, null === current ? (firstPendingUpdate = current = isHiddenUpdate, lastPendingUpdate = newState) : current = current.next = isHiddenUpdate, lastBaseUpdate |= updateLane;
            pendingQueue = pendingQueue.next;
            if (null === pendingQueue)
              if (pendingQueue = queue.shared.pending, null === pendingQueue)
                break;
              else
                isHiddenUpdate = pendingQueue, pendingQueue = isHiddenUpdate.next, isHiddenUpdate.next = null, queue.lastBaseUpdate = isHiddenUpdate, queue.shared.pending = null;
          } while (1);
          null === current && (lastPendingUpdate = newState);
          queue.baseState = lastPendingUpdate;
          queue.firstBaseUpdate = firstPendingUpdate;
          queue.lastBaseUpdate = current;
          null === firstBaseUpdate && (queue.shared.lanes = 0);
          workInProgressRootSkippedLanes |= lastBaseUpdate;
          workInProgress$jscomp$0.lanes = lastBaseUpdate;
          workInProgress$jscomp$0.memoizedState = newState;
        }
      }
      function callCallback(callback, context) {
        if ("function" !== typeof callback)
          throw Error(formatProdErrorMessage(191, callback));
        callback.call(context);
      }
      function commitCallbacks(updateQueue, context) {
        var callbacks = updateQueue.callbacks;
        if (null !== callbacks)
          for (updateQueue.callbacks = null, updateQueue = 0; updateQueue < callbacks.length; updateQueue++)
            callCallback(callbacks[updateQueue], context);
      }
      var currentTreeHiddenStackCursor = createCursor(null);
      var prevEntangledRenderLanesCursor = createCursor(0);
      function pushHiddenContext(fiber, context) {
        fiber = entangledRenderLanes;
        push(prevEntangledRenderLanesCursor, fiber);
        push(currentTreeHiddenStackCursor, context);
        entangledRenderLanes = fiber | context.baseLanes;
      }
      function reuseHiddenContextOnStack() {
        push(prevEntangledRenderLanesCursor, entangledRenderLanes);
        push(currentTreeHiddenStackCursor, currentTreeHiddenStackCursor.current);
      }
      function popHiddenContext() {
        entangledRenderLanes = prevEntangledRenderLanesCursor.current;
        pop(currentTreeHiddenStackCursor);
        pop(prevEntangledRenderLanesCursor);
      }
      var suspenseHandlerStackCursor = createCursor(null);
      var shellBoundary = null;
      function pushPrimaryTreeSuspenseHandler(handler) {
        var current = handler.alternate;
        push(suspenseStackCursor, suspenseStackCursor.current & 1);
        push(suspenseHandlerStackCursor, handler);
        null === shellBoundary && (null === current || null !== currentTreeHiddenStackCursor.current ? shellBoundary = handler : null !== current.memoizedState && (shellBoundary = handler));
      }
      function pushDehydratedActivitySuspenseHandler(fiber) {
        push(suspenseStackCursor, suspenseStackCursor.current);
        push(suspenseHandlerStackCursor, fiber);
        null === shellBoundary && (shellBoundary = fiber);
      }
      function pushOffscreenSuspenseHandler(fiber) {
        22 === fiber.tag ? (push(suspenseStackCursor, suspenseStackCursor.current), push(suspenseHandlerStackCursor, fiber), null === shellBoundary && (shellBoundary = fiber)) : reuseSuspenseHandlerOnStack(fiber);
      }
      function reuseSuspenseHandlerOnStack() {
        push(suspenseStackCursor, suspenseStackCursor.current);
        push(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current);
      }
      function popSuspenseHandler(fiber) {
        pop(suspenseHandlerStackCursor);
        shellBoundary === fiber && (shellBoundary = null);
        pop(suspenseStackCursor);
      }
      var suspenseStackCursor = createCursor(0);
      function findFirstSuspended(row) {
        for (var node = row; null !== node; ) {
          if (13 === node.tag) {
            var state = node.memoizedState;
            if (null !== state && (state = state.dehydrated, null === state || isSuspenseInstancePending(state) || isSuspenseInstanceFallback(state)))
              return node;
          } else if (19 === node.tag && ("forwards" === node.memoizedProps.revealOrder || "backwards" === node.memoizedProps.revealOrder || "unstable_legacy-backwards" === node.memoizedProps.revealOrder || "together" === node.memoizedProps.revealOrder)) {
            if (0 !== (node.flags & 128)) return node;
          } else if (null !== node.child) {
            node.child.return = node;
            node = node.child;
            continue;
          }
          if (node === row) break;
          for (; null === node.sibling; ) {
            if (null === node.return || node.return === row) return null;
            node = node.return;
          }
          node.sibling.return = node.return;
          node = node.sibling;
        }
        return null;
      }
      var renderLanes = 0;
      var currentlyRenderingFiber = null;
      var currentHook = null;
      var workInProgressHook = null;
      var didScheduleRenderPhaseUpdate = false;
      var didScheduleRenderPhaseUpdateDuringThisPass = false;
      var shouldDoubleInvokeUserFnsInHooksDEV = false;
      var localIdCounter = 0;
      var thenableIndexCounter = 0;
      var thenableState = null;
      var globalClientIdCounter = 0;
      function throwInvalidHookError() {
        throw Error(formatProdErrorMessage(321));
      }
      function areHookInputsEqual(nextDeps, prevDeps) {
        if (null === prevDeps) return false;
        for (var i2 = 0; i2 < prevDeps.length && i2 < nextDeps.length; i2++)
          if (!objectIs(nextDeps[i2], prevDeps[i2])) return false;
        return true;
      }
      function renderWithHooks(current, workInProgress2, Component, props, secondArg, nextRenderLanes) {
        renderLanes = nextRenderLanes;
        currentlyRenderingFiber = workInProgress2;
        workInProgress2.memoizedState = null;
        workInProgress2.updateQueue = null;
        workInProgress2.lanes = 0;
        ReactSharedInternals.H = null === current || null === current.memoizedState ? HooksDispatcherOnMount : HooksDispatcherOnUpdate;
        shouldDoubleInvokeUserFnsInHooksDEV = false;
        nextRenderLanes = Component(props, secondArg);
        shouldDoubleInvokeUserFnsInHooksDEV = false;
        didScheduleRenderPhaseUpdateDuringThisPass && (nextRenderLanes = renderWithHooksAgain(
          workInProgress2,
          Component,
          props,
          secondArg
        ));
        finishRenderingHooks(current);
        return nextRenderLanes;
      }
      function finishRenderingHooks(current) {
        ReactSharedInternals.H = ContextOnlyDispatcher;
        var didRenderTooFewHooks = null !== currentHook && null !== currentHook.next;
        renderLanes = 0;
        workInProgressHook = currentHook = currentlyRenderingFiber = null;
        didScheduleRenderPhaseUpdate = false;
        thenableIndexCounter = 0;
        thenableState = null;
        if (didRenderTooFewHooks) throw Error(formatProdErrorMessage(300));
        null === current || didReceiveUpdate || (current = current.dependencies, null !== current && checkIfContextChanged(current) && (didReceiveUpdate = true));
      }
      function renderWithHooksAgain(workInProgress2, Component, props, secondArg) {
        currentlyRenderingFiber = workInProgress2;
        var numberOfReRenders = 0;
        do {
          didScheduleRenderPhaseUpdateDuringThisPass && (thenableState = null);
          thenableIndexCounter = 0;
          didScheduleRenderPhaseUpdateDuringThisPass = false;
          if (25 <= numberOfReRenders) throw Error(formatProdErrorMessage(301));
          numberOfReRenders += 1;
          workInProgressHook = currentHook = null;
          if (null != workInProgress2.updateQueue) {
            var children = workInProgress2.updateQueue;
            children.lastEffect = null;
            children.events = null;
            children.stores = null;
            null != children.memoCache && (children.memoCache.index = 0);
          }
          ReactSharedInternals.H = HooksDispatcherOnRerender;
          children = Component(props, secondArg);
        } while (didScheduleRenderPhaseUpdateDuringThisPass);
        return children;
      }
      function TransitionAwareHostComponent() {
        var dispatcher = ReactSharedInternals.H, maybeThenable = dispatcher.useState()[0];
        maybeThenable = "function" === typeof maybeThenable.then ? useThenable(maybeThenable) : maybeThenable;
        dispatcher = dispatcher.useState()[0];
        (null !== currentHook ? currentHook.memoizedState : null) !== dispatcher && (currentlyRenderingFiber.flags |= 1024);
        return maybeThenable;
      }
      function checkDidRenderIdHook() {
        var didRenderIdHook = 0 !== localIdCounter;
        localIdCounter = 0;
        return didRenderIdHook;
      }
      function bailoutHooks(current, workInProgress2, lanes) {
        workInProgress2.updateQueue = current.updateQueue;
        workInProgress2.flags &= -2053;
        current.lanes &= ~lanes;
      }
      function resetHooksOnUnwind(workInProgress2) {
        if (didScheduleRenderPhaseUpdate) {
          for (workInProgress2 = workInProgress2.memoizedState; null !== workInProgress2; ) {
            var queue = workInProgress2.queue;
            null !== queue && (queue.pending = null);
            workInProgress2 = workInProgress2.next;
          }
          didScheduleRenderPhaseUpdate = false;
        }
        renderLanes = 0;
        workInProgressHook = currentHook = currentlyRenderingFiber = null;
        didScheduleRenderPhaseUpdateDuringThisPass = false;
        thenableIndexCounter = localIdCounter = 0;
        thenableState = null;
      }
      function mountWorkInProgressHook() {
        var hook = {
          memoizedState: null,
          baseState: null,
          baseQueue: null,
          queue: null,
          next: null
        };
        null === workInProgressHook ? currentlyRenderingFiber.memoizedState = workInProgressHook = hook : workInProgressHook = workInProgressHook.next = hook;
        return workInProgressHook;
      }
      function updateWorkInProgressHook() {
        if (null === currentHook) {
          var nextCurrentHook = currentlyRenderingFiber.alternate;
          nextCurrentHook = null !== nextCurrentHook ? nextCurrentHook.memoizedState : null;
        } else nextCurrentHook = currentHook.next;
        var nextWorkInProgressHook = null === workInProgressHook ? currentlyRenderingFiber.memoizedState : workInProgressHook.next;
        if (null !== nextWorkInProgressHook)
          workInProgressHook = nextWorkInProgressHook, currentHook = nextCurrentHook;
        else {
          if (null === nextCurrentHook) {
            if (null === currentlyRenderingFiber.alternate)
              throw Error(formatProdErrorMessage(467));
            throw Error(formatProdErrorMessage(310));
          }
          currentHook = nextCurrentHook;
          nextCurrentHook = {
            memoizedState: currentHook.memoizedState,
            baseState: currentHook.baseState,
            baseQueue: currentHook.baseQueue,
            queue: currentHook.queue,
            next: null
          };
          null === workInProgressHook ? currentlyRenderingFiber.memoizedState = workInProgressHook = nextCurrentHook : workInProgressHook = workInProgressHook.next = nextCurrentHook;
        }
        return workInProgressHook;
      }
      function createFunctionComponentUpdateQueue() {
        return { lastEffect: null, events: null, stores: null, memoCache: null };
      }
      function useThenable(thenable) {
        var index2 = thenableIndexCounter;
        thenableIndexCounter += 1;
        null === thenableState && (thenableState = []);
        thenable = trackUsedThenable(thenableState, thenable, index2);
        index2 = currentlyRenderingFiber;
        null === (null === workInProgressHook ? index2.memoizedState : workInProgressHook.next) && (index2 = index2.alternate, ReactSharedInternals.H = null === index2 || null === index2.memoizedState ? HooksDispatcherOnMount : HooksDispatcherOnUpdate);
        return thenable;
      }
      function use(usable) {
        if (null !== usable && "object" === typeof usable) {
          if ("function" === typeof usable.then) return useThenable(usable);
          if (usable.$$typeof === REACT_CONTEXT_TYPE) return readContext(usable);
        }
        throw Error(formatProdErrorMessage(438, String(usable)));
      }
      function useMemoCache(size) {
        var memoCache = null, updateQueue = currentlyRenderingFiber.updateQueue;
        null !== updateQueue && (memoCache = updateQueue.memoCache);
        if (null == memoCache) {
          var current = currentlyRenderingFiber.alternate;
          null !== current && (current = current.updateQueue, null !== current && (current = current.memoCache, null != current && (memoCache = {
            data: current.data.map(function(array) {
              return array.slice();
            }),
            index: 0
          })));
        }
        null == memoCache && (memoCache = { data: [], index: 0 });
        null === updateQueue && (updateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = updateQueue);
        updateQueue.memoCache = memoCache;
        updateQueue = memoCache.data[memoCache.index];
        if (void 0 === updateQueue)
          for (updateQueue = memoCache.data[memoCache.index] = Array(size), current = 0; current < size; current++)
            updateQueue[current] = REACT_MEMO_CACHE_SENTINEL;
        memoCache.index++;
        return updateQueue;
      }
      function basicStateReducer(state, action) {
        return "function" === typeof action ? action(state) : action;
      }
      function updateReducer(reducer) {
        var hook = updateWorkInProgressHook();
        return updateReducerImpl(hook, currentHook, reducer);
      }
      function updateReducerImpl(hook, current, reducer) {
        var queue = hook.queue;
        if (null === queue) throw Error(formatProdErrorMessage(311));
        queue.lastRenderedReducer = reducer;
        var baseQueue = hook.baseQueue, pendingQueue = queue.pending;
        if (null !== pendingQueue) {
          if (null !== baseQueue) {
            var baseFirst = baseQueue.next;
            baseQueue.next = pendingQueue.next;
            pendingQueue.next = baseFirst;
          }
          current.baseQueue = baseQueue = pendingQueue;
          queue.pending = null;
        }
        pendingQueue = hook.baseState;
        if (null === baseQueue) hook.memoizedState = pendingQueue;
        else {
          current = baseQueue.next;
          var newBaseQueueFirst = baseFirst = null, newBaseQueueLast = null, update = current, didReadFromEntangledAsyncAction$60 = false;
          do {
            var updateLane = update.lane & -536870913;
            if (updateLane !== update.lane ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes & updateLane) === updateLane) {
              var revertLane = update.revertLane;
              if (0 === revertLane)
                null !== newBaseQueueLast && (newBaseQueueLast = newBaseQueueLast.next = {
                  lane: 0,
                  revertLane: 0,
                  gesture: null,
                  action: update.action,
                  hasEagerState: update.hasEagerState,
                  eagerState: update.eagerState,
                  next: null
                }), updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction$60 = true);
              else if ((renderLanes & revertLane) === revertLane) {
                update = update.next;
                revertLane === currentEntangledLane && (didReadFromEntangledAsyncAction$60 = true);
                continue;
              } else
                updateLane = {
                  lane: 0,
                  revertLane: update.revertLane,
                  gesture: null,
                  action: update.action,
                  hasEagerState: update.hasEagerState,
                  eagerState: update.eagerState,
                  next: null
                }, null === newBaseQueueLast ? (newBaseQueueFirst = newBaseQueueLast = updateLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = updateLane, currentlyRenderingFiber.lanes |= revertLane, workInProgressRootSkippedLanes |= revertLane;
              updateLane = update.action;
              shouldDoubleInvokeUserFnsInHooksDEV && reducer(pendingQueue, updateLane);
              pendingQueue = update.hasEagerState ? update.eagerState : reducer(pendingQueue, updateLane);
            } else
              revertLane = {
                lane: updateLane,
                revertLane: update.revertLane,
                gesture: update.gesture,
                action: update.action,
                hasEagerState: update.hasEagerState,
                eagerState: update.eagerState,
                next: null
              }, null === newBaseQueueLast ? (newBaseQueueFirst = newBaseQueueLast = revertLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = revertLane, currentlyRenderingFiber.lanes |= updateLane, workInProgressRootSkippedLanes |= updateLane;
            update = update.next;
          } while (null !== update && update !== current);
          null === newBaseQueueLast ? baseFirst = pendingQueue : newBaseQueueLast.next = newBaseQueueFirst;
          if (!objectIs(pendingQueue, hook.memoizedState) && (didReceiveUpdate = true, didReadFromEntangledAsyncAction$60 && (reducer = currentEntangledActionThenable, null !== reducer)))
            throw reducer;
          hook.memoizedState = pendingQueue;
          hook.baseState = baseFirst;
          hook.baseQueue = newBaseQueueLast;
          queue.lastRenderedState = pendingQueue;
        }
        null === baseQueue && (queue.lanes = 0);
        return [hook.memoizedState, queue.dispatch];
      }
      function rerenderReducer(reducer) {
        var hook = updateWorkInProgressHook(), queue = hook.queue;
        if (null === queue) throw Error(formatProdErrorMessage(311));
        queue.lastRenderedReducer = reducer;
        var dispatch = queue.dispatch, lastRenderPhaseUpdate = queue.pending, newState = hook.memoizedState;
        if (null !== lastRenderPhaseUpdate) {
          queue.pending = null;
          var update = lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
          do
            newState = reducer(newState, update.action), update = update.next;
          while (update !== lastRenderPhaseUpdate);
          objectIs(newState, hook.memoizedState) || (didReceiveUpdate = true);
          hook.memoizedState = newState;
          null === hook.baseQueue && (hook.baseState = newState);
          queue.lastRenderedState = newState;
        }
        return [newState, dispatch];
      }
      function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
        var fiber = currentlyRenderingFiber, hook = updateWorkInProgressHook(), isHydrating$jscomp$0 = isHydrating;
        if (isHydrating$jscomp$0) {
          if (void 0 === getServerSnapshot) throw Error(formatProdErrorMessage(407));
          getServerSnapshot = getServerSnapshot();
        } else getServerSnapshot = getSnapshot();
        var snapshotChanged = !objectIs(
          (currentHook || hook).memoizedState,
          getServerSnapshot
        );
        snapshotChanged && (hook.memoizedState = getServerSnapshot, didReceiveUpdate = true);
        hook = hook.queue;
        updateEffect(subscribeToStore.bind(null, fiber, hook, subscribe), [
          subscribe
        ]);
        if (hook.getSnapshot !== getSnapshot || snapshotChanged || null !== workInProgressHook && workInProgressHook.memoizedState.tag & 1) {
          fiber.flags |= 2048;
          pushSimpleEffect(
            9,
            { destroy: void 0 },
            updateStoreInstance.bind(
              null,
              fiber,
              hook,
              getServerSnapshot,
              getSnapshot
            ),
            null
          );
          if (null === workInProgressRoot) throw Error(formatProdErrorMessage(349));
          isHydrating$jscomp$0 || 0 !== (renderLanes & 127) || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
        }
        return getServerSnapshot;
      }
      function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
        fiber.flags |= 16384;
        fiber = { getSnapshot, value: renderedSnapshot };
        getSnapshot = currentlyRenderingFiber.updateQueue;
        null === getSnapshot ? (getSnapshot = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = getSnapshot, getSnapshot.stores = [fiber]) : (renderedSnapshot = getSnapshot.stores, null === renderedSnapshot ? getSnapshot.stores = [fiber] : renderedSnapshot.push(fiber));
      }
      function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
        inst.value = nextSnapshot;
        inst.getSnapshot = getSnapshot;
        checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
      }
      function subscribeToStore(fiber, inst, subscribe) {
        return subscribe(function() {
          checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
        });
      }
      function checkIfSnapshotChanged(inst) {
        var latestGetSnapshot = inst.getSnapshot;
        inst = inst.value;
        try {
          var nextValue = latestGetSnapshot();
          return !objectIs(inst, nextValue);
        } catch (error) {
          return true;
        }
      }
      function forceStoreRerender(fiber) {
        var root2 = enqueueConcurrentRenderForLane(fiber, 2);
        null !== root2 && scheduleUpdateOnFiber(root2, fiber, 2);
      }
      function mountStateImpl(initialState) {
        var hook = mountWorkInProgressHook();
        if ("function" === typeof initialState) {
          var initialStateInitializer = initialState;
          initialState = initialStateInitializer();
          if (shouldDoubleInvokeUserFnsInHooksDEV) {
            setIsStrictModeForDevtools(true);
            try {
              initialStateInitializer();
            } finally {
              setIsStrictModeForDevtools(false);
            }
          }
        }
        hook.memoizedState = hook.baseState = initialState;
        hook.queue = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: basicStateReducer,
          lastRenderedState: initialState
        };
        return hook;
      }
      function updateOptimisticImpl(hook, current, passthrough, reducer) {
        hook.baseState = passthrough;
        return updateReducerImpl(
          hook,
          currentHook,
          "function" === typeof reducer ? reducer : basicStateReducer
        );
      }
      function dispatchActionState(fiber, actionQueue, setPendingState, setState, payload) {
        if (isRenderPhaseUpdate(fiber)) throw Error(formatProdErrorMessage(485));
        fiber = actionQueue.action;
        if (null !== fiber) {
          var actionNode = {
            payload,
            action: fiber,
            next: null,
            isTransition: true,
            status: "pending",
            value: null,
            reason: null,
            listeners: [],
            then: function(listener) {
              actionNode.listeners.push(listener);
            }
          };
          null !== ReactSharedInternals.T ? setPendingState(true) : actionNode.isTransition = false;
          setState(actionNode);
          setPendingState = actionQueue.pending;
          null === setPendingState ? (actionNode.next = actionQueue.pending = actionNode, runActionStateAction(actionQueue, actionNode)) : (actionNode.next = setPendingState.next, actionQueue.pending = setPendingState.next = actionNode);
        }
      }
      function runActionStateAction(actionQueue, node) {
        var action = node.action, payload = node.payload, prevState = actionQueue.state;
        if (node.isTransition) {
          var prevTransition = ReactSharedInternals.T, currentTransition = {};
          ReactSharedInternals.T = currentTransition;
          try {
            var returnValue = action(prevState, payload), onStartTransitionFinish = ReactSharedInternals.S;
            null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
            handleActionReturnValue(actionQueue, node, returnValue);
          } catch (error) {
            onActionError(actionQueue, node, error);
          } finally {
            null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
          }
        } else
          try {
            prevTransition = action(prevState, payload), handleActionReturnValue(actionQueue, node, prevTransition);
          } catch (error$66) {
            onActionError(actionQueue, node, error$66);
          }
      }
      function handleActionReturnValue(actionQueue, node, returnValue) {
        null !== returnValue && "object" === typeof returnValue && "function" === typeof returnValue.then ? returnValue.then(
          function(nextState) {
            onActionSuccess(actionQueue, node, nextState);
          },
          function(error) {
            return onActionError(actionQueue, node, error);
          }
        ) : onActionSuccess(actionQueue, node, returnValue);
      }
      function onActionSuccess(actionQueue, actionNode, nextState) {
        actionNode.status = "fulfilled";
        actionNode.value = nextState;
        notifyActionListeners(actionNode);
        actionQueue.state = nextState;
        actionNode = actionQueue.pending;
        null !== actionNode && (nextState = actionNode.next, nextState === actionNode ? actionQueue.pending = null : (nextState = nextState.next, actionNode.next = nextState, runActionStateAction(actionQueue, nextState)));
      }
      function onActionError(actionQueue, actionNode, error) {
        var last = actionQueue.pending;
        actionQueue.pending = null;
        if (null !== last) {
          last = last.next;
          do
            actionNode.status = "rejected", actionNode.reason = error, notifyActionListeners(actionNode), actionNode = actionNode.next;
          while (actionNode !== last);
        }
        actionQueue.action = null;
      }
      function notifyActionListeners(actionNode) {
        actionNode = actionNode.listeners;
        for (var i2 = 0; i2 < actionNode.length; i2++) (0, actionNode[i2])();
      }
      function actionStateReducer(oldState, newState) {
        return newState;
      }
      function mountActionState(action, initialStateProp) {
        if (isHydrating) {
          var ssrFormState = workInProgressRoot.formState;
          if (null !== ssrFormState) {
            a: {
              var JSCompiler_inline_result = currentlyRenderingFiber;
              if (isHydrating) {
                if (nextHydratableInstance) {
                  b: {
                    var JSCompiler_inline_result$jscomp$0 = nextHydratableInstance;
                    for (var inRootOrSingleton = rootOrSingletonContext; 8 !== JSCompiler_inline_result$jscomp$0.nodeType; ) {
                      if (!inRootOrSingleton) {
                        JSCompiler_inline_result$jscomp$0 = null;
                        break b;
                      }
                      JSCompiler_inline_result$jscomp$0 = getNextHydratable(
                        JSCompiler_inline_result$jscomp$0.nextSibling
                      );
                      if (null === JSCompiler_inline_result$jscomp$0) {
                        JSCompiler_inline_result$jscomp$0 = null;
                        break b;
                      }
                    }
                    inRootOrSingleton = JSCompiler_inline_result$jscomp$0.data;
                    JSCompiler_inline_result$jscomp$0 = "F!" === inRootOrSingleton || "F" === inRootOrSingleton ? JSCompiler_inline_result$jscomp$0 : null;
                  }
                  if (JSCompiler_inline_result$jscomp$0) {
                    nextHydratableInstance = getNextHydratable(
                      JSCompiler_inline_result$jscomp$0.nextSibling
                    );
                    JSCompiler_inline_result = "F!" === JSCompiler_inline_result$jscomp$0.data;
                    break a;
                  }
                }
                throwOnHydrationMismatch(JSCompiler_inline_result);
              }
              JSCompiler_inline_result = false;
            }
            JSCompiler_inline_result && (initialStateProp = ssrFormState[0]);
          }
        }
        ssrFormState = mountWorkInProgressHook();
        ssrFormState.memoizedState = ssrFormState.baseState = initialStateProp;
        JSCompiler_inline_result = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: actionStateReducer,
          lastRenderedState: initialStateProp
        };
        ssrFormState.queue = JSCompiler_inline_result;
        ssrFormState = dispatchSetState.bind(
          null,
          currentlyRenderingFiber,
          JSCompiler_inline_result
        );
        JSCompiler_inline_result.dispatch = ssrFormState;
        JSCompiler_inline_result = mountStateImpl(false);
        inRootOrSingleton = dispatchOptimisticSetState.bind(
          null,
          currentlyRenderingFiber,
          false,
          JSCompiler_inline_result.queue
        );
        JSCompiler_inline_result = mountWorkInProgressHook();
        JSCompiler_inline_result$jscomp$0 = {
          state: initialStateProp,
          dispatch: null,
          action,
          pending: null
        };
        JSCompiler_inline_result.queue = JSCompiler_inline_result$jscomp$0;
        ssrFormState = dispatchActionState.bind(
          null,
          currentlyRenderingFiber,
          JSCompiler_inline_result$jscomp$0,
          inRootOrSingleton,
          ssrFormState
        );
        JSCompiler_inline_result$jscomp$0.dispatch = ssrFormState;
        JSCompiler_inline_result.memoizedState = action;
        return [initialStateProp, ssrFormState, false];
      }
      function updateActionState(action) {
        var stateHook = updateWorkInProgressHook();
        return updateActionStateImpl(stateHook, currentHook, action);
      }
      function updateActionStateImpl(stateHook, currentStateHook, action) {
        currentStateHook = updateReducerImpl(
          stateHook,
          currentStateHook,
          actionStateReducer
        )[0];
        stateHook = updateReducer(basicStateReducer)[0];
        if ("object" === typeof currentStateHook && null !== currentStateHook && "function" === typeof currentStateHook.then)
          try {
            var state = useThenable(currentStateHook);
          } catch (x) {
            if (x === SuspenseException) throw SuspenseActionException;
            throw x;
          }
        else state = currentStateHook;
        currentStateHook = updateWorkInProgressHook();
        var actionQueue = currentStateHook.queue, dispatch = actionQueue.dispatch;
        action !== currentStateHook.memoizedState && (currentlyRenderingFiber.flags |= 2048, pushSimpleEffect(
          9,
          { destroy: void 0 },
          actionStateActionEffect.bind(null, actionQueue, action),
          null
        ));
        return [state, dispatch, stateHook];
      }
      function actionStateActionEffect(actionQueue, action) {
        actionQueue.action = action;
      }
      function rerenderActionState(action) {
        var stateHook = updateWorkInProgressHook(), currentStateHook = currentHook;
        if (null !== currentStateHook)
          return updateActionStateImpl(stateHook, currentStateHook, action);
        updateWorkInProgressHook();
        stateHook = stateHook.memoizedState;
        currentStateHook = updateWorkInProgressHook();
        var dispatch = currentStateHook.queue.dispatch;
        currentStateHook.memoizedState = action;
        return [stateHook, dispatch, false];
      }
      function pushSimpleEffect(tag, inst, create, deps) {
        tag = { tag, create, deps, inst, next: null };
        inst = currentlyRenderingFiber.updateQueue;
        null === inst && (inst = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = inst);
        create = inst.lastEffect;
        null === create ? inst.lastEffect = tag.next = tag : (deps = create.next, create.next = tag, tag.next = deps, inst.lastEffect = tag);
        return tag;
      }
      function updateRef() {
        return updateWorkInProgressHook().memoizedState;
      }
      function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
        var hook = mountWorkInProgressHook();
        currentlyRenderingFiber.flags |= fiberFlags;
        hook.memoizedState = pushSimpleEffect(
          1 | hookFlags,
          { destroy: void 0 },
          create,
          void 0 === deps ? null : deps
        );
      }
      function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
        var hook = updateWorkInProgressHook();
        deps = void 0 === deps ? null : deps;
        var inst = hook.memoizedState.inst;
        null !== currentHook && null !== deps && areHookInputsEqual(deps, currentHook.memoizedState.deps) ? hook.memoizedState = pushSimpleEffect(hookFlags, inst, create, deps) : (currentlyRenderingFiber.flags |= fiberFlags, hook.memoizedState = pushSimpleEffect(
          1 | hookFlags,
          inst,
          create,
          deps
        ));
      }
      function mountEffect(create, deps) {
        mountEffectImpl(8390656, 8, create, deps);
      }
      function updateEffect(create, deps) {
        updateEffectImpl(2048, 8, create, deps);
      }
      function useEffectEventImpl(payload) {
        currentlyRenderingFiber.flags |= 4;
        var componentUpdateQueue = currentlyRenderingFiber.updateQueue;
        if (null === componentUpdateQueue)
          componentUpdateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = componentUpdateQueue, componentUpdateQueue.events = [payload];
        else {
          var events = componentUpdateQueue.events;
          null === events ? componentUpdateQueue.events = [payload] : events.push(payload);
        }
      }
      function updateEvent(callback) {
        var ref = updateWorkInProgressHook().memoizedState;
        useEffectEventImpl({ ref, nextImpl: callback });
        return function() {
          if (0 !== (executionContext & 2)) throw Error(formatProdErrorMessage(440));
          return ref.impl.apply(void 0, arguments);
        };
      }
      function updateInsertionEffect(create, deps) {
        return updateEffectImpl(4, 2, create, deps);
      }
      function updateLayoutEffect(create, deps) {
        return updateEffectImpl(4, 4, create, deps);
      }
      function imperativeHandleEffect(create, ref) {
        if ("function" === typeof ref) {
          create = create();
          var refCleanup = ref(create);
          return function() {
            "function" === typeof refCleanup ? refCleanup() : ref(null);
          };
        }
        if (null !== ref && void 0 !== ref)
          return create = create(), ref.current = create, function() {
            ref.current = null;
          };
      }
      function updateImperativeHandle(ref, create, deps) {
        deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
        updateEffectImpl(4, 4, imperativeHandleEffect.bind(null, create, ref), deps);
      }
      function mountDebugValue() {
      }
      function updateCallback(callback, deps) {
        var hook = updateWorkInProgressHook();
        deps = void 0 === deps ? null : deps;
        var prevState = hook.memoizedState;
        if (null !== deps && areHookInputsEqual(deps, prevState[1]))
          return prevState[0];
        hook.memoizedState = [callback, deps];
        return callback;
      }
      function updateMemo(nextCreate, deps) {
        var hook = updateWorkInProgressHook();
        deps = void 0 === deps ? null : deps;
        var prevState = hook.memoizedState;
        if (null !== deps && areHookInputsEqual(deps, prevState[1]))
          return prevState[0];
        prevState = nextCreate();
        if (shouldDoubleInvokeUserFnsInHooksDEV) {
          setIsStrictModeForDevtools(true);
          try {
            nextCreate();
          } finally {
            setIsStrictModeForDevtools(false);
          }
        }
        hook.memoizedState = [prevState, deps];
        return prevState;
      }
      function mountDeferredValueImpl(hook, value, initialValue) {
        if (void 0 === initialValue || 0 !== (renderLanes & 1073741824) && 0 === (workInProgressRootRenderLanes & 261930))
          return hook.memoizedState = value;
        hook.memoizedState = initialValue;
        hook = requestDeferredLane();
        currentlyRenderingFiber.lanes |= hook;
        workInProgressRootSkippedLanes |= hook;
        return initialValue;
      }
      function updateDeferredValueImpl(hook, prevValue, value, initialValue) {
        if (objectIs(value, prevValue)) return value;
        if (null !== currentTreeHiddenStackCursor.current)
          return hook = mountDeferredValueImpl(hook, value, initialValue), objectIs(hook, prevValue) || (didReceiveUpdate = true), hook;
        if (0 === (renderLanes & 42) || 0 !== (renderLanes & 1073741824) && 0 === (workInProgressRootRenderLanes & 261930))
          return didReceiveUpdate = true, hook.memoizedState = value;
        hook = requestDeferredLane();
        currentlyRenderingFiber.lanes |= hook;
        workInProgressRootSkippedLanes |= hook;
        return prevValue;
      }
      function startTransition(fiber, queue, pendingState, finishedState, callback) {
        var previousPriority = ReactDOMSharedInternals.p;
        ReactDOMSharedInternals.p = 0 !== previousPriority && 8 > previousPriority ? previousPriority : 8;
        var prevTransition = ReactSharedInternals.T, currentTransition = {};
        ReactSharedInternals.T = currentTransition;
        dispatchOptimisticSetState(fiber, false, queue, pendingState);
        try {
          var returnValue = callback(), onStartTransitionFinish = ReactSharedInternals.S;
          null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
          if (null !== returnValue && "object" === typeof returnValue && "function" === typeof returnValue.then) {
            var thenableForFinishedState = chainThenableValue(
              returnValue,
              finishedState
            );
            dispatchSetStateInternal(
              fiber,
              queue,
              thenableForFinishedState,
              requestUpdateLane(fiber)
            );
          } else
            dispatchSetStateInternal(
              fiber,
              queue,
              finishedState,
              requestUpdateLane(fiber)
            );
        } catch (error) {
          dispatchSetStateInternal(
            fiber,
            queue,
            { then: function() {
            }, status: "rejected", reason: error },
            requestUpdateLane()
          );
        } finally {
          ReactDOMSharedInternals.p = previousPriority, null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
        }
      }
      function noop() {
      }
      function startHostTransition(formFiber, pendingState, action, formData) {
        if (5 !== formFiber.tag) throw Error(formatProdErrorMessage(476));
        var queue = ensureFormComponentIsStateful(formFiber).queue;
        startTransition(
          formFiber,
          queue,
          pendingState,
          sharedNotPendingObject,
          null === action ? noop : function() {
            requestFormReset$1(formFiber);
            return action(formData);
          }
        );
      }
      function ensureFormComponentIsStateful(formFiber) {
        var existingStateHook = formFiber.memoizedState;
        if (null !== existingStateHook) return existingStateHook;
        existingStateHook = {
          memoizedState: sharedNotPendingObject,
          baseState: sharedNotPendingObject,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: basicStateReducer,
            lastRenderedState: sharedNotPendingObject
          },
          next: null
        };
        var initialResetState = {};
        existingStateHook.next = {
          memoizedState: initialResetState,
          baseState: initialResetState,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: basicStateReducer,
            lastRenderedState: initialResetState
          },
          next: null
        };
        formFiber.memoizedState = existingStateHook;
        formFiber = formFiber.alternate;
        null !== formFiber && (formFiber.memoizedState = existingStateHook);
        return existingStateHook;
      }
      function requestFormReset$1(formFiber) {
        var stateHook = ensureFormComponentIsStateful(formFiber);
        null === stateHook.next && (stateHook = formFiber.alternate.memoizedState);
        dispatchSetStateInternal(
          formFiber,
          stateHook.next.queue,
          {},
          requestUpdateLane()
        );
      }
      function useHostTransitionStatus() {
        return readContext(HostTransitionContext);
      }
      function updateId() {
        return updateWorkInProgressHook().memoizedState;
      }
      function updateRefresh() {
        return updateWorkInProgressHook().memoizedState;
      }
      function refreshCache(fiber) {
        for (var provider = fiber.return; null !== provider; ) {
          switch (provider.tag) {
            case 24:
            case 3:
              var lane = requestUpdateLane();
              fiber = createUpdate(lane);
              var root$69 = enqueueUpdate(provider, fiber, lane);
              null !== root$69 && (scheduleUpdateOnFiber(root$69, provider, lane), entangleTransitions(root$69, provider, lane));
              provider = { cache: createCache() };
              fiber.payload = provider;
              return;
          }
          provider = provider.return;
        }
      }
      function dispatchReducerAction(fiber, queue, action) {
        var lane = requestUpdateLane();
        action = {
          lane,
          revertLane: 0,
          gesture: null,
          action,
          hasEagerState: false,
          eagerState: null,
          next: null
        };
        isRenderPhaseUpdate(fiber) ? enqueueRenderPhaseUpdate(queue, action) : (action = enqueueConcurrentHookUpdate(fiber, queue, action, lane), null !== action && (scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane)));
      }
      function dispatchSetState(fiber, queue, action) {
        var lane = requestUpdateLane();
        dispatchSetStateInternal(fiber, queue, action, lane);
      }
      function dispatchSetStateInternal(fiber, queue, action, lane) {
        var update = {
          lane,
          revertLane: 0,
          gesture: null,
          action,
          hasEagerState: false,
          eagerState: null,
          next: null
        };
        if (isRenderPhaseUpdate(fiber)) enqueueRenderPhaseUpdate(queue, update);
        else {
          var alternate = fiber.alternate;
          if (0 === fiber.lanes && (null === alternate || 0 === alternate.lanes) && (alternate = queue.lastRenderedReducer, null !== alternate))
            try {
              var currentState = queue.lastRenderedState, eagerState = alternate(currentState, action);
              update.hasEagerState = true;
              update.eagerState = eagerState;
              if (objectIs(eagerState, currentState))
                return enqueueUpdate$1(fiber, queue, update, 0), null === workInProgressRoot && finishQueueingConcurrentUpdates(), false;
            } catch (error) {
            } finally {
            }
          action = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
          if (null !== action)
            return scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane), true;
        }
        return false;
      }
      function dispatchOptimisticSetState(fiber, throwIfDuringRender, queue, action) {
        action = {
          lane: 2,
          revertLane: requestTransitionLane(),
          gesture: null,
          action,
          hasEagerState: false,
          eagerState: null,
          next: null
        };
        if (isRenderPhaseUpdate(fiber)) {
          if (throwIfDuringRender) throw Error(formatProdErrorMessage(479));
        } else
          throwIfDuringRender = enqueueConcurrentHookUpdate(
            fiber,
            queue,
            action,
            2
          ), null !== throwIfDuringRender && scheduleUpdateOnFiber(throwIfDuringRender, fiber, 2);
      }
      function isRenderPhaseUpdate(fiber) {
        var alternate = fiber.alternate;
        return fiber === currentlyRenderingFiber || null !== alternate && alternate === currentlyRenderingFiber;
      }
      function enqueueRenderPhaseUpdate(queue, update) {
        didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = true;
        var pending = queue.pending;
        null === pending ? update.next = update : (update.next = pending.next, pending.next = update);
        queue.pending = update;
      }
      function entangleTransitionUpdate(root2, queue, lane) {
        if (0 !== (lane & 4194048)) {
          var queueLanes = queue.lanes;
          queueLanes &= root2.pendingLanes;
          lane |= queueLanes;
          queue.lanes = lane;
          markRootEntangled(root2, lane);
        }
      }
      var ContextOnlyDispatcher = {
        readContext,
        use,
        useCallback: throwInvalidHookError,
        useContext: throwInvalidHookError,
        useEffect: throwInvalidHookError,
        useImperativeHandle: throwInvalidHookError,
        useLayoutEffect: throwInvalidHookError,
        useInsertionEffect: throwInvalidHookError,
        useMemo: throwInvalidHookError,
        useReducer: throwInvalidHookError,
        useRef: throwInvalidHookError,
        useState: throwInvalidHookError,
        useDebugValue: throwInvalidHookError,
        useDeferredValue: throwInvalidHookError,
        useTransition: throwInvalidHookError,
        useSyncExternalStore: throwInvalidHookError,
        useId: throwInvalidHookError,
        useHostTransitionStatus: throwInvalidHookError,
        useFormState: throwInvalidHookError,
        useActionState: throwInvalidHookError,
        useOptimistic: throwInvalidHookError,
        useMemoCache: throwInvalidHookError,
        useCacheRefresh: throwInvalidHookError
      };
      ContextOnlyDispatcher.useEffectEvent = throwInvalidHookError;
      var HooksDispatcherOnMount = {
        readContext,
        use,
        useCallback: function(callback, deps) {
          mountWorkInProgressHook().memoizedState = [
            callback,
            void 0 === deps ? null : deps
          ];
          return callback;
        },
        useContext: readContext,
        useEffect: mountEffect,
        useImperativeHandle: function(ref, create, deps) {
          deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
          mountEffectImpl(
            4194308,
            4,
            imperativeHandleEffect.bind(null, create, ref),
            deps
          );
        },
        useLayoutEffect: function(create, deps) {
          return mountEffectImpl(4194308, 4, create, deps);
        },
        useInsertionEffect: function(create, deps) {
          mountEffectImpl(4, 2, create, deps);
        },
        useMemo: function(nextCreate, deps) {
          var hook = mountWorkInProgressHook();
          deps = void 0 === deps ? null : deps;
          var nextValue = nextCreate();
          if (shouldDoubleInvokeUserFnsInHooksDEV) {
            setIsStrictModeForDevtools(true);
            try {
              nextCreate();
            } finally {
              setIsStrictModeForDevtools(false);
            }
          }
          hook.memoizedState = [nextValue, deps];
          return nextValue;
        },
        useReducer: function(reducer, initialArg, init) {
          var hook = mountWorkInProgressHook();
          if (void 0 !== init) {
            var initialState = init(initialArg);
            if (shouldDoubleInvokeUserFnsInHooksDEV) {
              setIsStrictModeForDevtools(true);
              try {
                init(initialArg);
              } finally {
                setIsStrictModeForDevtools(false);
              }
            }
          } else initialState = initialArg;
          hook.memoizedState = hook.baseState = initialState;
          reducer = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: reducer,
            lastRenderedState: initialState
          };
          hook.queue = reducer;
          reducer = reducer.dispatch = dispatchReducerAction.bind(
            null,
            currentlyRenderingFiber,
            reducer
          );
          return [hook.memoizedState, reducer];
        },
        useRef: function(initialValue) {
          var hook = mountWorkInProgressHook();
          initialValue = { current: initialValue };
          return hook.memoizedState = initialValue;
        },
        useState: function(initialState) {
          initialState = mountStateImpl(initialState);
          var queue = initialState.queue, dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
          queue.dispatch = dispatch;
          return [initialState.memoizedState, dispatch];
        },
        useDebugValue: mountDebugValue,
        useDeferredValue: function(value, initialValue) {
          var hook = mountWorkInProgressHook();
          return mountDeferredValueImpl(hook, value, initialValue);
        },
        useTransition: function() {
          var stateHook = mountStateImpl(false);
          stateHook = startTransition.bind(
            null,
            currentlyRenderingFiber,
            stateHook.queue,
            true,
            false
          );
          mountWorkInProgressHook().memoizedState = stateHook;
          return [false, stateHook];
        },
        useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
          var fiber = currentlyRenderingFiber, hook = mountWorkInProgressHook();
          if (isHydrating) {
            if (void 0 === getServerSnapshot)
              throw Error(formatProdErrorMessage(407));
            getServerSnapshot = getServerSnapshot();
          } else {
            getServerSnapshot = getSnapshot();
            if (null === workInProgressRoot)
              throw Error(formatProdErrorMessage(349));
            0 !== (workInProgressRootRenderLanes & 127) || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
          }
          hook.memoizedState = getServerSnapshot;
          var inst = { value: getServerSnapshot, getSnapshot };
          hook.queue = inst;
          mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [
            subscribe
          ]);
          fiber.flags |= 2048;
          pushSimpleEffect(
            9,
            { destroy: void 0 },
            updateStoreInstance.bind(
              null,
              fiber,
              inst,
              getServerSnapshot,
              getSnapshot
            ),
            null
          );
          return getServerSnapshot;
        },
        useId: function() {
          var hook = mountWorkInProgressHook(), identifierPrefix = workInProgressRoot.identifierPrefix;
          if (isHydrating) {
            var JSCompiler_inline_result = treeContextOverflow;
            var idWithLeadingBit = treeContextId;
            JSCompiler_inline_result = (idWithLeadingBit & ~(1 << 32 - clz32(idWithLeadingBit) - 1)).toString(32) + JSCompiler_inline_result;
            identifierPrefix = "_" + identifierPrefix + "R_" + JSCompiler_inline_result;
            JSCompiler_inline_result = localIdCounter++;
            0 < JSCompiler_inline_result && (identifierPrefix += "H" + JSCompiler_inline_result.toString(32));
            identifierPrefix += "_";
          } else
            JSCompiler_inline_result = globalClientIdCounter++, identifierPrefix = "_" + identifierPrefix + "r_" + JSCompiler_inline_result.toString(32) + "_";
          return hook.memoizedState = identifierPrefix;
        },
        useHostTransitionStatus,
        useFormState: mountActionState,
        useActionState: mountActionState,
        useOptimistic: function(passthrough) {
          var hook = mountWorkInProgressHook();
          hook.memoizedState = hook.baseState = passthrough;
          var queue = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: null,
            lastRenderedState: null
          };
          hook.queue = queue;
          hook = dispatchOptimisticSetState.bind(
            null,
            currentlyRenderingFiber,
            true,
            queue
          );
          queue.dispatch = hook;
          return [passthrough, hook];
        },
        useMemoCache,
        useCacheRefresh: function() {
          return mountWorkInProgressHook().memoizedState = refreshCache.bind(
            null,
            currentlyRenderingFiber
          );
        },
        useEffectEvent: function(callback) {
          var hook = mountWorkInProgressHook(), ref = { impl: callback };
          hook.memoizedState = ref;
          return function() {
            if (0 !== (executionContext & 2))
              throw Error(formatProdErrorMessage(440));
            return ref.impl.apply(void 0, arguments);
          };
        }
      };
      var HooksDispatcherOnUpdate = {
        readContext,
        use,
        useCallback: updateCallback,
        useContext: readContext,
        useEffect: updateEffect,
        useImperativeHandle: updateImperativeHandle,
        useInsertionEffect: updateInsertionEffect,
        useLayoutEffect: updateLayoutEffect,
        useMemo: updateMemo,
        useReducer: updateReducer,
        useRef: updateRef,
        useState: function() {
          return updateReducer(basicStateReducer);
        },
        useDebugValue: mountDebugValue,
        useDeferredValue: function(value, initialValue) {
          var hook = updateWorkInProgressHook();
          return updateDeferredValueImpl(
            hook,
            currentHook.memoizedState,
            value,
            initialValue
          );
        },
        useTransition: function() {
          var booleanOrThenable = updateReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
          return [
            "boolean" === typeof booleanOrThenable ? booleanOrThenable : useThenable(booleanOrThenable),
            start
          ];
        },
        useSyncExternalStore: updateSyncExternalStore,
        useId: updateId,
        useHostTransitionStatus,
        useFormState: updateActionState,
        useActionState: updateActionState,
        useOptimistic: function(passthrough, reducer) {
          var hook = updateWorkInProgressHook();
          return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
        },
        useMemoCache,
        useCacheRefresh: updateRefresh
      };
      HooksDispatcherOnUpdate.useEffectEvent = updateEvent;
      var HooksDispatcherOnRerender = {
        readContext,
        use,
        useCallback: updateCallback,
        useContext: readContext,
        useEffect: updateEffect,
        useImperativeHandle: updateImperativeHandle,
        useInsertionEffect: updateInsertionEffect,
        useLayoutEffect: updateLayoutEffect,
        useMemo: updateMemo,
        useReducer: rerenderReducer,
        useRef: updateRef,
        useState: function() {
          return rerenderReducer(basicStateReducer);
        },
        useDebugValue: mountDebugValue,
        useDeferredValue: function(value, initialValue) {
          var hook = updateWorkInProgressHook();
          return null === currentHook ? mountDeferredValueImpl(hook, value, initialValue) : updateDeferredValueImpl(
            hook,
            currentHook.memoizedState,
            value,
            initialValue
          );
        },
        useTransition: function() {
          var booleanOrThenable = rerenderReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
          return [
            "boolean" === typeof booleanOrThenable ? booleanOrThenable : useThenable(booleanOrThenable),
            start
          ];
        },
        useSyncExternalStore: updateSyncExternalStore,
        useId: updateId,
        useHostTransitionStatus,
        useFormState: rerenderActionState,
        useActionState: rerenderActionState,
        useOptimistic: function(passthrough, reducer) {
          var hook = updateWorkInProgressHook();
          if (null !== currentHook)
            return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
          hook.baseState = passthrough;
          return [passthrough, hook.queue.dispatch];
        },
        useMemoCache,
        useCacheRefresh: updateRefresh
      };
      HooksDispatcherOnRerender.useEffectEvent = updateEvent;
      function applyDerivedStateFromProps(workInProgress2, ctor, getDerivedStateFromProps, nextProps) {
        ctor = workInProgress2.memoizedState;
        getDerivedStateFromProps = getDerivedStateFromProps(nextProps, ctor);
        getDerivedStateFromProps = null === getDerivedStateFromProps || void 0 === getDerivedStateFromProps ? ctor : assign3({}, ctor, getDerivedStateFromProps);
        workInProgress2.memoizedState = getDerivedStateFromProps;
        0 === workInProgress2.lanes && (workInProgress2.updateQueue.baseState = getDerivedStateFromProps);
      }
      var classComponentUpdater = {
        enqueueSetState: function(inst, payload, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(), update = createUpdate(lane);
          update.payload = payload;
          void 0 !== callback && null !== callback && (update.callback = callback);
          payload = enqueueUpdate(inst, update, lane);
          null !== payload && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
        },
        enqueueReplaceState: function(inst, payload, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(), update = createUpdate(lane);
          update.tag = 1;
          update.payload = payload;
          void 0 !== callback && null !== callback && (update.callback = callback);
          payload = enqueueUpdate(inst, update, lane);
          null !== payload && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
        },
        enqueueForceUpdate: function(inst, callback) {
          inst = inst._reactInternals;
          var lane = requestUpdateLane(), update = createUpdate(lane);
          update.tag = 2;
          void 0 !== callback && null !== callback && (update.callback = callback);
          callback = enqueueUpdate(inst, update, lane);
          null !== callback && (scheduleUpdateOnFiber(callback, inst, lane), entangleTransitions(callback, inst, lane));
        }
      };
      function checkShouldComponentUpdate(workInProgress2, ctor, oldProps, newProps, oldState, newState, nextContext) {
        workInProgress2 = workInProgress2.stateNode;
        return "function" === typeof workInProgress2.shouldComponentUpdate ? workInProgress2.shouldComponentUpdate(newProps, newState, nextContext) : ctor.prototype && ctor.prototype.isPureReactComponent ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState) : true;
      }
      function callComponentWillReceiveProps(workInProgress2, instance, newProps, nextContext) {
        workInProgress2 = instance.state;
        "function" === typeof instance.componentWillReceiveProps && instance.componentWillReceiveProps(newProps, nextContext);
        "function" === typeof instance.UNSAFE_componentWillReceiveProps && instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
        instance.state !== workInProgress2 && classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
      }
      function resolveClassComponentProps(Component, baseProps) {
        var newProps = baseProps;
        if ("ref" in baseProps) {
          newProps = {};
          for (var propName in baseProps)
            "ref" !== propName && (newProps[propName] = baseProps[propName]);
        }
        if (Component = Component.defaultProps) {
          newProps === baseProps && (newProps = assign3({}, newProps));
          for (var propName$73 in Component)
            void 0 === newProps[propName$73] && (newProps[propName$73] = Component[propName$73]);
        }
        return newProps;
      }
      function defaultOnUncaughtError(error) {
        reportGlobalError(error);
      }
      function defaultOnCaughtError(error) {
        console.error(error);
      }
      function defaultOnRecoverableError(error) {
        reportGlobalError(error);
      }
      function logUncaughtError(root2, errorInfo) {
        try {
          var onUncaughtError = root2.onUncaughtError;
          onUncaughtError(errorInfo.value, { componentStack: errorInfo.stack });
        } catch (e$74) {
          setTimeout(function() {
            throw e$74;
          });
        }
      }
      function logCaughtError(root2, boundary, errorInfo) {
        try {
          var onCaughtError = root2.onCaughtError;
          onCaughtError(errorInfo.value, {
            componentStack: errorInfo.stack,
            errorBoundary: 1 === boundary.tag ? boundary.stateNode : null
          });
        } catch (e$75) {
          setTimeout(function() {
            throw e$75;
          });
        }
      }
      function createRootErrorUpdate(root2, errorInfo, lane) {
        lane = createUpdate(lane);
        lane.tag = 3;
        lane.payload = { element: null };
        lane.callback = function() {
          logUncaughtError(root2, errorInfo);
        };
        return lane;
      }
      function createClassErrorUpdate(lane) {
        lane = createUpdate(lane);
        lane.tag = 3;
        return lane;
      }
      function initializeClassErrorUpdate(update, root2, fiber, errorInfo) {
        var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
        if ("function" === typeof getDerivedStateFromError) {
          var error = errorInfo.value;
          update.payload = function() {
            return getDerivedStateFromError(error);
          };
          update.callback = function() {
            logCaughtError(root2, fiber, errorInfo);
          };
        }
        var inst = fiber.stateNode;
        null !== inst && "function" === typeof inst.componentDidCatch && (update.callback = function() {
          logCaughtError(root2, fiber, errorInfo);
          "function" !== typeof getDerivedStateFromError && (null === legacyErrorBoundariesThatAlreadyFailed ? legacyErrorBoundariesThatAlreadyFailed = /* @__PURE__ */ new Set([this]) : legacyErrorBoundariesThatAlreadyFailed.add(this));
          var stack = errorInfo.stack;
          this.componentDidCatch(errorInfo.value, {
            componentStack: null !== stack ? stack : ""
          });
        });
      }
      function throwException(root2, returnFiber, sourceFiber, value, rootRenderLanes) {
        sourceFiber.flags |= 32768;
        if (null !== value && "object" === typeof value && "function" === typeof value.then) {
          returnFiber = sourceFiber.alternate;
          null !== returnFiber && propagateParentContextChanges(
            returnFiber,
            sourceFiber,
            rootRenderLanes,
            true
          );
          sourceFiber = suspenseHandlerStackCursor.current;
          if (null !== sourceFiber) {
            switch (sourceFiber.tag) {
              case 31:
              case 13:
                return null === shellBoundary ? renderDidSuspendDelayIfPossible() : null === sourceFiber.alternate && 0 === workInProgressRootExitStatus && (workInProgressRootExitStatus = 3), sourceFiber.flags &= -257, sourceFiber.flags |= 65536, sourceFiber.lanes = rootRenderLanes, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, null === returnFiber ? sourceFiber.updateQueue = /* @__PURE__ */ new Set([value]) : returnFiber.add(value), attachPingListener(root2, value, rootRenderLanes)), false;
              case 22:
                return sourceFiber.flags |= 65536, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, null === returnFiber ? (returnFiber = {
                  transitions: null,
                  markerInstances: null,
                  retryQueue: /* @__PURE__ */ new Set([value])
                }, sourceFiber.updateQueue = returnFiber) : (sourceFiber = returnFiber.retryQueue, null === sourceFiber ? returnFiber.retryQueue = /* @__PURE__ */ new Set([value]) : sourceFiber.add(value)), attachPingListener(root2, value, rootRenderLanes)), false;
            }
            throw Error(formatProdErrorMessage(435, sourceFiber.tag));
          }
          attachPingListener(root2, value, rootRenderLanes);
          renderDidSuspendDelayIfPossible();
          return false;
        }
        if (isHydrating)
          return returnFiber = suspenseHandlerStackCursor.current, null !== returnFiber ? (0 === (returnFiber.flags & 65536) && (returnFiber.flags |= 256), returnFiber.flags |= 65536, returnFiber.lanes = rootRenderLanes, value !== HydrationMismatchException && (root2 = Error(formatProdErrorMessage(422), { cause: value }), queueHydrationError(createCapturedValueAtFiber(root2, sourceFiber)))) : (value !== HydrationMismatchException && (returnFiber = Error(formatProdErrorMessage(423), {
            cause: value
          }), queueHydrationError(
            createCapturedValueAtFiber(returnFiber, sourceFiber)
          )), root2 = root2.current.alternate, root2.flags |= 65536, rootRenderLanes &= -rootRenderLanes, root2.lanes |= rootRenderLanes, value = createCapturedValueAtFiber(value, sourceFiber), rootRenderLanes = createRootErrorUpdate(
            root2.stateNode,
            value,
            rootRenderLanes
          ), enqueueCapturedUpdate(root2, rootRenderLanes), 4 !== workInProgressRootExitStatus && (workInProgressRootExitStatus = 2)), false;
        var wrapperError = Error(formatProdErrorMessage(520), { cause: value });
        wrapperError = createCapturedValueAtFiber(wrapperError, sourceFiber);
        null === workInProgressRootConcurrentErrors ? workInProgressRootConcurrentErrors = [wrapperError] : workInProgressRootConcurrentErrors.push(wrapperError);
        4 !== workInProgressRootExitStatus && (workInProgressRootExitStatus = 2);
        if (null === returnFiber) return true;
        value = createCapturedValueAtFiber(value, sourceFiber);
        sourceFiber = returnFiber;
        do {
          switch (sourceFiber.tag) {
            case 3:
              return sourceFiber.flags |= 65536, root2 = rootRenderLanes & -rootRenderLanes, sourceFiber.lanes |= root2, root2 = createRootErrorUpdate(sourceFiber.stateNode, value, root2), enqueueCapturedUpdate(sourceFiber, root2), false;
            case 1:
              if (returnFiber = sourceFiber.type, wrapperError = sourceFiber.stateNode, 0 === (sourceFiber.flags & 128) && ("function" === typeof returnFiber.getDerivedStateFromError || null !== wrapperError && "function" === typeof wrapperError.componentDidCatch && (null === legacyErrorBoundariesThatAlreadyFailed || !legacyErrorBoundariesThatAlreadyFailed.has(wrapperError))))
                return sourceFiber.flags |= 65536, rootRenderLanes &= -rootRenderLanes, sourceFiber.lanes |= rootRenderLanes, rootRenderLanes = createClassErrorUpdate(rootRenderLanes), initializeClassErrorUpdate(
                  rootRenderLanes,
                  root2,
                  sourceFiber,
                  value
                ), enqueueCapturedUpdate(sourceFiber, rootRenderLanes), false;
          }
          sourceFiber = sourceFiber.return;
        } while (null !== sourceFiber);
        return false;
      }
      var SelectiveHydrationException = Error(formatProdErrorMessage(461));
      var didReceiveUpdate = false;
      function reconcileChildren(current, workInProgress2, nextChildren, renderLanes2) {
        workInProgress2.child = null === current ? mountChildFibers(workInProgress2, null, nextChildren, renderLanes2) : reconcileChildFibers(
          workInProgress2,
          current.child,
          nextChildren,
          renderLanes2
        );
      }
      function updateForwardRef(current, workInProgress2, Component, nextProps, renderLanes2) {
        Component = Component.render;
        var ref = workInProgress2.ref;
        if ("ref" in nextProps) {
          var propsWithoutRef = {};
          for (var key in nextProps)
            "ref" !== key && (propsWithoutRef[key] = nextProps[key]);
        } else propsWithoutRef = nextProps;
        prepareToReadContext(workInProgress2);
        nextProps = renderWithHooks(
          current,
          workInProgress2,
          Component,
          propsWithoutRef,
          ref,
          renderLanes2
        );
        key = checkDidRenderIdHook();
        if (null !== current && !didReceiveUpdate)
          return bailoutHooks(current, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
        isHydrating && key && pushMaterializedTreeId(workInProgress2);
        workInProgress2.flags |= 1;
        reconcileChildren(current, workInProgress2, nextProps, renderLanes2);
        return workInProgress2.child;
      }
      function updateMemoComponent(current, workInProgress2, Component, nextProps, renderLanes2) {
        if (null === current) {
          var type = Component.type;
          if ("function" === typeof type && !shouldConstruct(type) && void 0 === type.defaultProps && null === Component.compare)
            return workInProgress2.tag = 15, workInProgress2.type = type, updateSimpleMemoComponent(
              current,
              workInProgress2,
              type,
              nextProps,
              renderLanes2
            );
          current = createFiberFromTypeAndProps(
            Component.type,
            null,
            nextProps,
            workInProgress2,
            workInProgress2.mode,
            renderLanes2
          );
          current.ref = workInProgress2.ref;
          current.return = workInProgress2;
          return workInProgress2.child = current;
        }
        type = current.child;
        if (!checkScheduledUpdateOrContext(current, renderLanes2)) {
          var prevProps = type.memoizedProps;
          Component = Component.compare;
          Component = null !== Component ? Component : shallowEqual;
          if (Component(prevProps, nextProps) && current.ref === workInProgress2.ref)
            return bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
        }
        workInProgress2.flags |= 1;
        current = createWorkInProgress(type, nextProps);
        current.ref = workInProgress2.ref;
        current.return = workInProgress2;
        return workInProgress2.child = current;
      }
      function updateSimpleMemoComponent(current, workInProgress2, Component, nextProps, renderLanes2) {
        if (null !== current) {
          var prevProps = current.memoizedProps;
          if (shallowEqual(prevProps, nextProps) && current.ref === workInProgress2.ref)
            if (didReceiveUpdate = false, workInProgress2.pendingProps = nextProps = prevProps, checkScheduledUpdateOrContext(current, renderLanes2))
              0 !== (current.flags & 131072) && (didReceiveUpdate = true);
            else
              return workInProgress2.lanes = current.lanes, bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
        }
        return updateFunctionComponent(
          current,
          workInProgress2,
          Component,
          nextProps,
          renderLanes2
        );
      }
      function updateOffscreenComponent(current, workInProgress2, renderLanes2, nextProps) {
        var nextChildren = nextProps.children, prevState = null !== current ? current.memoizedState : null;
        null === current && null === workInProgress2.stateNode && (workInProgress2.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null
        });
        if ("hidden" === nextProps.mode) {
          if (0 !== (workInProgress2.flags & 128)) {
            prevState = null !== prevState ? prevState.baseLanes | renderLanes2 : renderLanes2;
            if (null !== current) {
              nextProps = workInProgress2.child = current.child;
              for (nextChildren = 0; null !== nextProps; )
                nextChildren = nextChildren | nextProps.lanes | nextProps.childLanes, nextProps = nextProps.sibling;
              nextProps = nextChildren & ~prevState;
            } else nextProps = 0, workInProgress2.child = null;
            return deferHiddenOffscreenComponent(
              current,
              workInProgress2,
              prevState,
              renderLanes2,
              nextProps
            );
          }
          if (0 !== (renderLanes2 & 536870912))
            workInProgress2.memoizedState = { baseLanes: 0, cachePool: null }, null !== current && pushTransition(
              workInProgress2,
              null !== prevState ? prevState.cachePool : null
            ), null !== prevState ? pushHiddenContext(workInProgress2, prevState) : reuseHiddenContextOnStack(), pushOffscreenSuspenseHandler(workInProgress2);
          else
            return nextProps = workInProgress2.lanes = 536870912, deferHiddenOffscreenComponent(
              current,
              workInProgress2,
              null !== prevState ? prevState.baseLanes | renderLanes2 : renderLanes2,
              renderLanes2,
              nextProps
            );
        } else
          null !== prevState ? (pushTransition(workInProgress2, prevState.cachePool), pushHiddenContext(workInProgress2, prevState), reuseSuspenseHandlerOnStack(workInProgress2), workInProgress2.memoizedState = null) : (null !== current && pushTransition(workInProgress2, null), reuseHiddenContextOnStack(), reuseSuspenseHandlerOnStack(workInProgress2));
        reconcileChildren(current, workInProgress2, nextChildren, renderLanes2);
        return workInProgress2.child;
      }
      function bailoutOffscreenComponent(current, workInProgress2) {
        null !== current && 22 === current.tag || null !== workInProgress2.stateNode || (workInProgress2.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null
        });
        return workInProgress2.sibling;
      }
      function deferHiddenOffscreenComponent(current, workInProgress2, nextBaseLanes, renderLanes2, remainingChildLanes) {
        var JSCompiler_inline_result = peekCacheFromPool();
        JSCompiler_inline_result = null === JSCompiler_inline_result ? null : { parent: CacheContext._currentValue, pool: JSCompiler_inline_result };
        workInProgress2.memoizedState = {
          baseLanes: nextBaseLanes,
          cachePool: JSCompiler_inline_result
        };
        null !== current && pushTransition(workInProgress2, null);
        reuseHiddenContextOnStack();
        pushOffscreenSuspenseHandler(workInProgress2);
        null !== current && propagateParentContextChanges(current, workInProgress2, renderLanes2, true);
        workInProgress2.childLanes = remainingChildLanes;
        return null;
      }
      function mountActivityChildren(workInProgress2, nextProps) {
        nextProps = mountWorkInProgressOffscreenFiber(
          { mode: nextProps.mode, children: nextProps.children },
          workInProgress2.mode
        );
        nextProps.ref = workInProgress2.ref;
        workInProgress2.child = nextProps;
        nextProps.return = workInProgress2;
        return nextProps;
      }
      function retryActivityComponentWithoutHydrating(current, workInProgress2, renderLanes2) {
        reconcileChildFibers(workInProgress2, current.child, null, renderLanes2);
        current = mountActivityChildren(workInProgress2, workInProgress2.pendingProps);
        current.flags |= 2;
        popSuspenseHandler(workInProgress2);
        workInProgress2.memoizedState = null;
        return current;
      }
      function updateActivityComponent(current, workInProgress2, renderLanes2) {
        var nextProps = workInProgress2.pendingProps, didSuspend = 0 !== (workInProgress2.flags & 128);
        workInProgress2.flags &= -129;
        if (null === current) {
          if (isHydrating) {
            if ("hidden" === nextProps.mode)
              return current = mountActivityChildren(workInProgress2, nextProps), workInProgress2.lanes = 536870912, bailoutOffscreenComponent(null, current);
            pushDehydratedActivitySuspenseHandler(workInProgress2);
            (current = nextHydratableInstance) ? (current = canHydrateHydrationBoundary(
              current,
              rootOrSingletonContext
            ), current = null !== current && "&" === current.data ? current : null, null !== current && (workInProgress2.memoizedState = {
              dehydrated: current,
              treeContext: null !== treeContextProvider ? { id: treeContextId, overflow: treeContextOverflow } : null,
              retryLane: 536870912,
              hydrationErrors: null
            }, renderLanes2 = createFiberFromDehydratedFragment(current), renderLanes2.return = workInProgress2, workInProgress2.child = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null)) : current = null;
            if (null === current) throw throwOnHydrationMismatch(workInProgress2);
            workInProgress2.lanes = 536870912;
            return null;
          }
          return mountActivityChildren(workInProgress2, nextProps);
        }
        var prevState = current.memoizedState;
        if (null !== prevState) {
          var dehydrated = prevState.dehydrated;
          pushDehydratedActivitySuspenseHandler(workInProgress2);
          if (didSuspend)
            if (workInProgress2.flags & 256)
              workInProgress2.flags &= -257, workInProgress2 = retryActivityComponentWithoutHydrating(
                current,
                workInProgress2,
                renderLanes2
              );
            else if (null !== workInProgress2.memoizedState)
              workInProgress2.child = current.child, workInProgress2.flags |= 128, workInProgress2 = null;
            else throw Error(formatProdErrorMessage(558));
          else if (didReceiveUpdate || propagateParentContextChanges(current, workInProgress2, renderLanes2, false), didSuspend = 0 !== (renderLanes2 & current.childLanes), didReceiveUpdate || didSuspend) {
            nextProps = workInProgressRoot;
            if (null !== nextProps && (dehydrated = getBumpedLaneForHydration(nextProps, renderLanes2), 0 !== dehydrated && dehydrated !== prevState.retryLane))
              throw prevState.retryLane = dehydrated, enqueueConcurrentRenderForLane(current, dehydrated), scheduleUpdateOnFiber(nextProps, current, dehydrated), SelectiveHydrationException;
            renderDidSuspendDelayIfPossible();
            workInProgress2 = retryActivityComponentWithoutHydrating(
              current,
              workInProgress2,
              renderLanes2
            );
          } else
            current = prevState.treeContext, nextHydratableInstance = getNextHydratable(dehydrated.nextSibling), hydrationParentFiber = workInProgress2, isHydrating = true, hydrationErrors = null, rootOrSingletonContext = false, null !== current && restoreSuspendedTreeContext(workInProgress2, current), workInProgress2 = mountActivityChildren(workInProgress2, nextProps), workInProgress2.flags |= 4096;
          return workInProgress2;
        }
        current = createWorkInProgress(current.child, {
          mode: nextProps.mode,
          children: nextProps.children
        });
        current.ref = workInProgress2.ref;
        workInProgress2.child = current;
        current.return = workInProgress2;
        return current;
      }
      function markRef(current, workInProgress2) {
        var ref = workInProgress2.ref;
        if (null === ref)
          null !== current && null !== current.ref && (workInProgress2.flags |= 4194816);
        else {
          if ("function" !== typeof ref && "object" !== typeof ref)
            throw Error(formatProdErrorMessage(284));
          if (null === current || current.ref !== ref)
            workInProgress2.flags |= 4194816;
        }
      }
      function updateFunctionComponent(current, workInProgress2, Component, nextProps, renderLanes2) {
        prepareToReadContext(workInProgress2);
        Component = renderWithHooks(
          current,
          workInProgress2,
          Component,
          nextProps,
          void 0,
          renderLanes2
        );
        nextProps = checkDidRenderIdHook();
        if (null !== current && !didReceiveUpdate)
          return bailoutHooks(current, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
        isHydrating && nextProps && pushMaterializedTreeId(workInProgress2);
        workInProgress2.flags |= 1;
        reconcileChildren(current, workInProgress2, Component, renderLanes2);
        return workInProgress2.child;
      }
      function replayFunctionComponent(current, workInProgress2, nextProps, Component, secondArg, renderLanes2) {
        prepareToReadContext(workInProgress2);
        workInProgress2.updateQueue = null;
        nextProps = renderWithHooksAgain(
          workInProgress2,
          Component,
          nextProps,
          secondArg
        );
        finishRenderingHooks(current);
        Component = checkDidRenderIdHook();
        if (null !== current && !didReceiveUpdate)
          return bailoutHooks(current, workInProgress2, renderLanes2), bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
        isHydrating && Component && pushMaterializedTreeId(workInProgress2);
        workInProgress2.flags |= 1;
        reconcileChildren(current, workInProgress2, nextProps, renderLanes2);
        return workInProgress2.child;
      }
      function updateClassComponent(current, workInProgress2, Component, nextProps, renderLanes2) {
        prepareToReadContext(workInProgress2);
        if (null === workInProgress2.stateNode) {
          var context = emptyContextObject, contextType = Component.contextType;
          "object" === typeof contextType && null !== contextType && (context = readContext(contextType));
          context = new Component(nextProps, context);
          workInProgress2.memoizedState = null !== context.state && void 0 !== context.state ? context.state : null;
          context.updater = classComponentUpdater;
          workInProgress2.stateNode = context;
          context._reactInternals = workInProgress2;
          context = workInProgress2.stateNode;
          context.props = nextProps;
          context.state = workInProgress2.memoizedState;
          context.refs = {};
          initializeUpdateQueue(workInProgress2);
          contextType = Component.contextType;
          context.context = "object" === typeof contextType && null !== contextType ? readContext(contextType) : emptyContextObject;
          context.state = workInProgress2.memoizedState;
          contextType = Component.getDerivedStateFromProps;
          "function" === typeof contextType && (applyDerivedStateFromProps(
            workInProgress2,
            Component,
            contextType,
            nextProps
          ), context.state = workInProgress2.memoizedState);
          "function" === typeof Component.getDerivedStateFromProps || "function" === typeof context.getSnapshotBeforeUpdate || "function" !== typeof context.UNSAFE_componentWillMount && "function" !== typeof context.componentWillMount || (contextType = context.state, "function" === typeof context.componentWillMount && context.componentWillMount(), "function" === typeof context.UNSAFE_componentWillMount && context.UNSAFE_componentWillMount(), contextType !== context.state && classComponentUpdater.enqueueReplaceState(context, context.state, null), processUpdateQueue(workInProgress2, nextProps, context, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction(), context.state = workInProgress2.memoizedState);
          "function" === typeof context.componentDidMount && (workInProgress2.flags |= 4194308);
          nextProps = true;
        } else if (null === current) {
          context = workInProgress2.stateNode;
          var unresolvedOldProps = workInProgress2.memoizedProps, oldProps = resolveClassComponentProps(Component, unresolvedOldProps);
          context.props = oldProps;
          var oldContext = context.context, contextType$jscomp$0 = Component.contextType;
          contextType = emptyContextObject;
          "object" === typeof contextType$jscomp$0 && null !== contextType$jscomp$0 && (contextType = readContext(contextType$jscomp$0));
          var getDerivedStateFromProps = Component.getDerivedStateFromProps;
          contextType$jscomp$0 = "function" === typeof getDerivedStateFromProps || "function" === typeof context.getSnapshotBeforeUpdate;
          unresolvedOldProps = workInProgress2.pendingProps !== unresolvedOldProps;
          contextType$jscomp$0 || "function" !== typeof context.UNSAFE_componentWillReceiveProps && "function" !== typeof context.componentWillReceiveProps || (unresolvedOldProps || oldContext !== contextType) && callComponentWillReceiveProps(
            workInProgress2,
            context,
            nextProps,
            contextType
          );
          hasForceUpdate = false;
          var oldState = workInProgress2.memoizedState;
          context.state = oldState;
          processUpdateQueue(workInProgress2, nextProps, context, renderLanes2);
          suspendIfUpdateReadFromEntangledAsyncAction();
          oldContext = workInProgress2.memoizedState;
          unresolvedOldProps || oldState !== oldContext || hasForceUpdate ? ("function" === typeof getDerivedStateFromProps && (applyDerivedStateFromProps(
            workInProgress2,
            Component,
            getDerivedStateFromProps,
            nextProps
          ), oldContext = workInProgress2.memoizedState), (oldProps = hasForceUpdate || checkShouldComponentUpdate(
            workInProgress2,
            Component,
            oldProps,
            nextProps,
            oldState,
            oldContext,
            contextType
          )) ? (contextType$jscomp$0 || "function" !== typeof context.UNSAFE_componentWillMount && "function" !== typeof context.componentWillMount || ("function" === typeof context.componentWillMount && context.componentWillMount(), "function" === typeof context.UNSAFE_componentWillMount && context.UNSAFE_componentWillMount()), "function" === typeof context.componentDidMount && (workInProgress2.flags |= 4194308)) : ("function" === typeof context.componentDidMount && (workInProgress2.flags |= 4194308), workInProgress2.memoizedProps = nextProps, workInProgress2.memoizedState = oldContext), context.props = nextProps, context.state = oldContext, context.context = contextType, nextProps = oldProps) : ("function" === typeof context.componentDidMount && (workInProgress2.flags |= 4194308), nextProps = false);
        } else {
          context = workInProgress2.stateNode;
          cloneUpdateQueue(current, workInProgress2);
          contextType = workInProgress2.memoizedProps;
          contextType$jscomp$0 = resolveClassComponentProps(Component, contextType);
          context.props = contextType$jscomp$0;
          getDerivedStateFromProps = workInProgress2.pendingProps;
          oldState = context.context;
          oldContext = Component.contextType;
          oldProps = emptyContextObject;
          "object" === typeof oldContext && null !== oldContext && (oldProps = readContext(oldContext));
          unresolvedOldProps = Component.getDerivedStateFromProps;
          (oldContext = "function" === typeof unresolvedOldProps || "function" === typeof context.getSnapshotBeforeUpdate) || "function" !== typeof context.UNSAFE_componentWillReceiveProps && "function" !== typeof context.componentWillReceiveProps || (contextType !== getDerivedStateFromProps || oldState !== oldProps) && callComponentWillReceiveProps(
            workInProgress2,
            context,
            nextProps,
            oldProps
          );
          hasForceUpdate = false;
          oldState = workInProgress2.memoizedState;
          context.state = oldState;
          processUpdateQueue(workInProgress2, nextProps, context, renderLanes2);
          suspendIfUpdateReadFromEntangledAsyncAction();
          var newState = workInProgress2.memoizedState;
          contextType !== getDerivedStateFromProps || oldState !== newState || hasForceUpdate || null !== current && null !== current.dependencies && checkIfContextChanged(current.dependencies) ? ("function" === typeof unresolvedOldProps && (applyDerivedStateFromProps(
            workInProgress2,
            Component,
            unresolvedOldProps,
            nextProps
          ), newState = workInProgress2.memoizedState), (contextType$jscomp$0 = hasForceUpdate || checkShouldComponentUpdate(
            workInProgress2,
            Component,
            contextType$jscomp$0,
            nextProps,
            oldState,
            newState,
            oldProps
          ) || null !== current && null !== current.dependencies && checkIfContextChanged(current.dependencies)) ? (oldContext || "function" !== typeof context.UNSAFE_componentWillUpdate && "function" !== typeof context.componentWillUpdate || ("function" === typeof context.componentWillUpdate && context.componentWillUpdate(nextProps, newState, oldProps), "function" === typeof context.UNSAFE_componentWillUpdate && context.UNSAFE_componentWillUpdate(
            nextProps,
            newState,
            oldProps
          )), "function" === typeof context.componentDidUpdate && (workInProgress2.flags |= 4), "function" === typeof context.getSnapshotBeforeUpdate && (workInProgress2.flags |= 1024)) : ("function" !== typeof context.componentDidUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 4), "function" !== typeof context.getSnapshotBeforeUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 1024), workInProgress2.memoizedProps = nextProps, workInProgress2.memoizedState = newState), context.props = nextProps, context.state = newState, context.context = oldProps, nextProps = contextType$jscomp$0) : ("function" !== typeof context.componentDidUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 4), "function" !== typeof context.getSnapshotBeforeUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress2.flags |= 1024), nextProps = false);
        }
        context = nextProps;
        markRef(current, workInProgress2);
        nextProps = 0 !== (workInProgress2.flags & 128);
        context || nextProps ? (context = workInProgress2.stateNode, Component = nextProps && "function" !== typeof Component.getDerivedStateFromError ? null : context.render(), workInProgress2.flags |= 1, null !== current && nextProps ? (workInProgress2.child = reconcileChildFibers(
          workInProgress2,
          current.child,
          null,
          renderLanes2
        ), workInProgress2.child = reconcileChildFibers(
          workInProgress2,
          null,
          Component,
          renderLanes2
        )) : reconcileChildren(current, workInProgress2, Component, renderLanes2), workInProgress2.memoizedState = context.state, current = workInProgress2.child) : current = bailoutOnAlreadyFinishedWork(
          current,
          workInProgress2,
          renderLanes2
        );
        return current;
      }
      function mountHostRootWithoutHydrating(current, workInProgress2, nextChildren, renderLanes2) {
        resetHydrationState();
        workInProgress2.flags |= 256;
        reconcileChildren(current, workInProgress2, nextChildren, renderLanes2);
        return workInProgress2.child;
      }
      var SUSPENDED_MARKER = {
        dehydrated: null,
        treeContext: null,
        retryLane: 0,
        hydrationErrors: null
      };
      function mountSuspenseOffscreenState(renderLanes2) {
        return { baseLanes: renderLanes2, cachePool: getSuspendedCache() };
      }
      function getRemainingWorkInPrimaryTree(current, primaryTreeDidDefer, renderLanes2) {
        current = null !== current ? current.childLanes & ~renderLanes2 : 0;
        primaryTreeDidDefer && (current |= workInProgressDeferredLane);
        return current;
      }
      function updateSuspenseComponent(current, workInProgress2, renderLanes2) {
        var nextProps = workInProgress2.pendingProps, showFallback = false, didSuspend = 0 !== (workInProgress2.flags & 128), JSCompiler_temp;
        (JSCompiler_temp = didSuspend) || (JSCompiler_temp = null !== current && null === current.memoizedState ? false : 0 !== (suspenseStackCursor.current & 2));
        JSCompiler_temp && (showFallback = true, workInProgress2.flags &= -129);
        JSCompiler_temp = 0 !== (workInProgress2.flags & 32);
        workInProgress2.flags &= -33;
        if (null === current) {
          if (isHydrating) {
            showFallback ? pushPrimaryTreeSuspenseHandler(workInProgress2) : reuseSuspenseHandlerOnStack(workInProgress2);
            (current = nextHydratableInstance) ? (current = canHydrateHydrationBoundary(
              current,
              rootOrSingletonContext
            ), current = null !== current && "&" !== current.data ? current : null, null !== current && (workInProgress2.memoizedState = {
              dehydrated: current,
              treeContext: null !== treeContextProvider ? { id: treeContextId, overflow: treeContextOverflow } : null,
              retryLane: 536870912,
              hydrationErrors: null
            }, renderLanes2 = createFiberFromDehydratedFragment(current), renderLanes2.return = workInProgress2, workInProgress2.child = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null)) : current = null;
            if (null === current) throw throwOnHydrationMismatch(workInProgress2);
            isSuspenseInstanceFallback(current) ? workInProgress2.lanes = 32 : workInProgress2.lanes = 536870912;
            return null;
          }
          var nextPrimaryChildren = nextProps.children;
          nextProps = nextProps.fallback;
          if (showFallback)
            return reuseSuspenseHandlerOnStack(workInProgress2), showFallback = workInProgress2.mode, nextPrimaryChildren = mountWorkInProgressOffscreenFiber(
              { mode: "hidden", children: nextPrimaryChildren },
              showFallback
            ), nextProps = createFiberFromFragment(
              nextProps,
              showFallback,
              renderLanes2,
              null
            ), nextPrimaryChildren.return = workInProgress2, nextProps.return = workInProgress2, nextPrimaryChildren.sibling = nextProps, workInProgress2.child = nextPrimaryChildren, nextProps = workInProgress2.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes2), nextProps.childLanes = getRemainingWorkInPrimaryTree(
              current,
              JSCompiler_temp,
              renderLanes2
            ), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(null, nextProps);
          pushPrimaryTreeSuspenseHandler(workInProgress2);
          return mountSuspensePrimaryChildren(workInProgress2, nextPrimaryChildren);
        }
        var prevState = current.memoizedState;
        if (null !== prevState && (nextPrimaryChildren = prevState.dehydrated, null !== nextPrimaryChildren)) {
          if (didSuspend)
            workInProgress2.flags & 256 ? (pushPrimaryTreeSuspenseHandler(workInProgress2), workInProgress2.flags &= -257, workInProgress2 = retrySuspenseComponentWithoutHydrating(
              current,
              workInProgress2,
              renderLanes2
            )) : null !== workInProgress2.memoizedState ? (reuseSuspenseHandlerOnStack(workInProgress2), workInProgress2.child = current.child, workInProgress2.flags |= 128, workInProgress2 = null) : (reuseSuspenseHandlerOnStack(workInProgress2), nextPrimaryChildren = nextProps.fallback, showFallback = workInProgress2.mode, nextProps = mountWorkInProgressOffscreenFiber(
              { mode: "visible", children: nextProps.children },
              showFallback
            ), nextPrimaryChildren = createFiberFromFragment(
              nextPrimaryChildren,
              showFallback,
              renderLanes2,
              null
            ), nextPrimaryChildren.flags |= 2, nextProps.return = workInProgress2, nextPrimaryChildren.return = workInProgress2, nextProps.sibling = nextPrimaryChildren, workInProgress2.child = nextProps, reconcileChildFibers(
              workInProgress2,
              current.child,
              null,
              renderLanes2
            ), nextProps = workInProgress2.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes2), nextProps.childLanes = getRemainingWorkInPrimaryTree(
              current,
              JSCompiler_temp,
              renderLanes2
            ), workInProgress2.memoizedState = SUSPENDED_MARKER, workInProgress2 = bailoutOffscreenComponent(null, nextProps));
          else if (pushPrimaryTreeSuspenseHandler(workInProgress2), isSuspenseInstanceFallback(nextPrimaryChildren)) {
            JSCompiler_temp = nextPrimaryChildren.nextSibling && nextPrimaryChildren.nextSibling.dataset;
            if (JSCompiler_temp) var digest = JSCompiler_temp.dgst;
            JSCompiler_temp = digest;
            nextProps = Error(formatProdErrorMessage(419));
            nextProps.stack = "";
            nextProps.digest = JSCompiler_temp;
            queueHydrationError({ value: nextProps, source: null, stack: null });
            workInProgress2 = retrySuspenseComponentWithoutHydrating(
              current,
              workInProgress2,
              renderLanes2
            );
          } else if (didReceiveUpdate || propagateParentContextChanges(current, workInProgress2, renderLanes2, false), JSCompiler_temp = 0 !== (renderLanes2 & current.childLanes), didReceiveUpdate || JSCompiler_temp) {
            JSCompiler_temp = workInProgressRoot;
            if (null !== JSCompiler_temp && (nextProps = getBumpedLaneForHydration(JSCompiler_temp, renderLanes2), 0 !== nextProps && nextProps !== prevState.retryLane))
              throw prevState.retryLane = nextProps, enqueueConcurrentRenderForLane(current, nextProps), scheduleUpdateOnFiber(JSCompiler_temp, current, nextProps), SelectiveHydrationException;
            isSuspenseInstancePending(nextPrimaryChildren) || renderDidSuspendDelayIfPossible();
            workInProgress2 = retrySuspenseComponentWithoutHydrating(
              current,
              workInProgress2,
              renderLanes2
            );
          } else
            isSuspenseInstancePending(nextPrimaryChildren) ? (workInProgress2.flags |= 192, workInProgress2.child = current.child, workInProgress2 = null) : (current = prevState.treeContext, nextHydratableInstance = getNextHydratable(
              nextPrimaryChildren.nextSibling
            ), hydrationParentFiber = workInProgress2, isHydrating = true, hydrationErrors = null, rootOrSingletonContext = false, null !== current && restoreSuspendedTreeContext(workInProgress2, current), workInProgress2 = mountSuspensePrimaryChildren(
              workInProgress2,
              nextProps.children
            ), workInProgress2.flags |= 4096);
          return workInProgress2;
        }
        if (showFallback)
          return reuseSuspenseHandlerOnStack(workInProgress2), nextPrimaryChildren = nextProps.fallback, showFallback = workInProgress2.mode, prevState = current.child, digest = prevState.sibling, nextProps = createWorkInProgress(prevState, {
            mode: "hidden",
            children: nextProps.children
          }), nextProps.subtreeFlags = prevState.subtreeFlags & 65011712, null !== digest ? nextPrimaryChildren = createWorkInProgress(
            digest,
            nextPrimaryChildren
          ) : (nextPrimaryChildren = createFiberFromFragment(
            nextPrimaryChildren,
            showFallback,
            renderLanes2,
            null
          ), nextPrimaryChildren.flags |= 2), nextPrimaryChildren.return = workInProgress2, nextProps.return = workInProgress2, nextProps.sibling = nextPrimaryChildren, workInProgress2.child = nextProps, bailoutOffscreenComponent(null, nextProps), nextProps = workInProgress2.child, nextPrimaryChildren = current.child.memoizedState, null === nextPrimaryChildren ? nextPrimaryChildren = mountSuspenseOffscreenState(renderLanes2) : (showFallback = nextPrimaryChildren.cachePool, null !== showFallback ? (prevState = CacheContext._currentValue, showFallback = showFallback.parent !== prevState ? { parent: prevState, pool: prevState } : showFallback) : showFallback = getSuspendedCache(), nextPrimaryChildren = {
            baseLanes: nextPrimaryChildren.baseLanes | renderLanes2,
            cachePool: showFallback
          }), nextProps.memoizedState = nextPrimaryChildren, nextProps.childLanes = getRemainingWorkInPrimaryTree(
            current,
            JSCompiler_temp,
            renderLanes2
          ), workInProgress2.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(current.child, nextProps);
        pushPrimaryTreeSuspenseHandler(workInProgress2);
        renderLanes2 = current.child;
        current = renderLanes2.sibling;
        renderLanes2 = createWorkInProgress(renderLanes2, {
          mode: "visible",
          children: nextProps.children
        });
        renderLanes2.return = workInProgress2;
        renderLanes2.sibling = null;
        null !== current && (JSCompiler_temp = workInProgress2.deletions, null === JSCompiler_temp ? (workInProgress2.deletions = [current], workInProgress2.flags |= 16) : JSCompiler_temp.push(current));
        workInProgress2.child = renderLanes2;
        workInProgress2.memoizedState = null;
        return renderLanes2;
      }
      function mountSuspensePrimaryChildren(workInProgress2, primaryChildren) {
        primaryChildren = mountWorkInProgressOffscreenFiber(
          { mode: "visible", children: primaryChildren },
          workInProgress2.mode
        );
        primaryChildren.return = workInProgress2;
        return workInProgress2.child = primaryChildren;
      }
      function mountWorkInProgressOffscreenFiber(offscreenProps, mode) {
        offscreenProps = createFiberImplClass(22, offscreenProps, null, mode);
        offscreenProps.lanes = 0;
        return offscreenProps;
      }
      function retrySuspenseComponentWithoutHydrating(current, workInProgress2, renderLanes2) {
        reconcileChildFibers(workInProgress2, current.child, null, renderLanes2);
        current = mountSuspensePrimaryChildren(
          workInProgress2,
          workInProgress2.pendingProps.children
        );
        current.flags |= 2;
        workInProgress2.memoizedState = null;
        return current;
      }
      function scheduleSuspenseWorkOnFiber(fiber, renderLanes2, propagationRoot) {
        fiber.lanes |= renderLanes2;
        var alternate = fiber.alternate;
        null !== alternate && (alternate.lanes |= renderLanes2);
        scheduleContextWorkOnParentPath(fiber.return, renderLanes2, propagationRoot);
      }
      function initSuspenseListRenderState(workInProgress2, isBackwards, tail, lastContentRow, tailMode, treeForkCount2) {
        var renderState = workInProgress2.memoizedState;
        null === renderState ? workInProgress2.memoizedState = {
          isBackwards,
          rendering: null,
          renderingStartTime: 0,
          last: lastContentRow,
          tail,
          tailMode,
          treeForkCount: treeForkCount2
        } : (renderState.isBackwards = isBackwards, renderState.rendering = null, renderState.renderingStartTime = 0, renderState.last = lastContentRow, renderState.tail = tail, renderState.tailMode = tailMode, renderState.treeForkCount = treeForkCount2);
      }
      function updateSuspenseListComponent(current, workInProgress2, renderLanes2) {
        var nextProps = workInProgress2.pendingProps, revealOrder = nextProps.revealOrder, tailMode = nextProps.tail;
        nextProps = nextProps.children;
        var suspenseContext = suspenseStackCursor.current, shouldForceFallback = 0 !== (suspenseContext & 2);
        shouldForceFallback ? (suspenseContext = suspenseContext & 1 | 2, workInProgress2.flags |= 128) : suspenseContext &= 1;
        push(suspenseStackCursor, suspenseContext);
        reconcileChildren(current, workInProgress2, nextProps, renderLanes2);
        nextProps = isHydrating ? treeForkCount : 0;
        if (!shouldForceFallback && null !== current && 0 !== (current.flags & 128))
          a: for (current = workInProgress2.child; null !== current; ) {
            if (13 === current.tag)
              null !== current.memoizedState && scheduleSuspenseWorkOnFiber(current, renderLanes2, workInProgress2);
            else if (19 === current.tag)
              scheduleSuspenseWorkOnFiber(current, renderLanes2, workInProgress2);
            else if (null !== current.child) {
              current.child.return = current;
              current = current.child;
              continue;
            }
            if (current === workInProgress2) break a;
            for (; null === current.sibling; ) {
              if (null === current.return || current.return === workInProgress2)
                break a;
              current = current.return;
            }
            current.sibling.return = current.return;
            current = current.sibling;
          }
        switch (revealOrder) {
          case "forwards":
            renderLanes2 = workInProgress2.child;
            for (revealOrder = null; null !== renderLanes2; )
              current = renderLanes2.alternate, null !== current && null === findFirstSuspended(current) && (revealOrder = renderLanes2), renderLanes2 = renderLanes2.sibling;
            renderLanes2 = revealOrder;
            null === renderLanes2 ? (revealOrder = workInProgress2.child, workInProgress2.child = null) : (revealOrder = renderLanes2.sibling, renderLanes2.sibling = null);
            initSuspenseListRenderState(
              workInProgress2,
              false,
              revealOrder,
              renderLanes2,
              tailMode,
              nextProps
            );
            break;
          case "backwards":
          case "unstable_legacy-backwards":
            renderLanes2 = null;
            revealOrder = workInProgress2.child;
            for (workInProgress2.child = null; null !== revealOrder; ) {
              current = revealOrder.alternate;
              if (null !== current && null === findFirstSuspended(current)) {
                workInProgress2.child = revealOrder;
                break;
              }
              current = revealOrder.sibling;
              revealOrder.sibling = renderLanes2;
              renderLanes2 = revealOrder;
              revealOrder = current;
            }
            initSuspenseListRenderState(
              workInProgress2,
              true,
              renderLanes2,
              null,
              tailMode,
              nextProps
            );
            break;
          case "together":
            initSuspenseListRenderState(
              workInProgress2,
              false,
              null,
              null,
              void 0,
              nextProps
            );
            break;
          default:
            workInProgress2.memoizedState = null;
        }
        return workInProgress2.child;
      }
      function bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2) {
        null !== current && (workInProgress2.dependencies = current.dependencies);
        workInProgressRootSkippedLanes |= workInProgress2.lanes;
        if (0 === (renderLanes2 & workInProgress2.childLanes))
          if (null !== current) {
            if (propagateParentContextChanges(
              current,
              workInProgress2,
              renderLanes2,
              false
            ), 0 === (renderLanes2 & workInProgress2.childLanes))
              return null;
          } else return null;
        if (null !== current && workInProgress2.child !== current.child)
          throw Error(formatProdErrorMessage(153));
        if (null !== workInProgress2.child) {
          current = workInProgress2.child;
          renderLanes2 = createWorkInProgress(current, current.pendingProps);
          workInProgress2.child = renderLanes2;
          for (renderLanes2.return = workInProgress2; null !== current.sibling; )
            current = current.sibling, renderLanes2 = renderLanes2.sibling = createWorkInProgress(current, current.pendingProps), renderLanes2.return = workInProgress2;
          renderLanes2.sibling = null;
        }
        return workInProgress2.child;
      }
      function checkScheduledUpdateOrContext(current, renderLanes2) {
        if (0 !== (current.lanes & renderLanes2)) return true;
        current = current.dependencies;
        return null !== current && checkIfContextChanged(current) ? true : false;
      }
      function attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress2, renderLanes2) {
        switch (workInProgress2.tag) {
          case 3:
            pushHostContainer(workInProgress2, workInProgress2.stateNode.containerInfo);
            pushProvider(workInProgress2, CacheContext, current.memoizedState.cache);
            resetHydrationState();
            break;
          case 27:
          case 5:
            pushHostContext(workInProgress2);
            break;
          case 4:
            pushHostContainer(workInProgress2, workInProgress2.stateNode.containerInfo);
            break;
          case 10:
            pushProvider(
              workInProgress2,
              workInProgress2.type,
              workInProgress2.memoizedProps.value
            );
            break;
          case 31:
            if (null !== workInProgress2.memoizedState)
              return workInProgress2.flags |= 128, pushDehydratedActivitySuspenseHandler(workInProgress2), null;
            break;
          case 13:
            var state$102 = workInProgress2.memoizedState;
            if (null !== state$102) {
              if (null !== state$102.dehydrated)
                return pushPrimaryTreeSuspenseHandler(workInProgress2), workInProgress2.flags |= 128, null;
              if (0 !== (renderLanes2 & workInProgress2.child.childLanes))
                return updateSuspenseComponent(current, workInProgress2, renderLanes2);
              pushPrimaryTreeSuspenseHandler(workInProgress2);
              current = bailoutOnAlreadyFinishedWork(
                current,
                workInProgress2,
                renderLanes2
              );
              return null !== current ? current.sibling : null;
            }
            pushPrimaryTreeSuspenseHandler(workInProgress2);
            break;
          case 19:
            var didSuspendBefore = 0 !== (current.flags & 128);
            state$102 = 0 !== (renderLanes2 & workInProgress2.childLanes);
            state$102 || (propagateParentContextChanges(
              current,
              workInProgress2,
              renderLanes2,
              false
            ), state$102 = 0 !== (renderLanes2 & workInProgress2.childLanes));
            if (didSuspendBefore) {
              if (state$102)
                return updateSuspenseListComponent(
                  current,
                  workInProgress2,
                  renderLanes2
                );
              workInProgress2.flags |= 128;
            }
            didSuspendBefore = workInProgress2.memoizedState;
            null !== didSuspendBefore && (didSuspendBefore.rendering = null, didSuspendBefore.tail = null, didSuspendBefore.lastEffect = null);
            push(suspenseStackCursor, suspenseStackCursor.current);
            if (state$102) break;
            else return null;
          case 22:
            return workInProgress2.lanes = 0, updateOffscreenComponent(
              current,
              workInProgress2,
              renderLanes2,
              workInProgress2.pendingProps
            );
          case 24:
            pushProvider(workInProgress2, CacheContext, current.memoizedState.cache);
        }
        return bailoutOnAlreadyFinishedWork(current, workInProgress2, renderLanes2);
      }
      function beginWork(current, workInProgress2, renderLanes2) {
        if (null !== current)
          if (current.memoizedProps !== workInProgress2.pendingProps)
            didReceiveUpdate = true;
          else {
            if (!checkScheduledUpdateOrContext(current, renderLanes2) && 0 === (workInProgress2.flags & 128))
              return didReceiveUpdate = false, attemptEarlyBailoutIfNoScheduledUpdate(
                current,
                workInProgress2,
                renderLanes2
              );
            didReceiveUpdate = 0 !== (current.flags & 131072) ? true : false;
          }
        else
          didReceiveUpdate = false, isHydrating && 0 !== (workInProgress2.flags & 1048576) && pushTreeId(workInProgress2, treeForkCount, workInProgress2.index);
        workInProgress2.lanes = 0;
        switch (workInProgress2.tag) {
          case 16:
            a: {
              var props = workInProgress2.pendingProps;
              current = resolveLazy(workInProgress2.elementType);
              workInProgress2.type = current;
              if ("function" === typeof current)
                shouldConstruct(current) ? (props = resolveClassComponentProps(current, props), workInProgress2.tag = 1, workInProgress2 = updateClassComponent(
                  null,
                  workInProgress2,
                  current,
                  props,
                  renderLanes2
                )) : (workInProgress2.tag = 0, workInProgress2 = updateFunctionComponent(
                  null,
                  workInProgress2,
                  current,
                  props,
                  renderLanes2
                ));
              else {
                if (void 0 !== current && null !== current) {
                  var $$typeof = current.$$typeof;
                  if ($$typeof === REACT_FORWARD_REF_TYPE) {
                    workInProgress2.tag = 11;
                    workInProgress2 = updateForwardRef(
                      null,
                      workInProgress2,
                      current,
                      props,
                      renderLanes2
                    );
                    break a;
                  } else if ($$typeof === REACT_MEMO_TYPE) {
                    workInProgress2.tag = 14;
                    workInProgress2 = updateMemoComponent(
                      null,
                      workInProgress2,
                      current,
                      props,
                      renderLanes2
                    );
                    break a;
                  }
                }
                workInProgress2 = getComponentNameFromType(current) || current;
                throw Error(formatProdErrorMessage(306, workInProgress2, ""));
              }
            }
            return workInProgress2;
          case 0:
            return updateFunctionComponent(
              current,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 1:
            return props = workInProgress2.type, $$typeof = resolveClassComponentProps(
              props,
              workInProgress2.pendingProps
            ), updateClassComponent(
              current,
              workInProgress2,
              props,
              $$typeof,
              renderLanes2
            );
          case 3:
            a: {
              pushHostContainer(
                workInProgress2,
                workInProgress2.stateNode.containerInfo
              );
              if (null === current) throw Error(formatProdErrorMessage(387));
              props = workInProgress2.pendingProps;
              var prevState = workInProgress2.memoizedState;
              $$typeof = prevState.element;
              cloneUpdateQueue(current, workInProgress2);
              processUpdateQueue(workInProgress2, props, null, renderLanes2);
              var nextState = workInProgress2.memoizedState;
              props = nextState.cache;
              pushProvider(workInProgress2, CacheContext, props);
              props !== prevState.cache && propagateContextChanges(
                workInProgress2,
                [CacheContext],
                renderLanes2,
                true
              );
              suspendIfUpdateReadFromEntangledAsyncAction();
              props = nextState.element;
              if (prevState.isDehydrated)
                if (prevState = {
                  element: props,
                  isDehydrated: false,
                  cache: nextState.cache
                }, workInProgress2.updateQueue.baseState = prevState, workInProgress2.memoizedState = prevState, workInProgress2.flags & 256) {
                  workInProgress2 = mountHostRootWithoutHydrating(
                    current,
                    workInProgress2,
                    props,
                    renderLanes2
                  );
                  break a;
                } else if (props !== $$typeof) {
                  $$typeof = createCapturedValueAtFiber(
                    Error(formatProdErrorMessage(424)),
                    workInProgress2
                  );
                  queueHydrationError($$typeof);
                  workInProgress2 = mountHostRootWithoutHydrating(
                    current,
                    workInProgress2,
                    props,
                    renderLanes2
                  );
                  break a;
                } else {
                  current = workInProgress2.stateNode.containerInfo;
                  switch (current.nodeType) {
                    case 9:
                      current = current.body;
                      break;
                    default:
                      current = "HTML" === current.nodeName ? current.ownerDocument.body : current;
                  }
                  nextHydratableInstance = getNextHydratable(current.firstChild);
                  hydrationParentFiber = workInProgress2;
                  isHydrating = true;
                  hydrationErrors = null;
                  rootOrSingletonContext = true;
                  renderLanes2 = mountChildFibers(
                    workInProgress2,
                    null,
                    props,
                    renderLanes2
                  );
                  for (workInProgress2.child = renderLanes2; renderLanes2; )
                    renderLanes2.flags = renderLanes2.flags & -3 | 4096, renderLanes2 = renderLanes2.sibling;
                }
              else {
                resetHydrationState();
                if (props === $$typeof) {
                  workInProgress2 = bailoutOnAlreadyFinishedWork(
                    current,
                    workInProgress2,
                    renderLanes2
                  );
                  break a;
                }
                reconcileChildren(current, workInProgress2, props, renderLanes2);
              }
              workInProgress2 = workInProgress2.child;
            }
            return workInProgress2;
          case 26:
            return markRef(current, workInProgress2), null === current ? (renderLanes2 = getResource(
              workInProgress2.type,
              null,
              workInProgress2.pendingProps,
              null
            )) ? workInProgress2.memoizedState = renderLanes2 : isHydrating || (renderLanes2 = workInProgress2.type, current = workInProgress2.pendingProps, props = getOwnerDocumentFromRootContainer(
              rootInstanceStackCursor.current
            ).createElement(renderLanes2), props[internalInstanceKey] = workInProgress2, props[internalPropsKey] = current, setInitialProperties(props, renderLanes2, current), markNodeAsHoistable(props), workInProgress2.stateNode = props) : workInProgress2.memoizedState = getResource(
              workInProgress2.type,
              current.memoizedProps,
              workInProgress2.pendingProps,
              current.memoizedState
            ), null;
          case 27:
            return pushHostContext(workInProgress2), null === current && isHydrating && (props = workInProgress2.stateNode = resolveSingletonInstance(
              workInProgress2.type,
              workInProgress2.pendingProps,
              rootInstanceStackCursor.current
            ), hydrationParentFiber = workInProgress2, rootOrSingletonContext = true, $$typeof = nextHydratableInstance, isSingletonScope(workInProgress2.type) ? (previousHydratableOnEnteringScopedSingleton = $$typeof, nextHydratableInstance = getNextHydratable(props.firstChild)) : nextHydratableInstance = $$typeof), reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), markRef(current, workInProgress2), null === current && (workInProgress2.flags |= 4194304), workInProgress2.child;
          case 5:
            if (null === current && isHydrating) {
              if ($$typeof = props = nextHydratableInstance)
                props = canHydrateInstance(
                  props,
                  workInProgress2.type,
                  workInProgress2.pendingProps,
                  rootOrSingletonContext
                ), null !== props ? (workInProgress2.stateNode = props, hydrationParentFiber = workInProgress2, nextHydratableInstance = getNextHydratable(props.firstChild), rootOrSingletonContext = false, $$typeof = true) : $$typeof = false;
              $$typeof || throwOnHydrationMismatch(workInProgress2);
            }
            pushHostContext(workInProgress2);
            $$typeof = workInProgress2.type;
            prevState = workInProgress2.pendingProps;
            nextState = null !== current ? current.memoizedProps : null;
            props = prevState.children;
            shouldSetTextContent($$typeof, prevState) ? props = null : null !== nextState && shouldSetTextContent($$typeof, nextState) && (workInProgress2.flags |= 32);
            null !== workInProgress2.memoizedState && ($$typeof = renderWithHooks(
              current,
              workInProgress2,
              TransitionAwareHostComponent,
              null,
              null,
              renderLanes2
            ), HostTransitionContext._currentValue = $$typeof);
            markRef(current, workInProgress2);
            reconcileChildren(current, workInProgress2, props, renderLanes2);
            return workInProgress2.child;
          case 6:
            if (null === current && isHydrating) {
              if (current = renderLanes2 = nextHydratableInstance)
                renderLanes2 = canHydrateTextInstance(
                  renderLanes2,
                  workInProgress2.pendingProps,
                  rootOrSingletonContext
                ), null !== renderLanes2 ? (workInProgress2.stateNode = renderLanes2, hydrationParentFiber = workInProgress2, nextHydratableInstance = null, current = true) : current = false;
              current || throwOnHydrationMismatch(workInProgress2);
            }
            return null;
          case 13:
            return updateSuspenseComponent(current, workInProgress2, renderLanes2);
          case 4:
            return pushHostContainer(
              workInProgress2,
              workInProgress2.stateNode.containerInfo
            ), props = workInProgress2.pendingProps, null === current ? workInProgress2.child = reconcileChildFibers(
              workInProgress2,
              null,
              props,
              renderLanes2
            ) : reconcileChildren(current, workInProgress2, props, renderLanes2), workInProgress2.child;
          case 11:
            return updateForwardRef(
              current,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 7:
            return reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps,
              renderLanes2
            ), workInProgress2.child;
          case 8:
            return reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), workInProgress2.child;
          case 12:
            return reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), workInProgress2.child;
          case 10:
            return props = workInProgress2.pendingProps, pushProvider(workInProgress2, workInProgress2.type, props.value), reconcileChildren(current, workInProgress2, props.children, renderLanes2), workInProgress2.child;
          case 9:
            return $$typeof = workInProgress2.type._context, props = workInProgress2.pendingProps.children, prepareToReadContext(workInProgress2), $$typeof = readContext($$typeof), props = props($$typeof), workInProgress2.flags |= 1, reconcileChildren(current, workInProgress2, props, renderLanes2), workInProgress2.child;
          case 14:
            return updateMemoComponent(
              current,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 15:
            return updateSimpleMemoComponent(
              current,
              workInProgress2,
              workInProgress2.type,
              workInProgress2.pendingProps,
              renderLanes2
            );
          case 19:
            return updateSuspenseListComponent(current, workInProgress2, renderLanes2);
          case 31:
            return updateActivityComponent(current, workInProgress2, renderLanes2);
          case 22:
            return updateOffscreenComponent(
              current,
              workInProgress2,
              renderLanes2,
              workInProgress2.pendingProps
            );
          case 24:
            return prepareToReadContext(workInProgress2), props = readContext(CacheContext), null === current ? ($$typeof = peekCacheFromPool(), null === $$typeof && ($$typeof = workInProgressRoot, prevState = createCache(), $$typeof.pooledCache = prevState, prevState.refCount++, null !== prevState && ($$typeof.pooledCacheLanes |= renderLanes2), $$typeof = prevState), workInProgress2.memoizedState = { parent: props, cache: $$typeof }, initializeUpdateQueue(workInProgress2), pushProvider(workInProgress2, CacheContext, $$typeof)) : (0 !== (current.lanes & renderLanes2) && (cloneUpdateQueue(current, workInProgress2), processUpdateQueue(workInProgress2, null, null, renderLanes2), suspendIfUpdateReadFromEntangledAsyncAction()), $$typeof = current.memoizedState, prevState = workInProgress2.memoizedState, $$typeof.parent !== props ? ($$typeof = { parent: props, cache: props }, workInProgress2.memoizedState = $$typeof, 0 === workInProgress2.lanes && (workInProgress2.memoizedState = workInProgress2.updateQueue.baseState = $$typeof), pushProvider(workInProgress2, CacheContext, props)) : (props = prevState.cache, pushProvider(workInProgress2, CacheContext, props), props !== $$typeof.cache && propagateContextChanges(
              workInProgress2,
              [CacheContext],
              renderLanes2,
              true
            ))), reconcileChildren(
              current,
              workInProgress2,
              workInProgress2.pendingProps.children,
              renderLanes2
            ), workInProgress2.child;
          case 29:
            throw workInProgress2.pendingProps;
        }
        throw Error(formatProdErrorMessage(156, workInProgress2.tag));
      }
      function markUpdate(workInProgress2) {
        workInProgress2.flags |= 4;
      }
      function preloadInstanceAndSuspendIfNeeded(workInProgress2, type, oldProps, newProps, renderLanes2) {
        if (type = 0 !== (workInProgress2.mode & 32)) type = false;
        if (type) {
          if (workInProgress2.flags |= 16777216, (renderLanes2 & 335544128) === renderLanes2)
            if (workInProgress2.stateNode.complete) workInProgress2.flags |= 8192;
            else if (shouldRemainOnPreviousScreen()) workInProgress2.flags |= 8192;
            else
              throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
        } else workInProgress2.flags &= -16777217;
      }
      function preloadResourceAndSuspendIfNeeded(workInProgress2, resource) {
        if ("stylesheet" !== resource.type || 0 !== (resource.state.loading & 4))
          workInProgress2.flags &= -16777217;
        else if (workInProgress2.flags |= 16777216, !preloadResource(resource))
          if (shouldRemainOnPreviousScreen()) workInProgress2.flags |= 8192;
          else
            throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
      }
      function scheduleRetryEffect(workInProgress2, retryQueue) {
        null !== retryQueue && (workInProgress2.flags |= 4);
        workInProgress2.flags & 16384 && (retryQueue = 22 !== workInProgress2.tag ? claimNextRetryLane() : 536870912, workInProgress2.lanes |= retryQueue, workInProgressSuspendedRetryLanes |= retryQueue);
      }
      function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
        if (!isHydrating)
          switch (renderState.tailMode) {
            case "hidden":
              hasRenderedATailFallback = renderState.tail;
              for (var lastTailNode = null; null !== hasRenderedATailFallback; )
                null !== hasRenderedATailFallback.alternate && (lastTailNode = hasRenderedATailFallback), hasRenderedATailFallback = hasRenderedATailFallback.sibling;
              null === lastTailNode ? renderState.tail = null : lastTailNode.sibling = null;
              break;
            case "collapsed":
              lastTailNode = renderState.tail;
              for (var lastTailNode$106 = null; null !== lastTailNode; )
                null !== lastTailNode.alternate && (lastTailNode$106 = lastTailNode), lastTailNode = lastTailNode.sibling;
              null === lastTailNode$106 ? hasRenderedATailFallback || null === renderState.tail ? renderState.tail = null : renderState.tail.sibling = null : lastTailNode$106.sibling = null;
          }
      }
      function bubbleProperties(completedWork) {
        var didBailout = null !== completedWork.alternate && completedWork.alternate.child === completedWork.child, newChildLanes = 0, subtreeFlags = 0;
        if (didBailout)
          for (var child$107 = completedWork.child; null !== child$107; )
            newChildLanes |= child$107.lanes | child$107.childLanes, subtreeFlags |= child$107.subtreeFlags & 65011712, subtreeFlags |= child$107.flags & 65011712, child$107.return = completedWork, child$107 = child$107.sibling;
        else
          for (child$107 = completedWork.child; null !== child$107; )
            newChildLanes |= child$107.lanes | child$107.childLanes, subtreeFlags |= child$107.subtreeFlags, subtreeFlags |= child$107.flags, child$107.return = completedWork, child$107 = child$107.sibling;
        completedWork.subtreeFlags |= subtreeFlags;
        completedWork.childLanes = newChildLanes;
        return didBailout;
      }
      function completeWork(current, workInProgress2, renderLanes2) {
        var newProps = workInProgress2.pendingProps;
        popTreeContext(workInProgress2);
        switch (workInProgress2.tag) {
          case 16:
          case 15:
          case 0:
          case 11:
          case 7:
          case 8:
          case 12:
          case 9:
          case 14:
            return bubbleProperties(workInProgress2), null;
          case 1:
            return bubbleProperties(workInProgress2), null;
          case 3:
            renderLanes2 = workInProgress2.stateNode;
            newProps = null;
            null !== current && (newProps = current.memoizedState.cache);
            workInProgress2.memoizedState.cache !== newProps && (workInProgress2.flags |= 2048);
            popProvider(CacheContext);
            popHostContainer();
            renderLanes2.pendingContext && (renderLanes2.context = renderLanes2.pendingContext, renderLanes2.pendingContext = null);
            if (null === current || null === current.child)
              popHydrationState(workInProgress2) ? markUpdate(workInProgress2) : null === current || current.memoizedState.isDehydrated && 0 === (workInProgress2.flags & 256) || (workInProgress2.flags |= 1024, upgradeHydrationErrorsToRecoverable());
            bubbleProperties(workInProgress2);
            return null;
          case 26:
            var type = workInProgress2.type, nextResource = workInProgress2.memoizedState;
            null === current ? (markUpdate(workInProgress2), null !== nextResource ? (bubbleProperties(workInProgress2), preloadResourceAndSuspendIfNeeded(workInProgress2, nextResource)) : (bubbleProperties(workInProgress2), preloadInstanceAndSuspendIfNeeded(
              workInProgress2,
              type,
              null,
              newProps,
              renderLanes2
            ))) : nextResource ? nextResource !== current.memoizedState ? (markUpdate(workInProgress2), bubbleProperties(workInProgress2), preloadResourceAndSuspendIfNeeded(workInProgress2, nextResource)) : (bubbleProperties(workInProgress2), workInProgress2.flags &= -16777217) : (current = current.memoizedProps, current !== newProps && markUpdate(workInProgress2), bubbleProperties(workInProgress2), preloadInstanceAndSuspendIfNeeded(
              workInProgress2,
              type,
              current,
              newProps,
              renderLanes2
            ));
            return null;
          case 27:
            popHostContext(workInProgress2);
            renderLanes2 = rootInstanceStackCursor.current;
            type = workInProgress2.type;
            if (null !== current && null != workInProgress2.stateNode)
              current.memoizedProps !== newProps && markUpdate(workInProgress2);
            else {
              if (!newProps) {
                if (null === workInProgress2.stateNode)
                  throw Error(formatProdErrorMessage(166));
                bubbleProperties(workInProgress2);
                return null;
              }
              current = contextStackCursor.current;
              popHydrationState(workInProgress2) ? prepareToHydrateHostInstance(workInProgress2, current) : (current = resolveSingletonInstance(type, newProps, renderLanes2), workInProgress2.stateNode = current, markUpdate(workInProgress2));
            }
            bubbleProperties(workInProgress2);
            return null;
          case 5:
            popHostContext(workInProgress2);
            type = workInProgress2.type;
            if (null !== current && null != workInProgress2.stateNode)
              current.memoizedProps !== newProps && markUpdate(workInProgress2);
            else {
              if (!newProps) {
                if (null === workInProgress2.stateNode)
                  throw Error(formatProdErrorMessage(166));
                bubbleProperties(workInProgress2);
                return null;
              }
              nextResource = contextStackCursor.current;
              if (popHydrationState(workInProgress2))
                prepareToHydrateHostInstance(workInProgress2, nextResource);
              else {
                var ownerDocument = getOwnerDocumentFromRootContainer(
                  rootInstanceStackCursor.current
                );
                switch (nextResource) {
                  case 1:
                    nextResource = ownerDocument.createElementNS(
                      "http://www.w3.org/2000/svg",
                      type
                    );
                    break;
                  case 2:
                    nextResource = ownerDocument.createElementNS(
                      "http://www.w3.org/1998/Math/MathML",
                      type
                    );
                    break;
                  default:
                    switch (type) {
                      case "svg":
                        nextResource = ownerDocument.createElementNS(
                          "http://www.w3.org/2000/svg",
                          type
                        );
                        break;
                      case "math":
                        nextResource = ownerDocument.createElementNS(
                          "http://www.w3.org/1998/Math/MathML",
                          type
                        );
                        break;
                      case "script":
                        nextResource = ownerDocument.createElement("div");
                        nextResource.innerHTML = "<script><\/script>";
                        nextResource = nextResource.removeChild(
                          nextResource.firstChild
                        );
                        break;
                      case "select":
                        nextResource = "string" === typeof newProps.is ? ownerDocument.createElement("select", {
                          is: newProps.is
                        }) : ownerDocument.createElement("select");
                        newProps.multiple ? nextResource.multiple = true : newProps.size && (nextResource.size = newProps.size);
                        break;
                      default:
                        nextResource = "string" === typeof newProps.is ? ownerDocument.createElement(type, { is: newProps.is }) : ownerDocument.createElement(type);
                    }
                }
                nextResource[internalInstanceKey] = workInProgress2;
                nextResource[internalPropsKey] = newProps;
                a: for (ownerDocument = workInProgress2.child; null !== ownerDocument; ) {
                  if (5 === ownerDocument.tag || 6 === ownerDocument.tag)
                    nextResource.appendChild(ownerDocument.stateNode);
                  else if (4 !== ownerDocument.tag && 27 !== ownerDocument.tag && null !== ownerDocument.child) {
                    ownerDocument.child.return = ownerDocument;
                    ownerDocument = ownerDocument.child;
                    continue;
                  }
                  if (ownerDocument === workInProgress2) break a;
                  for (; null === ownerDocument.sibling; ) {
                    if (null === ownerDocument.return || ownerDocument.return === workInProgress2)
                      break a;
                    ownerDocument = ownerDocument.return;
                  }
                  ownerDocument.sibling.return = ownerDocument.return;
                  ownerDocument = ownerDocument.sibling;
                }
                workInProgress2.stateNode = nextResource;
                a: switch (setInitialProperties(nextResource, type, newProps), type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    newProps = !!newProps.autoFocus;
                    break a;
                  case "img":
                    newProps = true;
                    break a;
                  default:
                    newProps = false;
                }
                newProps && markUpdate(workInProgress2);
              }
            }
            bubbleProperties(workInProgress2);
            preloadInstanceAndSuspendIfNeeded(
              workInProgress2,
              workInProgress2.type,
              null === current ? null : current.memoizedProps,
              workInProgress2.pendingProps,
              renderLanes2
            );
            return null;
          case 6:
            if (current && null != workInProgress2.stateNode)
              current.memoizedProps !== newProps && markUpdate(workInProgress2);
            else {
              if ("string" !== typeof newProps && null === workInProgress2.stateNode)
                throw Error(formatProdErrorMessage(166));
              current = rootInstanceStackCursor.current;
              if (popHydrationState(workInProgress2)) {
                current = workInProgress2.stateNode;
                renderLanes2 = workInProgress2.memoizedProps;
                newProps = null;
                type = hydrationParentFiber;
                if (null !== type)
                  switch (type.tag) {
                    case 27:
                    case 5:
                      newProps = type.memoizedProps;
                  }
                current[internalInstanceKey] = workInProgress2;
                current = current.nodeValue === renderLanes2 || null !== newProps && true === newProps.suppressHydrationWarning || checkForUnmatchedText(current.nodeValue, renderLanes2) ? true : false;
                current || throwOnHydrationMismatch(workInProgress2, true);
              } else
                current = getOwnerDocumentFromRootContainer(current).createTextNode(
                  newProps
                ), current[internalInstanceKey] = workInProgress2, workInProgress2.stateNode = current;
            }
            bubbleProperties(workInProgress2);
            return null;
          case 31:
            renderLanes2 = workInProgress2.memoizedState;
            if (null === current || null !== current.memoizedState) {
              newProps = popHydrationState(workInProgress2);
              if (null !== renderLanes2) {
                if (null === current) {
                  if (!newProps) throw Error(formatProdErrorMessage(318));
                  current = workInProgress2.memoizedState;
                  current = null !== current ? current.dehydrated : null;
                  if (!current) throw Error(formatProdErrorMessage(557));
                  current[internalInstanceKey] = workInProgress2;
                } else
                  resetHydrationState(), 0 === (workInProgress2.flags & 128) && (workInProgress2.memoizedState = null), workInProgress2.flags |= 4;
                bubbleProperties(workInProgress2);
                current = false;
              } else
                renderLanes2 = upgradeHydrationErrorsToRecoverable(), null !== current && null !== current.memoizedState && (current.memoizedState.hydrationErrors = renderLanes2), current = true;
              if (!current) {
                if (workInProgress2.flags & 256)
                  return popSuspenseHandler(workInProgress2), workInProgress2;
                popSuspenseHandler(workInProgress2);
                return null;
              }
              if (0 !== (workInProgress2.flags & 128))
                throw Error(formatProdErrorMessage(558));
            }
            bubbleProperties(workInProgress2);
            return null;
          case 13:
            newProps = workInProgress2.memoizedState;
            if (null === current || null !== current.memoizedState && null !== current.memoizedState.dehydrated) {
              type = popHydrationState(workInProgress2);
              if (null !== newProps && null !== newProps.dehydrated) {
                if (null === current) {
                  if (!type) throw Error(formatProdErrorMessage(318));
                  type = workInProgress2.memoizedState;
                  type = null !== type ? type.dehydrated : null;
                  if (!type) throw Error(formatProdErrorMessage(317));
                  type[internalInstanceKey] = workInProgress2;
                } else
                  resetHydrationState(), 0 === (workInProgress2.flags & 128) && (workInProgress2.memoizedState = null), workInProgress2.flags |= 4;
                bubbleProperties(workInProgress2);
                type = false;
              } else
                type = upgradeHydrationErrorsToRecoverable(), null !== current && null !== current.memoizedState && (current.memoizedState.hydrationErrors = type), type = true;
              if (!type) {
                if (workInProgress2.flags & 256)
                  return popSuspenseHandler(workInProgress2), workInProgress2;
                popSuspenseHandler(workInProgress2);
                return null;
              }
            }
            popSuspenseHandler(workInProgress2);
            if (0 !== (workInProgress2.flags & 128))
              return workInProgress2.lanes = renderLanes2, workInProgress2;
            renderLanes2 = null !== newProps;
            current = null !== current && null !== current.memoizedState;
            renderLanes2 && (newProps = workInProgress2.child, type = null, null !== newProps.alternate && null !== newProps.alternate.memoizedState && null !== newProps.alternate.memoizedState.cachePool && (type = newProps.alternate.memoizedState.cachePool.pool), nextResource = null, null !== newProps.memoizedState && null !== newProps.memoizedState.cachePool && (nextResource = newProps.memoizedState.cachePool.pool), nextResource !== type && (newProps.flags |= 2048));
            renderLanes2 !== current && renderLanes2 && (workInProgress2.child.flags |= 8192);
            scheduleRetryEffect(workInProgress2, workInProgress2.updateQueue);
            bubbleProperties(workInProgress2);
            return null;
          case 4:
            return popHostContainer(), null === current && listenToAllSupportedEvents(workInProgress2.stateNode.containerInfo), bubbleProperties(workInProgress2), null;
          case 10:
            return popProvider(workInProgress2.type), bubbleProperties(workInProgress2), null;
          case 19:
            pop(suspenseStackCursor);
            newProps = workInProgress2.memoizedState;
            if (null === newProps) return bubbleProperties(workInProgress2), null;
            type = 0 !== (workInProgress2.flags & 128);
            nextResource = newProps.rendering;
            if (null === nextResource)
              if (type) cutOffTailIfNeeded(newProps, false);
              else {
                if (0 !== workInProgressRootExitStatus || null !== current && 0 !== (current.flags & 128))
                  for (current = workInProgress2.child; null !== current; ) {
                    nextResource = findFirstSuspended(current);
                    if (null !== nextResource) {
                      workInProgress2.flags |= 128;
                      cutOffTailIfNeeded(newProps, false);
                      current = nextResource.updateQueue;
                      workInProgress2.updateQueue = current;
                      scheduleRetryEffect(workInProgress2, current);
                      workInProgress2.subtreeFlags = 0;
                      current = renderLanes2;
                      for (renderLanes2 = workInProgress2.child; null !== renderLanes2; )
                        resetWorkInProgress(renderLanes2, current), renderLanes2 = renderLanes2.sibling;
                      push(
                        suspenseStackCursor,
                        suspenseStackCursor.current & 1 | 2
                      );
                      isHydrating && pushTreeFork(workInProgress2, newProps.treeForkCount);
                      return workInProgress2.child;
                    }
                    current = current.sibling;
                  }
                null !== newProps.tail && now() > workInProgressRootRenderTargetTime && (workInProgress2.flags |= 128, type = true, cutOffTailIfNeeded(newProps, false), workInProgress2.lanes = 4194304);
              }
            else {
              if (!type)
                if (current = findFirstSuspended(nextResource), null !== current) {
                  if (workInProgress2.flags |= 128, type = true, current = current.updateQueue, workInProgress2.updateQueue = current, scheduleRetryEffect(workInProgress2, current), cutOffTailIfNeeded(newProps, true), null === newProps.tail && "hidden" === newProps.tailMode && !nextResource.alternate && !isHydrating)
                    return bubbleProperties(workInProgress2), null;
                } else
                  2 * now() - newProps.renderingStartTime > workInProgressRootRenderTargetTime && 536870912 !== renderLanes2 && (workInProgress2.flags |= 128, type = true, cutOffTailIfNeeded(newProps, false), workInProgress2.lanes = 4194304);
              newProps.isBackwards ? (nextResource.sibling = workInProgress2.child, workInProgress2.child = nextResource) : (current = newProps.last, null !== current ? current.sibling = nextResource : workInProgress2.child = nextResource, newProps.last = nextResource);
            }
            if (null !== newProps.tail)
              return current = newProps.tail, newProps.rendering = current, newProps.tail = current.sibling, newProps.renderingStartTime = now(), current.sibling = null, renderLanes2 = suspenseStackCursor.current, push(
                suspenseStackCursor,
                type ? renderLanes2 & 1 | 2 : renderLanes2 & 1
              ), isHydrating && pushTreeFork(workInProgress2, newProps.treeForkCount), current;
            bubbleProperties(workInProgress2);
            return null;
          case 22:
          case 23:
            return popSuspenseHandler(workInProgress2), popHiddenContext(), newProps = null !== workInProgress2.memoizedState, null !== current ? null !== current.memoizedState !== newProps && (workInProgress2.flags |= 8192) : newProps && (workInProgress2.flags |= 8192), newProps ? 0 !== (renderLanes2 & 536870912) && 0 === (workInProgress2.flags & 128) && (bubbleProperties(workInProgress2), workInProgress2.subtreeFlags & 6 && (workInProgress2.flags |= 8192)) : bubbleProperties(workInProgress2), renderLanes2 = workInProgress2.updateQueue, null !== renderLanes2 && scheduleRetryEffect(workInProgress2, renderLanes2.retryQueue), renderLanes2 = null, null !== current && null !== current.memoizedState && null !== current.memoizedState.cachePool && (renderLanes2 = current.memoizedState.cachePool.pool), newProps = null, null !== workInProgress2.memoizedState && null !== workInProgress2.memoizedState.cachePool && (newProps = workInProgress2.memoizedState.cachePool.pool), newProps !== renderLanes2 && (workInProgress2.flags |= 2048), null !== current && pop(resumedCache), null;
          case 24:
            return renderLanes2 = null, null !== current && (renderLanes2 = current.memoizedState.cache), workInProgress2.memoizedState.cache !== renderLanes2 && (workInProgress2.flags |= 2048), popProvider(CacheContext), bubbleProperties(workInProgress2), null;
          case 25:
            return null;
          case 30:
            return null;
        }
        throw Error(formatProdErrorMessage(156, workInProgress2.tag));
      }
      function unwindWork(current, workInProgress2) {
        popTreeContext(workInProgress2);
        switch (workInProgress2.tag) {
          case 1:
            return current = workInProgress2.flags, current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 3:
            return popProvider(CacheContext), popHostContainer(), current = workInProgress2.flags, 0 !== (current & 65536) && 0 === (current & 128) ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 26:
          case 27:
          case 5:
            return popHostContext(workInProgress2), null;
          case 31:
            if (null !== workInProgress2.memoizedState) {
              popSuspenseHandler(workInProgress2);
              if (null === workInProgress2.alternate)
                throw Error(formatProdErrorMessage(340));
              resetHydrationState();
            }
            current = workInProgress2.flags;
            return current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 13:
            popSuspenseHandler(workInProgress2);
            current = workInProgress2.memoizedState;
            if (null !== current && null !== current.dehydrated) {
              if (null === workInProgress2.alternate)
                throw Error(formatProdErrorMessage(340));
              resetHydrationState();
            }
            current = workInProgress2.flags;
            return current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 19:
            return pop(suspenseStackCursor), null;
          case 4:
            return popHostContainer(), null;
          case 10:
            return popProvider(workInProgress2.type), null;
          case 22:
          case 23:
            return popSuspenseHandler(workInProgress2), popHiddenContext(), null !== current && pop(resumedCache), current = workInProgress2.flags, current & 65536 ? (workInProgress2.flags = current & -65537 | 128, workInProgress2) : null;
          case 24:
            return popProvider(CacheContext), null;
          case 25:
            return null;
          default:
            return null;
        }
      }
      function unwindInterruptedWork(current, interruptedWork) {
        popTreeContext(interruptedWork);
        switch (interruptedWork.tag) {
          case 3:
            popProvider(CacheContext);
            popHostContainer();
            break;
          case 26:
          case 27:
          case 5:
            popHostContext(interruptedWork);
            break;
          case 4:
            popHostContainer();
            break;
          case 31:
            null !== interruptedWork.memoizedState && popSuspenseHandler(interruptedWork);
            break;
          case 13:
            popSuspenseHandler(interruptedWork);
            break;
          case 19:
            pop(suspenseStackCursor);
            break;
          case 10:
            popProvider(interruptedWork.type);
            break;
          case 22:
          case 23:
            popSuspenseHandler(interruptedWork);
            popHiddenContext();
            null !== current && pop(resumedCache);
            break;
          case 24:
            popProvider(CacheContext);
        }
      }
      function commitHookEffectListMount(flags, finishedWork) {
        try {
          var updateQueue = finishedWork.updateQueue, lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
          if (null !== lastEffect) {
            var firstEffect = lastEffect.next;
            updateQueue = firstEffect;
            do {
              if ((updateQueue.tag & flags) === flags) {
                lastEffect = void 0;
                var create = updateQueue.create, inst = updateQueue.inst;
                lastEffect = create();
                inst.destroy = lastEffect;
              }
              updateQueue = updateQueue.next;
            } while (updateQueue !== firstEffect);
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function commitHookEffectListUnmount(flags, finishedWork, nearestMountedAncestor$jscomp$0) {
        try {
          var updateQueue = finishedWork.updateQueue, lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
          if (null !== lastEffect) {
            var firstEffect = lastEffect.next;
            updateQueue = firstEffect;
            do {
              if ((updateQueue.tag & flags) === flags) {
                var inst = updateQueue.inst, destroy = inst.destroy;
                if (void 0 !== destroy) {
                  inst.destroy = void 0;
                  lastEffect = finishedWork;
                  var nearestMountedAncestor = nearestMountedAncestor$jscomp$0, destroy_ = destroy;
                  try {
                    destroy_();
                  } catch (error) {
                    captureCommitPhaseError(
                      lastEffect,
                      nearestMountedAncestor,
                      error
                    );
                  }
                }
              }
              updateQueue = updateQueue.next;
            } while (updateQueue !== firstEffect);
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function commitClassCallbacks(finishedWork) {
        var updateQueue = finishedWork.updateQueue;
        if (null !== updateQueue) {
          var instance = finishedWork.stateNode;
          try {
            commitCallbacks(updateQueue, instance);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      }
      function safelyCallComponentWillUnmount(current, nearestMountedAncestor, instance) {
        instance.props = resolveClassComponentProps(
          current.type,
          current.memoizedProps
        );
        instance.state = current.memoizedState;
        try {
          instance.componentWillUnmount();
        } catch (error) {
          captureCommitPhaseError(current, nearestMountedAncestor, error);
        }
      }
      function safelyAttachRef(current, nearestMountedAncestor) {
        try {
          var ref = current.ref;
          if (null !== ref) {
            switch (current.tag) {
              case 26:
              case 27:
              case 5:
                var instanceToUse = current.stateNode;
                break;
              case 30:
                instanceToUse = current.stateNode;
                break;
              default:
                instanceToUse = current.stateNode;
            }
            "function" === typeof ref ? current.refCleanup = ref(instanceToUse) : ref.current = instanceToUse;
          }
        } catch (error) {
          captureCommitPhaseError(current, nearestMountedAncestor, error);
        }
      }
      function safelyDetachRef(current, nearestMountedAncestor) {
        var ref = current.ref, refCleanup = current.refCleanup;
        if (null !== ref)
          if ("function" === typeof refCleanup)
            try {
              refCleanup();
            } catch (error) {
              captureCommitPhaseError(current, nearestMountedAncestor, error);
            } finally {
              current.refCleanup = null, current = current.alternate, null != current && (current.refCleanup = null);
            }
          else if ("function" === typeof ref)
            try {
              ref(null);
            } catch (error$140) {
              captureCommitPhaseError(current, nearestMountedAncestor, error$140);
            }
          else ref.current = null;
      }
      function commitHostMount(finishedWork) {
        var type = finishedWork.type, props = finishedWork.memoizedProps, instance = finishedWork.stateNode;
        try {
          a: switch (type) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              props.autoFocus && instance.focus();
              break a;
            case "img":
              props.src ? instance.src = props.src : props.srcSet && (instance.srcset = props.srcSet);
          }
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function commitHostUpdate(finishedWork, newProps, oldProps) {
        try {
          var domElement = finishedWork.stateNode;
          updateProperties(domElement, finishedWork.type, oldProps, newProps);
          domElement[internalPropsKey] = newProps;
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      function isHostParent(fiber) {
        return 5 === fiber.tag || 3 === fiber.tag || 26 === fiber.tag || 27 === fiber.tag && isSingletonScope(fiber.type) || 4 === fiber.tag;
      }
      function getHostSibling(fiber) {
        a: for (; ; ) {
          for (; null === fiber.sibling; ) {
            if (null === fiber.return || isHostParent(fiber.return)) return null;
            fiber = fiber.return;
          }
          fiber.sibling.return = fiber.return;
          for (fiber = fiber.sibling; 5 !== fiber.tag && 6 !== fiber.tag && 18 !== fiber.tag; ) {
            if (27 === fiber.tag && isSingletonScope(fiber.type)) continue a;
            if (fiber.flags & 2) continue a;
            if (null === fiber.child || 4 === fiber.tag) continue a;
            else fiber.child.return = fiber, fiber = fiber.child;
          }
          if (!(fiber.flags & 2)) return fiber.stateNode;
        }
      }
      function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
        var tag = node.tag;
        if (5 === tag || 6 === tag)
          node = node.stateNode, before ? (9 === parent.nodeType ? parent.body : "HTML" === parent.nodeName ? parent.ownerDocument.body : parent).insertBefore(node, before) : (before = 9 === parent.nodeType ? parent.body : "HTML" === parent.nodeName ? parent.ownerDocument.body : parent, before.appendChild(node), parent = parent._reactRootContainer, null !== parent && void 0 !== parent || null !== before.onclick || (before.onclick = noop$1));
        else if (4 !== tag && (27 === tag && isSingletonScope(node.type) && (parent = node.stateNode, before = null), node = node.child, null !== node))
          for (insertOrAppendPlacementNodeIntoContainer(node, before, parent), node = node.sibling; null !== node; )
            insertOrAppendPlacementNodeIntoContainer(node, before, parent), node = node.sibling;
      }
      function insertOrAppendPlacementNode(node, before, parent) {
        var tag = node.tag;
        if (5 === tag || 6 === tag)
          node = node.stateNode, before ? parent.insertBefore(node, before) : parent.appendChild(node);
        else if (4 !== tag && (27 === tag && isSingletonScope(node.type) && (parent = node.stateNode), node = node.child, null !== node))
          for (insertOrAppendPlacementNode(node, before, parent), node = node.sibling; null !== node; )
            insertOrAppendPlacementNode(node, before, parent), node = node.sibling;
      }
      function commitHostSingletonAcquisition(finishedWork) {
        var singleton = finishedWork.stateNode, props = finishedWork.memoizedProps;
        try {
          for (var type = finishedWork.type, attributes = singleton.attributes; attributes.length; )
            singleton.removeAttributeNode(attributes[0]);
          setInitialProperties(singleton, type, props);
          singleton[internalInstanceKey] = finishedWork;
          singleton[internalPropsKey] = props;
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      var offscreenSubtreeIsHidden = false;
      var offscreenSubtreeWasHidden = false;
      var needsFormReset = false;
      var PossiblyWeakSet = "function" === typeof WeakSet ? WeakSet : Set;
      var nextEffect = null;
      function commitBeforeMutationEffects(root2, firstChild) {
        root2 = root2.containerInfo;
        eventsEnabled = _enabled;
        root2 = getActiveElementDeep(root2);
        if (hasSelectionCapabilities(root2)) {
          if ("selectionStart" in root2)
            var JSCompiler_temp = {
              start: root2.selectionStart,
              end: root2.selectionEnd
            };
          else
            a: {
              JSCompiler_temp = (JSCompiler_temp = root2.ownerDocument) && JSCompiler_temp.defaultView || window;
              var selection = JSCompiler_temp.getSelection && JSCompiler_temp.getSelection();
              if (selection && 0 !== selection.rangeCount) {
                JSCompiler_temp = selection.anchorNode;
                var anchorOffset = selection.anchorOffset, focusNode = selection.focusNode;
                selection = selection.focusOffset;
                try {
                  JSCompiler_temp.nodeType, focusNode.nodeType;
                } catch (e$20) {
                  JSCompiler_temp = null;
                  break a;
                }
                var length = 0, start = -1, end = -1, indexWithinAnchor = 0, indexWithinFocus = 0, node = root2, parentNode = null;
                b: for (; ; ) {
                  for (var next; ; ) {
                    node !== JSCompiler_temp || 0 !== anchorOffset && 3 !== node.nodeType || (start = length + anchorOffset);
                    node !== focusNode || 0 !== selection && 3 !== node.nodeType || (end = length + selection);
                    3 === node.nodeType && (length += node.nodeValue.length);
                    if (null === (next = node.firstChild)) break;
                    parentNode = node;
                    node = next;
                  }
                  for (; ; ) {
                    if (node === root2) break b;
                    parentNode === JSCompiler_temp && ++indexWithinAnchor === anchorOffset && (start = length);
                    parentNode === focusNode && ++indexWithinFocus === selection && (end = length);
                    if (null !== (next = node.nextSibling)) break;
                    node = parentNode;
                    parentNode = node.parentNode;
                  }
                  node = next;
                }
                JSCompiler_temp = -1 === start || -1 === end ? null : { start, end };
              } else JSCompiler_temp = null;
            }
          JSCompiler_temp = JSCompiler_temp || { start: 0, end: 0 };
        } else JSCompiler_temp = null;
        selectionInformation = { focusedElem: root2, selectionRange: JSCompiler_temp };
        _enabled = false;
        for (nextEffect = firstChild; null !== nextEffect; )
          if (firstChild = nextEffect, root2 = firstChild.child, 0 !== (firstChild.subtreeFlags & 1028) && null !== root2)
            root2.return = firstChild, nextEffect = root2;
          else
            for (; null !== nextEffect; ) {
              firstChild = nextEffect;
              focusNode = firstChild.alternate;
              root2 = firstChild.flags;
              switch (firstChild.tag) {
                case 0:
                  if (0 !== (root2 & 4) && (root2 = firstChild.updateQueue, root2 = null !== root2 ? root2.events : null, null !== root2))
                    for (JSCompiler_temp = 0; JSCompiler_temp < root2.length; JSCompiler_temp++)
                      anchorOffset = root2[JSCompiler_temp], anchorOffset.ref.impl = anchorOffset.nextImpl;
                  break;
                case 11:
                case 15:
                  break;
                case 1:
                  if (0 !== (root2 & 1024) && null !== focusNode) {
                    root2 = void 0;
                    JSCompiler_temp = firstChild;
                    anchorOffset = focusNode.memoizedProps;
                    focusNode = focusNode.memoizedState;
                    selection = JSCompiler_temp.stateNode;
                    try {
                      var resolvedPrevProps = resolveClassComponentProps(
                        JSCompiler_temp.type,
                        anchorOffset
                      );
                      root2 = selection.getSnapshotBeforeUpdate(
                        resolvedPrevProps,
                        focusNode
                      );
                      selection.__reactInternalSnapshotBeforeUpdate = root2;
                    } catch (error) {
                      captureCommitPhaseError(
                        JSCompiler_temp,
                        JSCompiler_temp.return,
                        error
                      );
                    }
                  }
                  break;
                case 3:
                  if (0 !== (root2 & 1024)) {
                    if (root2 = firstChild.stateNode.containerInfo, JSCompiler_temp = root2.nodeType, 9 === JSCompiler_temp)
                      clearContainerSparingly(root2);
                    else if (1 === JSCompiler_temp)
                      switch (root2.nodeName) {
                        case "HEAD":
                        case "HTML":
                        case "BODY":
                          clearContainerSparingly(root2);
                          break;
                        default:
                          root2.textContent = "";
                      }
                  }
                  break;
                case 5:
                case 26:
                case 27:
                case 6:
                case 4:
                case 17:
                  break;
                default:
                  if (0 !== (root2 & 1024)) throw Error(formatProdErrorMessage(163));
              }
              root2 = firstChild.sibling;
              if (null !== root2) {
                root2.return = firstChild.return;
                nextEffect = root2;
                break;
              }
              nextEffect = firstChild.return;
            }
      }
      function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
        var flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            flags & 4 && commitHookEffectListMount(5, finishedWork);
            break;
          case 1:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            if (flags & 4)
              if (finishedRoot = finishedWork.stateNode, null === current)
                try {
                  finishedRoot.componentDidMount();
                } catch (error) {
                  captureCommitPhaseError(finishedWork, finishedWork.return, error);
                }
              else {
                var prevProps = resolveClassComponentProps(
                  finishedWork.type,
                  current.memoizedProps
                );
                current = current.memoizedState;
                try {
                  finishedRoot.componentDidUpdate(
                    prevProps,
                    current,
                    finishedRoot.__reactInternalSnapshotBeforeUpdate
                  );
                } catch (error$139) {
                  captureCommitPhaseError(
                    finishedWork,
                    finishedWork.return,
                    error$139
                  );
                }
              }
            flags & 64 && commitClassCallbacks(finishedWork);
            flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 3:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            if (flags & 64 && (finishedRoot = finishedWork.updateQueue, null !== finishedRoot)) {
              current = null;
              if (null !== finishedWork.child)
                switch (finishedWork.child.tag) {
                  case 27:
                  case 5:
                    current = finishedWork.child.stateNode;
                    break;
                  case 1:
                    current = finishedWork.child.stateNode;
                }
              try {
                commitCallbacks(finishedRoot, current);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            break;
          case 27:
            null === current && flags & 4 && commitHostSingletonAcquisition(finishedWork);
          case 26:
          case 5:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            null === current && flags & 4 && commitHostMount(finishedWork);
            flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
            break;
          case 12:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            break;
          case 31:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
            break;
          case 13:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
            flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
            flags & 64 && (finishedRoot = finishedWork.memoizedState, null !== finishedRoot && (finishedRoot = finishedRoot.dehydrated, null !== finishedRoot && (finishedWork = retryDehydratedSuspenseBoundary.bind(
              null,
              finishedWork
            ), registerSuspenseInstanceRetry(finishedRoot, finishedWork))));
            break;
          case 22:
            flags = null !== finishedWork.memoizedState || offscreenSubtreeIsHidden;
            if (!flags) {
              current = null !== current && null !== current.memoizedState || offscreenSubtreeWasHidden;
              prevProps = offscreenSubtreeIsHidden;
              var prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
              offscreenSubtreeIsHidden = flags;
              (offscreenSubtreeWasHidden = current) && !prevOffscreenSubtreeWasHidden ? recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                0 !== (finishedWork.subtreeFlags & 8772)
              ) : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
              offscreenSubtreeIsHidden = prevProps;
              offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
            }
            break;
          case 30:
            break;
          default:
            recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
        }
      }
      function detachFiberAfterEffects(fiber) {
        var alternate = fiber.alternate;
        null !== alternate && (fiber.alternate = null, detachFiberAfterEffects(alternate));
        fiber.child = null;
        fiber.deletions = null;
        fiber.sibling = null;
        5 === fiber.tag && (alternate = fiber.stateNode, null !== alternate && detachDeletedInstance(alternate));
        fiber.stateNode = null;
        fiber.return = null;
        fiber.dependencies = null;
        fiber.memoizedProps = null;
        fiber.memoizedState = null;
        fiber.pendingProps = null;
        fiber.stateNode = null;
        fiber.updateQueue = null;
      }
      var hostParent = null;
      var hostParentIsContainer = false;
      function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
        for (parent = parent.child; null !== parent; )
          commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, parent), parent = parent.sibling;
      }
      function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
        if (injectedHook && "function" === typeof injectedHook.onCommitFiberUnmount)
          try {
            injectedHook.onCommitFiberUnmount(rendererID, deletedFiber);
          } catch (err) {
          }
        switch (deletedFiber.tag) {
          case 26:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            deletedFiber.memoizedState ? deletedFiber.memoizedState.count-- : deletedFiber.stateNode && (deletedFiber = deletedFiber.stateNode, deletedFiber.parentNode.removeChild(deletedFiber));
            break;
          case 27:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
            var prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer;
            isSingletonScope(deletedFiber.type) && (hostParent = deletedFiber.stateNode, hostParentIsContainer = false);
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            releaseSingletonInstance(deletedFiber.stateNode);
            hostParent = prevHostParent;
            hostParentIsContainer = prevHostParentIsContainer;
            break;
          case 5:
            offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
          case 6:
            prevHostParent = hostParent;
            prevHostParentIsContainer = hostParentIsContainer;
            hostParent = null;
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            hostParent = prevHostParent;
            hostParentIsContainer = prevHostParentIsContainer;
            if (null !== hostParent)
              if (hostParentIsContainer)
                try {
                  (9 === hostParent.nodeType ? hostParent.body : "HTML" === hostParent.nodeName ? hostParent.ownerDocument.body : hostParent).removeChild(deletedFiber.stateNode);
                } catch (error) {
                  captureCommitPhaseError(
                    deletedFiber,
                    nearestMountedAncestor,
                    error
                  );
                }
              else
                try {
                  hostParent.removeChild(deletedFiber.stateNode);
                } catch (error) {
                  captureCommitPhaseError(
                    deletedFiber,
                    nearestMountedAncestor,
                    error
                  );
                }
            break;
          case 18:
            null !== hostParent && (hostParentIsContainer ? (finishedRoot = hostParent, clearHydrationBoundary(
              9 === finishedRoot.nodeType ? finishedRoot.body : "HTML" === finishedRoot.nodeName ? finishedRoot.ownerDocument.body : finishedRoot,
              deletedFiber.stateNode
            ), retryIfBlockedOn(finishedRoot)) : clearHydrationBoundary(hostParent, deletedFiber.stateNode));
            break;
          case 4:
            prevHostParent = hostParent;
            prevHostParentIsContainer = hostParentIsContainer;
            hostParent = deletedFiber.stateNode.containerInfo;
            hostParentIsContainer = true;
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            hostParent = prevHostParent;
            hostParentIsContainer = prevHostParentIsContainer;
            break;
          case 0:
          case 11:
          case 14:
          case 15:
            commitHookEffectListUnmount(2, deletedFiber, nearestMountedAncestor);
            offscreenSubtreeWasHidden || commitHookEffectListUnmount(4, deletedFiber, nearestMountedAncestor);
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 1:
            offscreenSubtreeWasHidden || (safelyDetachRef(deletedFiber, nearestMountedAncestor), prevHostParent = deletedFiber.stateNode, "function" === typeof prevHostParent.componentWillUnmount && safelyCallComponentWillUnmount(
              deletedFiber,
              nearestMountedAncestor,
              prevHostParent
            ));
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 21:
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            break;
          case 22:
            offscreenSubtreeWasHidden = (prevHostParent = offscreenSubtreeWasHidden) || null !== deletedFiber.memoizedState;
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
            offscreenSubtreeWasHidden = prevHostParent;
            break;
          default:
            recursivelyTraverseDeletionEffects(
              finishedRoot,
              nearestMountedAncestor,
              deletedFiber
            );
        }
      }
      function commitActivityHydrationCallbacks(finishedRoot, finishedWork) {
        if (null === finishedWork.memoizedState && (finishedRoot = finishedWork.alternate, null !== finishedRoot && (finishedRoot = finishedRoot.memoizedState, null !== finishedRoot))) {
          finishedRoot = finishedRoot.dehydrated;
          try {
            retryIfBlockedOn(finishedRoot);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        }
      }
      function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
        if (null === finishedWork.memoizedState && (finishedRoot = finishedWork.alternate, null !== finishedRoot && (finishedRoot = finishedRoot.memoizedState, null !== finishedRoot && (finishedRoot = finishedRoot.dehydrated, null !== finishedRoot))))
          try {
            retryIfBlockedOn(finishedRoot);
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
      }
      function getRetryCache(finishedWork) {
        switch (finishedWork.tag) {
          case 31:
          case 13:
          case 19:
            var retryCache = finishedWork.stateNode;
            null === retryCache && (retryCache = finishedWork.stateNode = new PossiblyWeakSet());
            return retryCache;
          case 22:
            return finishedWork = finishedWork.stateNode, retryCache = finishedWork._retryCache, null === retryCache && (retryCache = finishedWork._retryCache = new PossiblyWeakSet()), retryCache;
          default:
            throw Error(formatProdErrorMessage(435, finishedWork.tag));
        }
      }
      function attachSuspenseRetryListeners(finishedWork, wakeables) {
        var retryCache = getRetryCache(finishedWork);
        wakeables.forEach(function(wakeable) {
          if (!retryCache.has(wakeable)) {
            retryCache.add(wakeable);
            var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
            wakeable.then(retry, retry);
          }
        });
      }
      function recursivelyTraverseMutationEffects(root$jscomp$0, parentFiber) {
        var deletions = parentFiber.deletions;
        if (null !== deletions)
          for (var i2 = 0; i2 < deletions.length; i2++) {
            var childToDelete = deletions[i2], root2 = root$jscomp$0, returnFiber = parentFiber, parent = returnFiber;
            a: for (; null !== parent; ) {
              switch (parent.tag) {
                case 27:
                  if (isSingletonScope(parent.type)) {
                    hostParent = parent.stateNode;
                    hostParentIsContainer = false;
                    break a;
                  }
                  break;
                case 5:
                  hostParent = parent.stateNode;
                  hostParentIsContainer = false;
                  break a;
                case 3:
                case 4:
                  hostParent = parent.stateNode.containerInfo;
                  hostParentIsContainer = true;
                  break a;
              }
              parent = parent.return;
            }
            if (null === hostParent) throw Error(formatProdErrorMessage(160));
            commitDeletionEffectsOnFiber(root2, returnFiber, childToDelete);
            hostParent = null;
            hostParentIsContainer = false;
            root2 = childToDelete.alternate;
            null !== root2 && (root2.return = null);
            childToDelete.return = null;
          }
        if (parentFiber.subtreeFlags & 13886)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            commitMutationEffectsOnFiber(parentFiber, root$jscomp$0), parentFiber = parentFiber.sibling;
      }
      var currentHoistableRoot = null;
      function commitMutationEffectsOnFiber(finishedWork, root2) {
        var current = finishedWork.alternate, flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 4 && (commitHookEffectListUnmount(3, finishedWork, finishedWork.return), commitHookEffectListMount(3, finishedWork), commitHookEffectListUnmount(5, finishedWork, finishedWork.return));
            break;
          case 1:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
            flags & 64 && offscreenSubtreeIsHidden && (finishedWork = finishedWork.updateQueue, null !== finishedWork && (flags = finishedWork.callbacks, null !== flags && (current = finishedWork.shared.hiddenCallbacks, finishedWork.shared.hiddenCallbacks = null === current ? flags : current.concat(flags))));
            break;
          case 26:
            var hoistableRoot = currentHoistableRoot;
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
            if (flags & 4) {
              var currentResource = null !== current ? current.memoizedState : null;
              flags = finishedWork.memoizedState;
              if (null === current)
                if (null === flags)
                  if (null === finishedWork.stateNode) {
                    a: {
                      flags = finishedWork.type;
                      current = finishedWork.memoizedProps;
                      hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot;
                      b: switch (flags) {
                        case "title":
                          currentResource = hoistableRoot.getElementsByTagName("title")[0];
                          if (!currentResource || currentResource[internalHoistableMarker] || currentResource[internalInstanceKey] || "http://www.w3.org/2000/svg" === currentResource.namespaceURI || currentResource.hasAttribute("itemprop"))
                            currentResource = hoistableRoot.createElement(flags), hoistableRoot.head.insertBefore(
                              currentResource,
                              hoistableRoot.querySelector("head > title")
                            );
                          setInitialProperties(currentResource, flags, current);
                          currentResource[internalInstanceKey] = finishedWork;
                          markNodeAsHoistable(currentResource);
                          flags = currentResource;
                          break a;
                        case "link":
                          var maybeNodes = getHydratableHoistableCache(
                            "link",
                            "href",
                            hoistableRoot
                          ).get(flags + (current.href || ""));
                          if (maybeNodes) {
                            for (var i2 = 0; i2 < maybeNodes.length; i2++)
                              if (currentResource = maybeNodes[i2], currentResource.getAttribute("href") === (null == current.href || "" === current.href ? null : current.href) && currentResource.getAttribute("rel") === (null == current.rel ? null : current.rel) && currentResource.getAttribute("title") === (null == current.title ? null : current.title) && currentResource.getAttribute("crossorigin") === (null == current.crossOrigin ? null : current.crossOrigin)) {
                                maybeNodes.splice(i2, 1);
                                break b;
                              }
                          }
                          currentResource = hoistableRoot.createElement(flags);
                          setInitialProperties(currentResource, flags, current);
                          hoistableRoot.head.appendChild(currentResource);
                          break;
                        case "meta":
                          if (maybeNodes = getHydratableHoistableCache(
                            "meta",
                            "content",
                            hoistableRoot
                          ).get(flags + (current.content || ""))) {
                            for (i2 = 0; i2 < maybeNodes.length; i2++)
                              if (currentResource = maybeNodes[i2], currentResource.getAttribute("content") === (null == current.content ? null : "" + current.content) && currentResource.getAttribute("name") === (null == current.name ? null : current.name) && currentResource.getAttribute("property") === (null == current.property ? null : current.property) && currentResource.getAttribute("http-equiv") === (null == current.httpEquiv ? null : current.httpEquiv) && currentResource.getAttribute("charset") === (null == current.charSet ? null : current.charSet)) {
                                maybeNodes.splice(i2, 1);
                                break b;
                              }
                          }
                          currentResource = hoistableRoot.createElement(flags);
                          setInitialProperties(currentResource, flags, current);
                          hoistableRoot.head.appendChild(currentResource);
                          break;
                        default:
                          throw Error(formatProdErrorMessage(468, flags));
                      }
                      currentResource[internalInstanceKey] = finishedWork;
                      markNodeAsHoistable(currentResource);
                      flags = currentResource;
                    }
                    finishedWork.stateNode = flags;
                  } else
                    mountHoistable(
                      hoistableRoot,
                      finishedWork.type,
                      finishedWork.stateNode
                    );
                else
                  finishedWork.stateNode = acquireResource(
                    hoistableRoot,
                    flags,
                    finishedWork.memoizedProps
                  );
              else
                currentResource !== flags ? (null === currentResource ? null !== current.stateNode && (current = current.stateNode, current.parentNode.removeChild(current)) : currentResource.count--, null === flags ? mountHoistable(
                  hoistableRoot,
                  finishedWork.type,
                  finishedWork.stateNode
                ) : acquireResource(
                  hoistableRoot,
                  flags,
                  finishedWork.memoizedProps
                )) : null === flags && null !== finishedWork.stateNode && commitHostUpdate(
                  finishedWork,
                  finishedWork.memoizedProps,
                  current.memoizedProps
                );
            }
            break;
          case 27:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
            null !== current && flags & 4 && commitHostUpdate(
              finishedWork,
              finishedWork.memoizedProps,
              current.memoizedProps
            );
            break;
          case 5:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
            if (finishedWork.flags & 32) {
              hoistableRoot = finishedWork.stateNode;
              try {
                setTextContent(hoistableRoot, "");
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            flags & 4 && null != finishedWork.stateNode && (hoistableRoot = finishedWork.memoizedProps, commitHostUpdate(
              finishedWork,
              hoistableRoot,
              null !== current ? current.memoizedProps : hoistableRoot
            ));
            flags & 1024 && (needsFormReset = true);
            break;
          case 6:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            if (flags & 4) {
              if (null === finishedWork.stateNode)
                throw Error(formatProdErrorMessage(162));
              flags = finishedWork.memoizedProps;
              current = finishedWork.stateNode;
              try {
                current.nodeValue = flags;
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            }
            break;
          case 3:
            tagCaches = null;
            hoistableRoot = currentHoistableRoot;
            currentHoistableRoot = getHoistableRoot(root2.containerInfo);
            recursivelyTraverseMutationEffects(root2, finishedWork);
            currentHoistableRoot = hoistableRoot;
            commitReconciliationEffects(finishedWork);
            if (flags & 4 && null !== current && current.memoizedState.isDehydrated)
              try {
                retryIfBlockedOn(root2.containerInfo);
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            needsFormReset && (needsFormReset = false, recursivelyResetForms(finishedWork));
            break;
          case 4:
            flags = currentHoistableRoot;
            currentHoistableRoot = getHoistableRoot(
              finishedWork.stateNode.containerInfo
            );
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            currentHoistableRoot = flags;
            break;
          case 12:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            break;
          case 31:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 4 && (flags = finishedWork.updateQueue, null !== flags && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, flags)));
            break;
          case 13:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            finishedWork.child.flags & 8192 && null !== finishedWork.memoizedState !== (null !== current && null !== current.memoizedState) && (globalMostRecentFallbackTime = now());
            flags & 4 && (flags = finishedWork.updateQueue, null !== flags && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, flags)));
            break;
          case 22:
            hoistableRoot = null !== finishedWork.memoizedState;
            var wasHidden = null !== current && null !== current.memoizedState, prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden, prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
            offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden || hoistableRoot;
            offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || wasHidden;
            recursivelyTraverseMutationEffects(root2, finishedWork);
            offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
            offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
            commitReconciliationEffects(finishedWork);
            if (flags & 8192)
              a: for (root2 = finishedWork.stateNode, root2._visibility = hoistableRoot ? root2._visibility & -2 : root2._visibility | 1, hoistableRoot && (null === current || wasHidden || offscreenSubtreeIsHidden || offscreenSubtreeWasHidden || recursivelyTraverseDisappearLayoutEffects(finishedWork)), current = null, root2 = finishedWork; ; ) {
                if (5 === root2.tag || 26 === root2.tag) {
                  if (null === current) {
                    wasHidden = current = root2;
                    try {
                      if (currentResource = wasHidden.stateNode, hoistableRoot)
                        maybeNodes = currentResource.style, "function" === typeof maybeNodes.setProperty ? maybeNodes.setProperty("display", "none", "important") : maybeNodes.display = "none";
                      else {
                        i2 = wasHidden.stateNode;
                        var styleProp = wasHidden.memoizedProps.style, display = void 0 !== styleProp && null !== styleProp && styleProp.hasOwnProperty("display") ? styleProp.display : null;
                        i2.style.display = null == display || "boolean" === typeof display ? "" : ("" + display).trim();
                      }
                    } catch (error) {
                      captureCommitPhaseError(wasHidden, wasHidden.return, error);
                    }
                  }
                } else if (6 === root2.tag) {
                  if (null === current) {
                    wasHidden = root2;
                    try {
                      wasHidden.stateNode.nodeValue = hoistableRoot ? "" : wasHidden.memoizedProps;
                    } catch (error) {
                      captureCommitPhaseError(wasHidden, wasHidden.return, error);
                    }
                  }
                } else if (18 === root2.tag) {
                  if (null === current) {
                    wasHidden = root2;
                    try {
                      var instance = wasHidden.stateNode;
                      hoistableRoot ? hideOrUnhideDehydratedBoundary(instance, true) : hideOrUnhideDehydratedBoundary(wasHidden.stateNode, false);
                    } catch (error) {
                      captureCommitPhaseError(wasHidden, wasHidden.return, error);
                    }
                  }
                } else if ((22 !== root2.tag && 23 !== root2.tag || null === root2.memoizedState || root2 === finishedWork) && null !== root2.child) {
                  root2.child.return = root2;
                  root2 = root2.child;
                  continue;
                }
                if (root2 === finishedWork) break a;
                for (; null === root2.sibling; ) {
                  if (null === root2.return || root2.return === finishedWork) break a;
                  current === root2 && (current = null);
                  root2 = root2.return;
                }
                current === root2 && (current = null);
                root2.sibling.return = root2.return;
                root2 = root2.sibling;
              }
            flags & 4 && (flags = finishedWork.updateQueue, null !== flags && (current = flags.retryQueue, null !== current && (flags.retryQueue = null, attachSuspenseRetryListeners(finishedWork, current))));
            break;
          case 19:
            recursivelyTraverseMutationEffects(root2, finishedWork);
            commitReconciliationEffects(finishedWork);
            flags & 4 && (flags = finishedWork.updateQueue, null !== flags && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, flags)));
            break;
          case 30:
            break;
          case 21:
            break;
          default:
            recursivelyTraverseMutationEffects(root2, finishedWork), commitReconciliationEffects(finishedWork);
        }
      }
      function commitReconciliationEffects(finishedWork) {
        var flags = finishedWork.flags;
        if (flags & 2) {
          try {
            for (var hostParentFiber, parentFiber = finishedWork.return; null !== parentFiber; ) {
              if (isHostParent(parentFiber)) {
                hostParentFiber = parentFiber;
                break;
              }
              parentFiber = parentFiber.return;
            }
            if (null == hostParentFiber) throw Error(formatProdErrorMessage(160));
            switch (hostParentFiber.tag) {
              case 27:
                var parent = hostParentFiber.stateNode, before = getHostSibling(finishedWork);
                insertOrAppendPlacementNode(finishedWork, before, parent);
                break;
              case 5:
                var parent$141 = hostParentFiber.stateNode;
                hostParentFiber.flags & 32 && (setTextContent(parent$141, ""), hostParentFiber.flags &= -33);
                var before$142 = getHostSibling(finishedWork);
                insertOrAppendPlacementNode(finishedWork, before$142, parent$141);
                break;
              case 3:
              case 4:
                var parent$143 = hostParentFiber.stateNode.containerInfo, before$144 = getHostSibling(finishedWork);
                insertOrAppendPlacementNodeIntoContainer(
                  finishedWork,
                  before$144,
                  parent$143
                );
                break;
              default:
                throw Error(formatProdErrorMessage(161));
            }
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
          finishedWork.flags &= -3;
        }
        flags & 4096 && (finishedWork.flags &= -4097);
      }
      function recursivelyResetForms(parentFiber) {
        if (parentFiber.subtreeFlags & 1024)
          for (parentFiber = parentFiber.child; null !== parentFiber; ) {
            var fiber = parentFiber;
            recursivelyResetForms(fiber);
            5 === fiber.tag && fiber.flags & 1024 && fiber.stateNode.reset();
            parentFiber = parentFiber.sibling;
          }
      }
      function recursivelyTraverseLayoutEffects(root2, parentFiber) {
        if (parentFiber.subtreeFlags & 8772)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            commitLayoutEffectOnFiber(root2, parentFiber.alternate, parentFiber), parentFiber = parentFiber.sibling;
      }
      function recursivelyTraverseDisappearLayoutEffects(parentFiber) {
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
          var finishedWork = parentFiber;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
              commitHookEffectListUnmount(4, finishedWork, finishedWork.return);
              recursivelyTraverseDisappearLayoutEffects(finishedWork);
              break;
            case 1:
              safelyDetachRef(finishedWork, finishedWork.return);
              var instance = finishedWork.stateNode;
              "function" === typeof instance.componentWillUnmount && safelyCallComponentWillUnmount(
                finishedWork,
                finishedWork.return,
                instance
              );
              recursivelyTraverseDisappearLayoutEffects(finishedWork);
              break;
            case 27:
              releaseSingletonInstance(finishedWork.stateNode);
            case 26:
            case 5:
              safelyDetachRef(finishedWork, finishedWork.return);
              recursivelyTraverseDisappearLayoutEffects(finishedWork);
              break;
            case 22:
              null === finishedWork.memoizedState && recursivelyTraverseDisappearLayoutEffects(finishedWork);
              break;
            case 30:
              recursivelyTraverseDisappearLayoutEffects(finishedWork);
              break;
            default:
              recursivelyTraverseDisappearLayoutEffects(finishedWork);
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function recursivelyTraverseReappearLayoutEffects(finishedRoot$jscomp$0, parentFiber, includeWorkInProgressEffects) {
        includeWorkInProgressEffects = includeWorkInProgressEffects && 0 !== (parentFiber.subtreeFlags & 8772);
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
          var current = parentFiber.alternate, finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              commitHookEffectListMount(4, finishedWork);
              break;
            case 1:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              current = finishedWork;
              finishedRoot = current.stateNode;
              if ("function" === typeof finishedRoot.componentDidMount)
                try {
                  finishedRoot.componentDidMount();
                } catch (error) {
                  captureCommitPhaseError(current, current.return, error);
                }
              current = finishedWork;
              finishedRoot = current.updateQueue;
              if (null !== finishedRoot) {
                var instance = current.stateNode;
                try {
                  var hiddenCallbacks = finishedRoot.shared.hiddenCallbacks;
                  if (null !== hiddenCallbacks)
                    for (finishedRoot.shared.hiddenCallbacks = null, finishedRoot = 0; finishedRoot < hiddenCallbacks.length; finishedRoot++)
                      callCallback(hiddenCallbacks[finishedRoot], instance);
                } catch (error) {
                  captureCommitPhaseError(current, current.return, error);
                }
              }
              includeWorkInProgressEffects && flags & 64 && commitClassCallbacks(finishedWork);
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 27:
              commitHostSingletonAcquisition(finishedWork);
            case 26:
            case 5:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              includeWorkInProgressEffects && null === current && flags & 4 && commitHostMount(finishedWork);
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 12:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              break;
            case 31:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              includeWorkInProgressEffects && flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
              break;
            case 13:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              includeWorkInProgressEffects && flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
              break;
            case 22:
              null === finishedWork.memoizedState && recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
              safelyAttachRef(finishedWork, finishedWork.return);
              break;
            case 30:
              break;
            default:
              recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                includeWorkInProgressEffects
              );
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function commitOffscreenPassiveMountEffects(current, finishedWork) {
        var previousCache = null;
        null !== current && null !== current.memoizedState && null !== current.memoizedState.cachePool && (previousCache = current.memoizedState.cachePool.pool);
        current = null;
        null !== finishedWork.memoizedState && null !== finishedWork.memoizedState.cachePool && (current = finishedWork.memoizedState.cachePool.pool);
        current !== previousCache && (null != current && current.refCount++, null != previousCache && releaseCache(previousCache));
      }
      function commitCachePassiveMountEffect(current, finishedWork) {
        current = null;
        null !== finishedWork.alternate && (current = finishedWork.alternate.memoizedState.cache);
        finishedWork = finishedWork.memoizedState.cache;
        finishedWork !== current && (finishedWork.refCount++, null != current && releaseCache(current));
      }
      function recursivelyTraversePassiveMountEffects(root2, parentFiber, committedLanes, committedTransitions) {
        if (parentFiber.subtreeFlags & 10256)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            commitPassiveMountOnFiber(
              root2,
              parentFiber,
              committedLanes,
              committedTransitions
            ), parentFiber = parentFiber.sibling;
      }
      function commitPassiveMountOnFiber(finishedRoot, finishedWork, committedLanes, committedTransitions) {
        var flags = finishedWork.flags;
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            flags & 2048 && commitHookEffectListMount(9, finishedWork);
            break;
          case 1:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          case 3:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            flags & 2048 && (finishedRoot = null, null !== finishedWork.alternate && (finishedRoot = finishedWork.alternate.memoizedState.cache), finishedWork = finishedWork.memoizedState.cache, finishedWork !== finishedRoot && (finishedWork.refCount++, null != finishedRoot && releaseCache(finishedRoot)));
            break;
          case 12:
            if (flags & 2048) {
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
              );
              finishedRoot = finishedWork.stateNode;
              try {
                var _finishedWork$memoize2 = finishedWork.memoizedProps, id = _finishedWork$memoize2.id, onPostCommit = _finishedWork$memoize2.onPostCommit;
                "function" === typeof onPostCommit && onPostCommit(
                  id,
                  null === finishedWork.alternate ? "mount" : "update",
                  finishedRoot.passiveEffectDuration,
                  -0
                );
              } catch (error) {
                captureCommitPhaseError(finishedWork, finishedWork.return, error);
              }
            } else
              recursivelyTraversePassiveMountEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions
              );
            break;
          case 31:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          case 13:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            break;
          case 23:
            break;
          case 22:
            _finishedWork$memoize2 = finishedWork.stateNode;
            id = finishedWork.alternate;
            null !== finishedWork.memoizedState ? _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ) : recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork) : _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ) : (_finishedWork$memoize2._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions,
              0 !== (finishedWork.subtreeFlags & 10256) || false
            ));
            flags & 2048 && commitOffscreenPassiveMountEffects(id, finishedWork);
            break;
          case 24:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
            flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
            break;
          default:
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            );
        }
      }
      function recursivelyTraverseReconnectPassiveEffects(finishedRoot$jscomp$0, parentFiber, committedLanes$jscomp$0, committedTransitions$jscomp$0, includeWorkInProgressEffects) {
        includeWorkInProgressEffects = includeWorkInProgressEffects && (0 !== (parentFiber.subtreeFlags & 10256) || false);
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
          var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, committedLanes = committedLanes$jscomp$0, committedTransitions = committedTransitions$jscomp$0, flags = finishedWork.flags;
          switch (finishedWork.tag) {
            case 0:
            case 11:
            case 15:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              );
              commitHookEffectListMount(8, finishedWork);
              break;
            case 23:
              break;
            case 22:
              var instance = finishedWork.stateNode;
              null !== finishedWork.memoizedState ? instance._visibility & 2 ? recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              ) : recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork
              ) : (instance._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              ));
              includeWorkInProgressEffects && flags & 2048 && commitOffscreenPassiveMountEffects(
                finishedWork.alternate,
                finishedWork
              );
              break;
            case 24:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              );
              includeWorkInProgressEffects && flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
              break;
            default:
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              );
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function recursivelyTraverseAtomicPassiveEffects(finishedRoot$jscomp$0, parentFiber) {
        if (parentFiber.subtreeFlags & 10256)
          for (parentFiber = parentFiber.child; null !== parentFiber; ) {
            var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags;
            switch (finishedWork.tag) {
              case 22:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
                flags & 2048 && commitOffscreenPassiveMountEffects(
                  finishedWork.alternate,
                  finishedWork
                );
                break;
              case 24:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
                flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
                break;
              default:
                recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
            }
            parentFiber = parentFiber.sibling;
          }
      }
      var suspenseyCommitFlag = 8192;
      function recursivelyAccumulateSuspenseyCommit(parentFiber, committedLanes, suspendedState) {
        if (parentFiber.subtreeFlags & suspenseyCommitFlag)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            accumulateSuspenseyCommitOnFiber(
              parentFiber,
              committedLanes,
              suspendedState
            ), parentFiber = parentFiber.sibling;
      }
      function accumulateSuspenseyCommitOnFiber(fiber, committedLanes, suspendedState) {
        switch (fiber.tag) {
          case 26:
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
            fiber.flags & suspenseyCommitFlag && null !== fiber.memoizedState && suspendResource(
              suspendedState,
              currentHoistableRoot,
              fiber.memoizedState,
              fiber.memoizedProps
            );
            break;
          case 5:
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
            break;
          case 3:
          case 4:
            var previousHoistableRoot = currentHoistableRoot;
            currentHoistableRoot = getHoistableRoot(fiber.stateNode.containerInfo);
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
            currentHoistableRoot = previousHoistableRoot;
            break;
          case 22:
            null === fiber.memoizedState && (previousHoistableRoot = fiber.alternate, null !== previousHoistableRoot && null !== previousHoistableRoot.memoizedState ? (previousHoistableRoot = suspenseyCommitFlag, suspenseyCommitFlag = 16777216, recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ), suspenseyCommitFlag = previousHoistableRoot) : recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            ));
            break;
          default:
            recursivelyAccumulateSuspenseyCommit(
              fiber,
              committedLanes,
              suspendedState
            );
        }
      }
      function detachAlternateSiblings(parentFiber) {
        var previousFiber = parentFiber.alternate;
        if (null !== previousFiber && (parentFiber = previousFiber.child, null !== parentFiber)) {
          previousFiber.child = null;
          do
            previousFiber = parentFiber.sibling, parentFiber.sibling = null, parentFiber = previousFiber;
          while (null !== parentFiber);
        }
      }
      function recursivelyTraversePassiveUnmountEffects(parentFiber) {
        var deletions = parentFiber.deletions;
        if (0 !== (parentFiber.flags & 16)) {
          if (null !== deletions)
            for (var i2 = 0; i2 < deletions.length; i2++) {
              var childToDelete = deletions[i2];
              nextEffect = childToDelete;
              commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                childToDelete,
                parentFiber
              );
            }
          detachAlternateSiblings(parentFiber);
        }
        if (parentFiber.subtreeFlags & 10256)
          for (parentFiber = parentFiber.child; null !== parentFiber; )
            commitPassiveUnmountOnFiber(parentFiber), parentFiber = parentFiber.sibling;
      }
      function commitPassiveUnmountOnFiber(finishedWork) {
        switch (finishedWork.tag) {
          case 0:
          case 11:
          case 15:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            finishedWork.flags & 2048 && commitHookEffectListUnmount(9, finishedWork, finishedWork.return);
            break;
          case 3:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          case 12:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          case 22:
            var instance = finishedWork.stateNode;
            null !== finishedWork.memoizedState && instance._visibility & 2 && (null === finishedWork.return || 13 !== finishedWork.return.tag) ? (instance._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(finishedWork)) : recursivelyTraversePassiveUnmountEffects(finishedWork);
            break;
          default:
            recursivelyTraversePassiveUnmountEffects(finishedWork);
        }
      }
      function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
        var deletions = parentFiber.deletions;
        if (0 !== (parentFiber.flags & 16)) {
          if (null !== deletions)
            for (var i2 = 0; i2 < deletions.length; i2++) {
              var childToDelete = deletions[i2];
              nextEffect = childToDelete;
              commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
                childToDelete,
                parentFiber
              );
            }
          detachAlternateSiblings(parentFiber);
        }
        for (parentFiber = parentFiber.child; null !== parentFiber; ) {
          deletions = parentFiber;
          switch (deletions.tag) {
            case 0:
            case 11:
            case 15:
              commitHookEffectListUnmount(8, deletions, deletions.return);
              recursivelyTraverseDisconnectPassiveEffects(deletions);
              break;
            case 22:
              i2 = deletions.stateNode;
              i2._visibility & 2 && (i2._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(deletions));
              break;
            default:
              recursivelyTraverseDisconnectPassiveEffects(deletions);
          }
          parentFiber = parentFiber.sibling;
        }
      }
      function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(deletedSubtreeRoot, nearestMountedAncestor) {
        for (; null !== nextEffect; ) {
          var fiber = nextEffect;
          switch (fiber.tag) {
            case 0:
            case 11:
            case 15:
              commitHookEffectListUnmount(8, fiber, nearestMountedAncestor);
              break;
            case 23:
            case 22:
              if (null !== fiber.memoizedState && null !== fiber.memoizedState.cachePool) {
                var cache = fiber.memoizedState.cachePool.pool;
                null != cache && cache.refCount++;
              }
              break;
            case 24:
              releaseCache(fiber.memoizedState.cache);
          }
          cache = fiber.child;
          if (null !== cache) cache.return = fiber, nextEffect = cache;
          else
            a: for (fiber = deletedSubtreeRoot; null !== nextEffect; ) {
              cache = nextEffect;
              var sibling = cache.sibling, returnFiber = cache.return;
              detachFiberAfterEffects(cache);
              if (cache === fiber) {
                nextEffect = null;
                break a;
              }
              if (null !== sibling) {
                sibling.return = returnFiber;
                nextEffect = sibling;
                break a;
              }
              nextEffect = returnFiber;
            }
        }
      }
      var DefaultAsyncDispatcher = {
        getCacheForType: function(resourceType) {
          var cache = readContext(CacheContext), cacheForType = cache.data.get(resourceType);
          void 0 === cacheForType && (cacheForType = resourceType(), cache.data.set(resourceType, cacheForType));
          return cacheForType;
        },
        cacheSignal: function() {
          return readContext(CacheContext).controller.signal;
        }
      };
      var PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map;
      var executionContext = 0;
      var workInProgressRoot = null;
      var workInProgress = null;
      var workInProgressRootRenderLanes = 0;
      var workInProgressSuspendedReason = 0;
      var workInProgressThrownValue = null;
      var workInProgressRootDidSkipSuspendedSiblings = false;
      var workInProgressRootIsPrerendering = false;
      var workInProgressRootDidAttachPingListener = false;
      var entangledRenderLanes = 0;
      var workInProgressRootExitStatus = 0;
      var workInProgressRootSkippedLanes = 0;
      var workInProgressRootInterleavedUpdatedLanes = 0;
      var workInProgressRootPingedLanes = 0;
      var workInProgressDeferredLane = 0;
      var workInProgressSuspendedRetryLanes = 0;
      var workInProgressRootConcurrentErrors = null;
      var workInProgressRootRecoverableErrors = null;
      var workInProgressRootDidIncludeRecursiveRenderUpdate = false;
      var globalMostRecentFallbackTime = 0;
      var globalMostRecentTransitionTime = 0;
      var workInProgressRootRenderTargetTime = Infinity;
      var workInProgressTransitions = null;
      var legacyErrorBoundariesThatAlreadyFailed = null;
      var pendingEffectsStatus = 0;
      var pendingEffectsRoot = null;
      var pendingFinishedWork = null;
      var pendingEffectsLanes = 0;
      var pendingEffectsRemainingLanes = 0;
      var pendingPassiveTransitions = null;
      var pendingRecoverableErrors = null;
      var nestedUpdateCount = 0;
      var rootWithNestedUpdates = null;
      function requestUpdateLane() {
        return 0 !== (executionContext & 2) && 0 !== workInProgressRootRenderLanes ? workInProgressRootRenderLanes & -workInProgressRootRenderLanes : null !== ReactSharedInternals.T ? requestTransitionLane() : resolveUpdatePriority();
      }
      function requestDeferredLane() {
        if (0 === workInProgressDeferredLane)
          if (0 === (workInProgressRootRenderLanes & 536870912) || isHydrating) {
            var lane = nextTransitionDeferredLane;
            nextTransitionDeferredLane <<= 1;
            0 === (nextTransitionDeferredLane & 3932160) && (nextTransitionDeferredLane = 262144);
            workInProgressDeferredLane = lane;
          } else workInProgressDeferredLane = 536870912;
        lane = suspenseHandlerStackCursor.current;
        null !== lane && (lane.flags |= 32);
        return workInProgressDeferredLane;
      }
      function scheduleUpdateOnFiber(root2, fiber, lane) {
        if (root2 === workInProgressRoot && (2 === workInProgressSuspendedReason || 9 === workInProgressSuspendedReason) || null !== root2.cancelPendingCommit)
          prepareFreshStack(root2, 0), markRootSuspended(
            root2,
            workInProgressRootRenderLanes,
            workInProgressDeferredLane,
            false
          );
        markRootUpdated$1(root2, lane);
        if (0 === (executionContext & 2) || root2 !== workInProgressRoot)
          root2 === workInProgressRoot && (0 === (executionContext & 2) && (workInProgressRootInterleavedUpdatedLanes |= lane), 4 === workInProgressRootExitStatus && markRootSuspended(
            root2,
            workInProgressRootRenderLanes,
            workInProgressDeferredLane,
            false
          )), ensureRootIsScheduled(root2);
      }
      function performWorkOnRoot(root$jscomp$0, lanes, forceSync) {
        if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
        var shouldTimeSlice = !forceSync && 0 === (lanes & 127) && 0 === (lanes & root$jscomp$0.expiredLanes) || checkIfRootIsPrerendering(root$jscomp$0, lanes), exitStatus = shouldTimeSlice ? renderRootConcurrent(root$jscomp$0, lanes) : renderRootSync(root$jscomp$0, lanes, true), renderWasConcurrent = shouldTimeSlice;
        do {
          if (0 === exitStatus) {
            workInProgressRootIsPrerendering && !shouldTimeSlice && markRootSuspended(root$jscomp$0, lanes, 0, false);
            break;
          } else {
            forceSync = root$jscomp$0.current.alternate;
            if (renderWasConcurrent && !isRenderConsistentWithExternalStores(forceSync)) {
              exitStatus = renderRootSync(root$jscomp$0, lanes, false);
              renderWasConcurrent = false;
              continue;
            }
            if (2 === exitStatus) {
              renderWasConcurrent = lanes;
              if (root$jscomp$0.errorRecoveryDisabledLanes & renderWasConcurrent)
                var JSCompiler_inline_result = 0;
              else
                JSCompiler_inline_result = root$jscomp$0.pendingLanes & -536870913, JSCompiler_inline_result = 0 !== JSCompiler_inline_result ? JSCompiler_inline_result : JSCompiler_inline_result & 536870912 ? 536870912 : 0;
              if (0 !== JSCompiler_inline_result) {
                lanes = JSCompiler_inline_result;
                a: {
                  var root2 = root$jscomp$0;
                  exitStatus = workInProgressRootConcurrentErrors;
                  var wasRootDehydrated = root2.current.memoizedState.isDehydrated;
                  wasRootDehydrated && (prepareFreshStack(root2, JSCompiler_inline_result).flags |= 256);
                  JSCompiler_inline_result = renderRootSync(
                    root2,
                    JSCompiler_inline_result,
                    false
                  );
                  if (2 !== JSCompiler_inline_result) {
                    if (workInProgressRootDidAttachPingListener && !wasRootDehydrated) {
                      root2.errorRecoveryDisabledLanes |= renderWasConcurrent;
                      workInProgressRootInterleavedUpdatedLanes |= renderWasConcurrent;
                      exitStatus = 4;
                      break a;
                    }
                    renderWasConcurrent = workInProgressRootRecoverableErrors;
                    workInProgressRootRecoverableErrors = exitStatus;
                    null !== renderWasConcurrent && (null === workInProgressRootRecoverableErrors ? workInProgressRootRecoverableErrors = renderWasConcurrent : workInProgressRootRecoverableErrors.push.apply(
                      workInProgressRootRecoverableErrors,
                      renderWasConcurrent
                    ));
                  }
                  exitStatus = JSCompiler_inline_result;
                }
                renderWasConcurrent = false;
                if (2 !== exitStatus) continue;
              }
            }
            if (1 === exitStatus) {
              prepareFreshStack(root$jscomp$0, 0);
              markRootSuspended(root$jscomp$0, lanes, 0, true);
              break;
            }
            a: {
              shouldTimeSlice = root$jscomp$0;
              renderWasConcurrent = exitStatus;
              switch (renderWasConcurrent) {
                case 0:
                case 1:
                  throw Error(formatProdErrorMessage(345));
                case 4:
                  if ((lanes & 4194048) !== lanes) break;
                case 6:
                  markRootSuspended(
                    shouldTimeSlice,
                    lanes,
                    workInProgressDeferredLane,
                    !workInProgressRootDidSkipSuspendedSiblings
                  );
                  break a;
                case 2:
                  workInProgressRootRecoverableErrors = null;
                  break;
                case 3:
                case 5:
                  break;
                default:
                  throw Error(formatProdErrorMessage(329));
              }
              if ((lanes & 62914560) === lanes && (exitStatus = globalMostRecentFallbackTime + 300 - now(), 10 < exitStatus)) {
                markRootSuspended(
                  shouldTimeSlice,
                  lanes,
                  workInProgressDeferredLane,
                  !workInProgressRootDidSkipSuspendedSiblings
                );
                if (0 !== getNextLanes(shouldTimeSlice, 0, true)) break a;
                pendingEffectsLanes = lanes;
                shouldTimeSlice.timeoutHandle = scheduleTimeout(
                  commitRootWhenReady.bind(
                    null,
                    shouldTimeSlice,
                    forceSync,
                    workInProgressRootRecoverableErrors,
                    workInProgressTransitions,
                    workInProgressRootDidIncludeRecursiveRenderUpdate,
                    lanes,
                    workInProgressDeferredLane,
                    workInProgressRootInterleavedUpdatedLanes,
                    workInProgressSuspendedRetryLanes,
                    workInProgressRootDidSkipSuspendedSiblings,
                    renderWasConcurrent,
                    "Throttled",
                    -0,
                    0
                  ),
                  exitStatus
                );
                break a;
              }
              commitRootWhenReady(
                shouldTimeSlice,
                forceSync,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions,
                workInProgressRootDidIncludeRecursiveRenderUpdate,
                lanes,
                workInProgressDeferredLane,
                workInProgressRootInterleavedUpdatedLanes,
                workInProgressSuspendedRetryLanes,
                workInProgressRootDidSkipSuspendedSiblings,
                renderWasConcurrent,
                null,
                -0,
                0
              );
            }
          }
          break;
        } while (1);
        ensureRootIsScheduled(root$jscomp$0);
      }
      function commitRootWhenReady(root2, finishedWork, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, lanes, spawnedLane, updatedLanes, suspendedRetryLanes, didSkipSuspendedSiblings, exitStatus, suspendedCommitReason, completedRenderStartTime, completedRenderEndTime) {
        root2.timeoutHandle = -1;
        suspendedCommitReason = finishedWork.subtreeFlags;
        if (suspendedCommitReason & 8192 || 16785408 === (suspendedCommitReason & 16785408)) {
          suspendedCommitReason = {
            stylesheets: null,
            count: 0,
            imgCount: 0,
            imgBytes: 0,
            suspenseyImages: [],
            waitingForImages: true,
            waitingForViewTransition: false,
            unsuspend: noop$1
          };
          accumulateSuspenseyCommitOnFiber(
            finishedWork,
            lanes,
            suspendedCommitReason
          );
          var timeoutOffset = (lanes & 62914560) === lanes ? globalMostRecentFallbackTime - now() : (lanes & 4194048) === lanes ? globalMostRecentTransitionTime - now() : 0;
          timeoutOffset = waitForCommitToBeReady(
            suspendedCommitReason,
            timeoutOffset
          );
          if (null !== timeoutOffset) {
            pendingEffectsLanes = lanes;
            root2.cancelPendingCommit = timeoutOffset(
              commitRoot.bind(
                null,
                root2,
                finishedWork,
                lanes,
                recoverableErrors,
                transitions,
                didIncludeRenderPhaseUpdate,
                spawnedLane,
                updatedLanes,
                suspendedRetryLanes,
                exitStatus,
                suspendedCommitReason,
                null,
                completedRenderStartTime,
                completedRenderEndTime
              )
            );
            markRootSuspended(root2, lanes, spawnedLane, !didSkipSuspendedSiblings);
            return;
          }
        }
        commitRoot(
          root2,
          finishedWork,
          lanes,
          recoverableErrors,
          transitions,
          didIncludeRenderPhaseUpdate,
          spawnedLane,
          updatedLanes,
          suspendedRetryLanes
        );
      }
      function isRenderConsistentWithExternalStores(finishedWork) {
        for (var node = finishedWork; ; ) {
          var tag = node.tag;
          if ((0 === tag || 11 === tag || 15 === tag) && node.flags & 16384 && (tag = node.updateQueue, null !== tag && (tag = tag.stores, null !== tag)))
            for (var i2 = 0; i2 < tag.length; i2++) {
              var check = tag[i2], getSnapshot = check.getSnapshot;
              check = check.value;
              try {
                if (!objectIs(getSnapshot(), check)) return false;
              } catch (error) {
                return false;
              }
            }
          tag = node.child;
          if (node.subtreeFlags & 16384 && null !== tag)
            tag.return = node, node = tag;
          else {
            if (node === finishedWork) break;
            for (; null === node.sibling; ) {
              if (null === node.return || node.return === finishedWork) return true;
              node = node.return;
            }
            node.sibling.return = node.return;
            node = node.sibling;
          }
        }
        return true;
      }
      function markRootSuspended(root2, suspendedLanes, spawnedLane, didAttemptEntireTree) {
        suspendedLanes &= ~workInProgressRootPingedLanes;
        suspendedLanes &= ~workInProgressRootInterleavedUpdatedLanes;
        root2.suspendedLanes |= suspendedLanes;
        root2.pingedLanes &= ~suspendedLanes;
        didAttemptEntireTree && (root2.warmLanes |= suspendedLanes);
        didAttemptEntireTree = root2.expirationTimes;
        for (var lanes = suspendedLanes; 0 < lanes; ) {
          var index$6 = 31 - clz32(lanes), lane = 1 << index$6;
          didAttemptEntireTree[index$6] = -1;
          lanes &= ~lane;
        }
        0 !== spawnedLane && markSpawnedDeferredLane(root2, spawnedLane, suspendedLanes);
      }
      function flushSyncWork$1() {
        return 0 === (executionContext & 6) ? (flushSyncWorkAcrossRoots_impl(0, false), false) : true;
      }
      function resetWorkInProgressStack() {
        if (null !== workInProgress) {
          if (0 === workInProgressSuspendedReason)
            var interruptedWork = workInProgress.return;
          else
            interruptedWork = workInProgress, lastContextDependency = currentlyRenderingFiber$1 = null, resetHooksOnUnwind(interruptedWork), thenableState$1 = null, thenableIndexCounter$1 = 0, interruptedWork = workInProgress;
          for (; null !== interruptedWork; )
            unwindInterruptedWork(interruptedWork.alternate, interruptedWork), interruptedWork = interruptedWork.return;
          workInProgress = null;
        }
      }
      function prepareFreshStack(root2, lanes) {
        var timeoutHandle = root2.timeoutHandle;
        -1 !== timeoutHandle && (root2.timeoutHandle = -1, cancelTimeout(timeoutHandle));
        timeoutHandle = root2.cancelPendingCommit;
        null !== timeoutHandle && (root2.cancelPendingCommit = null, timeoutHandle());
        pendingEffectsLanes = 0;
        resetWorkInProgressStack();
        workInProgressRoot = root2;
        workInProgress = timeoutHandle = createWorkInProgress(root2.current, null);
        workInProgressRootRenderLanes = lanes;
        workInProgressSuspendedReason = 0;
        workInProgressThrownValue = null;
        workInProgressRootDidSkipSuspendedSiblings = false;
        workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root2, lanes);
        workInProgressRootDidAttachPingListener = false;
        workInProgressSuspendedRetryLanes = workInProgressDeferredLane = workInProgressRootPingedLanes = workInProgressRootInterleavedUpdatedLanes = workInProgressRootSkippedLanes = workInProgressRootExitStatus = 0;
        workInProgressRootRecoverableErrors = workInProgressRootConcurrentErrors = null;
        workInProgressRootDidIncludeRecursiveRenderUpdate = false;
        0 !== (lanes & 8) && (lanes |= lanes & 32);
        var allEntangledLanes = root2.entangledLanes;
        if (0 !== allEntangledLanes)
          for (root2 = root2.entanglements, allEntangledLanes &= lanes; 0 < allEntangledLanes; ) {
            var index$4 = 31 - clz32(allEntangledLanes), lane = 1 << index$4;
            lanes |= root2[index$4];
            allEntangledLanes &= ~lane;
          }
        entangledRenderLanes = lanes;
        finishQueueingConcurrentUpdates();
        return timeoutHandle;
      }
      function handleThrow(root2, thrownValue) {
        currentlyRenderingFiber = null;
        ReactSharedInternals.H = ContextOnlyDispatcher;
        thrownValue === SuspenseException || thrownValue === SuspenseActionException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = 3) : thrownValue === SuspenseyCommitException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = 4) : workInProgressSuspendedReason = thrownValue === SelectiveHydrationException ? 8 : null !== thrownValue && "object" === typeof thrownValue && "function" === typeof thrownValue.then ? 6 : 1;
        workInProgressThrownValue = thrownValue;
        null === workInProgress && (workInProgressRootExitStatus = 1, logUncaughtError(
          root2,
          createCapturedValueAtFiber(thrownValue, root2.current)
        ));
      }
      function shouldRemainOnPreviousScreen() {
        var handler = suspenseHandlerStackCursor.current;
        return null === handler ? true : (workInProgressRootRenderLanes & 4194048) === workInProgressRootRenderLanes ? null === shellBoundary ? true : false : (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes || 0 !== (workInProgressRootRenderLanes & 536870912) ? handler === shellBoundary : false;
      }
      function pushDispatcher() {
        var prevDispatcher = ReactSharedInternals.H;
        ReactSharedInternals.H = ContextOnlyDispatcher;
        return null === prevDispatcher ? ContextOnlyDispatcher : prevDispatcher;
      }
      function pushAsyncDispatcher() {
        var prevAsyncDispatcher = ReactSharedInternals.A;
        ReactSharedInternals.A = DefaultAsyncDispatcher;
        return prevAsyncDispatcher;
      }
      function renderDidSuspendDelayIfPossible() {
        workInProgressRootExitStatus = 4;
        workInProgressRootDidSkipSuspendedSiblings || (workInProgressRootRenderLanes & 4194048) !== workInProgressRootRenderLanes && null !== suspenseHandlerStackCursor.current || (workInProgressRootIsPrerendering = true);
        0 === (workInProgressRootSkippedLanes & 134217727) && 0 === (workInProgressRootInterleavedUpdatedLanes & 134217727) || null === workInProgressRoot || markRootSuspended(
          workInProgressRoot,
          workInProgressRootRenderLanes,
          workInProgressDeferredLane,
          false
        );
      }
      function renderRootSync(root2, lanes, shouldYieldForPrerendering) {
        var prevExecutionContext = executionContext;
        executionContext |= 2;
        var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
        if (workInProgressRoot !== root2 || workInProgressRootRenderLanes !== lanes)
          workInProgressTransitions = null, prepareFreshStack(root2, lanes);
        lanes = false;
        var exitStatus = workInProgressRootExitStatus;
        a: do
          try {
            if (0 !== workInProgressSuspendedReason && null !== workInProgress) {
              var unitOfWork = workInProgress, thrownValue = workInProgressThrownValue;
              switch (workInProgressSuspendedReason) {
                case 8:
                  resetWorkInProgressStack();
                  exitStatus = 6;
                  break a;
                case 3:
                case 2:
                case 9:
                case 6:
                  null === suspenseHandlerStackCursor.current && (lanes = true);
                  var reason = workInProgressSuspendedReason;
                  workInProgressSuspendedReason = 0;
                  workInProgressThrownValue = null;
                  throwAndUnwindWorkLoop(root2, unitOfWork, thrownValue, reason);
                  if (shouldYieldForPrerendering && workInProgressRootIsPrerendering) {
                    exitStatus = 0;
                    break a;
                  }
                  break;
                default:
                  reason = workInProgressSuspendedReason, workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root2, unitOfWork, thrownValue, reason);
              }
            }
            workLoopSync();
            exitStatus = workInProgressRootExitStatus;
            break;
          } catch (thrownValue$165) {
            handleThrow(root2, thrownValue$165);
          }
        while (1);
        lanes && root2.shellSuspendCounter++;
        lastContextDependency = currentlyRenderingFiber$1 = null;
        executionContext = prevExecutionContext;
        ReactSharedInternals.H = prevDispatcher;
        ReactSharedInternals.A = prevAsyncDispatcher;
        null === workInProgress && (workInProgressRoot = null, workInProgressRootRenderLanes = 0, finishQueueingConcurrentUpdates());
        return exitStatus;
      }
      function workLoopSync() {
        for (; null !== workInProgress; ) performUnitOfWork(workInProgress);
      }
      function renderRootConcurrent(root2, lanes) {
        var prevExecutionContext = executionContext;
        executionContext |= 2;
        var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
        workInProgressRoot !== root2 || workInProgressRootRenderLanes !== lanes ? (workInProgressTransitions = null, workInProgressRootRenderTargetTime = now() + 500, prepareFreshStack(root2, lanes)) : workInProgressRootIsPrerendering = checkIfRootIsPrerendering(
          root2,
          lanes
        );
        a: do
          try {
            if (0 !== workInProgressSuspendedReason && null !== workInProgress) {
              lanes = workInProgress;
              var thrownValue = workInProgressThrownValue;
              b: switch (workInProgressSuspendedReason) {
                case 1:
                  workInProgressSuspendedReason = 0;
                  workInProgressThrownValue = null;
                  throwAndUnwindWorkLoop(root2, lanes, thrownValue, 1);
                  break;
                case 2:
                case 9:
                  if (isThenableResolved(thrownValue)) {
                    workInProgressSuspendedReason = 0;
                    workInProgressThrownValue = null;
                    replaySuspendedUnitOfWork(lanes);
                    break;
                  }
                  lanes = function() {
                    2 !== workInProgressSuspendedReason && 9 !== workInProgressSuspendedReason || workInProgressRoot !== root2 || (workInProgressSuspendedReason = 7);
                    ensureRootIsScheduled(root2);
                  };
                  thrownValue.then(lanes, lanes);
                  break a;
                case 3:
                  workInProgressSuspendedReason = 7;
                  break a;
                case 4:
                  workInProgressSuspendedReason = 5;
                  break a;
                case 7:
                  isThenableResolved(thrownValue) ? (workInProgressSuspendedReason = 0, workInProgressThrownValue = null, replaySuspendedUnitOfWork(lanes)) : (workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root2, lanes, thrownValue, 7));
                  break;
                case 5:
                  var resource = null;
                  switch (workInProgress.tag) {
                    case 26:
                      resource = workInProgress.memoizedState;
                    case 5:
                    case 27:
                      var hostFiber = workInProgress;
                      if (resource ? preloadResource(resource) : hostFiber.stateNode.complete) {
                        workInProgressSuspendedReason = 0;
                        workInProgressThrownValue = null;
                        var sibling = hostFiber.sibling;
                        if (null !== sibling) workInProgress = sibling;
                        else {
                          var returnFiber = hostFiber.return;
                          null !== returnFiber ? (workInProgress = returnFiber, completeUnitOfWork(returnFiber)) : workInProgress = null;
                        }
                        break b;
                      }
                  }
                  workInProgressSuspendedReason = 0;
                  workInProgressThrownValue = null;
                  throwAndUnwindWorkLoop(root2, lanes, thrownValue, 5);
                  break;
                case 6:
                  workInProgressSuspendedReason = 0;
                  workInProgressThrownValue = null;
                  throwAndUnwindWorkLoop(root2, lanes, thrownValue, 6);
                  break;
                case 8:
                  resetWorkInProgressStack();
                  workInProgressRootExitStatus = 6;
                  break a;
                default:
                  throw Error(formatProdErrorMessage(462));
              }
            }
            workLoopConcurrentByScheduler();
            break;
          } catch (thrownValue$167) {
            handleThrow(root2, thrownValue$167);
          }
        while (1);
        lastContextDependency = currentlyRenderingFiber$1 = null;
        ReactSharedInternals.H = prevDispatcher;
        ReactSharedInternals.A = prevAsyncDispatcher;
        executionContext = prevExecutionContext;
        if (null !== workInProgress) return 0;
        workInProgressRoot = null;
        workInProgressRootRenderLanes = 0;
        finishQueueingConcurrentUpdates();
        return workInProgressRootExitStatus;
      }
      function workLoopConcurrentByScheduler() {
        for (; null !== workInProgress && !shouldYield(); )
          performUnitOfWork(workInProgress);
      }
      function performUnitOfWork(unitOfWork) {
        var next = beginWork(unitOfWork.alternate, unitOfWork, entangledRenderLanes);
        unitOfWork.memoizedProps = unitOfWork.pendingProps;
        null === next ? completeUnitOfWork(unitOfWork) : workInProgress = next;
      }
      function replaySuspendedUnitOfWork(unitOfWork) {
        var next = unitOfWork;
        var current = next.alternate;
        switch (next.tag) {
          case 15:
          case 0:
            next = replayFunctionComponent(
              current,
              next,
              next.pendingProps,
              next.type,
              void 0,
              workInProgressRootRenderLanes
            );
            break;
          case 11:
            next = replayFunctionComponent(
              current,
              next,
              next.pendingProps,
              next.type.render,
              next.ref,
              workInProgressRootRenderLanes
            );
            break;
          case 5:
            resetHooksOnUnwind(next);
          default:
            unwindInterruptedWork(current, next), next = workInProgress = resetWorkInProgress(next, entangledRenderLanes), next = beginWork(current, next, entangledRenderLanes);
        }
        unitOfWork.memoizedProps = unitOfWork.pendingProps;
        null === next ? completeUnitOfWork(unitOfWork) : workInProgress = next;
      }
      function throwAndUnwindWorkLoop(root2, unitOfWork, thrownValue, suspendedReason) {
        lastContextDependency = currentlyRenderingFiber$1 = null;
        resetHooksOnUnwind(unitOfWork);
        thenableState$1 = null;
        thenableIndexCounter$1 = 0;
        var returnFiber = unitOfWork.return;
        try {
          if (throwException(
            root2,
            returnFiber,
            unitOfWork,
            thrownValue,
            workInProgressRootRenderLanes
          )) {
            workInProgressRootExitStatus = 1;
            logUncaughtError(
              root2,
              createCapturedValueAtFiber(thrownValue, root2.current)
            );
            workInProgress = null;
            return;
          }
        } catch (error) {
          if (null !== returnFiber) throw workInProgress = returnFiber, error;
          workInProgressRootExitStatus = 1;
          logUncaughtError(
            root2,
            createCapturedValueAtFiber(thrownValue, root2.current)
          );
          workInProgress = null;
          return;
        }
        if (unitOfWork.flags & 32768) {
          if (isHydrating || 1 === suspendedReason) root2 = true;
          else if (workInProgressRootIsPrerendering || 0 !== (workInProgressRootRenderLanes & 536870912))
            root2 = false;
          else if (workInProgressRootDidSkipSuspendedSiblings = root2 = true, 2 === suspendedReason || 9 === suspendedReason || 3 === suspendedReason || 6 === suspendedReason)
            suspendedReason = suspenseHandlerStackCursor.current, null !== suspendedReason && 13 === suspendedReason.tag && (suspendedReason.flags |= 16384);
          unwindUnitOfWork(unitOfWork, root2);
        } else completeUnitOfWork(unitOfWork);
      }
      function completeUnitOfWork(unitOfWork) {
        var completedWork = unitOfWork;
        do {
          if (0 !== (completedWork.flags & 32768)) {
            unwindUnitOfWork(
              completedWork,
              workInProgressRootDidSkipSuspendedSiblings
            );
            return;
          }
          unitOfWork = completedWork.return;
          var next = completeWork(
            completedWork.alternate,
            completedWork,
            entangledRenderLanes
          );
          if (null !== next) {
            workInProgress = next;
            return;
          }
          completedWork = completedWork.sibling;
          if (null !== completedWork) {
            workInProgress = completedWork;
            return;
          }
          workInProgress = completedWork = unitOfWork;
        } while (null !== completedWork);
        0 === workInProgressRootExitStatus && (workInProgressRootExitStatus = 5);
      }
      function unwindUnitOfWork(unitOfWork, skipSiblings) {
        do {
          var next = unwindWork(unitOfWork.alternate, unitOfWork);
          if (null !== next) {
            next.flags &= 32767;
            workInProgress = next;
            return;
          }
          next = unitOfWork.return;
          null !== next && (next.flags |= 32768, next.subtreeFlags = 0, next.deletions = null);
          if (!skipSiblings && (unitOfWork = unitOfWork.sibling, null !== unitOfWork)) {
            workInProgress = unitOfWork;
            return;
          }
          workInProgress = unitOfWork = next;
        } while (null !== unitOfWork);
        workInProgressRootExitStatus = 6;
        workInProgress = null;
      }
      function commitRoot(root2, finishedWork, lanes, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes) {
        root2.cancelPendingCommit = null;
        do
          flushPendingEffects();
        while (0 !== pendingEffectsStatus);
        if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
        if (null !== finishedWork) {
          if (finishedWork === root2.current) throw Error(formatProdErrorMessage(177));
          didIncludeRenderPhaseUpdate = finishedWork.lanes | finishedWork.childLanes;
          didIncludeRenderPhaseUpdate |= concurrentlyUpdatedLanes;
          markRootFinished(
            root2,
            lanes,
            didIncludeRenderPhaseUpdate,
            spawnedLane,
            updatedLanes,
            suspendedRetryLanes
          );
          root2 === workInProgressRoot && (workInProgress = workInProgressRoot = null, workInProgressRootRenderLanes = 0);
          pendingFinishedWork = finishedWork;
          pendingEffectsRoot = root2;
          pendingEffectsLanes = lanes;
          pendingEffectsRemainingLanes = didIncludeRenderPhaseUpdate;
          pendingPassiveTransitions = transitions;
          pendingRecoverableErrors = recoverableErrors;
          0 !== (finishedWork.subtreeFlags & 10256) || 0 !== (finishedWork.flags & 10256) ? (root2.callbackNode = null, root2.callbackPriority = 0, scheduleCallback$1(NormalPriority$1, function() {
            flushPassiveEffects();
            return null;
          })) : (root2.callbackNode = null, root2.callbackPriority = 0);
          recoverableErrors = 0 !== (finishedWork.flags & 13878);
          if (0 !== (finishedWork.subtreeFlags & 13878) || recoverableErrors) {
            recoverableErrors = ReactSharedInternals.T;
            ReactSharedInternals.T = null;
            transitions = ReactDOMSharedInternals.p;
            ReactDOMSharedInternals.p = 2;
            spawnedLane = executionContext;
            executionContext |= 4;
            try {
              commitBeforeMutationEffects(root2, finishedWork, lanes);
            } finally {
              executionContext = spawnedLane, ReactDOMSharedInternals.p = transitions, ReactSharedInternals.T = recoverableErrors;
            }
          }
          pendingEffectsStatus = 1;
          flushMutationEffects();
          flushLayoutEffects();
          flushSpawnedWork();
        }
      }
      function flushMutationEffects() {
        if (1 === pendingEffectsStatus) {
          pendingEffectsStatus = 0;
          var root2 = pendingEffectsRoot, finishedWork = pendingFinishedWork, rootMutationHasEffect = 0 !== (finishedWork.flags & 13878);
          if (0 !== (finishedWork.subtreeFlags & 13878) || rootMutationHasEffect) {
            rootMutationHasEffect = ReactSharedInternals.T;
            ReactSharedInternals.T = null;
            var previousPriority = ReactDOMSharedInternals.p;
            ReactDOMSharedInternals.p = 2;
            var prevExecutionContext = executionContext;
            executionContext |= 4;
            try {
              commitMutationEffectsOnFiber(finishedWork, root2);
              var priorSelectionInformation = selectionInformation, curFocusedElem = getActiveElementDeep(root2.containerInfo), priorFocusedElem = priorSelectionInformation.focusedElem, priorSelectionRange = priorSelectionInformation.selectionRange;
              if (curFocusedElem !== priorFocusedElem && priorFocusedElem && priorFocusedElem.ownerDocument && containsNode(
                priorFocusedElem.ownerDocument.documentElement,
                priorFocusedElem
              )) {
                if (null !== priorSelectionRange && hasSelectionCapabilities(priorFocusedElem)) {
                  var start = priorSelectionRange.start, end = priorSelectionRange.end;
                  void 0 === end && (end = start);
                  if ("selectionStart" in priorFocusedElem)
                    priorFocusedElem.selectionStart = start, priorFocusedElem.selectionEnd = Math.min(
                      end,
                      priorFocusedElem.value.length
                    );
                  else {
                    var doc = priorFocusedElem.ownerDocument || document, win = doc && doc.defaultView || window;
                    if (win.getSelection) {
                      var selection = win.getSelection(), length = priorFocusedElem.textContent.length, start$jscomp$0 = Math.min(priorSelectionRange.start, length), end$jscomp$0 = void 0 === priorSelectionRange.end ? start$jscomp$0 : Math.min(priorSelectionRange.end, length);
                      !selection.extend && start$jscomp$0 > end$jscomp$0 && (curFocusedElem = end$jscomp$0, end$jscomp$0 = start$jscomp$0, start$jscomp$0 = curFocusedElem);
                      var startMarker = getNodeForCharacterOffset(
                        priorFocusedElem,
                        start$jscomp$0
                      ), endMarker = getNodeForCharacterOffset(
                        priorFocusedElem,
                        end$jscomp$0
                      );
                      if (startMarker && endMarker && (1 !== selection.rangeCount || selection.anchorNode !== startMarker.node || selection.anchorOffset !== startMarker.offset || selection.focusNode !== endMarker.node || selection.focusOffset !== endMarker.offset)) {
                        var range = doc.createRange();
                        range.setStart(startMarker.node, startMarker.offset);
                        selection.removeAllRanges();
                        start$jscomp$0 > end$jscomp$0 ? (selection.addRange(range), selection.extend(endMarker.node, endMarker.offset)) : (range.setEnd(endMarker.node, endMarker.offset), selection.addRange(range));
                      }
                    }
                  }
                }
                doc = [];
                for (selection = priorFocusedElem; selection = selection.parentNode; )
                  1 === selection.nodeType && doc.push({
                    element: selection,
                    left: selection.scrollLeft,
                    top: selection.scrollTop
                  });
                "function" === typeof priorFocusedElem.focus && priorFocusedElem.focus();
                for (priorFocusedElem = 0; priorFocusedElem < doc.length; priorFocusedElem++) {
                  var info = doc[priorFocusedElem];
                  info.element.scrollLeft = info.left;
                  info.element.scrollTop = info.top;
                }
              }
              _enabled = !!eventsEnabled;
              selectionInformation = eventsEnabled = null;
            } finally {
              executionContext = prevExecutionContext, ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = rootMutationHasEffect;
            }
          }
          root2.current = finishedWork;
          pendingEffectsStatus = 2;
        }
      }
      function flushLayoutEffects() {
        if (2 === pendingEffectsStatus) {
          pendingEffectsStatus = 0;
          var root2 = pendingEffectsRoot, finishedWork = pendingFinishedWork, rootHasLayoutEffect = 0 !== (finishedWork.flags & 8772);
          if (0 !== (finishedWork.subtreeFlags & 8772) || rootHasLayoutEffect) {
            rootHasLayoutEffect = ReactSharedInternals.T;
            ReactSharedInternals.T = null;
            var previousPriority = ReactDOMSharedInternals.p;
            ReactDOMSharedInternals.p = 2;
            var prevExecutionContext = executionContext;
            executionContext |= 4;
            try {
              commitLayoutEffectOnFiber(root2, finishedWork.alternate, finishedWork);
            } finally {
              executionContext = prevExecutionContext, ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = rootHasLayoutEffect;
            }
          }
          pendingEffectsStatus = 3;
        }
      }
      function flushSpawnedWork() {
        if (4 === pendingEffectsStatus || 3 === pendingEffectsStatus) {
          pendingEffectsStatus = 0;
          requestPaint();
          var root2 = pendingEffectsRoot, finishedWork = pendingFinishedWork, lanes = pendingEffectsLanes, recoverableErrors = pendingRecoverableErrors;
          0 !== (finishedWork.subtreeFlags & 10256) || 0 !== (finishedWork.flags & 10256) ? pendingEffectsStatus = 5 : (pendingEffectsStatus = 0, pendingFinishedWork = pendingEffectsRoot = null, releaseRootPooledCache(root2, root2.pendingLanes));
          var remainingLanes = root2.pendingLanes;
          0 === remainingLanes && (legacyErrorBoundariesThatAlreadyFailed = null);
          lanesToEventPriority(lanes);
          finishedWork = finishedWork.stateNode;
          if (injectedHook && "function" === typeof injectedHook.onCommitFiberRoot)
            try {
              injectedHook.onCommitFiberRoot(
                rendererID,
                finishedWork,
                void 0,
                128 === (finishedWork.current.flags & 128)
              );
            } catch (err) {
            }
          if (null !== recoverableErrors) {
            finishedWork = ReactSharedInternals.T;
            remainingLanes = ReactDOMSharedInternals.p;
            ReactDOMSharedInternals.p = 2;
            ReactSharedInternals.T = null;
            try {
              for (var onRecoverableError = root2.onRecoverableError, i2 = 0; i2 < recoverableErrors.length; i2++) {
                var recoverableError = recoverableErrors[i2];
                onRecoverableError(recoverableError.value, {
                  componentStack: recoverableError.stack
                });
              }
            } finally {
              ReactSharedInternals.T = finishedWork, ReactDOMSharedInternals.p = remainingLanes;
            }
          }
          0 !== (pendingEffectsLanes & 3) && flushPendingEffects();
          ensureRootIsScheduled(root2);
          remainingLanes = root2.pendingLanes;
          0 !== (lanes & 261930) && 0 !== (remainingLanes & 42) ? root2 === rootWithNestedUpdates ? nestedUpdateCount++ : (nestedUpdateCount = 0, rootWithNestedUpdates = root2) : nestedUpdateCount = 0;
          flushSyncWorkAcrossRoots_impl(0, false);
        }
      }
      function releaseRootPooledCache(root2, remainingLanes) {
        0 === (root2.pooledCacheLanes &= remainingLanes) && (remainingLanes = root2.pooledCache, null != remainingLanes && (root2.pooledCache = null, releaseCache(remainingLanes)));
      }
      function flushPendingEffects() {
        flushMutationEffects();
        flushLayoutEffects();
        flushSpawnedWork();
        return flushPassiveEffects();
      }
      function flushPassiveEffects() {
        if (5 !== pendingEffectsStatus) return false;
        var root2 = pendingEffectsRoot, remainingLanes = pendingEffectsRemainingLanes;
        pendingEffectsRemainingLanes = 0;
        var renderPriority = lanesToEventPriority(pendingEffectsLanes), prevTransition = ReactSharedInternals.T, previousPriority = ReactDOMSharedInternals.p;
        try {
          ReactDOMSharedInternals.p = 32 > renderPriority ? 32 : renderPriority;
          ReactSharedInternals.T = null;
          renderPriority = pendingPassiveTransitions;
          pendingPassiveTransitions = null;
          var root$jscomp$0 = pendingEffectsRoot, lanes = pendingEffectsLanes;
          pendingEffectsStatus = 0;
          pendingFinishedWork = pendingEffectsRoot = null;
          pendingEffectsLanes = 0;
          if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(331));
          var prevExecutionContext = executionContext;
          executionContext |= 4;
          commitPassiveUnmountOnFiber(root$jscomp$0.current);
          commitPassiveMountOnFiber(
            root$jscomp$0,
            root$jscomp$0.current,
            lanes,
            renderPriority
          );
          executionContext = prevExecutionContext;
          flushSyncWorkAcrossRoots_impl(0, false);
          if (injectedHook && "function" === typeof injectedHook.onPostCommitFiberRoot)
            try {
              injectedHook.onPostCommitFiberRoot(rendererID, root$jscomp$0);
            } catch (err) {
            }
          return true;
        } finally {
          ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition, releaseRootPooledCache(root2, remainingLanes);
        }
      }
      function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
        sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
        sourceFiber = createRootErrorUpdate(rootFiber.stateNode, sourceFiber, 2);
        rootFiber = enqueueUpdate(rootFiber, sourceFiber, 2);
        null !== rootFiber && (markRootUpdated$1(rootFiber, 2), ensureRootIsScheduled(rootFiber));
      }
      function captureCommitPhaseError(sourceFiber, nearestMountedAncestor, error) {
        if (3 === sourceFiber.tag)
          captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
        else
          for (; null !== nearestMountedAncestor; ) {
            if (3 === nearestMountedAncestor.tag) {
              captureCommitPhaseErrorOnRoot(
                nearestMountedAncestor,
                sourceFiber,
                error
              );
              break;
            } else if (1 === nearestMountedAncestor.tag) {
              var instance = nearestMountedAncestor.stateNode;
              if ("function" === typeof nearestMountedAncestor.type.getDerivedStateFromError || "function" === typeof instance.componentDidCatch && (null === legacyErrorBoundariesThatAlreadyFailed || !legacyErrorBoundariesThatAlreadyFailed.has(instance))) {
                sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
                error = createClassErrorUpdate(2);
                instance = enqueueUpdate(nearestMountedAncestor, error, 2);
                null !== instance && (initializeClassErrorUpdate(
                  error,
                  instance,
                  nearestMountedAncestor,
                  sourceFiber
                ), markRootUpdated$1(instance, 2), ensureRootIsScheduled(instance));
                break;
              }
            }
            nearestMountedAncestor = nearestMountedAncestor.return;
          }
      }
      function attachPingListener(root2, wakeable, lanes) {
        var pingCache = root2.pingCache;
        if (null === pingCache) {
          pingCache = root2.pingCache = new PossiblyWeakMap();
          var threadIDs = /* @__PURE__ */ new Set();
          pingCache.set(wakeable, threadIDs);
        } else
          threadIDs = pingCache.get(wakeable), void 0 === threadIDs && (threadIDs = /* @__PURE__ */ new Set(), pingCache.set(wakeable, threadIDs));
        threadIDs.has(lanes) || (workInProgressRootDidAttachPingListener = true, threadIDs.add(lanes), root2 = pingSuspendedRoot.bind(null, root2, wakeable, lanes), wakeable.then(root2, root2));
      }
      function pingSuspendedRoot(root2, wakeable, pingedLanes) {
        var pingCache = root2.pingCache;
        null !== pingCache && pingCache.delete(wakeable);
        root2.pingedLanes |= root2.suspendedLanes & pingedLanes;
        root2.warmLanes &= ~pingedLanes;
        workInProgressRoot === root2 && (workInProgressRootRenderLanes & pingedLanes) === pingedLanes && (4 === workInProgressRootExitStatus || 3 === workInProgressRootExitStatus && (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes && 300 > now() - globalMostRecentFallbackTime ? 0 === (executionContext & 2) && prepareFreshStack(root2, 0) : workInProgressRootPingedLanes |= pingedLanes, workInProgressSuspendedRetryLanes === workInProgressRootRenderLanes && (workInProgressSuspendedRetryLanes = 0));
        ensureRootIsScheduled(root2);
      }
      function retryTimedOutBoundary(boundaryFiber, retryLane) {
        0 === retryLane && (retryLane = claimNextRetryLane());
        boundaryFiber = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);
        null !== boundaryFiber && (markRootUpdated$1(boundaryFiber, retryLane), ensureRootIsScheduled(boundaryFiber));
      }
      function retryDehydratedSuspenseBoundary(boundaryFiber) {
        var suspenseState = boundaryFiber.memoizedState, retryLane = 0;
        null !== suspenseState && (retryLane = suspenseState.retryLane);
        retryTimedOutBoundary(boundaryFiber, retryLane);
      }
      function resolveRetryWakeable(boundaryFiber, wakeable) {
        var retryLane = 0;
        switch (boundaryFiber.tag) {
          case 31:
          case 13:
            var retryCache = boundaryFiber.stateNode;
            var suspenseState = boundaryFiber.memoizedState;
            null !== suspenseState && (retryLane = suspenseState.retryLane);
            break;
          case 19:
            retryCache = boundaryFiber.stateNode;
            break;
          case 22:
            retryCache = boundaryFiber.stateNode._retryCache;
            break;
          default:
            throw Error(formatProdErrorMessage(314));
        }
        null !== retryCache && retryCache.delete(wakeable);
        retryTimedOutBoundary(boundaryFiber, retryLane);
      }
      function scheduleCallback$1(priorityLevel, callback) {
        return scheduleCallback$3(priorityLevel, callback);
      }
      var firstScheduledRoot = null;
      var lastScheduledRoot = null;
      var didScheduleMicrotask = false;
      var mightHavePendingSyncWork = false;
      var isFlushingWork = false;
      var currentEventTransitionLane = 0;
      function ensureRootIsScheduled(root2) {
        root2 !== lastScheduledRoot && null === root2.next && (null === lastScheduledRoot ? firstScheduledRoot = lastScheduledRoot = root2 : lastScheduledRoot = lastScheduledRoot.next = root2);
        mightHavePendingSyncWork = true;
        didScheduleMicrotask || (didScheduleMicrotask = true, scheduleImmediateRootScheduleTask());
      }
      function flushSyncWorkAcrossRoots_impl(syncTransitionLanes, onlyLegacy) {
        if (!isFlushingWork && mightHavePendingSyncWork) {
          isFlushingWork = true;
          do {
            var didPerformSomeWork = false;
            for (var root$170 = firstScheduledRoot; null !== root$170; ) {
              if (!onlyLegacy)
                if (0 !== syncTransitionLanes) {
                  var pendingLanes = root$170.pendingLanes;
                  if (0 === pendingLanes) var JSCompiler_inline_result = 0;
                  else {
                    var suspendedLanes = root$170.suspendedLanes, pingedLanes = root$170.pingedLanes;
                    JSCompiler_inline_result = (1 << 31 - clz32(42 | syncTransitionLanes) + 1) - 1;
                    JSCompiler_inline_result &= pendingLanes & ~(suspendedLanes & ~pingedLanes);
                    JSCompiler_inline_result = JSCompiler_inline_result & 201326741 ? JSCompiler_inline_result & 201326741 | 1 : JSCompiler_inline_result ? JSCompiler_inline_result | 2 : 0;
                  }
                  0 !== JSCompiler_inline_result && (didPerformSomeWork = true, performSyncWorkOnRoot(root$170, JSCompiler_inline_result));
                } else
                  JSCompiler_inline_result = workInProgressRootRenderLanes, JSCompiler_inline_result = getNextLanes(
                    root$170,
                    root$170 === workInProgressRoot ? JSCompiler_inline_result : 0,
                    null !== root$170.cancelPendingCommit || -1 !== root$170.timeoutHandle
                  ), 0 === (JSCompiler_inline_result & 3) || checkIfRootIsPrerendering(root$170, JSCompiler_inline_result) || (didPerformSomeWork = true, performSyncWorkOnRoot(root$170, JSCompiler_inline_result));
              root$170 = root$170.next;
            }
          } while (didPerformSomeWork);
          isFlushingWork = false;
        }
      }
      function processRootScheduleInImmediateTask() {
        processRootScheduleInMicrotask();
      }
      function processRootScheduleInMicrotask() {
        mightHavePendingSyncWork = didScheduleMicrotask = false;
        var syncTransitionLanes = 0;
        0 !== currentEventTransitionLane && shouldAttemptEagerTransition() && (syncTransitionLanes = currentEventTransitionLane);
        for (var currentTime = now(), prev = null, root2 = firstScheduledRoot; null !== root2; ) {
          var next = root2.next, nextLanes = scheduleTaskForRootDuringMicrotask(root2, currentTime);
          if (0 === nextLanes)
            root2.next = null, null === prev ? firstScheduledRoot = next : prev.next = next, null === next && (lastScheduledRoot = prev);
          else if (prev = root2, 0 !== syncTransitionLanes || 0 !== (nextLanes & 3))
            mightHavePendingSyncWork = true;
          root2 = next;
        }
        0 !== pendingEffectsStatus && 5 !== pendingEffectsStatus || flushSyncWorkAcrossRoots_impl(syncTransitionLanes, false);
        0 !== currentEventTransitionLane && (currentEventTransitionLane = 0);
      }
      function scheduleTaskForRootDuringMicrotask(root2, currentTime) {
        for (var suspendedLanes = root2.suspendedLanes, pingedLanes = root2.pingedLanes, expirationTimes = root2.expirationTimes, lanes = root2.pendingLanes & -62914561; 0 < lanes; ) {
          var index$5 = 31 - clz32(lanes), lane = 1 << index$5, expirationTime = expirationTimes[index$5];
          if (-1 === expirationTime) {
            if (0 === (lane & suspendedLanes) || 0 !== (lane & pingedLanes))
              expirationTimes[index$5] = computeExpirationTime(lane, currentTime);
          } else expirationTime <= currentTime && (root2.expiredLanes |= lane);
          lanes &= ~lane;
        }
        currentTime = workInProgressRoot;
        suspendedLanes = workInProgressRootRenderLanes;
        suspendedLanes = getNextLanes(
          root2,
          root2 === currentTime ? suspendedLanes : 0,
          null !== root2.cancelPendingCommit || -1 !== root2.timeoutHandle
        );
        pingedLanes = root2.callbackNode;
        if (0 === suspendedLanes || root2 === currentTime && (2 === workInProgressSuspendedReason || 9 === workInProgressSuspendedReason) || null !== root2.cancelPendingCommit)
          return null !== pingedLanes && null !== pingedLanes && cancelCallback$1(pingedLanes), root2.callbackNode = null, root2.callbackPriority = 0;
        if (0 === (suspendedLanes & 3) || checkIfRootIsPrerendering(root2, suspendedLanes)) {
          currentTime = suspendedLanes & -suspendedLanes;
          if (currentTime === root2.callbackPriority) return currentTime;
          null !== pingedLanes && cancelCallback$1(pingedLanes);
          switch (lanesToEventPriority(suspendedLanes)) {
            case 2:
            case 8:
              suspendedLanes = UserBlockingPriority;
              break;
            case 32:
              suspendedLanes = NormalPriority$1;
              break;
            case 268435456:
              suspendedLanes = IdlePriority;
              break;
            default:
              suspendedLanes = NormalPriority$1;
          }
          pingedLanes = performWorkOnRootViaSchedulerTask.bind(null, root2);
          suspendedLanes = scheduleCallback$3(suspendedLanes, pingedLanes);
          root2.callbackPriority = currentTime;
          root2.callbackNode = suspendedLanes;
          return currentTime;
        }
        null !== pingedLanes && null !== pingedLanes && cancelCallback$1(pingedLanes);
        root2.callbackPriority = 2;
        root2.callbackNode = null;
        return 2;
      }
      function performWorkOnRootViaSchedulerTask(root2, didTimeout) {
        if (0 !== pendingEffectsStatus && 5 !== pendingEffectsStatus)
          return root2.callbackNode = null, root2.callbackPriority = 0, null;
        var originalCallbackNode = root2.callbackNode;
        if (flushPendingEffects() && root2.callbackNode !== originalCallbackNode)
          return null;
        var workInProgressRootRenderLanes$jscomp$0 = workInProgressRootRenderLanes;
        workInProgressRootRenderLanes$jscomp$0 = getNextLanes(
          root2,
          root2 === workInProgressRoot ? workInProgressRootRenderLanes$jscomp$0 : 0,
          null !== root2.cancelPendingCommit || -1 !== root2.timeoutHandle
        );
        if (0 === workInProgressRootRenderLanes$jscomp$0) return null;
        performWorkOnRoot(root2, workInProgressRootRenderLanes$jscomp$0, didTimeout);
        scheduleTaskForRootDuringMicrotask(root2, now());
        return null != root2.callbackNode && root2.callbackNode === originalCallbackNode ? performWorkOnRootViaSchedulerTask.bind(null, root2) : null;
      }
      function performSyncWorkOnRoot(root2, lanes) {
        if (flushPendingEffects()) return null;
        performWorkOnRoot(root2, lanes, true);
      }
      function scheduleImmediateRootScheduleTask() {
        scheduleMicrotask(function() {
          0 !== (executionContext & 6) ? scheduleCallback$3(
            ImmediatePriority,
            processRootScheduleInImmediateTask
          ) : processRootScheduleInMicrotask();
        });
      }
      function requestTransitionLane() {
        if (0 === currentEventTransitionLane) {
          var actionScopeLane = currentEntangledLane;
          0 === actionScopeLane && (actionScopeLane = nextTransitionUpdateLane, nextTransitionUpdateLane <<= 1, 0 === (nextTransitionUpdateLane & 261888) && (nextTransitionUpdateLane = 256));
          currentEventTransitionLane = actionScopeLane;
        }
        return currentEventTransitionLane;
      }
      function coerceFormActionProp(actionProp) {
        return null == actionProp || "symbol" === typeof actionProp || "boolean" === typeof actionProp ? null : "function" === typeof actionProp ? actionProp : sanitizeURL("" + actionProp);
      }
      function createFormDataWithSubmitter(form, submitter) {
        var temp = submitter.ownerDocument.createElement("input");
        temp.name = submitter.name;
        temp.value = submitter.value;
        form.id && temp.setAttribute("form", form.id);
        submitter.parentNode.insertBefore(temp, submitter);
        form = new FormData(form);
        temp.parentNode.removeChild(temp);
        return form;
      }
      function extractEvents$1(dispatchQueue, domEventName, maybeTargetInst, nativeEvent, nativeEventTarget) {
        if ("submit" === domEventName && maybeTargetInst && maybeTargetInst.stateNode === nativeEventTarget) {
          var action = coerceFormActionProp(
            (nativeEventTarget[internalPropsKey] || null).action
          ), submitter = nativeEvent.submitter;
          submitter && (domEventName = (domEventName = submitter[internalPropsKey] || null) ? coerceFormActionProp(domEventName.formAction) : submitter.getAttribute("formAction"), null !== domEventName && (action = domEventName, submitter = null));
          var event = new SyntheticEvent(
            "action",
            "action",
            null,
            nativeEvent,
            nativeEventTarget
          );
          dispatchQueue.push({
            event,
            listeners: [
              {
                instance: null,
                listener: function() {
                  if (nativeEvent.defaultPrevented) {
                    if (0 !== currentEventTransitionLane) {
                      var formData = submitter ? createFormDataWithSubmitter(nativeEventTarget, submitter) : new FormData(nativeEventTarget);
                      startHostTransition(
                        maybeTargetInst,
                        {
                          pending: true,
                          data: formData,
                          method: nativeEventTarget.method,
                          action
                        },
                        null,
                        formData
                      );
                    }
                  } else
                    "function" === typeof action && (event.preventDefault(), formData = submitter ? createFormDataWithSubmitter(nativeEventTarget, submitter) : new FormData(nativeEventTarget), startHostTransition(
                      maybeTargetInst,
                      {
                        pending: true,
                        data: formData,
                        method: nativeEventTarget.method,
                        action
                      },
                      action,
                      formData
                    ));
                },
                currentTarget: nativeEventTarget
              }
            ]
          });
        }
      }
      for (i$jscomp$inline_1577 = 0; i$jscomp$inline_1577 < simpleEventPluginEvents.length; i$jscomp$inline_1577++) {
        eventName$jscomp$inline_1578 = simpleEventPluginEvents[i$jscomp$inline_1577], domEventName$jscomp$inline_1579 = eventName$jscomp$inline_1578.toLowerCase(), capitalizedEvent$jscomp$inline_1580 = eventName$jscomp$inline_1578[0].toUpperCase() + eventName$jscomp$inline_1578.slice(1);
        registerSimpleEvent(
          domEventName$jscomp$inline_1579,
          "on" + capitalizedEvent$jscomp$inline_1580
        );
      }
      var eventName$jscomp$inline_1578;
      var domEventName$jscomp$inline_1579;
      var capitalizedEvent$jscomp$inline_1580;
      var i$jscomp$inline_1577;
      registerSimpleEvent(ANIMATION_END, "onAnimationEnd");
      registerSimpleEvent(ANIMATION_ITERATION, "onAnimationIteration");
      registerSimpleEvent(ANIMATION_START, "onAnimationStart");
      registerSimpleEvent("dblclick", "onDoubleClick");
      registerSimpleEvent("focusin", "onFocus");
      registerSimpleEvent("focusout", "onBlur");
      registerSimpleEvent(TRANSITION_RUN, "onTransitionRun");
      registerSimpleEvent(TRANSITION_START, "onTransitionStart");
      registerSimpleEvent(TRANSITION_CANCEL, "onTransitionCancel");
      registerSimpleEvent(TRANSITION_END, "onTransitionEnd");
      registerDirectEvent("onMouseEnter", ["mouseout", "mouseover"]);
      registerDirectEvent("onMouseLeave", ["mouseout", "mouseover"]);
      registerDirectEvent("onPointerEnter", ["pointerout", "pointerover"]);
      registerDirectEvent("onPointerLeave", ["pointerout", "pointerover"]);
      registerTwoPhaseEvent(
        "onChange",
        "change click focusin focusout input keydown keyup selectionchange".split(" ")
      );
      registerTwoPhaseEvent(
        "onSelect",
        "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
          " "
        )
      );
      registerTwoPhaseEvent("onBeforeInput", [
        "compositionend",
        "keypress",
        "textInput",
        "paste"
      ]);
      registerTwoPhaseEvent(
        "onCompositionEnd",
        "compositionend focusout keydown keypress keyup mousedown".split(" ")
      );
      registerTwoPhaseEvent(
        "onCompositionStart",
        "compositionstart focusout keydown keypress keyup mousedown".split(" ")
      );
      registerTwoPhaseEvent(
        "onCompositionUpdate",
        "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
      );
      var mediaEventTypes = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
        " "
      );
      var nonDelegatedEvents = new Set(
        "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(mediaEventTypes)
      );
      function processDispatchQueue(dispatchQueue, eventSystemFlags) {
        eventSystemFlags = 0 !== (eventSystemFlags & 4);
        for (var i2 = 0; i2 < dispatchQueue.length; i2++) {
          var _dispatchQueue$i = dispatchQueue[i2], event = _dispatchQueue$i.event;
          _dispatchQueue$i = _dispatchQueue$i.listeners;
          a: {
            var previousInstance = void 0;
            if (eventSystemFlags)
              for (var i$jscomp$0 = _dispatchQueue$i.length - 1; 0 <= i$jscomp$0; i$jscomp$0--) {
                var _dispatchListeners$i = _dispatchQueue$i[i$jscomp$0], instance = _dispatchListeners$i.instance, currentTarget = _dispatchListeners$i.currentTarget;
                _dispatchListeners$i = _dispatchListeners$i.listener;
                if (instance !== previousInstance && event.isPropagationStopped())
                  break a;
                previousInstance = _dispatchListeners$i;
                event.currentTarget = currentTarget;
                try {
                  previousInstance(event);
                } catch (error) {
                  reportGlobalError(error);
                }
                event.currentTarget = null;
                previousInstance = instance;
              }
            else
              for (i$jscomp$0 = 0; i$jscomp$0 < _dispatchQueue$i.length; i$jscomp$0++) {
                _dispatchListeners$i = _dispatchQueue$i[i$jscomp$0];
                instance = _dispatchListeners$i.instance;
                currentTarget = _dispatchListeners$i.currentTarget;
                _dispatchListeners$i = _dispatchListeners$i.listener;
                if (instance !== previousInstance && event.isPropagationStopped())
                  break a;
                previousInstance = _dispatchListeners$i;
                event.currentTarget = currentTarget;
                try {
                  previousInstance(event);
                } catch (error) {
                  reportGlobalError(error);
                }
                event.currentTarget = null;
                previousInstance = instance;
              }
          }
        }
      }
      function listenToNonDelegatedEvent(domEventName, targetElement) {
        var JSCompiler_inline_result = targetElement[internalEventHandlersKey];
        void 0 === JSCompiler_inline_result && (JSCompiler_inline_result = targetElement[internalEventHandlersKey] = /* @__PURE__ */ new Set());
        var listenerSetKey = domEventName + "__bubble";
        JSCompiler_inline_result.has(listenerSetKey) || (addTrappedEventListener(targetElement, domEventName, 2, false), JSCompiler_inline_result.add(listenerSetKey));
      }
      function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
        var eventSystemFlags = 0;
        isCapturePhaseListener && (eventSystemFlags |= 4);
        addTrappedEventListener(
          target,
          domEventName,
          eventSystemFlags,
          isCapturePhaseListener
        );
      }
      var listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
      function listenToAllSupportedEvents(rootContainerElement) {
        if (!rootContainerElement[listeningMarker]) {
          rootContainerElement[listeningMarker] = true;
          allNativeEvents.forEach(function(domEventName) {
            "selectionchange" !== domEventName && (nonDelegatedEvents.has(domEventName) || listenToNativeEvent(domEventName, false, rootContainerElement), listenToNativeEvent(domEventName, true, rootContainerElement));
          });
          var ownerDocument = 9 === rootContainerElement.nodeType ? rootContainerElement : rootContainerElement.ownerDocument;
          null === ownerDocument || ownerDocument[listeningMarker] || (ownerDocument[listeningMarker] = true, listenToNativeEvent("selectionchange", false, ownerDocument));
        }
      }
      function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener) {
        switch (getEventPriority(domEventName)) {
          case 2:
            var listenerWrapper = dispatchDiscreteEvent;
            break;
          case 8:
            listenerWrapper = dispatchContinuousEvent;
            break;
          default:
            listenerWrapper = dispatchEvent;
        }
        eventSystemFlags = listenerWrapper.bind(
          null,
          domEventName,
          eventSystemFlags,
          targetContainer
        );
        listenerWrapper = void 0;
        !passiveBrowserEventsSupported || "touchstart" !== domEventName && "touchmove" !== domEventName && "wheel" !== domEventName || (listenerWrapper = true);
        isCapturePhaseListener ? void 0 !== listenerWrapper ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
          capture: true,
          passive: listenerWrapper
        }) : targetContainer.addEventListener(domEventName, eventSystemFlags, true) : void 0 !== listenerWrapper ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
          passive: listenerWrapper
        }) : targetContainer.addEventListener(domEventName, eventSystemFlags, false);
      }
      function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst$jscomp$0, targetContainer) {
        var ancestorInst = targetInst$jscomp$0;
        if (0 === (eventSystemFlags & 1) && 0 === (eventSystemFlags & 2) && null !== targetInst$jscomp$0)
          a: for (; ; ) {
            if (null === targetInst$jscomp$0) return;
            var nodeTag = targetInst$jscomp$0.tag;
            if (3 === nodeTag || 4 === nodeTag) {
              var container = targetInst$jscomp$0.stateNode.containerInfo;
              if (container === targetContainer) break;
              if (4 === nodeTag)
                for (nodeTag = targetInst$jscomp$0.return; null !== nodeTag; ) {
                  var grandTag = nodeTag.tag;
                  if ((3 === grandTag || 4 === grandTag) && nodeTag.stateNode.containerInfo === targetContainer)
                    return;
                  nodeTag = nodeTag.return;
                }
              for (; null !== container; ) {
                nodeTag = getClosestInstanceFromNode(container);
                if (null === nodeTag) return;
                grandTag = nodeTag.tag;
                if (5 === grandTag || 6 === grandTag || 26 === grandTag || 27 === grandTag) {
                  targetInst$jscomp$0 = ancestorInst = nodeTag;
                  continue a;
                }
                container = container.parentNode;
              }
            }
            targetInst$jscomp$0 = targetInst$jscomp$0.return;
          }
        batchedUpdates$1(function() {
          var targetInst = ancestorInst, nativeEventTarget = getEventTarget(nativeEvent), dispatchQueue = [];
          a: {
            var reactName = topLevelEventsToReactNames.get(domEventName);
            if (void 0 !== reactName) {
              var SyntheticEventCtor = SyntheticEvent, reactEventType = domEventName;
              switch (domEventName) {
                case "keypress":
                  if (0 === getEventCharCode(nativeEvent)) break a;
                case "keydown":
                case "keyup":
                  SyntheticEventCtor = SyntheticKeyboardEvent;
                  break;
                case "focusin":
                  reactEventType = "focus";
                  SyntheticEventCtor = SyntheticFocusEvent;
                  break;
                case "focusout":
                  reactEventType = "blur";
                  SyntheticEventCtor = SyntheticFocusEvent;
                  break;
                case "beforeblur":
                case "afterblur":
                  SyntheticEventCtor = SyntheticFocusEvent;
                  break;
                case "click":
                  if (2 === nativeEvent.button) break a;
                case "auxclick":
                case "dblclick":
                case "mousedown":
                case "mousemove":
                case "mouseup":
                case "mouseout":
                case "mouseover":
                case "contextmenu":
                  SyntheticEventCtor = SyntheticMouseEvent;
                  break;
                case "drag":
                case "dragend":
                case "dragenter":
                case "dragexit":
                case "dragleave":
                case "dragover":
                case "dragstart":
                case "drop":
                  SyntheticEventCtor = SyntheticDragEvent;
                  break;
                case "touchcancel":
                case "touchend":
                case "touchmove":
                case "touchstart":
                  SyntheticEventCtor = SyntheticTouchEvent;
                  break;
                case ANIMATION_END:
                case ANIMATION_ITERATION:
                case ANIMATION_START:
                  SyntheticEventCtor = SyntheticAnimationEvent;
                  break;
                case TRANSITION_END:
                  SyntheticEventCtor = SyntheticTransitionEvent;
                  break;
                case "scroll":
                case "scrollend":
                  SyntheticEventCtor = SyntheticUIEvent;
                  break;
                case "wheel":
                  SyntheticEventCtor = SyntheticWheelEvent;
                  break;
                case "copy":
                case "cut":
                case "paste":
                  SyntheticEventCtor = SyntheticClipboardEvent;
                  break;
                case "gotpointercapture":
                case "lostpointercapture":
                case "pointercancel":
                case "pointerdown":
                case "pointermove":
                case "pointerout":
                case "pointerover":
                case "pointerup":
                  SyntheticEventCtor = SyntheticPointerEvent;
                  break;
                case "toggle":
                case "beforetoggle":
                  SyntheticEventCtor = SyntheticToggleEvent;
              }
              var inCapturePhase = 0 !== (eventSystemFlags & 4), accumulateTargetOnly = !inCapturePhase && ("scroll" === domEventName || "scrollend" === domEventName), reactEventName = inCapturePhase ? null !== reactName ? reactName + "Capture" : null : reactName;
              inCapturePhase = [];
              for (var instance = targetInst, lastHostComponent; null !== instance; ) {
                var _instance = instance;
                lastHostComponent = _instance.stateNode;
                _instance = _instance.tag;
                5 !== _instance && 26 !== _instance && 27 !== _instance || null === lastHostComponent || null === reactEventName || (_instance = getListener(instance, reactEventName), null != _instance && inCapturePhase.push(
                  createDispatchListener(instance, _instance, lastHostComponent)
                ));
                if (accumulateTargetOnly) break;
                instance = instance.return;
              }
              0 < inCapturePhase.length && (reactName = new SyntheticEventCtor(
                reactName,
                reactEventType,
                null,
                nativeEvent,
                nativeEventTarget
              ), dispatchQueue.push({ event: reactName, listeners: inCapturePhase }));
            }
          }
          if (0 === (eventSystemFlags & 7)) {
            a: {
              reactName = "mouseover" === domEventName || "pointerover" === domEventName;
              SyntheticEventCtor = "mouseout" === domEventName || "pointerout" === domEventName;
              if (reactName && nativeEvent !== currentReplayingEvent && (reactEventType = nativeEvent.relatedTarget || nativeEvent.fromElement) && (getClosestInstanceFromNode(reactEventType) || reactEventType[internalContainerInstanceKey]))
                break a;
              if (SyntheticEventCtor || reactName) {
                reactName = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget : (reactName = nativeEventTarget.ownerDocument) ? reactName.defaultView || reactName.parentWindow : window;
                if (SyntheticEventCtor) {
                  if (reactEventType = nativeEvent.relatedTarget || nativeEvent.toElement, SyntheticEventCtor = targetInst, reactEventType = reactEventType ? getClosestInstanceFromNode(reactEventType) : null, null !== reactEventType && (accumulateTargetOnly = getNearestMountedFiber(reactEventType), inCapturePhase = reactEventType.tag, reactEventType !== accumulateTargetOnly || 5 !== inCapturePhase && 27 !== inCapturePhase && 6 !== inCapturePhase))
                    reactEventType = null;
                } else SyntheticEventCtor = null, reactEventType = targetInst;
                if (SyntheticEventCtor !== reactEventType) {
                  inCapturePhase = SyntheticMouseEvent;
                  _instance = "onMouseLeave";
                  reactEventName = "onMouseEnter";
                  instance = "mouse";
                  if ("pointerout" === domEventName || "pointerover" === domEventName)
                    inCapturePhase = SyntheticPointerEvent, _instance = "onPointerLeave", reactEventName = "onPointerEnter", instance = "pointer";
                  accumulateTargetOnly = null == SyntheticEventCtor ? reactName : getNodeFromInstance(SyntheticEventCtor);
                  lastHostComponent = null == reactEventType ? reactName : getNodeFromInstance(reactEventType);
                  reactName = new inCapturePhase(
                    _instance,
                    instance + "leave",
                    SyntheticEventCtor,
                    nativeEvent,
                    nativeEventTarget
                  );
                  reactName.target = accumulateTargetOnly;
                  reactName.relatedTarget = lastHostComponent;
                  _instance = null;
                  getClosestInstanceFromNode(nativeEventTarget) === targetInst && (inCapturePhase = new inCapturePhase(
                    reactEventName,
                    instance + "enter",
                    reactEventType,
                    nativeEvent,
                    nativeEventTarget
                  ), inCapturePhase.target = lastHostComponent, inCapturePhase.relatedTarget = accumulateTargetOnly, _instance = inCapturePhase);
                  accumulateTargetOnly = _instance;
                  if (SyntheticEventCtor && reactEventType)
                    b: {
                      inCapturePhase = getParent;
                      reactEventName = SyntheticEventCtor;
                      instance = reactEventType;
                      lastHostComponent = 0;
                      for (_instance = reactEventName; _instance; _instance = inCapturePhase(_instance))
                        lastHostComponent++;
                      _instance = 0;
                      for (var tempB = instance; tempB; tempB = inCapturePhase(tempB))
                        _instance++;
                      for (; 0 < lastHostComponent - _instance; )
                        reactEventName = inCapturePhase(reactEventName), lastHostComponent--;
                      for (; 0 < _instance - lastHostComponent; )
                        instance = inCapturePhase(instance), _instance--;
                      for (; lastHostComponent--; ) {
                        if (reactEventName === instance || null !== instance && reactEventName === instance.alternate) {
                          inCapturePhase = reactEventName;
                          break b;
                        }
                        reactEventName = inCapturePhase(reactEventName);
                        instance = inCapturePhase(instance);
                      }
                      inCapturePhase = null;
                    }
                  else inCapturePhase = null;
                  null !== SyntheticEventCtor && accumulateEnterLeaveListenersForEvent(
                    dispatchQueue,
                    reactName,
                    SyntheticEventCtor,
                    inCapturePhase,
                    false
                  );
                  null !== reactEventType && null !== accumulateTargetOnly && accumulateEnterLeaveListenersForEvent(
                    dispatchQueue,
                    accumulateTargetOnly,
                    reactEventType,
                    inCapturePhase,
                    true
                  );
                }
              }
            }
            a: {
              reactName = targetInst ? getNodeFromInstance(targetInst) : window;
              SyntheticEventCtor = reactName.nodeName && reactName.nodeName.toLowerCase();
              if ("select" === SyntheticEventCtor || "input" === SyntheticEventCtor && "file" === reactName.type)
                var getTargetInstFunc = getTargetInstForChangeEvent;
              else if (isTextInputElement(reactName))
                if (isInputEventSupported)
                  getTargetInstFunc = getTargetInstForInputOrChangeEvent;
                else {
                  getTargetInstFunc = getTargetInstForInputEventPolyfill;
                  var handleEventFunc = handleEventsForInputEventPolyfill;
                }
              else
                SyntheticEventCtor = reactName.nodeName, !SyntheticEventCtor || "input" !== SyntheticEventCtor.toLowerCase() || "checkbox" !== reactName.type && "radio" !== reactName.type ? targetInst && isCustomElement(targetInst.elementType) && (getTargetInstFunc = getTargetInstForChangeEvent) : getTargetInstFunc = getTargetInstForClickEvent;
              if (getTargetInstFunc && (getTargetInstFunc = getTargetInstFunc(domEventName, targetInst))) {
                createAndAccumulateChangeEvent(
                  dispatchQueue,
                  getTargetInstFunc,
                  nativeEvent,
                  nativeEventTarget
                );
                break a;
              }
              handleEventFunc && handleEventFunc(domEventName, reactName, targetInst);
              "focusout" === domEventName && targetInst && "number" === reactName.type && null != targetInst.memoizedProps.value && setDefaultValue(reactName, "number", reactName.value);
            }
            handleEventFunc = targetInst ? getNodeFromInstance(targetInst) : window;
            switch (domEventName) {
              case "focusin":
                if (isTextInputElement(handleEventFunc) || "true" === handleEventFunc.contentEditable)
                  activeElement = handleEventFunc, activeElementInst = targetInst, lastSelection = null;
                break;
              case "focusout":
                lastSelection = activeElementInst = activeElement = null;
                break;
              case "mousedown":
                mouseDown = true;
                break;
              case "contextmenu":
              case "mouseup":
              case "dragend":
                mouseDown = false;
                constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
                break;
              case "selectionchange":
                if (skipSelectionChangeEvent) break;
              case "keydown":
              case "keyup":
                constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
            }
            var fallbackData;
            if (canUseCompositionEvent)
              b: {
                switch (domEventName) {
                  case "compositionstart":
                    var eventType = "onCompositionStart";
                    break b;
                  case "compositionend":
                    eventType = "onCompositionEnd";
                    break b;
                  case "compositionupdate":
                    eventType = "onCompositionUpdate";
                    break b;
                }
                eventType = void 0;
              }
            else
              isComposing ? isFallbackCompositionEnd(domEventName, nativeEvent) && (eventType = "onCompositionEnd") : "keydown" === domEventName && 229 === nativeEvent.keyCode && (eventType = "onCompositionStart");
            eventType && (useFallbackCompositionData && "ko" !== nativeEvent.locale && (isComposing || "onCompositionStart" !== eventType ? "onCompositionEnd" === eventType && isComposing && (fallbackData = getData()) : (root = nativeEventTarget, startText = "value" in root ? root.value : root.textContent, isComposing = true)), handleEventFunc = accumulateTwoPhaseListeners(targetInst, eventType), 0 < handleEventFunc.length && (eventType = new SyntheticCompositionEvent(
              eventType,
              domEventName,
              null,
              nativeEvent,
              nativeEventTarget
            ), dispatchQueue.push({ event: eventType, listeners: handleEventFunc }), fallbackData ? eventType.data = fallbackData : (fallbackData = getDataFromCustomEvent(nativeEvent), null !== fallbackData && (eventType.data = fallbackData))));
            if (fallbackData = canUseTextInputEvent ? getNativeBeforeInputChars(domEventName, nativeEvent) : getFallbackBeforeInputChars(domEventName, nativeEvent))
              eventType = accumulateTwoPhaseListeners(targetInst, "onBeforeInput"), 0 < eventType.length && (handleEventFunc = new SyntheticCompositionEvent(
                "onBeforeInput",
                "beforeinput",
                null,
                nativeEvent,
                nativeEventTarget
              ), dispatchQueue.push({
                event: handleEventFunc,
                listeners: eventType
              }), handleEventFunc.data = fallbackData);
            extractEvents$1(
              dispatchQueue,
              domEventName,
              targetInst,
              nativeEvent,
              nativeEventTarget
            );
          }
          processDispatchQueue(dispatchQueue, eventSystemFlags);
        });
      }
      function createDispatchListener(instance, listener, currentTarget) {
        return {
          instance,
          listener,
          currentTarget
        };
      }
      function accumulateTwoPhaseListeners(targetFiber, reactName) {
        for (var captureName = reactName + "Capture", listeners = []; null !== targetFiber; ) {
          var _instance2 = targetFiber, stateNode = _instance2.stateNode;
          _instance2 = _instance2.tag;
          5 !== _instance2 && 26 !== _instance2 && 27 !== _instance2 || null === stateNode || (_instance2 = getListener(targetFiber, captureName), null != _instance2 && listeners.unshift(
            createDispatchListener(targetFiber, _instance2, stateNode)
          ), _instance2 = getListener(targetFiber, reactName), null != _instance2 && listeners.push(
            createDispatchListener(targetFiber, _instance2, stateNode)
          ));
          if (3 === targetFiber.tag) return listeners;
          targetFiber = targetFiber.return;
        }
        return [];
      }
      function getParent(inst) {
        if (null === inst) return null;
        do
          inst = inst.return;
        while (inst && 5 !== inst.tag && 27 !== inst.tag);
        return inst ? inst : null;
      }
      function accumulateEnterLeaveListenersForEvent(dispatchQueue, event, target, common, inCapturePhase) {
        for (var registrationName = event._reactName, listeners = []; null !== target && target !== common; ) {
          var _instance3 = target, alternate = _instance3.alternate, stateNode = _instance3.stateNode;
          _instance3 = _instance3.tag;
          if (null !== alternate && alternate === common) break;
          5 !== _instance3 && 26 !== _instance3 && 27 !== _instance3 || null === stateNode || (alternate = stateNode, inCapturePhase ? (stateNode = getListener(target, registrationName), null != stateNode && listeners.unshift(
            createDispatchListener(target, stateNode, alternate)
          )) : inCapturePhase || (stateNode = getListener(target, registrationName), null != stateNode && listeners.push(
            createDispatchListener(target, stateNode, alternate)
          )));
          target = target.return;
        }
        0 !== listeners.length && dispatchQueue.push({ event, listeners });
      }
      var NORMALIZE_NEWLINES_REGEX = /\r\n?/g;
      var NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;
      function normalizeMarkupForTextOrAttribute(markup) {
        return ("string" === typeof markup ? markup : "" + markup).replace(NORMALIZE_NEWLINES_REGEX, "\n").replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, "");
      }
      function checkForUnmatchedText(serverText, clientText) {
        clientText = normalizeMarkupForTextOrAttribute(clientText);
        return normalizeMarkupForTextOrAttribute(serverText) === clientText ? true : false;
      }
      function setProp(domElement, tag, key, value, props, prevValue) {
        switch (key) {
          case "children":
            "string" === typeof value ? "body" === tag || "textarea" === tag && "" === value || setTextContent(domElement, value) : ("number" === typeof value || "bigint" === typeof value) && "body" !== tag && setTextContent(domElement, "" + value);
            break;
          case "className":
            setValueForKnownAttribute(domElement, "class", value);
            break;
          case "tabIndex":
            setValueForKnownAttribute(domElement, "tabindex", value);
            break;
          case "dir":
          case "role":
          case "viewBox":
          case "width":
          case "height":
            setValueForKnownAttribute(domElement, key, value);
            break;
          case "style":
            setValueForStyles(domElement, value, prevValue);
            break;
          case "data":
            if ("object" !== tag) {
              setValueForKnownAttribute(domElement, "data", value);
              break;
            }
          case "src":
          case "href":
            if ("" === value && ("a" !== tag || "href" !== key)) {
              domElement.removeAttribute(key);
              break;
            }
            if (null == value || "function" === typeof value || "symbol" === typeof value || "boolean" === typeof value) {
              domElement.removeAttribute(key);
              break;
            }
            value = sanitizeURL("" + value);
            domElement.setAttribute(key, value);
            break;
          case "action":
          case "formAction":
            if ("function" === typeof value) {
              domElement.setAttribute(
                key,
                "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
              );
              break;
            } else
              "function" === typeof prevValue && ("formAction" === key ? ("input" !== tag && setProp(domElement, tag, "name", props.name, props, null), setProp(
                domElement,
                tag,
                "formEncType",
                props.formEncType,
                props,
                null
              ), setProp(
                domElement,
                tag,
                "formMethod",
                props.formMethod,
                props,
                null
              ), setProp(
                domElement,
                tag,
                "formTarget",
                props.formTarget,
                props,
                null
              )) : (setProp(domElement, tag, "encType", props.encType, props, null), setProp(domElement, tag, "method", props.method, props, null), setProp(domElement, tag, "target", props.target, props, null)));
            if (null == value || "symbol" === typeof value || "boolean" === typeof value) {
              domElement.removeAttribute(key);
              break;
            }
            value = sanitizeURL("" + value);
            domElement.setAttribute(key, value);
            break;
          case "onClick":
            null != value && (domElement.onclick = noop$1);
            break;
          case "onScroll":
            null != value && listenToNonDelegatedEvent("scroll", domElement);
            break;
          case "onScrollEnd":
            null != value && listenToNonDelegatedEvent("scrollend", domElement);
            break;
          case "dangerouslySetInnerHTML":
            if (null != value) {
              if ("object" !== typeof value || !("__html" in value))
                throw Error(formatProdErrorMessage(61));
              key = value.__html;
              if (null != key) {
                if (null != props.children) throw Error(formatProdErrorMessage(60));
                domElement.innerHTML = key;
              }
            }
            break;
          case "multiple":
            domElement.multiple = value && "function" !== typeof value && "symbol" !== typeof value;
            break;
          case "muted":
            domElement.muted = value && "function" !== typeof value && "symbol" !== typeof value;
            break;
          case "suppressContentEditableWarning":
          case "suppressHydrationWarning":
          case "defaultValue":
          case "defaultChecked":
          case "innerHTML":
          case "ref":
            break;
          case "autoFocus":
            break;
          case "xlinkHref":
            if (null == value || "function" === typeof value || "boolean" === typeof value || "symbol" === typeof value) {
              domElement.removeAttribute("xlink:href");
              break;
            }
            key = sanitizeURL("" + value);
            domElement.setAttributeNS(
              "http://www.w3.org/1999/xlink",
              "xlink:href",
              key
            );
            break;
          case "contentEditable":
          case "spellCheck":
          case "draggable":
          case "value":
          case "autoReverse":
          case "externalResourcesRequired":
          case "focusable":
          case "preserveAlpha":
            null != value && "function" !== typeof value && "symbol" !== typeof value ? domElement.setAttribute(key, "" + value) : domElement.removeAttribute(key);
            break;
          case "inert":
          case "allowFullScreen":
          case "async":
          case "autoPlay":
          case "controls":
          case "default":
          case "defer":
          case "disabled":
          case "disablePictureInPicture":
          case "disableRemotePlayback":
          case "formNoValidate":
          case "hidden":
          case "loop":
          case "noModule":
          case "noValidate":
          case "open":
          case "playsInline":
          case "readOnly":
          case "required":
          case "reversed":
          case "scoped":
          case "seamless":
          case "itemScope":
            value && "function" !== typeof value && "symbol" !== typeof value ? domElement.setAttribute(key, "") : domElement.removeAttribute(key);
            break;
          case "capture":
          case "download":
            true === value ? domElement.setAttribute(key, "") : false !== value && null != value && "function" !== typeof value && "symbol" !== typeof value ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
            break;
          case "cols":
          case "rows":
          case "size":
          case "span":
            null != value && "function" !== typeof value && "symbol" !== typeof value && !isNaN(value) && 1 <= value ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
            break;
          case "rowSpan":
          case "start":
            null == value || "function" === typeof value || "symbol" === typeof value || isNaN(value) ? domElement.removeAttribute(key) : domElement.setAttribute(key, value);
            break;
          case "popover":
            listenToNonDelegatedEvent("beforetoggle", domElement);
            listenToNonDelegatedEvent("toggle", domElement);
            setValueForAttribute(domElement, "popover", value);
            break;
          case "xlinkActuate":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:actuate",
              value
            );
            break;
          case "xlinkArcrole":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:arcrole",
              value
            );
            break;
          case "xlinkRole":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:role",
              value
            );
            break;
          case "xlinkShow":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:show",
              value
            );
            break;
          case "xlinkTitle":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:title",
              value
            );
            break;
          case "xlinkType":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/1999/xlink",
              "xlink:type",
              value
            );
            break;
          case "xmlBase":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/XML/1998/namespace",
              "xml:base",
              value
            );
            break;
          case "xmlLang":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/XML/1998/namespace",
              "xml:lang",
              value
            );
            break;
          case "xmlSpace":
            setValueForNamespacedAttribute(
              domElement,
              "http://www.w3.org/XML/1998/namespace",
              "xml:space",
              value
            );
            break;
          case "is":
            setValueForAttribute(domElement, "is", value);
            break;
          case "innerText":
          case "textContent":
            break;
          default:
            if (!(2 < key.length) || "o" !== key[0] && "O" !== key[0] || "n" !== key[1] && "N" !== key[1])
              key = aliases.get(key) || key, setValueForAttribute(domElement, key, value);
        }
      }
      function setPropOnCustomElement(domElement, tag, key, value, props, prevValue) {
        switch (key) {
          case "style":
            setValueForStyles(domElement, value, prevValue);
            break;
          case "dangerouslySetInnerHTML":
            if (null != value) {
              if ("object" !== typeof value || !("__html" in value))
                throw Error(formatProdErrorMessage(61));
              key = value.__html;
              if (null != key) {
                if (null != props.children) throw Error(formatProdErrorMessage(60));
                domElement.innerHTML = key;
              }
            }
            break;
          case "children":
            "string" === typeof value ? setTextContent(domElement, value) : ("number" === typeof value || "bigint" === typeof value) && setTextContent(domElement, "" + value);
            break;
          case "onScroll":
            null != value && listenToNonDelegatedEvent("scroll", domElement);
            break;
          case "onScrollEnd":
            null != value && listenToNonDelegatedEvent("scrollend", domElement);
            break;
          case "onClick":
            null != value && (domElement.onclick = noop$1);
            break;
          case "suppressContentEditableWarning":
          case "suppressHydrationWarning":
          case "innerHTML":
          case "ref":
            break;
          case "innerText":
          case "textContent":
            break;
          default:
            if (!registrationNameDependencies.hasOwnProperty(key))
              a: {
                if ("o" === key[0] && "n" === key[1] && (props = key.endsWith("Capture"), tag = key.slice(2, props ? key.length - 7 : void 0), prevValue = domElement[internalPropsKey] || null, prevValue = null != prevValue ? prevValue[key] : null, "function" === typeof prevValue && domElement.removeEventListener(tag, prevValue, props), "function" === typeof value)) {
                  "function" !== typeof prevValue && null !== prevValue && (key in domElement ? domElement[key] = null : domElement.hasAttribute(key) && domElement.removeAttribute(key));
                  domElement.addEventListener(tag, value, props);
                  break a;
                }
                key in domElement ? domElement[key] = value : true === value ? domElement.setAttribute(key, "") : setValueForAttribute(domElement, key, value);
              }
        }
      }
      function setInitialProperties(domElement, tag, props) {
        switch (tag) {
          case "div":
          case "span":
          case "svg":
          case "path":
          case "a":
          case "g":
          case "p":
          case "li":
            break;
          case "img":
            listenToNonDelegatedEvent("error", domElement);
            listenToNonDelegatedEvent("load", domElement);
            var hasSrc = false, hasSrcSet = false, propKey;
            for (propKey in props)
              if (props.hasOwnProperty(propKey)) {
                var propValue = props[propKey];
                if (null != propValue)
                  switch (propKey) {
                    case "src":
                      hasSrc = true;
                      break;
                    case "srcSet":
                      hasSrcSet = true;
                      break;
                    case "children":
                    case "dangerouslySetInnerHTML":
                      throw Error(formatProdErrorMessage(137, tag));
                    default:
                      setProp(domElement, tag, propKey, propValue, props, null);
                  }
              }
            hasSrcSet && setProp(domElement, tag, "srcSet", props.srcSet, props, null);
            hasSrc && setProp(domElement, tag, "src", props.src, props, null);
            return;
          case "input":
            listenToNonDelegatedEvent("invalid", domElement);
            var defaultValue = propKey = propValue = hasSrcSet = null, checked = null, defaultChecked = null;
            for (hasSrc in props)
              if (props.hasOwnProperty(hasSrc)) {
                var propValue$184 = props[hasSrc];
                if (null != propValue$184)
                  switch (hasSrc) {
                    case "name":
                      hasSrcSet = propValue$184;
                      break;
                    case "type":
                      propValue = propValue$184;
                      break;
                    case "checked":
                      checked = propValue$184;
                      break;
                    case "defaultChecked":
                      defaultChecked = propValue$184;
                      break;
                    case "value":
                      propKey = propValue$184;
                      break;
                    case "defaultValue":
                      defaultValue = propValue$184;
                      break;
                    case "children":
                    case "dangerouslySetInnerHTML":
                      if (null != propValue$184)
                        throw Error(formatProdErrorMessage(137, tag));
                      break;
                    default:
                      setProp(domElement, tag, hasSrc, propValue$184, props, null);
                  }
              }
            initInput(
              domElement,
              propKey,
              defaultValue,
              checked,
              defaultChecked,
              propValue,
              hasSrcSet,
              false
            );
            return;
          case "select":
            listenToNonDelegatedEvent("invalid", domElement);
            hasSrc = propValue = propKey = null;
            for (hasSrcSet in props)
              if (props.hasOwnProperty(hasSrcSet) && (defaultValue = props[hasSrcSet], null != defaultValue))
                switch (hasSrcSet) {
                  case "value":
                    propKey = defaultValue;
                    break;
                  case "defaultValue":
                    propValue = defaultValue;
                    break;
                  case "multiple":
                    hasSrc = defaultValue;
                  default:
                    setProp(domElement, tag, hasSrcSet, defaultValue, props, null);
                }
            tag = propKey;
            props = propValue;
            domElement.multiple = !!hasSrc;
            null != tag ? updateOptions(domElement, !!hasSrc, tag, false) : null != props && updateOptions(domElement, !!hasSrc, props, true);
            return;
          case "textarea":
            listenToNonDelegatedEvent("invalid", domElement);
            propKey = hasSrcSet = hasSrc = null;
            for (propValue in props)
              if (props.hasOwnProperty(propValue) && (defaultValue = props[propValue], null != defaultValue))
                switch (propValue) {
                  case "value":
                    hasSrc = defaultValue;
                    break;
                  case "defaultValue":
                    hasSrcSet = defaultValue;
                    break;
                  case "children":
                    propKey = defaultValue;
                    break;
                  case "dangerouslySetInnerHTML":
                    if (null != defaultValue) throw Error(formatProdErrorMessage(91));
                    break;
                  default:
                    setProp(domElement, tag, propValue, defaultValue, props, null);
                }
            initTextarea(domElement, hasSrc, hasSrcSet, propKey);
            return;
          case "option":
            for (checked in props)
              if (props.hasOwnProperty(checked) && (hasSrc = props[checked], null != hasSrc))
                switch (checked) {
                  case "selected":
                    domElement.selected = hasSrc && "function" !== typeof hasSrc && "symbol" !== typeof hasSrc;
                    break;
                  default:
                    setProp(domElement, tag, checked, hasSrc, props, null);
                }
            return;
          case "dialog":
            listenToNonDelegatedEvent("beforetoggle", domElement);
            listenToNonDelegatedEvent("toggle", domElement);
            listenToNonDelegatedEvent("cancel", domElement);
            listenToNonDelegatedEvent("close", domElement);
            break;
          case "iframe":
          case "object":
            listenToNonDelegatedEvent("load", domElement);
            break;
          case "video":
          case "audio":
            for (hasSrc = 0; hasSrc < mediaEventTypes.length; hasSrc++)
              listenToNonDelegatedEvent(mediaEventTypes[hasSrc], domElement);
            break;
          case "image":
            listenToNonDelegatedEvent("error", domElement);
            listenToNonDelegatedEvent("load", domElement);
            break;
          case "details":
            listenToNonDelegatedEvent("toggle", domElement);
            break;
          case "embed":
          case "source":
          case "link":
            listenToNonDelegatedEvent("error", domElement), listenToNonDelegatedEvent("load", domElement);
          case "area":
          case "base":
          case "br":
          case "col":
          case "hr":
          case "keygen":
          case "meta":
          case "param":
          case "track":
          case "wbr":
          case "menuitem":
            for (defaultChecked in props)
              if (props.hasOwnProperty(defaultChecked) && (hasSrc = props[defaultChecked], null != hasSrc))
                switch (defaultChecked) {
                  case "children":
                  case "dangerouslySetInnerHTML":
                    throw Error(formatProdErrorMessage(137, tag));
                  default:
                    setProp(domElement, tag, defaultChecked, hasSrc, props, null);
                }
            return;
          default:
            if (isCustomElement(tag)) {
              for (propValue$184 in props)
                props.hasOwnProperty(propValue$184) && (hasSrc = props[propValue$184], void 0 !== hasSrc && setPropOnCustomElement(
                  domElement,
                  tag,
                  propValue$184,
                  hasSrc,
                  props,
                  void 0
                ));
              return;
            }
        }
        for (defaultValue in props)
          props.hasOwnProperty(defaultValue) && (hasSrc = props[defaultValue], null != hasSrc && setProp(domElement, tag, defaultValue, hasSrc, props, null));
      }
      function updateProperties(domElement, tag, lastProps, nextProps) {
        switch (tag) {
          case "div":
          case "span":
          case "svg":
          case "path":
          case "a":
          case "g":
          case "p":
          case "li":
            break;
          case "input":
            var name = null, type = null, value = null, defaultValue = null, lastDefaultValue = null, checked = null, defaultChecked = null;
            for (propKey in lastProps) {
              var lastProp = lastProps[propKey];
              if (lastProps.hasOwnProperty(propKey) && null != lastProp)
                switch (propKey) {
                  case "checked":
                    break;
                  case "value":
                    break;
                  case "defaultValue":
                    lastDefaultValue = lastProp;
                  default:
                    nextProps.hasOwnProperty(propKey) || setProp(domElement, tag, propKey, null, nextProps, lastProp);
                }
            }
            for (var propKey$201 in nextProps) {
              var propKey = nextProps[propKey$201];
              lastProp = lastProps[propKey$201];
              if (nextProps.hasOwnProperty(propKey$201) && (null != propKey || null != lastProp))
                switch (propKey$201) {
                  case "type":
                    type = propKey;
                    break;
                  case "name":
                    name = propKey;
                    break;
                  case "checked":
                    checked = propKey;
                    break;
                  case "defaultChecked":
                    defaultChecked = propKey;
                    break;
                  case "value":
                    value = propKey;
                    break;
                  case "defaultValue":
                    defaultValue = propKey;
                    break;
                  case "children":
                  case "dangerouslySetInnerHTML":
                    if (null != propKey)
                      throw Error(formatProdErrorMessage(137, tag));
                    break;
                  default:
                    propKey !== lastProp && setProp(
                      domElement,
                      tag,
                      propKey$201,
                      propKey,
                      nextProps,
                      lastProp
                    );
                }
            }
            updateInput(
              domElement,
              value,
              defaultValue,
              lastDefaultValue,
              checked,
              defaultChecked,
              type,
              name
            );
            return;
          case "select":
            propKey = value = defaultValue = propKey$201 = null;
            for (type in lastProps)
              if (lastDefaultValue = lastProps[type], lastProps.hasOwnProperty(type) && null != lastDefaultValue)
                switch (type) {
                  case "value":
                    break;
                  case "multiple":
                    propKey = lastDefaultValue;
                  default:
                    nextProps.hasOwnProperty(type) || setProp(
                      domElement,
                      tag,
                      type,
                      null,
                      nextProps,
                      lastDefaultValue
                    );
                }
            for (name in nextProps)
              if (type = nextProps[name], lastDefaultValue = lastProps[name], nextProps.hasOwnProperty(name) && (null != type || null != lastDefaultValue))
                switch (name) {
                  case "value":
                    propKey$201 = type;
                    break;
                  case "defaultValue":
                    defaultValue = type;
                    break;
                  case "multiple":
                    value = type;
                  default:
                    type !== lastDefaultValue && setProp(
                      domElement,
                      tag,
                      name,
                      type,
                      nextProps,
                      lastDefaultValue
                    );
                }
            tag = defaultValue;
            lastProps = value;
            nextProps = propKey;
            null != propKey$201 ? updateOptions(domElement, !!lastProps, propKey$201, false) : !!nextProps !== !!lastProps && (null != tag ? updateOptions(domElement, !!lastProps, tag, true) : updateOptions(domElement, !!lastProps, lastProps ? [] : "", false));
            return;
          case "textarea":
            propKey = propKey$201 = null;
            for (defaultValue in lastProps)
              if (name = lastProps[defaultValue], lastProps.hasOwnProperty(defaultValue) && null != name && !nextProps.hasOwnProperty(defaultValue))
                switch (defaultValue) {
                  case "value":
                    break;
                  case "children":
                    break;
                  default:
                    setProp(domElement, tag, defaultValue, null, nextProps, name);
                }
            for (value in nextProps)
              if (name = nextProps[value], type = lastProps[value], nextProps.hasOwnProperty(value) && (null != name || null != type))
                switch (value) {
                  case "value":
                    propKey$201 = name;
                    break;
                  case "defaultValue":
                    propKey = name;
                    break;
                  case "children":
                    break;
                  case "dangerouslySetInnerHTML":
                    if (null != name) throw Error(formatProdErrorMessage(91));
                    break;
                  default:
                    name !== type && setProp(domElement, tag, value, name, nextProps, type);
                }
            updateTextarea(domElement, propKey$201, propKey);
            return;
          case "option":
            for (var propKey$217 in lastProps)
              if (propKey$201 = lastProps[propKey$217], lastProps.hasOwnProperty(propKey$217) && null != propKey$201 && !nextProps.hasOwnProperty(propKey$217))
                switch (propKey$217) {
                  case "selected":
                    domElement.selected = false;
                    break;
                  default:
                    setProp(
                      domElement,
                      tag,
                      propKey$217,
                      null,
                      nextProps,
                      propKey$201
                    );
                }
            for (lastDefaultValue in nextProps)
              if (propKey$201 = nextProps[lastDefaultValue], propKey = lastProps[lastDefaultValue], nextProps.hasOwnProperty(lastDefaultValue) && propKey$201 !== propKey && (null != propKey$201 || null != propKey))
                switch (lastDefaultValue) {
                  case "selected":
                    domElement.selected = propKey$201 && "function" !== typeof propKey$201 && "symbol" !== typeof propKey$201;
                    break;
                  default:
                    setProp(
                      domElement,
                      tag,
                      lastDefaultValue,
                      propKey$201,
                      nextProps,
                      propKey
                    );
                }
            return;
          case "img":
          case "link":
          case "area":
          case "base":
          case "br":
          case "col":
          case "embed":
          case "hr":
          case "keygen":
          case "meta":
          case "param":
          case "source":
          case "track":
          case "wbr":
          case "menuitem":
            for (var propKey$222 in lastProps)
              propKey$201 = lastProps[propKey$222], lastProps.hasOwnProperty(propKey$222) && null != propKey$201 && !nextProps.hasOwnProperty(propKey$222) && setProp(domElement, tag, propKey$222, null, nextProps, propKey$201);
            for (checked in nextProps)
              if (propKey$201 = nextProps[checked], propKey = lastProps[checked], nextProps.hasOwnProperty(checked) && propKey$201 !== propKey && (null != propKey$201 || null != propKey))
                switch (checked) {
                  case "children":
                  case "dangerouslySetInnerHTML":
                    if (null != propKey$201)
                      throw Error(formatProdErrorMessage(137, tag));
                    break;
                  default:
                    setProp(
                      domElement,
                      tag,
                      checked,
                      propKey$201,
                      nextProps,
                      propKey
                    );
                }
            return;
          default:
            if (isCustomElement(tag)) {
              for (var propKey$227 in lastProps)
                propKey$201 = lastProps[propKey$227], lastProps.hasOwnProperty(propKey$227) && void 0 !== propKey$201 && !nextProps.hasOwnProperty(propKey$227) && setPropOnCustomElement(
                  domElement,
                  tag,
                  propKey$227,
                  void 0,
                  nextProps,
                  propKey$201
                );
              for (defaultChecked in nextProps)
                propKey$201 = nextProps[defaultChecked], propKey = lastProps[defaultChecked], !nextProps.hasOwnProperty(defaultChecked) || propKey$201 === propKey || void 0 === propKey$201 && void 0 === propKey || setPropOnCustomElement(
                  domElement,
                  tag,
                  defaultChecked,
                  propKey$201,
                  nextProps,
                  propKey
                );
              return;
            }
        }
        for (var propKey$232 in lastProps)
          propKey$201 = lastProps[propKey$232], lastProps.hasOwnProperty(propKey$232) && null != propKey$201 && !nextProps.hasOwnProperty(propKey$232) && setProp(domElement, tag, propKey$232, null, nextProps, propKey$201);
        for (lastProp in nextProps)
          propKey$201 = nextProps[lastProp], propKey = lastProps[lastProp], !nextProps.hasOwnProperty(lastProp) || propKey$201 === propKey || null == propKey$201 && null == propKey || setProp(domElement, tag, lastProp, propKey$201, nextProps, propKey);
      }
      function isLikelyStaticResource(initiatorType) {
        switch (initiatorType) {
          case "css":
          case "script":
          case "font":
          case "img":
          case "image":
          case "input":
          case "link":
            return true;
          default:
            return false;
        }
      }
      function estimateBandwidth() {
        if ("function" === typeof performance.getEntriesByType) {
          for (var count = 0, bits = 0, resourceEntries = performance.getEntriesByType("resource"), i2 = 0; i2 < resourceEntries.length; i2++) {
            var entry = resourceEntries[i2], transferSize = entry.transferSize, initiatorType = entry.initiatorType, duration = entry.duration;
            if (transferSize && duration && isLikelyStaticResource(initiatorType)) {
              initiatorType = 0;
              duration = entry.responseEnd;
              for (i2 += 1; i2 < resourceEntries.length; i2++) {
                var overlapEntry = resourceEntries[i2], overlapStartTime = overlapEntry.startTime;
                if (overlapStartTime > duration) break;
                var overlapTransferSize = overlapEntry.transferSize, overlapInitiatorType = overlapEntry.initiatorType;
                overlapTransferSize && isLikelyStaticResource(overlapInitiatorType) && (overlapEntry = overlapEntry.responseEnd, initiatorType += overlapTransferSize * (overlapEntry < duration ? 1 : (duration - overlapStartTime) / (overlapEntry - overlapStartTime)));
              }
              --i2;
              bits += 8 * (transferSize + initiatorType) / (entry.duration / 1e3);
              count++;
              if (10 < count) break;
            }
          }
          if (0 < count) return bits / count / 1e6;
        }
        return navigator.connection && (count = navigator.connection.downlink, "number" === typeof count) ? count : 5;
      }
      var eventsEnabled = null;
      var selectionInformation = null;
      function getOwnerDocumentFromRootContainer(rootContainerElement) {
        return 9 === rootContainerElement.nodeType ? rootContainerElement : rootContainerElement.ownerDocument;
      }
      function getOwnHostContext(namespaceURI) {
        switch (namespaceURI) {
          case "http://www.w3.org/2000/svg":
            return 1;
          case "http://www.w3.org/1998/Math/MathML":
            return 2;
          default:
            return 0;
        }
      }
      function getChildHostContextProd(parentNamespace, type) {
        if (0 === parentNamespace)
          switch (type) {
            case "svg":
              return 1;
            case "math":
              return 2;
            default:
              return 0;
          }
        return 1 === parentNamespace && "foreignObject" === type ? 0 : parentNamespace;
      }
      function shouldSetTextContent(type, props) {
        return "textarea" === type || "noscript" === type || "string" === typeof props.children || "number" === typeof props.children || "bigint" === typeof props.children || "object" === typeof props.dangerouslySetInnerHTML && null !== props.dangerouslySetInnerHTML && null != props.dangerouslySetInnerHTML.__html;
      }
      var currentPopstateTransitionEvent = null;
      function shouldAttemptEagerTransition() {
        var event = window.event;
        if (event && "popstate" === event.type) {
          if (event === currentPopstateTransitionEvent) return false;
          currentPopstateTransitionEvent = event;
          return true;
        }
        currentPopstateTransitionEvent = null;
        return false;
      }
      var scheduleTimeout = "function" === typeof setTimeout ? setTimeout : void 0;
      var cancelTimeout = "function" === typeof clearTimeout ? clearTimeout : void 0;
      var localPromise = "function" === typeof Promise ? Promise : void 0;
      var scheduleMicrotask = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof localPromise ? function(callback) {
        return localPromise.resolve(null).then(callback).catch(handleErrorInNextTick);
      } : scheduleTimeout;
      function handleErrorInNextTick(error) {
        setTimeout(function() {
          throw error;
        });
      }
      function isSingletonScope(type) {
        return "head" === type;
      }
      function clearHydrationBoundary(parentInstance, hydrationInstance) {
        var node = hydrationInstance, depth = 0;
        do {
          var nextNode = node.nextSibling;
          parentInstance.removeChild(node);
          if (nextNode && 8 === nextNode.nodeType)
            if (node = nextNode.data, "/$" === node || "/&" === node) {
              if (0 === depth) {
                parentInstance.removeChild(nextNode);
                retryIfBlockedOn(hydrationInstance);
                return;
              }
              depth--;
            } else if ("$" === node || "$?" === node || "$~" === node || "$!" === node || "&" === node)
              depth++;
            else if ("html" === node)
              releaseSingletonInstance(parentInstance.ownerDocument.documentElement);
            else if ("head" === node) {
              node = parentInstance.ownerDocument.head;
              releaseSingletonInstance(node);
              for (var node$jscomp$0 = node.firstChild; node$jscomp$0; ) {
                var nextNode$jscomp$0 = node$jscomp$0.nextSibling, nodeName = node$jscomp$0.nodeName;
                node$jscomp$0[internalHoistableMarker] || "SCRIPT" === nodeName || "STYLE" === nodeName || "LINK" === nodeName && "stylesheet" === node$jscomp$0.rel.toLowerCase() || node.removeChild(node$jscomp$0);
                node$jscomp$0 = nextNode$jscomp$0;
              }
            } else
              "body" === node && releaseSingletonInstance(parentInstance.ownerDocument.body);
          node = nextNode;
        } while (node);
        retryIfBlockedOn(hydrationInstance);
      }
      function hideOrUnhideDehydratedBoundary(suspenseInstance, isHidden) {
        var node = suspenseInstance;
        suspenseInstance = 0;
        do {
          var nextNode = node.nextSibling;
          1 === node.nodeType ? isHidden ? (node._stashedDisplay = node.style.display, node.style.display = "none") : (node.style.display = node._stashedDisplay || "", "" === node.getAttribute("style") && node.removeAttribute("style")) : 3 === node.nodeType && (isHidden ? (node._stashedText = node.nodeValue, node.nodeValue = "") : node.nodeValue = node._stashedText || "");
          if (nextNode && 8 === nextNode.nodeType)
            if (node = nextNode.data, "/$" === node)
              if (0 === suspenseInstance) break;
              else suspenseInstance--;
            else
              "$" !== node && "$?" !== node && "$~" !== node && "$!" !== node || suspenseInstance++;
          node = nextNode;
        } while (node);
      }
      function clearContainerSparingly(container) {
        var nextNode = container.firstChild;
        nextNode && 10 === nextNode.nodeType && (nextNode = nextNode.nextSibling);
        for (; nextNode; ) {
          var node = nextNode;
          nextNode = nextNode.nextSibling;
          switch (node.nodeName) {
            case "HTML":
            case "HEAD":
            case "BODY":
              clearContainerSparingly(node);
              detachDeletedInstance(node);
              continue;
            case "SCRIPT":
            case "STYLE":
              continue;
            case "LINK":
              if ("stylesheet" === node.rel.toLowerCase()) continue;
          }
          container.removeChild(node);
        }
      }
      function canHydrateInstance(instance, type, props, inRootOrSingleton) {
        for (; 1 === instance.nodeType; ) {
          var anyProps = props;
          if (instance.nodeName.toLowerCase() !== type.toLowerCase()) {
            if (!inRootOrSingleton && ("INPUT" !== instance.nodeName || "hidden" !== instance.type))
              break;
          } else if (!inRootOrSingleton)
            if ("input" === type && "hidden" === instance.type) {
              var name = null == anyProps.name ? null : "" + anyProps.name;
              if ("hidden" === anyProps.type && instance.getAttribute("name") === name)
                return instance;
            } else return instance;
          else if (!instance[internalHoistableMarker])
            switch (type) {
              case "meta":
                if (!instance.hasAttribute("itemprop")) break;
                return instance;
              case "link":
                name = instance.getAttribute("rel");
                if ("stylesheet" === name && instance.hasAttribute("data-precedence"))
                  break;
                else if (name !== anyProps.rel || instance.getAttribute("href") !== (null == anyProps.href || "" === anyProps.href ? null : anyProps.href) || instance.getAttribute("crossorigin") !== (null == anyProps.crossOrigin ? null : anyProps.crossOrigin) || instance.getAttribute("title") !== (null == anyProps.title ? null : anyProps.title))
                  break;
                return instance;
              case "style":
                if (instance.hasAttribute("data-precedence")) break;
                return instance;
              case "script":
                name = instance.getAttribute("src");
                if ((name !== (null == anyProps.src ? null : anyProps.src) || instance.getAttribute("type") !== (null == anyProps.type ? null : anyProps.type) || instance.getAttribute("crossorigin") !== (null == anyProps.crossOrigin ? null : anyProps.crossOrigin)) && name && instance.hasAttribute("async") && !instance.hasAttribute("itemprop"))
                  break;
                return instance;
              default:
                return instance;
            }
          instance = getNextHydratable(instance.nextSibling);
          if (null === instance) break;
        }
        return null;
      }
      function canHydrateTextInstance(instance, text, inRootOrSingleton) {
        if ("" === text) return null;
        for (; 3 !== instance.nodeType; ) {
          if ((1 !== instance.nodeType || "INPUT" !== instance.nodeName || "hidden" !== instance.type) && !inRootOrSingleton)
            return null;
          instance = getNextHydratable(instance.nextSibling);
          if (null === instance) return null;
        }
        return instance;
      }
      function canHydrateHydrationBoundary(instance, inRootOrSingleton) {
        for (; 8 !== instance.nodeType; ) {
          if ((1 !== instance.nodeType || "INPUT" !== instance.nodeName || "hidden" !== instance.type) && !inRootOrSingleton)
            return null;
          instance = getNextHydratable(instance.nextSibling);
          if (null === instance) return null;
        }
        return instance;
      }
      function isSuspenseInstancePending(instance) {
        return "$?" === instance.data || "$~" === instance.data;
      }
      function isSuspenseInstanceFallback(instance) {
        return "$!" === instance.data || "$?" === instance.data && "loading" !== instance.ownerDocument.readyState;
      }
      function registerSuspenseInstanceRetry(instance, callback) {
        var ownerDocument = instance.ownerDocument;
        if ("$~" === instance.data) instance._reactRetry = callback;
        else if ("$?" !== instance.data || "loading" !== ownerDocument.readyState)
          callback();
        else {
          var listener = function() {
            callback();
            ownerDocument.removeEventListener("DOMContentLoaded", listener);
          };
          ownerDocument.addEventListener("DOMContentLoaded", listener);
          instance._reactRetry = listener;
        }
      }
      function getNextHydratable(node) {
        for (; null != node; node = node.nextSibling) {
          var nodeType = node.nodeType;
          if (1 === nodeType || 3 === nodeType) break;
          if (8 === nodeType) {
            nodeType = node.data;
            if ("$" === nodeType || "$!" === nodeType || "$?" === nodeType || "$~" === nodeType || "&" === nodeType || "F!" === nodeType || "F" === nodeType)
              break;
            if ("/$" === nodeType || "/&" === nodeType) return null;
          }
        }
        return node;
      }
      var previousHydratableOnEnteringScopedSingleton = null;
      function getNextHydratableInstanceAfterHydrationBoundary(hydrationInstance) {
        hydrationInstance = hydrationInstance.nextSibling;
        for (var depth = 0; hydrationInstance; ) {
          if (8 === hydrationInstance.nodeType) {
            var data = hydrationInstance.data;
            if ("/$" === data || "/&" === data) {
              if (0 === depth)
                return getNextHydratable(hydrationInstance.nextSibling);
              depth--;
            } else
              "$" !== data && "$!" !== data && "$?" !== data && "$~" !== data && "&" !== data || depth++;
          }
          hydrationInstance = hydrationInstance.nextSibling;
        }
        return null;
      }
      function getParentHydrationBoundary(targetInstance) {
        targetInstance = targetInstance.previousSibling;
        for (var depth = 0; targetInstance; ) {
          if (8 === targetInstance.nodeType) {
            var data = targetInstance.data;
            if ("$" === data || "$!" === data || "$?" === data || "$~" === data || "&" === data) {
              if (0 === depth) return targetInstance;
              depth--;
            } else "/$" !== data && "/&" !== data || depth++;
          }
          targetInstance = targetInstance.previousSibling;
        }
        return null;
      }
      function resolveSingletonInstance(type, props, rootContainerInstance) {
        props = getOwnerDocumentFromRootContainer(rootContainerInstance);
        switch (type) {
          case "html":
            type = props.documentElement;
            if (!type) throw Error(formatProdErrorMessage(452));
            return type;
          case "head":
            type = props.head;
            if (!type) throw Error(formatProdErrorMessage(453));
            return type;
          case "body":
            type = props.body;
            if (!type) throw Error(formatProdErrorMessage(454));
            return type;
          default:
            throw Error(formatProdErrorMessage(451));
        }
      }
      function releaseSingletonInstance(instance) {
        for (var attributes = instance.attributes; attributes.length; )
          instance.removeAttributeNode(attributes[0]);
        detachDeletedInstance(instance);
      }
      var preloadPropsMap = /* @__PURE__ */ new Map();
      var preconnectsSet = /* @__PURE__ */ new Set();
      function getHoistableRoot(container) {
        return "function" === typeof container.getRootNode ? container.getRootNode() : 9 === container.nodeType ? container : container.ownerDocument;
      }
      var previousDispatcher = ReactDOMSharedInternals.d;
      ReactDOMSharedInternals.d = {
        f: flushSyncWork,
        r: requestFormReset,
        D: prefetchDNS,
        C: preconnect,
        L: preload,
        m: preloadModule,
        X: preinitScript,
        S: preinitStyle,
        M: preinitModuleScript
      };
      function flushSyncWork() {
        var previousWasRendering = previousDispatcher.f(), wasRendering = flushSyncWork$1();
        return previousWasRendering || wasRendering;
      }
      function requestFormReset(form) {
        var formInst = getInstanceFromNode(form);
        null !== formInst && 5 === formInst.tag && "form" === formInst.type ? requestFormReset$1(formInst) : previousDispatcher.r(form);
      }
      var globalDocument = "undefined" === typeof document ? null : document;
      function preconnectAs(rel, href, crossOrigin) {
        var ownerDocument = globalDocument;
        if (ownerDocument && "string" === typeof href && href) {
          var limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(href);
          limitedEscapedHref = 'link[rel="' + rel + '"][href="' + limitedEscapedHref + '"]';
          "string" === typeof crossOrigin && (limitedEscapedHref += '[crossorigin="' + crossOrigin + '"]');
          preconnectsSet.has(limitedEscapedHref) || (preconnectsSet.add(limitedEscapedHref), rel = { rel, crossOrigin, href }, null === ownerDocument.querySelector(limitedEscapedHref) && (href = ownerDocument.createElement("link"), setInitialProperties(href, "link", rel), markNodeAsHoistable(href), ownerDocument.head.appendChild(href)));
        }
      }
      function prefetchDNS(href) {
        previousDispatcher.D(href);
        preconnectAs("dns-prefetch", href, null);
      }
      function preconnect(href, crossOrigin) {
        previousDispatcher.C(href, crossOrigin);
        preconnectAs("preconnect", href, crossOrigin);
      }
      function preload(href, as, options2) {
        previousDispatcher.L(href, as, options2);
        var ownerDocument = globalDocument;
        if (ownerDocument && href && as) {
          var preloadSelector = 'link[rel="preload"][as="' + escapeSelectorAttributeValueInsideDoubleQuotes(as) + '"]';
          "image" === as ? options2 && options2.imageSrcSet ? (preloadSelector += '[imagesrcset="' + escapeSelectorAttributeValueInsideDoubleQuotes(
            options2.imageSrcSet
          ) + '"]', "string" === typeof options2.imageSizes && (preloadSelector += '[imagesizes="' + escapeSelectorAttributeValueInsideDoubleQuotes(
            options2.imageSizes
          ) + '"]')) : preloadSelector += '[href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"]' : preloadSelector += '[href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"]';
          var key = preloadSelector;
          switch (as) {
            case "style":
              key = getStyleKey(href);
              break;
            case "script":
              key = getScriptKey(href);
          }
          preloadPropsMap.has(key) || (href = assign3(
            {
              rel: "preload",
              href: "image" === as && options2 && options2.imageSrcSet ? void 0 : href,
              as
            },
            options2
          ), preloadPropsMap.set(key, href), null !== ownerDocument.querySelector(preloadSelector) || "style" === as && ownerDocument.querySelector(getStylesheetSelectorFromKey(key)) || "script" === as && ownerDocument.querySelector(getScriptSelectorFromKey(key)) || (as = ownerDocument.createElement("link"), setInitialProperties(as, "link", href), markNodeAsHoistable(as), ownerDocument.head.appendChild(as)));
        }
      }
      function preloadModule(href, options2) {
        previousDispatcher.m(href, options2);
        var ownerDocument = globalDocument;
        if (ownerDocument && href) {
          var as = options2 && "string" === typeof options2.as ? options2.as : "script", preloadSelector = 'link[rel="modulepreload"][as="' + escapeSelectorAttributeValueInsideDoubleQuotes(as) + '"][href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"]', key = preloadSelector;
          switch (as) {
            case "audioworklet":
            case "paintworklet":
            case "serviceworker":
            case "sharedworker":
            case "worker":
            case "script":
              key = getScriptKey(href);
          }
          if (!preloadPropsMap.has(key) && (href = assign3({ rel: "modulepreload", href }, options2), preloadPropsMap.set(key, href), null === ownerDocument.querySelector(preloadSelector))) {
            switch (as) {
              case "audioworklet":
              case "paintworklet":
              case "serviceworker":
              case "sharedworker":
              case "worker":
              case "script":
                if (ownerDocument.querySelector(getScriptSelectorFromKey(key)))
                  return;
            }
            as = ownerDocument.createElement("link");
            setInitialProperties(as, "link", href);
            markNodeAsHoistable(as);
            ownerDocument.head.appendChild(as);
          }
        }
      }
      function preinitStyle(href, precedence, options2) {
        previousDispatcher.S(href, precedence, options2);
        var ownerDocument = globalDocument;
        if (ownerDocument && href) {
          var styles = getResourcesFromRoot(ownerDocument).hoistableStyles, key = getStyleKey(href);
          precedence = precedence || "default";
          var resource = styles.get(key);
          if (!resource) {
            var state = { loading: 0, preload: null };
            if (resource = ownerDocument.querySelector(
              getStylesheetSelectorFromKey(key)
            ))
              state.loading = 5;
            else {
              href = assign3(
                { rel: "stylesheet", href, "data-precedence": precedence },
                options2
              );
              (options2 = preloadPropsMap.get(key)) && adoptPreloadPropsForStylesheet(href, options2);
              var link = resource = ownerDocument.createElement("link");
              markNodeAsHoistable(link);
              setInitialProperties(link, "link", href);
              link._p = new Promise(function(resolve, reject) {
                link.onload = resolve;
                link.onerror = reject;
              });
              link.addEventListener("load", function() {
                state.loading |= 1;
              });
              link.addEventListener("error", function() {
                state.loading |= 2;
              });
              state.loading |= 4;
              insertStylesheet(resource, precedence, ownerDocument);
            }
            resource = {
              type: "stylesheet",
              instance: resource,
              count: 1,
              state
            };
            styles.set(key, resource);
          }
        }
      }
      function preinitScript(src, options2) {
        previousDispatcher.X(src, options2);
        var ownerDocument = globalDocument;
        if (ownerDocument && src) {
          var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts, key = getScriptKey(src), resource = scripts.get(key);
          resource || (resource = ownerDocument.querySelector(getScriptSelectorFromKey(key)), resource || (src = assign3({ src, async: true }, options2), (options2 = preloadPropsMap.get(key)) && adoptPreloadPropsForScript(src, options2), resource = ownerDocument.createElement("script"), markNodeAsHoistable(resource), setInitialProperties(resource, "link", src), ownerDocument.head.appendChild(resource)), resource = {
            type: "script",
            instance: resource,
            count: 1,
            state: null
          }, scripts.set(key, resource));
        }
      }
      function preinitModuleScript(src, options2) {
        previousDispatcher.M(src, options2);
        var ownerDocument = globalDocument;
        if (ownerDocument && src) {
          var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts, key = getScriptKey(src), resource = scripts.get(key);
          resource || (resource = ownerDocument.querySelector(getScriptSelectorFromKey(key)), resource || (src = assign3({ src, async: true, type: "module" }, options2), (options2 = preloadPropsMap.get(key)) && adoptPreloadPropsForScript(src, options2), resource = ownerDocument.createElement("script"), markNodeAsHoistable(resource), setInitialProperties(resource, "link", src), ownerDocument.head.appendChild(resource)), resource = {
            type: "script",
            instance: resource,
            count: 1,
            state: null
          }, scripts.set(key, resource));
        }
      }
      function getResource(type, currentProps, pendingProps, currentResource) {
        var JSCompiler_inline_result = (JSCompiler_inline_result = rootInstanceStackCursor.current) ? getHoistableRoot(JSCompiler_inline_result) : null;
        if (!JSCompiler_inline_result) throw Error(formatProdErrorMessage(446));
        switch (type) {
          case "meta":
          case "title":
            return null;
          case "style":
            return "string" === typeof pendingProps.precedence && "string" === typeof pendingProps.href ? (currentProps = getStyleKey(pendingProps.href), pendingProps = getResourcesFromRoot(
              JSCompiler_inline_result
            ).hoistableStyles, currentResource = pendingProps.get(currentProps), currentResource || (currentResource = {
              type: "style",
              instance: null,
              count: 0,
              state: null
            }, pendingProps.set(currentProps, currentResource)), currentResource) : { type: "void", instance: null, count: 0, state: null };
          case "link":
            if ("stylesheet" === pendingProps.rel && "string" === typeof pendingProps.href && "string" === typeof pendingProps.precedence) {
              type = getStyleKey(pendingProps.href);
              var styles$243 = getResourcesFromRoot(
                JSCompiler_inline_result
              ).hoistableStyles, resource$244 = styles$243.get(type);
              resource$244 || (JSCompiler_inline_result = JSCompiler_inline_result.ownerDocument || JSCompiler_inline_result, resource$244 = {
                type: "stylesheet",
                instance: null,
                count: 0,
                state: { loading: 0, preload: null }
              }, styles$243.set(type, resource$244), (styles$243 = JSCompiler_inline_result.querySelector(
                getStylesheetSelectorFromKey(type)
              )) && !styles$243._p && (resource$244.instance = styles$243, resource$244.state.loading = 5), preloadPropsMap.has(type) || (pendingProps = {
                rel: "preload",
                as: "style",
                href: pendingProps.href,
                crossOrigin: pendingProps.crossOrigin,
                integrity: pendingProps.integrity,
                media: pendingProps.media,
                hrefLang: pendingProps.hrefLang,
                referrerPolicy: pendingProps.referrerPolicy
              }, preloadPropsMap.set(type, pendingProps), styles$243 || preloadStylesheet(
                JSCompiler_inline_result,
                type,
                pendingProps,
                resource$244.state
              )));
              if (currentProps && null === currentResource)
                throw Error(formatProdErrorMessage(528, ""));
              return resource$244;
            }
            if (currentProps && null !== currentResource)
              throw Error(formatProdErrorMessage(529, ""));
            return null;
          case "script":
            return currentProps = pendingProps.async, pendingProps = pendingProps.src, "string" === typeof pendingProps && currentProps && "function" !== typeof currentProps && "symbol" !== typeof currentProps ? (currentProps = getScriptKey(pendingProps), pendingProps = getResourcesFromRoot(
              JSCompiler_inline_result
            ).hoistableScripts, currentResource = pendingProps.get(currentProps), currentResource || (currentResource = {
              type: "script",
              instance: null,
              count: 0,
              state: null
            }, pendingProps.set(currentProps, currentResource)), currentResource) : { type: "void", instance: null, count: 0, state: null };
          default:
            throw Error(formatProdErrorMessage(444, type));
        }
      }
      function getStyleKey(href) {
        return 'href="' + escapeSelectorAttributeValueInsideDoubleQuotes(href) + '"';
      }
      function getStylesheetSelectorFromKey(key) {
        return 'link[rel="stylesheet"][' + key + "]";
      }
      function stylesheetPropsFromRawProps(rawProps) {
        return assign3({}, rawProps, {
          "data-precedence": rawProps.precedence,
          precedence: null
        });
      }
      function preloadStylesheet(ownerDocument, key, preloadProps, state) {
        ownerDocument.querySelector('link[rel="preload"][as="style"][' + key + "]") ? state.loading = 1 : (key = ownerDocument.createElement("link"), state.preload = key, key.addEventListener("load", function() {
          return state.loading |= 1;
        }), key.addEventListener("error", function() {
          return state.loading |= 2;
        }), setInitialProperties(key, "link", preloadProps), markNodeAsHoistable(key), ownerDocument.head.appendChild(key));
      }
      function getScriptKey(src) {
        return '[src="' + escapeSelectorAttributeValueInsideDoubleQuotes(src) + '"]';
      }
      function getScriptSelectorFromKey(key) {
        return "script[async]" + key;
      }
      function acquireResource(hoistableRoot, resource, props) {
        resource.count++;
        if (null === resource.instance)
          switch (resource.type) {
            case "style":
              var instance = hoistableRoot.querySelector(
                'style[data-href~="' + escapeSelectorAttributeValueInsideDoubleQuotes(props.href) + '"]'
              );
              if (instance)
                return resource.instance = instance, markNodeAsHoistable(instance), instance;
              var styleProps = assign3({}, props, {
                "data-href": props.href,
                "data-precedence": props.precedence,
                href: null,
                precedence: null
              });
              instance = (hoistableRoot.ownerDocument || hoistableRoot).createElement(
                "style"
              );
              markNodeAsHoistable(instance);
              setInitialProperties(instance, "style", styleProps);
              insertStylesheet(instance, props.precedence, hoistableRoot);
              return resource.instance = instance;
            case "stylesheet":
              styleProps = getStyleKey(props.href);
              var instance$249 = hoistableRoot.querySelector(
                getStylesheetSelectorFromKey(styleProps)
              );
              if (instance$249)
                return resource.state.loading |= 4, resource.instance = instance$249, markNodeAsHoistable(instance$249), instance$249;
              instance = stylesheetPropsFromRawProps(props);
              (styleProps = preloadPropsMap.get(styleProps)) && adoptPreloadPropsForStylesheet(instance, styleProps);
              instance$249 = (hoistableRoot.ownerDocument || hoistableRoot).createElement("link");
              markNodeAsHoistable(instance$249);
              var linkInstance = instance$249;
              linkInstance._p = new Promise(function(resolve, reject) {
                linkInstance.onload = resolve;
                linkInstance.onerror = reject;
              });
              setInitialProperties(instance$249, "link", instance);
              resource.state.loading |= 4;
              insertStylesheet(instance$249, props.precedence, hoistableRoot);
              return resource.instance = instance$249;
            case "script":
              instance$249 = getScriptKey(props.src);
              if (styleProps = hoistableRoot.querySelector(
                getScriptSelectorFromKey(instance$249)
              ))
                return resource.instance = styleProps, markNodeAsHoistable(styleProps), styleProps;
              instance = props;
              if (styleProps = preloadPropsMap.get(instance$249))
                instance = assign3({}, props), adoptPreloadPropsForScript(instance, styleProps);
              hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot;
              styleProps = hoistableRoot.createElement("script");
              markNodeAsHoistable(styleProps);
              setInitialProperties(styleProps, "link", instance);
              hoistableRoot.head.appendChild(styleProps);
              return resource.instance = styleProps;
            case "void":
              return null;
            default:
              throw Error(formatProdErrorMessage(443, resource.type));
          }
        else
          "stylesheet" === resource.type && 0 === (resource.state.loading & 4) && (instance = resource.instance, resource.state.loading |= 4, insertStylesheet(instance, props.precedence, hoistableRoot));
        return resource.instance;
      }
      function insertStylesheet(instance, precedence, root2) {
        for (var nodes = root2.querySelectorAll(
          'link[rel="stylesheet"][data-precedence],style[data-precedence]'
        ), last = nodes.length ? nodes[nodes.length - 1] : null, prior = last, i2 = 0; i2 < nodes.length; i2++) {
          var node = nodes[i2];
          if (node.dataset.precedence === precedence) prior = node;
          else if (prior !== last) break;
        }
        prior ? prior.parentNode.insertBefore(instance, prior.nextSibling) : (precedence = 9 === root2.nodeType ? root2.head : root2, precedence.insertBefore(instance, precedence.firstChild));
      }
      function adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps) {
        null == stylesheetProps.crossOrigin && (stylesheetProps.crossOrigin = preloadProps.crossOrigin);
        null == stylesheetProps.referrerPolicy && (stylesheetProps.referrerPolicy = preloadProps.referrerPolicy);
        null == stylesheetProps.title && (stylesheetProps.title = preloadProps.title);
      }
      function adoptPreloadPropsForScript(scriptProps, preloadProps) {
        null == scriptProps.crossOrigin && (scriptProps.crossOrigin = preloadProps.crossOrigin);
        null == scriptProps.referrerPolicy && (scriptProps.referrerPolicy = preloadProps.referrerPolicy);
        null == scriptProps.integrity && (scriptProps.integrity = preloadProps.integrity);
      }
      var tagCaches = null;
      function getHydratableHoistableCache(type, keyAttribute, ownerDocument) {
        if (null === tagCaches) {
          var cache = /* @__PURE__ */ new Map();
          var caches = tagCaches = /* @__PURE__ */ new Map();
          caches.set(ownerDocument, cache);
        } else
          caches = tagCaches, cache = caches.get(ownerDocument), cache || (cache = /* @__PURE__ */ new Map(), caches.set(ownerDocument, cache));
        if (cache.has(type)) return cache;
        cache.set(type, null);
        ownerDocument = ownerDocument.getElementsByTagName(type);
        for (caches = 0; caches < ownerDocument.length; caches++) {
          var node = ownerDocument[caches];
          if (!(node[internalHoistableMarker] || node[internalInstanceKey] || "link" === type && "stylesheet" === node.getAttribute("rel")) && "http://www.w3.org/2000/svg" !== node.namespaceURI) {
            var nodeKey = node.getAttribute(keyAttribute) || "";
            nodeKey = type + nodeKey;
            var existing = cache.get(nodeKey);
            existing ? existing.push(node) : cache.set(nodeKey, [node]);
          }
        }
        return cache;
      }
      function mountHoistable(hoistableRoot, type, instance) {
        hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot;
        hoistableRoot.head.insertBefore(
          instance,
          "title" === type ? hoistableRoot.querySelector("head > title") : null
        );
      }
      function isHostHoistableType(type, props, hostContext) {
        if (1 === hostContext || null != props.itemProp) return false;
        switch (type) {
          case "meta":
          case "title":
            return true;
          case "style":
            if ("string" !== typeof props.precedence || "string" !== typeof props.href || "" === props.href)
              break;
            return true;
          case "link":
            if ("string" !== typeof props.rel || "string" !== typeof props.href || "" === props.href || props.onLoad || props.onError)
              break;
            switch (props.rel) {
              case "stylesheet":
                return type = props.disabled, "string" === typeof props.precedence && null == type;
              default:
                return true;
            }
          case "script":
            if (props.async && "function" !== typeof props.async && "symbol" !== typeof props.async && !props.onLoad && !props.onError && props.src && "string" === typeof props.src)
              return true;
        }
        return false;
      }
      function preloadResource(resource) {
        return "stylesheet" === resource.type && 0 === (resource.state.loading & 3) ? false : true;
      }
      function suspendResource(state, hoistableRoot, resource, props) {
        if ("stylesheet" === resource.type && ("string" !== typeof props.media || false !== matchMedia(props.media).matches) && 0 === (resource.state.loading & 4)) {
          if (null === resource.instance) {
            var key = getStyleKey(props.href), instance = hoistableRoot.querySelector(
              getStylesheetSelectorFromKey(key)
            );
            if (instance) {
              hoistableRoot = instance._p;
              null !== hoistableRoot && "object" === typeof hoistableRoot && "function" === typeof hoistableRoot.then && (state.count++, state = onUnsuspend.bind(state), hoistableRoot.then(state, state));
              resource.state.loading |= 4;
              resource.instance = instance;
              markNodeAsHoistable(instance);
              return;
            }
            instance = hoistableRoot.ownerDocument || hoistableRoot;
            props = stylesheetPropsFromRawProps(props);
            (key = preloadPropsMap.get(key)) && adoptPreloadPropsForStylesheet(props, key);
            instance = instance.createElement("link");
            markNodeAsHoistable(instance);
            var linkInstance = instance;
            linkInstance._p = new Promise(function(resolve, reject) {
              linkInstance.onload = resolve;
              linkInstance.onerror = reject;
            });
            setInitialProperties(instance, "link", props);
            resource.instance = instance;
          }
          null === state.stylesheets && (state.stylesheets = /* @__PURE__ */ new Map());
          state.stylesheets.set(resource, hoistableRoot);
          (hoistableRoot = resource.state.preload) && 0 === (resource.state.loading & 3) && (state.count++, resource = onUnsuspend.bind(state), hoistableRoot.addEventListener("load", resource), hoistableRoot.addEventListener("error", resource));
        }
      }
      var estimatedBytesWithinLimit = 0;
      function waitForCommitToBeReady(state, timeoutOffset) {
        state.stylesheets && 0 === state.count && insertSuspendedStylesheets(state, state.stylesheets);
        return 0 < state.count || 0 < state.imgCount ? function(commit) {
          var stylesheetTimer = setTimeout(function() {
            state.stylesheets && insertSuspendedStylesheets(state, state.stylesheets);
            if (state.unsuspend) {
              var unsuspend = state.unsuspend;
              state.unsuspend = null;
              unsuspend();
            }
          }, 6e4 + timeoutOffset);
          0 < state.imgBytes && 0 === estimatedBytesWithinLimit && (estimatedBytesWithinLimit = 62500 * estimateBandwidth());
          var imgTimer = setTimeout(
            function() {
              state.waitingForImages = false;
              if (0 === state.count && (state.stylesheets && insertSuspendedStylesheets(state, state.stylesheets), state.unsuspend)) {
                var unsuspend = state.unsuspend;
                state.unsuspend = null;
                unsuspend();
              }
            },
            (state.imgBytes > estimatedBytesWithinLimit ? 50 : 800) + timeoutOffset
          );
          state.unsuspend = commit;
          return function() {
            state.unsuspend = null;
            clearTimeout(stylesheetTimer);
            clearTimeout(imgTimer);
          };
        } : null;
      }
      function onUnsuspend() {
        this.count--;
        if (0 === this.count && (0 === this.imgCount || !this.waitingForImages)) {
          if (this.stylesheets) insertSuspendedStylesheets(this, this.stylesheets);
          else if (this.unsuspend) {
            var unsuspend = this.unsuspend;
            this.unsuspend = null;
            unsuspend();
          }
        }
      }
      var precedencesByRoot = null;
      function insertSuspendedStylesheets(state, resources) {
        state.stylesheets = null;
        null !== state.unsuspend && (state.count++, precedencesByRoot = /* @__PURE__ */ new Map(), resources.forEach(insertStylesheetIntoRoot, state), precedencesByRoot = null, onUnsuspend.call(state));
      }
      function insertStylesheetIntoRoot(root2, resource) {
        if (!(resource.state.loading & 4)) {
          var precedences = precedencesByRoot.get(root2);
          if (precedences) var last = precedences.get(null);
          else {
            precedences = /* @__PURE__ */ new Map();
            precedencesByRoot.set(root2, precedences);
            for (var nodes = root2.querySelectorAll(
              "link[data-precedence],style[data-precedence]"
            ), i2 = 0; i2 < nodes.length; i2++) {
              var node = nodes[i2];
              if ("LINK" === node.nodeName || "not all" !== node.getAttribute("media"))
                precedences.set(node.dataset.precedence, node), last = node;
            }
            last && precedences.set(null, last);
          }
          nodes = resource.instance;
          node = nodes.getAttribute("data-precedence");
          i2 = precedences.get(node) || last;
          i2 === last && precedences.set(null, nodes);
          precedences.set(node, nodes);
          this.count++;
          last = onUnsuspend.bind(this);
          nodes.addEventListener("load", last);
          nodes.addEventListener("error", last);
          i2 ? i2.parentNode.insertBefore(nodes, i2.nextSibling) : (root2 = 9 === root2.nodeType ? root2.head : root2, root2.insertBefore(nodes, root2.firstChild));
          resource.state.loading |= 4;
        }
      }
      var HostTransitionContext = {
        $$typeof: REACT_CONTEXT_TYPE,
        Provider: null,
        Consumer: null,
        _currentValue: sharedNotPendingObject,
        _currentValue2: sharedNotPendingObject,
        _threadCount: 0
      };
      function FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, formState) {
        this.tag = 1;
        this.containerInfo = containerInfo;
        this.pingCache = this.current = this.pendingChildren = null;
        this.timeoutHandle = -1;
        this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null;
        this.callbackPriority = 0;
        this.expirationTimes = createLaneMap(-1);
        this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
        this.entanglements = createLaneMap(0);
        this.hiddenUpdates = createLaneMap(null);
        this.identifierPrefix = identifierPrefix;
        this.onUncaughtError = onUncaughtError;
        this.onCaughtError = onCaughtError;
        this.onRecoverableError = onRecoverableError;
        this.pooledCache = null;
        this.pooledCacheLanes = 0;
        this.formState = formState;
        this.incompleteTransitions = /* @__PURE__ */ new Map();
      }
      function createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, identifierPrefix, formState, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator) {
        containerInfo = new FiberRootNode(
          containerInfo,
          tag,
          hydrate,
          identifierPrefix,
          onUncaughtError,
          onCaughtError,
          onRecoverableError,
          onDefaultTransitionIndicator,
          formState
        );
        tag = 1;
        true === isStrictMode && (tag |= 24);
        isStrictMode = createFiberImplClass(3, null, null, tag);
        containerInfo.current = isStrictMode;
        isStrictMode.stateNode = containerInfo;
        tag = createCache();
        tag.refCount++;
        containerInfo.pooledCache = tag;
        tag.refCount++;
        isStrictMode.memoizedState = {
          element: initialChildren,
          isDehydrated: hydrate,
          cache: tag
        };
        initializeUpdateQueue(isStrictMode);
        return containerInfo;
      }
      function getContextForSubtree(parentComponent) {
        if (!parentComponent) return emptyContextObject;
        parentComponent = emptyContextObject;
        return parentComponent;
      }
      function updateContainerImpl(rootFiber, lane, element, container, parentComponent, callback) {
        parentComponent = getContextForSubtree(parentComponent);
        null === container.context ? container.context = parentComponent : container.pendingContext = parentComponent;
        container = createUpdate(lane);
        container.payload = { element };
        callback = void 0 === callback ? null : callback;
        null !== callback && (container.callback = callback);
        element = enqueueUpdate(rootFiber, container, lane);
        null !== element && (scheduleUpdateOnFiber(element, rootFiber, lane), entangleTransitions(element, rootFiber, lane));
      }
      function markRetryLaneImpl(fiber, retryLane) {
        fiber = fiber.memoizedState;
        if (null !== fiber && null !== fiber.dehydrated) {
          var a2 = fiber.retryLane;
          fiber.retryLane = 0 !== a2 && a2 < retryLane ? a2 : retryLane;
        }
      }
      function markRetryLaneIfNotHydrated(fiber, retryLane) {
        markRetryLaneImpl(fiber, retryLane);
        (fiber = fiber.alternate) && markRetryLaneImpl(fiber, retryLane);
      }
      function attemptContinuousHydration(fiber) {
        if (13 === fiber.tag || 31 === fiber.tag) {
          var root2 = enqueueConcurrentRenderForLane(fiber, 67108864);
          null !== root2 && scheduleUpdateOnFiber(root2, fiber, 67108864);
          markRetryLaneIfNotHydrated(fiber, 67108864);
        }
      }
      function attemptHydrationAtCurrentPriority(fiber) {
        if (13 === fiber.tag || 31 === fiber.tag) {
          var lane = requestUpdateLane();
          lane = getBumpedLaneForHydrationByLane(lane);
          var root2 = enqueueConcurrentRenderForLane(fiber, lane);
          null !== root2 && scheduleUpdateOnFiber(root2, fiber, lane);
          markRetryLaneIfNotHydrated(fiber, lane);
        }
      }
      var _enabled = true;
      function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
        var prevTransition = ReactSharedInternals.T;
        ReactSharedInternals.T = null;
        var previousPriority = ReactDOMSharedInternals.p;
        try {
          ReactDOMSharedInternals.p = 2, dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
        } finally {
          ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition;
        }
      }
      function dispatchContinuousEvent(domEventName, eventSystemFlags, container, nativeEvent) {
        var prevTransition = ReactSharedInternals.T;
        ReactSharedInternals.T = null;
        var previousPriority = ReactDOMSharedInternals.p;
        try {
          ReactDOMSharedInternals.p = 8, dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
        } finally {
          ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition;
        }
      }
      function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
        if (_enabled) {
          var blockedOn = findInstanceBlockingEvent(nativeEvent);
          if (null === blockedOn)
            dispatchEventForPluginEventSystem(
              domEventName,
              eventSystemFlags,
              nativeEvent,
              return_targetInst,
              targetContainer
            ), clearIfContinuousEvent(domEventName, nativeEvent);
          else if (queueIfContinuousEvent(
            blockedOn,
            domEventName,
            eventSystemFlags,
            targetContainer,
            nativeEvent
          ))
            nativeEvent.stopPropagation();
          else if (clearIfContinuousEvent(domEventName, nativeEvent), eventSystemFlags & 4 && -1 < discreteReplayableEvents.indexOf(domEventName)) {
            for (; null !== blockedOn; ) {
              var fiber = getInstanceFromNode(blockedOn);
              if (null !== fiber)
                switch (fiber.tag) {
                  case 3:
                    fiber = fiber.stateNode;
                    if (fiber.current.memoizedState.isDehydrated) {
                      var lanes = getHighestPriorityLanes(fiber.pendingLanes);
                      if (0 !== lanes) {
                        var root2 = fiber;
                        root2.pendingLanes |= 2;
                        for (root2.entangledLanes |= 2; lanes; ) {
                          var lane = 1 << 31 - clz32(lanes);
                          root2.entanglements[1] |= lane;
                          lanes &= ~lane;
                        }
                        ensureRootIsScheduled(fiber);
                        0 === (executionContext & 6) && (workInProgressRootRenderTargetTime = now() + 500, flushSyncWorkAcrossRoots_impl(0, false));
                      }
                    }
                    break;
                  case 31:
                  case 13:
                    root2 = enqueueConcurrentRenderForLane(fiber, 2), null !== root2 && scheduleUpdateOnFiber(root2, fiber, 2), flushSyncWork$1(), markRetryLaneIfNotHydrated(fiber, 2);
                }
              fiber = findInstanceBlockingEvent(nativeEvent);
              null === fiber && dispatchEventForPluginEventSystem(
                domEventName,
                eventSystemFlags,
                nativeEvent,
                return_targetInst,
                targetContainer
              );
              if (fiber === blockedOn) break;
              blockedOn = fiber;
            }
            null !== blockedOn && nativeEvent.stopPropagation();
          } else
            dispatchEventForPluginEventSystem(
              domEventName,
              eventSystemFlags,
              nativeEvent,
              null,
              targetContainer
            );
        }
      }
      function findInstanceBlockingEvent(nativeEvent) {
        nativeEvent = getEventTarget(nativeEvent);
        return findInstanceBlockingTarget(nativeEvent);
      }
      var return_targetInst = null;
      function findInstanceBlockingTarget(targetNode) {
        return_targetInst = null;
        targetNode = getClosestInstanceFromNode(targetNode);
        if (null !== targetNode) {
          var nearestMounted = getNearestMountedFiber(targetNode);
          if (null === nearestMounted) targetNode = null;
          else {
            var tag = nearestMounted.tag;
            if (13 === tag) {
              targetNode = getSuspenseInstanceFromFiber(nearestMounted);
              if (null !== targetNode) return targetNode;
              targetNode = null;
            } else if (31 === tag) {
              targetNode = getActivityInstanceFromFiber(nearestMounted);
              if (null !== targetNode) return targetNode;
              targetNode = null;
            } else if (3 === tag) {
              if (nearestMounted.stateNode.current.memoizedState.isDehydrated)
                return 3 === nearestMounted.tag ? nearestMounted.stateNode.containerInfo : null;
              targetNode = null;
            } else nearestMounted !== targetNode && (targetNode = null);
          }
        }
        return_targetInst = targetNode;
        return null;
      }
      function getEventPriority(domEventName) {
        switch (domEventName) {
          case "beforetoggle":
          case "cancel":
          case "click":
          case "close":
          case "contextmenu":
          case "copy":
          case "cut":
          case "auxclick":
          case "dblclick":
          case "dragend":
          case "dragstart":
          case "drop":
          case "focusin":
          case "focusout":
          case "input":
          case "invalid":
          case "keydown":
          case "keypress":
          case "keyup":
          case "mousedown":
          case "mouseup":
          case "paste":
          case "pause":
          case "play":
          case "pointercancel":
          case "pointerdown":
          case "pointerup":
          case "ratechange":
          case "reset":
          case "resize":
          case "seeked":
          case "submit":
          case "toggle":
          case "touchcancel":
          case "touchend":
          case "touchstart":
          case "volumechange":
          case "change":
          case "selectionchange":
          case "textInput":
          case "compositionstart":
          case "compositionend":
          case "compositionupdate":
          case "beforeblur":
          case "afterblur":
          case "beforeinput":
          case "blur":
          case "fullscreenchange":
          case "focus":
          case "hashchange":
          case "popstate":
          case "select":
          case "selectstart":
            return 2;
          case "drag":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "mousemove":
          case "mouseout":
          case "mouseover":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "scroll":
          case "touchmove":
          case "wheel":
          case "mouseenter":
          case "mouseleave":
          case "pointerenter":
          case "pointerleave":
            return 8;
          case "message":
            switch (getCurrentPriorityLevel()) {
              case ImmediatePriority:
                return 2;
              case UserBlockingPriority:
                return 8;
              case NormalPriority$1:
              case LowPriority:
                return 32;
              case IdlePriority:
                return 268435456;
              default:
                return 32;
            }
          default:
            return 32;
        }
      }
      var hasScheduledReplayAttempt = false;
      var queuedFocus = null;
      var queuedDrag = null;
      var queuedMouse = null;
      var queuedPointers = /* @__PURE__ */ new Map();
      var queuedPointerCaptures = /* @__PURE__ */ new Map();
      var queuedExplicitHydrationTargets = [];
      var discreteReplayableEvents = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
        " "
      );
      function clearIfContinuousEvent(domEventName, nativeEvent) {
        switch (domEventName) {
          case "focusin":
          case "focusout":
            queuedFocus = null;
            break;
          case "dragenter":
          case "dragleave":
            queuedDrag = null;
            break;
          case "mouseover":
          case "mouseout":
            queuedMouse = null;
            break;
          case "pointerover":
          case "pointerout":
            queuedPointers.delete(nativeEvent.pointerId);
            break;
          case "gotpointercapture":
          case "lostpointercapture":
            queuedPointerCaptures.delete(nativeEvent.pointerId);
        }
      }
      function accumulateOrCreateContinuousQueuedReplayableEvent(existingQueuedEvent, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
        if (null === existingQueuedEvent || existingQueuedEvent.nativeEvent !== nativeEvent)
          return existingQueuedEvent = {
            blockedOn,
            domEventName,
            eventSystemFlags,
            nativeEvent,
            targetContainers: [targetContainer]
          }, null !== blockedOn && (blockedOn = getInstanceFromNode(blockedOn), null !== blockedOn && attemptContinuousHydration(blockedOn)), existingQueuedEvent;
        existingQueuedEvent.eventSystemFlags |= eventSystemFlags;
        blockedOn = existingQueuedEvent.targetContainers;
        null !== targetContainer && -1 === blockedOn.indexOf(targetContainer) && blockedOn.push(targetContainer);
        return existingQueuedEvent;
      }
      function queueIfContinuousEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
        switch (domEventName) {
          case "focusin":
            return queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(
              queuedFocus,
              blockedOn,
              domEventName,
              eventSystemFlags,
              targetContainer,
              nativeEvent
            ), true;
          case "dragenter":
            return queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(
              queuedDrag,
              blockedOn,
              domEventName,
              eventSystemFlags,
              targetContainer,
              nativeEvent
            ), true;
          case "mouseover":
            return queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(
              queuedMouse,
              blockedOn,
              domEventName,
              eventSystemFlags,
              targetContainer,
              nativeEvent
            ), true;
          case "pointerover":
            var pointerId = nativeEvent.pointerId;
            queuedPointers.set(
              pointerId,
              accumulateOrCreateContinuousQueuedReplayableEvent(
                queuedPointers.get(pointerId) || null,
                blockedOn,
                domEventName,
                eventSystemFlags,
                targetContainer,
                nativeEvent
              )
            );
            return true;
          case "gotpointercapture":
            return pointerId = nativeEvent.pointerId, queuedPointerCaptures.set(
              pointerId,
              accumulateOrCreateContinuousQueuedReplayableEvent(
                queuedPointerCaptures.get(pointerId) || null,
                blockedOn,
                domEventName,
                eventSystemFlags,
                targetContainer,
                nativeEvent
              )
            ), true;
        }
        return false;
      }
      function attemptExplicitHydrationTarget(queuedTarget) {
        var targetInst = getClosestInstanceFromNode(queuedTarget.target);
        if (null !== targetInst) {
          var nearestMounted = getNearestMountedFiber(targetInst);
          if (null !== nearestMounted) {
            if (targetInst = nearestMounted.tag, 13 === targetInst) {
              if (targetInst = getSuspenseInstanceFromFiber(nearestMounted), null !== targetInst) {
                queuedTarget.blockedOn = targetInst;
                runWithPriority(queuedTarget.priority, function() {
                  attemptHydrationAtCurrentPriority(nearestMounted);
                });
                return;
              }
            } else if (31 === targetInst) {
              if (targetInst = getActivityInstanceFromFiber(nearestMounted), null !== targetInst) {
                queuedTarget.blockedOn = targetInst;
                runWithPriority(queuedTarget.priority, function() {
                  attemptHydrationAtCurrentPriority(nearestMounted);
                });
                return;
              }
            } else if (3 === targetInst && nearestMounted.stateNode.current.memoizedState.isDehydrated) {
              queuedTarget.blockedOn = 3 === nearestMounted.tag ? nearestMounted.stateNode.containerInfo : null;
              return;
            }
          }
        }
        queuedTarget.blockedOn = null;
      }
      function attemptReplayContinuousQueuedEvent(queuedEvent) {
        if (null !== queuedEvent.blockedOn) return false;
        for (var targetContainers = queuedEvent.targetContainers; 0 < targetContainers.length; ) {
          var nextBlockedOn = findInstanceBlockingEvent(queuedEvent.nativeEvent);
          if (null === nextBlockedOn) {
            nextBlockedOn = queuedEvent.nativeEvent;
            var nativeEventClone = new nextBlockedOn.constructor(
              nextBlockedOn.type,
              nextBlockedOn
            );
            currentReplayingEvent = nativeEventClone;
            nextBlockedOn.target.dispatchEvent(nativeEventClone);
            currentReplayingEvent = null;
          } else
            return targetContainers = getInstanceFromNode(nextBlockedOn), null !== targetContainers && attemptContinuousHydration(targetContainers), queuedEvent.blockedOn = nextBlockedOn, false;
          targetContainers.shift();
        }
        return true;
      }
      function attemptReplayContinuousQueuedEventInMap(queuedEvent, key, map) {
        attemptReplayContinuousQueuedEvent(queuedEvent) && map.delete(key);
      }
      function replayUnblockedEvents() {
        hasScheduledReplayAttempt = false;
        null !== queuedFocus && attemptReplayContinuousQueuedEvent(queuedFocus) && (queuedFocus = null);
        null !== queuedDrag && attemptReplayContinuousQueuedEvent(queuedDrag) && (queuedDrag = null);
        null !== queuedMouse && attemptReplayContinuousQueuedEvent(queuedMouse) && (queuedMouse = null);
        queuedPointers.forEach(attemptReplayContinuousQueuedEventInMap);
        queuedPointerCaptures.forEach(attemptReplayContinuousQueuedEventInMap);
      }
      function scheduleCallbackIfUnblocked(queuedEvent, unblocked) {
        queuedEvent.blockedOn === unblocked && (queuedEvent.blockedOn = null, hasScheduledReplayAttempt || (hasScheduledReplayAttempt = true, Scheduler.unstable_scheduleCallback(
          Scheduler.unstable_NormalPriority,
          replayUnblockedEvents
        )));
      }
      var lastScheduledReplayQueue = null;
      function scheduleReplayQueueIfNeeded(formReplayingQueue) {
        lastScheduledReplayQueue !== formReplayingQueue && (lastScheduledReplayQueue = formReplayingQueue, Scheduler.unstable_scheduleCallback(
          Scheduler.unstable_NormalPriority,
          function() {
            lastScheduledReplayQueue === formReplayingQueue && (lastScheduledReplayQueue = null);
            for (var i2 = 0; i2 < formReplayingQueue.length; i2 += 3) {
              var form = formReplayingQueue[i2], submitterOrAction = formReplayingQueue[i2 + 1], formData = formReplayingQueue[i2 + 2];
              if ("function" !== typeof submitterOrAction)
                if (null === findInstanceBlockingTarget(submitterOrAction || form))
                  continue;
                else break;
              var formInst = getInstanceFromNode(form);
              null !== formInst && (formReplayingQueue.splice(i2, 3), i2 -= 3, startHostTransition(
                formInst,
                {
                  pending: true,
                  data: formData,
                  method: form.method,
                  action: submitterOrAction
                },
                submitterOrAction,
                formData
              ));
            }
          }
        ));
      }
      function retryIfBlockedOn(unblocked) {
        function unblock(queuedEvent) {
          return scheduleCallbackIfUnblocked(queuedEvent, unblocked);
        }
        null !== queuedFocus && scheduleCallbackIfUnblocked(queuedFocus, unblocked);
        null !== queuedDrag && scheduleCallbackIfUnblocked(queuedDrag, unblocked);
        null !== queuedMouse && scheduleCallbackIfUnblocked(queuedMouse, unblocked);
        queuedPointers.forEach(unblock);
        queuedPointerCaptures.forEach(unblock);
        for (var i2 = 0; i2 < queuedExplicitHydrationTargets.length; i2++) {
          var queuedTarget = queuedExplicitHydrationTargets[i2];
          queuedTarget.blockedOn === unblocked && (queuedTarget.blockedOn = null);
        }
        for (; 0 < queuedExplicitHydrationTargets.length && (i2 = queuedExplicitHydrationTargets[0], null === i2.blockedOn); )
          attemptExplicitHydrationTarget(i2), null === i2.blockedOn && queuedExplicitHydrationTargets.shift();
        i2 = (unblocked.ownerDocument || unblocked).$$reactFormReplay;
        if (null != i2)
          for (queuedTarget = 0; queuedTarget < i2.length; queuedTarget += 3) {
            var form = i2[queuedTarget], submitterOrAction = i2[queuedTarget + 1], formProps = form[internalPropsKey] || null;
            if ("function" === typeof submitterOrAction)
              formProps || scheduleReplayQueueIfNeeded(i2);
            else if (formProps) {
              var action = null;
              if (submitterOrAction && submitterOrAction.hasAttribute("formAction"))
                if (form = submitterOrAction, formProps = submitterOrAction[internalPropsKey] || null)
                  action = formProps.formAction;
                else {
                  if (null !== findInstanceBlockingTarget(form)) continue;
                }
              else action = formProps.action;
              "function" === typeof action ? i2[queuedTarget + 1] = action : (i2.splice(queuedTarget, 3), queuedTarget -= 3);
              scheduleReplayQueueIfNeeded(i2);
            }
          }
      }
      function defaultOnDefaultTransitionIndicator() {
        function handleNavigate(event) {
          event.canIntercept && "react-transition" === event.info && event.intercept({
            handler: function() {
              return new Promise(function(resolve) {
                return pendingResolve = resolve;
              });
            },
            focusReset: "manual",
            scroll: "manual"
          });
        }
        function handleNavigateComplete() {
          null !== pendingResolve && (pendingResolve(), pendingResolve = null);
          isCancelled || setTimeout(startFakeNavigation, 20);
        }
        function startFakeNavigation() {
          if (!isCancelled && !navigation.transition) {
            var currentEntry = navigation.currentEntry;
            currentEntry && null != currentEntry.url && navigation.navigate(currentEntry.url, {
              state: currentEntry.getState(),
              info: "react-transition",
              history: "replace"
            });
          }
        }
        if ("object" === typeof navigation) {
          var isCancelled = false, pendingResolve = null;
          navigation.addEventListener("navigate", handleNavigate);
          navigation.addEventListener("navigatesuccess", handleNavigateComplete);
          navigation.addEventListener("navigateerror", handleNavigateComplete);
          setTimeout(startFakeNavigation, 100);
          return function() {
            isCancelled = true;
            navigation.removeEventListener("navigate", handleNavigate);
            navigation.removeEventListener("navigatesuccess", handleNavigateComplete);
            navigation.removeEventListener("navigateerror", handleNavigateComplete);
            null !== pendingResolve && (pendingResolve(), pendingResolve = null);
          };
        }
      }
      function ReactDOMRoot(internalRoot) {
        this._internalRoot = internalRoot;
      }
      ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render = function(children) {
        var root2 = this._internalRoot;
        if (null === root2) throw Error(formatProdErrorMessage(409));
        var current = root2.current, lane = requestUpdateLane();
        updateContainerImpl(current, lane, children, root2, null, null);
      };
      ReactDOMHydrationRoot.prototype.unmount = ReactDOMRoot.prototype.unmount = function() {
        var root2 = this._internalRoot;
        if (null !== root2) {
          this._internalRoot = null;
          var container = root2.containerInfo;
          updateContainerImpl(root2.current, 2, null, root2, null, null);
          flushSyncWork$1();
          container[internalContainerInstanceKey] = null;
        }
      };
      function ReactDOMHydrationRoot(internalRoot) {
        this._internalRoot = internalRoot;
      }
      ReactDOMHydrationRoot.prototype.unstable_scheduleHydration = function(target) {
        if (target) {
          var updatePriority = resolveUpdatePriority();
          target = { blockedOn: null, target, priority: updatePriority };
          for (var i2 = 0; i2 < queuedExplicitHydrationTargets.length && 0 !== updatePriority && updatePriority < queuedExplicitHydrationTargets[i2].priority; i2++) ;
          queuedExplicitHydrationTargets.splice(i2, 0, target);
          0 === i2 && attemptExplicitHydrationTarget(target);
        }
      };
      var isomorphicReactPackageVersion$jscomp$inline_1840 = React4.version;
      if ("19.2.4" !== isomorphicReactPackageVersion$jscomp$inline_1840)
        throw Error(
          formatProdErrorMessage(
            527,
            isomorphicReactPackageVersion$jscomp$inline_1840,
            "19.2.4"
          )
        );
      ReactDOMSharedInternals.findDOMNode = function(componentOrElement) {
        var fiber = componentOrElement._reactInternals;
        if (void 0 === fiber) {
          if ("function" === typeof componentOrElement.render)
            throw Error(formatProdErrorMessage(188));
          componentOrElement = Object.keys(componentOrElement).join(",");
          throw Error(formatProdErrorMessage(268, componentOrElement));
        }
        componentOrElement = findCurrentFiberUsingSlowPath(fiber);
        componentOrElement = null !== componentOrElement ? findCurrentHostFiberImpl(componentOrElement) : null;
        componentOrElement = null === componentOrElement ? null : componentOrElement.stateNode;
        return componentOrElement;
      };
      var internals$jscomp$inline_2347 = {
        bundleType: 0,
        version: "19.2.4",
        rendererPackageName: "react-dom",
        currentDispatcherRef: ReactSharedInternals,
        reconcilerVersion: "19.2.4"
      };
      if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
        hook$jscomp$inline_2348 = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!hook$jscomp$inline_2348.isDisabled && hook$jscomp$inline_2348.supportsFiber)
          try {
            rendererID = hook$jscomp$inline_2348.inject(
              internals$jscomp$inline_2347
            ), injectedHook = hook$jscomp$inline_2348;
          } catch (err) {
          }
      }
      var hook$jscomp$inline_2348;
      exports.createRoot = function(container, options2) {
        if (!isValidContainer(container)) throw Error(formatProdErrorMessage(299));
        var isStrictMode = false, identifierPrefix = "", onUncaughtError = defaultOnUncaughtError, onCaughtError = defaultOnCaughtError, onRecoverableError = defaultOnRecoverableError;
        null !== options2 && void 0 !== options2 && (true === options2.unstable_strictMode && (isStrictMode = true), void 0 !== options2.identifierPrefix && (identifierPrefix = options2.identifierPrefix), void 0 !== options2.onUncaughtError && (onUncaughtError = options2.onUncaughtError), void 0 !== options2.onCaughtError && (onCaughtError = options2.onCaughtError), void 0 !== options2.onRecoverableError && (onRecoverableError = options2.onRecoverableError));
        options2 = createFiberRoot(
          container,
          1,
          false,
          null,
          null,
          isStrictMode,
          identifierPrefix,
          null,
          onUncaughtError,
          onCaughtError,
          onRecoverableError,
          defaultOnDefaultTransitionIndicator
        );
        container[internalContainerInstanceKey] = options2.current;
        listenToAllSupportedEvents(container);
        return new ReactDOMRoot(options2);
      };
      exports.hydrateRoot = function(container, initialChildren, options2) {
        if (!isValidContainer(container)) throw Error(formatProdErrorMessage(299));
        var isStrictMode = false, identifierPrefix = "", onUncaughtError = defaultOnUncaughtError, onCaughtError = defaultOnCaughtError, onRecoverableError = defaultOnRecoverableError, formState = null;
        null !== options2 && void 0 !== options2 && (true === options2.unstable_strictMode && (isStrictMode = true), void 0 !== options2.identifierPrefix && (identifierPrefix = options2.identifierPrefix), void 0 !== options2.onUncaughtError && (onUncaughtError = options2.onUncaughtError), void 0 !== options2.onCaughtError && (onCaughtError = options2.onCaughtError), void 0 !== options2.onRecoverableError && (onRecoverableError = options2.onRecoverableError), void 0 !== options2.formState && (formState = options2.formState));
        initialChildren = createFiberRoot(
          container,
          1,
          true,
          initialChildren,
          null != options2 ? options2 : null,
          isStrictMode,
          identifierPrefix,
          formState,
          onUncaughtError,
          onCaughtError,
          onRecoverableError,
          defaultOnDefaultTransitionIndicator
        );
        initialChildren.context = getContextForSubtree(null);
        options2 = initialChildren.current;
        isStrictMode = requestUpdateLane();
        isStrictMode = getBumpedLaneForHydrationByLane(isStrictMode);
        identifierPrefix = createUpdate(isStrictMode);
        identifierPrefix.callback = null;
        enqueueUpdate(options2, identifierPrefix, isStrictMode);
        options2 = isStrictMode;
        initialChildren.current.lanes = options2;
        markRootUpdated$1(initialChildren, options2);
        ensureRootIsScheduled(initialChildren);
        container[internalContainerInstanceKey] = initialChildren.current;
        listenToAllSupportedEvents(container);
        return new ReactDOMHydrationRoot(initialChildren);
      };
      exports.version = "19.2.4";
    }
  });

  // node_modules/react-dom/client.js
  var require_client = __commonJS({
    "node_modules/react-dom/client.js"(exports, module) {
      "use strict";
      function checkDCE() {
        if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
          return;
        }
        if (false) {
          throw new Error("^_^");
        }
        try {
          __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
        } catch (err) {
          console.error(err);
        }
      }
      if (true) {
        checkDCE();
        module.exports = require_react_dom_client_production();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/react/cjs/react-jsx-runtime.production.js
  var require_react_jsx_runtime_production = __commonJS({
    "node_modules/react/cjs/react-jsx-runtime.production.js"(exports) {
      "use strict";
      var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element");
      var REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment");
      function jsxProd(type, config, maybeKey) {
        var key = null;
        void 0 !== maybeKey && (key = "" + maybeKey);
        void 0 !== config.key && (key = "" + config.key);
        if ("key" in config) {
          maybeKey = {};
          for (var propName in config)
            "key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        config = maybeKey.ref;
        return {
          $$typeof: REACT_ELEMENT_TYPE,
          type,
          key,
          ref: void 0 !== config ? config : null,
          props: maybeKey
        };
      }
      exports.Fragment = REACT_FRAGMENT_TYPE;
      exports.jsx = jsxProd;
      exports.jsxs = jsxProd;
    }
  });

  // node_modules/react/jsx-runtime.js
  var require_jsx_runtime = __commonJS({
    "node_modules/react/jsx-runtime.js"(exports, module) {
      "use strict";
      if (true) {
        module.exports = require_react_jsx_runtime_production();
      } else {
        module.exports = null;
      }
    }
  });

  // node_modules/events/events.js
  var require_events = __commonJS({
    "node_modules/events/events.js"(exports, module) {
      "use strict";
      var R = typeof Reflect === "object" ? Reflect : null;
      var ReflectApply = R && typeof R.apply === "function" ? R.apply : function ReflectApply2(target, receiver, args) {
        return Function.prototype.apply.call(target, receiver, args);
      };
      var ReflectOwnKeys;
      if (R && typeof R.ownKeys === "function") {
        ReflectOwnKeys = R.ownKeys;
      } else if (Object.getOwnPropertySymbols) {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target));
        };
      } else {
        ReflectOwnKeys = function ReflectOwnKeys2(target) {
          return Object.getOwnPropertyNames(target);
        };
      }
      function ProcessEmitWarning(warning) {
        if (console && console.warn) console.warn(warning);
      }
      var NumberIsNaN = Number.isNaN || function NumberIsNaN2(value) {
        return value !== value;
      };
      function EventEmitter3() {
        EventEmitter3.init.call(this);
      }
      module.exports = EventEmitter3;
      module.exports.once = once;
      EventEmitter3.EventEmitter = EventEmitter3;
      EventEmitter3.prototype._events = void 0;
      EventEmitter3.prototype._eventsCount = 0;
      EventEmitter3.prototype._maxListeners = void 0;
      var defaultMaxListeners = 10;
      function checkListener(listener) {
        if (typeof listener !== "function") {
          throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
        }
      }
      Object.defineProperty(EventEmitter3, "defaultMaxListeners", {
        enumerable: true,
        get: function() {
          return defaultMaxListeners;
        },
        set: function(arg) {
          if (typeof arg !== "number" || arg < 0 || NumberIsNaN(arg)) {
            throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + ".");
          }
          defaultMaxListeners = arg;
        }
      });
      EventEmitter3.init = function() {
        if (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) {
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
        }
        this._maxListeners = this._maxListeners || void 0;
      };
      EventEmitter3.prototype.setMaxListeners = function setMaxListeners(n2) {
        if (typeof n2 !== "number" || n2 < 0 || NumberIsNaN(n2)) {
          throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n2 + ".");
        }
        this._maxListeners = n2;
        return this;
      };
      function _getMaxListeners(that) {
        if (that._maxListeners === void 0)
          return EventEmitter3.defaultMaxListeners;
        return that._maxListeners;
      }
      EventEmitter3.prototype.getMaxListeners = function getMaxListeners() {
        return _getMaxListeners(this);
      };
      EventEmitter3.prototype.emit = function emit(type) {
        var args = [];
        for (var i2 = 1; i2 < arguments.length; i2++) args.push(arguments[i2]);
        var doError = type === "error";
        var events = this._events;
        if (events !== void 0)
          doError = doError && events.error === void 0;
        else if (!doError)
          return false;
        if (doError) {
          var er;
          if (args.length > 0)
            er = args[0];
          if (er instanceof Error) {
            throw er;
          }
          var err = new Error("Unhandled error." + (er ? " (" + er.message + ")" : ""));
          err.context = er;
          throw err;
        }
        var handler = events[type];
        if (handler === void 0)
          return false;
        if (typeof handler === "function") {
          ReflectApply(handler, this, args);
        } else {
          var len = handler.length;
          var listeners = arrayClone(handler, len);
          for (var i2 = 0; i2 < len; ++i2)
            ReflectApply(listeners[i2], this, args);
        }
        return true;
      };
      function _addListener(target, type, listener, prepend) {
        var m;
        var events;
        var existing;
        checkListener(listener);
        events = target._events;
        if (events === void 0) {
          events = target._events = /* @__PURE__ */ Object.create(null);
          target._eventsCount = 0;
        } else {
          if (events.newListener !== void 0) {
            target.emit(
              "newListener",
              type,
              listener.listener ? listener.listener : listener
            );
            events = target._events;
          }
          existing = events[type];
        }
        if (existing === void 0) {
          existing = events[type] = listener;
          ++target._eventsCount;
        } else {
          if (typeof existing === "function") {
            existing = events[type] = prepend ? [listener, existing] : [existing, listener];
          } else if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
          m = _getMaxListeners(target);
          if (m > 0 && existing.length > m && !existing.warned) {
            existing.warned = true;
            var w2 = new Error("Possible EventEmitter memory leak detected. " + existing.length + " " + String(type) + " listeners added. Use emitter.setMaxListeners() to increase limit");
            w2.name = "MaxListenersExceededWarning";
            w2.emitter = target;
            w2.type = type;
            w2.count = existing.length;
            ProcessEmitWarning(w2);
          }
        }
        return target;
      }
      EventEmitter3.prototype.addListener = function addListener(type, listener) {
        return _addListener(this, type, listener, false);
      };
      EventEmitter3.prototype.on = EventEmitter3.prototype.addListener;
      EventEmitter3.prototype.prependListener = function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
      };
      function onceWrapper() {
        if (!this.fired) {
          this.target.removeListener(this.type, this.wrapFn);
          this.fired = true;
          if (arguments.length === 0)
            return this.listener.call(this.target);
          return this.listener.apply(this.target, arguments);
        }
      }
      function _onceWrap(target, type, listener) {
        var state = { fired: false, wrapFn: void 0, target, type, listener };
        var wrapped = onceWrapper.bind(state);
        wrapped.listener = listener;
        state.wrapFn = wrapped;
        return wrapped;
      }
      EventEmitter3.prototype.once = function once2(type, listener) {
        checkListener(listener);
        this.on(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter3.prototype.prependOnceListener = function prependOnceListener(type, listener) {
        checkListener(listener);
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
      };
      EventEmitter3.prototype.removeListener = function removeListener(type, listener) {
        var list, events, position, i2, originalListener;
        checkListener(listener);
        events = this._events;
        if (events === void 0)
          return this;
        list = events[type];
        if (list === void 0)
          return this;
        if (list === listener || list.listener === listener) {
          if (--this._eventsCount === 0)
            this._events = /* @__PURE__ */ Object.create(null);
          else {
            delete events[type];
            if (events.removeListener)
              this.emit("removeListener", type, list.listener || listener);
          }
        } else if (typeof list !== "function") {
          position = -1;
          for (i2 = list.length - 1; i2 >= 0; i2--) {
            if (list[i2] === listener || list[i2].listener === listener) {
              originalListener = list[i2].listener;
              position = i2;
              break;
            }
          }
          if (position < 0)
            return this;
          if (position === 0)
            list.shift();
          else {
            spliceOne(list, position);
          }
          if (list.length === 1)
            events[type] = list[0];
          if (events.removeListener !== void 0)
            this.emit("removeListener", type, originalListener || listener);
        }
        return this;
      };
      EventEmitter3.prototype.off = EventEmitter3.prototype.removeListener;
      EventEmitter3.prototype.removeAllListeners = function removeAllListeners(type) {
        var listeners, events, i2;
        events = this._events;
        if (events === void 0)
          return this;
        if (events.removeListener === void 0) {
          if (arguments.length === 0) {
            this._events = /* @__PURE__ */ Object.create(null);
            this._eventsCount = 0;
          } else if (events[type] !== void 0) {
            if (--this._eventsCount === 0)
              this._events = /* @__PURE__ */ Object.create(null);
            else
              delete events[type];
          }
          return this;
        }
        if (arguments.length === 0) {
          var keys = Object.keys(events);
          var key;
          for (i2 = 0; i2 < keys.length; ++i2) {
            key = keys[i2];
            if (key === "removeListener") continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners("removeListener");
          this._events = /* @__PURE__ */ Object.create(null);
          this._eventsCount = 0;
          return this;
        }
        listeners = events[type];
        if (typeof listeners === "function") {
          this.removeListener(type, listeners);
        } else if (listeners !== void 0) {
          for (i2 = listeners.length - 1; i2 >= 0; i2--) {
            this.removeListener(type, listeners[i2]);
          }
        }
        return this;
      };
      function _listeners(target, type, unwrap) {
        var events = target._events;
        if (events === void 0)
          return [];
        var evlistener = events[type];
        if (evlistener === void 0)
          return [];
        if (typeof evlistener === "function")
          return unwrap ? [evlistener.listener || evlistener] : [evlistener];
        return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
      }
      EventEmitter3.prototype.listeners = function listeners(type) {
        return _listeners(this, type, true);
      };
      EventEmitter3.prototype.rawListeners = function rawListeners(type) {
        return _listeners(this, type, false);
      };
      EventEmitter3.listenerCount = function(emitter, type) {
        if (typeof emitter.listenerCount === "function") {
          return emitter.listenerCount(type);
        } else {
          return listenerCount.call(emitter, type);
        }
      };
      EventEmitter3.prototype.listenerCount = listenerCount;
      function listenerCount(type) {
        var events = this._events;
        if (events !== void 0) {
          var evlistener = events[type];
          if (typeof evlistener === "function") {
            return 1;
          } else if (evlistener !== void 0) {
            return evlistener.length;
          }
        }
        return 0;
      }
      EventEmitter3.prototype.eventNames = function eventNames() {
        return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
      };
      function arrayClone(arr, n2) {
        var copy = new Array(n2);
        for (var i2 = 0; i2 < n2; ++i2)
          copy[i2] = arr[i2];
        return copy;
      }
      function spliceOne(list, index) {
        for (; index + 1 < list.length; index++)
          list[index] = list[index + 1];
        list.pop();
      }
      function unwrapListeners(arr) {
        var ret = new Array(arr.length);
        for (var i2 = 0; i2 < ret.length; ++i2) {
          ret[i2] = arr[i2].listener || arr[i2];
        }
        return ret;
      }
      function once(emitter, name) {
        return new Promise(function(resolve, reject) {
          function errorListener(err) {
            emitter.removeListener(name, resolver);
            reject(err);
          }
          function resolver() {
            if (typeof emitter.removeListener === "function") {
              emitter.removeListener("error", errorListener);
            }
            resolve([].slice.call(arguments));
          }
          ;
          eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
          if (name !== "error") {
            addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
          }
        });
      }
      function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
        if (typeof emitter.on === "function") {
          eventTargetAgnosticAddListener(emitter, "error", handler, flags);
        }
      }
      function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
        if (typeof emitter.on === "function") {
          if (flags.once) {
            emitter.once(name, listener);
          } else {
            emitter.on(name, listener);
          }
        } else if (typeof emitter.addEventListener === "function") {
          emitter.addEventListener(name, function wrapListener(arg) {
            if (flags.once) {
              emitter.removeEventListener(name, wrapListener);
            }
            listener(arg);
          });
        } else {
          throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
        }
      }
    }
  });

  // node_modules/graphology-utils/is-graph.js
  var require_is_graph = __commonJS({
    "node_modules/graphology-utils/is-graph.js"(exports, module) {
      module.exports = function isGraph2(value) {
        return value !== null && typeof value === "object" && typeof value.addUndirectedEdgeWithKey === "function" && typeof value.dropNode === "function" && typeof value.multi === "boolean";
      };
    }
  });

  // testeranto/views/DebugGraph.wrapper.tsx
  var import_react4 = __toESM(require_react(), 1);
  var import_client = __toESM(require_client(), 1);

  // src/views/defaultViews/DebugGraphView.tsx
  var import_react3 = __toESM(require_react(), 1);

  // src/views/BaseViewClass.tsx
  var import_react = __toESM(require_react(), 1);

  // src/views/utils.ts
  function getSliceFilePath(viewName) {
    console.log("viewName", viewName);
    return `/testeranto/slices/views/${viewName}.json`;
  }
  function extractViewName(path) {
    if (path.startsWith("/~/views/") && path.endsWith("/slice")) {
      return path.split("/")[3];
    }
    if (path.startsWith("/slices/") && path.endsWith(".json")) {
      return path.split("/")[2].replace(".json", "");
    }
    const parts = path.split("/");
    const last = parts[parts.length - 1];
    return last.replace(".json", "").replace("/slice", "");
  }

  // src/views/BaseViewClass.tsx
  var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
  var BaseViewClass = class extends import_react.default.Component {
    constructor() {
      super(...arguments);
      __publicField(this, "state", {
        data: null,
        loading: true,
        error: null
      });
      __publicField(this, "ws", null);
      __publicField(this, "reconnectAttempts", 0);
      __publicField(this, "maxReconnectAttempts", 5);
      __publicField(this, "reconnectTimeout", null);
    }
    componentDidMount() {
      this.loadData();
      this.connectWebSocket();
    }
    componentDidUpdate(prevProps) {
      if (prevProps.slicePath !== this.props.slicePath) {
        this.loadData();
      }
      if (this.props.wsUpdate && this.props.wsUpdate.type === "update") {
        const currentViewName = extractViewName(this.props.slicePath);
        const updatedViewName = extractViewName(this.props.wsUpdate.path);
        if (updatedViewName === currentViewName) {
          console.log(`[BaseViewClass] WebSocket update received via props for view: ${currentViewName}, reloading data`);
          this.loadData();
        }
      }
    }
    componentWillUnmount() {
      this.disconnectWebSocket();
    }
    connectWebSocket() {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}`;
      console.log(`[BaseViewClass] Attempting to connect WebSocket for view ${extractViewName(this.props.slicePath)} to ${wsUrl}`);
      try {
        this.ws = new WebSocket(wsUrl);
        this.ws.onopen = () => {
          const viewName = extractViewName(this.props.slicePath);
          console.log(`[BaseViewClass] WebSocket connected for view: ${viewName}`);
          this.reconnectAttempts = 0;
          const subscribeMessage = {
            type: "subscribeToSlice",
            slicePath: `/~/views/${viewName}/slice`
          };
          console.log(`[BaseViewClass] Sending subscribe message:`, subscribeMessage);
          this.ws?.send(JSON.stringify(subscribeMessage));
        };
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error("[BaseViewClass] Error parsing WebSocket message:", error);
          }
        };
        this.ws.onclose = (event) => {
          console.log(`[BaseViewClass] WebSocket disconnected for view: ${extractViewName(this.props.slicePath)}`, event.code, event.reason);
          if (event.code !== 1e3 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1e3 * Math.pow(2, this.reconnectAttempts), 3e4);
            console.log(`[BaseViewClass] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.reconnectTimeout = setTimeout(() => {
              this.connectWebSocket();
            }, delay);
          }
        };
        this.ws.onerror = (error) => {
          const viewName = extractViewName(this.props.slicePath);
          console.error(`[BaseViewClass] WebSocket error for view ${viewName}:`, error);
          console.error(`[BaseViewClass] WebSocket readyState: ${this.ws?.readyState}`);
        };
      } catch (error) {
        console.error("[BaseViewClass] Failed to create WebSocket connection:", error);
      }
    }
    disconnectWebSocket() {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      if (this.ws) {
        const viewName = extractViewName(this.props.slicePath);
        const unsubscribeMessage = {
          type: "unsubscribeFromSlice",
          slicePath: `/~/views/${viewName}/slice`
        };
        try {
          this.ws.send(JSON.stringify(unsubscribeMessage));
        } catch (error) {
        }
        this.ws.close();
        this.ws = null;
      }
    }
    handleWebSocketMessage(message) {
      const viewName = extractViewName(this.props.slicePath);
      console.log(`[BaseViewClass] WebSocket message received for view ${viewName}:`, {
        type: message.type,
        url: message.url,
        slicePath: message.slicePath,
        timestamp: message.timestamp
      });
      switch (message.type) {
        case "resourceChanged":
          if (message.url && message.url.includes(`/~/views/${viewName}`)) {
            console.log(`[BaseViewClass] Resource changed for view ${viewName}, reloading data`);
            this.loadData();
          } else if (message.url && message.url === "/~/graph") {
            console.log(`[BaseViewClass] Graph resource changed, reloading data for view ${viewName}`);
            this.loadData();
          }
          break;
        case "sliceUpdated":
          if (message.slicePath === `/~/views/${viewName}/slice`) {
            console.log(`[BaseViewClass] Slice updated for view ${viewName}, reloading data`);
            this.loadData();
          }
          break;
        case "graphUpdated":
          console.log(`[BaseViewClass] Graph updated, reloading data for view ${viewName}`);
          this.loadData();
          break;
        case "subscribedToSlice":
          if (message.slicePath === `/~/views/${viewName}/slice`) {
            console.log(`[BaseViewClass] Successfully subscribed to slice updates for view ${viewName}`);
          }
          break;
        case "unsubscribedFromSlice":
          if (message.slicePath === `/~/views/${viewName}/slice`) {
            console.log(`[BaseViewClass] Unsubscribed from slice updates for view ${viewName}`);
          }
          break;
        default:
          console.log(`[BaseViewClass] Unhandled message type: ${message.type}`);
          break;
      }
    }
    async loadData() {
      const { slicePath } = this.props;
      if (!slicePath) {
        this.setState({ error: "slicePath is empty or undefined", loading: false });
        return;
      }
      try {
        this.setState({ loading: true, error: null });
        const viewName = extractViewName(slicePath);
        const staticFilePath = getSliceFilePath(viewName);
        const dataUrl = staticFilePath.startsWith("/") ? staticFilePath : `/${staticFilePath}`;
        console.log(`[BaseViewClass] Loading slice data from: ${dataUrl} (view: ${viewName}, original: ${slicePath})`);
        const cacheBuster = `?_t=${Date.now()}`;
        const response = await fetch(dataUrl + cacheBuster);
        if (!response.ok) {
          throw new Error(`Failed to load slice data from ${absolutePath}: ${response.status} ${response.statusText}`);
        }
        const jsonData = await response.json();
        this.setState({ data: jsonData, loading: false });
      } catch (err) {
        this.setState({
          error: err instanceof Error ? err.message : "Unknown error loading slice data",
          loading: false
        });
      }
    }
    render() {
      const { loading, error, data } = this.state;
      const { width = 800, height = 600 } = this.props;
      if (loading) {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width,
          height,
          border: "1px solid #ccc",
          borderRadius: "4px",
          backgroundColor: "#fafafa"
        }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { textAlign: "center" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Loading view..." }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Loading slice data from:" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: {
            fontFamily: "monospace",
            backgroundColor: "#f0f0f0",
            padding: "5px",
            borderRadius: "3px",
            margin: "10px",
            wordBreak: "break-all"
          }, children: this.props.slicePath }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
            "WebSocket: ",
            this.ws?.readyState === WebSocket.OPEN ? "Connected" : "Connecting..."
          ] })
        ] }) });
      }
      if (error) {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
          padding: "20px",
          border: "1px solid #d32f2f",
          borderRadius: "4px",
          backgroundColor: "#ffebee",
          color: "#d32f2f",
          width,
          height,
          overflow: "auto"
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Error loading view" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Error message:" }),
            " ",
            error
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Slice path:" }),
            " ",
            this.props.slicePath
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "WebSocket status:" }),
            " ",
            this.ws?.readyState === WebSocket.OPEN ? "Connected" : "Disconnected"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: () => this.loadData(),
              style: {
                padding: "8px 16px",
                backgroundColor: "#d32f2f",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "10px"
              },
              children: "Retry Load"
            }
          )
        ] });
      }
      if (!data) {
        return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: {
          padding: "20px",
          border: "1px solid #ff9800",
          borderRadius: "4px",
          backgroundColor: "#fff3e0",
          color: "#f57c00",
          width,
          height
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "No data available" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Slice data is empty or could not be parsed." }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
            "Slice path: ",
            this.props.slicePath
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: () => this.loadData(),
              style: {
                padding: "8px 16px",
                backgroundColor: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginTop: "10px"
              },
              children: "Retry Load"
            }
          )
        ] });
      }
      return this.renderContent();
    }
  };

  // node_modules/@react-sigma/core/lib/react-sigma_core.esm.min.js
  var e = __toESM(require_react(), 1);
  var import_react2 = __toESM(require_react(), 1);

  // node_modules/graphology/dist/graphology.mjs
  var import_events = __toESM(require_events(), 1);
  function assignPolyfill() {
    const target = arguments[0];
    for (let i2 = 1, l2 = arguments.length; i2 < l2; i2++) {
      if (!arguments[i2]) continue;
      for (const k in arguments[i2]) target[k] = arguments[i2][k];
    }
    return target;
  }
  var assign = assignPolyfill;
  if (typeof Object.assign === "function") assign = Object.assign;
  function getMatchingEdge(graph, source, target, type) {
    const sourceData = graph._nodes.get(source);
    let edge = null;
    if (!sourceData) return edge;
    if (type === "mixed") {
      edge = sourceData.out && sourceData.out[target] || sourceData.undirected && sourceData.undirected[target];
    } else if (type === "directed") {
      edge = sourceData.out && sourceData.out[target];
    } else {
      edge = sourceData.undirected && sourceData.undirected[target];
    }
    return edge;
  }
  function isPlainObject(value) {
    return typeof value === "object" && value !== null;
  }
  function isEmpty(o2) {
    let k;
    for (k in o2) return false;
    return true;
  }
  function privateProperty(target, name, value) {
    Object.defineProperty(target, name, {
      enumerable: false,
      configurable: false,
      writable: true,
      value
    });
  }
  function readOnlyProperty(target, name, value) {
    const descriptor = {
      enumerable: true,
      configurable: true
    };
    if (typeof value === "function") {
      descriptor.get = value;
    } else {
      descriptor.value = value;
      descriptor.writable = false;
    }
    Object.defineProperty(target, name, descriptor);
  }
  function validateHints(hints) {
    if (!isPlainObject(hints)) return false;
    if (hints.attributes && !Array.isArray(hints.attributes)) return false;
    return true;
  }
  function incrementalIdStartingFromRandomByte() {
    let i2 = Math.floor(Math.random() * 256) & 255;
    return () => {
      return i2++;
    };
  }
  function chain() {
    const iterables = arguments;
    let current = null;
    let i2 = -1;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        let step = null;
        do {
          if (current === null) {
            i2++;
            if (i2 >= iterables.length) return { done: true };
            current = iterables[i2][Symbol.iterator]();
          }
          step = current.next();
          if (step.done) {
            current = null;
            continue;
          }
          break;
        } while (true);
        return step;
      }
    };
  }
  function emptyIterator() {
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        return { done: true };
      }
    };
  }
  var GraphError = class extends Error {
    constructor(message) {
      super();
      this.name = "GraphError";
      this.message = message;
    }
  };
  var InvalidArgumentsGraphError = class _InvalidArgumentsGraphError extends GraphError {
    constructor(message) {
      super(message);
      this.name = "InvalidArgumentsGraphError";
      if (typeof Error.captureStackTrace === "function")
        Error.captureStackTrace(
          this,
          _InvalidArgumentsGraphError.prototype.constructor
        );
    }
  };
  var NotFoundGraphError = class _NotFoundGraphError extends GraphError {
    constructor(message) {
      super(message);
      this.name = "NotFoundGraphError";
      if (typeof Error.captureStackTrace === "function")
        Error.captureStackTrace(this, _NotFoundGraphError.prototype.constructor);
    }
  };
  var UsageGraphError = class _UsageGraphError extends GraphError {
    constructor(message) {
      super(message);
      this.name = "UsageGraphError";
      if (typeof Error.captureStackTrace === "function")
        Error.captureStackTrace(this, _UsageGraphError.prototype.constructor);
    }
  };
  function MixedNodeData(key, attributes) {
    this.key = key;
    this.attributes = attributes;
    this.clear();
  }
  MixedNodeData.prototype.clear = function() {
    this.inDegree = 0;
    this.outDegree = 0;
    this.undirectedDegree = 0;
    this.undirectedLoops = 0;
    this.directedLoops = 0;
    this.in = {};
    this.out = {};
    this.undirected = {};
  };
  function DirectedNodeData(key, attributes) {
    this.key = key;
    this.attributes = attributes;
    this.clear();
  }
  DirectedNodeData.prototype.clear = function() {
    this.inDegree = 0;
    this.outDegree = 0;
    this.directedLoops = 0;
    this.in = {};
    this.out = {};
  };
  function UndirectedNodeData(key, attributes) {
    this.key = key;
    this.attributes = attributes;
    this.clear();
  }
  UndirectedNodeData.prototype.clear = function() {
    this.undirectedDegree = 0;
    this.undirectedLoops = 0;
    this.undirected = {};
  };
  function EdgeData(undirected, key, source, target, attributes) {
    this.key = key;
    this.attributes = attributes;
    this.undirected = undirected;
    this.source = source;
    this.target = target;
  }
  EdgeData.prototype.attach = function() {
    let outKey = "out";
    let inKey = "in";
    if (this.undirected) outKey = inKey = "undirected";
    const source = this.source.key;
    const target = this.target.key;
    this.source[outKey][target] = this;
    if (this.undirected && source === target) return;
    this.target[inKey][source] = this;
  };
  EdgeData.prototype.attachMulti = function() {
    let outKey = "out";
    let inKey = "in";
    const source = this.source.key;
    const target = this.target.key;
    if (this.undirected) outKey = inKey = "undirected";
    const adj = this.source[outKey];
    const head = adj[target];
    if (typeof head === "undefined") {
      adj[target] = this;
      if (!(this.undirected && source === target)) {
        this.target[inKey][source] = this;
      }
      return;
    }
    head.previous = this;
    this.next = head;
    adj[target] = this;
    this.target[inKey][source] = this;
  };
  EdgeData.prototype.detach = function() {
    const source = this.source.key;
    const target = this.target.key;
    let outKey = "out";
    let inKey = "in";
    if (this.undirected) outKey = inKey = "undirected";
    delete this.source[outKey][target];
    delete this.target[inKey][source];
  };
  EdgeData.prototype.detachMulti = function() {
    const source = this.source.key;
    const target = this.target.key;
    let outKey = "out";
    let inKey = "in";
    if (this.undirected) outKey = inKey = "undirected";
    if (this.previous === void 0) {
      if (this.next === void 0) {
        delete this.source[outKey][target];
        delete this.target[inKey][source];
      } else {
        this.next.previous = void 0;
        this.source[outKey][target] = this.next;
        this.target[inKey][source] = this.next;
      }
    } else {
      this.previous.next = this.next;
      if (this.next !== void 0) {
        this.next.previous = this.previous;
      }
    }
  };
  var NODE = 0;
  var SOURCE = 1;
  var TARGET = 2;
  var OPPOSITE = 3;
  function findRelevantNodeData(graph, method, mode, nodeOrEdge, nameOrEdge, add1, add2) {
    let nodeData, edgeData, arg1, arg2;
    nodeOrEdge = "" + nodeOrEdge;
    if (mode === NODE) {
      nodeData = graph._nodes.get(nodeOrEdge);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.${method}: could not find the "${nodeOrEdge}" node in the graph.`
        );
      arg1 = nameOrEdge;
      arg2 = add1;
    } else if (mode === OPPOSITE) {
      nameOrEdge = "" + nameOrEdge;
      edgeData = graph._edges.get(nameOrEdge);
      if (!edgeData)
        throw new NotFoundGraphError(
          `Graph.${method}: could not find the "${nameOrEdge}" edge in the graph.`
        );
      const source = edgeData.source.key;
      const target = edgeData.target.key;
      if (nodeOrEdge === source) {
        nodeData = edgeData.target;
      } else if (nodeOrEdge === target) {
        nodeData = edgeData.source;
      } else {
        throw new NotFoundGraphError(
          `Graph.${method}: the "${nodeOrEdge}" node is not attached to the "${nameOrEdge}" edge (${source}, ${target}).`
        );
      }
      arg1 = add1;
      arg2 = add2;
    } else {
      edgeData = graph._edges.get(nodeOrEdge);
      if (!edgeData)
        throw new NotFoundGraphError(
          `Graph.${method}: could not find the "${nodeOrEdge}" edge in the graph.`
        );
      if (mode === SOURCE) {
        nodeData = edgeData.source;
      } else {
        nodeData = edgeData.target;
      }
      arg1 = nameOrEdge;
      arg2 = add1;
    }
    return [nodeData, arg1, arg2];
  }
  function attachNodeAttributeGetter(Class, method, mode) {
    Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1) {
      const [data, name] = findRelevantNodeData(
        this,
        method,
        mode,
        nodeOrEdge,
        nameOrEdge,
        add1
      );
      return data.attributes[name];
    };
  }
  function attachNodeAttributesGetter(Class, method, mode) {
    Class.prototype[method] = function(nodeOrEdge, nameOrEdge) {
      const [data] = findRelevantNodeData(
        this,
        method,
        mode,
        nodeOrEdge,
        nameOrEdge
      );
      return data.attributes;
    };
  }
  function attachNodeAttributeChecker(Class, method, mode) {
    Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1) {
      const [data, name] = findRelevantNodeData(
        this,
        method,
        mode,
        nodeOrEdge,
        nameOrEdge,
        add1
      );
      return data.attributes.hasOwnProperty(name);
    };
  }
  function attachNodeAttributeSetter(Class, method, mode) {
    Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1, add2) {
      const [data, name, value] = findRelevantNodeData(
        this,
        method,
        mode,
        nodeOrEdge,
        nameOrEdge,
        add1,
        add2
      );
      data.attributes[name] = value;
      this.emit("nodeAttributesUpdated", {
        key: data.key,
        type: "set",
        attributes: data.attributes,
        name
      });
      return this;
    };
  }
  function attachNodeAttributeUpdater(Class, method, mode) {
    Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1, add2) {
      const [data, name, updater] = findRelevantNodeData(
        this,
        method,
        mode,
        nodeOrEdge,
        nameOrEdge,
        add1,
        add2
      );
      if (typeof updater !== "function")
        throw new InvalidArgumentsGraphError(
          `Graph.${method}: updater should be a function.`
        );
      const attributes = data.attributes;
      const value = updater(attributes[name]);
      attributes[name] = value;
      this.emit("nodeAttributesUpdated", {
        key: data.key,
        type: "set",
        attributes: data.attributes,
        name
      });
      return this;
    };
  }
  function attachNodeAttributeRemover(Class, method, mode) {
    Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1) {
      const [data, name] = findRelevantNodeData(
        this,
        method,
        mode,
        nodeOrEdge,
        nameOrEdge,
        add1
      );
      delete data.attributes[name];
      this.emit("nodeAttributesUpdated", {
        key: data.key,
        type: "remove",
        attributes: data.attributes,
        name
      });
      return this;
    };
  }
  function attachNodeAttributesReplacer(Class, method, mode) {
    Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1) {
      const [data, attributes] = findRelevantNodeData(
        this,
        method,
        mode,
        nodeOrEdge,
        nameOrEdge,
        add1
      );
      if (!isPlainObject(attributes))
        throw new InvalidArgumentsGraphError(
          `Graph.${method}: provided attributes are not a plain object.`
        );
      data.attributes = attributes;
      this.emit("nodeAttributesUpdated", {
        key: data.key,
        type: "replace",
        attributes: data.attributes
      });
      return this;
    };
  }
  function attachNodeAttributesMerger(Class, method, mode) {
    Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1) {
      const [data, attributes] = findRelevantNodeData(
        this,
        method,
        mode,
        nodeOrEdge,
        nameOrEdge,
        add1
      );
      if (!isPlainObject(attributes))
        throw new InvalidArgumentsGraphError(
          `Graph.${method}: provided attributes are not a plain object.`
        );
      assign(data.attributes, attributes);
      this.emit("nodeAttributesUpdated", {
        key: data.key,
        type: "merge",
        attributes: data.attributes,
        data: attributes
      });
      return this;
    };
  }
  function attachNodeAttributesUpdater(Class, method, mode) {
    Class.prototype[method] = function(nodeOrEdge, nameOrEdge, add1) {
      const [data, updater] = findRelevantNodeData(
        this,
        method,
        mode,
        nodeOrEdge,
        nameOrEdge,
        add1
      );
      if (typeof updater !== "function")
        throw new InvalidArgumentsGraphError(
          `Graph.${method}: provided updater is not a function.`
        );
      data.attributes = updater(data.attributes);
      this.emit("nodeAttributesUpdated", {
        key: data.key,
        type: "update",
        attributes: data.attributes
      });
      return this;
    };
  }
  var NODE_ATTRIBUTES_METHODS = [
    {
      name: (element) => `get${element}Attribute`,
      attacher: attachNodeAttributeGetter
    },
    {
      name: (element) => `get${element}Attributes`,
      attacher: attachNodeAttributesGetter
    },
    {
      name: (element) => `has${element}Attribute`,
      attacher: attachNodeAttributeChecker
    },
    {
      name: (element) => `set${element}Attribute`,
      attacher: attachNodeAttributeSetter
    },
    {
      name: (element) => `update${element}Attribute`,
      attacher: attachNodeAttributeUpdater
    },
    {
      name: (element) => `remove${element}Attribute`,
      attacher: attachNodeAttributeRemover
    },
    {
      name: (element) => `replace${element}Attributes`,
      attacher: attachNodeAttributesReplacer
    },
    {
      name: (element) => `merge${element}Attributes`,
      attacher: attachNodeAttributesMerger
    },
    {
      name: (element) => `update${element}Attributes`,
      attacher: attachNodeAttributesUpdater
    }
  ];
  function attachNodeAttributesMethods(Graph2) {
    NODE_ATTRIBUTES_METHODS.forEach(function({ name, attacher }) {
      attacher(Graph2, name("Node"), NODE);
      attacher(Graph2, name("Source"), SOURCE);
      attacher(Graph2, name("Target"), TARGET);
      attacher(Graph2, name("Opposite"), OPPOSITE);
    });
  }
  function attachEdgeAttributeGetter(Class, method, type) {
    Class.prototype[method] = function(element, name) {
      let data;
      if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
        throw new UsageGraphError(
          `Graph.${method}: cannot find this type of edges in your ${this.type} graph.`
        );
      if (arguments.length > 2) {
        if (this.multi)
          throw new UsageGraphError(
            `Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`
          );
        const source = "" + element;
        const target = "" + name;
        name = arguments[2];
        data = getMatchingEdge(this, source, target, type);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`
          );
      } else {
        if (type !== "mixed")
          throw new UsageGraphError(
            `Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`
          );
        element = "" + element;
        data = this._edges.get(element);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find the "${element}" edge in the graph.`
          );
      }
      return data.attributes[name];
    };
  }
  function attachEdgeAttributesGetter(Class, method, type) {
    Class.prototype[method] = function(element) {
      let data;
      if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
        throw new UsageGraphError(
          `Graph.${method}: cannot find this type of edges in your ${this.type} graph.`
        );
      if (arguments.length > 1) {
        if (this.multi)
          throw new UsageGraphError(
            `Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`
          );
        const source = "" + element, target = "" + arguments[1];
        data = getMatchingEdge(this, source, target, type);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`
          );
      } else {
        if (type !== "mixed")
          throw new UsageGraphError(
            `Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`
          );
        element = "" + element;
        data = this._edges.get(element);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find the "${element}" edge in the graph.`
          );
      }
      return data.attributes;
    };
  }
  function attachEdgeAttributeChecker(Class, method, type) {
    Class.prototype[method] = function(element, name) {
      let data;
      if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
        throw new UsageGraphError(
          `Graph.${method}: cannot find this type of edges in your ${this.type} graph.`
        );
      if (arguments.length > 2) {
        if (this.multi)
          throw new UsageGraphError(
            `Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`
          );
        const source = "" + element;
        const target = "" + name;
        name = arguments[2];
        data = getMatchingEdge(this, source, target, type);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`
          );
      } else {
        if (type !== "mixed")
          throw new UsageGraphError(
            `Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`
          );
        element = "" + element;
        data = this._edges.get(element);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find the "${element}" edge in the graph.`
          );
      }
      return data.attributes.hasOwnProperty(name);
    };
  }
  function attachEdgeAttributeSetter(Class, method, type) {
    Class.prototype[method] = function(element, name, value) {
      let data;
      if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
        throw new UsageGraphError(
          `Graph.${method}: cannot find this type of edges in your ${this.type} graph.`
        );
      if (arguments.length > 3) {
        if (this.multi)
          throw new UsageGraphError(
            `Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`
          );
        const source = "" + element;
        const target = "" + name;
        name = arguments[2];
        value = arguments[3];
        data = getMatchingEdge(this, source, target, type);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`
          );
      } else {
        if (type !== "mixed")
          throw new UsageGraphError(
            `Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`
          );
        element = "" + element;
        data = this._edges.get(element);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find the "${element}" edge in the graph.`
          );
      }
      data.attributes[name] = value;
      this.emit("edgeAttributesUpdated", {
        key: data.key,
        type: "set",
        attributes: data.attributes,
        name
      });
      return this;
    };
  }
  function attachEdgeAttributeUpdater(Class, method, type) {
    Class.prototype[method] = function(element, name, updater) {
      let data;
      if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
        throw new UsageGraphError(
          `Graph.${method}: cannot find this type of edges in your ${this.type} graph.`
        );
      if (arguments.length > 3) {
        if (this.multi)
          throw new UsageGraphError(
            `Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`
          );
        const source = "" + element;
        const target = "" + name;
        name = arguments[2];
        updater = arguments[3];
        data = getMatchingEdge(this, source, target, type);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`
          );
      } else {
        if (type !== "mixed")
          throw new UsageGraphError(
            `Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`
          );
        element = "" + element;
        data = this._edges.get(element);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find the "${element}" edge in the graph.`
          );
      }
      if (typeof updater !== "function")
        throw new InvalidArgumentsGraphError(
          `Graph.${method}: updater should be a function.`
        );
      data.attributes[name] = updater(data.attributes[name]);
      this.emit("edgeAttributesUpdated", {
        key: data.key,
        type: "set",
        attributes: data.attributes,
        name
      });
      return this;
    };
  }
  function attachEdgeAttributeRemover(Class, method, type) {
    Class.prototype[method] = function(element, name) {
      let data;
      if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
        throw new UsageGraphError(
          `Graph.${method}: cannot find this type of edges in your ${this.type} graph.`
        );
      if (arguments.length > 2) {
        if (this.multi)
          throw new UsageGraphError(
            `Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`
          );
        const source = "" + element;
        const target = "" + name;
        name = arguments[2];
        data = getMatchingEdge(this, source, target, type);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`
          );
      } else {
        if (type !== "mixed")
          throw new UsageGraphError(
            `Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`
          );
        element = "" + element;
        data = this._edges.get(element);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find the "${element}" edge in the graph.`
          );
      }
      delete data.attributes[name];
      this.emit("edgeAttributesUpdated", {
        key: data.key,
        type: "remove",
        attributes: data.attributes,
        name
      });
      return this;
    };
  }
  function attachEdgeAttributesReplacer(Class, method, type) {
    Class.prototype[method] = function(element, attributes) {
      let data;
      if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
        throw new UsageGraphError(
          `Graph.${method}: cannot find this type of edges in your ${this.type} graph.`
        );
      if (arguments.length > 2) {
        if (this.multi)
          throw new UsageGraphError(
            `Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`
          );
        const source = "" + element, target = "" + attributes;
        attributes = arguments[2];
        data = getMatchingEdge(this, source, target, type);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`
          );
      } else {
        if (type !== "mixed")
          throw new UsageGraphError(
            `Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`
          );
        element = "" + element;
        data = this._edges.get(element);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find the "${element}" edge in the graph.`
          );
      }
      if (!isPlainObject(attributes))
        throw new InvalidArgumentsGraphError(
          `Graph.${method}: provided attributes are not a plain object.`
        );
      data.attributes = attributes;
      this.emit("edgeAttributesUpdated", {
        key: data.key,
        type: "replace",
        attributes: data.attributes
      });
      return this;
    };
  }
  function attachEdgeAttributesMerger(Class, method, type) {
    Class.prototype[method] = function(element, attributes) {
      let data;
      if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
        throw new UsageGraphError(
          `Graph.${method}: cannot find this type of edges in your ${this.type} graph.`
        );
      if (arguments.length > 2) {
        if (this.multi)
          throw new UsageGraphError(
            `Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`
          );
        const source = "" + element, target = "" + attributes;
        attributes = arguments[2];
        data = getMatchingEdge(this, source, target, type);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`
          );
      } else {
        if (type !== "mixed")
          throw new UsageGraphError(
            `Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`
          );
        element = "" + element;
        data = this._edges.get(element);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find the "${element}" edge in the graph.`
          );
      }
      if (!isPlainObject(attributes))
        throw new InvalidArgumentsGraphError(
          `Graph.${method}: provided attributes are not a plain object.`
        );
      assign(data.attributes, attributes);
      this.emit("edgeAttributesUpdated", {
        key: data.key,
        type: "merge",
        attributes: data.attributes,
        data: attributes
      });
      return this;
    };
  }
  function attachEdgeAttributesUpdater(Class, method, type) {
    Class.prototype[method] = function(element, updater) {
      let data;
      if (this.type !== "mixed" && type !== "mixed" && type !== this.type)
        throw new UsageGraphError(
          `Graph.${method}: cannot find this type of edges in your ${this.type} graph.`
        );
      if (arguments.length > 2) {
        if (this.multi)
          throw new UsageGraphError(
            `Graph.${method}: cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about.`
          );
        const source = "" + element, target = "" + updater;
        updater = arguments[2];
        data = getMatchingEdge(this, source, target, type);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find an edge for the given path ("${source}" - "${target}").`
          );
      } else {
        if (type !== "mixed")
          throw new UsageGraphError(
            `Graph.${method}: calling this method with only a key (vs. a source and target) does not make sense since an edge with this key could have the other type.`
          );
        element = "" + element;
        data = this._edges.get(element);
        if (!data)
          throw new NotFoundGraphError(
            `Graph.${method}: could not find the "${element}" edge in the graph.`
          );
      }
      if (typeof updater !== "function")
        throw new InvalidArgumentsGraphError(
          `Graph.${method}: provided updater is not a function.`
        );
      data.attributes = updater(data.attributes);
      this.emit("edgeAttributesUpdated", {
        key: data.key,
        type: "update",
        attributes: data.attributes
      });
      return this;
    };
  }
  var EDGE_ATTRIBUTES_METHODS = [
    {
      name: (element) => `get${element}Attribute`,
      attacher: attachEdgeAttributeGetter
    },
    {
      name: (element) => `get${element}Attributes`,
      attacher: attachEdgeAttributesGetter
    },
    {
      name: (element) => `has${element}Attribute`,
      attacher: attachEdgeAttributeChecker
    },
    {
      name: (element) => `set${element}Attribute`,
      attacher: attachEdgeAttributeSetter
    },
    {
      name: (element) => `update${element}Attribute`,
      attacher: attachEdgeAttributeUpdater
    },
    {
      name: (element) => `remove${element}Attribute`,
      attacher: attachEdgeAttributeRemover
    },
    {
      name: (element) => `replace${element}Attributes`,
      attacher: attachEdgeAttributesReplacer
    },
    {
      name: (element) => `merge${element}Attributes`,
      attacher: attachEdgeAttributesMerger
    },
    {
      name: (element) => `update${element}Attributes`,
      attacher: attachEdgeAttributesUpdater
    }
  ];
  function attachEdgeAttributesMethods(Graph2) {
    EDGE_ATTRIBUTES_METHODS.forEach(function({ name, attacher }) {
      attacher(Graph2, name("Edge"), "mixed");
      attacher(Graph2, name("DirectedEdge"), "directed");
      attacher(Graph2, name("UndirectedEdge"), "undirected");
    });
  }
  var EDGES_ITERATION = [
    {
      name: "edges",
      type: "mixed"
    },
    {
      name: "inEdges",
      type: "directed",
      direction: "in"
    },
    {
      name: "outEdges",
      type: "directed",
      direction: "out"
    },
    {
      name: "inboundEdges",
      type: "mixed",
      direction: "in"
    },
    {
      name: "outboundEdges",
      type: "mixed",
      direction: "out"
    },
    {
      name: "directedEdges",
      type: "directed"
    },
    {
      name: "undirectedEdges",
      type: "undirected"
    }
  ];
  function forEachSimple(breakable, object, callback, avoid) {
    let shouldBreak = false;
    for (const k in object) {
      if (k === avoid) continue;
      const edgeData = object[k];
      shouldBreak = callback(
        edgeData.key,
        edgeData.attributes,
        edgeData.source.key,
        edgeData.target.key,
        edgeData.source.attributes,
        edgeData.target.attributes,
        edgeData.undirected
      );
      if (breakable && shouldBreak) return edgeData.key;
    }
    return;
  }
  function forEachMulti(breakable, object, callback, avoid) {
    let edgeData, source, target;
    let shouldBreak = false;
    for (const k in object) {
      if (k === avoid) continue;
      edgeData = object[k];
      do {
        source = edgeData.source;
        target = edgeData.target;
        shouldBreak = callback(
          edgeData.key,
          edgeData.attributes,
          source.key,
          target.key,
          source.attributes,
          target.attributes,
          edgeData.undirected
        );
        if (breakable && shouldBreak) return edgeData.key;
        edgeData = edgeData.next;
      } while (edgeData !== void 0);
    }
    return;
  }
  function createIterator(object, avoid) {
    const keys = Object.keys(object);
    const l2 = keys.length;
    let edgeData;
    let i2 = 0;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        do {
          if (!edgeData) {
            if (i2 >= l2) return { done: true };
            const k = keys[i2++];
            if (k === avoid) {
              edgeData = void 0;
              continue;
            }
            edgeData = object[k];
          } else {
            edgeData = edgeData.next;
          }
        } while (!edgeData);
        return {
          done: false,
          value: {
            edge: edgeData.key,
            attributes: edgeData.attributes,
            source: edgeData.source.key,
            target: edgeData.target.key,
            sourceAttributes: edgeData.source.attributes,
            targetAttributes: edgeData.target.attributes,
            undirected: edgeData.undirected
          }
        };
      }
    };
  }
  function forEachForKeySimple(breakable, object, k, callback) {
    const edgeData = object[k];
    if (!edgeData) return;
    const sourceData = edgeData.source;
    const targetData = edgeData.target;
    if (callback(
      edgeData.key,
      edgeData.attributes,
      sourceData.key,
      targetData.key,
      sourceData.attributes,
      targetData.attributes,
      edgeData.undirected
    ) && breakable)
      return edgeData.key;
  }
  function forEachForKeyMulti(breakable, object, k, callback) {
    let edgeData = object[k];
    if (!edgeData) return;
    let shouldBreak = false;
    do {
      shouldBreak = callback(
        edgeData.key,
        edgeData.attributes,
        edgeData.source.key,
        edgeData.target.key,
        edgeData.source.attributes,
        edgeData.target.attributes,
        edgeData.undirected
      );
      if (breakable && shouldBreak) return edgeData.key;
      edgeData = edgeData.next;
    } while (edgeData !== void 0);
    return;
  }
  function createIteratorForKey(object, k) {
    let edgeData = object[k];
    if (edgeData.next !== void 0) {
      return {
        [Symbol.iterator]() {
          return this;
        },
        next() {
          if (!edgeData) return { done: true };
          const value = {
            edge: edgeData.key,
            attributes: edgeData.attributes,
            source: edgeData.source.key,
            target: edgeData.target.key,
            sourceAttributes: edgeData.source.attributes,
            targetAttributes: edgeData.target.attributes,
            undirected: edgeData.undirected
          };
          edgeData = edgeData.next;
          return {
            done: false,
            value
          };
        }
      };
    }
    let done = false;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        if (done === true) return { done: true };
        done = true;
        return {
          done: false,
          value: {
            edge: edgeData.key,
            attributes: edgeData.attributes,
            source: edgeData.source.key,
            target: edgeData.target.key,
            sourceAttributes: edgeData.source.attributes,
            targetAttributes: edgeData.target.attributes,
            undirected: edgeData.undirected
          }
        };
      }
    };
  }
  function createEdgeArray(graph, type) {
    if (graph.size === 0) return [];
    if (type === "mixed" || type === graph.type) {
      return Array.from(graph._edges.keys());
    }
    const size = type === "undirected" ? graph.undirectedSize : graph.directedSize;
    const list = new Array(size), mask = type === "undirected";
    const iterator = graph._edges.values();
    let i2 = 0;
    let step, data;
    while (step = iterator.next(), step.done !== true) {
      data = step.value;
      if (data.undirected === mask) list[i2++] = data.key;
    }
    return list;
  }
  function forEachEdge(breakable, graph, type, callback) {
    if (graph.size === 0) return;
    const shouldFilter = type !== "mixed" && type !== graph.type;
    const mask = type === "undirected";
    let step, data;
    let shouldBreak = false;
    const iterator = graph._edges.values();
    while (step = iterator.next(), step.done !== true) {
      data = step.value;
      if (shouldFilter && data.undirected !== mask) continue;
      const { key, attributes, source, target } = data;
      shouldBreak = callback(
        key,
        attributes,
        source.key,
        target.key,
        source.attributes,
        target.attributes,
        data.undirected
      );
      if (breakable && shouldBreak) return key;
    }
    return;
  }
  function createEdgeIterator(graph, type) {
    if (graph.size === 0) return emptyIterator();
    const shouldFilter = type !== "mixed" && type !== graph.type;
    const mask = type === "undirected";
    const iterator = graph._edges.values();
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        let step, data;
        while (true) {
          step = iterator.next();
          if (step.done) return step;
          data = step.value;
          if (shouldFilter && data.undirected !== mask) continue;
          break;
        }
        const value = {
          edge: data.key,
          attributes: data.attributes,
          source: data.source.key,
          target: data.target.key,
          sourceAttributes: data.source.attributes,
          targetAttributes: data.target.attributes,
          undirected: data.undirected
        };
        return { value, done: false };
      }
    };
  }
  function forEachEdgeForNode(breakable, multi, type, direction, nodeData, callback) {
    const fn = multi ? forEachMulti : forEachSimple;
    let found;
    if (type !== "undirected") {
      if (direction !== "out") {
        found = fn(breakable, nodeData.in, callback);
        if (breakable && found) return found;
      }
      if (direction !== "in") {
        found = fn(
          breakable,
          nodeData.out,
          callback,
          !direction ? nodeData.key : void 0
        );
        if (breakable && found) return found;
      }
    }
    if (type !== "directed") {
      found = fn(breakable, nodeData.undirected, callback);
      if (breakable && found) return found;
    }
    return;
  }
  function createEdgeArrayForNode(multi, type, direction, nodeData) {
    const edges = [];
    forEachEdgeForNode(false, multi, type, direction, nodeData, function(key) {
      edges.push(key);
    });
    return edges;
  }
  function createEdgeIteratorForNode(type, direction, nodeData) {
    let iterator = emptyIterator();
    if (type !== "undirected") {
      if (direction !== "out" && typeof nodeData.in !== "undefined")
        iterator = chain(iterator, createIterator(nodeData.in));
      if (direction !== "in" && typeof nodeData.out !== "undefined")
        iterator = chain(
          iterator,
          createIterator(nodeData.out, !direction ? nodeData.key : void 0)
        );
    }
    if (type !== "directed" && typeof nodeData.undirected !== "undefined") {
      iterator = chain(iterator, createIterator(nodeData.undirected));
    }
    return iterator;
  }
  function forEachEdgeForPath(breakable, type, multi, direction, sourceData, target, callback) {
    const fn = multi ? forEachForKeyMulti : forEachForKeySimple;
    let found;
    if (type !== "undirected") {
      if (typeof sourceData.in !== "undefined" && direction !== "out") {
        found = fn(breakable, sourceData.in, target, callback);
        if (breakable && found) return found;
      }
      if (typeof sourceData.out !== "undefined" && direction !== "in" && (direction || sourceData.key !== target)) {
        found = fn(breakable, sourceData.out, target, callback);
        if (breakable && found) return found;
      }
    }
    if (type !== "directed") {
      if (typeof sourceData.undirected !== "undefined") {
        found = fn(breakable, sourceData.undirected, target, callback);
        if (breakable && found) return found;
      }
    }
    return;
  }
  function createEdgeArrayForPath(type, multi, direction, sourceData, target) {
    const edges = [];
    forEachEdgeForPath(
      false,
      type,
      multi,
      direction,
      sourceData,
      target,
      function(key) {
        edges.push(key);
      }
    );
    return edges;
  }
  function createEdgeIteratorForPath(type, direction, sourceData, target) {
    let iterator = emptyIterator();
    if (type !== "undirected") {
      if (typeof sourceData.in !== "undefined" && direction !== "out" && target in sourceData.in)
        iterator = chain(iterator, createIteratorForKey(sourceData.in, target));
      if (typeof sourceData.out !== "undefined" && direction !== "in" && target in sourceData.out && (direction || sourceData.key !== target))
        iterator = chain(iterator, createIteratorForKey(sourceData.out, target));
    }
    if (type !== "directed") {
      if (typeof sourceData.undirected !== "undefined" && target in sourceData.undirected)
        iterator = chain(
          iterator,
          createIteratorForKey(sourceData.undirected, target)
        );
    }
    return iterator;
  }
  function attachEdgeArrayCreator(Class, description) {
    const { name, type, direction } = description;
    Class.prototype[name] = function(source, target) {
      if (type !== "mixed" && this.type !== "mixed" && type !== this.type)
        return [];
      if (!arguments.length) return createEdgeArray(this, type);
      if (arguments.length === 1) {
        source = "" + source;
        const nodeData = this._nodes.get(source);
        if (typeof nodeData === "undefined")
          throw new NotFoundGraphError(
            `Graph.${name}: could not find the "${source}" node in the graph.`
          );
        return createEdgeArrayForNode(
          this.multi,
          type === "mixed" ? this.type : type,
          direction,
          nodeData
        );
      }
      if (arguments.length === 2) {
        source = "" + source;
        target = "" + target;
        const sourceData = this._nodes.get(source);
        if (!sourceData)
          throw new NotFoundGraphError(
            `Graph.${name}:  could not find the "${source}" source node in the graph.`
          );
        if (!this._nodes.has(target))
          throw new NotFoundGraphError(
            `Graph.${name}:  could not find the "${target}" target node in the graph.`
          );
        return createEdgeArrayForPath(
          type,
          this.multi,
          direction,
          sourceData,
          target
        );
      }
      throw new InvalidArgumentsGraphError(
        `Graph.${name}: too many arguments (expecting 0, 1 or 2 and got ${arguments.length}).`
      );
    };
  }
  function attachForEachEdge(Class, description) {
    const { name, type, direction } = description;
    const forEachName = "forEach" + name[0].toUpperCase() + name.slice(1, -1);
    Class.prototype[forEachName] = function(source, target, callback) {
      if (type !== "mixed" && this.type !== "mixed" && type !== this.type) return;
      if (arguments.length === 1) {
        callback = source;
        return forEachEdge(false, this, type, callback);
      }
      if (arguments.length === 2) {
        source = "" + source;
        callback = target;
        const nodeData = this._nodes.get(source);
        if (typeof nodeData === "undefined")
          throw new NotFoundGraphError(
            `Graph.${forEachName}: could not find the "${source}" node in the graph.`
          );
        return forEachEdgeForNode(
          false,
          this.multi,
          type === "mixed" ? this.type : type,
          direction,
          nodeData,
          callback
        );
      }
      if (arguments.length === 3) {
        source = "" + source;
        target = "" + target;
        const sourceData = this._nodes.get(source);
        if (!sourceData)
          throw new NotFoundGraphError(
            `Graph.${forEachName}:  could not find the "${source}" source node in the graph.`
          );
        if (!this._nodes.has(target))
          throw new NotFoundGraphError(
            `Graph.${forEachName}:  could not find the "${target}" target node in the graph.`
          );
        return forEachEdgeForPath(
          false,
          type,
          this.multi,
          direction,
          sourceData,
          target,
          callback
        );
      }
      throw new InvalidArgumentsGraphError(
        `Graph.${forEachName}: too many arguments (expecting 1, 2 or 3 and got ${arguments.length}).`
      );
    };
    const mapName = "map" + name[0].toUpperCase() + name.slice(1);
    Class.prototype[mapName] = function() {
      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();
      let result;
      if (args.length === 0) {
        let length = 0;
        if (type !== "directed") length += this.undirectedSize;
        if (type !== "undirected") length += this.directedSize;
        result = new Array(length);
        let i2 = 0;
        args.push((e2, ea, s2, t2, sa, ta, u2) => {
          result[i2++] = callback(e2, ea, s2, t2, sa, ta, u2);
        });
      } else {
        result = [];
        args.push((e2, ea, s2, t2, sa, ta, u2) => {
          result.push(callback(e2, ea, s2, t2, sa, ta, u2));
        });
      }
      this[forEachName].apply(this, args);
      return result;
    };
    const filterName = "filter" + name[0].toUpperCase() + name.slice(1);
    Class.prototype[filterName] = function() {
      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();
      const result = [];
      args.push((e2, ea, s2, t2, sa, ta, u2) => {
        if (callback(e2, ea, s2, t2, sa, ta, u2)) result.push(e2);
      });
      this[forEachName].apply(this, args);
      return result;
    };
    const reduceName = "reduce" + name[0].toUpperCase() + name.slice(1);
    Class.prototype[reduceName] = function() {
      let args = Array.prototype.slice.call(arguments);
      if (args.length < 2 || args.length > 4) {
        throw new InvalidArgumentsGraphError(
          `Graph.${reduceName}: invalid number of arguments (expecting 2, 3 or 4 and got ${args.length}).`
        );
      }
      if (typeof args[args.length - 1] === "function" && typeof args[args.length - 2] !== "function") {
        throw new InvalidArgumentsGraphError(
          `Graph.${reduceName}: missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array.`
        );
      }
      let callback;
      let initialValue;
      if (args.length === 2) {
        callback = args[0];
        initialValue = args[1];
        args = [];
      } else if (args.length === 3) {
        callback = args[1];
        initialValue = args[2];
        args = [args[0]];
      } else if (args.length === 4) {
        callback = args[2];
        initialValue = args[3];
        args = [args[0], args[1]];
      }
      let accumulator = initialValue;
      args.push((e2, ea, s2, t2, sa, ta, u2) => {
        accumulator = callback(accumulator, e2, ea, s2, t2, sa, ta, u2);
      });
      this[forEachName].apply(this, args);
      return accumulator;
    };
  }
  function attachFindEdge(Class, description) {
    const { name, type, direction } = description;
    const findEdgeName = "find" + name[0].toUpperCase() + name.slice(1, -1);
    Class.prototype[findEdgeName] = function(source, target, callback) {
      if (type !== "mixed" && this.type !== "mixed" && type !== this.type)
        return false;
      if (arguments.length === 1) {
        callback = source;
        return forEachEdge(true, this, type, callback);
      }
      if (arguments.length === 2) {
        source = "" + source;
        callback = target;
        const nodeData = this._nodes.get(source);
        if (typeof nodeData === "undefined")
          throw new NotFoundGraphError(
            `Graph.${findEdgeName}: could not find the "${source}" node in the graph.`
          );
        return forEachEdgeForNode(
          true,
          this.multi,
          type === "mixed" ? this.type : type,
          direction,
          nodeData,
          callback
        );
      }
      if (arguments.length === 3) {
        source = "" + source;
        target = "" + target;
        const sourceData = this._nodes.get(source);
        if (!sourceData)
          throw new NotFoundGraphError(
            `Graph.${findEdgeName}:  could not find the "${source}" source node in the graph.`
          );
        if (!this._nodes.has(target))
          throw new NotFoundGraphError(
            `Graph.${findEdgeName}:  could not find the "${target}" target node in the graph.`
          );
        return forEachEdgeForPath(
          true,
          type,
          this.multi,
          direction,
          sourceData,
          target,
          callback
        );
      }
      throw new InvalidArgumentsGraphError(
        `Graph.${findEdgeName}: too many arguments (expecting 1, 2 or 3 and got ${arguments.length}).`
      );
    };
    const someName = "some" + name[0].toUpperCase() + name.slice(1, -1);
    Class.prototype[someName] = function() {
      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();
      args.push((e2, ea, s2, t2, sa, ta, u2) => {
        return callback(e2, ea, s2, t2, sa, ta, u2);
      });
      const found = this[findEdgeName].apply(this, args);
      if (found) return true;
      return false;
    };
    const everyName = "every" + name[0].toUpperCase() + name.slice(1, -1);
    Class.prototype[everyName] = function() {
      const args = Array.prototype.slice.call(arguments);
      const callback = args.pop();
      args.push((e2, ea, s2, t2, sa, ta, u2) => {
        return !callback(e2, ea, s2, t2, sa, ta, u2);
      });
      const found = this[findEdgeName].apply(this, args);
      if (found) return false;
      return true;
    };
  }
  function attachEdgeIteratorCreator(Class, description) {
    const { name: originalName, type, direction } = description;
    const name = originalName.slice(0, -1) + "Entries";
    Class.prototype[name] = function(source, target) {
      if (type !== "mixed" && this.type !== "mixed" && type !== this.type)
        return emptyIterator();
      if (!arguments.length) return createEdgeIterator(this, type);
      if (arguments.length === 1) {
        source = "" + source;
        const sourceData = this._nodes.get(source);
        if (!sourceData)
          throw new NotFoundGraphError(
            `Graph.${name}: could not find the "${source}" node in the graph.`
          );
        return createEdgeIteratorForNode(type, direction, sourceData);
      }
      if (arguments.length === 2) {
        source = "" + source;
        target = "" + target;
        const sourceData = this._nodes.get(source);
        if (!sourceData)
          throw new NotFoundGraphError(
            `Graph.${name}:  could not find the "${source}" source node in the graph.`
          );
        if (!this._nodes.has(target))
          throw new NotFoundGraphError(
            `Graph.${name}:  could not find the "${target}" target node in the graph.`
          );
        return createEdgeIteratorForPath(type, direction, sourceData, target);
      }
      throw new InvalidArgumentsGraphError(
        `Graph.${name}: too many arguments (expecting 0, 1 or 2 and got ${arguments.length}).`
      );
    };
  }
  function attachEdgeIterationMethods(Graph2) {
    EDGES_ITERATION.forEach((description) => {
      attachEdgeArrayCreator(Graph2, description);
      attachForEachEdge(Graph2, description);
      attachFindEdge(Graph2, description);
      attachEdgeIteratorCreator(Graph2, description);
    });
  }
  var NEIGHBORS_ITERATION = [
    {
      name: "neighbors",
      type: "mixed"
    },
    {
      name: "inNeighbors",
      type: "directed",
      direction: "in"
    },
    {
      name: "outNeighbors",
      type: "directed",
      direction: "out"
    },
    {
      name: "inboundNeighbors",
      type: "mixed",
      direction: "in"
    },
    {
      name: "outboundNeighbors",
      type: "mixed",
      direction: "out"
    },
    {
      name: "directedNeighbors",
      type: "directed"
    },
    {
      name: "undirectedNeighbors",
      type: "undirected"
    }
  ];
  function CompositeSetWrapper() {
    this.A = null;
    this.B = null;
  }
  CompositeSetWrapper.prototype.wrap = function(set) {
    if (this.A === null) this.A = set;
    else if (this.B === null) this.B = set;
  };
  CompositeSetWrapper.prototype.has = function(key) {
    if (this.A !== null && key in this.A) return true;
    if (this.B !== null && key in this.B) return true;
    return false;
  };
  function forEachInObjectOnce(breakable, visited, nodeData, object, callback) {
    for (const k in object) {
      const edgeData = object[k];
      const sourceData = edgeData.source;
      const targetData = edgeData.target;
      const neighborData = sourceData === nodeData ? targetData : sourceData;
      if (visited && visited.has(neighborData.key)) continue;
      const shouldBreak = callback(neighborData.key, neighborData.attributes);
      if (breakable && shouldBreak) return neighborData.key;
    }
    return;
  }
  function forEachNeighbor(breakable, type, direction, nodeData, callback) {
    if (type !== "mixed") {
      if (type === "undirected")
        return forEachInObjectOnce(
          breakable,
          null,
          nodeData,
          nodeData.undirected,
          callback
        );
      if (typeof direction === "string")
        return forEachInObjectOnce(
          breakable,
          null,
          nodeData,
          nodeData[direction],
          callback
        );
    }
    const visited = new CompositeSetWrapper();
    let found;
    if (type !== "undirected") {
      if (direction !== "out") {
        found = forEachInObjectOnce(
          breakable,
          null,
          nodeData,
          nodeData.in,
          callback
        );
        if (breakable && found) return found;
        visited.wrap(nodeData.in);
      }
      if (direction !== "in") {
        found = forEachInObjectOnce(
          breakable,
          visited,
          nodeData,
          nodeData.out,
          callback
        );
        if (breakable && found) return found;
        visited.wrap(nodeData.out);
      }
    }
    if (type !== "directed") {
      found = forEachInObjectOnce(
        breakable,
        visited,
        nodeData,
        nodeData.undirected,
        callback
      );
      if (breakable && found) return found;
    }
    return;
  }
  function createNeighborArrayForNode(type, direction, nodeData) {
    if (type !== "mixed") {
      if (type === "undirected") return Object.keys(nodeData.undirected);
      if (typeof direction === "string") return Object.keys(nodeData[direction]);
    }
    const neighbors = [];
    forEachNeighbor(false, type, direction, nodeData, function(key) {
      neighbors.push(key);
    });
    return neighbors;
  }
  function createDedupedObjectIterator(visited, nodeData, object) {
    const keys = Object.keys(object);
    const l2 = keys.length;
    let i2 = 0;
    return {
      [Symbol.iterator]() {
        return this;
      },
      next() {
        let neighborData = null;
        do {
          if (i2 >= l2) {
            if (visited) visited.wrap(object);
            return { done: true };
          }
          const edgeData = object[keys[i2++]];
          const sourceData = edgeData.source;
          const targetData = edgeData.target;
          neighborData = sourceData === nodeData ? targetData : sourceData;
          if (visited && visited.has(neighborData.key)) {
            neighborData = null;
            continue;
          }
        } while (neighborData === null);
        return {
          done: false,
          value: { neighbor: neighborData.key, attributes: neighborData.attributes }
        };
      }
    };
  }
  function createNeighborIterator(type, direction, nodeData) {
    if (type !== "mixed") {
      if (type === "undirected")
        return createDedupedObjectIterator(null, nodeData, nodeData.undirected);
      if (typeof direction === "string")
        return createDedupedObjectIterator(null, nodeData, nodeData[direction]);
    }
    let iterator = emptyIterator();
    const visited = new CompositeSetWrapper();
    if (type !== "undirected") {
      if (direction !== "out") {
        iterator = chain(
          iterator,
          createDedupedObjectIterator(visited, nodeData, nodeData.in)
        );
      }
      if (direction !== "in") {
        iterator = chain(
          iterator,
          createDedupedObjectIterator(visited, nodeData, nodeData.out)
        );
      }
    }
    if (type !== "directed") {
      iterator = chain(
        iterator,
        createDedupedObjectIterator(visited, nodeData, nodeData.undirected)
      );
    }
    return iterator;
  }
  function attachNeighborArrayCreator(Class, description) {
    const { name, type, direction } = description;
    Class.prototype[name] = function(node) {
      if (type !== "mixed" && this.type !== "mixed" && type !== this.type)
        return [];
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (typeof nodeData === "undefined")
        throw new NotFoundGraphError(
          `Graph.${name}: could not find the "${node}" node in the graph.`
        );
      return createNeighborArrayForNode(
        type === "mixed" ? this.type : type,
        direction,
        nodeData
      );
    };
  }
  function attachForEachNeighbor(Class, description) {
    const { name, type, direction } = description;
    const forEachName = "forEach" + name[0].toUpperCase() + name.slice(1, -1);
    Class.prototype[forEachName] = function(node, callback) {
      if (type !== "mixed" && this.type !== "mixed" && type !== this.type) return;
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (typeof nodeData === "undefined")
        throw new NotFoundGraphError(
          `Graph.${forEachName}: could not find the "${node}" node in the graph.`
        );
      forEachNeighbor(
        false,
        type === "mixed" ? this.type : type,
        direction,
        nodeData,
        callback
      );
    };
    const mapName = "map" + name[0].toUpperCase() + name.slice(1);
    Class.prototype[mapName] = function(node, callback) {
      const result = [];
      this[forEachName](node, (n2, a2) => {
        result.push(callback(n2, a2));
      });
      return result;
    };
    const filterName = "filter" + name[0].toUpperCase() + name.slice(1);
    Class.prototype[filterName] = function(node, callback) {
      const result = [];
      this[forEachName](node, (n2, a2) => {
        if (callback(n2, a2)) result.push(n2);
      });
      return result;
    };
    const reduceName = "reduce" + name[0].toUpperCase() + name.slice(1);
    Class.prototype[reduceName] = function(node, callback, initialValue) {
      if (arguments.length < 3)
        throw new InvalidArgumentsGraphError(
          `Graph.${reduceName}: missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array.`
        );
      let accumulator = initialValue;
      this[forEachName](node, (n2, a2) => {
        accumulator = callback(accumulator, n2, a2);
      });
      return accumulator;
    };
  }
  function attachFindNeighbor(Class, description) {
    const { name, type, direction } = description;
    const capitalizedSingular = name[0].toUpperCase() + name.slice(1, -1);
    const findName = "find" + capitalizedSingular;
    Class.prototype[findName] = function(node, callback) {
      if (type !== "mixed" && this.type !== "mixed" && type !== this.type) return;
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (typeof nodeData === "undefined")
        throw new NotFoundGraphError(
          `Graph.${findName}: could not find the "${node}" node in the graph.`
        );
      return forEachNeighbor(
        true,
        type === "mixed" ? this.type : type,
        direction,
        nodeData,
        callback
      );
    };
    const someName = "some" + capitalizedSingular;
    Class.prototype[someName] = function(node, callback) {
      const found = this[findName](node, callback);
      if (found) return true;
      return false;
    };
    const everyName = "every" + capitalizedSingular;
    Class.prototype[everyName] = function(node, callback) {
      const found = this[findName](node, (n2, a2) => {
        return !callback(n2, a2);
      });
      if (found) return false;
      return true;
    };
  }
  function attachNeighborIteratorCreator(Class, description) {
    const { name, type, direction } = description;
    const iteratorName = name.slice(0, -1) + "Entries";
    Class.prototype[iteratorName] = function(node) {
      if (type !== "mixed" && this.type !== "mixed" && type !== this.type)
        return emptyIterator();
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (typeof nodeData === "undefined")
        throw new NotFoundGraphError(
          `Graph.${iteratorName}: could not find the "${node}" node in the graph.`
        );
      return createNeighborIterator(
        type === "mixed" ? this.type : type,
        direction,
        nodeData
      );
    };
  }
  function attachNeighborIterationMethods(Graph2) {
    NEIGHBORS_ITERATION.forEach((description) => {
      attachNeighborArrayCreator(Graph2, description);
      attachForEachNeighbor(Graph2, description);
      attachFindNeighbor(Graph2, description);
      attachNeighborIteratorCreator(Graph2, description);
    });
  }
  function forEachAdjacency(breakable, assymetric, disconnectedNodes, graph, callback) {
    const iterator = graph._nodes.values();
    const type = graph.type;
    let step, sourceData, neighbor, adj, edgeData, targetData, shouldBreak;
    while (step = iterator.next(), step.done !== true) {
      let hasEdges = false;
      sourceData = step.value;
      if (type !== "undirected") {
        adj = sourceData.out;
        for (neighbor in adj) {
          edgeData = adj[neighbor];
          do {
            targetData = edgeData.target;
            hasEdges = true;
            shouldBreak = callback(
              sourceData.key,
              targetData.key,
              sourceData.attributes,
              targetData.attributes,
              edgeData.key,
              edgeData.attributes,
              edgeData.undirected
            );
            if (breakable && shouldBreak) return edgeData;
            edgeData = edgeData.next;
          } while (edgeData);
        }
      }
      if (type !== "directed") {
        adj = sourceData.undirected;
        for (neighbor in adj) {
          if (assymetric && sourceData.key > neighbor) continue;
          edgeData = adj[neighbor];
          do {
            targetData = edgeData.target;
            if (targetData.key !== neighbor) targetData = edgeData.source;
            hasEdges = true;
            shouldBreak = callback(
              sourceData.key,
              targetData.key,
              sourceData.attributes,
              targetData.attributes,
              edgeData.key,
              edgeData.attributes,
              edgeData.undirected
            );
            if (breakable && shouldBreak) return edgeData;
            edgeData = edgeData.next;
          } while (edgeData);
        }
      }
      if (disconnectedNodes && !hasEdges) {
        shouldBreak = callback(
          sourceData.key,
          null,
          sourceData.attributes,
          null,
          null,
          null,
          null
        );
        if (breakable && shouldBreak) return null;
      }
    }
    return;
  }
  function serializeNode(key, data) {
    const serialized = { key };
    if (!isEmpty(data.attributes))
      serialized.attributes = assign({}, data.attributes);
    return serialized;
  }
  function serializeEdge(type, key, data) {
    const serialized = {
      key,
      source: data.source.key,
      target: data.target.key
    };
    if (!isEmpty(data.attributes))
      serialized.attributes = assign({}, data.attributes);
    if (type === "mixed" && data.undirected) serialized.undirected = true;
    return serialized;
  }
  function validateSerializedNode(value) {
    if (!isPlainObject(value))
      throw new InvalidArgumentsGraphError(
        'Graph.import: invalid serialized node. A serialized node should be a plain object with at least a "key" property.'
      );
    if (!("key" in value))
      throw new InvalidArgumentsGraphError(
        "Graph.import: serialized node is missing its key."
      );
    if ("attributes" in value && (!isPlainObject(value.attributes) || value.attributes === null))
      throw new InvalidArgumentsGraphError(
        "Graph.import: invalid attributes. Attributes should be a plain object, null or omitted."
      );
  }
  function validateSerializedEdge(value) {
    if (!isPlainObject(value))
      throw new InvalidArgumentsGraphError(
        'Graph.import: invalid serialized edge. A serialized edge should be a plain object with at least a "source" & "target" property.'
      );
    if (!("source" in value))
      throw new InvalidArgumentsGraphError(
        "Graph.import: serialized edge is missing its source."
      );
    if (!("target" in value))
      throw new InvalidArgumentsGraphError(
        "Graph.import: serialized edge is missing its target."
      );
    if ("attributes" in value && (!isPlainObject(value.attributes) || value.attributes === null))
      throw new InvalidArgumentsGraphError(
        "Graph.import: invalid attributes. Attributes should be a plain object, null or omitted."
      );
    if ("undirected" in value && typeof value.undirected !== "boolean")
      throw new InvalidArgumentsGraphError(
        "Graph.import: invalid undirectedness information. Undirected should be boolean or omitted."
      );
  }
  var INSTANCE_ID = incrementalIdStartingFromRandomByte();
  var TYPES = /* @__PURE__ */ new Set(["directed", "undirected", "mixed"]);
  var EMITTER_PROPS = /* @__PURE__ */ new Set([
    "domain",
    "_events",
    "_eventsCount",
    "_maxListeners"
  ]);
  var EDGE_ADD_METHODS = [
    {
      name: (verb) => `${verb}Edge`,
      generateKey: true
    },
    {
      name: (verb) => `${verb}DirectedEdge`,
      generateKey: true,
      type: "directed"
    },
    {
      name: (verb) => `${verb}UndirectedEdge`,
      generateKey: true,
      type: "undirected"
    },
    {
      name: (verb) => `${verb}EdgeWithKey`
    },
    {
      name: (verb) => `${verb}DirectedEdgeWithKey`,
      type: "directed"
    },
    {
      name: (verb) => `${verb}UndirectedEdgeWithKey`,
      type: "undirected"
    }
  ];
  var DEFAULTS = {
    allowSelfLoops: true,
    multi: false,
    type: "mixed"
  };
  function addNode(graph, node, attributes) {
    if (attributes && !isPlainObject(attributes))
      throw new InvalidArgumentsGraphError(
        `Graph.addNode: invalid attributes. Expecting an object but got "${attributes}"`
      );
    node = "" + node;
    attributes = attributes || {};
    if (graph._nodes.has(node))
      throw new UsageGraphError(
        `Graph.addNode: the "${node}" node already exist in the graph.`
      );
    const data = new graph.NodeDataClass(node, attributes);
    graph._nodes.set(node, data);
    graph.emit("nodeAdded", {
      key: node,
      attributes
    });
    return data;
  }
  function unsafeAddNode(graph, node, attributes) {
    const data = new graph.NodeDataClass(node, attributes);
    graph._nodes.set(node, data);
    graph.emit("nodeAdded", {
      key: node,
      attributes
    });
    return data;
  }
  function addEdge(graph, name, mustGenerateKey, undirected, edge, source, target, attributes) {
    if (!undirected && graph.type === "undirected")
      throw new UsageGraphError(
        `Graph.${name}: you cannot add a directed edge to an undirected graph. Use the #.addEdge or #.addUndirectedEdge instead.`
      );
    if (undirected && graph.type === "directed")
      throw new UsageGraphError(
        `Graph.${name}: you cannot add an undirected edge to a directed graph. Use the #.addEdge or #.addDirectedEdge instead.`
      );
    if (attributes && !isPlainObject(attributes))
      throw new InvalidArgumentsGraphError(
        `Graph.${name}: invalid attributes. Expecting an object but got "${attributes}"`
      );
    source = "" + source;
    target = "" + target;
    attributes = attributes || {};
    if (!graph.allowSelfLoops && source === target)
      throw new UsageGraphError(
        `Graph.${name}: source & target are the same ("${source}"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false.`
      );
    const sourceData = graph._nodes.get(source), targetData = graph._nodes.get(target);
    if (!sourceData)
      throw new NotFoundGraphError(
        `Graph.${name}: source node "${source}" not found.`
      );
    if (!targetData)
      throw new NotFoundGraphError(
        `Graph.${name}: target node "${target}" not found.`
      );
    const eventData = {
      key: null,
      undirected,
      source,
      target,
      attributes
    };
    if (mustGenerateKey) {
      edge = graph._edgeKeyGenerator();
    } else {
      edge = "" + edge;
      if (graph._edges.has(edge))
        throw new UsageGraphError(
          `Graph.${name}: the "${edge}" edge already exists in the graph.`
        );
    }
    if (!graph.multi && (undirected ? typeof sourceData.undirected[target] !== "undefined" : typeof sourceData.out[target] !== "undefined")) {
      throw new UsageGraphError(
        `Graph.${name}: an edge linking "${source}" to "${target}" already exists. If you really want to add multiple edges linking those nodes, you should create a multi graph by using the 'multi' option.`
      );
    }
    const edgeData = new EdgeData(
      undirected,
      edge,
      sourceData,
      targetData,
      attributes
    );
    graph._edges.set(edge, edgeData);
    const isSelfLoop = source === target;
    if (undirected) {
      sourceData.undirectedDegree++;
      targetData.undirectedDegree++;
      if (isSelfLoop) {
        sourceData.undirectedLoops++;
        graph._undirectedSelfLoopCount++;
      }
    } else {
      sourceData.outDegree++;
      targetData.inDegree++;
      if (isSelfLoop) {
        sourceData.directedLoops++;
        graph._directedSelfLoopCount++;
      }
    }
    if (graph.multi) edgeData.attachMulti();
    else edgeData.attach();
    if (undirected) graph._undirectedSize++;
    else graph._directedSize++;
    eventData.key = edge;
    graph.emit("edgeAdded", eventData);
    return edge;
  }
  function mergeEdge(graph, name, mustGenerateKey, undirected, edge, source, target, attributes, asUpdater) {
    if (!undirected && graph.type === "undirected")
      throw new UsageGraphError(
        `Graph.${name}: you cannot merge/update a directed edge to an undirected graph. Use the #.mergeEdge/#.updateEdge or #.addUndirectedEdge instead.`
      );
    if (undirected && graph.type === "directed")
      throw new UsageGraphError(
        `Graph.${name}: you cannot merge/update an undirected edge to a directed graph. Use the #.mergeEdge/#.updateEdge or #.addDirectedEdge instead.`
      );
    if (attributes) {
      if (asUpdater) {
        if (typeof attributes !== "function")
          throw new InvalidArgumentsGraphError(
            `Graph.${name}: invalid updater function. Expecting a function but got "${attributes}"`
          );
      } else {
        if (!isPlainObject(attributes))
          throw new InvalidArgumentsGraphError(
            `Graph.${name}: invalid attributes. Expecting an object but got "${attributes}"`
          );
      }
    }
    source = "" + source;
    target = "" + target;
    let updater;
    if (asUpdater) {
      updater = attributes;
      attributes = void 0;
    }
    if (!graph.allowSelfLoops && source === target)
      throw new UsageGraphError(
        `Graph.${name}: source & target are the same ("${source}"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false.`
      );
    let sourceData = graph._nodes.get(source);
    let targetData = graph._nodes.get(target);
    let edgeData;
    let alreadyExistingEdgeData;
    if (!mustGenerateKey) {
      edgeData = graph._edges.get(edge);
      if (edgeData) {
        if (edgeData.source.key !== source || edgeData.target.key !== target) {
          if (!undirected || edgeData.source.key !== target || edgeData.target.key !== source) {
            throw new UsageGraphError(
              `Graph.${name}: inconsistency detected when attempting to merge the "${edge}" edge with "${source}" source & "${target}" target vs. ("${edgeData.source.key}", "${edgeData.target.key}").`
            );
          }
        }
        alreadyExistingEdgeData = edgeData;
      }
    }
    if (!alreadyExistingEdgeData && !graph.multi && sourceData) {
      alreadyExistingEdgeData = undirected ? sourceData.undirected[target] : sourceData.out[target];
    }
    if (alreadyExistingEdgeData) {
      const info = [alreadyExistingEdgeData.key, false, false, false];
      if (asUpdater ? !updater : !attributes) return info;
      if (asUpdater) {
        const oldAttributes = alreadyExistingEdgeData.attributes;
        alreadyExistingEdgeData.attributes = updater(oldAttributes);
        graph.emit("edgeAttributesUpdated", {
          type: "replace",
          key: alreadyExistingEdgeData.key,
          attributes: alreadyExistingEdgeData.attributes
        });
      } else {
        assign(alreadyExistingEdgeData.attributes, attributes);
        graph.emit("edgeAttributesUpdated", {
          type: "merge",
          key: alreadyExistingEdgeData.key,
          attributes: alreadyExistingEdgeData.attributes,
          data: attributes
        });
      }
      return info;
    }
    attributes = attributes || {};
    if (asUpdater && updater) attributes = updater(attributes);
    const eventData = {
      key: null,
      undirected,
      source,
      target,
      attributes
    };
    if (mustGenerateKey) {
      edge = graph._edgeKeyGenerator();
    } else {
      edge = "" + edge;
      if (graph._edges.has(edge))
        throw new UsageGraphError(
          `Graph.${name}: the "${edge}" edge already exists in the graph.`
        );
    }
    let sourceWasAdded = false;
    let targetWasAdded = false;
    if (!sourceData) {
      sourceData = unsafeAddNode(graph, source, {});
      sourceWasAdded = true;
      if (source === target) {
        targetData = sourceData;
        targetWasAdded = true;
      }
    }
    if (!targetData) {
      targetData = unsafeAddNode(graph, target, {});
      targetWasAdded = true;
    }
    edgeData = new EdgeData(undirected, edge, sourceData, targetData, attributes);
    graph._edges.set(edge, edgeData);
    const isSelfLoop = source === target;
    if (undirected) {
      sourceData.undirectedDegree++;
      targetData.undirectedDegree++;
      if (isSelfLoop) {
        sourceData.undirectedLoops++;
        graph._undirectedSelfLoopCount++;
      }
    } else {
      sourceData.outDegree++;
      targetData.inDegree++;
      if (isSelfLoop) {
        sourceData.directedLoops++;
        graph._directedSelfLoopCount++;
      }
    }
    if (graph.multi) edgeData.attachMulti();
    else edgeData.attach();
    if (undirected) graph._undirectedSize++;
    else graph._directedSize++;
    eventData.key = edge;
    graph.emit("edgeAdded", eventData);
    return [edge, true, sourceWasAdded, targetWasAdded];
  }
  function dropEdgeFromData(graph, edgeData) {
    graph._edges.delete(edgeData.key);
    const { source: sourceData, target: targetData, attributes } = edgeData;
    const undirected = edgeData.undirected;
    const isSelfLoop = sourceData === targetData;
    if (undirected) {
      sourceData.undirectedDegree--;
      targetData.undirectedDegree--;
      if (isSelfLoop) {
        sourceData.undirectedLoops--;
        graph._undirectedSelfLoopCount--;
      }
    } else {
      sourceData.outDegree--;
      targetData.inDegree--;
      if (isSelfLoop) {
        sourceData.directedLoops--;
        graph._directedSelfLoopCount--;
      }
    }
    if (graph.multi) edgeData.detachMulti();
    else edgeData.detach();
    if (undirected) graph._undirectedSize--;
    else graph._directedSize--;
    graph.emit("edgeDropped", {
      key: edgeData.key,
      attributes,
      source: sourceData.key,
      target: targetData.key,
      undirected
    });
  }
  var Graph = class _Graph extends import_events.EventEmitter {
    constructor(options) {
      super();
      options = assign({}, DEFAULTS, options);
      if (typeof options.multi !== "boolean")
        throw new InvalidArgumentsGraphError(
          `Graph.constructor: invalid 'multi' option. Expecting a boolean but got "${options.multi}".`
        );
      if (!TYPES.has(options.type))
        throw new InvalidArgumentsGraphError(
          `Graph.constructor: invalid 'type' option. Should be one of "mixed", "directed" or "undirected" but got "${options.type}".`
        );
      if (typeof options.allowSelfLoops !== "boolean")
        throw new InvalidArgumentsGraphError(
          `Graph.constructor: invalid 'allowSelfLoops' option. Expecting a boolean but got "${options.allowSelfLoops}".`
        );
      const NodeDataClass = options.type === "mixed" ? MixedNodeData : options.type === "directed" ? DirectedNodeData : UndirectedNodeData;
      privateProperty(this, "NodeDataClass", NodeDataClass);
      const instancePrefix = "geid_" + INSTANCE_ID() + "_";
      let edgeId = 0;
      const edgeKeyGenerator = () => {
        let availableEdgeKey;
        do {
          availableEdgeKey = instancePrefix + edgeId++;
        } while (this._edges.has(availableEdgeKey));
        return availableEdgeKey;
      };
      privateProperty(this, "_attributes", {});
      privateProperty(this, "_nodes", /* @__PURE__ */ new Map());
      privateProperty(this, "_edges", /* @__PURE__ */ new Map());
      privateProperty(this, "_directedSize", 0);
      privateProperty(this, "_undirectedSize", 0);
      privateProperty(this, "_directedSelfLoopCount", 0);
      privateProperty(this, "_undirectedSelfLoopCount", 0);
      privateProperty(this, "_edgeKeyGenerator", edgeKeyGenerator);
      privateProperty(this, "_options", options);
      EMITTER_PROPS.forEach((prop) => privateProperty(this, prop, this[prop]));
      readOnlyProperty(this, "order", () => this._nodes.size);
      readOnlyProperty(this, "size", () => this._edges.size);
      readOnlyProperty(this, "directedSize", () => this._directedSize);
      readOnlyProperty(this, "undirectedSize", () => this._undirectedSize);
      readOnlyProperty(
        this,
        "selfLoopCount",
        () => this._directedSelfLoopCount + this._undirectedSelfLoopCount
      );
      readOnlyProperty(
        this,
        "directedSelfLoopCount",
        () => this._directedSelfLoopCount
      );
      readOnlyProperty(
        this,
        "undirectedSelfLoopCount",
        () => this._undirectedSelfLoopCount
      );
      readOnlyProperty(this, "multi", this._options.multi);
      readOnlyProperty(this, "type", this._options.type);
      readOnlyProperty(this, "allowSelfLoops", this._options.allowSelfLoops);
      readOnlyProperty(this, "implementation", () => "graphology");
    }
    _resetInstanceCounters() {
      this._directedSize = 0;
      this._undirectedSize = 0;
      this._directedSelfLoopCount = 0;
      this._undirectedSelfLoopCount = 0;
    }
    /**---------------------------------------------------------------------------
     * Read
     **---------------------------------------------------------------------------
     */
    /**
     * Method returning whether the given node is found in the graph.
     *
     * @param  {any}     node - The node.
     * @return {boolean}
     */
    hasNode(node) {
      return this._nodes.has("" + node);
    }
    /**
     * Method returning whether the given directed edge is found in the graph.
     *
     * Arity 1:
     * @param  {any}     edge - The edge's key.
     *
     * Arity 2:
     * @param  {any}     source - The edge's source.
     * @param  {any}     target - The edge's target.
     *
     * @return {boolean}
     *
     * @throws {Error} - Will throw if the arguments are invalid.
     */
    hasDirectedEdge(source, target) {
      if (this.type === "undirected") return false;
      if (arguments.length === 1) {
        const edge = "" + source;
        const edgeData = this._edges.get(edge);
        return !!edgeData && !edgeData.undirected;
      } else if (arguments.length === 2) {
        source = "" + source;
        target = "" + target;
        const nodeData = this._nodes.get(source);
        if (!nodeData) return false;
        return nodeData.out.hasOwnProperty(target);
      }
      throw new InvalidArgumentsGraphError(
        `Graph.hasDirectedEdge: invalid arity (${arguments.length}, instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.`
      );
    }
    /**
     * Method returning whether the given undirected edge is found in the graph.
     *
     * Arity 1:
     * @param  {any}     edge - The edge's key.
     *
     * Arity 2:
     * @param  {any}     source - The edge's source.
     * @param  {any}     target - The edge's target.
     *
     * @return {boolean}
     *
     * @throws {Error} - Will throw if the arguments are invalid.
     */
    hasUndirectedEdge(source, target) {
      if (this.type === "directed") return false;
      if (arguments.length === 1) {
        const edge = "" + source;
        const edgeData = this._edges.get(edge);
        return !!edgeData && edgeData.undirected;
      } else if (arguments.length === 2) {
        source = "" + source;
        target = "" + target;
        const nodeData = this._nodes.get(source);
        if (!nodeData) return false;
        return nodeData.undirected.hasOwnProperty(target);
      }
      throw new InvalidArgumentsGraphError(
        `Graph.hasDirectedEdge: invalid arity (${arguments.length}, instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.`
      );
    }
    /**
     * Method returning whether the given edge is found in the graph.
     *
     * Arity 1:
     * @param  {any}     edge - The edge's key.
     *
     * Arity 2:
     * @param  {any}     source - The edge's source.
     * @param  {any}     target - The edge's target.
     *
     * @return {boolean}
     *
     * @throws {Error} - Will throw if the arguments are invalid.
     */
    hasEdge(source, target) {
      if (arguments.length === 1) {
        const edge = "" + source;
        return this._edges.has(edge);
      } else if (arguments.length === 2) {
        source = "" + source;
        target = "" + target;
        const nodeData = this._nodes.get(source);
        if (!nodeData) return false;
        return typeof nodeData.out !== "undefined" && nodeData.out.hasOwnProperty(target) || typeof nodeData.undirected !== "undefined" && nodeData.undirected.hasOwnProperty(target);
      }
      throw new InvalidArgumentsGraphError(
        `Graph.hasEdge: invalid arity (${arguments.length}, instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target.`
      );
    }
    /**
     * Method returning the edge matching source & target in a directed fashion.
     *
     * @param  {any} source - The edge's source.
     * @param  {any} target - The edge's target.
     *
     * @return {any|undefined}
     *
     * @throws {Error} - Will throw if the graph is multi.
     * @throws {Error} - Will throw if source or target doesn't exist.
     */
    directedEdge(source, target) {
      if (this.type === "undirected") return;
      source = "" + source;
      target = "" + target;
      if (this.multi)
        throw new UsageGraphError(
          "Graph.directedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.directedEdges instead."
        );
      const sourceData = this._nodes.get(source);
      if (!sourceData)
        throw new NotFoundGraphError(
          `Graph.directedEdge: could not find the "${source}" source node in the graph.`
        );
      if (!this._nodes.has(target))
        throw new NotFoundGraphError(
          `Graph.directedEdge: could not find the "${target}" target node in the graph.`
        );
      const edgeData = sourceData.out && sourceData.out[target] || void 0;
      if (edgeData) return edgeData.key;
    }
    /**
     * Method returning the edge matching source & target in a undirected fashion.
     *
     * @param  {any} source - The edge's source.
     * @param  {any} target - The edge's target.
     *
     * @return {any|undefined}
     *
     * @throws {Error} - Will throw if the graph is multi.
     * @throws {Error} - Will throw if source or target doesn't exist.
     */
    undirectedEdge(source, target) {
      if (this.type === "directed") return;
      source = "" + source;
      target = "" + target;
      if (this.multi)
        throw new UsageGraphError(
          "Graph.undirectedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.undirectedEdges instead."
        );
      const sourceData = this._nodes.get(source);
      if (!sourceData)
        throw new NotFoundGraphError(
          `Graph.undirectedEdge: could not find the "${source}" source node in the graph.`
        );
      if (!this._nodes.has(target))
        throw new NotFoundGraphError(
          `Graph.undirectedEdge: could not find the "${target}" target node in the graph.`
        );
      const edgeData = sourceData.undirected && sourceData.undirected[target] || void 0;
      if (edgeData) return edgeData.key;
    }
    /**
     * Method returning the edge matching source & target in a mixed fashion.
     *
     * @param  {any} source - The edge's source.
     * @param  {any} target - The edge's target.
     *
     * @return {any|undefined}
     *
     * @throws {Error} - Will throw if the graph is multi.
     * @throws {Error} - Will throw if source or target doesn't exist.
     */
    edge(source, target) {
      if (this.multi)
        throw new UsageGraphError(
          "Graph.edge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.edges instead."
        );
      source = "" + source;
      target = "" + target;
      const sourceData = this._nodes.get(source);
      if (!sourceData)
        throw new NotFoundGraphError(
          `Graph.edge: could not find the "${source}" source node in the graph.`
        );
      if (!this._nodes.has(target))
        throw new NotFoundGraphError(
          `Graph.edge: could not find the "${target}" target node in the graph.`
        );
      const edgeData = sourceData.out && sourceData.out[target] || sourceData.undirected && sourceData.undirected[target] || void 0;
      if (edgeData) return edgeData.key;
    }
    /**
     * Method returning whether two nodes are directed neighbors.
     *
     * @param  {any}     node     - The node's key.
     * @param  {any}     neighbor - The neighbor's key.
     * @return {boolean}
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    areDirectedNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.areDirectedNeighbors: could not find the "${node}" node in the graph.`
        );
      if (this.type === "undirected") return false;
      return neighbor in nodeData.in || neighbor in nodeData.out;
    }
    /**
     * Method returning whether two nodes are out neighbors.
     *
     * @param  {any}     node     - The node's key.
     * @param  {any}     neighbor - The neighbor's key.
     * @return {boolean}
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    areOutNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.areOutNeighbors: could not find the "${node}" node in the graph.`
        );
      if (this.type === "undirected") return false;
      return neighbor in nodeData.out;
    }
    /**
     * Method returning whether two nodes are in neighbors.
     *
     * @param  {any}     node     - The node's key.
     * @param  {any}     neighbor - The neighbor's key.
     * @return {boolean}
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    areInNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.areInNeighbors: could not find the "${node}" node in the graph.`
        );
      if (this.type === "undirected") return false;
      return neighbor in nodeData.in;
    }
    /**
     * Method returning whether two nodes are undirected neighbors.
     *
     * @param  {any}     node     - The node's key.
     * @param  {any}     neighbor - The neighbor's key.
     * @return {boolean}
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    areUndirectedNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.areUndirectedNeighbors: could not find the "${node}" node in the graph.`
        );
      if (this.type === "directed") return false;
      return neighbor in nodeData.undirected;
    }
    /**
     * Method returning whether two nodes are neighbors.
     *
     * @param  {any}     node     - The node's key.
     * @param  {any}     neighbor - The neighbor's key.
     * @return {boolean}
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    areNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.areNeighbors: could not find the "${node}" node in the graph.`
        );
      if (this.type !== "undirected") {
        if (neighbor in nodeData.in || neighbor in nodeData.out) return true;
      }
      if (this.type !== "directed") {
        if (neighbor in nodeData.undirected) return true;
      }
      return false;
    }
    /**
     * Method returning whether two nodes are inbound neighbors.
     *
     * @param  {any}     node     - The node's key.
     * @param  {any}     neighbor - The neighbor's key.
     * @return {boolean}
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    areInboundNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.areInboundNeighbors: could not find the "${node}" node in the graph.`
        );
      if (this.type !== "undirected") {
        if (neighbor in nodeData.in) return true;
      }
      if (this.type !== "directed") {
        if (neighbor in nodeData.undirected) return true;
      }
      return false;
    }
    /**
     * Method returning whether two nodes are outbound neighbors.
     *
     * @param  {any}     node     - The node's key.
     * @param  {any}     neighbor - The neighbor's key.
     * @return {boolean}
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    areOutboundNeighbors(node, neighbor) {
      node = "" + node;
      neighbor = "" + neighbor;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.areOutboundNeighbors: could not find the "${node}" node in the graph.`
        );
      if (this.type !== "undirected") {
        if (neighbor in nodeData.out) return true;
      }
      if (this.type !== "directed") {
        if (neighbor in nodeData.undirected) return true;
      }
      return false;
    }
    /**
     * Method returning the given node's in degree.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's in degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    inDegree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.inDegree: could not find the "${node}" node in the graph.`
        );
      if (this.type === "undirected") return 0;
      return nodeData.inDegree;
    }
    /**
     * Method returning the given node's out degree.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's in degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    outDegree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.outDegree: could not find the "${node}" node in the graph.`
        );
      if (this.type === "undirected") return 0;
      return nodeData.outDegree;
    }
    /**
     * Method returning the given node's directed degree.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's in degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    directedDegree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.directedDegree: could not find the "${node}" node in the graph.`
        );
      if (this.type === "undirected") return 0;
      return nodeData.inDegree + nodeData.outDegree;
    }
    /**
     * Method returning the given node's undirected degree.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's in degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    undirectedDegree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.undirectedDegree: could not find the "${node}" node in the graph.`
        );
      if (this.type === "directed") return 0;
      return nodeData.undirectedDegree;
    }
    /**
     * Method returning the given node's inbound degree.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's inbound degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    inboundDegree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.inboundDegree: could not find the "${node}" node in the graph.`
        );
      let degree = 0;
      if (this.type !== "directed") {
        degree += nodeData.undirectedDegree;
      }
      if (this.type !== "undirected") {
        degree += nodeData.inDegree;
      }
      return degree;
    }
    /**
     * Method returning the given node's outbound degree.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's outbound degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    outboundDegree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.outboundDegree: could not find the "${node}" node in the graph.`
        );
      let degree = 0;
      if (this.type !== "directed") {
        degree += nodeData.undirectedDegree;
      }
      if (this.type !== "undirected") {
        degree += nodeData.outDegree;
      }
      return degree;
    }
    /**
     * Method returning the given node's directed degree.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    degree(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.degree: could not find the "${node}" node in the graph.`
        );
      let degree = 0;
      if (this.type !== "directed") {
        degree += nodeData.undirectedDegree;
      }
      if (this.type !== "undirected") {
        degree += nodeData.inDegree + nodeData.outDegree;
      }
      return degree;
    }
    /**
     * Method returning the given node's in degree without considering self loops.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's in degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    inDegreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.inDegreeWithoutSelfLoops: could not find the "${node}" node in the graph.`
        );
      if (this.type === "undirected") return 0;
      return nodeData.inDegree - nodeData.directedLoops;
    }
    /**
     * Method returning the given node's out degree without considering self loops.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's in degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    outDegreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.outDegreeWithoutSelfLoops: could not find the "${node}" node in the graph.`
        );
      if (this.type === "undirected") return 0;
      return nodeData.outDegree - nodeData.directedLoops;
    }
    /**
     * Method returning the given node's directed degree without considering self loops.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's in degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    directedDegreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.directedDegreeWithoutSelfLoops: could not find the "${node}" node in the graph.`
        );
      if (this.type === "undirected") return 0;
      return nodeData.inDegree + nodeData.outDegree - nodeData.directedLoops * 2;
    }
    /**
     * Method returning the given node's undirected degree without considering self loops.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's in degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    undirectedDegreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.undirectedDegreeWithoutSelfLoops: could not find the "${node}" node in the graph.`
        );
      if (this.type === "directed") return 0;
      return nodeData.undirectedDegree - nodeData.undirectedLoops * 2;
    }
    /**
     * Method returning the given node's inbound degree without considering self loops.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's inbound degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    inboundDegreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.inboundDegreeWithoutSelfLoops: could not find the "${node}" node in the graph.`
        );
      let degree = 0;
      let loops = 0;
      if (this.type !== "directed") {
        degree += nodeData.undirectedDegree;
        loops += nodeData.undirectedLoops * 2;
      }
      if (this.type !== "undirected") {
        degree += nodeData.inDegree;
        loops += nodeData.directedLoops;
      }
      return degree - loops;
    }
    /**
     * Method returning the given node's outbound degree without considering self loops.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's outbound degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    outboundDegreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.outboundDegreeWithoutSelfLoops: could not find the "${node}" node in the graph.`
        );
      let degree = 0;
      let loops = 0;
      if (this.type !== "directed") {
        degree += nodeData.undirectedDegree;
        loops += nodeData.undirectedLoops * 2;
      }
      if (this.type !== "undirected") {
        degree += nodeData.outDegree;
        loops += nodeData.directedLoops;
      }
      return degree - loops;
    }
    /**
     * Method returning the given node's directed degree without considering self loops.
     *
     * @param  {any}     node - The node's key.
     * @return {number}       - The node's degree.
     *
     * @throws {Error} - Will throw if the node isn't in the graph.
     */
    degreeWithoutSelfLoops(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.degreeWithoutSelfLoops: could not find the "${node}" node in the graph.`
        );
      let degree = 0;
      let loops = 0;
      if (this.type !== "directed") {
        degree += nodeData.undirectedDegree;
        loops += nodeData.undirectedLoops * 2;
      }
      if (this.type !== "undirected") {
        degree += nodeData.inDegree + nodeData.outDegree;
        loops += nodeData.directedLoops * 2;
      }
      return degree - loops;
    }
    /**
     * Method returning the given edge's source.
     *
     * @param  {any} edge - The edge's key.
     * @return {any}      - The edge's source.
     *
     * @throws {Error} - Will throw if the edge isn't in the graph.
     */
    source(edge) {
      edge = "" + edge;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(
          `Graph.source: could not find the "${edge}" edge in the graph.`
        );
      return data.source.key;
    }
    /**
     * Method returning the given edge's target.
     *
     * @param  {any} edge - The edge's key.
     * @return {any}      - The edge's target.
     *
     * @throws {Error} - Will throw if the edge isn't in the graph.
     */
    target(edge) {
      edge = "" + edge;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(
          `Graph.target: could not find the "${edge}" edge in the graph.`
        );
      return data.target.key;
    }
    /**
     * Method returning the given edge's extremities.
     *
     * @param  {any}   edge - The edge's key.
     * @return {array}      - The edge's extremities.
     *
     * @throws {Error} - Will throw if the edge isn't in the graph.
     */
    extremities(edge) {
      edge = "" + edge;
      const edgeData = this._edges.get(edge);
      if (!edgeData)
        throw new NotFoundGraphError(
          `Graph.extremities: could not find the "${edge}" edge in the graph.`
        );
      return [edgeData.source.key, edgeData.target.key];
    }
    /**
     * Given a node & an edge, returns the other extremity of the edge.
     *
     * @param  {any}   node - The node's key.
     * @param  {any}   edge - The edge's key.
     * @return {any}        - The related node.
     *
     * @throws {Error} - Will throw if the edge isn't in the graph or if the
     *                   edge & node are not related.
     */
    opposite(node, edge) {
      node = "" + node;
      edge = "" + edge;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(
          `Graph.opposite: could not find the "${edge}" edge in the graph.`
        );
      const source = data.source.key;
      const target = data.target.key;
      if (node === source) return target;
      if (node === target) return source;
      throw new NotFoundGraphError(
        `Graph.opposite: the "${node}" node is not attached to the "${edge}" edge (${source}, ${target}).`
      );
    }
    /**
     * Returns whether the given edge has the given node as extremity.
     *
     * @param  {any}     edge - The edge's key.
     * @param  {any}     node - The node's key.
     * @return {boolean}      - The related node.
     *
     * @throws {Error} - Will throw if either the node or the edge isn't in the graph.
     */
    hasExtremity(edge, node) {
      edge = "" + edge;
      node = "" + node;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(
          `Graph.hasExtremity: could not find the "${edge}" edge in the graph.`
        );
      return data.source.key === node || data.target.key === node;
    }
    /**
     * Method returning whether the given edge is undirected.
     *
     * @param  {any}     edge - The edge's key.
     * @return {boolean}
     *
     * @throws {Error} - Will throw if the edge isn't in the graph.
     */
    isUndirected(edge) {
      edge = "" + edge;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(
          `Graph.isUndirected: could not find the "${edge}" edge in the graph.`
        );
      return data.undirected;
    }
    /**
     * Method returning whether the given edge is directed.
     *
     * @param  {any}     edge - The edge's key.
     * @return {boolean}
     *
     * @throws {Error} - Will throw if the edge isn't in the graph.
     */
    isDirected(edge) {
      edge = "" + edge;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(
          `Graph.isDirected: could not find the "${edge}" edge in the graph.`
        );
      return !data.undirected;
    }
    /**
     * Method returning whether the given edge is a self loop.
     *
     * @param  {any}     edge - The edge's key.
     * @return {boolean}
     *
     * @throws {Error} - Will throw if the edge isn't in the graph.
     */
    isSelfLoop(edge) {
      edge = "" + edge;
      const data = this._edges.get(edge);
      if (!data)
        throw new NotFoundGraphError(
          `Graph.isSelfLoop: could not find the "${edge}" edge in the graph.`
        );
      return data.source === data.target;
    }
    /**---------------------------------------------------------------------------
     * Mutation
     **---------------------------------------------------------------------------
     */
    /**
     * Method used to add a node to the graph.
     *
     * @param  {any}    node         - The node.
     * @param  {object} [attributes] - Optional attributes.
     * @return {any}                 - The node.
     *
     * @throws {Error} - Will throw if the given node already exist.
     * @throws {Error} - Will throw if the given attributes are not an object.
     */
    addNode(node, attributes) {
      const nodeData = addNode(this, node, attributes);
      return nodeData.key;
    }
    /**
     * Method used to merge a node into the graph.
     *
     * @param  {any}    node         - The node.
     * @param  {object} [attributes] - Optional attributes.
     * @return {any}                 - The node.
     */
    mergeNode(node, attributes) {
      if (attributes && !isPlainObject(attributes))
        throw new InvalidArgumentsGraphError(
          `Graph.mergeNode: invalid attributes. Expecting an object but got "${attributes}"`
        );
      node = "" + node;
      attributes = attributes || {};
      let data = this._nodes.get(node);
      if (data) {
        if (attributes) {
          assign(data.attributes, attributes);
          this.emit("nodeAttributesUpdated", {
            type: "merge",
            key: node,
            attributes: data.attributes,
            data: attributes
          });
        }
        return [node, false];
      }
      data = new this.NodeDataClass(node, attributes);
      this._nodes.set(node, data);
      this.emit("nodeAdded", {
        key: node,
        attributes
      });
      return [node, true];
    }
    /**
     * Method used to add a node if it does not exist in the graph or else to
     * update its attributes using a function.
     *
     * @param  {any}      node      - The node.
     * @param  {function} [updater] - Optional updater function.
     * @return {any}                - The node.
     */
    updateNode(node, updater) {
      if (updater && typeof updater !== "function")
        throw new InvalidArgumentsGraphError(
          `Graph.updateNode: invalid updater function. Expecting a function but got "${updater}"`
        );
      node = "" + node;
      let data = this._nodes.get(node);
      if (data) {
        if (updater) {
          const oldAttributes = data.attributes;
          data.attributes = updater(oldAttributes);
          this.emit("nodeAttributesUpdated", {
            type: "replace",
            key: node,
            attributes: data.attributes
          });
        }
        return [node, false];
      }
      const attributes = updater ? updater({}) : {};
      data = new this.NodeDataClass(node, attributes);
      this._nodes.set(node, data);
      this.emit("nodeAdded", {
        key: node,
        attributes
      });
      return [node, true];
    }
    /**
     * Method used to drop a single node & all its attached edges from the graph.
     *
     * @param  {any}    node - The node.
     * @return {Graph}
     *
     * @throws {Error} - Will throw if the node doesn't exist.
     */
    dropNode(node) {
      node = "" + node;
      const nodeData = this._nodes.get(node);
      if (!nodeData)
        throw new NotFoundGraphError(
          `Graph.dropNode: could not find the "${node}" node in the graph.`
        );
      let edgeData;
      if (this.type !== "undirected") {
        for (const neighbor in nodeData.out) {
          edgeData = nodeData.out[neighbor];
          do {
            dropEdgeFromData(this, edgeData);
            edgeData = edgeData.next;
          } while (edgeData);
        }
        for (const neighbor in nodeData.in) {
          edgeData = nodeData.in[neighbor];
          do {
            dropEdgeFromData(this, edgeData);
            edgeData = edgeData.next;
          } while (edgeData);
        }
      }
      if (this.type !== "directed") {
        for (const neighbor in nodeData.undirected) {
          edgeData = nodeData.undirected[neighbor];
          do {
            dropEdgeFromData(this, edgeData);
            edgeData = edgeData.next;
          } while (edgeData);
        }
      }
      this._nodes.delete(node);
      this.emit("nodeDropped", {
        key: node,
        attributes: nodeData.attributes
      });
    }
    /**
     * Method used to drop a single edge from the graph.
     *
     * Arity 1:
     * @param  {any}    edge - The edge.
     *
     * Arity 2:
     * @param  {any}    source - Source node.
     * @param  {any}    target - Target node.
     *
     * @return {Graph}
     *
     * @throws {Error} - Will throw if the edge doesn't exist.
     */
    dropEdge(edge) {
      let edgeData;
      if (arguments.length > 1) {
        const source = "" + arguments[0];
        const target = "" + arguments[1];
        edgeData = getMatchingEdge(this, source, target, this.type);
        if (!edgeData)
          throw new NotFoundGraphError(
            `Graph.dropEdge: could not find the "${source}" -> "${target}" edge in the graph.`
          );
      } else {
        edge = "" + edge;
        edgeData = this._edges.get(edge);
        if (!edgeData)
          throw new NotFoundGraphError(
            `Graph.dropEdge: could not find the "${edge}" edge in the graph.`
          );
      }
      dropEdgeFromData(this, edgeData);
      return this;
    }
    /**
     * Method used to drop a single directed edge from the graph.
     *
     * @param  {any}    source - Source node.
     * @param  {any}    target - Target node.
     *
     * @return {Graph}
     *
     * @throws {Error} - Will throw if the edge doesn't exist.
     */
    dropDirectedEdge(source, target) {
      if (arguments.length < 2)
        throw new UsageGraphError(
          "Graph.dropDirectedEdge: it does not make sense to try and drop a directed edge by key. What if the edge with this key is undirected? Use #.dropEdge for this purpose instead."
        );
      if (this.multi)
        throw new UsageGraphError(
          "Graph.dropDirectedEdge: cannot use a {source,target} combo when dropping an edge in a MultiGraph since we cannot infer the one you want to delete as there could be multiple ones."
        );
      source = "" + source;
      target = "" + target;
      const edgeData = getMatchingEdge(this, source, target, "directed");
      if (!edgeData)
        throw new NotFoundGraphError(
          `Graph.dropDirectedEdge: could not find a "${source}" -> "${target}" edge in the graph.`
        );
      dropEdgeFromData(this, edgeData);
      return this;
    }
    /**
     * Method used to drop a single undirected edge from the graph.
     *
     * @param  {any}    source - Source node.
     * @param  {any}    target - Target node.
     *
     * @return {Graph}
     *
     * @throws {Error} - Will throw if the edge doesn't exist.
     */
    dropUndirectedEdge(source, target) {
      if (arguments.length < 2)
        throw new UsageGraphError(
          "Graph.dropUndirectedEdge: it does not make sense to drop a directed edge by key. What if the edge with this key is undirected? Use #.dropEdge for this purpose instead."
        );
      if (this.multi)
        throw new UsageGraphError(
          "Graph.dropUndirectedEdge: cannot use a {source,target} combo when dropping an edge in a MultiGraph since we cannot infer the one you want to delete as there could be multiple ones."
        );
      const edgeData = getMatchingEdge(this, source, target, "undirected");
      if (!edgeData)
        throw new NotFoundGraphError(
          `Graph.dropUndirectedEdge: could not find a "${source}" -> "${target}" edge in the graph.`
        );
      dropEdgeFromData(this, edgeData);
      return this;
    }
    /**
     * Method used to remove every edge & every node from the graph.
     *
     * @return {Graph}
     */
    clear() {
      this._edges.clear();
      this._nodes.clear();
      this._resetInstanceCounters();
      this.emit("cleared");
    }
    /**
     * Method used to remove every edge from the graph.
     *
     * @return {Graph}
     */
    clearEdges() {
      const iterator = this._nodes.values();
      let step;
      while (step = iterator.next(), step.done !== true) {
        step.value.clear();
      }
      this._edges.clear();
      this._resetInstanceCounters();
      this.emit("edgesCleared");
    }
    /**---------------------------------------------------------------------------
     * Attributes-related methods
     **---------------------------------------------------------------------------
     */
    /**
     * Method returning the desired graph's attribute.
     *
     * @param  {string} name - Name of the attribute.
     * @return {any}
     */
    getAttribute(name) {
      return this._attributes[name];
    }
    /**
     * Method returning the graph's attributes.
     *
     * @return {object}
     */
    getAttributes() {
      return this._attributes;
    }
    /**
     * Method returning whether the graph has the desired attribute.
     *
     * @param  {string}  name - Name of the attribute.
     * @return {boolean}
     */
    hasAttribute(name) {
      return this._attributes.hasOwnProperty(name);
    }
    /**
     * Method setting a value for the desired graph's attribute.
     *
     * @param  {string}  name  - Name of the attribute.
     * @param  {any}     value - Value for the attribute.
     * @return {Graph}
     */
    setAttribute(name, value) {
      this._attributes[name] = value;
      this.emit("attributesUpdated", {
        type: "set",
        attributes: this._attributes,
        name
      });
      return this;
    }
    /**
     * Method using a function to update the desired graph's attribute's value.
     *
     * @param  {string}   name    - Name of the attribute.
     * @param  {function} updater - Function use to update the attribute's value.
     * @return {Graph}
     */
    updateAttribute(name, updater) {
      if (typeof updater !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.updateAttribute: updater should be a function."
        );
      const value = this._attributes[name];
      this._attributes[name] = updater(value);
      this.emit("attributesUpdated", {
        type: "set",
        attributes: this._attributes,
        name
      });
      return this;
    }
    /**
     * Method removing the desired graph's attribute.
     *
     * @param  {string} name  - Name of the attribute.
     * @return {Graph}
     */
    removeAttribute(name) {
      delete this._attributes[name];
      this.emit("attributesUpdated", {
        type: "remove",
        attributes: this._attributes,
        name
      });
      return this;
    }
    /**
     * Method replacing the graph's attributes.
     *
     * @param  {object} attributes - New attributes.
     * @return {Graph}
     *
     * @throws {Error} - Will throw if given attributes are not a plain object.
     */
    replaceAttributes(attributes) {
      if (!isPlainObject(attributes))
        throw new InvalidArgumentsGraphError(
          "Graph.replaceAttributes: provided attributes are not a plain object."
        );
      this._attributes = attributes;
      this.emit("attributesUpdated", {
        type: "replace",
        attributes: this._attributes
      });
      return this;
    }
    /**
     * Method merging the graph's attributes.
     *
     * @param  {object} attributes - Attributes to merge.
     * @return {Graph}
     *
     * @throws {Error} - Will throw if given attributes are not a plain object.
     */
    mergeAttributes(attributes) {
      if (!isPlainObject(attributes))
        throw new InvalidArgumentsGraphError(
          "Graph.mergeAttributes: provided attributes are not a plain object."
        );
      assign(this._attributes, attributes);
      this.emit("attributesUpdated", {
        type: "merge",
        attributes: this._attributes,
        data: attributes
      });
      return this;
    }
    /**
     * Method updating the graph's attributes.
     *
     * @param  {function} updater - Function used to update the attributes.
     * @return {Graph}
     *
     * @throws {Error} - Will throw if given updater is not a function.
     */
    updateAttributes(updater) {
      if (typeof updater !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.updateAttributes: provided updater is not a function."
        );
      this._attributes = updater(this._attributes);
      this.emit("attributesUpdated", {
        type: "update",
        attributes: this._attributes
      });
      return this;
    }
    /**
     * Method used to update each node's attributes using the given function.
     *
     * @param {function}  updater - Updater function to use.
     * @param {object}    [hints] - Optional hints.
     */
    updateEachNodeAttributes(updater, hints) {
      if (typeof updater !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.updateEachNodeAttributes: expecting an updater function."
        );
      if (hints && !validateHints(hints))
        throw new InvalidArgumentsGraphError(
          "Graph.updateEachNodeAttributes: invalid hints. Expecting an object having the following shape: {attributes?: [string]}"
        );
      const iterator = this._nodes.values();
      let step, nodeData;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        nodeData.attributes = updater(nodeData.key, nodeData.attributes);
      }
      this.emit("eachNodeAttributesUpdated", {
        hints: hints ? hints : null
      });
    }
    /**
     * Method used to update each edge's attributes using the given function.
     *
     * @param {function}  updater - Updater function to use.
     * @param {object}    [hints] - Optional hints.
     */
    updateEachEdgeAttributes(updater, hints) {
      if (typeof updater !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.updateEachEdgeAttributes: expecting an updater function."
        );
      if (hints && !validateHints(hints))
        throw new InvalidArgumentsGraphError(
          "Graph.updateEachEdgeAttributes: invalid hints. Expecting an object having the following shape: {attributes?: [string]}"
        );
      const iterator = this._edges.values();
      let step, edgeData, sourceData, targetData;
      while (step = iterator.next(), step.done !== true) {
        edgeData = step.value;
        sourceData = edgeData.source;
        targetData = edgeData.target;
        edgeData.attributes = updater(
          edgeData.key,
          edgeData.attributes,
          sourceData.key,
          targetData.key,
          sourceData.attributes,
          targetData.attributes,
          edgeData.undirected
        );
      }
      this.emit("eachEdgeAttributesUpdated", {
        hints: hints ? hints : null
      });
    }
    /**---------------------------------------------------------------------------
     * Iteration-related methods
     **---------------------------------------------------------------------------
     */
    /**
     * Method iterating over the graph's adjacency using the given callback.
     *
     * @param  {function}  callback - Callback to use.
     */
    forEachAdjacencyEntry(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.forEachAdjacencyEntry: expecting a callback."
        );
      forEachAdjacency(false, false, false, this, callback);
    }
    forEachAdjacencyEntryWithOrphans(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.forEachAdjacencyEntryWithOrphans: expecting a callback."
        );
      forEachAdjacency(false, false, true, this, callback);
    }
    /**
     * Method iterating over the graph's assymetric adjacency using the given callback.
     *
     * @param  {function}  callback - Callback to use.
     */
    forEachAssymetricAdjacencyEntry(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.forEachAssymetricAdjacencyEntry: expecting a callback."
        );
      forEachAdjacency(false, true, false, this, callback);
    }
    forEachAssymetricAdjacencyEntryWithOrphans(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.forEachAssymetricAdjacencyEntryWithOrphans: expecting a callback."
        );
      forEachAdjacency(false, true, true, this, callback);
    }
    /**
     * Method returning the list of the graph's nodes.
     *
     * @return {array} - The nodes.
     */
    nodes() {
      return Array.from(this._nodes.keys());
    }
    /**
     * Method iterating over the graph's nodes using the given callback.
     *
     * @param  {function}  callback - Callback (key, attributes, index).
     */
    forEachNode(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.forEachNode: expecting a callback."
        );
      const iterator = this._nodes.values();
      let step, nodeData;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        callback(nodeData.key, nodeData.attributes);
      }
    }
    /**
     * Method iterating attempting to find a node matching the given predicate
     * function.
     *
     * @param  {function}  callback - Callback (key, attributes).
     */
    findNode(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.findNode: expecting a callback."
        );
      const iterator = this._nodes.values();
      let step, nodeData;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        if (callback(nodeData.key, nodeData.attributes)) return nodeData.key;
      }
      return;
    }
    /**
     * Method mapping nodes.
     *
     * @param  {function}  callback - Callback (key, attributes).
     */
    mapNodes(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.mapNode: expecting a callback."
        );
      const iterator = this._nodes.values();
      let step, nodeData;
      const result = new Array(this.order);
      let i2 = 0;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        result[i2++] = callback(nodeData.key, nodeData.attributes);
      }
      return result;
    }
    /**
     * Method returning whether some node verify the given predicate.
     *
     * @param  {function}  callback - Callback (key, attributes).
     */
    someNode(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.someNode: expecting a callback."
        );
      const iterator = this._nodes.values();
      let step, nodeData;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        if (callback(nodeData.key, nodeData.attributes)) return true;
      }
      return false;
    }
    /**
     * Method returning whether all node verify the given predicate.
     *
     * @param  {function}  callback - Callback (key, attributes).
     */
    everyNode(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.everyNode: expecting a callback."
        );
      const iterator = this._nodes.values();
      let step, nodeData;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        if (!callback(nodeData.key, nodeData.attributes)) return false;
      }
      return true;
    }
    /**
     * Method filtering nodes.
     *
     * @param  {function}  callback - Callback (key, attributes).
     */
    filterNodes(callback) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.filterNodes: expecting a callback."
        );
      const iterator = this._nodes.values();
      let step, nodeData;
      const result = [];
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        if (callback(nodeData.key, nodeData.attributes))
          result.push(nodeData.key);
      }
      return result;
    }
    /**
     * Method reducing nodes.
     *
     * @param  {function}  callback - Callback (accumulator, key, attributes).
     */
    reduceNodes(callback, initialValue) {
      if (typeof callback !== "function")
        throw new InvalidArgumentsGraphError(
          "Graph.reduceNodes: expecting a callback."
        );
      if (arguments.length < 2)
        throw new InvalidArgumentsGraphError(
          "Graph.reduceNodes: missing initial value. You must provide it because the callback takes more than one argument and we cannot infer the initial value from the first iteration, as you could with a simple array."
        );
      let accumulator = initialValue;
      const iterator = this._nodes.values();
      let step, nodeData;
      while (step = iterator.next(), step.done !== true) {
        nodeData = step.value;
        accumulator = callback(accumulator, nodeData.key, nodeData.attributes);
      }
      return accumulator;
    }
    /**
     * Method returning an iterator over the graph's node entries.
     *
     * @return {Iterator}
     */
    nodeEntries() {
      const iterator = this._nodes.values();
      return {
        [Symbol.iterator]() {
          return this;
        },
        next() {
          const step = iterator.next();
          if (step.done) return step;
          const data = step.value;
          return {
            value: { node: data.key, attributes: data.attributes },
            done: false
          };
        }
      };
    }
    /**---------------------------------------------------------------------------
     * Serialization
     **---------------------------------------------------------------------------
     */
    /**
     * Method used to export the whole graph.
     *
     * @return {object} - The serialized graph.
     */
    export() {
      const nodes = new Array(this._nodes.size);
      let i2 = 0;
      this._nodes.forEach((data, key) => {
        nodes[i2++] = serializeNode(key, data);
      });
      const edges = new Array(this._edges.size);
      i2 = 0;
      this._edges.forEach((data, key) => {
        edges[i2++] = serializeEdge(this.type, key, data);
      });
      return {
        options: {
          type: this.type,
          multi: this.multi,
          allowSelfLoops: this.allowSelfLoops
        },
        attributes: this.getAttributes(),
        nodes,
        edges
      };
    }
    /**
     * Method used to import a serialized graph.
     *
     * @param  {object|Graph} data  - The serialized graph.
     * @param  {boolean}      merge - Whether to merge data.
     * @return {Graph}              - Returns itself for chaining.
     */
    import(data, merge = false) {
      if (data instanceof _Graph) {
        data.forEachNode((n2, a2) => {
          if (merge) this.mergeNode(n2, a2);
          else this.addNode(n2, a2);
        });
        data.forEachEdge((e2, a2, s2, t2, _sa, _ta, u2) => {
          if (merge) {
            if (u2) this.mergeUndirectedEdgeWithKey(e2, s2, t2, a2);
            else this.mergeDirectedEdgeWithKey(e2, s2, t2, a2);
          } else {
            if (u2) this.addUndirectedEdgeWithKey(e2, s2, t2, a2);
            else this.addDirectedEdgeWithKey(e2, s2, t2, a2);
          }
        });
        return this;
      }
      if (!isPlainObject(data))
        throw new InvalidArgumentsGraphError(
          "Graph.import: invalid argument. Expecting a serialized graph or, alternatively, a Graph instance."
        );
      if (data.attributes) {
        if (!isPlainObject(data.attributes))
          throw new InvalidArgumentsGraphError(
            "Graph.import: invalid attributes. Expecting a plain object."
          );
        if (merge) this.mergeAttributes(data.attributes);
        else this.replaceAttributes(data.attributes);
      }
      let i2, l2, list, node, edge;
      if (data.nodes) {
        list = data.nodes;
        if (!Array.isArray(list))
          throw new InvalidArgumentsGraphError(
            "Graph.import: invalid nodes. Expecting an array."
          );
        for (i2 = 0, l2 = list.length; i2 < l2; i2++) {
          node = list[i2];
          validateSerializedNode(node);
          const { key, attributes } = node;
          if (merge) this.mergeNode(key, attributes);
          else this.addNode(key, attributes);
        }
      }
      if (data.edges) {
        let undirectedByDefault = false;
        if (this.type === "undirected") {
          undirectedByDefault = true;
        }
        list = data.edges;
        if (!Array.isArray(list))
          throw new InvalidArgumentsGraphError(
            "Graph.import: invalid edges. Expecting an array."
          );
        for (i2 = 0, l2 = list.length; i2 < l2; i2++) {
          edge = list[i2];
          validateSerializedEdge(edge);
          const {
            source,
            target,
            attributes,
            undirected = undirectedByDefault
          } = edge;
          let method;
          if ("key" in edge) {
            method = merge ? undirected ? this.mergeUndirectedEdgeWithKey : this.mergeDirectedEdgeWithKey : undirected ? this.addUndirectedEdgeWithKey : this.addDirectedEdgeWithKey;
            method.call(this, edge.key, source, target, attributes);
          } else {
            method = merge ? undirected ? this.mergeUndirectedEdge : this.mergeDirectedEdge : undirected ? this.addUndirectedEdge : this.addDirectedEdge;
            method.call(this, source, target, attributes);
          }
        }
      }
      return this;
    }
    /**---------------------------------------------------------------------------
     * Utils
     **---------------------------------------------------------------------------
     */
    /**
     * Method returning a null copy of the graph, i.e. a graph without nodes
     * & edges but with the exact same options.
     *
     * @param  {object} options - Options to merge with the current ones.
     * @return {Graph}          - The null copy.
     */
    nullCopy(options) {
      const graph = new _Graph(assign({}, this._options, options));
      graph.replaceAttributes(assign({}, this.getAttributes()));
      return graph;
    }
    /**
     * Method returning an empty copy of the graph, i.e. a graph without edges but
     * with the exact same options.
     *
     * @param  {object} options - Options to merge with the current ones.
     * @return {Graph}          - The empty copy.
     */
    emptyCopy(options) {
      const graph = this.nullCopy(options);
      this._nodes.forEach((nodeData, key) => {
        const attributes = assign({}, nodeData.attributes);
        nodeData = new graph.NodeDataClass(key, attributes);
        graph._nodes.set(key, nodeData);
      });
      return graph;
    }
    /**
     * Method returning an exact copy of the graph.
     *
     * @param  {object} options - Upgrade options.
     * @return {Graph}          - The copy.
     */
    copy(options) {
      options = options || {};
      if (typeof options.type === "string" && options.type !== this.type && options.type !== "mixed")
        throw new UsageGraphError(
          `Graph.copy: cannot create an incompatible copy from "${this.type}" type to "${options.type}" because this would mean losing information about the current graph.`
        );
      if (typeof options.multi === "boolean" && options.multi !== this.multi && options.multi !== true)
        throw new UsageGraphError(
          "Graph.copy: cannot create an incompatible copy by downgrading a multi graph to a simple one because this would mean losing information about the current graph."
        );
      if (typeof options.allowSelfLoops === "boolean" && options.allowSelfLoops !== this.allowSelfLoops && options.allowSelfLoops !== true)
        throw new UsageGraphError(
          "Graph.copy: cannot create an incompatible copy from a graph allowing self loops to one that does not because this would mean losing information about the current graph."
        );
      const graph = this.emptyCopy(options);
      const iterator = this._edges.values();
      let step, edgeData;
      while (step = iterator.next(), step.done !== true) {
        edgeData = step.value;
        addEdge(
          graph,
          "copy",
          false,
          edgeData.undirected,
          edgeData.key,
          edgeData.source.key,
          edgeData.target.key,
          assign({}, edgeData.attributes)
        );
      }
      return graph;
    }
    /**---------------------------------------------------------------------------
     * Known methods
     **---------------------------------------------------------------------------
     */
    /**
     * Method used by JavaScript to perform JSON serialization.
     *
     * @return {object} - The serialized graph.
     */
    toJSON() {
      return this.export();
    }
    /**
     * Method returning [object Graph].
     */
    toString() {
      return "[object Graph]";
    }
    /**
     * Method used internally by node's console to display a custom object.
     *
     * @return {object} - Formatted object representation of the graph.
     */
    inspect() {
      const nodes = {};
      this._nodes.forEach((data, key) => {
        nodes[key] = data.attributes;
      });
      const edges = {}, multiIndex = {};
      this._edges.forEach((data, key) => {
        const direction = data.undirected ? "--" : "->";
        let label = "";
        let source = data.source.key;
        let target = data.target.key;
        let tmp;
        if (data.undirected && source > target) {
          tmp = source;
          source = target;
          target = tmp;
        }
        const desc = `(${source})${direction}(${target})`;
        if (!key.startsWith("geid_")) {
          label += `[${key}]: `;
        } else if (this.multi) {
          if (typeof multiIndex[desc] === "undefined") {
            multiIndex[desc] = 0;
          } else {
            multiIndex[desc]++;
          }
          label += `${multiIndex[desc]}. `;
        }
        label += desc;
        edges[label] = data.attributes;
      });
      const dummy = {};
      for (const k in this) {
        if (this.hasOwnProperty(k) && !EMITTER_PROPS.has(k) && typeof this[k] !== "function" && typeof k !== "symbol")
          dummy[k] = this[k];
      }
      dummy.attributes = this._attributes;
      dummy.nodes = nodes;
      dummy.edges = edges;
      privateProperty(dummy, "constructor", this.constructor);
      return dummy;
    }
  };
  if (typeof Symbol !== "undefined")
    Graph.prototype[/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")] = Graph.prototype.inspect;
  EDGE_ADD_METHODS.forEach((method) => {
    ["add", "merge", "update"].forEach((verb) => {
      const name = method.name(verb);
      const fn = verb === "add" ? addEdge : mergeEdge;
      if (method.generateKey) {
        Graph.prototype[name] = function(source, target, attributes) {
          return fn(
            this,
            name,
            true,
            (method.type || this.type) === "undirected",
            null,
            source,
            target,
            attributes,
            verb === "update"
          );
        };
      } else {
        Graph.prototype[name] = function(edge, source, target, attributes) {
          return fn(
            this,
            name,
            false,
            (method.type || this.type) === "undirected",
            edge,
            source,
            target,
            attributes,
            verb === "update"
          );
        };
      }
    });
  });
  attachNodeAttributesMethods(Graph);
  attachEdgeAttributesMethods(Graph);
  attachEdgeIterationMethods(Graph);
  attachNeighborIterationMethods(Graph);
  var DirectedGraph = class extends Graph {
    constructor(options) {
      const finalOptions = assign({ type: "directed" }, options);
      if ("multi" in finalOptions && finalOptions.multi !== false)
        throw new InvalidArgumentsGraphError(
          "DirectedGraph.from: inconsistent indication that the graph should be multi in given options!"
        );
      if (finalOptions.type !== "directed")
        throw new InvalidArgumentsGraphError(
          'DirectedGraph.from: inconsistent "' + finalOptions.type + '" type in given options!'
        );
      super(finalOptions);
    }
  };
  var UndirectedGraph = class extends Graph {
    constructor(options) {
      const finalOptions = assign({ type: "undirected" }, options);
      if ("multi" in finalOptions && finalOptions.multi !== false)
        throw new InvalidArgumentsGraphError(
          "UndirectedGraph.from: inconsistent indication that the graph should be multi in given options!"
        );
      if (finalOptions.type !== "undirected")
        throw new InvalidArgumentsGraphError(
          'UndirectedGraph.from: inconsistent "' + finalOptions.type + '" type in given options!'
        );
      super(finalOptions);
    }
  };
  var MultiGraph = class extends Graph {
    constructor(options) {
      const finalOptions = assign({ multi: true }, options);
      if ("multi" in finalOptions && finalOptions.multi !== true)
        throw new InvalidArgumentsGraphError(
          "MultiGraph.from: inconsistent indication that the graph should be simple in given options!"
        );
      super(finalOptions);
    }
  };
  var MultiDirectedGraph = class extends Graph {
    constructor(options) {
      const finalOptions = assign({ type: "directed", multi: true }, options);
      if ("multi" in finalOptions && finalOptions.multi !== true)
        throw new InvalidArgumentsGraphError(
          "MultiDirectedGraph.from: inconsistent indication that the graph should be simple in given options!"
        );
      if (finalOptions.type !== "directed")
        throw new InvalidArgumentsGraphError(
          'MultiDirectedGraph.from: inconsistent "' + finalOptions.type + '" type in given options!'
        );
      super(finalOptions);
    }
  };
  var MultiUndirectedGraph = class extends Graph {
    constructor(options) {
      const finalOptions = assign({ type: "undirected", multi: true }, options);
      if ("multi" in finalOptions && finalOptions.multi !== true)
        throw new InvalidArgumentsGraphError(
          "MultiUndirectedGraph.from: inconsistent indication that the graph should be simple in given options!"
        );
      if (finalOptions.type !== "undirected")
        throw new InvalidArgumentsGraphError(
          'MultiUndirectedGraph.from: inconsistent "' + finalOptions.type + '" type in given options!'
        );
      super(finalOptions);
    }
  };
  function attachStaticFromMethod(Class) {
    Class.from = function(data, options) {
      const finalOptions = assign({}, data.options, options);
      const instance = new Class(finalOptions);
      instance.import(data);
      return instance;
    };
  }
  attachStaticFromMethod(Graph);
  attachStaticFromMethod(DirectedGraph);
  attachStaticFromMethod(UndirectedGraph);
  attachStaticFromMethod(MultiGraph);
  attachStaticFromMethod(MultiDirectedGraph);
  attachStaticFromMethod(MultiUndirectedGraph);
  Graph.Graph = Graph;
  Graph.DirectedGraph = DirectedGraph;
  Graph.UndirectedGraph = UndirectedGraph;
  Graph.MultiGraph = MultiGraph;
  Graph.MultiDirectedGraph = MultiDirectedGraph;
  Graph.MultiUndirectedGraph = MultiUndirectedGraph;
  Graph.InvalidArgumentsGraphError = InvalidArgumentsGraphError;
  Graph.NotFoundGraphError = NotFoundGraphError;
  Graph.UsageGraphError = UsageGraphError;

  // node_modules/sigma/dist/inherits-d1a1e29b.esm.js
  function _toPrimitive(t2, r2) {
    if ("object" != typeof t2 || !t2) return t2;
    var e2 = t2[Symbol.toPrimitive];
    if (void 0 !== e2) {
      var i2 = e2.call(t2, r2 || "default");
      if ("object" != typeof i2) return i2;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r2 ? String : Number)(t2);
  }
  function _toPropertyKey(t2) {
    var i2 = _toPrimitive(t2, "string");
    return "symbol" == typeof i2 ? i2 : i2 + "";
  }
  function _classCallCheck(a2, n2) {
    if (!(a2 instanceof n2)) throw new TypeError("Cannot call a class as a function");
  }
  function _defineProperties(e2, r2) {
    for (var t2 = 0; t2 < r2.length; t2++) {
      var o2 = r2[t2];
      o2.enumerable = o2.enumerable || false, o2.configurable = true, "value" in o2 && (o2.writable = true), Object.defineProperty(e2, _toPropertyKey(o2.key), o2);
    }
  }
  function _createClass(e2, r2, t2) {
    return r2 && _defineProperties(e2.prototype, r2), t2 && _defineProperties(e2, t2), Object.defineProperty(e2, "prototype", {
      writable: false
    }), e2;
  }
  function _getPrototypeOf(t2) {
    return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function(t3) {
      return t3.__proto__ || Object.getPrototypeOf(t3);
    }, _getPrototypeOf(t2);
  }
  function _isNativeReflectConstruct() {
    try {
      var t2 = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {
      }));
    } catch (t3) {
    }
    return (_isNativeReflectConstruct = function() {
      return !!t2;
    })();
  }
  function _assertThisInitialized(e2) {
    if (void 0 === e2) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    return e2;
  }
  function _possibleConstructorReturn(t2, e2) {
    if (e2 && ("object" == typeof e2 || "function" == typeof e2)) return e2;
    if (void 0 !== e2) throw new TypeError("Derived constructors may only return object or undefined");
    return _assertThisInitialized(t2);
  }
  function _callSuper(t2, o2, e2) {
    return o2 = _getPrototypeOf(o2), _possibleConstructorReturn(t2, _isNativeReflectConstruct() ? Reflect.construct(o2, e2 || [], _getPrototypeOf(t2).constructor) : o2.apply(t2, e2));
  }
  function _setPrototypeOf(t2, e2) {
    return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(t3, e3) {
      return t3.__proto__ = e3, t3;
    }, _setPrototypeOf(t2, e2);
  }
  function _inherits(t2, e2) {
    if ("function" != typeof e2 && null !== e2) throw new TypeError("Super expression must either be null or a function");
    t2.prototype = Object.create(e2 && e2.prototype, {
      constructor: {
        value: t2,
        writable: true,
        configurable: true
      }
    }), Object.defineProperty(t2, "prototype", {
      writable: false
    }), e2 && _setPrototypeOf(t2, e2);
  }

  // node_modules/sigma/dist/colors-beb06eb2.esm.js
  function _arrayWithHoles(r2) {
    if (Array.isArray(r2)) return r2;
  }
  function _iterableToArrayLimit(r2, l2) {
    var t2 = null == r2 ? null : "undefined" != typeof Symbol && r2[Symbol.iterator] || r2["@@iterator"];
    if (null != t2) {
      var e2, n2, i2, u2, a2 = [], f2 = true, o2 = false;
      try {
        if (i2 = (t2 = t2.call(r2)).next, 0 === l2) {
          if (Object(t2) !== t2) return;
          f2 = false;
        } else for (; !(f2 = (e2 = i2.call(t2)).done) && (a2.push(e2.value), a2.length !== l2); f2 = true) ;
      } catch (r3) {
        o2 = true, n2 = r3;
      } finally {
        try {
          if (!f2 && null != t2.return && (u2 = t2.return(), Object(u2) !== u2)) return;
        } finally {
          if (o2) throw n2;
        }
      }
      return a2;
    }
  }
  function _arrayLikeToArray(r2, a2) {
    (null == a2 || a2 > r2.length) && (a2 = r2.length);
    for (var e2 = 0, n2 = Array(a2); e2 < a2; e2++) n2[e2] = r2[e2];
    return n2;
  }
  function _unsupportedIterableToArray(r2, a2) {
    if (r2) {
      if ("string" == typeof r2) return _arrayLikeToArray(r2, a2);
      var t2 = {}.toString.call(r2).slice(8, -1);
      return "Object" === t2 && r2.constructor && (t2 = r2.constructor.name), "Map" === t2 || "Set" === t2 ? Array.from(r2) : "Arguments" === t2 || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t2) ? _arrayLikeToArray(r2, a2) : void 0;
    }
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _slicedToArray(r2, e2) {
    return _arrayWithHoles(r2) || _iterableToArrayLimit(r2, e2) || _unsupportedIterableToArray(r2, e2) || _nonIterableRest();
  }
  var HTML_COLORS = {
    black: "#000000",
    silver: "#C0C0C0",
    gray: "#808080",
    grey: "#808080",
    white: "#FFFFFF",
    maroon: "#800000",
    red: "#FF0000",
    purple: "#800080",
    fuchsia: "#FF00FF",
    green: "#008000",
    lime: "#00FF00",
    olive: "#808000",
    yellow: "#FFFF00",
    navy: "#000080",
    blue: "#0000FF",
    teal: "#008080",
    aqua: "#00FFFF",
    darkblue: "#00008B",
    mediumblue: "#0000CD",
    darkgreen: "#006400",
    darkcyan: "#008B8B",
    deepskyblue: "#00BFFF",
    darkturquoise: "#00CED1",
    mediumspringgreen: "#00FA9A",
    springgreen: "#00FF7F",
    cyan: "#00FFFF",
    midnightblue: "#191970",
    dodgerblue: "#1E90FF",
    lightseagreen: "#20B2AA",
    forestgreen: "#228B22",
    seagreen: "#2E8B57",
    darkslategray: "#2F4F4F",
    darkslategrey: "#2F4F4F",
    limegreen: "#32CD32",
    mediumseagreen: "#3CB371",
    turquoise: "#40E0D0",
    royalblue: "#4169E1",
    steelblue: "#4682B4",
    darkslateblue: "#483D8B",
    mediumturquoise: "#48D1CC",
    indigo: "#4B0082",
    darkolivegreen: "#556B2F",
    cadetblue: "#5F9EA0",
    cornflowerblue: "#6495ED",
    rebeccapurple: "#663399",
    mediumaquamarine: "#66CDAA",
    dimgray: "#696969",
    dimgrey: "#696969",
    slateblue: "#6A5ACD",
    olivedrab: "#6B8E23",
    slategray: "#708090",
    slategrey: "#708090",
    lightslategray: "#778899",
    lightslategrey: "#778899",
    mediumslateblue: "#7B68EE",
    lawngreen: "#7CFC00",
    chartreuse: "#7FFF00",
    aquamarine: "#7FFFD4",
    skyblue: "#87CEEB",
    lightskyblue: "#87CEFA",
    blueviolet: "#8A2BE2",
    darkred: "#8B0000",
    darkmagenta: "#8B008B",
    saddlebrown: "#8B4513",
    darkseagreen: "#8FBC8F",
    lightgreen: "#90EE90",
    mediumpurple: "#9370DB",
    darkviolet: "#9400D3",
    palegreen: "#98FB98",
    darkorchid: "#9932CC",
    yellowgreen: "#9ACD32",
    sienna: "#A0522D",
    brown: "#A52A2A",
    darkgray: "#A9A9A9",
    darkgrey: "#A9A9A9",
    lightblue: "#ADD8E6",
    greenyellow: "#ADFF2F",
    paleturquoise: "#AFEEEE",
    lightsteelblue: "#B0C4DE",
    powderblue: "#B0E0E6",
    firebrick: "#B22222",
    darkgoldenrod: "#B8860B",
    mediumorchid: "#BA55D3",
    rosybrown: "#BC8F8F",
    darkkhaki: "#BDB76B",
    mediumvioletred: "#C71585",
    indianred: "#CD5C5C",
    peru: "#CD853F",
    chocolate: "#D2691E",
    tan: "#D2B48C",
    lightgray: "#D3D3D3",
    lightgrey: "#D3D3D3",
    thistle: "#D8BFD8",
    orchid: "#DA70D6",
    goldenrod: "#DAA520",
    palevioletred: "#DB7093",
    crimson: "#DC143C",
    gainsboro: "#DCDCDC",
    plum: "#DDA0DD",
    burlywood: "#DEB887",
    lightcyan: "#E0FFFF",
    lavender: "#E6E6FA",
    darksalmon: "#E9967A",
    violet: "#EE82EE",
    palegoldenrod: "#EEE8AA",
    lightcoral: "#F08080",
    khaki: "#F0E68C",
    aliceblue: "#F0F8FF",
    honeydew: "#F0FFF0",
    azure: "#F0FFFF",
    sandybrown: "#F4A460",
    wheat: "#F5DEB3",
    beige: "#F5F5DC",
    whitesmoke: "#F5F5F5",
    mintcream: "#F5FFFA",
    ghostwhite: "#F8F8FF",
    salmon: "#FA8072",
    antiquewhite: "#FAEBD7",
    linen: "#FAF0E6",
    lightgoldenrodyellow: "#FAFAD2",
    oldlace: "#FDF5E6",
    magenta: "#FF00FF",
    deeppink: "#FF1493",
    orangered: "#FF4500",
    tomato: "#FF6347",
    hotpink: "#FF69B4",
    coral: "#FF7F50",
    darkorange: "#FF8C00",
    lightsalmon: "#FFA07A",
    orange: "#FFA500",
    lightpink: "#FFB6C1",
    pink: "#FFC0CB",
    gold: "#FFD700",
    peachpuff: "#FFDAB9",
    navajowhite: "#FFDEAD",
    moccasin: "#FFE4B5",
    bisque: "#FFE4C4",
    mistyrose: "#FFE4E1",
    blanchedalmond: "#FFEBCD",
    papayawhip: "#FFEFD5",
    lavenderblush: "#FFF0F5",
    seashell: "#FFF5EE",
    cornsilk: "#FFF8DC",
    lemonchiffon: "#FFFACD",
    floralwhite: "#FFFAF0",
    snow: "#FFFAFA",
    lightyellow: "#FFFFE0",
    ivory: "#FFFFF0"
  };
  var INT8 = new Int8Array(4);
  var INT32 = new Int32Array(INT8.buffer, 0, 1);
  var FLOAT32 = new Float32Array(INT8.buffer, 0, 1);
  var RGBA_TEST_REGEX = /^\s*rgba?\s*\(/;
  var RGBA_EXTRACT_REGEX = /^\s*rgba?\s*\(\s*([0-9]*)\s*,\s*([0-9]*)\s*,\s*([0-9]*)(?:\s*,\s*(.*)?)?\)\s*$/;
  function parseColor(val) {
    var r2 = 0;
    var g = 0;
    var b2 = 0;
    var a2 = 1;
    if (val[0] === "#") {
      if (val.length === 4) {
        r2 = parseInt(val.charAt(1) + val.charAt(1), 16);
        g = parseInt(val.charAt(2) + val.charAt(2), 16);
        b2 = parseInt(val.charAt(3) + val.charAt(3), 16);
      } else {
        r2 = parseInt(val.charAt(1) + val.charAt(2), 16);
        g = parseInt(val.charAt(3) + val.charAt(4), 16);
        b2 = parseInt(val.charAt(5) + val.charAt(6), 16);
      }
      if (val.length === 9) {
        a2 = parseInt(val.charAt(7) + val.charAt(8), 16) / 255;
      }
    } else if (RGBA_TEST_REGEX.test(val)) {
      var match = val.match(RGBA_EXTRACT_REGEX);
      if (match) {
        r2 = +match[1];
        g = +match[2];
        b2 = +match[3];
        if (match[4]) a2 = +match[4];
      }
    }
    return {
      r: r2,
      g,
      b: b2,
      a: a2
    };
  }
  var FLOAT_COLOR_CACHE = {};
  for (htmlColor in HTML_COLORS) {
    FLOAT_COLOR_CACHE[htmlColor] = floatColor(HTML_COLORS[htmlColor]);
    FLOAT_COLOR_CACHE[HTML_COLORS[htmlColor]] = FLOAT_COLOR_CACHE[htmlColor];
  }
  var htmlColor;
  function rgbaToFloat(r2, g, b2, a2, masking) {
    INT32[0] = a2 << 24 | b2 << 16 | g << 8 | r2;
    if (masking) INT32[0] = INT32[0] & 4278190079;
    return FLOAT32[0];
  }
  function floatColor(val) {
    val = val.toLowerCase();
    if (typeof FLOAT_COLOR_CACHE[val] !== "undefined") return FLOAT_COLOR_CACHE[val];
    var parsed = parseColor(val);
    var r2 = parsed.r, g = parsed.g, b2 = parsed.b;
    var a2 = parsed.a;
    a2 = a2 * 255 | 0;
    var color = rgbaToFloat(r2, g, b2, a2, true);
    FLOAT_COLOR_CACHE[val] = color;
    return color;
  }
  var FLOAT_INDEX_CACHE = {};
  function indexToColor(index) {
    if (typeof FLOAT_INDEX_CACHE[index] !== "undefined") return FLOAT_INDEX_CACHE[index];
    var r2 = (index & 16711680) >>> 16;
    var g = (index & 65280) >>> 8;
    var b2 = index & 255;
    var a2 = 255;
    var color = rgbaToFloat(r2, g, b2, a2, true);
    FLOAT_INDEX_CACHE[index] = color;
    return color;
  }
  function colorToIndex(r2, g, b2, _a) {
    return b2 + (g << 8) + (r2 << 16);
  }
  function getPixelColor(gl, frameBuffer, x, y2, pixelRatio, downSizingRatio) {
    var bufferX = Math.floor(x / downSizingRatio * pixelRatio);
    var bufferY = Math.floor(gl.drawingBufferHeight / downSizingRatio - y2 / downSizingRatio * pixelRatio);
    var pixel = new Uint8Array(4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.readPixels(bufferX, bufferY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    var _pixel = _slicedToArray(pixel, 4), r2 = _pixel[0], g = _pixel[1], b2 = _pixel[2], a2 = _pixel[3];
    return [r2, g, b2, a2];
  }

  // node_modules/sigma/dist/index-236c62ad.esm.js
  function _defineProperty(e2, r2, t2) {
    return (r2 = _toPropertyKey(r2)) in e2 ? Object.defineProperty(e2, r2, {
      value: t2,
      enumerable: true,
      configurable: true,
      writable: true
    }) : e2[r2] = t2, e2;
  }
  function ownKeys(e2, r2) {
    var t2 = Object.keys(e2);
    if (Object.getOwnPropertySymbols) {
      var o2 = Object.getOwnPropertySymbols(e2);
      r2 && (o2 = o2.filter(function(r3) {
        return Object.getOwnPropertyDescriptor(e2, r3).enumerable;
      })), t2.push.apply(t2, o2);
    }
    return t2;
  }
  function _objectSpread2(e2) {
    for (var r2 = 1; r2 < arguments.length; r2++) {
      var t2 = null != arguments[r2] ? arguments[r2] : {};
      r2 % 2 ? ownKeys(Object(t2), true).forEach(function(r3) {
        _defineProperty(e2, r3, t2[r3]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(t2)) : ownKeys(Object(t2)).forEach(function(r3) {
        Object.defineProperty(e2, r3, Object.getOwnPropertyDescriptor(t2, r3));
      });
    }
    return e2;
  }
  function _superPropBase(t2, o2) {
    for (; !{}.hasOwnProperty.call(t2, o2) && null !== (t2 = _getPrototypeOf(t2)); ) ;
    return t2;
  }
  function _get() {
    return _get = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function(e2, t2, r2) {
      var p2 = _superPropBase(e2, t2);
      if (p2) {
        var n2 = Object.getOwnPropertyDescriptor(p2, t2);
        return n2.get ? n2.get.call(arguments.length < 3 ? e2 : r2) : n2.value;
      }
    }, _get.apply(null, arguments);
  }
  function _superPropGet(t2, o2, e2, r2) {
    var p2 = _get(_getPrototypeOf(1 & r2 ? t2.prototype : t2), o2, e2);
    return 2 & r2 && "function" == typeof p2 ? function(t3) {
      return p2.apply(e2, t3);
    } : p2;
  }
  function getAttributeItemsCount(attr) {
    return attr.normalized ? 1 : attr.size;
  }
  function getAttributesItemsCount(attrs) {
    var res = 0;
    attrs.forEach(function(attr) {
      return res += getAttributeItemsCount(attr);
    });
    return res;
  }
  function loadShader(type, gl, source) {
    var glType = type === "VERTEX" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER;
    var shader = gl.createShader(glType);
    if (shader === null) {
      throw new Error("loadShader: error while creating the shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var successfullyCompiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!successfullyCompiled) {
      var infoLog = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error("loadShader: error while compiling the shader:\n".concat(infoLog, "\n").concat(source));
    }
    return shader;
  }
  function loadVertexShader(gl, source) {
    return loadShader("VERTEX", gl, source);
  }
  function loadFragmentShader(gl, source) {
    return loadShader("FRAGMENT", gl, source);
  }
  function loadProgram(gl, shaders) {
    var program = gl.createProgram();
    if (program === null) {
      throw new Error("loadProgram: error while creating the program.");
    }
    var i2, l2;
    for (i2 = 0, l2 = shaders.length; i2 < l2; i2++) gl.attachShader(program, shaders[i2]);
    gl.linkProgram(program);
    var successfullyLinked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!successfullyLinked) {
      gl.deleteProgram(program);
      throw new Error("loadProgram: error while linking the program.");
    }
    return program;
  }
  function killProgram(_ref) {
    var gl = _ref.gl, buffer = _ref.buffer, program = _ref.program, vertexShader = _ref.vertexShader, fragmentShader = _ref.fragmentShader;
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
  }
  var PICKING_PREFIX = "#define PICKING_MODE\n";
  var SIZE_FACTOR_PER_ATTRIBUTE_TYPE = _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, WebGL2RenderingContext.BOOL, 1), WebGL2RenderingContext.BYTE, 1), WebGL2RenderingContext.UNSIGNED_BYTE, 1), WebGL2RenderingContext.SHORT, 2), WebGL2RenderingContext.UNSIGNED_SHORT, 2), WebGL2RenderingContext.INT, 4), WebGL2RenderingContext.UNSIGNED_INT, 4), WebGL2RenderingContext.FLOAT, 4);
  var Program = /* @__PURE__ */ (function() {
    function Program2(gl, pickingBuffer, renderer) {
      _classCallCheck(this, Program2);
      _defineProperty(this, "array", new Float32Array());
      _defineProperty(this, "constantArray", new Float32Array());
      _defineProperty(this, "capacity", 0);
      _defineProperty(this, "verticesCount", 0);
      var def = this.getDefinition();
      this.VERTICES = def.VERTICES;
      this.VERTEX_SHADER_SOURCE = def.VERTEX_SHADER_SOURCE;
      this.FRAGMENT_SHADER_SOURCE = def.FRAGMENT_SHADER_SOURCE;
      this.UNIFORMS = def.UNIFORMS;
      this.ATTRIBUTES = def.ATTRIBUTES;
      this.METHOD = def.METHOD;
      this.CONSTANT_ATTRIBUTES = "CONSTANT_ATTRIBUTES" in def ? def.CONSTANT_ATTRIBUTES : [];
      this.CONSTANT_DATA = "CONSTANT_DATA" in def ? def.CONSTANT_DATA : [];
      this.isInstanced = "CONSTANT_ATTRIBUTES" in def;
      this.ATTRIBUTES_ITEMS_COUNT = getAttributesItemsCount(this.ATTRIBUTES);
      this.STRIDE = this.VERTICES * this.ATTRIBUTES_ITEMS_COUNT;
      this.renderer = renderer;
      this.normalProgram = this.getProgramInfo("normal", gl, def.VERTEX_SHADER_SOURCE, def.FRAGMENT_SHADER_SOURCE, null);
      this.pickProgram = pickingBuffer ? this.getProgramInfo("pick", gl, PICKING_PREFIX + def.VERTEX_SHADER_SOURCE, PICKING_PREFIX + def.FRAGMENT_SHADER_SOURCE, pickingBuffer) : null;
      if (this.isInstanced) {
        var constantAttributesItemsCount = getAttributesItemsCount(this.CONSTANT_ATTRIBUTES);
        if (this.CONSTANT_DATA.length !== this.VERTICES) throw new Error("Program: error while getting constant data (expected ".concat(this.VERTICES, " items, received ").concat(this.CONSTANT_DATA.length, " instead)"));
        this.constantArray = new Float32Array(this.CONSTANT_DATA.length * constantAttributesItemsCount);
        for (var i2 = 0; i2 < this.CONSTANT_DATA.length; i2++) {
          var vector = this.CONSTANT_DATA[i2];
          if (vector.length !== constantAttributesItemsCount) throw new Error("Program: error while getting constant data (one vector has ".concat(vector.length, " items instead of ").concat(constantAttributesItemsCount, ")"));
          for (var j2 = 0; j2 < vector.length; j2++) this.constantArray[i2 * constantAttributesItemsCount + j2] = vector[j2];
        }
        this.STRIDE = this.ATTRIBUTES_ITEMS_COUNT;
      }
    }
    return _createClass(Program2, [{
      key: "kill",
      value: function kill() {
        killProgram(this.normalProgram);
        if (this.pickProgram) {
          killProgram(this.pickProgram);
          this.pickProgram = null;
        }
      }
    }, {
      key: "getProgramInfo",
      value: function getProgramInfo(name, gl, vertexShaderSource, fragmentShaderSource, frameBuffer) {
        var def = this.getDefinition();
        var buffer = gl.createBuffer();
        if (buffer === null) throw new Error("Program: error while creating the WebGL buffer.");
        var vertexShader = loadVertexShader(gl, vertexShaderSource);
        var fragmentShader = loadFragmentShader(gl, fragmentShaderSource);
        var program = loadProgram(gl, [vertexShader, fragmentShader]);
        var uniformLocations = {};
        def.UNIFORMS.forEach(function(uniformName) {
          var location = gl.getUniformLocation(program, uniformName);
          if (location) uniformLocations[uniformName] = location;
        });
        var attributeLocations = {};
        def.ATTRIBUTES.forEach(function(attr) {
          attributeLocations[attr.name] = gl.getAttribLocation(program, attr.name);
        });
        var constantBuffer;
        if ("CONSTANT_ATTRIBUTES" in def) {
          def.CONSTANT_ATTRIBUTES.forEach(function(attr) {
            attributeLocations[attr.name] = gl.getAttribLocation(program, attr.name);
          });
          constantBuffer = gl.createBuffer();
          if (constantBuffer === null) throw new Error("Program: error while creating the WebGL constant buffer.");
        }
        return {
          name,
          program,
          gl,
          frameBuffer,
          buffer,
          constantBuffer: constantBuffer || {},
          uniformLocations,
          attributeLocations,
          isPicking: name === "pick",
          vertexShader,
          fragmentShader
        };
      }
    }, {
      key: "bindProgram",
      value: function bindProgram(program) {
        var _this = this;
        var offset = 0;
        var gl = program.gl, buffer = program.buffer;
        if (!this.isInstanced) {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          offset = 0;
          this.ATTRIBUTES.forEach(function(attr) {
            return offset += _this.bindAttribute(attr, program, offset);
          });
          gl.bufferData(gl.ARRAY_BUFFER, this.array, gl.DYNAMIC_DRAW);
        } else {
          gl.bindBuffer(gl.ARRAY_BUFFER, program.constantBuffer);
          offset = 0;
          this.CONSTANT_ATTRIBUTES.forEach(function(attr) {
            return offset += _this.bindAttribute(attr, program, offset, false);
          });
          gl.bufferData(gl.ARRAY_BUFFER, this.constantArray, gl.STATIC_DRAW);
          gl.bindBuffer(gl.ARRAY_BUFFER, program.buffer);
          offset = 0;
          this.ATTRIBUTES.forEach(function(attr) {
            return offset += _this.bindAttribute(attr, program, offset, true);
          });
          gl.bufferData(gl.ARRAY_BUFFER, this.array, gl.DYNAMIC_DRAW);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
      }
    }, {
      key: "unbindProgram",
      value: function unbindProgram(program) {
        var _this2 = this;
        if (!this.isInstanced) {
          this.ATTRIBUTES.forEach(function(attr) {
            return _this2.unbindAttribute(attr, program);
          });
        } else {
          this.CONSTANT_ATTRIBUTES.forEach(function(attr) {
            return _this2.unbindAttribute(attr, program, false);
          });
          this.ATTRIBUTES.forEach(function(attr) {
            return _this2.unbindAttribute(attr, program, true);
          });
        }
      }
    }, {
      key: "bindAttribute",
      value: function bindAttribute(attr, program, offset, setDivisor) {
        var sizeFactor = SIZE_FACTOR_PER_ATTRIBUTE_TYPE[attr.type];
        if (typeof sizeFactor !== "number") throw new Error('Program.bind: yet unsupported attribute type "'.concat(attr.type, '"'));
        var location = program.attributeLocations[attr.name];
        var gl = program.gl;
        if (location !== -1) {
          gl.enableVertexAttribArray(location);
          var stride = !this.isInstanced ? this.ATTRIBUTES_ITEMS_COUNT * Float32Array.BYTES_PER_ELEMENT : (setDivisor ? this.ATTRIBUTES_ITEMS_COUNT : getAttributesItemsCount(this.CONSTANT_ATTRIBUTES)) * Float32Array.BYTES_PER_ELEMENT;
          gl.vertexAttribPointer(location, attr.size, attr.type, attr.normalized || false, stride, offset);
          if (this.isInstanced && setDivisor) {
            if (gl instanceof WebGL2RenderingContext) {
              gl.vertexAttribDivisor(location, 1);
            } else {
              var ext = gl.getExtension("ANGLE_instanced_arrays");
              if (ext) ext.vertexAttribDivisorANGLE(location, 1);
            }
          }
        }
        return attr.size * sizeFactor;
      }
    }, {
      key: "unbindAttribute",
      value: function unbindAttribute(attr, program, unsetDivisor) {
        var location = program.attributeLocations[attr.name];
        var gl = program.gl;
        if (location !== -1) {
          gl.disableVertexAttribArray(location);
          if (this.isInstanced && unsetDivisor) {
            if (gl instanceof WebGL2RenderingContext) {
              gl.vertexAttribDivisor(location, 0);
            } else {
              var ext = gl.getExtension("ANGLE_instanced_arrays");
              if (ext) ext.vertexAttribDivisorANGLE(location, 0);
            }
          }
        }
      }
    }, {
      key: "reallocate",
      value: function reallocate(capacity) {
        if (capacity === this.capacity) return;
        this.capacity = capacity;
        this.verticesCount = this.VERTICES * capacity;
        this.array = new Float32Array(!this.isInstanced ? this.verticesCount * this.ATTRIBUTES_ITEMS_COUNT : this.capacity * this.ATTRIBUTES_ITEMS_COUNT);
      }
    }, {
      key: "hasNothingToRender",
      value: function hasNothingToRender() {
        return this.verticesCount === 0;
      }
    }, {
      key: "renderProgram",
      value: function renderProgram(params, programInfo) {
        var gl = programInfo.gl, program = programInfo.program;
        gl.enable(gl.BLEND);
        gl.useProgram(program);
        this.setUniforms(params, programInfo);
        this.drawWebGL(this.METHOD, programInfo);
      }
    }, {
      key: "render",
      value: function render(params) {
        if (this.hasNothingToRender()) return;
        if (this.pickProgram) {
          this.pickProgram.gl.viewport(0, 0, params.width * params.pixelRatio / params.downSizingRatio, params.height * params.pixelRatio / params.downSizingRatio);
          this.bindProgram(this.pickProgram);
          this.renderProgram(_objectSpread2(_objectSpread2({}, params), {}, {
            pixelRatio: params.pixelRatio / params.downSizingRatio
          }), this.pickProgram);
          this.unbindProgram(this.pickProgram);
        }
        this.normalProgram.gl.viewport(0, 0, params.width * params.pixelRatio, params.height * params.pixelRatio);
        this.bindProgram(this.normalProgram);
        this.renderProgram(params, this.normalProgram);
        this.unbindProgram(this.normalProgram);
      }
    }, {
      key: "drawWebGL",
      value: function drawWebGL(method, _ref) {
        var gl = _ref.gl, frameBuffer = _ref.frameBuffer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        if (!this.isInstanced) {
          gl.drawArrays(method, 0, this.verticesCount);
        } else {
          if (gl instanceof WebGL2RenderingContext) {
            gl.drawArraysInstanced(method, 0, this.VERTICES, this.capacity);
          } else {
            var ext = gl.getExtension("ANGLE_instanced_arrays");
            if (ext) ext.drawArraysInstancedANGLE(method, 0, this.VERTICES, this.capacity);
          }
        }
      }
    }]);
  })();
  var NodeProgram = /* @__PURE__ */ (function(_ref) {
    function NodeProgram2() {
      _classCallCheck(this, NodeProgram2);
      return _callSuper(this, NodeProgram2, arguments);
    }
    _inherits(NodeProgram2, _ref);
    return _createClass(NodeProgram2, [{
      key: "kill",
      value: function kill() {
        _superPropGet(NodeProgram2, "kill", this, 3)([]);
      }
    }, {
      key: "process",
      value: function process2(nodeIndex, offset, data) {
        var i2 = offset * this.STRIDE;
        if (data.hidden) {
          for (var l2 = i2 + this.STRIDE; i2 < l2; i2++) {
            this.array[i2] = 0;
          }
          return;
        }
        return this.processVisibleItem(indexToColor(nodeIndex), i2, data);
      }
    }]);
  })(Program);
  var EdgeProgram = /* @__PURE__ */ (function(_ref) {
    function EdgeProgram2() {
      var _this;
      _classCallCheck(this, EdgeProgram2);
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _callSuper(this, EdgeProgram2, [].concat(args));
      _defineProperty(_this, "drawLabel", void 0);
      return _this;
    }
    _inherits(EdgeProgram2, _ref);
    return _createClass(EdgeProgram2, [{
      key: "kill",
      value: function kill() {
        _superPropGet(EdgeProgram2, "kill", this, 3)([]);
      }
    }, {
      key: "process",
      value: function process2(edgeIndex, offset, sourceData, targetData, data) {
        var i2 = offset * this.STRIDE;
        if (data.hidden || sourceData.hidden || targetData.hidden) {
          for (var l2 = i2 + this.STRIDE; i2 < l2; i2++) {
            this.array[i2] = 0;
          }
          return;
        }
        return this.processVisibleItem(indexToColor(edgeIndex), i2, sourceData, targetData, data);
      }
    }]);
  })(Program);
  function createEdgeCompoundProgram(programClasses, drawLabel) {
    return /* @__PURE__ */ (function() {
      function EdgeCompoundProgram(gl, pickingBuffer, renderer) {
        _classCallCheck(this, EdgeCompoundProgram);
        _defineProperty(this, "drawLabel", drawLabel);
        this.programs = programClasses.map(function(Program2) {
          return new Program2(gl, pickingBuffer, renderer);
        });
      }
      return _createClass(EdgeCompoundProgram, [{
        key: "reallocate",
        value: function reallocate(capacity) {
          this.programs.forEach(function(program) {
            return program.reallocate(capacity);
          });
        }
      }, {
        key: "process",
        value: function process2(edgeIndex, offset, sourceData, targetData, data) {
          this.programs.forEach(function(program) {
            return program.process(edgeIndex, offset, sourceData, targetData, data);
          });
        }
      }, {
        key: "render",
        value: function render(params) {
          this.programs.forEach(function(program) {
            return program.render(params);
          });
        }
      }, {
        key: "kill",
        value: function kill() {
          this.programs.forEach(function(program) {
            return program.kill();
          });
        }
      }]);
    })();
  }
  function drawStraightEdgeLabel(context, edgeData, sourceData, targetData, settings) {
    var size = settings.edgeLabelSize, font = settings.edgeLabelFont, weight = settings.edgeLabelWeight, color = settings.edgeLabelColor.attribute ? edgeData[settings.edgeLabelColor.attribute] || settings.edgeLabelColor.color || "#000" : settings.edgeLabelColor.color;
    var label = edgeData.label;
    if (!label) return;
    context.fillStyle = color;
    context.font = "".concat(weight, " ").concat(size, "px ").concat(font);
    var sSize = sourceData.size;
    var tSize = targetData.size;
    var sx = sourceData.x;
    var sy = sourceData.y;
    var tx = targetData.x;
    var ty = targetData.y;
    var cx = (sx + tx) / 2;
    var cy = (sy + ty) / 2;
    var dx = tx - sx;
    var dy = ty - sy;
    var d2 = Math.sqrt(dx * dx + dy * dy);
    if (d2 < sSize + tSize) return;
    sx += dx * sSize / d2;
    sy += dy * sSize / d2;
    tx -= dx * tSize / d2;
    ty -= dy * tSize / d2;
    cx = (sx + tx) / 2;
    cy = (sy + ty) / 2;
    dx = tx - sx;
    dy = ty - sy;
    d2 = Math.sqrt(dx * dx + dy * dy);
    var textLength = context.measureText(label).width;
    if (textLength > d2) {
      var ellipsis = "\u2026";
      label = label + ellipsis;
      textLength = context.measureText(label).width;
      while (textLength > d2 && label.length > 1) {
        label = label.slice(0, -2) + ellipsis;
        textLength = context.measureText(label).width;
      }
      if (label.length < 4) return;
    }
    var angle;
    if (dx > 0) {
      if (dy > 0) angle = Math.acos(dx / d2);
      else angle = Math.asin(dy / d2);
    } else {
      if (dy > 0) angle = Math.acos(dx / d2) + Math.PI;
      else angle = Math.asin(dx / d2) + Math.PI / 2;
    }
    context.save();
    context.translate(cx, cy);
    context.rotate(angle);
    context.fillText(label, -textLength / 2, edgeData.size / 2 + size);
    context.restore();
  }
  function drawDiscNodeLabel(context, data, settings) {
    if (!data.label) return;
    var size = settings.labelSize, font = settings.labelFont, weight = settings.labelWeight, color = settings.labelColor.attribute ? data[settings.labelColor.attribute] || settings.labelColor.color || "#000" : settings.labelColor.color;
    context.fillStyle = color;
    context.font = "".concat(weight, " ").concat(size, "px ").concat(font);
    context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
  }
  function drawDiscNodeHover(context, data, settings) {
    var size = settings.labelSize, font = settings.labelFont, weight = settings.labelWeight;
    context.font = "".concat(weight, " ").concat(size, "px ").concat(font);
    context.fillStyle = "#FFF";
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 8;
    context.shadowColor = "#000";
    var PADDING = 2;
    if (typeof data.label === "string") {
      var textWidth = context.measureText(data.label).width, boxWidth = Math.round(textWidth + 5), boxHeight = Math.round(size + 2 * PADDING), radius = Math.max(data.size, size / 2) + PADDING;
      var angleRadian = Math.asin(boxHeight / 2 / radius);
      var xDeltaCoord = Math.sqrt(Math.abs(Math.pow(radius, 2) - Math.pow(boxHeight / 2, 2)));
      context.beginPath();
      context.moveTo(data.x + xDeltaCoord, data.y + boxHeight / 2);
      context.lineTo(data.x + radius + boxWidth, data.y + boxHeight / 2);
      context.lineTo(data.x + radius + boxWidth, data.y - boxHeight / 2);
      context.lineTo(data.x + xDeltaCoord, data.y - boxHeight / 2);
      context.arc(data.x, data.y, radius, angleRadian, -angleRadian);
      context.closePath();
      context.fill();
    } else {
      context.beginPath();
      context.arc(data.x, data.y, data.size + PADDING, 0, Math.PI * 2);
      context.closePath();
      context.fill();
    }
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
    context.shadowBlur = 0;
    drawDiscNodeLabel(context, data, settings);
  }
  var SHADER_SOURCE$6 = (
    /*glsl*/
    "\nprecision highp float;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\n\nuniform float u_correctionRatio;\n\nconst vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);\n\nvoid main(void) {\n  float border = u_correctionRatio * 2.0;\n  float dist = length(v_diffVector) - v_radius + border;\n\n  // No antialiasing for picking mode:\n  #ifdef PICKING_MODE\n  if (dist > border)\n    gl_FragColor = transparent;\n  else\n    gl_FragColor = v_color;\n\n  #else\n  float t = 0.0;\n  if (dist > border)\n    t = 1.0;\n  else if (dist > 0.0)\n    t = dist / border;\n\n  gl_FragColor = mix(v_color, transparent, t);\n  #endif\n}\n"
  );
  var FRAGMENT_SHADER_SOURCE$2 = SHADER_SOURCE$6;
  var SHADER_SOURCE$5 = (
    /*glsl*/
    "\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_position;\nattribute float a_size;\nattribute float a_angle;\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\n\nvarying vec4 v_color;\nvarying vec2 v_diffVector;\nvarying float v_radius;\nvarying float v_border;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float size = a_size * u_correctionRatio / u_sizeRatio * 4.0;\n  vec2 diffVector = size * vec2(cos(a_angle), sin(a_angle));\n  vec2 position = a_position + diffVector;\n  gl_Position = vec4(\n    (u_matrix * vec3(position, 1)).xy,\n    0,\n    1\n  );\n\n  v_diffVector = diffVector;\n  v_radius = size / 2.0;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n"
  );
  var VERTEX_SHADER_SOURCE$3 = SHADER_SOURCE$5;
  var _WebGLRenderingContex$3 = WebGLRenderingContext;
  var UNSIGNED_BYTE$3 = _WebGLRenderingContex$3.UNSIGNED_BYTE;
  var FLOAT$3 = _WebGLRenderingContex$3.FLOAT;
  var UNIFORMS$3 = ["u_sizeRatio", "u_correctionRatio", "u_matrix"];
  var NodeCircleProgram = /* @__PURE__ */ (function(_NodeProgram) {
    function NodeCircleProgram2() {
      _classCallCheck(this, NodeCircleProgram2);
      return _callSuper(this, NodeCircleProgram2, arguments);
    }
    _inherits(NodeCircleProgram2, _NodeProgram);
    return _createClass(NodeCircleProgram2, [{
      key: "getDefinition",
      value: function getDefinition() {
        return {
          VERTICES: 3,
          VERTEX_SHADER_SOURCE: VERTEX_SHADER_SOURCE$3,
          FRAGMENT_SHADER_SOURCE: FRAGMENT_SHADER_SOURCE$2,
          METHOD: WebGLRenderingContext.TRIANGLES,
          UNIFORMS: UNIFORMS$3,
          ATTRIBUTES: [{
            name: "a_position",
            size: 2,
            type: FLOAT$3
          }, {
            name: "a_size",
            size: 1,
            type: FLOAT$3
          }, {
            name: "a_color",
            size: 4,
            type: UNSIGNED_BYTE$3,
            normalized: true
          }, {
            name: "a_id",
            size: 4,
            type: UNSIGNED_BYTE$3,
            normalized: true
          }],
          CONSTANT_ATTRIBUTES: [{
            name: "a_angle",
            size: 1,
            type: FLOAT$3
          }],
          CONSTANT_DATA: [[NodeCircleProgram2.ANGLE_1], [NodeCircleProgram2.ANGLE_2], [NodeCircleProgram2.ANGLE_3]]
        };
      }
    }, {
      key: "processVisibleItem",
      value: function processVisibleItem(nodeIndex, startIndex, data) {
        var array = this.array;
        var color = floatColor(data.color);
        array[startIndex++] = data.x;
        array[startIndex++] = data.y;
        array[startIndex++] = data.size;
        array[startIndex++] = color;
        array[startIndex++] = nodeIndex;
      }
    }, {
      key: "setUniforms",
      value: function setUniforms(params, _ref) {
        var gl = _ref.gl, uniformLocations = _ref.uniformLocations;
        var u_sizeRatio = uniformLocations.u_sizeRatio, u_correctionRatio = uniformLocations.u_correctionRatio, u_matrix = uniformLocations.u_matrix;
        gl.uniform1f(u_correctionRatio, params.correctionRatio);
        gl.uniform1f(u_sizeRatio, params.sizeRatio);
        gl.uniformMatrix3fv(u_matrix, false, params.matrix);
      }
    }]);
  })(NodeProgram);
  _defineProperty(NodeCircleProgram, "ANGLE_1", 0);
  _defineProperty(NodeCircleProgram, "ANGLE_2", 2 * Math.PI / 3);
  _defineProperty(NodeCircleProgram, "ANGLE_3", 4 * Math.PI / 3);
  var SHADER_SOURCE$4 = (
    /*glsl*/
    "\nprecision mediump float;\n\nvarying vec4 v_color;\n\nvoid main(void) {\n  gl_FragColor = v_color;\n}\n"
  );
  var FRAGMENT_SHADER_SOURCE$1 = SHADER_SOURCE$4;
  var SHADER_SOURCE$3 = (
    /*glsl*/
    "\nattribute vec2 a_position;\nattribute vec2 a_normal;\nattribute float a_radius;\nattribute vec3 a_barycentric;\n\n#ifdef PICKING_MODE\nattribute vec4 a_id;\n#else\nattribute vec4 a_color;\n#endif\n\nuniform mat3 u_matrix;\nuniform float u_sizeRatio;\nuniform float u_correctionRatio;\nuniform float u_minEdgeThickness;\nuniform float u_lengthToThicknessRatio;\nuniform float u_widenessToThicknessRatio;\n\nvarying vec4 v_color;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float minThickness = u_minEdgeThickness;\n\n  float normalLength = length(a_normal);\n  vec2 unitNormal = a_normal / normalLength;\n\n  // These first computations are taken from edge.vert.glsl and\n  // edge.clamped.vert.glsl. Please read it to get better comments on what's\n  // happening:\n  float pixelsThickness = max(normalLength / u_sizeRatio, minThickness);\n  float webGLThickness = pixelsThickness * u_correctionRatio;\n  float webGLNodeRadius = a_radius * 2.0 * u_correctionRatio / u_sizeRatio;\n  float webGLArrowHeadLength = webGLThickness * u_lengthToThicknessRatio * 2.0;\n  float webGLArrowHeadThickness = webGLThickness * u_widenessToThicknessRatio;\n\n  float da = a_barycentric.x;\n  float db = a_barycentric.y;\n  float dc = a_barycentric.z;\n\n  vec2 delta = vec2(\n      da * (webGLNodeRadius * unitNormal.y)\n    + db * ((webGLNodeRadius + webGLArrowHeadLength) * unitNormal.y + webGLArrowHeadThickness * unitNormal.x)\n    + dc * ((webGLNodeRadius + webGLArrowHeadLength) * unitNormal.y - webGLArrowHeadThickness * unitNormal.x),\n\n      da * (-webGLNodeRadius * unitNormal.x)\n    + db * (-(webGLNodeRadius + webGLArrowHeadLength) * unitNormal.x + webGLArrowHeadThickness * unitNormal.y)\n    + dc * (-(webGLNodeRadius + webGLArrowHeadLength) * unitNormal.x - webGLArrowHeadThickness * unitNormal.y)\n  );\n\n  vec2 position = (u_matrix * vec3(a_position + delta, 1)).xy;\n\n  gl_Position = vec4(position, 0, 1);\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n"
  );
  var VERTEX_SHADER_SOURCE$2 = SHADER_SOURCE$3;
  var _WebGLRenderingContex$2 = WebGLRenderingContext;
  var UNSIGNED_BYTE$2 = _WebGLRenderingContex$2.UNSIGNED_BYTE;
  var FLOAT$2 = _WebGLRenderingContex$2.FLOAT;
  var UNIFORMS$2 = ["u_matrix", "u_sizeRatio", "u_correctionRatio", "u_minEdgeThickness", "u_lengthToThicknessRatio", "u_widenessToThicknessRatio"];
  var DEFAULT_EDGE_ARROW_HEAD_PROGRAM_OPTIONS = {
    extremity: "target",
    lengthToThicknessRatio: 2.5,
    widenessToThicknessRatio: 2
  };
  function createEdgeArrowHeadProgram(inputOptions) {
    var options = _objectSpread2(_objectSpread2({}, DEFAULT_EDGE_ARROW_HEAD_PROGRAM_OPTIONS), inputOptions || {});
    return /* @__PURE__ */ (function(_EdgeProgram) {
      function EdgeArrowHeadProgram2() {
        _classCallCheck(this, EdgeArrowHeadProgram2);
        return _callSuper(this, EdgeArrowHeadProgram2, arguments);
      }
      _inherits(EdgeArrowHeadProgram2, _EdgeProgram);
      return _createClass(EdgeArrowHeadProgram2, [{
        key: "getDefinition",
        value: function getDefinition() {
          return {
            VERTICES: 3,
            VERTEX_SHADER_SOURCE: VERTEX_SHADER_SOURCE$2,
            FRAGMENT_SHADER_SOURCE: FRAGMENT_SHADER_SOURCE$1,
            METHOD: WebGLRenderingContext.TRIANGLES,
            UNIFORMS: UNIFORMS$2,
            ATTRIBUTES: [{
              name: "a_position",
              size: 2,
              type: FLOAT$2
            }, {
              name: "a_normal",
              size: 2,
              type: FLOAT$2
            }, {
              name: "a_radius",
              size: 1,
              type: FLOAT$2
            }, {
              name: "a_color",
              size: 4,
              type: UNSIGNED_BYTE$2,
              normalized: true
            }, {
              name: "a_id",
              size: 4,
              type: UNSIGNED_BYTE$2,
              normalized: true
            }],
            CONSTANT_ATTRIBUTES: [{
              name: "a_barycentric",
              size: 3,
              type: FLOAT$2
            }],
            CONSTANT_DATA: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
          };
        }
      }, {
        key: "processVisibleItem",
        value: function processVisibleItem(edgeIndex, startIndex, sourceData, targetData, data) {
          if (options.extremity === "source") {
            var _ref = [targetData, sourceData];
            sourceData = _ref[0];
            targetData = _ref[1];
          }
          var thickness = data.size || 1;
          var radius = targetData.size || 1;
          var x1 = sourceData.x;
          var y1 = sourceData.y;
          var x2 = targetData.x;
          var y2 = targetData.y;
          var color = floatColor(data.color);
          var dx = x2 - x1;
          var dy = y2 - y1;
          var len = dx * dx + dy * dy;
          var n1 = 0;
          var n2 = 0;
          if (len) {
            len = 1 / Math.sqrt(len);
            n1 = -dy * len * thickness;
            n2 = dx * len * thickness;
          }
          var array = this.array;
          array[startIndex++] = x2;
          array[startIndex++] = y2;
          array[startIndex++] = -n1;
          array[startIndex++] = -n2;
          array[startIndex++] = radius;
          array[startIndex++] = color;
          array[startIndex++] = edgeIndex;
        }
      }, {
        key: "setUniforms",
        value: function setUniforms(params, _ref2) {
          var gl = _ref2.gl, uniformLocations = _ref2.uniformLocations;
          var u_matrix = uniformLocations.u_matrix, u_sizeRatio = uniformLocations.u_sizeRatio, u_correctionRatio = uniformLocations.u_correctionRatio, u_minEdgeThickness = uniformLocations.u_minEdgeThickness, u_lengthToThicknessRatio = uniformLocations.u_lengthToThicknessRatio, u_widenessToThicknessRatio = uniformLocations.u_widenessToThicknessRatio;
          gl.uniformMatrix3fv(u_matrix, false, params.matrix);
          gl.uniform1f(u_sizeRatio, params.sizeRatio);
          gl.uniform1f(u_correctionRatio, params.correctionRatio);
          gl.uniform1f(u_minEdgeThickness, params.minEdgeThickness);
          gl.uniform1f(u_lengthToThicknessRatio, options.lengthToThicknessRatio);
          gl.uniform1f(u_widenessToThicknessRatio, options.widenessToThicknessRatio);
        }
      }]);
    })(EdgeProgram);
  }
  var EdgeArrowHeadProgram = createEdgeArrowHeadProgram();
  var SHADER_SOURCE$2 = (
    /*glsl*/
    "\nprecision mediump float;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\nvarying float v_feather;\n\nconst vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);\n\nvoid main(void) {\n  // We only handle antialiasing for normal mode:\n  #ifdef PICKING_MODE\n  gl_FragColor = v_color;\n  #else\n  float dist = length(v_normal) * v_thickness;\n\n  float t = smoothstep(\n    v_thickness - v_feather,\n    v_thickness,\n    dist\n  );\n\n  gl_FragColor = mix(v_color, transparent, t);\n  #endif\n}\n"
  );
  var FRAGMENT_SHADER_SOURCE = SHADER_SOURCE$2;
  var SHADER_SOURCE$1 = (
    /*glsl*/
    "\nattribute vec4 a_id;\nattribute vec4 a_color;\nattribute vec2 a_normal;\nattribute float a_normalCoef;\nattribute vec2 a_positionStart;\nattribute vec2 a_positionEnd;\nattribute float a_positionCoef;\nattribute float a_radius;\nattribute float a_radiusCoef;\n\nuniform mat3 u_matrix;\nuniform float u_zoomRatio;\nuniform float u_sizeRatio;\nuniform float u_pixelRatio;\nuniform float u_correctionRatio;\nuniform float u_minEdgeThickness;\nuniform float u_lengthToThicknessRatio;\nuniform float u_feather;\n\nvarying vec4 v_color;\nvarying vec2 v_normal;\nvarying float v_thickness;\nvarying float v_feather;\n\nconst float bias = 255.0 / 254.0;\n\nvoid main() {\n  float minThickness = u_minEdgeThickness;\n\n  float radius = a_radius * a_radiusCoef;\n  vec2 normal = a_normal * a_normalCoef;\n  vec2 position = a_positionStart * (1.0 - a_positionCoef) + a_positionEnd * a_positionCoef;\n\n  float normalLength = length(normal);\n  vec2 unitNormal = normal / normalLength;\n\n  // These first computations are taken from edge.vert.glsl. Please read it to\n  // get better comments on what's happening:\n  float pixelsThickness = max(normalLength, minThickness * u_sizeRatio);\n  float webGLThickness = pixelsThickness * u_correctionRatio / u_sizeRatio;\n\n  // Here, we move the point to leave space for the arrow head:\n  float direction = sign(radius);\n  float webGLNodeRadius = direction * radius * 2.0 * u_correctionRatio / u_sizeRatio;\n  float webGLArrowHeadLength = webGLThickness * u_lengthToThicknessRatio * 2.0;\n\n  vec2 compensationVector = vec2(-direction * unitNormal.y, direction * unitNormal.x) * (webGLNodeRadius + webGLArrowHeadLength);\n\n  // Here is the proper position of the vertex\n  gl_Position = vec4((u_matrix * vec3(position + unitNormal * webGLThickness + compensationVector, 1)).xy, 0, 1);\n\n  v_thickness = webGLThickness / u_zoomRatio;\n\n  v_normal = unitNormal;\n\n  v_feather = u_feather * u_correctionRatio / u_zoomRatio / u_pixelRatio * 2.0;\n\n  #ifdef PICKING_MODE\n  // For picking mode, we use the ID as the color:\n  v_color = a_id;\n  #else\n  // For normal mode, we use the color:\n  v_color = a_color;\n  #endif\n\n  v_color.a *= bias;\n}\n"
  );
  var VERTEX_SHADER_SOURCE$1 = SHADER_SOURCE$1;
  var _WebGLRenderingContex$1 = WebGLRenderingContext;
  var UNSIGNED_BYTE$1 = _WebGLRenderingContex$1.UNSIGNED_BYTE;
  var FLOAT$1 = _WebGLRenderingContex$1.FLOAT;
  var UNIFORMS$1 = ["u_matrix", "u_zoomRatio", "u_sizeRatio", "u_correctionRatio", "u_pixelRatio", "u_feather", "u_minEdgeThickness", "u_lengthToThicknessRatio"];
  var DEFAULT_EDGE_CLAMPED_PROGRAM_OPTIONS = {
    lengthToThicknessRatio: DEFAULT_EDGE_ARROW_HEAD_PROGRAM_OPTIONS.lengthToThicknessRatio
  };
  function createEdgeClampedProgram(inputOptions) {
    var options = _objectSpread2(_objectSpread2({}, DEFAULT_EDGE_CLAMPED_PROGRAM_OPTIONS), inputOptions || {});
    return /* @__PURE__ */ (function(_EdgeProgram) {
      function EdgeClampedProgram2() {
        _classCallCheck(this, EdgeClampedProgram2);
        return _callSuper(this, EdgeClampedProgram2, arguments);
      }
      _inherits(EdgeClampedProgram2, _EdgeProgram);
      return _createClass(EdgeClampedProgram2, [{
        key: "getDefinition",
        value: function getDefinition() {
          return {
            VERTICES: 6,
            VERTEX_SHADER_SOURCE: VERTEX_SHADER_SOURCE$1,
            FRAGMENT_SHADER_SOURCE,
            METHOD: WebGLRenderingContext.TRIANGLES,
            UNIFORMS: UNIFORMS$1,
            ATTRIBUTES: [{
              name: "a_positionStart",
              size: 2,
              type: FLOAT$1
            }, {
              name: "a_positionEnd",
              size: 2,
              type: FLOAT$1
            }, {
              name: "a_normal",
              size: 2,
              type: FLOAT$1
            }, {
              name: "a_color",
              size: 4,
              type: UNSIGNED_BYTE$1,
              normalized: true
            }, {
              name: "a_id",
              size: 4,
              type: UNSIGNED_BYTE$1,
              normalized: true
            }, {
              name: "a_radius",
              size: 1,
              type: FLOAT$1
            }],
            CONSTANT_ATTRIBUTES: [
              // If 0, then position will be a_positionStart
              // If 1, then position will be a_positionEnd
              {
                name: "a_positionCoef",
                size: 1,
                type: FLOAT$1
              },
              {
                name: "a_normalCoef",
                size: 1,
                type: FLOAT$1
              },
              {
                name: "a_radiusCoef",
                size: 1,
                type: FLOAT$1
              }
            ],
            CONSTANT_DATA: [[0, 1, 0], [0, -1, 0], [1, 1, 1], [1, 1, 1], [0, -1, 0], [1, -1, -1]]
          };
        }
      }, {
        key: "processVisibleItem",
        value: function processVisibleItem(edgeIndex, startIndex, sourceData, targetData, data) {
          var thickness = data.size || 1;
          var x1 = sourceData.x;
          var y1 = sourceData.y;
          var x2 = targetData.x;
          var y2 = targetData.y;
          var color = floatColor(data.color);
          var dx = x2 - x1;
          var dy = y2 - y1;
          var radius = targetData.size || 1;
          var len = dx * dx + dy * dy;
          var n1 = 0;
          var n2 = 0;
          if (len) {
            len = 1 / Math.sqrt(len);
            n1 = -dy * len * thickness;
            n2 = dx * len * thickness;
          }
          var array = this.array;
          array[startIndex++] = x1;
          array[startIndex++] = y1;
          array[startIndex++] = x2;
          array[startIndex++] = y2;
          array[startIndex++] = n1;
          array[startIndex++] = n2;
          array[startIndex++] = color;
          array[startIndex++] = edgeIndex;
          array[startIndex++] = radius;
        }
      }, {
        key: "setUniforms",
        value: function setUniforms(params, _ref) {
          var gl = _ref.gl, uniformLocations = _ref.uniformLocations;
          var u_matrix = uniformLocations.u_matrix, u_zoomRatio = uniformLocations.u_zoomRatio, u_feather = uniformLocations.u_feather, u_pixelRatio = uniformLocations.u_pixelRatio, u_correctionRatio = uniformLocations.u_correctionRatio, u_sizeRatio = uniformLocations.u_sizeRatio, u_minEdgeThickness = uniformLocations.u_minEdgeThickness, u_lengthToThicknessRatio = uniformLocations.u_lengthToThicknessRatio;
          gl.uniformMatrix3fv(u_matrix, false, params.matrix);
          gl.uniform1f(u_zoomRatio, params.zoomRatio);
          gl.uniform1f(u_sizeRatio, params.sizeRatio);
          gl.uniform1f(u_correctionRatio, params.correctionRatio);
          gl.uniform1f(u_pixelRatio, params.pixelRatio);
          gl.uniform1f(u_feather, params.antiAliasingFeather);
          gl.uniform1f(u_minEdgeThickness, params.minEdgeThickness);
          gl.uniform1f(u_lengthToThicknessRatio, options.lengthToThicknessRatio);
        }
      }]);
    })(EdgeProgram);
  }
  var EdgeClampedProgram = createEdgeClampedProgram();
  function createEdgeArrowProgram(inputOptions) {
    return createEdgeCompoundProgram([createEdgeClampedProgram(inputOptions), createEdgeArrowHeadProgram(inputOptions)]);
  }
  var EdgeArrowProgram = createEdgeArrowProgram();
  var EdgeArrowProgram$1 = EdgeArrowProgram;
  var SHADER_SOURCE = (
    /*glsl*/
    `
attribute vec4 a_id;
attribute vec4 a_color;
attribute vec2 a_normal;
attribute float a_normalCoef;
attribute vec2 a_positionStart;
attribute vec2 a_positionEnd;
attribute float a_positionCoef;

uniform mat3 u_matrix;
uniform float u_sizeRatio;
uniform float u_zoomRatio;
uniform float u_pixelRatio;
uniform float u_correctionRatio;
uniform float u_minEdgeThickness;
uniform float u_feather;

varying vec4 v_color;
varying vec2 v_normal;
varying float v_thickness;
varying float v_feather;

const float bias = 255.0 / 254.0;

void main() {
  float minThickness = u_minEdgeThickness;

  vec2 normal = a_normal * a_normalCoef;
  vec2 position = a_positionStart * (1.0 - a_positionCoef) + a_positionEnd * a_positionCoef;

  float normalLength = length(normal);
  vec2 unitNormal = normal / normalLength;

  // We require edges to be at least "minThickness" pixels thick *on screen*
  // (so we need to compensate the size ratio):
  float pixelsThickness = max(normalLength, minThickness * u_sizeRatio);

  // Then, we need to retrieve the normalized thickness of the edge in the WebGL
  // referential (in a ([0, 1], [0, 1]) space), using our "magic" correction
  // ratio:
  float webGLThickness = pixelsThickness * u_correctionRatio / u_sizeRatio;

  // Here is the proper position of the vertex
  gl_Position = vec4((u_matrix * vec3(position + unitNormal * webGLThickness, 1)).xy, 0, 1);

  // For the fragment shader though, we need a thickness that takes the "magic"
  // correction ratio into account (as in webGLThickness), but so that the
  // antialiasing effect does not depend on the zoom level. So here's yet
  // another thickness version:
  v_thickness = webGLThickness / u_zoomRatio;

  v_normal = unitNormal;

  v_feather = u_feather * u_correctionRatio / u_zoomRatio / u_pixelRatio * 2.0;

  #ifdef PICKING_MODE
  // For picking mode, we use the ID as the color:
  v_color = a_id;
  #else
  // For normal mode, we use the color:
  v_color = a_color;
  #endif

  v_color.a *= bias;
}
`
  );
  var VERTEX_SHADER_SOURCE = SHADER_SOURCE;
  var _WebGLRenderingContex = WebGLRenderingContext;
  var UNSIGNED_BYTE = _WebGLRenderingContex.UNSIGNED_BYTE;
  var FLOAT = _WebGLRenderingContex.FLOAT;
  var UNIFORMS = ["u_matrix", "u_zoomRatio", "u_sizeRatio", "u_correctionRatio", "u_pixelRatio", "u_feather", "u_minEdgeThickness"];
  var EdgeRectangleProgram = /* @__PURE__ */ (function(_EdgeProgram) {
    function EdgeRectangleProgram2() {
      _classCallCheck(this, EdgeRectangleProgram2);
      return _callSuper(this, EdgeRectangleProgram2, arguments);
    }
    _inherits(EdgeRectangleProgram2, _EdgeProgram);
    return _createClass(EdgeRectangleProgram2, [{
      key: "getDefinition",
      value: function getDefinition() {
        return {
          VERTICES: 6,
          VERTEX_SHADER_SOURCE,
          FRAGMENT_SHADER_SOURCE,
          METHOD: WebGLRenderingContext.TRIANGLES,
          UNIFORMS,
          ATTRIBUTES: [{
            name: "a_positionStart",
            size: 2,
            type: FLOAT
          }, {
            name: "a_positionEnd",
            size: 2,
            type: FLOAT
          }, {
            name: "a_normal",
            size: 2,
            type: FLOAT
          }, {
            name: "a_color",
            size: 4,
            type: UNSIGNED_BYTE,
            normalized: true
          }, {
            name: "a_id",
            size: 4,
            type: UNSIGNED_BYTE,
            normalized: true
          }],
          CONSTANT_ATTRIBUTES: [
            // If 0, then position will be a_positionStart
            // If 2, then position will be a_positionEnd
            {
              name: "a_positionCoef",
              size: 1,
              type: FLOAT
            },
            {
              name: "a_normalCoef",
              size: 1,
              type: FLOAT
            }
          ],
          CONSTANT_DATA: [[0, 1], [0, -1], [1, 1], [1, 1], [0, -1], [1, -1]]
        };
      }
    }, {
      key: "processVisibleItem",
      value: function processVisibleItem(edgeIndex, startIndex, sourceData, targetData, data) {
        var thickness = data.size || 1;
        var x1 = sourceData.x;
        var y1 = sourceData.y;
        var x2 = targetData.x;
        var y2 = targetData.y;
        var color = floatColor(data.color);
        var dx = x2 - x1;
        var dy = y2 - y1;
        var len = dx * dx + dy * dy;
        var n1 = 0;
        var n2 = 0;
        if (len) {
          len = 1 / Math.sqrt(len);
          n1 = -dy * len * thickness;
          n2 = dx * len * thickness;
        }
        var array = this.array;
        array[startIndex++] = x1;
        array[startIndex++] = y1;
        array[startIndex++] = x2;
        array[startIndex++] = y2;
        array[startIndex++] = n1;
        array[startIndex++] = n2;
        array[startIndex++] = color;
        array[startIndex++] = edgeIndex;
      }
    }, {
      key: "setUniforms",
      value: function setUniforms(params, _ref) {
        var gl = _ref.gl, uniformLocations = _ref.uniformLocations;
        var u_matrix = uniformLocations.u_matrix, u_zoomRatio = uniformLocations.u_zoomRatio, u_feather = uniformLocations.u_feather, u_pixelRatio = uniformLocations.u_pixelRatio, u_correctionRatio = uniformLocations.u_correctionRatio, u_sizeRatio = uniformLocations.u_sizeRatio, u_minEdgeThickness = uniformLocations.u_minEdgeThickness;
        gl.uniformMatrix3fv(u_matrix, false, params.matrix);
        gl.uniform1f(u_zoomRatio, params.zoomRatio);
        gl.uniform1f(u_sizeRatio, params.sizeRatio);
        gl.uniform1f(u_correctionRatio, params.correctionRatio);
        gl.uniform1f(u_pixelRatio, params.pixelRatio);
        gl.uniform1f(u_feather, params.antiAliasingFeather);
        gl.uniform1f(u_minEdgeThickness, params.minEdgeThickness);
      }
    }]);
  })(EdgeProgram);

  // node_modules/sigma/types/dist/sigma-types.esm.js
  var import_events2 = __toESM(require_events());
  var TypedEventEmitter = /* @__PURE__ */ (function(_ref) {
    function TypedEventEmitter2() {
      var _this;
      _classCallCheck(this, TypedEventEmitter2);
      _this = _callSuper(this, TypedEventEmitter2);
      _this.rawEmitter = _this;
      return _this;
    }
    _inherits(TypedEventEmitter2, _ref);
    return _createClass(TypedEventEmitter2);
  })(import_events2.EventEmitter);

  // node_modules/sigma/dist/normalization-be445518.esm.js
  var import_is_graph = __toESM(require_is_graph());
  var linear = function linear2(k) {
    return k;
  };
  var quadraticIn = function quadraticIn2(k) {
    return k * k;
  };
  var quadraticOut = function quadraticOut2(k) {
    return k * (2 - k);
  };
  var quadraticInOut = function quadraticInOut2(k) {
    if ((k *= 2) < 1) return 0.5 * k * k;
    return -0.5 * (--k * (k - 2) - 1);
  };
  var cubicIn = function cubicIn2(k) {
    return k * k * k;
  };
  var cubicOut = function cubicOut2(k) {
    return --k * k * k + 1;
  };
  var cubicInOut = function cubicInOut2(k) {
    if ((k *= 2) < 1) return 0.5 * k * k * k;
    return 0.5 * ((k -= 2) * k * k + 2);
  };
  var easings = {
    linear,
    quadraticIn,
    quadraticOut,
    quadraticInOut,
    cubicIn,
    cubicOut,
    cubicInOut
  };
  var ANIMATE_DEFAULTS = {
    easing: "quadraticInOut",
    duration: 150
  };
  function identity() {
    return Float32Array.of(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }
  function scale(m, x, y2) {
    m[0] = x;
    m[4] = typeof y2 === "number" ? y2 : x;
    return m;
  }
  function rotate(m, r2) {
    var s2 = Math.sin(r2), c2 = Math.cos(r2);
    m[0] = c2;
    m[1] = s2;
    m[3] = -s2;
    m[4] = c2;
    return m;
  }
  function translate(m, x, y2) {
    m[6] = x;
    m[7] = y2;
    return m;
  }
  function multiply(a2, b2) {
    var a00 = a2[0], a01 = a2[1], a02 = a2[2];
    var a10 = a2[3], a11 = a2[4], a12 = a2[5];
    var a20 = a2[6], a21 = a2[7], a22 = a2[8];
    var b00 = b2[0], b01 = b2[1], b02 = b2[2];
    var b10 = b2[3], b11 = b2[4], b12 = b2[5];
    var b20 = b2[6], b21 = b2[7], b22 = b2[8];
    a2[0] = b00 * a00 + b01 * a10 + b02 * a20;
    a2[1] = b00 * a01 + b01 * a11 + b02 * a21;
    a2[2] = b00 * a02 + b01 * a12 + b02 * a22;
    a2[3] = b10 * a00 + b11 * a10 + b12 * a20;
    a2[4] = b10 * a01 + b11 * a11 + b12 * a21;
    a2[5] = b10 * a02 + b11 * a12 + b12 * a22;
    a2[6] = b20 * a00 + b21 * a10 + b22 * a20;
    a2[7] = b20 * a01 + b21 * a11 + b22 * a21;
    a2[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return a2;
  }
  function multiplyVec2(a2, b2) {
    var z = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 1;
    var a00 = a2[0];
    var a01 = a2[1];
    var a10 = a2[3];
    var a11 = a2[4];
    var a20 = a2[6];
    var a21 = a2[7];
    var b0 = b2.x;
    var b1 = b2.y;
    return {
      x: b0 * a00 + b1 * a10 + a20 * z,
      y: b0 * a01 + b1 * a11 + a21 * z
    };
  }
  function getCorrectionRatio(viewportDimensions, graphDimensions) {
    var viewportRatio = viewportDimensions.height / viewportDimensions.width;
    var graphRatio = graphDimensions.height / graphDimensions.width;
    if (viewportRatio < 1 && graphRatio > 1 || viewportRatio > 1 && graphRatio < 1) {
      return 1;
    }
    return Math.min(Math.max(graphRatio, 1 / graphRatio), Math.max(1 / viewportRatio, viewportRatio));
  }
  function matrixFromCamera(state, viewportDimensions, graphDimensions, padding, inverse) {
    var angle = state.angle, ratio = state.ratio, x = state.x, y2 = state.y;
    var width = viewportDimensions.width, height = viewportDimensions.height;
    var matrix = identity();
    var smallestDimension = Math.min(width, height) - 2 * padding;
    var correctionRatio = getCorrectionRatio(viewportDimensions, graphDimensions);
    if (!inverse) {
      multiply(matrix, scale(identity(), 2 * (smallestDimension / width) * correctionRatio, 2 * (smallestDimension / height) * correctionRatio));
      multiply(matrix, rotate(identity(), -angle));
      multiply(matrix, scale(identity(), 1 / ratio));
      multiply(matrix, translate(identity(), -x, -y2));
    } else {
      multiply(matrix, translate(identity(), x, y2));
      multiply(matrix, scale(identity(), ratio));
      multiply(matrix, rotate(identity(), angle));
      multiply(matrix, scale(identity(), width / smallestDimension / 2 / correctionRatio, height / smallestDimension / 2 / correctionRatio));
    }
    return matrix;
  }
  function getMatrixImpact(matrix, cameraState, viewportDimensions) {
    var _multiplyVec = multiplyVec2(matrix, {
      x: Math.cos(cameraState.angle),
      y: Math.sin(cameraState.angle)
    }, 0), x = _multiplyVec.x, y2 = _multiplyVec.y;
    return 1 / Math.sqrt(Math.pow(x, 2) + Math.pow(y2, 2)) / viewportDimensions.width;
  }
  function graphExtent(graph) {
    if (!graph.order) return {
      x: [0, 1],
      y: [0, 1]
    };
    var xMin = Infinity;
    var xMax = -Infinity;
    var yMin = Infinity;
    var yMax = -Infinity;
    graph.forEachNode(function(_2, attr) {
      var x = attr.x, y2 = attr.y;
      if (x < xMin) xMin = x;
      if (x > xMax) xMax = x;
      if (y2 < yMin) yMin = y2;
      if (y2 > yMax) yMax = y2;
    });
    return {
      x: [xMin, xMax],
      y: [yMin, yMax]
    };
  }
  function validateGraph(graph) {
    if (!(0, import_is_graph.default)(graph)) throw new Error("Sigma: invalid graph instance.");
    graph.forEachNode(function(key, attributes) {
      if (!Number.isFinite(attributes.x) || !Number.isFinite(attributes.y)) {
        throw new Error("Sigma: Coordinates of node ".concat(key, " are invalid. A node must have a numeric 'x' and 'y' attribute."));
      }
    });
  }
  function createElement(tag, style, attributes) {
    var element = document.createElement(tag);
    if (style) {
      for (var k in style) {
        element.style[k] = style[k];
      }
    }
    if (attributes) {
      for (var _k in attributes) {
        element.setAttribute(_k, attributes[_k]);
      }
    }
    return element;
  }
  function getPixelRatio() {
    if (typeof window.devicePixelRatio !== "undefined") return window.devicePixelRatio;
    return 1;
  }
  function zIndexOrdering(_extent, getter, elements) {
    return elements.sort(function(a2, b2) {
      var zA = getter(a2) || 0, zB = getter(b2) || 0;
      if (zA < zB) return -1;
      if (zA > zB) return 1;
      return 0;
    });
  }
  function createNormalizationFunction(extent) {
    var _extent$x = _slicedToArray(extent.x, 2), minX = _extent$x[0], maxX = _extent$x[1], _extent$y = _slicedToArray(extent.y, 2), minY = _extent$y[0], maxY = _extent$y[1];
    var ratio = Math.max(maxX - minX, maxY - minY), dX = (maxX + minX) / 2, dY = (maxY + minY) / 2;
    if (ratio === 0 || Math.abs(ratio) === Infinity || isNaN(ratio)) ratio = 1;
    if (isNaN(dX)) dX = 0;
    if (isNaN(dY)) dY = 0;
    var fn = function fn2(data) {
      return {
        x: 0.5 + (data.x - dX) / ratio,
        y: 0.5 + (data.y - dY) / ratio
      };
    };
    fn.applyTo = function(data) {
      data.x = 0.5 + (data.x - dX) / ratio;
      data.y = 0.5 + (data.y - dY) / ratio;
    };
    fn.inverse = function(data) {
      return {
        x: dX + ratio * (data.x - 0.5),
        y: dY + ratio * (data.y - 0.5)
      };
    };
    fn.ratio = ratio;
    return fn;
  }

  // node_modules/sigma/dist/data-11df7124.esm.js
  function _typeof(o2) {
    "@babel/helpers - typeof";
    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o3) {
      return typeof o3;
    } : function(o3) {
      return o3 && "function" == typeof Symbol && o3.constructor === Symbol && o3 !== Symbol.prototype ? "symbol" : typeof o3;
    }, _typeof(o2);
  }
  function extend(array, values) {
    var l2 = values.size;
    if (l2 === 0) return;
    var l1 = array.length;
    array.length += l2;
    var i2 = 0;
    values.forEach(function(value) {
      array[l1 + i2] = value;
      i2++;
    });
  }
  function assign2(target) {
    target = target || {};
    for (var i2 = 0, l2 = arguments.length <= 1 ? 0 : arguments.length - 1; i2 < l2; i2++) {
      var o2 = i2 + 1 < 1 || arguments.length <= i2 + 1 ? void 0 : arguments[i2 + 1];
      if (!o2) continue;
      Object.assign(target, o2);
    }
    return target;
  }

  // node_modules/sigma/settings/dist/sigma-settings.esm.js
  var DEFAULT_SETTINGS = {
    // Performance
    hideEdgesOnMove: false,
    hideLabelsOnMove: false,
    renderLabels: true,
    renderEdgeLabels: false,
    enableEdgeEvents: false,
    // Component rendering
    defaultNodeColor: "#999",
    defaultNodeType: "circle",
    defaultEdgeColor: "#ccc",
    defaultEdgeType: "line",
    labelFont: "Arial",
    labelSize: 14,
    labelWeight: "normal",
    labelColor: {
      color: "#000"
    },
    edgeLabelFont: "Arial",
    edgeLabelSize: 14,
    edgeLabelWeight: "normal",
    edgeLabelColor: {
      attribute: "color"
    },
    stagePadding: 30,
    defaultDrawEdgeLabel: drawStraightEdgeLabel,
    defaultDrawNodeLabel: drawDiscNodeLabel,
    defaultDrawNodeHover: drawDiscNodeHover,
    minEdgeThickness: 1.7,
    antiAliasingFeather: 1,
    // Mouse and touch settings
    dragTimeout: 100,
    draggedEventsTolerance: 3,
    inertiaDuration: 200,
    inertiaRatio: 3,
    zoomDuration: 250,
    zoomingRatio: 1.7,
    doubleClickTimeout: 300,
    doubleClickZoomingRatio: 2.2,
    doubleClickZoomingDuration: 200,
    tapMoveTolerance: 10,
    // Size and scaling
    zoomToSizeRatioFunction: Math.sqrt,
    itemSizesReference: "screen",
    autoRescale: true,
    autoCenter: true,
    // Labels
    labelDensity: 1,
    labelGridCellSize: 100,
    labelRenderedSizeThreshold: 6,
    // Reducers
    nodeReducer: null,
    edgeReducer: null,
    // Features
    zIndex: false,
    minCameraRatio: null,
    maxCameraRatio: null,
    enableCameraZooming: true,
    enableCameraPanning: true,
    enableCameraRotation: true,
    cameraPanBoundaries: null,
    // Lifecycle
    allowInvalidContainer: false,
    // Program classes
    nodeProgramClasses: {},
    nodeHoverProgramClasses: {},
    edgeProgramClasses: {}
  };
  var DEFAULT_NODE_PROGRAM_CLASSES = {
    circle: NodeCircleProgram
  };
  var DEFAULT_EDGE_PROGRAM_CLASSES = {
    arrow: EdgeArrowProgram$1,
    line: EdgeRectangleProgram
  };
  function validateSettings(settings) {
    if (typeof settings.labelDensity !== "number" || settings.labelDensity < 0) {
      throw new Error("Settings: invalid `labelDensity`. Expecting a positive number.");
    }
    var minCameraRatio = settings.minCameraRatio, maxCameraRatio = settings.maxCameraRatio;
    if (typeof minCameraRatio === "number" && typeof maxCameraRatio === "number" && maxCameraRatio < minCameraRatio) {
      throw new Error("Settings: invalid camera ratio boundaries. Expecting `maxCameraRatio` to be greater than `minCameraRatio`.");
    }
  }
  function resolveSettings(settings) {
    var resolvedSettings = assign2({}, DEFAULT_SETTINGS, settings);
    resolvedSettings.nodeProgramClasses = assign2({}, DEFAULT_NODE_PROGRAM_CLASSES, resolvedSettings.nodeProgramClasses);
    resolvedSettings.edgeProgramClasses = assign2({}, DEFAULT_EDGE_PROGRAM_CLASSES, resolvedSettings.edgeProgramClasses);
    return resolvedSettings;
  }

  // node_modules/sigma/dist/sigma.esm.js
  var import_events3 = __toESM(require_events());
  var import_is_graph2 = __toESM(require_is_graph());
  var DEFAULT_ZOOMING_RATIO = 1.5;
  var Camera = /* @__PURE__ */ (function(_TypedEventEmitter) {
    function Camera2() {
      var _this;
      _classCallCheck(this, Camera2);
      _this = _callSuper(this, Camera2);
      _defineProperty(_this, "x", 0.5);
      _defineProperty(_this, "y", 0.5);
      _defineProperty(_this, "angle", 0);
      _defineProperty(_this, "ratio", 1);
      _defineProperty(_this, "minRatio", null);
      _defineProperty(_this, "maxRatio", null);
      _defineProperty(_this, "enabledZooming", true);
      _defineProperty(_this, "enabledPanning", true);
      _defineProperty(_this, "enabledRotation", true);
      _defineProperty(_this, "clean", null);
      _defineProperty(_this, "nextFrame", null);
      _defineProperty(_this, "previousState", null);
      _defineProperty(_this, "enabled", true);
      _this.previousState = _this.getState();
      return _this;
    }
    _inherits(Camera2, _TypedEventEmitter);
    return _createClass(Camera2, [{
      key: "enable",
      value: (
        /**
         * Method used to enable the camera.
         */
        function enable() {
          this.enabled = true;
          return this;
        }
      )
      /**
       * Method used to disable the camera.
       */
    }, {
      key: "disable",
      value: function disable() {
        this.enabled = false;
        return this;
      }
      /**
       * Method used to retrieve the camera's current state.
       */
    }, {
      key: "getState",
      value: function getState() {
        return {
          x: this.x,
          y: this.y,
          angle: this.angle,
          ratio: this.ratio
        };
      }
      /**
       * Method used to check whether the camera has the given state.
       */
    }, {
      key: "hasState",
      value: function hasState(state) {
        return this.x === state.x && this.y === state.y && this.ratio === state.ratio && this.angle === state.angle;
      }
      /**
       * Method used to retrieve the camera's previous state.
       */
    }, {
      key: "getPreviousState",
      value: function getPreviousState() {
        var state = this.previousState;
        if (!state) return null;
        return {
          x: state.x,
          y: state.y,
          angle: state.angle,
          ratio: state.ratio
        };
      }
      /**
       * Method used to check minRatio and maxRatio values.
       */
    }, {
      key: "getBoundedRatio",
      value: function getBoundedRatio(ratio) {
        var r2 = ratio;
        if (typeof this.minRatio === "number") r2 = Math.max(r2, this.minRatio);
        if (typeof this.maxRatio === "number") r2 = Math.min(r2, this.maxRatio);
        return r2;
      }
      /**
       * Method used to check various things to return a legit state candidate.
       */
    }, {
      key: "validateState",
      value: function validateState(state) {
        var validatedState = {};
        if (this.enabledPanning && typeof state.x === "number") validatedState.x = state.x;
        if (this.enabledPanning && typeof state.y === "number") validatedState.y = state.y;
        if (this.enabledZooming && typeof state.ratio === "number") validatedState.ratio = this.getBoundedRatio(state.ratio);
        if (this.enabledRotation && typeof state.angle === "number") validatedState.angle = state.angle;
        return this.clean ? this.clean(_objectSpread2(_objectSpread2({}, this.getState()), validatedState)) : validatedState;
      }
      /**
       * Method used to check whether the camera is currently being animated.
       */
    }, {
      key: "isAnimated",
      value: function isAnimated() {
        return !!this.nextFrame;
      }
      /**
       * Method used to set the camera's state.
       */
    }, {
      key: "setState",
      value: function setState(state) {
        if (!this.enabled) return this;
        this.previousState = this.getState();
        var validState = this.validateState(state);
        if (typeof validState.x === "number") this.x = validState.x;
        if (typeof validState.y === "number") this.y = validState.y;
        if (typeof validState.ratio === "number") this.ratio = validState.ratio;
        if (typeof validState.angle === "number") this.angle = validState.angle;
        if (!this.hasState(this.previousState)) this.emit("updated", this.getState());
        return this;
      }
      /**
       * Method used to update the camera's state using a function.
       */
    }, {
      key: "updateState",
      value: function updateState(updater) {
        this.setState(updater(this.getState()));
        return this;
      }
      /**
       * Method used to animate the camera.
       */
    }, {
      key: "animate",
      value: function animate(state) {
        var _this2 = this;
        var opts = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var callback = arguments.length > 2 ? arguments[2] : void 0;
        if (!callback) return new Promise(function(resolve) {
          return _this2.animate(state, opts, resolve);
        });
        if (!this.enabled) return;
        var options = _objectSpread2(_objectSpread2({}, ANIMATE_DEFAULTS), opts);
        var validState = this.validateState(state);
        var easing = typeof options.easing === "function" ? options.easing : easings[options.easing];
        var start = Date.now(), initialState = this.getState();
        var _fn = function fn() {
          var t2 = (Date.now() - start) / options.duration;
          if (t2 >= 1) {
            _this2.nextFrame = null;
            _this2.setState(validState);
            if (_this2.animationCallback) {
              _this2.animationCallback.call(null);
              _this2.animationCallback = void 0;
            }
            return;
          }
          var coefficient = easing(t2);
          var newState = {};
          if (typeof validState.x === "number") newState.x = initialState.x + (validState.x - initialState.x) * coefficient;
          if (typeof validState.y === "number") newState.y = initialState.y + (validState.y - initialState.y) * coefficient;
          if (_this2.enabledRotation && typeof validState.angle === "number") newState.angle = initialState.angle + (validState.angle - initialState.angle) * coefficient;
          if (typeof validState.ratio === "number") newState.ratio = initialState.ratio + (validState.ratio - initialState.ratio) * coefficient;
          _this2.setState(newState);
          _this2.nextFrame = requestAnimationFrame(_fn);
        };
        if (this.nextFrame) {
          cancelAnimationFrame(this.nextFrame);
          if (this.animationCallback) this.animationCallback.call(null);
          this.nextFrame = requestAnimationFrame(_fn);
        } else {
          _fn();
        }
        this.animationCallback = callback;
      }
      /**
       * Method used to zoom the camera.
       */
    }, {
      key: "animatedZoom",
      value: function animatedZoom(factorOrOptions) {
        if (!factorOrOptions) return this.animate({
          ratio: this.ratio / DEFAULT_ZOOMING_RATIO
        });
        if (typeof factorOrOptions === "number") return this.animate({
          ratio: this.ratio / factorOrOptions
        });
        return this.animate({
          ratio: this.ratio / (factorOrOptions.factor || DEFAULT_ZOOMING_RATIO)
        }, factorOrOptions);
      }
      /**
       * Method used to unzoom the camera.
       */
    }, {
      key: "animatedUnzoom",
      value: function animatedUnzoom(factorOrOptions) {
        if (!factorOrOptions) return this.animate({
          ratio: this.ratio * DEFAULT_ZOOMING_RATIO
        });
        if (typeof factorOrOptions === "number") return this.animate({
          ratio: this.ratio * factorOrOptions
        });
        return this.animate({
          ratio: this.ratio * (factorOrOptions.factor || DEFAULT_ZOOMING_RATIO)
        }, factorOrOptions);
      }
      /**
       * Method used to reset the camera.
       */
    }, {
      key: "animatedReset",
      value: function animatedReset(options) {
        return this.animate({
          x: 0.5,
          y: 0.5,
          ratio: 1,
          angle: 0
        }, options);
      }
      /**
       * Returns a new Camera instance, with the same state as the current camera.
       */
    }, {
      key: "copy",
      value: function copy() {
        return Camera2.from(this.getState());
      }
    }], [{
      key: "from",
      value: function from(state) {
        var camera = new Camera2();
        return camera.setState(state);
      }
    }]);
  })(TypedEventEmitter);
  function getPosition(e2, dom) {
    var bbox = dom.getBoundingClientRect();
    return {
      x: e2.clientX - bbox.left,
      y: e2.clientY - bbox.top
    };
  }
  function getMouseCoords(e2, dom) {
    var res = _objectSpread2(_objectSpread2({}, getPosition(e2, dom)), {}, {
      sigmaDefaultPrevented: false,
      preventSigmaDefault: function preventSigmaDefault() {
        res.sigmaDefaultPrevented = true;
      },
      original: e2
    });
    return res;
  }
  function cleanMouseCoords(e2) {
    var res = "x" in e2 ? e2 : _objectSpread2(_objectSpread2({}, e2.touches[0] || e2.previousTouches[0]), {}, {
      original: e2.original,
      sigmaDefaultPrevented: e2.sigmaDefaultPrevented,
      preventSigmaDefault: function preventSigmaDefault() {
        e2.sigmaDefaultPrevented = true;
        res.sigmaDefaultPrevented = true;
      }
    });
    return res;
  }
  function getWheelCoords(e2, dom) {
    return _objectSpread2(_objectSpread2({}, getMouseCoords(e2, dom)), {}, {
      delta: getWheelDelta(e2)
    });
  }
  var MAX_TOUCHES = 2;
  function getTouchesArray(touches) {
    var arr = [];
    for (var i2 = 0, l2 = Math.min(touches.length, MAX_TOUCHES); i2 < l2; i2++) arr.push(touches[i2]);
    return arr;
  }
  function getTouchCoords(e2, previousTouches, dom) {
    var res = {
      touches: getTouchesArray(e2.touches).map(function(touch) {
        return getPosition(touch, dom);
      }),
      previousTouches: previousTouches.map(function(touch) {
        return getPosition(touch, dom);
      }),
      sigmaDefaultPrevented: false,
      preventSigmaDefault: function preventSigmaDefault() {
        res.sigmaDefaultPrevented = true;
      },
      original: e2
    };
    return res;
  }
  function getWheelDelta(e2) {
    if (typeof e2.deltaY !== "undefined") return e2.deltaY * -3 / 360;
    if (typeof e2.detail !== "undefined") return e2.detail / -9;
    throw new Error("Captor: could not extract delta from event.");
  }
  var Captor = /* @__PURE__ */ (function(_TypedEventEmitter) {
    function Captor2(container, renderer) {
      var _this;
      _classCallCheck(this, Captor2);
      _this = _callSuper(this, Captor2);
      _this.container = container;
      _this.renderer = renderer;
      return _this;
    }
    _inherits(Captor2, _TypedEventEmitter);
    return _createClass(Captor2);
  })(TypedEventEmitter);
  var MOUSE_SETTINGS_KEYS = ["doubleClickTimeout", "doubleClickZoomingDuration", "doubleClickZoomingRatio", "dragTimeout", "draggedEventsTolerance", "inertiaDuration", "inertiaRatio", "zoomDuration", "zoomingRatio"];
  var DEFAULT_MOUSE_SETTINGS = MOUSE_SETTINGS_KEYS.reduce(function(iter, key) {
    return _objectSpread2(_objectSpread2({}, iter), {}, _defineProperty({}, key, DEFAULT_SETTINGS[key]));
  }, {});
  var MouseCaptor = /* @__PURE__ */ (function(_Captor) {
    function MouseCaptor2(container, renderer) {
      var _this;
      _classCallCheck(this, MouseCaptor2);
      _this = _callSuper(this, MouseCaptor2, [container, renderer]);
      _defineProperty(_this, "enabled", true);
      _defineProperty(_this, "draggedEvents", 0);
      _defineProperty(_this, "downStartTime", null);
      _defineProperty(_this, "lastMouseX", null);
      _defineProperty(_this, "lastMouseY", null);
      _defineProperty(_this, "isMouseDown", false);
      _defineProperty(_this, "isMoving", false);
      _defineProperty(_this, "movingTimeout", null);
      _defineProperty(_this, "startCameraState", null);
      _defineProperty(_this, "clicks", 0);
      _defineProperty(_this, "doubleClickTimeout", null);
      _defineProperty(_this, "currentWheelDirection", 0);
      _defineProperty(_this, "settings", DEFAULT_MOUSE_SETTINGS);
      _this.handleClick = _this.handleClick.bind(_this);
      _this.handleRightClick = _this.handleRightClick.bind(_this);
      _this.handleDown = _this.handleDown.bind(_this);
      _this.handleUp = _this.handleUp.bind(_this);
      _this.handleMove = _this.handleMove.bind(_this);
      _this.handleWheel = _this.handleWheel.bind(_this);
      _this.handleLeave = _this.handleLeave.bind(_this);
      _this.handleEnter = _this.handleEnter.bind(_this);
      container.addEventListener("click", _this.handleClick, {
        capture: false
      });
      container.addEventListener("contextmenu", _this.handleRightClick, {
        capture: false
      });
      container.addEventListener("mousedown", _this.handleDown, {
        capture: false
      });
      container.addEventListener("wheel", _this.handleWheel, {
        capture: false
      });
      container.addEventListener("mouseleave", _this.handleLeave, {
        capture: false
      });
      container.addEventListener("mouseenter", _this.handleEnter, {
        capture: false
      });
      document.addEventListener("mousemove", _this.handleMove, {
        capture: false
      });
      document.addEventListener("mouseup", _this.handleUp, {
        capture: false
      });
      return _this;
    }
    _inherits(MouseCaptor2, _Captor);
    return _createClass(MouseCaptor2, [{
      key: "kill",
      value: function kill() {
        var container = this.container;
        container.removeEventListener("click", this.handleClick);
        container.removeEventListener("contextmenu", this.handleRightClick);
        container.removeEventListener("mousedown", this.handleDown);
        container.removeEventListener("wheel", this.handleWheel);
        container.removeEventListener("mouseleave", this.handleLeave);
        container.removeEventListener("mouseenter", this.handleEnter);
        document.removeEventListener("mousemove", this.handleMove);
        document.removeEventListener("mouseup", this.handleUp);
      }
    }, {
      key: "handleClick",
      value: function handleClick(e2) {
        var _this2 = this;
        if (!this.enabled) return;
        this.clicks++;
        if (this.clicks === 2) {
          this.clicks = 0;
          if (typeof this.doubleClickTimeout === "number") {
            clearTimeout(this.doubleClickTimeout);
            this.doubleClickTimeout = null;
          }
          return this.handleDoubleClick(e2);
        }
        setTimeout(function() {
          _this2.clicks = 0;
          _this2.doubleClickTimeout = null;
        }, this.settings.doubleClickTimeout);
        if (this.draggedEvents < this.settings.draggedEventsTolerance) this.emit("click", getMouseCoords(e2, this.container));
      }
    }, {
      key: "handleRightClick",
      value: function handleRightClick(e2) {
        if (!this.enabled) return;
        this.emit("rightClick", getMouseCoords(e2, this.container));
      }
    }, {
      key: "handleDoubleClick",
      value: function handleDoubleClick(e2) {
        if (!this.enabled) return;
        e2.preventDefault();
        e2.stopPropagation();
        var mouseCoords = getMouseCoords(e2, this.container);
        this.emit("doubleClick", mouseCoords);
        if (mouseCoords.sigmaDefaultPrevented) return;
        var camera = this.renderer.getCamera();
        var newRatio = camera.getBoundedRatio(camera.getState().ratio / this.settings.doubleClickZoomingRatio);
        camera.animate(this.renderer.getViewportZoomedState(getPosition(e2, this.container), newRatio), {
          easing: "quadraticInOut",
          duration: this.settings.doubleClickZoomingDuration
        });
      }
    }, {
      key: "handleDown",
      value: function handleDown(e2) {
        if (!this.enabled) return;
        if (e2.button === 0) {
          this.startCameraState = this.renderer.getCamera().getState();
          var _getPosition = getPosition(e2, this.container), x = _getPosition.x, y2 = _getPosition.y;
          this.lastMouseX = x;
          this.lastMouseY = y2;
          this.draggedEvents = 0;
          this.downStartTime = Date.now();
          this.isMouseDown = true;
        }
        this.emit("mousedown", getMouseCoords(e2, this.container));
      }
    }, {
      key: "handleUp",
      value: function handleUp(e2) {
        var _this3 = this;
        if (!this.enabled || !this.isMouseDown) return;
        var camera = this.renderer.getCamera();
        this.isMouseDown = false;
        if (typeof this.movingTimeout === "number") {
          clearTimeout(this.movingTimeout);
          this.movingTimeout = null;
        }
        var _getPosition2 = getPosition(e2, this.container), x = _getPosition2.x, y2 = _getPosition2.y;
        var cameraState = camera.getState(), previousCameraState = camera.getPreviousState() || {
          x: 0,
          y: 0
        };
        if (this.isMoving) {
          camera.animate({
            x: cameraState.x + this.settings.inertiaRatio * (cameraState.x - previousCameraState.x),
            y: cameraState.y + this.settings.inertiaRatio * (cameraState.y - previousCameraState.y)
          }, {
            duration: this.settings.inertiaDuration,
            easing: "quadraticOut"
          });
        } else if (this.lastMouseX !== x || this.lastMouseY !== y2) {
          camera.setState({
            x: cameraState.x,
            y: cameraState.y
          });
        }
        this.isMoving = false;
        setTimeout(function() {
          var shouldRefresh = _this3.draggedEvents > 0;
          _this3.draggedEvents = 0;
          if (shouldRefresh && _this3.renderer.getSetting("hideEdgesOnMove")) _this3.renderer.refresh();
        }, 0);
        this.emit("mouseup", getMouseCoords(e2, this.container));
      }
    }, {
      key: "handleMove",
      value: function handleMove(e2) {
        var _this4 = this;
        if (!this.enabled) return;
        var mouseCoords = getMouseCoords(e2, this.container);
        this.emit("mousemovebody", mouseCoords);
        if (e2.target === this.container || e2.composedPath()[0] === this.container) {
          this.emit("mousemove", mouseCoords);
        }
        if (mouseCoords.sigmaDefaultPrevented) return;
        if (this.isMouseDown) {
          this.isMoving = true;
          this.draggedEvents++;
          if (typeof this.movingTimeout === "number") {
            clearTimeout(this.movingTimeout);
          }
          this.movingTimeout = window.setTimeout(function() {
            _this4.movingTimeout = null;
            _this4.isMoving = false;
          }, this.settings.dragTimeout);
          var camera = this.renderer.getCamera();
          var _getPosition3 = getPosition(e2, this.container), eX = _getPosition3.x, eY = _getPosition3.y;
          var lastMouse = this.renderer.viewportToFramedGraph({
            x: this.lastMouseX,
            y: this.lastMouseY
          });
          var mouse = this.renderer.viewportToFramedGraph({
            x: eX,
            y: eY
          });
          var offsetX = lastMouse.x - mouse.x, offsetY = lastMouse.y - mouse.y;
          var cameraState = camera.getState();
          var x = cameraState.x + offsetX, y2 = cameraState.y + offsetY;
          camera.setState({
            x,
            y: y2
          });
          this.lastMouseX = eX;
          this.lastMouseY = eY;
          e2.preventDefault();
          e2.stopPropagation();
        }
      }
    }, {
      key: "handleLeave",
      value: function handleLeave(e2) {
        this.emit("mouseleave", getMouseCoords(e2, this.container));
      }
    }, {
      key: "handleEnter",
      value: function handleEnter(e2) {
        this.emit("mouseenter", getMouseCoords(e2, this.container));
      }
    }, {
      key: "handleWheel",
      value: function handleWheel(e2) {
        var _this5 = this;
        var camera = this.renderer.getCamera();
        if (!this.enabled || !camera.enabledZooming) return;
        var delta = getWheelDelta(e2);
        if (!delta) return;
        var wheelCoords = getWheelCoords(e2, this.container);
        this.emit("wheel", wheelCoords);
        if (wheelCoords.sigmaDefaultPrevented) {
          e2.preventDefault();
          e2.stopPropagation();
          return;
        }
        var currentRatio = camera.getState().ratio;
        var ratioDiff = delta > 0 ? 1 / this.settings.zoomingRatio : this.settings.zoomingRatio;
        var newRatio = camera.getBoundedRatio(currentRatio * ratioDiff);
        var wheelDirection = delta > 0 ? 1 : -1;
        var now = Date.now();
        if (currentRatio === newRatio) return;
        e2.preventDefault();
        e2.stopPropagation();
        if (this.currentWheelDirection === wheelDirection && this.lastWheelTriggerTime && now - this.lastWheelTriggerTime < this.settings.zoomDuration / 5) {
          return;
        }
        camera.animate(this.renderer.getViewportZoomedState(getPosition(e2, this.container), newRatio), {
          easing: "quadraticOut",
          duration: this.settings.zoomDuration
        }, function() {
          _this5.currentWheelDirection = 0;
        });
        this.currentWheelDirection = wheelDirection;
        this.lastWheelTriggerTime = now;
      }
    }, {
      key: "setSettings",
      value: function setSettings(settings) {
        this.settings = settings;
      }
    }]);
  })(Captor);
  var TOUCH_SETTINGS_KEYS = ["dragTimeout", "inertiaDuration", "inertiaRatio", "doubleClickTimeout", "doubleClickZoomingRatio", "doubleClickZoomingDuration", "tapMoveTolerance"];
  var DEFAULT_TOUCH_SETTINGS = TOUCH_SETTINGS_KEYS.reduce(function(iter, key) {
    return _objectSpread2(_objectSpread2({}, iter), {}, _defineProperty({}, key, DEFAULT_SETTINGS[key]));
  }, {});
  var TouchCaptor = /* @__PURE__ */ (function(_Captor) {
    function TouchCaptor2(container, renderer) {
      var _this;
      _classCallCheck(this, TouchCaptor2);
      _this = _callSuper(this, TouchCaptor2, [container, renderer]);
      _defineProperty(_this, "enabled", true);
      _defineProperty(_this, "isMoving", false);
      _defineProperty(_this, "hasMoved", false);
      _defineProperty(_this, "touchMode", 0);
      _defineProperty(_this, "startTouchesPositions", []);
      _defineProperty(_this, "lastTouches", []);
      _defineProperty(_this, "lastTap", null);
      _defineProperty(_this, "settings", DEFAULT_TOUCH_SETTINGS);
      _this.handleStart = _this.handleStart.bind(_this);
      _this.handleLeave = _this.handleLeave.bind(_this);
      _this.handleMove = _this.handleMove.bind(_this);
      container.addEventListener("touchstart", _this.handleStart, {
        capture: false
      });
      container.addEventListener("touchcancel", _this.handleLeave, {
        capture: false
      });
      document.addEventListener("touchend", _this.handleLeave, {
        capture: false,
        passive: false
      });
      document.addEventListener("touchmove", _this.handleMove, {
        capture: false,
        passive: false
      });
      return _this;
    }
    _inherits(TouchCaptor2, _Captor);
    return _createClass(TouchCaptor2, [{
      key: "kill",
      value: function kill() {
        var container = this.container;
        container.removeEventListener("touchstart", this.handleStart);
        container.removeEventListener("touchcancel", this.handleLeave);
        document.removeEventListener("touchend", this.handleLeave);
        document.removeEventListener("touchmove", this.handleMove);
      }
    }, {
      key: "getDimensions",
      value: function getDimensions() {
        return {
          width: this.container.offsetWidth,
          height: this.container.offsetHeight
        };
      }
    }, {
      key: "handleStart",
      value: function handleStart(e2) {
        var _this2 = this;
        if (!this.enabled) return;
        e2.preventDefault();
        var touches = getTouchesArray(e2.touches);
        this.touchMode = touches.length;
        this.startCameraState = this.renderer.getCamera().getState();
        this.startTouchesPositions = touches.map(function(touch) {
          return getPosition(touch, _this2.container);
        });
        if (this.touchMode === 2) {
          var _this$startTouchesPos = _slicedToArray(this.startTouchesPositions, 2), _this$startTouchesPos2 = _this$startTouchesPos[0], x0 = _this$startTouchesPos2.x, y0 = _this$startTouchesPos2.y, _this$startTouchesPos3 = _this$startTouchesPos[1], x1 = _this$startTouchesPos3.x, y1 = _this$startTouchesPos3.y;
          this.startTouchesAngle = Math.atan2(y1 - y0, x1 - x0);
          this.startTouchesDistance = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        }
        this.emit("touchdown", getTouchCoords(e2, this.lastTouches, this.container));
        this.lastTouches = touches;
        this.lastTouchesPositions = this.startTouchesPositions;
      }
    }, {
      key: "handleLeave",
      value: function handleLeave(e2) {
        if (!this.enabled || !this.startTouchesPositions.length) return;
        if (e2.cancelable) e2.preventDefault();
        if (this.movingTimeout) {
          this.isMoving = false;
          clearTimeout(this.movingTimeout);
        }
        switch (this.touchMode) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          case 2:
            if (e2.touches.length === 1) {
              this.handleStart(e2);
              e2.preventDefault();
              break;
            }
          /* falls through */
          case 1:
            if (this.isMoving) {
              var camera = this.renderer.getCamera();
              var cameraState = camera.getState(), previousCameraState = camera.getPreviousState() || {
                x: 0,
                y: 0
              };
              camera.animate({
                x: cameraState.x + this.settings.inertiaRatio * (cameraState.x - previousCameraState.x),
                y: cameraState.y + this.settings.inertiaRatio * (cameraState.y - previousCameraState.y)
              }, {
                duration: this.settings.inertiaDuration,
                easing: "quadraticOut"
              });
            }
            this.hasMoved = false;
            this.isMoving = false;
            this.touchMode = 0;
            break;
        }
        this.emit("touchup", getTouchCoords(e2, this.lastTouches, this.container));
        if (!e2.touches.length) {
          var position = getPosition(this.lastTouches[0], this.container);
          var downPosition = this.startTouchesPositions[0];
          var dSquare = Math.pow(position.x - downPosition.x, 2) + Math.pow(position.y - downPosition.y, 2);
          if (!e2.touches.length && dSquare < Math.pow(this.settings.tapMoveTolerance, 2)) {
            if (this.lastTap && Date.now() - this.lastTap.time < this.settings.doubleClickTimeout) {
              var touchCoords = getTouchCoords(e2, this.lastTouches, this.container);
              this.emit("doubletap", touchCoords);
              this.lastTap = null;
              if (!touchCoords.sigmaDefaultPrevented) {
                var _camera = this.renderer.getCamera();
                var newRatio = _camera.getBoundedRatio(_camera.getState().ratio / this.settings.doubleClickZoomingRatio);
                _camera.animate(this.renderer.getViewportZoomedState(position, newRatio), {
                  easing: "quadraticInOut",
                  duration: this.settings.doubleClickZoomingDuration
                });
              }
            } else {
              var _touchCoords = getTouchCoords(e2, this.lastTouches, this.container);
              this.emit("tap", _touchCoords);
              this.lastTap = {
                time: Date.now(),
                position: _touchCoords.touches[0] || _touchCoords.previousTouches[0]
              };
            }
          }
        }
        this.lastTouches = getTouchesArray(e2.touches);
        this.startTouchesPositions = [];
      }
    }, {
      key: "handleMove",
      value: function handleMove(e2) {
        var _this3 = this;
        if (!this.enabled || !this.startTouchesPositions.length) return;
        e2.preventDefault();
        var touches = getTouchesArray(e2.touches);
        var touchesPositions = touches.map(function(touch) {
          return getPosition(touch, _this3.container);
        });
        var lastTouches = this.lastTouches;
        this.lastTouches = touches;
        this.lastTouchesPositions = touchesPositions;
        var touchCoords = getTouchCoords(e2, lastTouches, this.container);
        this.emit("touchmove", touchCoords);
        if (touchCoords.sigmaDefaultPrevented) return;
        this.hasMoved || (this.hasMoved = touchesPositions.some(function(position, idx) {
          var startPosition = _this3.startTouchesPositions[idx];
          return startPosition && (position.x !== startPosition.x || position.y !== startPosition.y);
        }));
        if (!this.hasMoved) {
          return;
        }
        this.isMoving = true;
        if (this.movingTimeout) clearTimeout(this.movingTimeout);
        this.movingTimeout = window.setTimeout(function() {
          _this3.isMoving = false;
        }, this.settings.dragTimeout);
        var camera = this.renderer.getCamera();
        var startCameraState = this.startCameraState;
        var padding = this.renderer.getSetting("stagePadding");
        switch (this.touchMode) {
          case 1: {
            var _this$renderer$viewpo = this.renderer.viewportToFramedGraph((this.startTouchesPositions || [])[0]), xStart = _this$renderer$viewpo.x, yStart = _this$renderer$viewpo.y;
            var _this$renderer$viewpo2 = this.renderer.viewportToFramedGraph(touchesPositions[0]), x = _this$renderer$viewpo2.x, y2 = _this$renderer$viewpo2.y;
            camera.setState({
              x: startCameraState.x + xStart - x,
              y: startCameraState.y + yStart - y2
            });
            break;
          }
          case 2: {
            var newCameraState = {
              x: 0.5,
              y: 0.5,
              angle: 0,
              ratio: 1
            };
            var _touchesPositions$ = touchesPositions[0], x0 = _touchesPositions$.x, y0 = _touchesPositions$.y;
            var _touchesPositions$2 = touchesPositions[1], x1 = _touchesPositions$2.x, y1 = _touchesPositions$2.y;
            var angleDiff = Math.atan2(y1 - y0, x1 - x0) - this.startTouchesAngle;
            var ratioDiff = Math.hypot(y1 - y0, x1 - x0) / this.startTouchesDistance;
            var newRatio = camera.getBoundedRatio(startCameraState.ratio / ratioDiff);
            newCameraState.ratio = newRatio;
            newCameraState.angle = startCameraState.angle + angleDiff;
            var dimensions = this.getDimensions();
            var touchGraphPosition = this.renderer.viewportToFramedGraph((this.startTouchesPositions || [])[0], {
              cameraState: startCameraState
            });
            var smallestDimension = Math.min(dimensions.width, dimensions.height) - 2 * padding;
            var dx = smallestDimension / dimensions.width;
            var dy = smallestDimension / dimensions.height;
            var ratio = newRatio / smallestDimension;
            var _x = x0 - smallestDimension / 2 / dx;
            var _y = y0 - smallestDimension / 2 / dy;
            var _ref = [_x * Math.cos(-newCameraState.angle) - _y * Math.sin(-newCameraState.angle), _y * Math.cos(-newCameraState.angle) + _x * Math.sin(-newCameraState.angle)];
            _x = _ref[0];
            _y = _ref[1];
            newCameraState.x = touchGraphPosition.x - _x * ratio;
            newCameraState.y = touchGraphPosition.y + _y * ratio;
            camera.setState(newCameraState);
            break;
          }
        }
      }
    }, {
      key: "setSettings",
      value: function setSettings(settings) {
        this.settings = settings;
      }
    }]);
  })(Captor);
  function _arrayWithoutHoles(r2) {
    if (Array.isArray(r2)) return _arrayLikeToArray(r2);
  }
  function _iterableToArray(r2) {
    if ("undefined" != typeof Symbol && null != r2[Symbol.iterator] || null != r2["@@iterator"]) return Array.from(r2);
  }
  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _toConsumableArray(r2) {
    return _arrayWithoutHoles(r2) || _iterableToArray(r2) || _unsupportedIterableToArray(r2) || _nonIterableSpread();
  }
  function _objectWithoutPropertiesLoose(r2, e2) {
    if (null == r2) return {};
    var t2 = {};
    for (var n2 in r2) if ({}.hasOwnProperty.call(r2, n2)) {
      if (-1 !== e2.indexOf(n2)) continue;
      t2[n2] = r2[n2];
    }
    return t2;
  }
  function _objectWithoutProperties(e2, t2) {
    if (null == e2) return {};
    var o2, r2, i2 = _objectWithoutPropertiesLoose(e2, t2);
    if (Object.getOwnPropertySymbols) {
      var n2 = Object.getOwnPropertySymbols(e2);
      for (r2 = 0; r2 < n2.length; r2++) o2 = n2[r2], -1 === t2.indexOf(o2) && {}.propertyIsEnumerable.call(e2, o2) && (i2[o2] = e2[o2]);
    }
    return i2;
  }
  var LabelCandidate = /* @__PURE__ */ (function() {
    function LabelCandidate2(key, size) {
      _classCallCheck(this, LabelCandidate2);
      this.key = key;
      this.size = size;
    }
    return _createClass(LabelCandidate2, null, [{
      key: "compare",
      value: function compare(first, second) {
        if (first.size > second.size) return -1;
        if (first.size < second.size) return 1;
        if (first.key > second.key) return 1;
        return -1;
      }
    }]);
  })();
  var LabelGrid = /* @__PURE__ */ (function() {
    function LabelGrid2() {
      _classCallCheck(this, LabelGrid2);
      _defineProperty(this, "width", 0);
      _defineProperty(this, "height", 0);
      _defineProperty(this, "cellSize", 0);
      _defineProperty(this, "columns", 0);
      _defineProperty(this, "rows", 0);
      _defineProperty(this, "cells", {});
    }
    return _createClass(LabelGrid2, [{
      key: "resizeAndClear",
      value: function resizeAndClear(dimensions, cellSize) {
        this.width = dimensions.width;
        this.height = dimensions.height;
        this.cellSize = cellSize;
        this.columns = Math.ceil(dimensions.width / cellSize);
        this.rows = Math.ceil(dimensions.height / cellSize);
        this.cells = {};
      }
    }, {
      key: "getIndex",
      value: function getIndex(pos) {
        var xIndex = Math.floor(pos.x / this.cellSize);
        var yIndex = Math.floor(pos.y / this.cellSize);
        return yIndex * this.columns + xIndex;
      }
    }, {
      key: "add",
      value: function add(key, size, pos) {
        var candidate = new LabelCandidate(key, size);
        var index = this.getIndex(pos);
        var cell = this.cells[index];
        if (!cell) {
          cell = [];
          this.cells[index] = cell;
        }
        cell.push(candidate);
      }
    }, {
      key: "organize",
      value: function organize() {
        for (var k in this.cells) {
          var cell = this.cells[k];
          cell.sort(LabelCandidate.compare);
        }
      }
    }, {
      key: "getLabelsToDisplay",
      value: function getLabelsToDisplay(ratio, density) {
        var cellArea = this.cellSize * this.cellSize;
        var scaledCellArea = cellArea / ratio / ratio;
        var scaledDensity = scaledCellArea * density / cellArea;
        var labelsToDisplayPerCell = Math.ceil(scaledDensity);
        var labels = [];
        for (var k in this.cells) {
          var cell = this.cells[k];
          for (var i2 = 0; i2 < Math.min(labelsToDisplayPerCell, cell.length); i2++) {
            labels.push(cell[i2].key);
          }
        }
        return labels;
      }
    }]);
  })();
  function edgeLabelsToDisplayFromNodes(params) {
    var graph = params.graph, hoveredNode = params.hoveredNode, highlightedNodes = params.highlightedNodes, displayedNodeLabels = params.displayedNodeLabels;
    var worthyEdges = [];
    graph.forEachEdge(function(edge, _2, source, target) {
      if (source === hoveredNode || target === hoveredNode || highlightedNodes.has(source) || highlightedNodes.has(target) || displayedNodeLabels.has(source) && displayedNodeLabels.has(target)) {
        worthyEdges.push(edge);
      }
    });
    return worthyEdges;
  }
  var X_LABEL_MARGIN = 150;
  var Y_LABEL_MARGIN = 50;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  function applyNodeDefaults(settings, key, data) {
    if (!hasOwnProperty.call(data, "x") || !hasOwnProperty.call(data, "y")) throw new Error('Sigma: could not find a valid position (x, y) for node "'.concat(key, '". All your nodes must have a number "x" and "y". Maybe your forgot to apply a layout or your "nodeReducer" is not returning the correct data?'));
    if (!data.color) data.color = settings.defaultNodeColor;
    if (!data.label && data.label !== "") data.label = null;
    if (data.label !== void 0 && data.label !== null) data.label = "" + data.label;
    else data.label = null;
    if (!data.size) data.size = 2;
    if (!hasOwnProperty.call(data, "hidden")) data.hidden = false;
    if (!hasOwnProperty.call(data, "highlighted")) data.highlighted = false;
    if (!hasOwnProperty.call(data, "forceLabel")) data.forceLabel = false;
    if (!data.type || data.type === "") data.type = settings.defaultNodeType;
    if (!data.zIndex) data.zIndex = 0;
    return data;
  }
  function applyEdgeDefaults(settings, _key, data) {
    if (!data.color) data.color = settings.defaultEdgeColor;
    if (!data.label) data.label = "";
    if (!data.size) data.size = 0.5;
    if (!hasOwnProperty.call(data, "hidden")) data.hidden = false;
    if (!hasOwnProperty.call(data, "forceLabel")) data.forceLabel = false;
    if (!data.type || data.type === "") data.type = settings.defaultEdgeType;
    if (!data.zIndex) data.zIndex = 0;
    return data;
  }
  var Sigma$1 = /* @__PURE__ */ (function(_TypedEventEmitter) {
    function Sigma(graph, container) {
      var _this;
      var settings = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
      _classCallCheck(this, Sigma);
      _this = _callSuper(this, Sigma);
      _defineProperty(_this, "elements", {});
      _defineProperty(_this, "canvasContexts", {});
      _defineProperty(_this, "webGLContexts", {});
      _defineProperty(_this, "pickingLayers", /* @__PURE__ */ new Set());
      _defineProperty(_this, "textures", {});
      _defineProperty(_this, "frameBuffers", {});
      _defineProperty(_this, "activeListeners", {});
      _defineProperty(_this, "labelGrid", new LabelGrid());
      _defineProperty(_this, "nodeDataCache", {});
      _defineProperty(_this, "edgeDataCache", {});
      _defineProperty(_this, "nodeProgramIndex", {});
      _defineProperty(_this, "edgeProgramIndex", {});
      _defineProperty(_this, "nodesWithForcedLabels", /* @__PURE__ */ new Set());
      _defineProperty(_this, "edgesWithForcedLabels", /* @__PURE__ */ new Set());
      _defineProperty(_this, "nodeExtent", {
        x: [0, 1],
        y: [0, 1]
      });
      _defineProperty(_this, "nodeZExtent", [Infinity, -Infinity]);
      _defineProperty(_this, "edgeZExtent", [Infinity, -Infinity]);
      _defineProperty(_this, "matrix", identity());
      _defineProperty(_this, "invMatrix", identity());
      _defineProperty(_this, "correctionRatio", 1);
      _defineProperty(_this, "customBBox", null);
      _defineProperty(_this, "normalizationFunction", createNormalizationFunction({
        x: [0, 1],
        y: [0, 1]
      }));
      _defineProperty(_this, "graphToViewportRatio", 1);
      _defineProperty(_this, "itemIDsIndex", {});
      _defineProperty(_this, "nodeIndices", {});
      _defineProperty(_this, "edgeIndices", {});
      _defineProperty(_this, "width", 0);
      _defineProperty(_this, "height", 0);
      _defineProperty(_this, "pixelRatio", getPixelRatio());
      _defineProperty(_this, "pickingDownSizingRatio", 2 * _this.pixelRatio);
      _defineProperty(_this, "displayedNodeLabels", /* @__PURE__ */ new Set());
      _defineProperty(_this, "displayedEdgeLabels", /* @__PURE__ */ new Set());
      _defineProperty(_this, "highlightedNodes", /* @__PURE__ */ new Set());
      _defineProperty(_this, "hoveredNode", null);
      _defineProperty(_this, "hoveredEdge", null);
      _defineProperty(_this, "renderFrame", null);
      _defineProperty(_this, "renderHighlightedNodesFrame", null);
      _defineProperty(_this, "needToProcess", false);
      _defineProperty(_this, "checkEdgesEventsFrame", null);
      _defineProperty(_this, "nodePrograms", {});
      _defineProperty(_this, "nodeHoverPrograms", {});
      _defineProperty(_this, "edgePrograms", {});
      _this.settings = resolveSettings(settings);
      validateSettings(_this.settings);
      validateGraph(graph);
      if (!(container instanceof HTMLElement)) throw new Error("Sigma: container should be an html element.");
      _this.graph = graph;
      _this.container = container;
      _this.createWebGLContext("edges", {
        picking: settings.enableEdgeEvents
      });
      _this.createCanvasContext("edgeLabels");
      _this.createWebGLContext("nodes", {
        picking: true
      });
      _this.createCanvasContext("labels");
      _this.createCanvasContext("hovers");
      _this.createWebGLContext("hoverNodes");
      _this.createCanvasContext("mouse", {
        style: {
          touchAction: "none",
          userSelect: "none"
        }
      });
      _this.resize();
      for (var type in _this.settings.nodeProgramClasses) {
        _this.registerNodeProgram(type, _this.settings.nodeProgramClasses[type], _this.settings.nodeHoverProgramClasses[type]);
      }
      for (var _type in _this.settings.edgeProgramClasses) {
        _this.registerEdgeProgram(_type, _this.settings.edgeProgramClasses[_type]);
      }
      _this.camera = new Camera();
      _this.bindCameraHandlers();
      _this.mouseCaptor = new MouseCaptor(_this.elements.mouse, _this);
      _this.mouseCaptor.setSettings(_this.settings);
      _this.touchCaptor = new TouchCaptor(_this.elements.mouse, _this);
      _this.touchCaptor.setSettings(_this.settings);
      _this.bindEventHandlers();
      _this.bindGraphHandlers();
      _this.handleSettingsUpdate();
      _this.refresh();
      return _this;
    }
    _inherits(Sigma, _TypedEventEmitter);
    return _createClass(Sigma, [{
      key: "registerNodeProgram",
      value: function registerNodeProgram(key, NodeProgramClass, NodeHoverProgram) {
        if (this.nodePrograms[key]) this.nodePrograms[key].kill();
        if (this.nodeHoverPrograms[key]) this.nodeHoverPrograms[key].kill();
        this.nodePrograms[key] = new NodeProgramClass(this.webGLContexts.nodes, this.frameBuffers.nodes, this);
        this.nodeHoverPrograms[key] = new (NodeHoverProgram || NodeProgramClass)(this.webGLContexts.hoverNodes, null, this);
        return this;
      }
      /**
       * Internal function used to register an edge program
       *
       * @param  {string}          key              - The program's key, matching the related edges "type" values.
       * @param  {EdgeProgramType} EdgeProgramClass - An edges program class.
       * @return {Sigma}
       */
    }, {
      key: "registerEdgeProgram",
      value: function registerEdgeProgram(key, EdgeProgramClass) {
        if (this.edgePrograms[key]) this.edgePrograms[key].kill();
        this.edgePrograms[key] = new EdgeProgramClass(this.webGLContexts.edges, this.frameBuffers.edges, this);
        return this;
      }
      /**
       * Internal function used to unregister a node program
       *
       * @param  {string} key - The program's key, matching the related nodes "type" values.
       * @return {Sigma}
       */
    }, {
      key: "unregisterNodeProgram",
      value: function unregisterNodeProgram(key) {
        if (this.nodePrograms[key]) {
          var _this$nodePrograms = this.nodePrograms, program = _this$nodePrograms[key], programs = _objectWithoutProperties(_this$nodePrograms, [key].map(_toPropertyKey));
          program.kill();
          this.nodePrograms = programs;
        }
        if (this.nodeHoverPrograms[key]) {
          var _this$nodeHoverProgra = this.nodeHoverPrograms, _program = _this$nodeHoverProgra[key], _programs = _objectWithoutProperties(_this$nodeHoverProgra, [key].map(_toPropertyKey));
          _program.kill();
          this.nodePrograms = _programs;
        }
        return this;
      }
      /**
       * Internal function used to unregister an edge program
       *
       * @param  {string} key - The program's key, matching the related edges "type" values.
       * @return {Sigma}
       */
    }, {
      key: "unregisterEdgeProgram",
      value: function unregisterEdgeProgram(key) {
        if (this.edgePrograms[key]) {
          var _this$edgePrograms = this.edgePrograms, program = _this$edgePrograms[key], programs = _objectWithoutProperties(_this$edgePrograms, [key].map(_toPropertyKey));
          program.kill();
          this.edgePrograms = programs;
        }
        return this;
      }
      /**
       * Method (re)binding WebGL texture (for picking).
       *
       * @return {Sigma}
       */
    }, {
      key: "resetWebGLTexture",
      value: function resetWebGLTexture(id) {
        var gl = this.webGLContexts[id];
        var frameBuffer = this.frameBuffers[id];
        var currentTexture = this.textures[id];
        if (currentTexture) gl.deleteTexture(currentTexture);
        var pickingTexture = gl.createTexture();
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.bindTexture(gl.TEXTURE_2D, pickingTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pickingTexture, 0);
        this.textures[id] = pickingTexture;
        return this;
      }
      /**
       * Method binding camera handlers.
       *
       * @return {Sigma}
       */
    }, {
      key: "bindCameraHandlers",
      value: function bindCameraHandlers() {
        var _this2 = this;
        this.activeListeners.camera = function() {
          _this2.scheduleRender();
        };
        this.camera.on("updated", this.activeListeners.camera);
        return this;
      }
      /**
       * Method unbinding camera handlers.
       *
       * @return {Sigma}
       */
    }, {
      key: "unbindCameraHandlers",
      value: function unbindCameraHandlers() {
        this.camera.removeListener("updated", this.activeListeners.camera);
        return this;
      }
      /**
       * Method that returns the closest node to a given position.
       */
    }, {
      key: "getNodeAtPosition",
      value: function getNodeAtPosition(position) {
        var x = position.x, y2 = position.y;
        var color = getPixelColor(this.webGLContexts.nodes, this.frameBuffers.nodes, x, y2, this.pixelRatio, this.pickingDownSizingRatio);
        var index = colorToIndex.apply(void 0, _toConsumableArray(color));
        var itemAt = this.itemIDsIndex[index];
        return itemAt && itemAt.type === "node" ? itemAt.id : null;
      }
      /**
       * Method binding event handlers.
       *
       * @return {Sigma}
       */
    }, {
      key: "bindEventHandlers",
      value: function bindEventHandlers() {
        var _this3 = this;
        this.activeListeners.handleResize = function() {
          _this3.scheduleRefresh();
        };
        window.addEventListener("resize", this.activeListeners.handleResize);
        this.activeListeners.handleMove = function(e2) {
          var event = cleanMouseCoords(e2);
          var baseEvent = {
            event,
            preventSigmaDefault: function preventSigmaDefault() {
              event.preventSigmaDefault();
            }
          };
          var nodeToHover = _this3.getNodeAtPosition(event);
          if (nodeToHover && _this3.hoveredNode !== nodeToHover && !_this3.nodeDataCache[nodeToHover].hidden) {
            if (_this3.hoveredNode) _this3.emit("leaveNode", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
              node: _this3.hoveredNode
            }));
            _this3.hoveredNode = nodeToHover;
            _this3.emit("enterNode", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
              node: nodeToHover
            }));
            _this3.scheduleHighlightedNodesRender();
            return;
          }
          if (_this3.hoveredNode) {
            if (_this3.getNodeAtPosition(event) !== _this3.hoveredNode) {
              var node = _this3.hoveredNode;
              _this3.hoveredNode = null;
              _this3.emit("leaveNode", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
                node
              }));
              _this3.scheduleHighlightedNodesRender();
              return;
            }
          }
          if (_this3.settings.enableEdgeEvents) {
            var edgeToHover = _this3.hoveredNode ? null : _this3.getEdgeAtPoint(baseEvent.event.x, baseEvent.event.y);
            if (edgeToHover !== _this3.hoveredEdge) {
              if (_this3.hoveredEdge) _this3.emit("leaveEdge", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
                edge: _this3.hoveredEdge
              }));
              if (edgeToHover) _this3.emit("enterEdge", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
                edge: edgeToHover
              }));
              _this3.hoveredEdge = edgeToHover;
            }
          }
        };
        this.activeListeners.handleMoveBody = function(e2) {
          var event = cleanMouseCoords(e2);
          _this3.emit("moveBody", {
            event,
            preventSigmaDefault: function preventSigmaDefault() {
              event.preventSigmaDefault();
            }
          });
        };
        this.activeListeners.handleLeave = function(e2) {
          var event = cleanMouseCoords(e2);
          var baseEvent = {
            event,
            preventSigmaDefault: function preventSigmaDefault() {
              event.preventSigmaDefault();
            }
          };
          if (_this3.hoveredNode) {
            _this3.emit("leaveNode", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
              node: _this3.hoveredNode
            }));
            _this3.scheduleHighlightedNodesRender();
          }
          if (_this3.settings.enableEdgeEvents && _this3.hoveredEdge) {
            _this3.emit("leaveEdge", _objectSpread2(_objectSpread2({}, baseEvent), {}, {
              edge: _this3.hoveredEdge
            }));
            _this3.scheduleHighlightedNodesRender();
          }
          _this3.emit("leaveStage", _objectSpread2({}, baseEvent));
        };
        this.activeListeners.handleEnter = function(e2) {
          var event = cleanMouseCoords(e2);
          var baseEvent = {
            event,
            preventSigmaDefault: function preventSigmaDefault() {
              event.preventSigmaDefault();
            }
          };
          _this3.emit("enterStage", _objectSpread2({}, baseEvent));
        };
        var createInteractionListener = function createInteractionListener2(eventType) {
          return function(e2) {
            var event = cleanMouseCoords(e2);
            var baseEvent = {
              event,
              preventSigmaDefault: function preventSigmaDefault() {
                event.preventSigmaDefault();
              }
            };
            var nodeAtPosition = _this3.getNodeAtPosition(event);
            if (nodeAtPosition) return _this3.emit("".concat(eventType, "Node"), _objectSpread2(_objectSpread2({}, baseEvent), {}, {
              node: nodeAtPosition
            }));
            if (_this3.settings.enableEdgeEvents) {
              var edge = _this3.getEdgeAtPoint(event.x, event.y);
              if (edge) return _this3.emit("".concat(eventType, "Edge"), _objectSpread2(_objectSpread2({}, baseEvent), {}, {
                edge
              }));
            }
            return _this3.emit("".concat(eventType, "Stage"), baseEvent);
          };
        };
        this.activeListeners.handleClick = createInteractionListener("click");
        this.activeListeners.handleRightClick = createInteractionListener("rightClick");
        this.activeListeners.handleDoubleClick = createInteractionListener("doubleClick");
        this.activeListeners.handleWheel = createInteractionListener("wheel");
        this.activeListeners.handleDown = createInteractionListener("down");
        this.activeListeners.handleUp = createInteractionListener("up");
        this.mouseCaptor.on("mousemove", this.activeListeners.handleMove);
        this.mouseCaptor.on("mousemovebody", this.activeListeners.handleMoveBody);
        this.mouseCaptor.on("click", this.activeListeners.handleClick);
        this.mouseCaptor.on("rightClick", this.activeListeners.handleRightClick);
        this.mouseCaptor.on("doubleClick", this.activeListeners.handleDoubleClick);
        this.mouseCaptor.on("wheel", this.activeListeners.handleWheel);
        this.mouseCaptor.on("mousedown", this.activeListeners.handleDown);
        this.mouseCaptor.on("mouseup", this.activeListeners.handleUp);
        this.mouseCaptor.on("mouseleave", this.activeListeners.handleLeave);
        this.mouseCaptor.on("mouseenter", this.activeListeners.handleEnter);
        this.touchCaptor.on("touchdown", this.activeListeners.handleDown);
        this.touchCaptor.on("touchdown", this.activeListeners.handleMove);
        this.touchCaptor.on("touchup", this.activeListeners.handleUp);
        this.touchCaptor.on("touchmove", this.activeListeners.handleMove);
        this.touchCaptor.on("tap", this.activeListeners.handleClick);
        this.touchCaptor.on("doubletap", this.activeListeners.handleDoubleClick);
        this.touchCaptor.on("touchmove", this.activeListeners.handleMoveBody);
        return this;
      }
      /**
       * Method binding graph handlers
       *
       * @return {Sigma}
       */
    }, {
      key: "bindGraphHandlers",
      value: function bindGraphHandlers() {
        var _this4 = this;
        var graph = this.graph;
        var LAYOUT_IMPACTING_FIELDS = /* @__PURE__ */ new Set(["x", "y", "zIndex", "type"]);
        this.activeListeners.eachNodeAttributesUpdatedGraphUpdate = function(e2) {
          var _e$hints;
          var updatedFields = (_e$hints = e2.hints) === null || _e$hints === void 0 ? void 0 : _e$hints.attributes;
          _this4.graph.forEachNode(function(node) {
            return _this4.updateNode(node);
          });
          var layoutChanged = !updatedFields || updatedFields.some(function(f2) {
            return LAYOUT_IMPACTING_FIELDS.has(f2);
          });
          _this4.refresh({
            partialGraph: {
              nodes: graph.nodes()
            },
            skipIndexation: !layoutChanged,
            schedule: true
          });
        };
        this.activeListeners.eachEdgeAttributesUpdatedGraphUpdate = function(e2) {
          var _e$hints2;
          var updatedFields = (_e$hints2 = e2.hints) === null || _e$hints2 === void 0 ? void 0 : _e$hints2.attributes;
          _this4.graph.forEachEdge(function(edge) {
            return _this4.updateEdge(edge);
          });
          var layoutChanged = updatedFields && ["zIndex", "type"].some(function(f2) {
            return updatedFields === null || updatedFields === void 0 ? void 0 : updatedFields.includes(f2);
          });
          _this4.refresh({
            partialGraph: {
              edges: graph.edges()
            },
            skipIndexation: !layoutChanged,
            schedule: true
          });
        };
        this.activeListeners.addNodeGraphUpdate = function(payload) {
          var node = payload.key;
          _this4.addNode(node);
          _this4.refresh({
            partialGraph: {
              nodes: [node]
            },
            skipIndexation: false,
            schedule: true
          });
        };
        this.activeListeners.updateNodeGraphUpdate = function(payload) {
          var node = payload.key;
          _this4.refresh({
            partialGraph: {
              nodes: [node]
            },
            skipIndexation: false,
            schedule: true
          });
        };
        this.activeListeners.dropNodeGraphUpdate = function(payload) {
          var node = payload.key;
          _this4.removeNode(node);
          _this4.refresh({
            schedule: true
          });
        };
        this.activeListeners.addEdgeGraphUpdate = function(payload) {
          var edge = payload.key;
          _this4.addEdge(edge);
          _this4.refresh({
            partialGraph: {
              edges: [edge]
            },
            schedule: true
          });
        };
        this.activeListeners.updateEdgeGraphUpdate = function(payload) {
          var edge = payload.key;
          _this4.refresh({
            partialGraph: {
              edges: [edge]
            },
            skipIndexation: false,
            schedule: true
          });
        };
        this.activeListeners.dropEdgeGraphUpdate = function(payload) {
          var edge = payload.key;
          _this4.removeEdge(edge);
          _this4.refresh({
            schedule: true
          });
        };
        this.activeListeners.clearEdgesGraphUpdate = function() {
          _this4.clearEdgeState();
          _this4.clearEdgeIndices();
          _this4.refresh({
            schedule: true
          });
        };
        this.activeListeners.clearGraphUpdate = function() {
          _this4.clearEdgeState();
          _this4.clearNodeState();
          _this4.clearEdgeIndices();
          _this4.clearNodeIndices();
          _this4.refresh({
            schedule: true
          });
        };
        graph.on("nodeAdded", this.activeListeners.addNodeGraphUpdate);
        graph.on("nodeDropped", this.activeListeners.dropNodeGraphUpdate);
        graph.on("nodeAttributesUpdated", this.activeListeners.updateNodeGraphUpdate);
        graph.on("eachNodeAttributesUpdated", this.activeListeners.eachNodeAttributesUpdatedGraphUpdate);
        graph.on("edgeAdded", this.activeListeners.addEdgeGraphUpdate);
        graph.on("edgeDropped", this.activeListeners.dropEdgeGraphUpdate);
        graph.on("edgeAttributesUpdated", this.activeListeners.updateEdgeGraphUpdate);
        graph.on("eachEdgeAttributesUpdated", this.activeListeners.eachEdgeAttributesUpdatedGraphUpdate);
        graph.on("edgesCleared", this.activeListeners.clearEdgesGraphUpdate);
        graph.on("cleared", this.activeListeners.clearGraphUpdate);
        return this;
      }
      /**
       * Method used to unbind handlers from the graph.
       *
       * @return {undefined}
       */
    }, {
      key: "unbindGraphHandlers",
      value: function unbindGraphHandlers() {
        var graph = this.graph;
        graph.removeListener("nodeAdded", this.activeListeners.addNodeGraphUpdate);
        graph.removeListener("nodeDropped", this.activeListeners.dropNodeGraphUpdate);
        graph.removeListener("nodeAttributesUpdated", this.activeListeners.updateNodeGraphUpdate);
        graph.removeListener("eachNodeAttributesUpdated", this.activeListeners.eachNodeAttributesUpdatedGraphUpdate);
        graph.removeListener("edgeAdded", this.activeListeners.addEdgeGraphUpdate);
        graph.removeListener("edgeDropped", this.activeListeners.dropEdgeGraphUpdate);
        graph.removeListener("edgeAttributesUpdated", this.activeListeners.updateEdgeGraphUpdate);
        graph.removeListener("eachEdgeAttributesUpdated", this.activeListeners.eachEdgeAttributesUpdatedGraphUpdate);
        graph.removeListener("edgesCleared", this.activeListeners.clearEdgesGraphUpdate);
        graph.removeListener("cleared", this.activeListeners.clearGraphUpdate);
      }
      /**
       * Method looking for an edge colliding with a given point at (x, y). Returns
       * the key of the edge if any, or null else.
       */
    }, {
      key: "getEdgeAtPoint",
      value: function getEdgeAtPoint(x, y2) {
        var color = getPixelColor(this.webGLContexts.edges, this.frameBuffers.edges, x, y2, this.pixelRatio, this.pickingDownSizingRatio);
        var index = colorToIndex.apply(void 0, _toConsumableArray(color));
        var itemAt = this.itemIDsIndex[index];
        return itemAt && itemAt.type === "edge" ? itemAt.id : null;
      }
      /**
       * Method used to process the whole graph's data.
       *  - extent
       *  - normalizationFunction
       *  - compute node's coordinate
       *  - labelgrid
       *  - program data allocation
       * @return {Sigma}
       */
    }, {
      key: "process",
      value: function process2() {
        var _this5 = this;
        this.emit("beforeProcess");
        var graph = this.graph;
        var settings = this.settings;
        var dimensions = this.getDimensions();
        this.nodeExtent = graphExtent(this.graph);
        if (!this.settings.autoRescale) {
          var width = dimensions.width, height = dimensions.height;
          var _this$nodeExtent = this.nodeExtent, x = _this$nodeExtent.x, y2 = _this$nodeExtent.y;
          this.nodeExtent = {
            x: [(x[0] + x[1]) / 2 - width / 2, (x[0] + x[1]) / 2 + width / 2],
            y: [(y2[0] + y2[1]) / 2 - height / 2, (y2[0] + y2[1]) / 2 + height / 2]
          };
        }
        this.normalizationFunction = createNormalizationFunction(this.customBBox || this.nodeExtent);
        var nullCamera = new Camera();
        var nullCameraMatrix = matrixFromCamera(nullCamera.getState(), dimensions, this.getGraphDimensions(), this.getStagePadding());
        this.labelGrid.resizeAndClear(dimensions, settings.labelGridCellSize);
        var nodesPerPrograms = {};
        var nodeIndices = {};
        var edgeIndices = {};
        var itemIDsIndex = {};
        var incrID = 1;
        var nodes = graph.nodes();
        for (var i2 = 0, l2 = nodes.length; i2 < l2; i2++) {
          var node = nodes[i2];
          var data = this.nodeDataCache[node];
          var attrs = graph.getNodeAttributes(node);
          data.x = attrs.x;
          data.y = attrs.y;
          this.normalizationFunction.applyTo(data);
          if (typeof data.label === "string" && !data.hidden) this.labelGrid.add(node, data.size, this.framedGraphToViewport(data, {
            matrix: nullCameraMatrix
          }));
          nodesPerPrograms[data.type] = (nodesPerPrograms[data.type] || 0) + 1;
        }
        this.labelGrid.organize();
        for (var type in this.nodePrograms) {
          if (!hasOwnProperty.call(this.nodePrograms, type)) {
            throw new Error('Sigma: could not find a suitable program for node type "'.concat(type, '"!'));
          }
          this.nodePrograms[type].reallocate(nodesPerPrograms[type] || 0);
          nodesPerPrograms[type] = 0;
        }
        if (this.settings.zIndex && this.nodeZExtent[0] !== this.nodeZExtent[1]) nodes = zIndexOrdering(this.nodeZExtent, function(node2) {
          return _this5.nodeDataCache[node2].zIndex;
        }, nodes);
        for (var _i = 0, _l = nodes.length; _i < _l; _i++) {
          var _node = nodes[_i];
          nodeIndices[_node] = incrID;
          itemIDsIndex[nodeIndices[_node]] = {
            type: "node",
            id: _node
          };
          incrID++;
          var _data = this.nodeDataCache[_node];
          this.addNodeToProgram(_node, nodeIndices[_node], nodesPerPrograms[_data.type]++);
        }
        var edgesPerPrograms = {};
        var edges = graph.edges();
        for (var _i2 = 0, _l2 = edges.length; _i2 < _l2; _i2++) {
          var edge = edges[_i2];
          var _data2 = this.edgeDataCache[edge];
          edgesPerPrograms[_data2.type] = (edgesPerPrograms[_data2.type] || 0) + 1;
        }
        if (this.settings.zIndex && this.edgeZExtent[0] !== this.edgeZExtent[1]) edges = zIndexOrdering(this.edgeZExtent, function(edge2) {
          return _this5.edgeDataCache[edge2].zIndex;
        }, edges);
        for (var _type2 in this.edgePrograms) {
          if (!hasOwnProperty.call(this.edgePrograms, _type2)) {
            throw new Error('Sigma: could not find a suitable program for edge type "'.concat(_type2, '"!'));
          }
          this.edgePrograms[_type2].reallocate(edgesPerPrograms[_type2] || 0);
          edgesPerPrograms[_type2] = 0;
        }
        for (var _i3 = 0, _l3 = edges.length; _i3 < _l3; _i3++) {
          var _edge = edges[_i3];
          edgeIndices[_edge] = incrID;
          itemIDsIndex[edgeIndices[_edge]] = {
            type: "edge",
            id: _edge
          };
          incrID++;
          var _data3 = this.edgeDataCache[_edge];
          this.addEdgeToProgram(_edge, edgeIndices[_edge], edgesPerPrograms[_data3.type]++);
        }
        this.itemIDsIndex = itemIDsIndex;
        this.nodeIndices = nodeIndices;
        this.edgeIndices = edgeIndices;
        this.emit("afterProcess");
        return this;
      }
      /**
       * Method that backports potential settings updates where it's needed.
       * @private
       */
    }, {
      key: "handleSettingsUpdate",
      value: function handleSettingsUpdate(oldSettings) {
        var _this6 = this;
        var settings = this.settings;
        this.camera.minRatio = settings.minCameraRatio;
        this.camera.maxRatio = settings.maxCameraRatio;
        this.camera.enabledZooming = settings.enableCameraZooming;
        this.camera.enabledPanning = settings.enableCameraPanning;
        this.camera.enabledRotation = settings.enableCameraRotation;
        if (settings.cameraPanBoundaries) {
          this.camera.clean = function(state) {
            return _this6.cleanCameraState(state, settings.cameraPanBoundaries && _typeof(settings.cameraPanBoundaries) === "object" ? settings.cameraPanBoundaries : {});
          };
        } else {
          this.camera.clean = null;
        }
        this.camera.setState(this.camera.validateState(this.camera.getState()));
        if (oldSettings) {
          if (oldSettings.edgeProgramClasses !== settings.edgeProgramClasses) {
            for (var type in settings.edgeProgramClasses) {
              if (settings.edgeProgramClasses[type] !== oldSettings.edgeProgramClasses[type]) {
                this.registerEdgeProgram(type, settings.edgeProgramClasses[type]);
              }
            }
            for (var _type3 in oldSettings.edgeProgramClasses) {
              if (!settings.edgeProgramClasses[_type3]) this.unregisterEdgeProgram(_type3);
            }
          }
          if (oldSettings.nodeProgramClasses !== settings.nodeProgramClasses || oldSettings.nodeHoverProgramClasses !== settings.nodeHoverProgramClasses) {
            for (var _type4 in settings.nodeProgramClasses) {
              if (settings.nodeProgramClasses[_type4] !== oldSettings.nodeProgramClasses[_type4] || settings.nodeHoverProgramClasses[_type4] !== oldSettings.nodeHoverProgramClasses[_type4]) {
                this.registerNodeProgram(_type4, settings.nodeProgramClasses[_type4], settings.nodeHoverProgramClasses[_type4]);
              }
            }
            for (var _type5 in oldSettings.nodeProgramClasses) {
              if (!settings.nodeProgramClasses[_type5]) this.unregisterNodeProgram(_type5);
            }
          }
        }
        this.mouseCaptor.setSettings(this.settings);
        this.touchCaptor.setSettings(this.settings);
        return this;
      }
    }, {
      key: "cleanCameraState",
      value: function cleanCameraState(state) {
        var _ref = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, _ref$tolerance = _ref.tolerance, tolerance = _ref$tolerance === void 0 ? 0 : _ref$tolerance, boundaries = _ref.boundaries;
        var newState = _objectSpread2({}, state);
        var _ref2 = boundaries || this.nodeExtent, _ref2$x = _slicedToArray(_ref2.x, 2), xMinGraph = _ref2$x[0], xMaxGraph = _ref2$x[1], _ref2$y = _slicedToArray(_ref2.y, 2), yMinGraph = _ref2$y[0], yMaxGraph = _ref2$y[1];
        var corners = [this.graphToViewport({
          x: xMinGraph,
          y: yMinGraph
        }, {
          cameraState: state
        }), this.graphToViewport({
          x: xMaxGraph,
          y: yMinGraph
        }, {
          cameraState: state
        }), this.graphToViewport({
          x: xMinGraph,
          y: yMaxGraph
        }, {
          cameraState: state
        }), this.graphToViewport({
          x: xMaxGraph,
          y: yMaxGraph
        }, {
          cameraState: state
        })];
        var xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
        corners.forEach(function(_ref3) {
          var x = _ref3.x, y2 = _ref3.y;
          xMin = Math.min(xMin, x);
          xMax = Math.max(xMax, x);
          yMin = Math.min(yMin, y2);
          yMax = Math.max(yMax, y2);
        });
        var graphWidth = xMax - xMin;
        var graphHeight = yMax - yMin;
        var _this$getDimensions = this.getDimensions(), width = _this$getDimensions.width, height = _this$getDimensions.height;
        var dx = 0;
        var dy = 0;
        if (graphWidth >= width) {
          if (xMax < width - tolerance) dx = xMax - (width - tolerance);
          else if (xMin > tolerance) dx = xMin - tolerance;
        } else {
          if (xMax > width + tolerance) dx = xMax - (width + tolerance);
          else if (xMin < -tolerance) dx = xMin + tolerance;
        }
        if (graphHeight >= height) {
          if (yMax < height - tolerance) dy = yMax - (height - tolerance);
          else if (yMin > tolerance) dy = yMin - tolerance;
        } else {
          if (yMax > height + tolerance) dy = yMax - (height + tolerance);
          else if (yMin < -tolerance) dy = yMin + tolerance;
        }
        if (dx || dy) {
          var origin = this.viewportToFramedGraph({
            x: 0,
            y: 0
          }, {
            cameraState: state
          });
          var delta = this.viewportToFramedGraph({
            x: dx,
            y: dy
          }, {
            cameraState: state
          });
          dx = delta.x - origin.x;
          dy = delta.y - origin.y;
          newState.x += dx;
          newState.y += dy;
        }
        return newState;
      }
      /**
       * Method used to render labels.
       *
       * @return {Sigma}
       */
    }, {
      key: "renderLabels",
      value: function renderLabels() {
        if (!this.settings.renderLabels) return this;
        var cameraState = this.camera.getState();
        var labelsToDisplay = this.labelGrid.getLabelsToDisplay(cameraState.ratio, this.settings.labelDensity);
        extend(labelsToDisplay, this.nodesWithForcedLabels);
        this.displayedNodeLabels = /* @__PURE__ */ new Set();
        var context = this.canvasContexts.labels;
        for (var i2 = 0, l2 = labelsToDisplay.length; i2 < l2; i2++) {
          var node = labelsToDisplay[i2];
          var data = this.nodeDataCache[node];
          if (this.displayedNodeLabels.has(node)) continue;
          if (data.hidden) continue;
          var _this$framedGraphToVi = this.framedGraphToViewport(data), x = _this$framedGraphToVi.x, y2 = _this$framedGraphToVi.y;
          var size = this.scaleSize(data.size);
          if (!data.forceLabel && size < this.settings.labelRenderedSizeThreshold) continue;
          if (x < -X_LABEL_MARGIN || x > this.width + X_LABEL_MARGIN || y2 < -Y_LABEL_MARGIN || y2 > this.height + Y_LABEL_MARGIN) continue;
          this.displayedNodeLabels.add(node);
          var defaultDrawNodeLabel = this.settings.defaultDrawNodeLabel;
          var nodeProgram = this.nodePrograms[data.type];
          var drawLabel = (nodeProgram === null || nodeProgram === void 0 ? void 0 : nodeProgram.drawLabel) || defaultDrawNodeLabel;
          drawLabel(context, _objectSpread2(_objectSpread2({
            key: node
          }, data), {}, {
            size,
            x,
            y: y2
          }), this.settings);
        }
        return this;
      }
      /**
       * Method used to render edge labels, based on which node labels were
       * rendered.
       *
       * @return {Sigma}
       */
    }, {
      key: "renderEdgeLabels",
      value: function renderEdgeLabels() {
        if (!this.settings.renderEdgeLabels) return this;
        var context = this.canvasContexts.edgeLabels;
        context.clearRect(0, 0, this.width, this.height);
        var edgeLabelsToDisplay = edgeLabelsToDisplayFromNodes({
          graph: this.graph,
          hoveredNode: this.hoveredNode,
          displayedNodeLabels: this.displayedNodeLabels,
          highlightedNodes: this.highlightedNodes
        });
        extend(edgeLabelsToDisplay, this.edgesWithForcedLabels);
        var displayedLabels = /* @__PURE__ */ new Set();
        for (var i2 = 0, l2 = edgeLabelsToDisplay.length; i2 < l2; i2++) {
          var edge = edgeLabelsToDisplay[i2], extremities = this.graph.extremities(edge), sourceData = this.nodeDataCache[extremities[0]], targetData = this.nodeDataCache[extremities[1]], edgeData = this.edgeDataCache[edge];
          if (displayedLabels.has(edge)) continue;
          if (edgeData.hidden || sourceData.hidden || targetData.hidden) {
            continue;
          }
          var defaultDrawEdgeLabel = this.settings.defaultDrawEdgeLabel;
          var edgeProgram = this.edgePrograms[edgeData.type];
          var drawLabel = (edgeProgram === null || edgeProgram === void 0 ? void 0 : edgeProgram.drawLabel) || defaultDrawEdgeLabel;
          drawLabel(context, _objectSpread2(_objectSpread2({
            key: edge
          }, edgeData), {}, {
            size: this.scaleSize(edgeData.size)
          }), _objectSpread2(_objectSpread2(_objectSpread2({
            key: extremities[0]
          }, sourceData), this.framedGraphToViewport(sourceData)), {}, {
            size: this.scaleSize(sourceData.size)
          }), _objectSpread2(_objectSpread2(_objectSpread2({
            key: extremities[1]
          }, targetData), this.framedGraphToViewport(targetData)), {}, {
            size: this.scaleSize(targetData.size)
          }), this.settings);
          displayedLabels.add(edge);
        }
        this.displayedEdgeLabels = displayedLabels;
        return this;
      }
      /**
       * Method used to render the highlighted nodes.
       *
       * @return {Sigma}
       */
    }, {
      key: "renderHighlightedNodes",
      value: function renderHighlightedNodes() {
        var _this7 = this;
        var context = this.canvasContexts.hovers;
        context.clearRect(0, 0, this.width, this.height);
        var render = function render2(node) {
          var data = _this7.nodeDataCache[node];
          var _this7$framedGraphToV = _this7.framedGraphToViewport(data), x = _this7$framedGraphToV.x, y2 = _this7$framedGraphToV.y;
          var size = _this7.scaleSize(data.size);
          var defaultDrawNodeHover = _this7.settings.defaultDrawNodeHover;
          var nodeProgram = _this7.nodePrograms[data.type];
          var drawHover = (nodeProgram === null || nodeProgram === void 0 ? void 0 : nodeProgram.drawHover) || defaultDrawNodeHover;
          drawHover(context, _objectSpread2(_objectSpread2({
            key: node
          }, data), {}, {
            size,
            x,
            y: y2
          }), _this7.settings);
        };
        var nodesToRender = [];
        if (this.hoveredNode && !this.nodeDataCache[this.hoveredNode].hidden) {
          nodesToRender.push(this.hoveredNode);
        }
        this.highlightedNodes.forEach(function(node) {
          if (node !== _this7.hoveredNode) nodesToRender.push(node);
        });
        nodesToRender.forEach(function(node) {
          return render(node);
        });
        var nodesPerPrograms = {};
        nodesToRender.forEach(function(node) {
          var type2 = _this7.nodeDataCache[node].type;
          nodesPerPrograms[type2] = (nodesPerPrograms[type2] || 0) + 1;
        });
        for (var type in this.nodeHoverPrograms) {
          this.nodeHoverPrograms[type].reallocate(nodesPerPrograms[type] || 0);
          nodesPerPrograms[type] = 0;
        }
        nodesToRender.forEach(function(node) {
          var data = _this7.nodeDataCache[node];
          _this7.nodeHoverPrograms[data.type].process(0, nodesPerPrograms[data.type]++, data);
        });
        this.webGLContexts.hoverNodes.clear(this.webGLContexts.hoverNodes.COLOR_BUFFER_BIT);
        var renderParams = this.getRenderParams();
        for (var _type6 in this.nodeHoverPrograms) {
          var program = this.nodeHoverPrograms[_type6];
          program.render(renderParams);
        }
      }
      /**
       * Method used to schedule a hover render.
       *
       */
    }, {
      key: "scheduleHighlightedNodesRender",
      value: function scheduleHighlightedNodesRender() {
        var _this8 = this;
        if (this.renderHighlightedNodesFrame || this.renderFrame) return;
        this.renderHighlightedNodesFrame = requestAnimationFrame(function() {
          _this8.renderHighlightedNodesFrame = null;
          _this8.renderHighlightedNodes();
          _this8.renderEdgeLabels();
        });
      }
      /**
       * Method used to render.
       *
       * @return {Sigma}
       */
    }, {
      key: "render",
      value: function render() {
        var _this9 = this;
        this.emit("beforeRender");
        var exitRender = function exitRender2() {
          _this9.emit("afterRender");
          return _this9;
        };
        if (this.renderFrame) {
          cancelAnimationFrame(this.renderFrame);
          this.renderFrame = null;
        }
        this.resize();
        if (this.needToProcess) this.process();
        this.needToProcess = false;
        this.clear();
        this.pickingLayers.forEach(function(layer) {
          return _this9.resetWebGLTexture(layer);
        });
        if (!this.graph.order) return exitRender();
        var mouseCaptor = this.mouseCaptor;
        var moving = this.camera.isAnimated() || mouseCaptor.isMoving || mouseCaptor.draggedEvents || mouseCaptor.currentWheelDirection;
        var cameraState = this.camera.getState();
        var viewportDimensions = this.getDimensions();
        var graphDimensions = this.getGraphDimensions();
        var padding = this.getStagePadding();
        this.matrix = matrixFromCamera(cameraState, viewportDimensions, graphDimensions, padding);
        this.invMatrix = matrixFromCamera(cameraState, viewportDimensions, graphDimensions, padding, true);
        this.correctionRatio = getMatrixImpact(this.matrix, cameraState, viewportDimensions);
        this.graphToViewportRatio = this.getGraphToViewportRatio();
        var params = this.getRenderParams();
        for (var type in this.nodePrograms) {
          var program = this.nodePrograms[type];
          program.render(params);
        }
        if (!this.settings.hideEdgesOnMove || !moving) {
          for (var _type7 in this.edgePrograms) {
            var _program2 = this.edgePrograms[_type7];
            _program2.render(params);
          }
        }
        if (this.settings.hideLabelsOnMove && moving) return exitRender();
        this.renderLabels();
        this.renderEdgeLabels();
        this.renderHighlightedNodes();
        return exitRender();
      }
      /**
       * Add a node in the internal data structures.
       * @private
       * @param key The node's graphology ID
       */
    }, {
      key: "addNode",
      value: function addNode2(key) {
        var attr = Object.assign({}, this.graph.getNodeAttributes(key));
        if (this.settings.nodeReducer) attr = this.settings.nodeReducer(key, attr);
        var data = applyNodeDefaults(this.settings, key, attr);
        this.nodeDataCache[key] = data;
        this.nodesWithForcedLabels["delete"](key);
        if (data.forceLabel && !data.hidden) this.nodesWithForcedLabels.add(key);
        this.highlightedNodes["delete"](key);
        if (data.highlighted && !data.hidden) this.highlightedNodes.add(key);
        if (this.settings.zIndex) {
          if (data.zIndex < this.nodeZExtent[0]) this.nodeZExtent[0] = data.zIndex;
          if (data.zIndex > this.nodeZExtent[1]) this.nodeZExtent[1] = data.zIndex;
        }
      }
      /**
       * Update a node the internal data structures.
       * @private
       * @param key The node's graphology ID
       */
    }, {
      key: "updateNode",
      value: function updateNode(key) {
        this.addNode(key);
        var data = this.nodeDataCache[key];
        this.normalizationFunction.applyTo(data);
      }
      /**
       * Remove a node from the internal data structures.
       * @private
       * @param key The node's graphology ID
       */
    }, {
      key: "removeNode",
      value: function removeNode(key) {
        delete this.nodeDataCache[key];
        delete this.nodeProgramIndex[key];
        this.highlightedNodes["delete"](key);
        if (this.hoveredNode === key) this.hoveredNode = null;
        this.nodesWithForcedLabels["delete"](key);
      }
      /**
       * Add an edge into the internal data structures.
       * @private
       * @param key The edge's graphology ID
       */
    }, {
      key: "addEdge",
      value: function addEdge2(key) {
        var attr = Object.assign({}, this.graph.getEdgeAttributes(key));
        if (this.settings.edgeReducer) attr = this.settings.edgeReducer(key, attr);
        var data = applyEdgeDefaults(this.settings, key, attr);
        this.edgeDataCache[key] = data;
        this.edgesWithForcedLabels["delete"](key);
        if (data.forceLabel && !data.hidden) this.edgesWithForcedLabels.add(key);
        if (this.settings.zIndex) {
          if (data.zIndex < this.edgeZExtent[0]) this.edgeZExtent[0] = data.zIndex;
          if (data.zIndex > this.edgeZExtent[1]) this.edgeZExtent[1] = data.zIndex;
        }
      }
      /**
       * Update an edge in the internal data structures.
       * @private
       * @param key The edge's graphology ID
       */
    }, {
      key: "updateEdge",
      value: function updateEdge(key) {
        this.addEdge(key);
      }
      /**
       * Remove an edge from the internal data structures.
       * @private
       * @param key The edge's graphology ID
       */
    }, {
      key: "removeEdge",
      value: function removeEdge(key) {
        delete this.edgeDataCache[key];
        delete this.edgeProgramIndex[key];
        if (this.hoveredEdge === key) this.hoveredEdge = null;
        this.edgesWithForcedLabels["delete"](key);
      }
      /**
       * Clear all indices related to nodes.
       * @private
       */
    }, {
      key: "clearNodeIndices",
      value: function clearNodeIndices() {
        this.labelGrid = new LabelGrid();
        this.nodeExtent = {
          x: [0, 1],
          y: [0, 1]
        };
        this.nodeDataCache = {};
        this.edgeProgramIndex = {};
        this.nodesWithForcedLabels = /* @__PURE__ */ new Set();
        this.nodeZExtent = [Infinity, -Infinity];
        this.highlightedNodes = /* @__PURE__ */ new Set();
      }
      /**
       * Clear all indices related to edges.
       * @private
       */
    }, {
      key: "clearEdgeIndices",
      value: function clearEdgeIndices() {
        this.edgeDataCache = {};
        this.edgeProgramIndex = {};
        this.edgesWithForcedLabels = /* @__PURE__ */ new Set();
        this.edgeZExtent = [Infinity, -Infinity];
      }
      /**
       * Clear all indices.
       * @private
       */
    }, {
      key: "clearIndices",
      value: function clearIndices() {
        this.clearEdgeIndices();
        this.clearNodeIndices();
      }
      /**
       * Clear all graph state related to nodes.
       * @private
       */
    }, {
      key: "clearNodeState",
      value: function clearNodeState() {
        this.displayedNodeLabels = /* @__PURE__ */ new Set();
        this.highlightedNodes = /* @__PURE__ */ new Set();
        this.hoveredNode = null;
      }
      /**
       * Clear all graph state related to edges.
       * @private
       */
    }, {
      key: "clearEdgeState",
      value: function clearEdgeState() {
        this.displayedEdgeLabels = /* @__PURE__ */ new Set();
        this.highlightedNodes = /* @__PURE__ */ new Set();
        this.hoveredEdge = null;
      }
      /**
       * Clear all graph state.
       * @private
       */
    }, {
      key: "clearState",
      value: function clearState() {
        this.clearEdgeState();
        this.clearNodeState();
      }
      /**
       * Add the node data to its program.
       * @private
       * @param node The node's graphology ID
       * @param fingerprint A fingerprint used to identity the node with picking
       * @param position The index where to place the node in the program
       */
    }, {
      key: "addNodeToProgram",
      value: function addNodeToProgram(node, fingerprint, position) {
        var data = this.nodeDataCache[node];
        var nodeProgram = this.nodePrograms[data.type];
        if (!nodeProgram) throw new Error('Sigma: could not find a suitable program for node type "'.concat(data.type, '"!'));
        nodeProgram.process(fingerprint, position, data);
        this.nodeProgramIndex[node] = position;
      }
      /**
       * Add the edge data to its program.
       * @private
       * @param edge The edge's graphology ID
       * @param fingerprint A fingerprint used to identity the edge with picking
       * @param position The index where to place the edge in the program
       */
    }, {
      key: "addEdgeToProgram",
      value: function addEdgeToProgram(edge, fingerprint, position) {
        var data = this.edgeDataCache[edge];
        var edgeProgram = this.edgePrograms[data.type];
        if (!edgeProgram) throw new Error('Sigma: could not find a suitable program for edge type "'.concat(data.type, '"!'));
        var extremities = this.graph.extremities(edge), sourceData = this.nodeDataCache[extremities[0]], targetData = this.nodeDataCache[extremities[1]];
        edgeProgram.process(fingerprint, position, sourceData, targetData, data);
        this.edgeProgramIndex[edge] = position;
      }
      /**---------------------------------------------------------------------------
       * Public API.
       **---------------------------------------------------------------------------
       */
      /**
       * Function used to get the render params.
       *
       * @return {RenderParams}
       */
    }, {
      key: "getRenderParams",
      value: function getRenderParams() {
        return {
          matrix: this.matrix,
          invMatrix: this.invMatrix,
          width: this.width,
          height: this.height,
          pixelRatio: this.pixelRatio,
          zoomRatio: this.camera.ratio,
          cameraAngle: this.camera.angle,
          sizeRatio: 1 / this.scaleSize(),
          correctionRatio: this.correctionRatio,
          downSizingRatio: this.pickingDownSizingRatio,
          minEdgeThickness: this.settings.minEdgeThickness,
          antiAliasingFeather: this.settings.antiAliasingFeather
        };
      }
      /**
       * Function used to retrieve the actual stage padding value.
       *
       * @return {number}
       */
    }, {
      key: "getStagePadding",
      value: function getStagePadding() {
        var _this$settings = this.settings, stagePadding = _this$settings.stagePadding, autoRescale = _this$settings.autoRescale;
        return autoRescale ? stagePadding || 0 : 0;
      }
      /**
       * Function used to create a layer element.
       *
       * @param {string} id - Context's id.
       * @param {string} tag - The HTML tag to use.
       * @param options
       * @return {Sigma}
       */
    }, {
      key: "createLayer",
      value: function createLayer(id, tag) {
        var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        if (this.elements[id]) throw new Error('Sigma: a layer named "'.concat(id, '" already exists'));
        var element = createElement(tag, {
          position: "absolute"
        }, {
          "class": "sigma-".concat(id)
        });
        if (options.style) Object.assign(element.style, options.style);
        this.elements[id] = element;
        if ("beforeLayer" in options && options.beforeLayer) {
          this.elements[options.beforeLayer].before(element);
        } else if ("afterLayer" in options && options.afterLayer) {
          this.elements[options.afterLayer].after(element);
        } else {
          this.container.appendChild(element);
        }
        return element;
      }
      /**
       * Function used to create a canvas element.
       *
       * @param {string} id - Context's id.
       * @param options
       * @return {Sigma}
       */
    }, {
      key: "createCanvas",
      value: function createCanvas(id) {
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        return this.createLayer(id, "canvas", options);
      }
      /**
       * Function used to create a canvas context and add the relevant DOM elements.
       *
       * @param  {string} id - Context's id.
       * @param  options
       * @return {Sigma}
       */
    }, {
      key: "createCanvasContext",
      value: function createCanvasContext(id) {
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var canvas = this.createCanvas(id, options);
        var contextOptions = {
          preserveDrawingBuffer: false,
          antialias: false
        };
        this.canvasContexts[id] = canvas.getContext("2d", contextOptions);
        return this;
      }
      /**
       * Function used to create a WebGL context and add the relevant DOM
       * elements.
       *
       * @param  {string}  id      - Context's id.
       * @param  {object?} options - #getContext params to override (optional)
       * @return {WebGLRenderingContext}
       */
    }, {
      key: "createWebGLContext",
      value: function createWebGLContext(id) {
        var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var canvas = (options === null || options === void 0 ? void 0 : options.canvas) || this.createCanvas(id, options);
        if (options.hidden) canvas.remove();
        var contextOptions = _objectSpread2({
          preserveDrawingBuffer: false,
          antialias: false
        }, options);
        var context;
        context = canvas.getContext("webgl2", contextOptions);
        if (!context) context = canvas.getContext("webgl", contextOptions);
        if (!context) context = canvas.getContext("experimental-webgl", contextOptions);
        var gl = context;
        this.webGLContexts[id] = gl;
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        if (options.picking) {
          this.pickingLayers.add(id);
          var newFrameBuffer = gl.createFramebuffer();
          if (!newFrameBuffer) throw new Error("Sigma: cannot create a new frame buffer for layer ".concat(id));
          this.frameBuffers[id] = newFrameBuffer;
        }
        return gl;
      }
      /**
       * Function used to properly kill a layer.
       *
       * @param  {string} id - Layer id.
       * @return {Sigma}
       */
    }, {
      key: "killLayer",
      value: function killLayer(id) {
        var element = this.elements[id];
        if (!element) throw new Error("Sigma: cannot kill layer ".concat(id, ", which does not exist"));
        if (this.webGLContexts[id]) {
          var _gl$getExtension;
          var gl = this.webGLContexts[id];
          (_gl$getExtension = gl.getExtension("WEBGL_lose_context")) === null || _gl$getExtension === void 0 || _gl$getExtension.loseContext();
          delete this.webGLContexts[id];
        } else if (this.canvasContexts[id]) {
          delete this.canvasContexts[id];
        }
        element.remove();
        delete this.elements[id];
        return this;
      }
      /**
       * Method returning the renderer's camera.
       *
       * @return {Camera}
       */
    }, {
      key: "getCamera",
      value: function getCamera() {
        return this.camera;
      }
      /**
       * Method setting the renderer's camera.
       *
       * @param  {Camera} camera - New camera.
       * @return {Sigma}
       */
    }, {
      key: "setCamera",
      value: function setCamera(camera) {
        this.unbindCameraHandlers();
        this.camera = camera;
        this.bindCameraHandlers();
      }
      /**
       * Method returning the container DOM element.
       *
       * @return {HTMLElement}
       */
    }, {
      key: "getContainer",
      value: function getContainer() {
        return this.container;
      }
      /**
       * Method returning the renderer's graph.
       *
       * @return {Graph}
       */
    }, {
      key: "getGraph",
      value: function getGraph() {
        return this.graph;
      }
      /**
       * Method used to set the renderer's graph.
       *
       * @return {Graph}
       */
    }, {
      key: "setGraph",
      value: function setGraph(graph) {
        if (graph === this.graph) return;
        if (this.hoveredNode && !graph.hasNode(this.hoveredNode)) this.hoveredNode = null;
        if (this.hoveredEdge && !graph.hasEdge(this.hoveredEdge)) this.hoveredEdge = null;
        this.unbindGraphHandlers();
        if (this.checkEdgesEventsFrame !== null) {
          cancelAnimationFrame(this.checkEdgesEventsFrame);
          this.checkEdgesEventsFrame = null;
        }
        this.graph = graph;
        this.bindGraphHandlers();
        this.refresh();
      }
      /**
       * Method returning the mouse captor.
       *
       * @return {MouseCaptor}
       */
    }, {
      key: "getMouseCaptor",
      value: function getMouseCaptor() {
        return this.mouseCaptor;
      }
      /**
       * Method returning the touch captor.
       *
       * @return {TouchCaptor}
       */
    }, {
      key: "getTouchCaptor",
      value: function getTouchCaptor() {
        return this.touchCaptor;
      }
      /**
       * Method returning the current renderer's dimensions.
       *
       * @return {Dimensions}
       */
    }, {
      key: "getDimensions",
      value: function getDimensions() {
        return {
          width: this.width,
          height: this.height
        };
      }
      /**
       * Method returning the current graph's dimensions.
       *
       * @return {Dimensions}
       */
    }, {
      key: "getGraphDimensions",
      value: function getGraphDimensions() {
        var extent = this.customBBox || this.nodeExtent;
        return {
          width: extent.x[1] - extent.x[0] || 1,
          height: extent.y[1] - extent.y[0] || 1
        };
      }
      /**
       * Method used to get all the sigma node attributes.
       * It's useful for example to get the position of a node
       * and to get values that are set by the nodeReducer
       *
       * @param  {string} key - The node's key.
       * @return {NodeDisplayData | undefined} A copy of the desired node's attribute or undefined if not found
       */
    }, {
      key: "getNodeDisplayData",
      value: function getNodeDisplayData(key) {
        var node = this.nodeDataCache[key];
        return node ? Object.assign({}, node) : void 0;
      }
      /**
       * Method used to get all the sigma edge attributes.
       * It's useful for example to get values that are set by the edgeReducer.
       *
       * @param  {string} key - The edge's key.
       * @return {EdgeDisplayData | undefined} A copy of the desired edge's attribute or undefined if not found
       */
    }, {
      key: "getEdgeDisplayData",
      value: function getEdgeDisplayData(key) {
        var edge = this.edgeDataCache[key];
        return edge ? Object.assign({}, edge) : void 0;
      }
      /**
       * Method used to get the set of currently displayed node labels.
       *
       * @return {Set<string>} A set of node keys whose label is displayed.
       */
    }, {
      key: "getNodeDisplayedLabels",
      value: function getNodeDisplayedLabels() {
        return new Set(this.displayedNodeLabels);
      }
      /**
       * Method used to get the set of currently displayed edge labels.
       *
       * @return {Set<string>} A set of edge keys whose label is displayed.
       */
    }, {
      key: "getEdgeDisplayedLabels",
      value: function getEdgeDisplayedLabels() {
        return new Set(this.displayedEdgeLabels);
      }
      /**
       * Method returning a copy of the settings collection.
       *
       * @return {Settings} A copy of the settings collection.
       */
    }, {
      key: "getSettings",
      value: function getSettings() {
        return _objectSpread2({}, this.settings);
      }
      /**
       * Method returning the current value for a given setting key.
       *
       * @param  {string} key - The setting key to get.
       * @return {any} The value attached to this setting key or undefined if not found
       */
    }, {
      key: "getSetting",
      value: function getSetting(key) {
        return this.settings[key];
      }
      /**
       * Method setting the value of a given setting key. Note that this will schedule
       * a new render next frame.
       *
       * @param  {string} key - The setting key to set.
       * @param  {any}    value - The value to set.
       * @return {Sigma}
       */
    }, {
      key: "setSetting",
      value: function setSetting(key, value) {
        var oldValues = _objectSpread2({}, this.settings);
        this.settings[key] = value;
        validateSettings(this.settings);
        this.handleSettingsUpdate(oldValues);
        this.scheduleRefresh();
        return this;
      }
      /**
       * Method updating the value of a given setting key using the provided function.
       * Note that this will schedule a new render next frame.
       *
       * @param  {string}   key     - The setting key to set.
       * @param  {function} updater - The update function.
       * @return {Sigma}
       */
    }, {
      key: "updateSetting",
      value: function updateSetting(key, updater) {
        this.setSetting(key, updater(this.settings[key]));
        return this;
      }
      /**
       * Method setting multiple settings at once.
       *
       * @param  {Partial<Settings>} settings - The settings to set.
       * @return {Sigma}
       */
    }, {
      key: "setSettings",
      value: function setSettings(settings) {
        var oldValues = _objectSpread2({}, this.settings);
        this.settings = _objectSpread2(_objectSpread2({}, this.settings), settings);
        validateSettings(this.settings);
        this.handleSettingsUpdate(oldValues);
        this.scheduleRefresh();
        return this;
      }
      /**
       * Method used to resize the renderer.
       *
       * @param  {boolean} force - If true, then resize is processed even if size is unchanged (optional).
       * @return {Sigma}
       */
    }, {
      key: "resize",
      value: function resize(force) {
        var previousWidth = this.width, previousHeight = this.height;
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.pixelRatio = getPixelRatio();
        if (this.width === 0) {
          if (this.settings.allowInvalidContainer) this.width = 1;
          else throw new Error("Sigma: Container has no width. You can set the allowInvalidContainer setting to true to stop seeing this error.");
        }
        if (this.height === 0) {
          if (this.settings.allowInvalidContainer) this.height = 1;
          else throw new Error("Sigma: Container has no height. You can set the allowInvalidContainer setting to true to stop seeing this error.");
        }
        if (!force && previousWidth === this.width && previousHeight === this.height) return this;
        for (var id in this.elements) {
          var element = this.elements[id];
          element.style.width = this.width + "px";
          element.style.height = this.height + "px";
        }
        for (var _id in this.canvasContexts) {
          this.elements[_id].setAttribute("width", this.width * this.pixelRatio + "px");
          this.elements[_id].setAttribute("height", this.height * this.pixelRatio + "px");
          if (this.pixelRatio !== 1) this.canvasContexts[_id].scale(this.pixelRatio, this.pixelRatio);
        }
        for (var _id2 in this.webGLContexts) {
          this.elements[_id2].setAttribute("width", this.width * this.pixelRatio + "px");
          this.elements[_id2].setAttribute("height", this.height * this.pixelRatio + "px");
          var gl = this.webGLContexts[_id2];
          gl.viewport(0, 0, this.width * this.pixelRatio, this.height * this.pixelRatio);
          if (this.pickingLayers.has(_id2)) {
            var currentTexture = this.textures[_id2];
            if (currentTexture) gl.deleteTexture(currentTexture);
          }
        }
        this.emit("resize");
        return this;
      }
      /**
       * Method used to clear all the canvases.
       *
       * @return {Sigma}
       */
    }, {
      key: "clear",
      value: function clear() {
        this.emit("beforeClear");
        this.webGLContexts.nodes.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null);
        this.webGLContexts.nodes.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);
        this.webGLContexts.edges.bindFramebuffer(WebGLRenderingContext.FRAMEBUFFER, null);
        this.webGLContexts.edges.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);
        this.webGLContexts.hoverNodes.clear(WebGLRenderingContext.COLOR_BUFFER_BIT);
        this.canvasContexts.labels.clearRect(0, 0, this.width, this.height);
        this.canvasContexts.hovers.clearRect(0, 0, this.width, this.height);
        this.canvasContexts.edgeLabels.clearRect(0, 0, this.width, this.height);
        this.emit("afterClear");
        return this;
      }
      /**
       * Method used to refresh, i.e. force the renderer to reprocess graph
       * data and render, but keep the state.
       * - if a partialGraph is provided, we only reprocess those nodes & edges.
       * - if schedule is TRUE, we schedule a render instead of sync render
       * - if skipIndexation is TRUE, then labelGrid & program indexation are skipped (can be used if you haven't modify x, y, zIndex & size)
       *
       * @return {Sigma}
       */
    }, {
      key: "refresh",
      value: function refresh(opts) {
        var _this10 = this;
        var skipIndexation = (opts === null || opts === void 0 ? void 0 : opts.skipIndexation) !== void 0 ? opts === null || opts === void 0 ? void 0 : opts.skipIndexation : false;
        var schedule = (opts === null || opts === void 0 ? void 0 : opts.schedule) !== void 0 ? opts.schedule : false;
        var fullRefresh = !opts || !opts.partialGraph;
        if (fullRefresh) {
          this.clearEdgeIndices();
          this.clearNodeIndices();
          this.graph.forEachNode(function(node2) {
            return _this10.addNode(node2);
          });
          this.graph.forEachEdge(function(edge2) {
            return _this10.addEdge(edge2);
          });
        } else {
          var _opts$partialGraph, _opts$partialGraph2;
          var nodes = ((_opts$partialGraph = opts.partialGraph) === null || _opts$partialGraph === void 0 ? void 0 : _opts$partialGraph.nodes) || [];
          for (var i2 = 0, l2 = (nodes === null || nodes === void 0 ? void 0 : nodes.length) || 0; i2 < l2; i2++) {
            var node = nodes[i2];
            this.updateNode(node);
            if (skipIndexation) {
              var programIndex = this.nodeProgramIndex[node];
              if (programIndex === void 0) throw new Error('Sigma: node "'.concat(node, `" can't be repaint`));
              this.addNodeToProgram(node, this.nodeIndices[node], programIndex);
            }
          }
          var edges = (opts === null || opts === void 0 || (_opts$partialGraph2 = opts.partialGraph) === null || _opts$partialGraph2 === void 0 ? void 0 : _opts$partialGraph2.edges) || [];
          for (var _i4 = 0, _l4 = edges.length; _i4 < _l4; _i4++) {
            var edge = edges[_i4];
            this.updateEdge(edge);
            if (skipIndexation) {
              var _programIndex = this.edgeProgramIndex[edge];
              if (_programIndex === void 0) throw new Error('Sigma: edge "'.concat(edge, `" can't be repaint`));
              this.addEdgeToProgram(edge, this.edgeIndices[edge], _programIndex);
            }
          }
        }
        if (fullRefresh || !skipIndexation) this.needToProcess = true;
        if (schedule) this.scheduleRender();
        else this.render();
        return this;
      }
      /**
       * Method used to schedule a render at the next available frame.
       * This method can be safely called on a same frame because it basically
       * debounces refresh to the next frame.
       *
       * @return {Sigma}
       */
    }, {
      key: "scheduleRender",
      value: function scheduleRender() {
        var _this11 = this;
        if (!this.renderFrame) {
          this.renderFrame = requestAnimationFrame(function() {
            _this11.render();
          });
        }
        return this;
      }
      /**
       * Method used to schedule a refresh (i.e. fully reprocess graph data and render)
       * at the next available frame.
       * This method can be safely called on a same frame because it basically
       * debounces refresh to the next frame.
       *
       * @return {Sigma}
       */
    }, {
      key: "scheduleRefresh",
      value: function scheduleRefresh(opts) {
        return this.refresh(_objectSpread2(_objectSpread2({}, opts), {}, {
          schedule: true
        }));
      }
      /**
       * Method used to (un)zoom, while preserving the position of a viewport point.
       * Used for instance to zoom "on the mouse cursor".
       *
       * @param viewportTarget
       * @param newRatio
       * @return {CameraState}
       */
    }, {
      key: "getViewportZoomedState",
      value: function getViewportZoomedState(viewportTarget, newRatio) {
        var _this$camera$getState = this.camera.getState(), ratio = _this$camera$getState.ratio, angle = _this$camera$getState.angle, x = _this$camera$getState.x, y2 = _this$camera$getState.y;
        var _this$settings2 = this.settings, minCameraRatio = _this$settings2.minCameraRatio, maxCameraRatio = _this$settings2.maxCameraRatio;
        if (typeof maxCameraRatio === "number") newRatio = Math.min(newRatio, maxCameraRatio);
        if (typeof minCameraRatio === "number") newRatio = Math.max(newRatio, minCameraRatio);
        var ratioDiff = newRatio / ratio;
        var center = {
          x: this.width / 2,
          y: this.height / 2
        };
        var graphMousePosition = this.viewportToFramedGraph(viewportTarget);
        var graphCenterPosition = this.viewportToFramedGraph(center);
        return {
          angle,
          x: (graphMousePosition.x - graphCenterPosition.x) * (1 - ratioDiff) + x,
          y: (graphMousePosition.y - graphCenterPosition.y) * (1 - ratioDiff) + y2,
          ratio: newRatio
        };
      }
      /**
       * Method returning the abstract rectangle containing the graph according
       * to the camera's state.
       *
       * @return {object} - The view's rectangle.
       */
    }, {
      key: "viewRectangle",
      value: function viewRectangle() {
        var p1 = this.viewportToFramedGraph({
          x: 0,
          y: 0
        }), p2 = this.viewportToFramedGraph({
          x: this.width,
          y: 0
        }), h2 = this.viewportToFramedGraph({
          x: 0,
          y: this.height
        });
        return {
          x1: p1.x,
          y1: p1.y,
          x2: p2.x,
          y2: p2.y,
          height: p2.y - h2.y
        };
      }
      /**
       * Method returning the coordinates of a point from the framed graph system to the viewport system. It allows
       * overriding anything that is used to get the translation matrix, or even the matrix itself.
       *
       * Be careful if overriding dimensions, padding or cameraState, as the computation of the matrix is not the lightest
       * of computations.
       */
    }, {
      key: "framedGraphToViewport",
      value: function framedGraphToViewport(coordinates) {
        var override = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var recomputeMatrix = !!override.cameraState || !!override.viewportDimensions || !!override.graphDimensions;
        var matrix = override.matrix ? override.matrix : recomputeMatrix ? matrixFromCamera(override.cameraState || this.camera.getState(), override.viewportDimensions || this.getDimensions(), override.graphDimensions || this.getGraphDimensions(), override.padding || this.getStagePadding()) : this.matrix;
        var viewportPos = multiplyVec2(matrix, coordinates);
        return {
          x: (1 + viewportPos.x) * this.width / 2,
          y: (1 - viewportPos.y) * this.height / 2
        };
      }
      /**
       * Method returning the coordinates of a point from the viewport system to the framed graph system. It allows
       * overriding anything that is used to get the translation matrix, or even the matrix itself.
       *
       * Be careful if overriding dimensions, padding or cameraState, as the computation of the matrix is not the lightest
       * of computations.
       */
    }, {
      key: "viewportToFramedGraph",
      value: function viewportToFramedGraph(coordinates) {
        var override = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var recomputeMatrix = !!override.cameraState || !!override.viewportDimensions || !override.graphDimensions;
        var invMatrix = override.matrix ? override.matrix : recomputeMatrix ? matrixFromCamera(override.cameraState || this.camera.getState(), override.viewportDimensions || this.getDimensions(), override.graphDimensions || this.getGraphDimensions(), override.padding || this.getStagePadding(), true) : this.invMatrix;
        var res = multiplyVec2(invMatrix, {
          x: coordinates.x / this.width * 2 - 1,
          y: 1 - coordinates.y / this.height * 2
        });
        if (isNaN(res.x)) res.x = 0;
        if (isNaN(res.y)) res.y = 0;
        return res;
      }
      /**
       * Method used to translate a point's coordinates from the viewport system (pixel distance from the top-left of the
       * stage) to the graph system (the reference system of data as they are in the given graph instance).
       *
       * This method accepts an optional camera which can be useful if you need to translate coordinates
       * based on a different view than the one being currently being displayed on screen.
       *
       * @param {Coordinates}                  viewportPoint
       * @param {CoordinateConversionOverride} override
       */
    }, {
      key: "viewportToGraph",
      value: function viewportToGraph(viewportPoint) {
        var override = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        return this.normalizationFunction.inverse(this.viewportToFramedGraph(viewportPoint, override));
      }
      /**
       * Method used to translate a point's coordinates from the graph system (the reference system of data as they are in
       * the given graph instance) to the viewport system (pixel distance from the top-left of the stage).
       *
       * This method accepts an optional camera which can be useful if you need to translate coordinates
       * based on a different view than the one being currently being displayed on screen.
       *
       * @param {Coordinates}                  graphPoint
       * @param {CoordinateConversionOverride} override
       */
    }, {
      key: "graphToViewport",
      value: function graphToViewport(graphPoint) {
        var override = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        return this.framedGraphToViewport(this.normalizationFunction(graphPoint), override);
      }
      /**
       * Method returning the distance multiplier between the graph system and the
       * viewport system.
       */
    }, {
      key: "getGraphToViewportRatio",
      value: function getGraphToViewportRatio() {
        var graphP1 = {
          x: 0,
          y: 0
        };
        var graphP2 = {
          x: 1,
          y: 1
        };
        var graphD = Math.sqrt(Math.pow(graphP1.x - graphP2.x, 2) + Math.pow(graphP1.y - graphP2.y, 2));
        var viewportP1 = this.graphToViewport(graphP1);
        var viewportP2 = this.graphToViewport(graphP2);
        var viewportD = Math.sqrt(Math.pow(viewportP1.x - viewportP2.x, 2) + Math.pow(viewportP1.y - viewportP2.y, 2));
        return viewportD / graphD;
      }
      /**
       * Method returning the graph's bounding box.
       *
       * @return {{ x: Extent, y: Extent }}
       */
    }, {
      key: "getBBox",
      value: function getBBox() {
        return this.nodeExtent;
      }
      /**
       * Method returning the graph's custom bounding box, if any.
       *
       * @return {{ x: Extent, y: Extent } | null}
       */
    }, {
      key: "getCustomBBox",
      value: function getCustomBBox() {
        return this.customBBox;
      }
      /**
       * Method used to override the graph's bounding box with a custom one. Give `null` as the argument to stop overriding.
       *
       * @return {Sigma}
       */
    }, {
      key: "setCustomBBox",
      value: function setCustomBBox(customBBox) {
        this.customBBox = customBBox;
        this.scheduleRender();
        return this;
      }
      /**
       * Method used to shut the container & release event listeners.
       *
       * @return {undefined}
       */
    }, {
      key: "kill",
      value: function kill() {
        this.emit("kill");
        this.removeAllListeners();
        this.unbindCameraHandlers();
        window.removeEventListener("resize", this.activeListeners.handleResize);
        this.mouseCaptor.kill();
        this.touchCaptor.kill();
        this.unbindGraphHandlers();
        this.clearIndices();
        this.clearState();
        this.nodeDataCache = {};
        this.edgeDataCache = {};
        this.highlightedNodes.clear();
        if (this.renderFrame) {
          cancelAnimationFrame(this.renderFrame);
          this.renderFrame = null;
        }
        if (this.renderHighlightedNodesFrame) {
          cancelAnimationFrame(this.renderHighlightedNodesFrame);
          this.renderHighlightedNodesFrame = null;
        }
        var container = this.container;
        while (container.firstChild) container.removeChild(container.firstChild);
        for (var type in this.nodePrograms) {
          this.nodePrograms[type].kill();
        }
        for (var _type8 in this.nodeHoverPrograms) {
          this.nodeHoverPrograms[_type8].kill();
        }
        for (var _type9 in this.edgePrograms) {
          this.edgePrograms[_type9].kill();
        }
        this.nodePrograms = {};
        this.nodeHoverPrograms = {};
        this.edgePrograms = {};
        for (var id in this.elements) {
          this.killLayer(id);
        }
        this.canvasContexts = {};
        this.webGLContexts = {};
        this.elements = {};
      }
      /**
       * Method used to scale the given size according to the camera's ratio, i.e.
       * zooming state.
       *
       * @param  {number?} size -        The size to scale (node size, edge thickness etc.).
       * @param  {number?} cameraRatio - A camera ratio (defaults to the actual camera ratio).
       * @return {number}              - The scaled size.
       */
    }, {
      key: "scaleSize",
      value: function scaleSize() {
        var size = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1;
        var cameraRatio = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.camera.ratio;
        return size / this.settings.zoomToSizeRatioFunction(cameraRatio) * (this.getSetting("itemSizesReference") === "positions" ? cameraRatio * this.graphToViewportRatio : 1);
      }
      /**
       * Method that returns the collection of all used canvases.
       * At the moment, the instantiated canvases are the following, and in the
       * following order in the DOM:
       * - `edges`
       * - `nodes`
       * - `edgeLabels`
       * - `labels`
       * - `hovers`
       * - `hoverNodes`
       * - `mouse`
       *
       * @return {PlainObject<HTMLCanvasElement>} - The collection of canvases.
       */
    }, {
      key: "getCanvases",
      value: function getCanvases() {
        var res = {};
        for (var layer in this.elements) if (this.elements[layer] instanceof HTMLCanvasElement) res[layer] = this.elements[layer];
        return res;
      }
    }]);
  })(TypedEventEmitter);

  // node_modules/@react-sigma/core/lib/react-sigma_core.esm.min.js
  var d = (0, import_react2.createContext)(null);
  var f = d.Provider;
  function h() {
    const e2 = (0, import_react2.useContext)(d);
    if (null == e2) throw new Error("No context provided: useSigmaContext() can only be used in a descendant of <SigmaContainer>");
    return e2;
  }
  function v() {
    return h().sigma;
  }
  function p() {
    const { sigma: e2 } = h();
    return (0, import_react2.useCallback)(((t2) => {
      e2 && Object.keys(t2).forEach(((n2) => {
        e2.setSetting(n2, t2[n2]);
      }));
    }), [e2]);
  }
  function w(e2) {
    return new Set(Object.keys(e2));
  }
  var b = w({ clickNode: true, rightClickNode: true, downNode: true, enterNode: true, leaveNode: true, doubleClickNode: true, wheelNode: true, clickEdge: true, rightClickEdge: true, downEdge: true, enterEdge: true, leaveEdge: true, doubleClickEdge: true, wheelEdge: true, clickStage: true, rightClickStage: true, downStage: true, doubleClickStage: true, wheelStage: true, beforeRender: true, afterRender: true, kill: true, upStage: true, upEdge: true, upNode: true, enterStage: true, leaveStage: true, resize: true, afterClear: true, afterProcess: true, beforeClear: true, beforeProcess: true, moveBody: true });
  var E = w({ click: true, rightClick: true, doubleClick: true, mouseup: true, mousedown: true, mousemove: true, mousemovebody: true, mouseleave: true, mouseenter: true, wheel: true });
  var _ = w({ touchup: true, touchdown: true, touchmove: true, touchmovebody: true, tap: true, doubletap: true });
  var O = w({ updated: true });
  function y() {
    const e2 = v(), t2 = p(), [n2, r2] = (0, import_react2.useState)({});
    return (0, import_react2.useEffect)((() => {
      if (!e2 || !n2) return;
      const t3 = n2, r3 = Object.keys(t3);
      return r3.forEach(((n3) => {
        const r4 = t3[n3];
        b.has(n3) && e2.on(n3, r4), E.has(n3) && e2.getMouseCaptor().on(n3, r4), _.has(n3) && e2.getTouchCaptor().on(n3, r4), O.has(n3) && e2.getCamera().on(n3, r4);
      })), () => {
        e2 && r3.forEach(((n3) => {
          const r4 = t3[n3];
          b.has(n3) && e2.off(n3, r4), E.has(n3) && e2.getMouseCaptor().off(n3, r4), _.has(n3) && e2.getTouchCaptor().off(n3, r4), O.has(n3) && e2.getCamera().off(n3, r4);
        }));
      };
    }), [e2, n2, t2]), r2;
  }
  function C() {
    const e2 = v();
    return (0, import_react2.useCallback)(((t2, n2 = true) => {
      e2 && t2 && (n2 && e2.getGraph().order > 0 && e2.getGraph().clear(), e2.getGraph().import(t2), e2.refresh());
    }), [e2]);
  }
  function j(e2, t2) {
    if (e2 === t2) return true;
    if ("object" == typeof e2 && null != e2 && "object" == typeof t2 && null != t2) {
      if (Object.keys(e2).length != Object.keys(t2).length) return false;
      for (const n2 in e2) {
        if (!Object.hasOwn(t2, n2)) return false;
        if (!j(e2[n2], t2[n2])) return false;
      }
      return true;
    }
    return false;
  }
  var S = (0, import_react2.forwardRef)((({ graph: e2, id: n2, className: r2, style: a2, settings: s2 = {}, children: d2 }, h2) => {
    const v2 = (0, import_react2.useRef)(null), p2 = (0, import_react2.useRef)(null), w2 = { className: `react-sigma ${r2 || ""}`, id: n2, style: a2 }, [b2, E2] = (0, import_react2.useState)(null), [_2, O2] = (0, import_react2.useState)(s2);
    (0, import_react2.useEffect)((() => {
      O2(((e3) => j(e3, s2) ? e3 : s2));
    }), [s2]), (0, import_react2.useEffect)((() => {
      let t2 = null;
      if (null !== p2.current) {
        let n3 = new Graph();
        e2 && (n3 = "function" == typeof e2 ? new e2() : e2), t2 = new Sigma$1(n3, p2.current, _2), E2(((e3) => {
          let n4 = null;
          return e3 && (n4 = e3.getCamera().getState()), n4 && t2.getCamera().setState(n4), t2;
        }));
      }
      return () => {
        t2 && t2.kill();
      };
    }), [p2, e2, _2]), (0, import_react2.useImperativeHandle)(h2, (() => b2), [b2]);
    const y2 = (0, import_react2.useMemo)((() => b2 && v2.current ? { sigma: b2, container: v2.current } : null), [b2, v2]), C2 = null !== y2 ? import_react2.default.createElement(f, { value: y2 }, d2) : null;
    return import_react2.default.createElement("div", Object.assign({}, w2, { ref: v2 }), import_react2.default.createElement("div", { className: "sigma-container", ref: p2 }), C2);
  }));

  // src/views/defaultViews/DebugGraphView.tsx
  var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
  var SigmaGraph = (props) => {
    const { data, config, onNodeClick, onNodeHover, onEdgeClick, onEdgeHover, hoveredNode, hoveredEdge, width, height } = props;
    const sigma = v();
    const registerEvents = y();
    const setSettings = p();
    const loadGraph = C();
    import_react3.default.useEffect(() => {
      if (!sigma) {
        return;
      }
      if (!data || !data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
        return;
      }
      const graph = new DirectedGraph();
      data.nodes.forEach((node, index) => {
        const nodeId = node.id || `node-${index}`;
        if (graph.hasNode(nodeId)) {
          return;
        }
        graph.addNode(nodeId, {
          size: config.nodeSize || 8,
          color: config.nodeColor || "#4a90e2",
          x: Math.random() * 100,
          y: Math.random() * 100,
          originalColor: config.nodeColor || "#4a90e2",
          originalSize: config.nodeSize || 8,
          label: node.label || nodeId,
          nodeData: node
        });
      });
      if (data.edges && Array.isArray(data.edges)) {
        data.edges.forEach((edge, index) => {
          if (edge.source && edge.target) {
            try {
              graph.addEdge(edge.source, edge.target, {
                size: config.edgeSize || 1,
                color: config.edgeColor || "#999",
                type: "line",
                originalColor: config.edgeColor || "#999",
                originalSize: config.edgeSize || 1,
                edgeData: edge
              });
            } catch (error) {
              console.warn(`[SigmaDebugGraph] Could not add edge ${index}:`, error);
            }
          }
        });
      }
      loadGraph(graph);
      setSettings({
        nodeReducer: (node, data2) => {
          const isHovered = hoveredNode === node;
          const isConnected = isHovered || (hoveredNode ? graph.areNeighbors(hoveredNode, node) : false);
          const isEdgeHovered = hoveredEdge !== null;
          const dimmed = hoveredNode !== null && !isHovered && !isConnected || hoveredEdge !== null && !isEdgeHovered;
          return {
            ...data2,
            size: isHovered ? (data2.originalSize || 8) * 2 : data2.originalSize || 8,
            color: isHovered ? "#ff6600" : dimmed ? "#cccccc" : data2.originalColor || "#4a90e2",
            label: data2.label || node,
            zIndex: isHovered ? 10 : dimmed ? 0 : 1
          };
        },
        edgeReducer: (edge, data2) => {
          const isHovered = hoveredEdge === edge;
          const isConnectedToHoveredNode = hoveredNode !== null && (graph.source(edge) === hoveredNode || graph.target(edge) === hoveredNode);
          const dimmed = hoveredNode !== null && !isConnectedToHoveredNode || hoveredEdge !== null && !isHovered;
          return {
            ...data2,
            size: isHovered ? (data2.originalSize || 1) * 3 : isConnectedToHoveredNode ? (data2.originalSize || 1) * 1.5 : data2.originalSize || 1,
            color: isHovered ? "#ff6600" : isConnectedToHoveredNode ? "#ff9900" : dimmed ? "#dddddd" : data2.originalColor || "#999",
            zIndex: isHovered ? 10 : isConnectedToHoveredNode ? 5 : dimmed ? 0 : 1
          };
        },
        renderLabels: true,
        defaultDrawEdgeLabel: () => {
        },
        defaultDrawNodeLabel: (node, context, settings) => {
          const label = node.label || node.id || "";
          if (!label) return;
          context.font = `${settings.labelSize || 12}px ${settings.labelFont || "sans-serif"}`;
          context.fillStyle = settings.labelColor || "#333";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText(label, node.x, node.y + (node.size || 8) + 4);
        },
        enableHovering: false,
        zIndex: true,
        labelRenderedSizeThreshold: 0,
        labelDensity: 0.07,
        labelFont: "sans-serif",
        labelSize: config.labelSize || 12,
        labelColor: config.labelColor || "#333",
        labelThreshold: config.labelThreshold || 5
      });
      registerEvents({
        clickNode: (event) => {
          const node = graph.getNodeAttributes(event.node);
          if (onNodeClick) {
            onNodeClick({ id: event.node, ...node });
          }
        },
        clickEdge: (event) => {
          const edge = graph.getEdgeAttributes(event.edge);
          if (onEdgeClick) {
            onEdgeClick({ id: event.edge, ...edge });
          }
        },
        enterNode: (event) => {
          if (onNodeHover) {
            const node = graph.getNodeAttributes(event.node);
            onNodeHover({ id: event.node, ...node });
          }
        },
        leaveNode: () => {
          if (onNodeHover) {
            onNodeHover(null);
          }
        },
        enterEdge: (event) => {
          if (onEdgeHover) {
            const edge = graph.getEdgeAttributes(event.edge);
            onEdgeHover({ id: event.edge, ...edge });
          }
        },
        leaveEdge: () => {
          if (onEdgeHover) {
            onEdgeHover(null);
          }
        }
      });
      const container = sigma.getContainer();
      const timer = setTimeout(() => {
        if (sigma && sigma.getCamera()) {
          sigma.getCamera().animatedReset({ duration: 500 });
          sigma.refresh();
        }
        if (container) {
          if (container.clientWidth === 0 || container.clientHeight === 0) {
            window.dispatchEvent(new Event("resize"));
          }
        }
      }, 100);
      const resizeObserver = new ResizeObserver(() => {
        if (sigma && sigma.getCamera()) {
          sigma.refresh();
        }
      });
      if (container) {
        resizeObserver.observe(container);
      }
      return () => {
        clearTimeout(timer);
        resizeObserver.disconnect();
      };
    }, [data, config, loadGraph, setSettings, registerEvents, sigma, onNodeClick, onNodeHover, onEdgeClick, onEdgeHover, hoveredNode, hoveredEdge, width, height]);
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, {});
  };
  var DebugGraph = class extends BaseViewClass {
    constructor(props) {
      super(props);
      __publicField(this, "selectedElement", null);
      __publicField(this, "hoveredNode", null);
      __publicField(this, "hoveredEdge", null);
      __publicField(this, "handleNodeClick", (node) => {
        this.selectedElement = { type: "node", id: node.id, data: node };
        this.setState({ selectedElement: this.selectedElement });
      });
      __publicField(this, "handleEdgeClick", (edge) => {
        this.selectedElement = { type: "edge", id: edge.id, data: edge };
        this.setState({ selectedElement: this.selectedElement });
      });
      __publicField(this, "handleNodeHover", (node) => {
        this.hoveredNode = node ? node.id : null;
        this.setState({ hoveredNode: this.hoveredNode });
      });
      __publicField(this, "handleEdgeHover", (edge) => {
        this.hoveredEdge = edge ? edge.id : null;
        this.setState({ hoveredEdge: this.hoveredEdge });
      });
      this.state = { ...this.state, selectedElement: null, hoveredNode: null, hoveredEdge: null };
    }
    get config() {
      return this.props.config || {
        nodeColor: "#4a90e2",
        edgeColor: "#999",
        nodeSize: 5,
        edgeSize: 1,
        showLabels: true,
        labelSize: 12,
        labelColor: "#333",
        labelThreshold: 5
      };
    }
    renderDetailsPanel() {
      const selected = this.state.selectedElement;
      if (!selected) {
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
          padding: "12px",
          backgroundColor: "#f0f0f0",
          borderTop: "1px solid #ccc",
          fontSize: "13px",
          color: "#666",
          minHeight: "60px"
        }, children: "Click a node or edge to see its details here." });
      }
      const data = selected.data;
      const entries = Object.entries(data).filter(([key]) => key !== "nodeData" && key !== "edgeData" && key !== "originalColor" && key !== "originalSize");
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: {
        padding: "12px",
        backgroundColor: "#f0f0f0",
        borderTop: "1px solid #ccc",
        fontSize: "13px",
        maxHeight: "200px",
        overflowY: "auto"
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { fontWeight: "bold", marginBottom: "8px", color: "#333" }, children: [
          selected.type === "node" ? "Node" : "Edge",
          ": ",
          selected.id
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("table", { style: { width: "100%", borderCollapse: "collapse" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("tbody", { children: entries.map(([key, value]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("tr", { style: { borderBottom: "1px solid #ddd" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: { padding: "4px 8px", fontWeight: 600, color: "#555", width: "120px", verticalAlign: "top" }, children: key }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("td", { style: { padding: "4px 8px", color: "#333", wordBreak: "break-all" }, children: typeof value === "object" ? JSON.stringify(value, null, 2) : String(value) })
        ] }, key)) }) })
      ] });
    }
    renderSidePanel() {
      const data = this.state.data;
      if (!data) return null;
      const nodes = data.nodes || [];
      const edges = data.edges || [];
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: {
        width: "300px",
        minWidth: "300px",
        borderLeft: "1px solid #ccc",
        backgroundColor: "#fafafa",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        fontSize: "12px"
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: {
          padding: "8px",
          borderBottom: "1px solid #ccc",
          backgroundColor: "#e0e0e0",
          fontWeight: "bold"
        }, children: [
          "Nodes (",
          nodes.length,
          ")"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { flex: 1, overflowY: "auto", padding: "4px" }, children: nodes.map((node, idx) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "div",
          {
            style: {
              padding: "4px 6px",
              margin: "2px 0",
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "11px"
            },
            onClick: () => {
              this.handleNodeClick({ id: node.id, ...node });
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontWeight: 600, color: "#333" }, children: node.label || node.id || `node-${idx}` }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { color: "#666", fontSize: "10px" }, children: [
                "id: ",
                node.id,
                node.type && typeof node.type === "object" && node.type.category ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                  " | type: ",
                  node.type.category,
                  "/",
                  node.type.type
                ] }) : node.type ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                  " | type: ",
                  typeof node.type === "string" ? node.type : JSON.stringify(node.type)
                ] }) : null
              ] })
            ]
          },
          node.id || idx
        )) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: {
          padding: "8px",
          borderTop: "1px solid #ccc",
          borderBottom: "1px solid #ccc",
          backgroundColor: "#e0e0e0",
          fontWeight: "bold"
        }, children: [
          "Edges (",
          edges.length,
          ")"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { flex: 1, overflowY: "auto", padding: "4px" }, children: edges.map((edge, idx) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
          "div",
          {
            style: {
              padding: "4px 6px",
              margin: "2px 0",
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "11px"
            },
            onClick: () => {
              this.handleEdgeClick({ id: `edge-${idx}`, ...edge });
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { fontWeight: 600, color: "#333" }, children: [
                edge.source,
                " \u2192 ",
                edge.target
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { color: "#666", fontSize: "10px" }, children: edge.attributes?.type && typeof edge.attributes.type === "object" && edge.attributes.type.category ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                "type: ",
                edge.attributes.type.category,
                "/",
                edge.attributes.type.type
              ] }) : edge.attributes?.type ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                "type: ",
                typeof edge.attributes.type === "string" ? edge.attributes.type : JSON.stringify(edge.attributes.type)
              ] }) : null })
            ]
          },
          idx
        )) })
      ] });
    }
    renderContent() {
      const { width = 800, height = 600 } = this.props;
      const data = this.state.data;
      console.log(`[DebugGraphView.renderContent] width: ${width}, height: ${height}, has data: ${!!data}`);
      if (!data) {
        console.error("[DebugGraphView] No graph data available");
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 255, 0.1)"
        }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: "Loading graph data..." }) });
      }
      const config = this.config;
      const actualWidth = Math.max(width > 0 ? width : 800, 400);
      const actualHeight = Math.max(height > 0 ? height : 600, 400);
      console.log(`[DebugGraphView] Actual dimensions: ${actualWidth}x${actualHeight}`);
      if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 255, 0.1)"
        }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: "No graph nodes available" }) });
      }
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: {
        width: `${actualWidth}px`,
        minWidth: "400px",
        position: "relative",
        display: "flex",
        flexDirection: "row"
      }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: {
          flex: 1,
          display: "flex",
          flexDirection: "column"
        }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "div",
            {
              style: {
                height: `${actualHeight}px`,
                overflow: "hidden",
                minHeight: "400px",
                position: "relative"
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_react3.default.Suspense, { fallback: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: {
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: "Loading Sigma.js graph viewer..." }) }), children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                S,
                {
                  style: {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%"
                  },
                  settings: {
                    renderLabels: true,
                    defaultDrawEdgeLabel: () => {
                    },
                    defaultDrawNodeLabel: (node, context, settings) => {
                      const label = node.label || node.id || "";
                      if (!label) return;
                      context.font = `${settings.labelSize || 12}px ${settings.labelFont || "sans-serif"}`;
                      context.fillStyle = settings.labelColor || "#333";
                      context.textAlign = "center";
                      context.textBaseline = "middle";
                      context.fillText(label, node.x, node.y + (node.size || 8) + 4);
                    },
                    enableHovering: false,
                    zIndex: true,
                    defaultNodeColor: config.nodeColor || "#4a90e2",
                    defaultEdgeColor: config.edgeColor || "#999",
                    defaultNodeSize: config.nodeSize || 5,
                    defaultEdgeSize: config.edgeSize || 1,
                    allowInvalidContainer: true,
                    autoResize: true,
                    camera: {
                      ratio: 1,
                      angle: 0,
                      x: 0.5,
                      y: 0.5
                    },
                    labelRenderedSizeThreshold: 0,
                    labelDensity: 0.07,
                    labelFont: "sans-serif",
                    labelSize: config.labelSize || 12,
                    labelColor: config.labelColor || "#333",
                    labelThreshold: config.labelThreshold || 5
                  },
                  graph: null,
                  initialSettings: {
                    autoResize: true,
                    allowInvalidContainer: false,
                    renderLabels: true,
                    defaultDrawEdgeLabel: () => {
                    },
                    defaultDrawNodeLabel: (node, context, settings) => {
                      const label = node.label || node.id || "";
                      if (!label) return;
                      context.font = `${settings.labelSize || 12}px ${settings.labelFont || "sans-serif"}`;
                      context.fillStyle = settings.labelColor || "#333";
                      context.textAlign = "center";
                      context.textBaseline = "middle";
                      context.fillText(label, node.x, node.y + (node.size || 8) + 4);
                    },
                    enableHovering: false,
                    labelRenderedSizeThreshold: 0,
                    labelDensity: 0.07,
                    labelFont: "sans-serif",
                    labelSize: config.labelSize || 12,
                    labelColor: config.labelColor || "#333",
                    labelThreshold: config.labelThreshold || 5
                  },
                  children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
                    SigmaGraph,
                    {
                      data,
                      config,
                      width: actualWidth,
                      height: actualHeight,
                      onNodeClick: this.handleNodeClick,
                      onNodeHover: this.handleNodeHover,
                      onEdgeClick: this.handleEdgeClick,
                      onEdgeHover: this.handleEdgeHover,
                      hoveredNode: this.state.hoveredNode,
                      hoveredEdge: this.state.hoveredEdge
                    }
                  )
                }
              ) })
            }
          ),
          this.renderDetailsPanel()
        ] }),
        this.renderSidePanel()
      ] });
    }
  };
  var DebugGraphView = ({
    slicePath,
    width = 800,
    height = 600
  }) => {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      DebugGraph,
      {
        slicePath,
        width,
        height
      }
    );
  };
  var DebugGraphView_default = DebugGraphView;

  // testeranto/views/DebugGraph.wrapper.tsx
  var rootElement = document.getElementById("root");
  if (rootElement) {
    const root = import_client.default.createRoot(rootElement);
    root.render(
      import_react4.default.createElement(DebugGraphView_default, {
        slicePath: "/~/views/DebugGraph/slice"
      })
    );
  }
})();
/*! Bundled license information:

react/cjs/react.production.js:
  (**
   * @license React
   * react.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

scheduler/cjs/scheduler.production.js:
  (**
   * @license React
   * scheduler.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom.production.js:
  (**
   * @license React
   * react-dom.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react-dom/cjs/react-dom-client.production.js:
  (**
   * @license React
   * react-dom-client.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)

react/cjs/react-jsx-runtime.production.js:
  (**
   * @license React
   * react-jsx-runtime.production.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
