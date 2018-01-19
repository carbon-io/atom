/***************************************************************************************************
 *
 * Copyright (c) 2012 ObjectLabs Corporation
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:

 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
var Module    = require('module')
var assert    = require('assert')
var inherits  = require('util').inherits

var _         = require('lodash')

var __        = require('@carbon-io/fibers').__(module)
var _o        = require('@carbon-io/bond')._o // We intentionally do not call _o(module) here because we bind it later
var argparser = require('@carbon-io/nomnom')

/***************************************************************************************************
 * CONSTANTS
 */
var CMDARGS_FIELD               = 'cmdargs'
var ENVIRONMENT_VARIABLES_FIELD = 'environmentVariables'
var PRIVATE_ENV_FIELD           = '__privateEnv'
var TYPE_FIELD                  = '_type'
var CTOR_NAME_FIELD             = '_ctorName'

var PROPERTY_PATH_LEADER        = '$'
var MERGE_FIELD                 = '$merge'
var DELETE_FIELD                = '$delete'
var MULTI_OP_FIELD              = '$multiop'
var PROPERTY_FIELD              = '$property'

var OPERATORS = {
  MERGE: MERGE_FIELD,
  DELETE: DELETE_FIELD,
  MULTI_OP: MULTI_OP_FIELD,
  PROPERTY: PROPERTY_FIELD
}

/***************************************************************************************************
 * @constructs Atom
 * @description Supports both object and class construction functions ``o`` and ``oo``
 * @memberof atom
 * @ignore
 */
function Atom(typeResolver) {
  /*****************************************************************************
   * @property {Function} _typeReslover -- A function that takes a single argument
   *                                       (usually a string, e.g., a path) and returns
   *                                       the constructor that it corresponds to (see:
   *                                       ``@carbon-io/bond``)
   */
  this._typeResolver = typeResolver || _o

  /*****************************************************************************
   * @property {Object} _argparser -- An instance of the argument parser responsible
   *                                  for processing command line arguments
   */
  this._argparser = argparser()
}

/***************************************************************************************************
 * @class Atom
 * @ignore
 */
