====
Atom
====

Atom is a Dependency Injection library for creating re-usable Javascript
components and command-line programs.

The central design goal of Atom is to provide a declarative mechanism 
for defining objects (instances of classes) and command-line interfaces. 

------------------
The ``o`` operator
------------------

At the core of Atom is the :js:func:`~atom.o` operator. The ``o`` is used to make
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

.. literalinclude:: code-frags/standalone-examples/instantiation/simpleInvoke.js
    :language: javascript 
    :start-after: pre-simpleInvokeNoType
    :end-before: post-simpleInvokeNoType
    :linenos:
    :dedent: 2

which is the same as

.. literalinclude:: code-frags/standalone-examples/instantiation/simpleInvoke.js
    :language: javascript 
    :lines: 2-3,6
    :start-after: pre-simpleInvoke
    :end-before: post-simpleInvoke
    :linenos:
    :dedent: 2

which simply evaluates to ``{}``.

You define properties on objects like so: 

.. literalinclude:: code-frags/standalone-examples/instantiation/simpleInvoke.js
    :language: javascript 
    :start-after: pre-simpleInvokeWithPropertiesNoType
    :end-before: post-simpleInvokeWithPropertiesNoType
    :linenos:
    :dedent: 2

Which is the same as:

.. literalinclude:: code-frags/standalone-examples/instantiation/simpleInvoke.js
    :language: javascript 
    :start-after: pre-simpleInvokeWithProperties
    :end-before: post-simpleInvokeWithProperties
    :linenos:
    :dedent: 2

Creating instances of arbitrary classes
***************************************

You can use Atom to create instances of JavaScript classes instead of
using ``new``. Atom works with both classical class definitions (via
constructor functions) as well as via ES6 Classes.

Here is an example using a classical constructor function:

.. literalinclude:: code-frags/standalone-examples/instantiation/constructorInvoke.js
    :language: javascript 
    :start-after: pre-constructorInvoke
    :end-before: post-constructorInvoke
    :linenos:
    :dedent: 2

Here is the same example using an ES6 class definition:

.. literalinclude:: code-frags/standalone-examples/instantiation/es6Invoke.js
    :language: javascript 
    :start-after: pre-es6Invoke
    :end-before: post-es6Invoke
    :linenos:
    :dedent: 2

Nested objects
**************

.. literalinclude:: code-frags/standalone-examples/instantiation/nestedObjectsInvoke.js
    :language: javascript 
    :start-after: pre-nestedObjectsInvoke
    :end-before: post-nestedObjectsInvoke
    :linenos:
    :dedent: 2

Specifying another object as a prototype 
****************************************

Atom can also create instances of objects that use other objects
(instead of classes) as a the value of the ``_type`` property. 

.. literalinclude:: code-frags/standalone-examples/instantiation/objectPrototypeInvoke.js
    :language: javascript 
    :start-after: pre-objectPrototypeInvoke
    :end-before: post-objectPrototypeInvoke
    :linenos:
    :dedent: 2

Defining methods
****************

You may also define functions as property values on objects defined by
``o``. While these objects are not classes, the functions behave as
methods and have access to ``this``.

.. literalinclude:: code-frags/standalone-examples/properties.js
    :language: javascript 
    :start-after: pre-objectWithMethod
    :end-before: post-objectWithMethod
    :linenos:
    :dedent: 2

Dynamic properties
******************

Properties can be defined as simple fieldname / value pairs:

.. literalinclude:: code-frags/standalone-examples/properties.js
    :language: javascript 
    :start-after: pre-keyValueProperty
    :end-before: post-keyValueProperty
    :linenos:
    :dedent: 2

