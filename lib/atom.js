/*******************************************************************************
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
var Module = require('module')
var argparser = require('nomnom')
var inherits = require('util').inherits
var _o = require('bond')._o

/*******************************************************************************
 * CONSTANTS
 */
var TYPE_FIELD = '_type'
var PROPERTY_FIELD = '$property'
var __DEEP_MODE__ = false

/*******************************************************************************
 * @class Atom
 * @ignore
 */
function Atom(typeResolver) {
  this._typeResolver = typeResolver || _o;
};

Atom.prototype = { // XXX did we just overwrite Atom.prototype.constructor? Yes but we fix below (decide)

  /***************************************************************************
   * ignoreFields
   */
  ignoreFields : [],
  
  /***************************************************************************
   * _typeResolver
   */
  _typeResolver : null,
  
  /***************************************************************************
   * make
   * 
   * @param {Object} datum
   * @param {Object|string} targetType
   * @param {boolean} isClass
   * @param {Object} mod - module
   * @param {Object} result
   */
  make: function(datum, targetType, args, isClass, mod, result) { // XXX seems like result not used? Maybe for when instantiate type first? hmmm
    // primitives
    if (datum === null) {
      return null;
    }
    
    if (datum === undefined) {
      return undefined;
    }
    
    dtype = typeof(datum);
    if (dtype === 'string') {
      return datum;
    }

    if (dtype === 'boolean') {
      return datum;
    }
    
    if (dtype === 'number') {
      return datum;
    }

    if (dtype === 'function') {
      return datum;
    }
    
    // arrays
    if (datum.constructor === Array) {
      if (__DEEP_MODE__) {
        return this._makeArray(datum, mod);
      } else {
        return datum
      }
    }

    // objects
    if (dtype === 'object') {
      var value = this._makeObject(datum, targetType, args, isClass, mod, result);
      return value
    }
    
    throw new Error("Unable to make from datum: " + datum);
  },
  
  /***************************************************************************
   * _makeArray
   * 
   * @param prototype
   */
  _makeArray : function(datum, mod) {
    var self = this;
    return datum.map(function(elem) { return self.make(elem, null, null, false, mod); });
  },
  
  /***************************************************************************
   * _makeObject
   * 
   * @param {Object} datum
   * @param {boolean} [isClass]
   * @param {Object} [result]
   */
  _makeObject: function(datum, targetType, args, isClass, mod, result) {
    if (datum._ref) {
      return _o(mod)(datum._ref); // XXX is this still in play?
    }
    
    // instantiate object
    result = result || this.instantiate(datum, targetType, args, isClass, mod);
        
    // define properties
    this._defineProperties(datum, isClass, mod, result)
    
    if (!isClass) { // only applies to objects not classes
      // initialize 
      this._initializeObject(result, args)
      // run main (will only run in right conditions)
      this._runMain(result, mod)
    }    

    return result;
  },

  /***************************************************************************
   * _defineProperties
   * 
   * @param {Object} datum
   * @param {boolean} [isClass]
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
          value = this.make(value, null, null, false, mod);
        } 

        if (isClass) {
          this._defineProperty(result.prototype, property, value);
        } else {
          this._defineProperty(result, property, value);
        }
      }
    }
  },

  /***************************************************************************
   * _defineProperty
   * 
   * @param {Object} obj
   * @param {String} property
   * @param {Object} value
   *
   * @ignore
   */
  _defineProperty : function(obj, property, value) {
    // obj[property] = value
    // obj[property] = { "$property" : <property-def> } 
    // XXX this should probably be o({$property: <property-def>}) ??

    if (value != null && typeof(value) === 'object' && value[PROPERTY_FIELD]) {
      // $property case
      Object.defineProperty(obj, property, value[PROPERTY_FIELD])
    } else {
      // XXX was doing this but don't think that is quite right. Just setting works much better in 
      //  the case where you want to have a non-shared property redefined in the obj not in proto
      // XXX maybe skip _C? Do this upstairs

      Object.defineProperty(obj, property, {
        enumerable: true,
        configurable: true,
        writable: true,
        value: value
      })
    }
  },

  /***************************************************************************
   * instantiate
   * 
   * @param {Object} datum
   * @param {boolean} isClass
   *
   * @returns {Object} The object or class (Function) instantiated from datum
   */
  instantiate: function(datum, targetType, args, isClass, mod) {
    var self = this
    var type = targetType || datum[TYPE_FIELD] || Object

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
    
    var initSuppressionArg = { __supressInit__: true }

    // helper function
    var makeConstructor = function() {
      var C = function() { 
        // automatically chain with init suppression (_init definition should chain if desired)
        C.super_.apply(this, [initSuppressionArg])  // XXX chain rest of args or no?

        if (C.prototype._C) { // call _C as defined
          // pass through args but also deal with __supressInit__
          var cArgs = arguments
          var suppressInit = false
          if (cArgs && cArgs.length > 0) {
            var lastArg = arguments[cArgs.length - 1]
            if (lastArg.__supressInit__) {
              suppressInit = true
              delete cArgs[cArgs.length - 1]
            }
          }
          C.prototype._C.apply(this, cArgs) 
        }

        // call _init unless supressed
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

  /***************************************************************************
   * _initializeObject
   */
  _initializeObject: function(obj, args) { 
    if (obj._init) {
      obj._init.apply(obj, args)
    }
  },

  /***************************************************************************
   * _runMain
   */
  _runMain: function(obj, mod) {
    if (obj._main && require.main && (require.main == mod)) { 
      // if cmdargs are defined use them
      var cmdargs = obj.cmdargs
      if (cmdargs) {
        this._initArgParser(obj)
      }

      // handle default command
      var args = process.argv.slice(2)
      var commands = []
      var defaultCommand = undefined
      for (var arg in cmdargs) {
        if (cmdargs[arg].command) {
          commands.push(arg)
          if (cmdargs[arg].default) {
            defaultCommand = arg
          }
        }
      }
      if (defaultCommand && !(args[0] in commands)) {
        args.unshift(defaultCommand)
      }

      // parse the command line
      var options = argparser.parse(args) 
      delete options._ // kill the _ args since we don't want them

      // configure subcommand
      var subcommand = this._configureSubcommand(cmdargs, options)

      // configure option properties
      this._configureOptionProperties(obj, cmdargs, options, subcommand)

      // attach the parsed args to the main object
      obj.parsedCmdargs = options

      var exitVal = 0
      
      // do it
      if (typeof obj._main === 'object') {
        // if obj._main is an object then dispatch based on subcommand
        if (typeof subcommand === 'undefined' && 'default' in obj._main) {
          subcommand = 'default'
        }
        // bind the handler to the top level object and call it
        var handler = obj._main[subcommand].bind(obj)
        exitVal = handler(options)
      }
      else {
        exitVal = obj._main(options) 
      }

      // XXX: process.exit(exitVal) ?
    }
  },

  /***************************************************************************
   * _initArgParser
   */
  _initArgParser: function(obj) {
    // XXX: nomnom does not like when a command has the same name as an option... 
    //      the option will be silently omitted. error out in this case?
    
    cmdargs = obj.cmdargs
    commands = {}
    options = {}

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
        fullCommand = commands[command].full
        cmdargs.__commandNames[fullCommand] = command
        commands[fullCommand] = commands[command]
        delete commands[command]
        delete commands[fullCommand].full
        command = fullCommand
      }
      // convert "option" to "options"
      if ('option' in commands[command]) {
        if (!('options' in commands[command])) {
          commands[command].options = commands[command].option
        }
        // there should only be one option in "option", but cover the case
        // that there isn't
        else {
          for (var option in commands[command].option) {
            commands[command].options[option] = commands[command].option[option]
          }
        }
        delete commands[command].option
      }
      // parse the command definition
      var parser = argparser.command(command)
      // apply any other appropriate methods
      var methods = ['callback', 'help', 'usage', 'options']
      methods.forEach(function (method) {
        if (typeof commands[command][method] !== 'undefined') {
          parser[method](commands[command][method])
        }
      })
    }

    // handle default subcommand
    if (Object.keys(commands).length > 0 && (
        typeof obj._main === 'function' || 
        'default' in obj._main)) {
      argparser.nocommand()
    }

    // finally, apply top level options
    argparser.options(options)
  },

  /***************************************************************************
   * configureSubcommand
   */        
  _configureSubcommand: function(optionDefinitions, options) {
    var subcommand = undefined

    // transform options if subcommand is present
    if (optionDefinitions && typeof options[0] !== 'undefined') {
      // unalias the potential subcommand
      subcommand = optionDefinitions.__commandNames[options[0]]
      // check if the first positional is actually a subcommand
      if (subcommand in optionDefinitions) {
        // clean up positional args
        var index = 1
        while (true) {
          if (typeof options[index] !== 'undefined') {
            options[index] = options[index - 1]
          }
          else {
            break
          }
        }
        delete options[index]
        // if so, namespace its options
        options[subcommand] = {
          property: optionDefinitions[subcommand].property ? true : false
        }
        // nest subcommand options if there are any
        var properties = ['options', 'option']
        properties.forEach(function(key) {
          if (key in optionDefinitions[subcommand]) {
            for (var subcommandOption in optionDefinitions[subcommand][key]) {
              if (subcommandOption in options) {
                options[subcommand][subcommandOption] = options[subcommandOption]
                delete options[subcommandOption]
              }
            }
          }
        })
      }
    }

    return subcommand
  },

  /***************************************************************************
   * configureOptionProperties
   */        
  _configureOptionProperties: function(obj, optionDefinitions, options, subcommand) {
    if (optionDefinitions) {
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
            // if this option exists in the subcommands "option" or "options" property
            // and it is labeled a property, then make it a property at the top level on
            // the object being instantiated
            try {
              if (optionDefinitions[subcommand].options[subcommandOption].property) {
                _makeProp(subcommandOption, 
                          options[subcommand][subcommandOption], 
                          optionDefinitions[subcommand].options[subcommandOption])
              }
            }
            catch (e) { /* catch "Cannot read property 'x' of undefined" */ }
            try {
              if (optionDefinitions[subcommand].option[subcommandOption].property) {
                _makeProp(subcommandOption, 
                          options[subcommand][subcommandOption], 
                          optionDefinitions[subcommand].option[subcommandOption])
              }
            }
            catch (e) { /* catch "Cannot read property 'x' of undefined" */ }
          }
          // if the subcommand itself is labeled a property, then add it at the top 
          // level
          if (options[subcommand].property) {
            obj[subcommand] = subcommandOptions
          }
        }
        // otherwise, it is a top level option, make it a property if desired
        else if (optionDefinitions[option] && optionDefinitions[option].property) {
          _makeProp(option, options[option], optionDefinitions[option])
        }
      }
    }
  }
};

Atom.prototype.constructor = Atom; // very important this is here

/*******************************************************************************
 * atom
 */
var atom = new Atom();

/*******************************************************************************
 * o 
 * 
 * @param {Object} module
 */
function o(mod) { 
  if (!(mod instanceof Module)) {
    throw(Error("Must supply a module to o: " + JSON.stringify(mod)))
  }
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
    
    return atom.make(datum, targetType, args, false, mod);
  }
}

/*******************************************************************************
 * oo 
 * 
 * @param {Object} datum
 */
function oo(mod) {
  if (!(mod instanceof Module)) {
    throw(Error("Must supply a module to oo: " + JSON.stringify(mod)))
  }
  return function(datum) {
    return atom.make(datum, null, null, true, mod);
  }
}

/*******************************************************************************
 * exports
 */
if (typeof(exports) != "undefined") {
  exports.Atom = Atom;
  exports.o = o;
  exports.oo = oo;
}