Atom.prototype = { // XXX did we just overwrite Atom.prototype.constructor? Yes but we fix below (decide)

  /*****************************************************************************
   * @property {Array.<String>} ignoreFields
   * @description An array of field names to ignore when processing an object
   * @todo REMOVE
   */
  ignoreFields : [],

  /*****************************************************************************
   * @property {Function} _typeResolver
   * @todo REMOVE
   */
  _typeResolver : null,

  /*****************************************************************************
   * @property {Object} _argparser
   * @todo REMOVE
   */
  _argparser: null,

  /*****************************************************************************
   * @method make
   * @description "Makes" an object or class. This method does the heavy lifting for
   *              the :js:func:`~atom.o` and :js:func:`~atom.oo` functions and returns
   *              the object or class being constructed.
   * @param {Object} datum -- An object describing an instance or class
   * @param {Object|string} targetType -- The instance type or prototype constructor
   *                                      depending on whether we are instantiating an
   *                                      object or building a class
   * @param {Object} args -- Arguments to pass to the constructor if we are instantiating
   *                         an object
   * @param {boolean} isClass -- Whether or not we instantiating an object or creating
   *                             a class
   * @param {Object} mod -- The module context that this is being called in (note, this
   *                        is used to determine whether or not to call ``main``)
   * @param {boolean} main -- Whether or not main should be called (note, this also depends
   *                          on ``require.main`` and ``mod``)
   * @returns {*}
   * @throws {Error}
   */
  make: function(datum, targetType, args, isClass, mod, main) {
    let dtype = typeof(datum)
    let value = datum

    switch(dtype) {
      case 'string':
      case 'boolean':
      case 'number':
      case 'function':
      case 'undefined':
        // noop
        break
      case 'object':
        if (_.isNull(datum)) {
          // noop
        } else {
          value = this._makeObject(datum, targetType, args, isClass, mod, main);
        }
        break
      default:
        throw new Error("Unable to make from datum: " + datum);
    }

    return value
  },

  /*****************************************************************************
   * @method _makeObject
   * @description Makes an instance of "targetType" using "datum"
   * @param {Object} datum -- An object describing an instance or class
   * @param {Object|string} targetType -- The instance type or prototype constructor
   *                                      depending on whether we are instantiating an
   *                                      object or building a class
   * @param {Object} args -- Arguments to pass to the constructor if we are instantiating
   *                         an object
   * @param {boolean} isClass -- Whether or not we instantiating an object or creating
   *                             a class
   * @param {Object} mod -- The module context that this is being called in (note, this
   *                        is used to determine whether or not to call ``main``)
   * @param {boolean} main -- Whether or not main should be called (note, this also depends
   *                          on ``require.main`` and ``mod``)
   * @returns {Object|Function}
   * @throws {Error}
   */
  _makeObject: function(datum, targetType, args, isClass, mod, main) {
    if (datum._ref) {
      return _o(mod)(datum._ref) // XXX is this still in play?
    }

    // instantiate object
    var result = this.instantiate(datum, targetType, args, isClass, mod)

    // define properties
    this._defineProperties(datum, isClass, result)

    if (!isClass) { // only applies to objects not classes
      // initialize
      this._initializeObject(result, args)
      // run main (will only run in right conditions)
      if (main) {
        if (result._main && require.main && (require.main === mod)) { // Only run main if in main module
          this._registerSignalHandlers(result)
          this._runMain(result)
        }
      }
    }

    return result
  },

  /*****************************************************************************
   * @method _defineProperties
   * @description Iterates over the properties in "datum" and sets them on the "result".
   *              It should be noted that the values in datum may be atom instantiation
   *              operators (e.g., '$merge', '$delete', '$propert', etc...).
   * @param {Object} datum -- The instance or child class properties to assign
   * @param {boolean} isClass -- Whether or not we are instantiating an object of building
   *                             a class
   * @param {Object} result -- An instance or constructor depending on whether we are
   *                           instantiating an object or building a class
   * @throws {Error}
   */
  _defineProperties: function(datum, isClass, result) {
    for (var property in datum) {
      if ((this.ignoreFields.indexOf(property) === -1) &&
          property !== TYPE_FIELD &&
          datum.hasOwnProperty(property))
      {
        var value = datum[property]
        this._defineProperty(isClass ? result.prototype : result, isClass, property, value)
      }
    }
  },

  /*****************************************************************************
   * @method _defineProperty
   * @description Assigns "value" to "obj". Note, "value" may represent an atom
   *              instantiation operator (e.g., '$merge', '$delete', '$propert',
   *              etc...).
   * @param {Object} obj -- The object being assigned to
   * @param {String} property -- The property of "object" we are assigning to
   * @param {Object} value -- The value we are assigning to ``object[property]`
   * @throws {Error}
   */
  _defineProperty : function(obj, isClass, property, value) {
    if (_.isString(property) && property.startsWith(PROPERTY_PATH_LEADER)) {
      // parse the property path
      let propertyPath = _.toPath(property)
      // verify that it is a property path
      let isPropertyPath = propertyPath.length > 1
      // check for leader character escaping if more than one leader character is present
      // and it looks like a property path
      if (isPropertyPath && propertyPath[0][1] === PROPERTY_PATH_LEADER) {
        // get the number of leading leader characters
        let leaders = _.takeWhile(propertyPath[0], char => char === PROPERTY_PATH_LEADER)
        // if the number of leaders is odd, then this is a property path, otherwise we walk
        // back our earlier classification
        isPropertyPath = (leaders.length % 2) !== 0
        // unescape leader characters
        let unescapedLeaderString = _.repeat(
            PROPERTY_PATH_LEADER,
            (isPropertyPath ? leaders.length - 1 : leaders.length) / 2
          )

        if (isPropertyPath) {
          // prepend leader character if this is a property path. necessary to mimic
          // case when no escaping is necessary (e.g., '$a.b.c')
          propertyPath[0] = PROPERTY_PATH_LEADER +
                            unescapedLeaderString +
                            propertyPath[0].slice(leaders.length)
        } else {
          // update property for processing below
          property = unescapedLeaderString + property.slice(leaders.length)
        }
      }
      if (isPropertyPath) {
        let _property = propertyPath[propertyPath.length - 1]
        // NOTE: _.set({}, 'a[01]', 2) === {a: {01: 2}}
        //       _.set({}, 'a[1]', 2) === {a: [2]}
        // XXX: better way to validate index?
        let isIndex = _.parseInt(_property).toString() === _property
        let subObjPath = _.slice(propertyPath, 0, propertyPath.length - 1)
        // strip leader character
        subObjPath[0] = subObjPath[0].slice(1)
        // NOTE: you could index into a string, but strings are immutable, so this will throw
        //       when recursing
        let subObj = _.get(obj, subObjPath, isIndex ? [] : {})
        this._defineProperty(subObj, false, isIndex ? _.parseInt(_property) : _property, value)
        _.set(obj, subObjPath, subObj)
        return
      }
    }
    let subObj = undefined
    let i = undefined
    switch (_.isObjectLike(value) && _.keys(value).length === 1 ? _.keys(value)[0] : undefined) {
      case MULTI_OP_FIELD:
        if (!_.isArray(value[MULTI_OP_FIELD])) {
          throw new TypeError(`The ${MULTI_OP_FIELD} operator requires a list as its value`)
        }
        for (i = 0; i < value[MULTI_OP_FIELD].length; i++) {
          if (!_.isObjectLike(value[MULTI_OP_FIELD][i])) {
            throw new TypeError(`The ${MULTI_OP_FIELD} value at index ${i} is not an object:\n` +
                                util.inspect(value[MULTI_OP_FIELD][i]))
          }
          this._defineProperty(obj, isClass, property, value[MULTI_OP_FIELD][i])
        }
        break
      case MERGE_FIELD:
        // get the value to be merged into
        // NOTE: we do not need to check if property is an index here since $merge only makes
        //       sense on on object
        // NOTE: "property" is passed as a single element array to prevent parsing as a property
        //       path
        subObj = _.get(obj, [property], {})
        if (_.isString(subObj)) {
          // XXX: do we want to throw here or just accept the default behavior
          throw new TypeError(`Cannot merge '${value[MERGE_FIELD]}' non-object '${subObj}'`)
        }
        // merge values into subObj (allowing nested use of $merge, $set, and $property)
        this._defineProperties(value[MERGE_FIELD], false, subObj)
        // set the merged sub object on the object being made
        _.set(obj, [property], subObj)
        break
      case DELETE_FIELD:
        subObj = _.get(obj, [property])
        // allow deletion of multiple properties
        let value_ = (_.isString(value[DELETE_FIELD]) || !_.isArrayLike(value[DELETE_FIELD]))
          ? [value[DELETE_FIELD]] : value[DELETE_FIELD]
        // if subObj is null/undefined, then don't do anything
        if (!_.isNil(subObj)) {
          for (i = 0; i < value_.length; i++) {
            // if it looks like an array and the "property" is an integer, then treat value as an
            // index and remove it from the array
            if (_.isArrayLike(subObj) && _.isInteger(value_[i])) {
              if (_.isString(subObj)) {
                throw new TypeError(`Cannot delete read only property '${value_[i]}' of string '${subObj}'`)
              }
              // allow for negative indexing
              if (value_[i] < 0) {
                value_[i] += subObj.length
              }
              // only delete if in range
              if (value_[i] >= 0 && value_[i] < subObj.length) {
                // not using splice here
                subObj = _.concat(_.slice(subObj, 0, value_[i]), _.slice(subObj, value_[i]))
              } else {
                // ignore
              }
            } else {
              delete subObj[value_[i]]
            }
          }
        }
        break
      case PROPERTY_FIELD:
        // XXX: verify obj is not an array?
        Object.defineProperty(obj, property, value[PROPERTY_FIELD])
        break
      default:
        let isWritableAccessor = false
        if (!isClass) {
          let _prototype = Object.getPrototypeOf(obj)
          let descriptor = undefined
          // XXX: is there a more efficient way to do this?
          do {
            descriptor = Object.getOwnPropertyDescriptor(_prototype, property)
            if (!_.isNil(descriptor) && (_.isFunction(descriptor.set) || descriptor.writable)) {
              isWritableAccessor = true
              break
            }
          } while (_prototype = Object.getPrototypeOf(_prototype))
        }
        // if this is writable accessor or it is an array and property is an index, then just set it
        if (isWritableAccessor || (_.isArrayLike(obj) && _.isInteger(property))) {
          if (_.isString(obj)) {
            // XXX: do we want to throw here or just accept the default behavior (silent failure)
            throw new TypeError(`Cannot assign to read only property '${property}' of string '${obj}'`)
          }
          // this will use the property descriptor defined in the prototype chain to assign the value
          // if we determine that this is a writable accessor
          _.set(obj, [property], value)
        } else {
          // this will override any property descriptor defined previously in the prototype chain
          // (i.e., allows for shadowing of non-writable properties in the prototype chain)
          Object.defineProperty(obj, property, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
          })
        }
    }
  },

  /*****************************************************************************
   * @method instantiate
   * @description Instantiates an object based on "targetType" or builds a new
   *              a new class that inherits from "targetType"
   * @param {Object} datum -- An object describing an instance or class
   * @param {Object|string} targetType -- The instance type or prototype constructor
   *                                      depending on whether we are instantiating an
   *                                      object or building a class
   * @param {Object} args -- Arguments to pass to the constructor if we are instantiating
   *                         an object
   * @param {boolean} isClass -- Whether or not we instantiating an object or creating
   *                             a class
   * @param {Object} mod -- The module context that this is being called in (note, this
   *                        is used to determine whether or not to call ``main``)
   * @returns {Object|Function}
   * @throws {Error}
   */
  instantiate: function(datum, targetType, args, isClass, mod) {
    var self = this

    var type = targetType
    if (!type) {
      if (datum.hasOwnProperty(TYPE_FIELD)) {
        type = datum[TYPE_FIELD]
        if (!type) {
          throw new Error("Unexpected _type: " + type + " in " + mod.filename)
        }
      } else {
        // _type not specified at all. Use Object
        type = Object
      }
    }

    if (typeof(type) === 'string') {
      var resolver = this._typeResolver;
      if (resolver) {
        var typeName = type;
        try {
          type = resolver(mod)(typeName);
        } catch (e) {
          console.log(e.stack)
          throw new Error("Could not resolve _type: '" + typeName + "' from module " + mod.filename + " -- " + e.message)
        }
        if (!type) {
          throw new Error("Could not resolve _type: '" + typeName + "' from module " + mod.filename)
        }
      } else {
        throw new Error("Could not resolve _type: " + type + " . Could not find resolver")
      }
    }

    var initSuppressionArg = {__suppressInit__: true}

    // helper function
    var makeConstructor = function(ctorName) {
      // XXX: The following function constructor is used to generate a constructor with the desired class name
      //      that displays *correctly* in stack traces. Simply redefining `ctor.name` using `Object.defineProperty`, as
      //      mentioned in most of the solutions below, does *not* yield the correct type name in a stack trace. E.g.,
      //      while `CallSite.getThis().constructor.name` may be the type name you expect, `CallSite.getTypeName()` is empty
      //      and V8 decides then to use `CallSite.getFunctionName` instead, which is not what we want. Note, using an
      //      object definition with a dynamic name (e.g., `var ctorName = 'Foo'; var x = {[ctorName]: function() {/*...*/}`)
      //      to influence the name yields similar bad results.
      //
      // http://2ality.com/2015/09/function-names-es6.html
      // https://bugs.chromium.org/p/v8/issues/detail?id=278
      // https://marcosc.com/2012/03/dynamic-function-names-in-javascript/
      // https://stackoverflow.com/questions/5871040/how-to-dynamically-set-a-function-object-name-in-javascript-as-it-is-displayed-i
      // https://stackoverflow.com/questions/9479046/is-there-any-non-eval-way-to-create-a-function-with-a-runtime-determined-name
      var C  = new Function(`return function ${ctorName}() {
        // automatically chain with init suppression (_init definition should chain if desired)
        ${ctorName}.super_.apply(this, [${ctorName}.initSuppressionArg])  // XXX chain rest of args or no?

        // pass through args but also deal with __suppressInit__
        var cArgs = arguments
        var suppressInit = false
        if (cArgs && cArgs.length > 0) {
          var lastArg = arguments[cArgs.length - 1]
          if (lastArg.__suppressInit__) {
            suppressInit = true
            delete cArgs[cArgs.length - 1]
          }
        }

        if (${ctorName}.prototype._C) { // call _C as defined
          ${ctorName}.prototype._C.apply(this, cArgs)
        }

        // call _init unless suppressed
        if (!suppressInit) {
          ${ctorName}._initializeObject(this, cArgs)
        }
      }`)()
      C._initializeObject = self._initializeObject
      C.initSuppressionArg = initSuppressionArg

      // mark as defined by Atom
      C.__isAtomDefined__ = true

      return C
    }

    if (typeof(type) === 'function') { // constructor
      var result = null
      if (isClass) {
        var ctorName = datum[CTOR_NAME_FIELD] || 'C'


        // our constructor
        var C = makeConstructor(ctorName)

        // link superclass
        inherits(C, type)

        if (!C.prototype._init) { // XXX will this stomp on _init functions we inherit? Dont think so
          C.prototype._init = function() {}
        }

        result = C
      } else {
        args = args || []
        if (type.__isAtomDefined__) {
          // Supress the atom-defined constructor from calling _init. Will be called
          // after define-properties in make()
          args.push(initSuppressionArg)
        }

        // alias of `new` allowing for variable length argument list
        result = Reflect.construct(type, args)
      }

      return result
    }

    // otherwise assume it is an object
    var result
    if (isClass) { // XXX is this a case we want to support ( oo where type is object )?
      // our constructor
      var C = makeConstructor()
      C.prototype = type
      C.prototype.constructor = C
      result = C
    } else {
      result = Object.create(type)
    }

    return result
  },

  /*****************************************************************************
   * @method _initializeObject
   * @description Calls the ``_init`` method of an object if it exists. Note, while
   *              constructors are automatically chained, the ``_init`` method must
   *              explicitly chain by calling
   *              ``<SuperClass>.prototype._init.apply(this, arguments)`` internally.
   * @param {Object} obj -- An object instance
   * @param {Array} args -- Initialization arguments
   */
  _initializeObject: function(obj, args) {
    if (obj._init) {
      obj._init.apply(obj, args)
    }
  },

  /*****************************************************************************
   * @typedef SignalHandlersDefinition
   * @type {Object}
   * @property {Object} <SIGNAL_NAME> -- The signal name to handle where <SIGNAL_NAME> is
   *                                     documented under Node's ``process`` object (e.g.,
   *                                     "SIGINT"). Note,
   *                                     <SIGNAL_NAME> can be a space separated list if multiple
   *                                     signals should be handled by the same handler function
   *                                     (e.g., "SIGINT SIGHUP SIGUSR1").
   */

  /*****************************************************************************
   * @method _registerSignalHandlers
   * @description Registers all signaler handlers defined on the ``signalHandlers``
   *              property (see {@link atom.Atom.SignalHandlersDefinition}). Note, if
   *              ``obj.signalHandlers`` is undefined, this is a noop.
   * @param {Object} obj -- The object being constructed
   */
  _registerSignalHandlers: function(obj) {
    if (!_.isUndefined(obj.signalHandlers)) {
      for (var signals in obj.signalHandlers) {
        var handler = obj.signalHandlers[signals]
        if (!_.isFunction(handler)) {
          throw new TypeError('signal handlers must be functions')
        }
        signals.split(/\s+/).forEach(function(signal) {
          process.on(signal, handler.bind(obj, signal))
        })
      }
    }
  },

  /*****************************************************************************
   * @method _runMain
   * @description Calls {@link atom.Atom._invokeMain} and prints a deprecation warning
   *              if ``obj.runMainInFiber`` is ``true``
   */
  _runMain: function(obj) {
    var self = this
    if (obj.runMainInFiber) { // default is false
      console.warn('"runMainInFiber" is DEPRECATED. Please wrap all applications in "__" instead.')
      __(function() {
        self._invokeMain(obj)
      })
    } else {
      self._invokeMain(obj)
    }
  },

  /*****************************************************************************
   * @method _invokeMain
   * @description Invokes the "main" method of "obj". Note, this may involve calling
   *              the appropriate sub-command handler if ``obj._main`` is an object and
   *              not simply a function.
   * @todo clean up exit code handling
   */
  _invokeMain: function(obj) {
    // Parse cmdargs
    var subcommand = this._processCmdargs(obj)

    // Environment variables (allow a sub-command to explicitly opt-out of environment variable processing)
    if (_.isUndefined(subcommand) ||
      (_.isUndefined(obj.cmdargs[subcommand].processEnvironmentVariables) ||
      obj.cmdargs[subcommand].processEnvironmentVariables)) {
      this._processEnvironmentVariables(obj)
    }

    // Do it
    var exitVal = 0
    if (typeof obj._main === 'object') {
      // if obj._main is an object then dispatch based on subcommand
      if (typeof subcommand === 'undefined' && 'default' in obj._main) {
        subcommand = 'default'
      }
      // bind the handler to the top level object and call it
      var handler = obj._main[subcommand].bind(obj)
      exitVal = handler(obj.parsedCmdargs)
    } else {
      exitVal = obj._main(obj.parsedCmdargs)
    }

    if (exitVal === undefined) {
      exitVal = 0
    } else if (typeof(exitVal) !== 'number') {
      exitVal = 128
      console.log("WARN: Recieved non-numeric exit code: " + exitVal + ". Returning 128.")
    }

//    process.exit(exitVal)
  },

  /*****************************************************************************
   * @method _processEnvironmentVariables
   * @description Processes any environment variables defined by "obj". This will
   *              sanitize ``process.env`` if an environment variable is "private" and
   *              fail with a usage message if a required environment variable is not
   *              present.
   * @param {Object} obj -- The object being constructed
   */
  _processEnvironmentVariables: function(obj) {
    var self = this
    var environmentVariables = obj[ENVIRONMENT_VARIABLES_FIELD]
    if (environmentVariables && _.size(environmentVariables) > 0) {
      _.forIn(environmentVariables, function(value, key) {
        var envVar = process.env[key]
        if (value.required && !envVar) {
          console.log("Error: Environment variable " + key + " is required.")
          // XXX: using 1 here for "general" error, but should probably allow for
          //      configuration
          self._argparser.print(self._argparser.getUsage(), 1)
        }
        if (value.private) {
          if (!process[PRIVATE_ENV_FIELD]) {
            process[PRIVATE_ENV_FIELD] = {}
          }
          process[PRIVATE_ENV_FIELD][key] = envVar
          delete process.env[key]
        }
      })
    }
  },

  /*****************************************************************************
   * @method _getEnvironmentVariableHelp
   * @description Builds the "help" string for environment variables defined by
   *              obj. This will be used when processing command line arguments.
   * @param {Object} obj -- The object being constructed
   * @returns {string}
   */
  _getEnvironmentVariableHelp: function(obj) {
    var result = ""

    var environmentVariables = obj[ENVIRONMENT_VARIABLES_FIELD]
    if (environmentVariables && _.size(environmentVariables) > 0) {
      result = "Environment variables: \n"
      _.forIn(environmentVariables, function(value, key) {
        result += "  " + key
        if (value.help) {
          result += " - " + value.help
        }
        if (value.required) {
          result += " (required)"
        }
        result += "\n"
      })
    }

    return result
  },

  /*****************************************************************************
   * @method _processCmdargs
   * @description Parses and processes all command line arguments as defined by
   *              "obj.cmdargs". Returns the string representing the subcommand
   *              to execute ("default" if no subcommands).
   * @param {Object} obj -- The object being constructed
   * @returns {string}
   */
  _processCmdargs: function(obj) {
    var self = this
    var args = process.argv.slice(2)
    var cmdargs = _.cloneDeep(obj[CMDARGS_FIELD])

    self._initArgParser(obj, cmdargs, self._argparser, args)

    // parse the command line
    var parsedCmdargs = self._argparser.parse(args)
    delete parsedCmdargs._ // kill the _ args since we don't want them

    // configure subcommand
    var subcommand = self._configureSubcommand(cmdargs, parsedCmdargs)

    // configure option properties
    self._configureOptionProperties(obj, cmdargs, parsedCmdargs, subcommand)

    // attach the parsed args to the main object
    obj.parsedCmdargs = parsedCmdargs

    // add method to query the usage string
    obj.getUsage = function(cmd, colors) {
      var path = require('path')
      var _args = [cmd, '--help']
      var cmdargs = _.cloneDeep(obj[CMDARGS_FIELD])
      var _argparser = argparser()
      if (typeof _args[0] === 'undefined') {
        _args.shift()
      }
      self._initArgParser(obj, cmdargs, _argparser, _args)
      if (!colors) {
        _argparser.nocolors()
      }
      _argparser
        .printer(function() {/* noop */})
        .script(path.basename(process.argv[1]))
        .parse(_args)

      return _argparser.getUsage()
    }

    return subcommand
  },

  /*****************************************************************************
   * @method _initArgParser
   * @description Creates an argument parser using the "cmdargs" definition. Note,
   *              this uses ``@carbon-io/nomnom`` internally and modifies both
   *              "cmdargs" and "argparser".
   * @param {Object} obj -- The object being constructed
   * @param {Object} cmdargs -- The full command line argument parser definition
   * @param {Object} argparser -- The argument parser
   * @param {Array.<string>} args -- The command line arguments
   *
   */
  _initArgParser: function(obj, cmdargs, argparser, args) {
    // XXX: nomnom does not like when a command has the same name as an option...
    //      the option will be silently omitted. error out in this case?

    if (!cmdargs) {
      return
    }

    var commandOptional = false

    for (var arg in cmdargs) {
      if (cmdargs[arg].command && cmdargs[arg].default) {
        commandOptional = true
        if (_.isNil(cmdargs[arg].help)) {
          cmdargs[arg].help = ''
        }
        cmdargs[arg].help = (cmdargs[arg].help + ' (default)').trim()
      }
    }

    // handle default command (unless '-h' is present)
    if (args.indexOf('-h') === -1 && args.indexOf('--help') === -1) {
      var commands = []
      var defaultCommand = undefined
      for (var arg in cmdargs) {
        if (cmdargs[arg].command) {
          commands.push(cmdargs[arg].full || arg)
          if (cmdargs[arg].default) {
            defaultCommand = cmdargs[arg].full || arg
          }
          // update index of nested positional args
          var properties = ['options', 'option', 'cmdargs']
          properties.forEach(function(property) {
            try {
              for (cmdopt in cmdargs[arg][property]) {
                if (typeof cmdargs[arg][property][cmdopt].position !== 'undefined') {
                  cmdargs[arg][property][cmdopt].position++
                }
              }
            }
            catch (e) { /* catch "Cannot read property 'x' of undefined" */ }
          })
        }
      }
      // if there is a default command and no command specified, then add it
      // NOTE: nomnom requires that a subcommand be the first token in the args string
      if (defaultCommand && commands.indexOf(args[0]) === -1) {
        args.unshift(defaultCommand)
      }
    }

    var commands = {}
    var options = {}

    // separate commands and options
    for (var p in cmdargs) {
      if (typeof cmdargs[p].command !== 'undefined' && cmdargs[p].command) {
        commands[p] = cmdargs[p]
      }
      else {
        options[p] = cmdargs[p]
      }
    }

    // apply commands and their nested options to the parser
    cmdargs.__commandNames = {}
    for (var command in commands) {
      // allow for aliasing similar to options
      cmdargs.__commandNames[command] = command
      if ('full' in commands[command]) {
        var fullCommand = commands[command].full
        cmdargs.__commandNames[fullCommand] = command
        commands[fullCommand] = commands[command]
        delete commands[command]
        delete commands[fullCommand].full
        command = fullCommand
      }
      // parse the command definition
      var parser = argparser.command(command)
      // apply any other appropriate methods
      var properties = ['callback', 'help', 'usage', 'cmdargs']
      properties.forEach(function (property) {
        if (typeof commands[command][property] !== 'undefined') {
          if (property === 'cmdargs') {
            parser.options(commands[command][property])
          }
          else {
            parser[property](commands[command][property])
          }
        }
      })
    }

    // handle default subcommand
    if ((Object.keys(commands).length > 0 && (
         typeof obj._main === 'function' ||
         'default' in obj._main)) ||
        commandOptional) {
      argparser.nocommand()
    }

    // apply top level options
    argparser.options(options)

    // append environmentVariable help
    argparser.extendHelp(this._getEnvironmentVariableHelp(obj))
  },

  /*****************************************************************************
   * @method _configureSubcommand
   * @description Transforms "options" by nesting subcommand specific options under
   *              "options[subcommand]" if a subcommand is present and returns the
   *              subcommand name
   * @param {Object} cmdargs -- The command line argument definition
   * @param {Object} options -- The parsed command line arguments
   * @returns {string}
   */
  _configureSubcommand: function(cmdargs, options) {
    if (!cmdargs) {
      return
    }

    var subcommand = undefined

    // transform options if subcommand is present
    if (typeof options[0] !== 'undefined') {
      // unalias the potential subcommand
      subcommand = cmdargs.__commandNames[options[0]]
      // check if the first positional is actually a subcommand
      if (subcommand in cmdargs) {
        // if so, namespace its options
        options[subcommand] = {
          property: cmdargs[subcommand].property ? true : false
        }
        // nest subcommand options if there are any
        var properties = ['options', 'option', 'cmdargs']
        properties.forEach(function(key) {
          if (key in cmdargs[subcommand]) {
            for (var subcommandOption in cmdargs[subcommand][key]) {
              if (subcommandOption in options) {
                options[subcommand][subcommandOption] = options[subcommandOption]
                delete options[subcommandOption]
              }
            }
          }
        })
        var processEnvironmentVariables = cmdargs[subcommand].processEnvironmentVariables
        options[subcommand].processEnvironmentVariables =
          _.isUndefined(processEnvironmentVariables) ? true : processEnvironmentVariables
      }
    }

    return subcommand
  },

  /*****************************************************************************
   * @method _configureOptionProperties
   * @description Set parsed command line arguments on "obj" if their definition
   *              includes ``{property: true}``
   * @param {Object} obj -- The object being constructed
   * @param {Object} cmdargs -- The command line arguments parser definition
   * @param {Object} options -- The parsed command line arguments
   * @param {Object} [subcommand] -- The parsed subcommand definition
   */
  _configureOptionProperties: function(obj, cmdargs, options, subcommand) {
    if (!cmdargs) {
      return
    }

    var _makeProp = function(optionName, optionVal, option) {
      if (option.property) {
        obj[optionName] = optionVal
      }
    }

    // add properties to obj
    for (var option in options) {
      // if this is the subcommand, then handle it and its children
      if (typeof subcommand !== 'undefined' && option === subcommand) {
        // collect subcommand options
        subcommandOptions = {}
        for (var subcommandOption in options[subcommand]) {
          // add to subcommand options
          subcommandOptions[subcommandOption] = options[subcommand][subcommandOption]
          // if this option exists in the subcommand's "option", "options", or "cmdargs"
          // property and it is labeled a property, then make it a property at the top
          // level on the object being instantiated
          var properties = ['options', 'option', 'cmdargs']
          properties.forEach(function(property) {
            try {
              _makeProp(subcommandOption,
                        options[subcommand][subcommandOption],
                        cmdargs[subcommand][property][subcommandOption])
            }
            catch (e) { /* catch "Cannot read property 'x' of undefined" */ }
          })
        }
        // if the subcommand itself is labeled a property, then add it at the top
        // level
        if (options[subcommand].property) {
          obj[subcommand] = subcommandOptions
        }
      }
      // otherwise, it is a top level option, make it a property if desired
      else if (cmdargs[option] && cmdargs[option].property) {
        _makeProp(option, options[option], cmdargs[option])
      }
    }
  }
};

Atom.prototype.constructor = Atom; // very important this is here

/***************************************************************************************************
 * @property {atom.Atom} atom
 * @description The internal {@link atom.Atom} instance used to construct objects and classes and
 *              execute an object's "main" handler(s) if desired
 * @private
 */
var atom = new Atom()

/***************************************************************************************************
 * @property {Function} reset
 * @description Reinitializes the internal instance of {@link atom.Atom}. To be used for testing
 *              purposes. This can be accessed as a property of {@link atom.o} or {@link atom.oo}.
 * @private
 */
function reset() {
  atom = new Atom()
}

var stackTraceLimit = Infinity

/***************************************************************************************************
 * @function setStackTraceLimit
 * @description Set the stack size limit for errors generated during calls to ``o`` and ``oo``
 * @param {number} limit -- The new stack size limit
 * @returns {number} -- The previous stack size limit
 * @ignore
 * @todo XXX
 */
function setStackTraceLimit(limit) {
  if (!_.isNumber(limit) || isNaN(limit)) {
    throw new TypeError(limit)
  }
  let prevStackTraceLimit = stackTraceLimit
  stackTraceLimit = limit
  return prevStackTraceLimit
}

/***************************************************************************************************
 * @function getStackTraceLimit
 * @description Get the stack size limit for errors generated during calls to ``o`` and ``oo``
 * @returns {number} -- The previous stack size limit
 * @ignore
 * @todo XXX
 */
function getStackTraceLimit(limit) {
  return stackTraceLimit
}

/***************************************************************************************************
 * @typedef {Function} ObjectInstantionFunction
 * @description Instantiates an object
 * @param {Object} datum -- An object whose properties are used to initialize the instance. Note, this
 *                          object may have it's type embedded using the "_type" property. In this case
 *                          the "type" parameter can be omitted.
 * @param {Object|Function|string} [type=Object] -- The type of the object being instantiated. This can
 *                                                  be an object, a constructor function, or a string.
 *                                                  if it is an object, the new object's prototype will
 *                                                  be updated to reflect this. If it is a constructor
 *                                                  function, ``util.inherits`` will be called and
 *                                                  constructors will be chained upon instantiation.
 *                                                  Finally, if it is a string, "@carbon-io/bond" will
 *                                                  be used to "reslove" the type, which should be an
 *                                                  object or constructor function.
 * @param {...*} [arg] -- Arguments to be passed to the object's ``_init`` method
 * @property {Function} main -- The "main" variant of {@link atom.ObjectInstantiationFunction}. Use this
 *                              if you want to invoke "main" after the object has been instantiated in the
 *                              context of ``require.main``.
 */

/***************************************************************************************************
 * @function o
 * @description A factory function that returns an instantiation function ``o`` where ``o.main`` is
 *              used to execute the "main" handler if in the appropriate context (where ``require.main``
 *              == ``module``)
 * @param {Module} mod -- The module whose context the resulting function should execute in. This
 *                        is used to determine whether "main" should be executed if the returned
 *                        function's "main" property is used to construct an object and to aid in
 *                        resolving the objects "type".
 * @returns {atom.ObjectInstantionFunction}
 */