They can also be defined dynamically with getters and setters as you would with
Javascript's `Object.defineProperty
<https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty>`__.

.. literalinclude:: code-frags/standalone-examples/properties.js
    :language: javascript
    :start-after: pre-dynamicProperty
    :end-before: post-dynamicProperty
    :linenos:
    :dedent: 2

Property Path Assignment
************************

If an object is being instantiated that has a property that is itself an object,
Atom allows you "reach" into those nested objects in order to initialize them 
using property paths. Property paths are denoted by prefixing the path with the
``$`` leader character.

.. literalinclude:: code-frags/standalone-examples/property-paths.js
    :language: javascript
    :start-after: pre-propertyObjectPath
    :end-before: post-propertyObjectPath
    :linenos:
    :dedent: 2

The resulting object in the above code should then look like:

.. code-block:: javascript

    {
      foo: {
        a: 0,
        b: 1,
        c: {
          d: 3
        }
      }
    }

Atom also allows for bracket notation in property paths in addition to dot
notation (as well as intermixing of the two). As such, the following
example is equivalent to the previous:

.. literalinclude:: code-frags/standalone-examples/property-paths.js
    :language: javascript
    :start-after: pre-propertyObjectPathBracketNotation
    :end-before: post-propertyObjectPathBracketNotation
    :linenos:
    :dedent: 2

Arrays are also supported:

.. literalinclude:: code-frags/standalone-examples/property-paths.js
    :language: javascript
    :start-after: pre-propertyArrayPath
    :end-before: post-propertyArrayPath
    :linenos:
    :dedent: 2

With the resulting object looking as follows:

.. code-block:: javascript

    {
      bar: [0, 1, [3]]
    }

If the leading key in the path happens to start with one or more leader
characters (e.g., ``$foo``), Atom allows you to escape these characters by
repeating them (much like ``%`` in ``printf``):

.. literalinclude:: code-frags/standalone-examples/property-paths.js
    :language: javascript
    :start-after: pre-propertyPathLeaderEscape
    :end-before: post-propertyPathLeaderEscape
    :linenos:
    :dedent: 2

The resulting object should then look like:

.. code-block:: javascript

    {
      $foo: {
        a: 0,
        b: 1,
        c: {
          $$d: 2
        }
      }
    }

It should be noted that subsequent keys in the path will not have leader
characters escaped (e.g., ``$$d`` in the previous example). Additionally, if a
key starts with ``$`` but is not a path (i.e., does not contain ``.`` or
``[]``), it will not be escaped.

$merge
******

In addition to property path assignment, Atom also supports merging objects on
initialization using the ``$merge`` operator:

.. literalinclude:: code-frags/standalone-examples/operators.js
    :language: javascript
    :start-after: pre-merge
    :end-before: post-merge
    :linenos:
    :dedent: 2

The resulting object will then look like:

.. code-block:: javascript

    {
      foo: {
        a: 0,
        b: 1,
        c: {
          f: 4
        },
        g: 5
    }

If the ``c`` property does not look like what you would expect (e.g., ``{d: 2,
e: 3, f: 4}``), this is intentional. The ``$merge`` operator performs a
"shallow" merge, overwriting any properties that you merge in. If a deeper merge
is required, ``$merge`` can be chained:

.. literalinclude:: code-frags/standalone-examples/operators.js
    :language: javascript
    :start-after: pre-mergeChain
    :end-before: post-mergeChain
    :linenos:
    :dedent: 2

The resulting object will now reflect the deeper merge:

.. code-block:: javascript

    {
      bar: {
        a: 0,
        b: 1,
        c: {
          d: 2,
          e: 3,
          f: 4
        },
        g: 5
      }
    }

It should be noted that the ``$merge`` operator will only apply if it is the
sole property in the object:

.. literalinclude:: code-frags/standalone-examples/operators.js
    :language: javascript
    :start-after: pre-noMerge
    :end-before: post-noMerge
    :linenos:
    :dedent: 2

In this case, the ``baz`` property will simply be overwritten:

.. code-block:: javascript

    {
      baz: {
        $merge: {
          c: {
            f: 4
          },
          g: 5
        },
        h: 6
      }
    }

$delete
*******

The ``$delete`` operator allows deletion of properties on initialization. For
example, the following code deletes the ``c`` property:

.. literalinclude:: code-frags/standalone-examples/operators.js
    :language: javascript
    :start-after: pre-delete
    :end-before: post-delete
    :linenos:
    :dedent: 2

The resulting object will then look like:

.. code-block:: javascript

    {
      foo: {
        a: 0,
        b: 1
      }
    }

Additionally, multiple properties can be deleted by simply listing them:

.. literalinclude:: code-frags/standalone-examples/operators.js
    :language: javascript
    :start-after: pre-deleteList
    :end-before: post-deleteList
    :linenos:
    :dedent: 2

Results in the following object being returned:

.. code-block:: javascript

    {
      bar: {
        b: 1
      }
    }

Note, just like the ``$merge`` operator, the ``$delete`` operator will be
applied if it is the only property in the object:

.. literalinclude:: code-frags/standalone-examples/operators.js
    :language: javascript
    :start-after: pre-noDelete
    :end-before: post-noDelete
    :linenos:
    :dedent: 2

Will result in the following:

.. code-block:: javascript

    {
      baz: {
        $delete: 'a',
        h: 6
      }
    }

$multiop
********

Finally, the ``$multiop`` operator allows one to apply multiple operations in
order:

.. literalinclude:: code-frags/standalone-examples/operators.js
    :language: javascript
    :start-after: pre-multiop
    :end-before: post-multiop
    :linenos:
    :dedent: 2

Will yield:

.. code-block:: javascript

    {
      foo: {
        b: 1,
        c: {
          d: 2,
          e: 3
        },
        h: 6
      }
    }

Again, the ``$multiop`` operator is subject to the same restrictions as both
``$merge`` and ``$delete``, and will only be applied if it is the sole property
in the object.

Object lifecycle and _init
**************************

Object creation via the ``o`` operator follows this sequence:

1. The ``_type`` field is evaluated. If it is a function it is then considered a
   constructor and a new instance of that Class is created.  If it is an object
   that object is used as the new object's prototype.  If no ``_type`` is
   supplied the default value of ``Object`` is used.
2. All field definitions in the object passed to the ``o`` operator are added to
   the newly created object.
3. If the object has an ``_init`` method (either directly or via its class), it
   is called.
4. The newly created object is returned.

Example using ``_init``:

.. literalinclude:: code-frags/standalone-examples/properties.js
    :language: javascript
    :start-after: pre-lifecycleInit
    :end-before: post-lifecycleInit
    :linenos:
    :dedent: 2

-------------------
Creating components 
-------------------

Components are simply objects bound in the Node.js module namespace. It is
common with Atom to use the ``o`` operator to define the object being exported
by a module:

.. literalinclude:: code-frags/standalone-examples/components.js
    :language: javascript
    :start-after: pre-component
    :end-before: post-component
    :linenos:
    :dedent: 4

----------------------
Referencing components 
----------------------

Components can be referenced with the name resolution operator ``_o``,
which comes as part of Carbon.io's Bond package.

``_o`` acts very much like ``require``:

.. literalinclude:: code-frags/standalone-examples/components.js
    :language: javascript
    :start-after: pre-componentReference
    :end-before: post-componentReference
    :linenos:
    :dedent: 4

----------------------------------------
Creating command line programs with Atom 
----------------------------------------

Atom allows for the easy creation of command line programs with built-in
argument parsing. You can use the ``_main`` property to define a
top-level entry point (or points) to your application.

Example:

.. literalinclude:: code-frags/standalone-examples/DiceRollCli.js
    :language: javascript
    :linenos:

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

    % node DiceRollCli -h

    Usage: node DiceRollCli [num] [options]

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

.. literalinclude:: code-frags/standalone-examples/HelloServer.js
    :language: javascript
    :linenos:
