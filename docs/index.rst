====
Atom
====

Atom is a Dependency Injection library for creating re-usable
Javascript components and command-line programs.

The central design goal of Atom is to provide a declarative mechanism 
for defining objects (instances of classes) and command-line interfaces. 

------------------
The ``o`` operator
------------------

At the core of Atom is the ``o`` operator. The ``o`` is used to make
objects.

The ``o`` operator takes a specification of an object that defines:

-  An optional ``_type`` field, whose value may be either a ``Function``
   (representing a class constructor) or another object.

-  A series of name / value pairs specifying the properties of the
   object.

The ``o`` operator can be thought of as a generic object factory you
can use to create instances of JavaScript classes.
   
Creating simple objects
***********************

You can create simple instance of ``Object`` like this (which is the
same as not using ``o`` at all):

.. code:: javascript

  var o = require('carbon-io').atom.o(module)

  o({})
 
which is the same as

.. code:: javascript

    o({_type: Object})

which simply evaluates to ``{}``.

You define properties on objects like so: 

.. code:: javascript 
     
  o({a: 1, 
     b: 2})

Which is the same as:

.. code:: javascript 
     
  o({
    _type: Object,
    a: 1, 
    b: 2
  })

Creating instances of arbitrary classes
***************************************

You can use Atom to create instances of JavaScript classes instead of
using ``new``. Atom works with both classical class definitions (via
constructor functions) as well as via ES6 Classes.

Here is an example using a classical constructor function:

.. code:: javascript 

    var o = require('carbon-io').atom.o(module) 

    // Person class 
    function Person() {
       this.name = "Some Person"
       this.email = null
       this.age = 0
    }

    // Instance of Person 
    o({
      _type: Person, 
      name: "Jo Smith", 
      email: "jo@smith.com", 
      age: 35 
    })

Here is the same example using an ES6 class definition:

.. code:: javascript 

    var o = require('carbon-io').atom.o(module) 

    // Person class 
    class Person {
      constructor() {
        this.name = "Some Person"
        this.email = null 
        this.age = 0
      }
    }

    // Instance of Person 
    o({
      _type: Person, 
      name: "Jo Smith", 
      email: "jo@smith.com", 
      age: 35 
    })

Nested objects
**************

.. code:: javascript

    o({
      _type: Person,
      name: "Jo Smith",
      email: "jo@smith.com",
      age: 35,
      address = o({
        _type: Address,
        street: "100 Foo St.",
        city: "San Francisco",
        state: "CA",
        zip: "93212"
      })
    })

Specifying another object as a prototype 
****************************************

Atom can also create instances of objects that use other objects
(instead of classes) as a the value of the ``_type`` property. 

.. code:: javascript 

    var o = require('carbon-io').atom.o(module) 

    // Person class 
    class Person {
      constructor() {
        this.name = "Some Person"
        this.email = null 
        this.age = 0
      }
    }

    // Instance of Person 
    var Jo = o({
      _type: Person, 
      name: "Jo Smith", 
      email: "jo@smith.com", 
      age: 35 
    })

    // Instance of Jo
    var LittleJo = o({
      _type: Jo, // Will "inherit" all the properties of Jo
      age: 2     
    })

Defining methods
****************

You may also define functions as property values on objects defined by
``o``. While these objects are not classes, the functions behave as
methods and have access to ``this``.

.. code:: javascript 

    var o = require('carbon-io').atom.o(module) 

    // Person class 
    class Person {
      constructor() {
        this.name = "Some Person"
        this.email = null 
        this.age = 0
      }
    }

    // Instance of Person 
    var Jo = o({
      _type: Person, 
      name: "Jo Smith", 
      email: "jo@smith.com", 
      age: 35,
      sayName: function() {
        console.log(this.name)
      }
    })

    Jo.sayName() // prints "Jo Smith"

Dynamic properties
******************

Properties can be defined as simple fieldname / value pairs

.. code:: javascript

    o({
      name: "John Smith"
    })

or they can be defined dynamically with getters and setters as you would
with Javascript's
```Object.defineProperty`` <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty>`__

.. code:: javascript

    o({
      now: {
        $property: {
          get: function() {
            return new Date()
          }
        }
      }
    })

Object lifecycle and _init
**************************

Object creation via the ``o`` operator follows this sequence:

1. The ``_type`` field is evaluated. If it is a function it is then
   considered a constructor and a new instance of that Class is created.
   If it is an object that object is used as the new object's prototype.
   If no ``_type`` is supplied the default value of ``Object`` is used.
2. All field definitions in the object passed to the ``o`` operator are
   added to the newly created object.
3. If the object has an ``_init`` method (either directly or via its
   class), it is called.
4. The newly created object is returned.

Example using ``_init``:

.. code:: javascript

  o({
    delay: 1000,
    _init: function() {
      setInterval(function() {
        console.log("Hello!")
      }, this.delay)
    }
  })

-------------------
Creating components 
-------------------

Components are simply objects bound in the Node.js module
namespace. It is common with Atom to use the ``o`` operator to define
the object being exported by a module:

.. code:: javascript 
          
  var o = require('carbon-io').atom.o(module) 
  var ScheduledJob = require('./ScheduledJob') 
  
  module.exports = o({
    _type: ScheduledJob, 
    interval: 30000, 
    doit: function(cb) {
      try {
        // do some work 
      } catch (e) {
        cb(e) 
      }
      cb() 
    }
  })

----------------------
Referencing components 
----------------------

Components can be referenced with the name resolution operator ``_o``,
which comes as part of Carbon.io's Bond package.