function o(mod) {
  if (!(mod instanceof Module)) {
    throw(Error("Must supply a module to o: " + JSON.stringify(mod)))
  }

  var makeOFunc = function(isMain) {
    let o_ = function() { // takes (datum, targetType, args...)
      let prevStackTraceLimit = Error.stackTraceLimit
      try {
        Error.stackTraceLimit = getStackTraceLimit()
        var datum = arguments[0]
        var targetType
        var args
        if (arguments.length > 1) {
          targetType = arguments[1]
        }
        if (arguments.length > 2) { // the rest are constructor args
          var argumentsArray = Array.prototype.slice.call(arguments);
          args = argumentsArray.slice(2)
        }

        return atom.make(datum, targetType, args, false, mod, isMain);
      } finally {
        Error.stackTraceLimit = prevStackTraceLimit
      }
    }
    Object.defineProperty(o_, 'name', {
      configurable: false,
      enumerable: false,
      writable: false,
      value: 'o'
    })
    return o_
  }

  var result = makeOFunc(false)
  result.reset = reset
  result.main = makeOFunc(true)
  result.main.reset = reset

  return result
}

/***************************************************************************************************
 * @typedef {Function} ClassCreationFunction
 * @description Create a constructor function from a class definition
 * @param {Object} datum -- An object whose properties are used to initialize the class prototype
 * @todo XXX: should this be ignored?
 * @ignore
 */

/***************************************************************************************************
 * @function oo
 * @description Returns an class factory function
 * @param {Module} mod -- The module whose context the resulting function should execute in. This
 *                        is used to aid in resolving the class's parent "type".
 * @returns {atom.ClassCreationFunction}
 * @todo XXX: should this be ignored?
 * @ignore
 */
function oo(mod) {
  if (!(mod instanceof Module)) {
    throw(Error("Must supply a module to oo: " + JSON.stringify(mod)))
  }
  var oo_ = function(datum) {
    let prevStackTraceLimit = Error.stackTraceLimit
    try {
      Error.stackTraceLimit = getStackTraceLimit()
      return atom.make(datum, null, null, true, mod, false);
    } finally {
      Error.stackTraceLimit = prevStackTraceLimit
    }
  }
  Object.defineProperty(oo_, 'name', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: 'oo'
  })
  oo_.reset = reset
  return oo_
}

module.exports = {
  Atom: Atom,
  OPERATORS: OPERATORS,
  getStackTraceLimit,
  setStackTraceLimit,
  o: o,
  oo: oo
}

Object.defineProperty(module.exports, '$Test', {
  enumerable: false,
  configurable: false,
  writeable: false,
  get: function() {
    return require('../test/index.js')
  }
})
