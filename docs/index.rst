Atom
====

1-9-17 test**
1-9-17 test2***

Atom is a simple and powerful OO application toolkit for Javascript.

The central design goal of Atom is to provide a declarative mechanism
for defining classes, objects (instances of classes), and configurable
command-line programs.

Atom supports both the *classical* and *prototype* patterns of
implementing OO in a simple and unified manner. In addition, Atom is a
Depedency Injection framework that allows for the creation of highly
configurable re-usable software components and applications.

In particular, Atom provides mechanisms for:

-  Defining objects and classes
-  Defining re-usable software components and managing their lifecycle
-  Defining top-level commandline interfaces with easy options parsing
-  Managing application-level configuration
-  Configuring and managing application logging

Installing Atom
---------------

Using npm

.. code:: sh

    % cd <your-app>
    % npm install atom

From git:

.. code:: sh

    % git clone git@github.com:objectlabs/atom.git
    % cd <your-app>
    % npm install <path-to-atom>

To run unit tests
-----------------

.. code:: javascript

    % node ./test/all.js

Using Atom
----------

The core of Atom is comprised of two operators:

-  The ``o`` operator makes objects
-  The ``oo`` operator makes classes

The ``o`` operator
~~~~~~~~~~~~~~~~~~

The ``o`` operator is used to make objects. The operator takes a single
object datum argument and returns an object based on the supplied
specification. The specification is an object that consists of:

-  An optional ``_type`` field, whose value may be either a ``Function``
   or (representing a class constructor) or another object.

-  A series of name / value pairs specifying the properties of the
   object

Some examples
'''''''''''''

The empty object

.. code:: javascript

    var o = require('atom').o(module)

    o({})

which is the same as

.. code:: javascript

    o({_type: Object})

which simply evaluates to ``{}``.

Simple object

.. code:: javascript

    var o = require('atom').o(module)

    o({a: 1,
       b: 2});

Specifying a class via a constructor ``Function`` (in the *classical*
style)

.. code:: javascript

    var o = require('atom').o(module)

    function Person() {
       this.name = "Some Person";
       this.email = null,
       this.age = 0;
    }

    o({_type: Person,
       name: "Jo Smith",
       email: "jo@smith.com",
       age: 35});

Specifying another object as a prototype

.. code:: javascript

    var o = require('atom').o(module)

    var Person = o({
       name: "Some Person",
       email: null,
       age: 0
    });

    o({_type: Person,
       name: "Jo Smith",
       email: "jo@smith.com",
       age: 35});

Nested objects

.. code:: javascript

    var o = require('atom').o(module)

    o({_type: Person,
       name: "Jo Smith",
       email: "jo@smith.com",
       age: 35,
       address = o({
          _type: Address
          street: "100 Foo St.",
          city: "San Francisco",
          state: "CA",
          zip: "93212"
       })
    });

The ``oo`` operator
~~~~~~~~~~~~~~~~~~~

The ``oo`` operator is used to make classes. All ``oo`` expressions
evaluate to a value that is a ``Function`` that can be used as a
constructor. Like the ``o`` operator, the ``oo`` operator takes a single
object argument. In this case the object specification is the
specification for a class. The ``_type`` field can be used to specify
superclass to extend and must be a ``Function`` value.

Defining contructors and superclasses
'''''''''''''''''''''''''''''''''''''

Classes defined with ``oo`` can optionally specify a constructor, which
is a function to be used to initialize instance properties for objects
of the defined class. Constructor functions are specified via the meta
property ``_C``.

Classes can define a superclass from which it extends via the ``_type``
meta property (the same way object specify which class they are an
instance of when using the ``o`` operator).

If the class being defined has a superclass Atom will automatically
chain constructors, calling the constructor of the superclass before
calling the constructor of the class being defined.

Delegating to superclass methods
''''''''''''''''''''''''''''''''

To delegate to a method defined in a superclass, use the following form:

.. code:: sh

    <SuperClass>.prototype.<method>.call(this, <args>)

Example
'''''''