``_o`` acts very much like ``require``:

.. code:: javascript 
          
  var o = require('carbon-io').atom.o(module) 
  
  module.exports = o({

    idGenerator: _o('./MyIdGenerator'),
    idGenerator: _o('./MyIdGenerator'),
    
    
  })


----------------------------------------
Creating command line programs with Atom 
----------------------------------------

Atom allows for the easy creation of command line programs with built-in
argument parsing. You can use the ``_main`` property to define a
top-level entry point (or points) to your application.

Example:

.. code:: javascript
          
  var o = require('carbon-io').atom.o(module).main // Note the .main here since this is the main application 

  module.exports = o({
    verbose: false,

    cmdargs: {
      sides: {
        abbr: "s",
        help: "The number of sides each die should have.",
        required: false,
        default: 6
      },
      num: {
        position: 0,
        flag: false,
        help: "The number of dice to roll.",
        required: false,
        default: 1
      },
      verbose: {
        abbr: "v",
        flag: true,
        help: "Log verbose output.",
        required: false,
        property: true // Will result in this.verbose having the value passed at the cmdline
      },
    },
      
    _main: function(options) {
      if (this.verbose) {
        console.log("Here is the input")
        console.log(args)
        console.log("Ok... rolling.......")
      }

      var numDice = args.num
      var numSides = args.sides
      var result = []
      for (var i = 0; i < numDice; i++) {
        result.push(Math.floor(Math.random() * numSides + 1)) // Random integer between 1 and numSides
      }
      
      console.log(result)
    }
  })

Make note that here we use the ``main`` variant of the ``o`` operator
to indicate to Atom that it should run the ``_main`` method when this
module is invoked as the main module from Node.js. If not run as the
main module ``_main`` will not be called, which is useful for creating
modules that can act as both applications and components / libraries.
  
You can then call your program from the commandline like this:

.. code:: sh

    % node <path-to-your-module> <options>

You can see the commandline help generated automatically by Atom using
the ``-h`` flag:

.. code:: sh

  % node RollDice -h
  Usage: node RollDice.js [num] [options]

  num     The number of dice to roll.

  Options:
     -s, --sides     The number of sides each die should have.  [6]
     -v, --verbose   Log verbose output.

  Environment variables: 
    <none>


Argument Parsing
****************

The arg-parser used internally by Atom is ``nomnom`` (please see
https://github.com/harthur/nomnom for a full list of options and
features). Atom supports ``nomnom`` commands and options with a few
extra configuration options noted below.

To specify your CLI interface, you should add a top-level property to
your object named ``cmdargs``. The object defined at ``cmdargs`` can
contain both commands and options. Options specific to a command should
be nested under the command using the ``cmdargs`` property. In addition
to the ``cmdargs`` property, commands also support ``full``,
``default``, and ``property``. ``full`` behaves the same for commands as
it does for options, allowing you to alias your command with something
CLI friendly (e.g. 'start-server' rather than 'startServer').
``default`` allows you to specify a default command. In the event that a
command is not specified, the options provided will be parsed in the
context of that command. If ``property`` is specified, then the parsed
command (along with any nested options) will be attached to the top
level object as a property (overwriting any property that may have
previously existed).

Options support the ``property`` property as well. Please note that if
``property`` is specified on an option nested within a command, that
property will still be set on the top-level object.

Regardless of whether you specify ``property`` on any commands or
options, the top-level object will contain a ``parsedCmdargs`` property
whose value will contain the fully parsed command line. Note that this
will also be passed to your ``_main`` method.

_main
*****

There are two ways to define your program's entry point. If you do not
utilize sub-commands, then the recommended method is simply to define
``_main`` to be a function that will take the parsed command line as
an argument.

If sub-commands are present, and it makes sense to have a separate handler
associated with each sub-command, you can instead define ``_main`` to be an
object where the property names correspond to the sub-command names defined
in ``cmdargs``. Atom will then jump to the appropriate handler based on
the command specified. If no command is specified (and ``default`` was
not specified on any command in ``cmdargs``), Atom will jump to the
function pointed to by the ``default`` property on ``_main``.

Example:

.. code:: javascript

  var http = require('http')
  var fs = require('fs')
  var carbon = require('carbon-io')
  var o = carbon.atom.o(module).main

  module.exports = o({
    verbose: false,
    _app: undefined,
      
    cmdargs: { 
      startServer: {
        command: true,
        full: 'start-server',
        default: true,
        cmdargs: {
          port: {
            abbr: "p",
            help: "port server should listen on",
            required: false,
            default: 8080
          }
        }
      },
      stopServer: {
        command: true,
        full: 'stop-server',
      },
      verbose: {
        abbr: "v",
        help: "enable verbose logging",
        required: false,
        default: false,
        property: true // set this value as a field on this object when parsed as a cmdline option
      }
    },
      
    _main: {
      startServer: function(options) {
        this.port = options.port
        this._app = http.createServer(function(req, res) {
          res.send("Hello")
        })
        this._app.listen(this.port, '127.0.0.1', function() {
          fs.writeFileSync('/tmp/server.pid', process.pid, {encoding: 'utf8'})  
          if (this.verbose) {
            console.log("Server listening on port: " + this.port)
          }
        })      
      },
      stopServer: function(options) {
        var pid = fs.readFileSync('/tmp/server.pid', {encoding: 'utf8'})
        if (pid) {
          if (this.verbose) {
            console.log("Stopping server with pid: " + pid)
          }
          process.kill(pid, 'SIGTERM')
        }
      }
    }
  })
