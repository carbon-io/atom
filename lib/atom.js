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
var __DEEP_MODE__               = false

var PROPERTY_PATH_LEADER        = '$'
var MERGE_FIELD                 = '$merge'
var PROPERTY_FIELD              = '$property'
var PROPERTY_DEFINITION_CMDS    = [
  MERGE_FIELD,
  PROPERTY_FIELD,
]

/***************************************************************************************************
 * @class Atom
 * @ignore
 */
function Atom(typeResolver) {
  this._typeResolver = typeResolver || _o
  this._argparser = argparser()
}

Atom.prototype = { // XXX did we just overwrite Atom.prototype.constructor? Yes but we fix below (decide)

  /*****************************************************************************
   * ignoreFields
   */
  ignoreFields : [],

  /*****************************************************************************
   * _typeResolver
   */
  _typeResolver : null,

  /*****************************************************************************
   * _argparser
   */
  _argparser: null,

  /*****************************************************************************
   * make
   *
   * @param {Object} datum
   * @param {Object|string} targetType
   * @param {Object} args
   * @param {boolean} isClass
   * @param {Object} mod - module
   * @param {boolean} main -- should run main
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
        if (_.isArray(datum)) {
          if (__DEEP_MODE__) {
            value = this._makeArray(datum, mod);
          }
        } else if (_.isNull(datum)) {
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
   * _makeArray
   *
   * @param prototype
   */
  _makeArray: function(datum, mod) {
    return datum.map(elem => this.make(elem, null, null, false, mod, false))
  },

  /*****************************************************************************
   * _makeObject
   *
   * @param {Object} -- datum
   * @param {Object|string} -- targetType
   * @param {Object} -- args
   * @param {boolean} -- isClass
   * @param {Object} mod -- module
   * @param {boolean} main -- main version of o, which should run main
   */
  _makeObject: function(datum, targetType, args, isClass, mod, main) {
    if (datum._ref) {
      return _o(mod)(datum._ref); // XXX is this still in play?
    }

    // instantiate object
    var result = this.instantiate(datum, targetType, args, isClass, mod);

    // define properties
    this._defineProperties(datum, isClass, mod, result)

    if (!isClass) { // only applies to objects not classes
      // initialize
      this._initializeObject(result, args)
      // run main (will only run in right conditions)
      if (main) {
        if (result._main && require.main && (require.main === mod)) { // Only run main if in main module
          this._registerSignalHandlers(result)
          this._runMain(result, mod)
        }
      }
    }

    return result;
  },

  /*****************************************************************************
   * _defineProperties
   *
   * @param {Object} datum
   * @param {boolean} isClass
   * @param {boolean} [mod]
   * @param {Object} [result]
   */
  _defineProperties: function(datum, isClass, mod, result) {
    for (var property in datum) {
      if ((this.ignoreFields.indexOf(property) === -1) &&
          property !== TYPE_FIELD &&
          datum.hasOwnProperty(property))
      {
        var value = datum[property]
        if (__DEEP_MODE__) {
          value = this.make(value, null, null, false, mod, false);
        }

        this._defineProperty(isClass ? result.prototype : result, isClass, property, value)
      }
    }
  },

  /*****************************************************************************
   * _defineProperty
   *
   * @param {Object} obj
   * @param {String} property
   * @param {Object} value
   *
   * @ignore
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
    switch (_.isObjectLike(value) && _.keys(value).length === 1 ? _.keys(value)[0] : undefined) {
      case MERGE_FIELD:
        // get the value to be merged into
        // NOTE: we do not need to check if property is an index here since $merge only makes
        //       sense on on object
        let subObj = _.get(obj, [property], {})
        if (_.isString(subObj)) {
          // XXX: do we want to throw here or just accept the default behavior
          throw new TypeError(`Cannot merge '${value[MERGE_FIELD]}' non-object '${subObj}'`)
        }
        // merge values into subObj (allowing nested use of $merge, $set, and $property)
        this._defineProperties(value[MERGE_FIELD], false, null, subObj)
        // set the merged sub object on the object being made
        _.set(obj, [property], subObj)
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
   * instantiate
   *
   * @param {Object} datum
   * @param {boolean} isClass
   *
   * @returns {Object} The object or class (Function) instantiated from datum
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

    var initSuppressionArg = { __suppressInit__: true }

    // helper function
    var makeConstructor = function() {
      var C = function() {
        // automatically chain with init suppression (_init definition should chain if desired)
        C.super_.apply(this, [initSuppressionArg])  // XXX chain rest of args or no?

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

        if (C.prototype._C) { // call _C as defined
          C.prototype._C.apply(this, cArgs)
        }

        // call _init unless suppressed
        if (!suppressInit) {
          self._initializeObject(this, cArgs)
        }
      }

      // mark as defined by Atom
      C.__isAtomDefined__ = true

      return C
    }

    if (typeof(type) === 'function') { // constructor
      var result = null
      if (isClass) {
        // our constructor
        var C = makeConstructor()
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

        // Can we optimize by calling new directly if no args (e.g result = new type(args)) ?
        // Dynamically call new type with variable args. This is hairy. Found solution here
        // http://jsperf.com/dynamic-arguments-to-the-constructor
        result = new (Function.prototype.bind.apply(type, [null].concat(args)))
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
   * _initializeObject
   */
  _initializeObject: function(obj, args) {
    if (obj._init) {
      obj._init.apply(obj, args)
    }
  },

  /*****************************************************************************
   * _registerSignalHandlers
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
   * _runMain
   */
  _runMain: function(obj, mod) {
    var self = this
    if (obj.runMainInFiber) { // default is false
      console.warn('"runMainInFiber" is DEPRECATED. Please wrap all applications in "__" instead.')
      __(function() {
        self._invokeMain(obj, mod)
      })
    } else {
      self._invokeMain(obj, mod)
    }
  },

  /*****************************************************************************
   * _invokeMain
   */
  _invokeMain: function(obj, mod) { // XXX might not need mod anymore but leave for now
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
   * _processEnvironmentVariables
   */
  _processEnvironmentVariables: function(obj) {
    var self = this
    var environmentVariables = obj[ENVIRONMENT_VARIABLES_FIELD]
    if (environmentVariables && _.size(environmentVariables) > 0) {
      _.forIn(environmentVariables, function(value, key) {
        var envVar = process.env[key]
        if (value.required && !envVar) {
          console.log("Error: Environment variable " + key + " is required.")
          self._argparser.print(self._argparser.getUsage())
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
   * _getEnvironmentVariableHelp
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
   * _processCmdargs
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
    var subcommand = self._configureSubcommand(obj, cmdargs, parsedCmdargs)

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
   * _initArgParser
   *
   * NOTE: modifies `cmdargs` and argparser
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
   * configureSubcommand
   */
  _configureSubcommand: function(obj, cmdargs, options) {
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
   * configureOptionProperties
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
              if (cmdargs[subcommand][property][subcommandOption].property) {
                _makeProp(subcommandOption,
                          options[subcommand][subcommandOption],
                          cmdargs[subcommand][property][subcommandOption])
              }
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
 * atom
 */
var atom = new Atom()

/***************************************************************************************************
 * reset
 */
function reset() {
  atom = new Atom()
}

/***************************************************************************************************
 * o
 *
 * Returns the make function o where o.main is used when running _main in
 * a main context (where require.module == mozad)
 *
 * @param {Object} module
 */
function o(mod) {
  if (!(mod instanceof Module)) {
    throw(Error("Must supply a module to o: " + JSON.stringify(mod)))
  }

  var makeOFunc = function(isMain) {
    return function() { // takes (datum, targetType, args...)
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
    }
  }

  var result = makeOFunc(false)
  result.reset = reset
  result.main = makeOFunc(true)
  result.main.reset = reset

  return result
}

/***************************************************************************************************
 * oo
 *
 * @param {Object} datum
 */
function oo(mod) {
  if (!(mod instanceof Module)) {
    throw(Error("Must supply a module to oo: " + JSON.stringify(mod)))
  }
  var makeOOFunc = function(datum) {
    return atom.make(datum, null, null, true, mod, false);
  }
  makeOOFunc.reset = reset
  return makeOOFunc
}

/***************************************************************************************************
 * exports
 */
if (typeof(exports) != "undefined") {
  exports.Atom = Atom
  exports.o = o
  exports.oo = oo
}

Object.defineProperty(module.exports, '$Test', {
  enumerable: false,
  configurable: false,
  writeable: false,
  get: function() {
    return require('../test/index.js')
  }
})