.. code:: javascript

    var o = require('atom').o(module)
    var oo = require('atom').oo(module)

    var Animal = oo({
      _C: function() {
        this.name = "Some animal"
        this.age = 0
        this.weight = 0
      },
       
      say: function() {
        return this.name;
      }
    })

    var Dog = oo({
       _type: Animal,
       _C: function() {
        this.name = "Some Dog"
      },
      
      say: function() {
        return "woof: " + Animal.prototype.say.call(this)    // delegating to superclass
      }
    })

    var fido = o({
       _type: Dog,
       name: "Fido",
       age: 3,
       weight: 10
    })

Defining properties
~~~~~~~~~~~~~~~~~~~

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

Object lifecycle and \_init
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Object creation via the ``o`` operator follows this sequence:

1. The ``_type`` field is evaluated. If it is a function it is then
   considered a constructor and a new instance of that Class is created.
   If it is an object that object is used as the new object's prototype.
   If no ``_type`` is supplied the default value of ``Object`` is used.
2. If the class defines a constructor (via ``_C``) that constructor is
   called after calling the constructor of the class's ``_type``
   (constructors defined by ``_C`` are automatically chained).
3. All field definitions in the object passed to the ``o`` operator are
   added to the newly created object
4. If the object has an ``_init`` method (either directly or via its
   class), it is called
5. The newly created object is returned

Example using ``_init``:

.. code:: javascript

    o({
      port: 8080,
      app: null,
      db: null,
      _init: function() {
        this.app = express.createServer()
        this.app.listen(this.port)
      }
    })

Creating command line programs with Atom
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Atom allows for the easy creation of command line programs with built-in
argument parsing. You can use the ``_main`` property to define a
top-level entry point (or points) to your application.

Example:

.. code:: javascript

    var o = require('atom').o(module);
    var _o = require('atom')._o(module);

    module.exports = o({
      verbose: false,
      _app: null,
      
      cmdargs: { // supports nomnom definitions (see https://github.com/harthur/nomnom)
        port: {
          abbr: "p",
          help: "port server should listen on",
          required: false,
          default: 8080
        },
        verbose: {
          abbr: "v",
          help: "enable verbose logging",
          required: false,
          default: false,
          property: true // set this value as a field on this object when parsed as a cmdline option
        }
      }
      
      _main: function(options) {
        this.port = options.port
        this._app = express.createServer()
        this._app.listen(this.port)
      }
    })

You can then call your program from the commandline like this:

.. code:: sh

    % node <path-to-your-module> <options>

Example:

.. code:: sh

    % node SimpleCmdlineApp -h
    Usage: node SimpleCmdlineApp [options]

    Options:
       -p, --port      port server should listen on [8080]
       -v, --verbose   enable verbose logging  [false]

Argument Parsing
^^^^^^^^^^^^^^^^

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
will also be passed to your ``_main`` method should you decide to define
one.

Main
^^^^

There are two ways to define your program's entry point. If you do not
utilize commands, then the recommended method is simply to define
``_main`` to be a function that will take the parsed command line as an
argument.

If commands are present, and it makes sense to have a separate handler
associated with each command, you can instead define ``_main`` to be an
object where the property names correspond to the command names defined
in ``cmdargs``. Atom will then jump to the appropriate handler based on
the command specified. If no command is specified (and ``default`` was
not specified on any command in ``cmdargs``), Atom will jump to the
function pointed to by the ``default`` property on ``_main``.

Example:

.. code:: javascript

    var fs = require('fs')
    var o = require('atom').o(module);
    var _o = require('atom')._o(module);

    module.exports = o({
      verbose: false,
      _app: null,
      
      cmdargs: { // supports nomnom definitions (see https://github.com/harthur/nomnom)
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
        },
        stopServer: {
          command: true,
          full: 'stop-server',
        }
        verbose: {
          abbr: "v",
          help: "enable verbose logging",
          required: false,
          default: false,
          property: true // set this value as a field on this object when parsed as a cmdline option
        }
      }
      
      _main: {
        startServer: function(options) {
          this.port = options.port
          this._app = express.createServer()
          this._app.listen(this.port)
          fs.writeFileSync('/tmp/server.pid', process.pid, {encoding: 'utf8'})
        },
        stopServer: function(options) {
          var pid = fs.readFileSync('/tmp/server.pid', {encoding: 'utf8'})
          process.kill(pid, 'SIGINT')
        }
      }
    })
