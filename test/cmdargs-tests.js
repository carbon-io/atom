var assert = require('assert')
var util = require('util')

var mockery = require('mockery')
var _ = require('lodash')

var testtube = require('@carbon-io/test-tube')

var makeTest = require('./util').makeTest

function CmdArgsTest() {
  testtube.Test.call(this)
}
util.inherits(CmdArgsTest, testtube.Test)
CmdArgsTest.prototype.setup = function() {
  this.parent.tsetup()
}
CmdArgsTest.prototype.teardown = function() {
  this.parent.tteardown()
}

var cmdArgsTests = makeTest({
  name: 'CmdArgsTests',
  description: 'cmdargs tests',
  _C: function() {
    this.Atom = undefined
    this.o = undefined
    this.oo = undefined
    this.Foo = undefined
    this.objCmdArgs = undefined
    this.objCls = undefined
    this.objProperties = undefined
    this.obj = undefined
    this.Bar = undefined
    this._argv = undefined
  },
  _init: function() {
    this.objCls = {
      runMainInFiber: false,

      _main: function(options) {
        return 0
      }
    }
    this.objCmdArgs = {
      foo: {
        command: true,
        cmdargs: {
          fooo: {
            full: 'foo-foo',
            abbr: 'f',
            property: true,
            metavar: 'FOO'
          },
          bar: {
            abbr: 'b',
            flag: true,
          }
        }
      },
      bar: {
        command: true,
        property: true,
        full: 'bar-bar',
        cmdargs: {
          baz: {
            flag: true,
            property: true,
            abbr: 'b'
          }
        }
      }
    }
    this.objProperties = {}
    testtube.Test.prototype._init.call(this)
  },
  tsetup: function() {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })

    this.Atom = require('../lib/atom').Atom
    this.o = require('../lib/atom').o(module)
    this.oo = require('../lib/atom').oo(module)

    this.Foo = this.oo(this.objCls)

    this.obj = _.merge(
      {},
      {
      _type: this.Foo,
      cmdargs: this.objCmdArgs
      },
      this.objProperties
    )

    this._argv = process.argv
  },
  tteardown: function() {
    mockery.disable()
    process.argv = this._argv
  },
  tests: [
    makeTest({
      name: 'Options',
      description: 'Options',
      doTest: function() {
        process.env.FOOBISH = "hello"
        process.argv = ['node', 'foo', '-b', '--foo-foo', 'bar']

        var foo = this.parent.o({
          _type: this.parent.Foo,
          environmentVariables: {
            FOOBISH: {
              private: true
            }
          },
          cmdargs: {
            foo: {
              full: 'foo-foo',
              property: true,
              metavar: 'FOO'
            },
            bar: {
              abbr: 'b',
              flag: true
            },
            baz: {
              default: 2,
              property: true
            }
          }
        })

        var atom = new this.parent.Atom()

        atom._runMain(foo, require.main)

        assert(!process.env.FOOBISH)
        assert(process.__privateEnv.FOOBISH === "hello")

        assert(!('foo-foo' in foo.parsedCmdargs))
        assert(!('foo-foo' in foo))

        assert('foo' in foo.parsedCmdargs)
        assert('foo' in foo)

        assert(foo.foo === 'bar')

        assert(!('bar' in foo))
        assert('bar' in foo.parsedCmdargs)

        assert(foo.parsedCmdargs.bar)

        assert('baz' in foo.parsedCmdargs)
        assert('baz' in foo)

        assert(foo.parsedCmdargs['baz'] === 2)
        assert(foo.baz === 2)
      }
    }, CmdArgsTest),
    makeTest({
      name: 'SubcommandOptions',
      description: 'Subcommand options',
      doTest: function() {
        var foo = this.parent.o(_.clone(this.parent.obj, true))

        process.argv = ['node', 'foo', 'bar-bar', '-b']

        var atom = new this.parent.Atom()

        atom._runMain(foo, require.main)

        assert('bar' in foo)
        assert('baz' in foo)
        assert(foo.baz)
        assert('baz' in foo.bar)
        assert(foo.bar.baz)
        assert(!('foo' in foo))
      }
    }, CmdArgsTest),
    makeTest({
      name: 'SubcommandOptions',
      description: 'Subcommand options',
      doTest: function() {
        var foo = this.parent.o(_.clone(this.parent.obj, true))

        process.argv = ['node', 'foo', 'foo', '--foo-foo', 'baz', '-b']

        var atom = new this.parent.Atom()
        atom._runMain(foo, require.main)

        assert('fooo' in foo)
        assert(foo['fooo'] === 'baz')

        assert(!('foo' in foo))

        assert(!('bar' in foo))
      }
    }, CmdArgsTest),
    makeTest({
      name: 'AbsentSubcommand',
      description: 'Absent subcommand',
      doTest: function() {
        var foo = this.parent.o(_.clone(this.parent.obj, true))

        process.argv = ['node', 'foo']

        var atom = new this.parent.Atom()

        atom._runMain(foo, require.main)
      }
    }, CmdArgsTest),
    makeTest({
      name: 'SubcommandWithGlobalOptions',
      description: 'Subcommand with global options',
      setup: function() {
        this.parent.objCmdArgs = {
          foo: {
            command: true,
            property: true,
            cmdargs: {
              fooo: {
                full: 'foo-foo',
                abbr: 'f',
                property: true,
                metavar: 'FOO'
              },
              bar: {
                abbr: 'b',
                flag: true,
              }
            }
          },
          baz: {
            property: true,
            metavar: 'BAZ'
          },
          blah: {
            property: true,
            flag: true
          }
        }
        CmdArgsTest.prototype.setup.call(this)
      },
      doTest: function() {
        var foo = this.parent.o(_.clone(this.parent.obj, true))

        process.argv = ['node', 'foo', 'foo', '--baz', 'bar', '--blah', '-b', '-f', 'blah']

        var atom = new this.parent.Atom()

        atom._runMain(foo, require.main)

        assert('baz' in foo)
        assert.equal(foo.baz, 'bar')
        assert('blah' in foo)
        assert(foo.blah)
        assert(!('bar' in foo))

        assert('foo' in foo)
        assert(!('baz' in foo.foo))
        assert(!('blah' in foo.foo))
        assert('bar' in foo.foo)
      }
    }, CmdArgsTest),
    makeTest({
      name: 'SubcommandDispatch',
      description: 'Subcommand dispatch',
      setup: function() {
        this.parent.objCmdArgs = {
          cmd1: {
            command: true,
            property: true,
            cmdargs: {
              opt1: {
                property: true,
                metavar: 'FOO'
              },
              opt2: {
                flag: true,
              }
            }
          },
          cmd2: {
            command: true,
            property: true,
            cmdargs: {
              opt1: {
                property: true,
                metavar: 'FOO'
              },
              opt2: {
                flag: true,
              }
            }
          },
          foo: {
            property: true,
            metavar: 'BAZ'
          },
          bar: {
            property: true,
            flag: true
          }
        }
        this.parent.objProperties = {
          _handlerCalled: null,
          _main: {
            cmd1: function (options) {
              this._handlerCalled = 'cmd1'
            },
            cmd2: function (options) {
              this._handlerCalled = 'cmd2'
            }
          }
        }
        CmdArgsTest.prototype.setup.call(this)
      },
      doTest: function() {
        var foo = this.parent.o(_.clone(this.parent.obj, true))

        process.argv = ['node', 'foo', 'cmd1', '--opt1', 'bar', '--opt2', '--bar']

        var atom = new this.parent.Atom()

        atom._runMain(foo, require.main)

        assert('opt1' in foo)
        assert.equal(foo.opt1, 'bar')

        assert(!('opt2' in foo))

        assert('bar' in foo)
        assert(foo.bar)

        assert(!('cmd2' in foo))

        assert('cmd1' in foo)
        assert(foo.cmd1.opt2)

        assert.equal(foo._handlerCalled, 'cmd1')
      }
    }, CmdArgsTest),
    makeTest({
      name: 'SubcommandDispatch',
      description: 'Subcommand dispatch',
      doTest: function() {
        var foo = this.parent.o(_.clone(this.parent.obj, true))

        process.argv = ['node', 'foo', 'cmd2', '--opt1', 'bar', '--opt2', '--bar']

        var atom = new this.parent.Atom()

        atom._runMain(foo, require.main)

        assert('opt1' in foo)
        assert.equal(foo.opt1, 'bar')

        assert(!('opt2' in foo))

        assert('bar' in foo)
        assert(foo.bar)

        assert(!('cmd1' in foo))

        assert('cmd2' in foo)
        assert(foo.cmd2.opt2)

        assert.equal(foo._handlerCalled, 'cmd2')
      }
    }, CmdArgsTest),
    makeTest({
      name: 'DefaultSubcommandDispatch',
      description: 'Default subcommand dispatch',
      setup: function() {
        this.parent.objCmdArgs = {
          cmd1: {
            command: true,
              property: true,
          },
          cmd2: {
            command: true,
              property: true,
          },
          opt1: {
            property: true,
              metavar: 'FOO'
          },
          opt2: {
            flag: true,
          }
        }
        this.parent.objProperties = {
          _handlerCalled: null,
          _main: {
            cmd1: function (options) {
              this._handlerCalled = 'cmd1'
            },
            cmd2: function (options) {
              this._handlerCalled = 'cmd2'
            },
            default: function (options) {
              this._handlerCalled = 'default'
            }
          }
        }
        CmdArgsTest.prototype.setup.call(this)
      },
      doTest: function() {
        var foo = this.parent.o(_.clone(this.parent.obj, true))

        process.argv = ['node', 'foo', '--opt1', 'bar', '--opt2']

        var atom = new this.parent.Atom()

        atom._runMain(foo, require.main)

        assert.equal(foo._handlerCalled, 'default')

        assert('opt1' in foo)
        assert.equal(foo.opt1, 'bar')

        assert(!('opt2' in foo))
      }
    }, CmdArgsTest),
    makeTest({
      name: 'DefaultSubcommandDispatch',
      description: 'Default subcommand dispatch',
      setup: function() {
        this.parent.objProperties._main = function(options) {
          if ('cmd1' in options) {
            this._handlerCalled = 'cmd1'
          }
          else if ('cmd2' in options) {
            this._handlerCalled = 'cmd2'
          }
          else {
            this._handlerCalled = 'default'
          }
        }
        CmdArgsTest.prototype.setup.call(this)
      },
      doTest: function() {
        var foo = this.parent.o(_.clone(this.parent.obj, true))

        process.argv = ['node', 'foo', '--opt1', 'bar', '--opt2']

        var atom = new this.parent.Atom()

        atom._runMain(foo, require.main)

        assert.equal(foo._handlerCalled, 'default')

        assert('opt1' in foo)
        assert.equal(foo.opt1, 'bar')

        assert(!('opt2' in foo))
      }
    }, CmdArgsTest),
    makeTest({
      name: 'DefaultSubcommandDispatch',
      description: 'Default subcommand dispatch',
      doTest: function() {
        var foo = this.parent.o(_.clone(this.parent.obj, true))

        process.argv = ['node', 'foo', 'cmd1', '--opt1', 'bar', '--opt2']

        var atom = new this.parent.Atom()

        atom._runMain(foo, require.main)

        assert.equal(foo._handlerCalled, 'cmd1')

        assert('opt1' in foo)
        assert.equal(foo.opt1, 'bar')

        assert(!('opt2' in foo))
      }
    }, CmdArgsTest),
    makeTest({
      name: 'DefaultCommandProperty',
      description: 'Default command property',
      setup: function() {
        this.parent.objCmdArgs = {
          cmd1: {
            command: true,
            default: true,
            property: true,
          },
          cmd2: {
            command: true,
            property: true,
          },
          opt1: {
            property: true,
            metavar: 'FOO'
          },
          opt2: {
            flag: true,
          }
        }
        this.parent.objProperties = {
          _handlerCalled: null,
          _main: {
            cmd1: function(options) {
              this._handlerCalled = 'cmd1'
            },
            cmd2: function(options) {
              this._handlerCalled = 'cmd2'
            }
          }
        }
        CmdArgsTest.prototype.setup.call(this)
      },
      doTest: function() {
        var foo = this.parent.o(_.clone(this.parent.obj, true))

        process.argv = ['node', 'foo', '--opt1', 'bar', '--opt2']

        var atom = new this.parent.Atom()

        atom._runMain(foo, require.main)

        assert.equal(foo._handlerCalled, 'cmd1')

        assert('opt1' in foo)
        assert.equal(foo.opt1, 'bar')

        assert(!('opt2' in foo))
      }
    }, CmdArgsTest),
    makeTest({
      name: 'PositionalArgs',
      description: 'Positional args',
      setup: function() {
        this.parent.objCmdArgs = {
          cmd1: {
            command: true,
            property: true,
            cmdargs: {
              cmd1opt1: {
                position: 0,
                property: true,
                metavar: 'CMD1OPT1'
              }
            }
          },
          cmd2: {
            command: true,
            property: true,
          },
          opt1: {
            property: true,
            metavar: 'FOO'
          },
          opt2: {
            flag: true,
          }
        }
        CmdArgsTest.prototype.setup.call(this)
      },
      doTest: function() {
        var foo = this.parent.o(_.clone(this.parent.obj, true))

        process.argv = ['node', 'foo', 'cmd1', 'posarg1']

        var atom = new this.parent.Atom()

        atom._runMain(foo, require.main)

        assert('cmd1opt1' in foo)
        assert.equal(foo.cmd1opt1, 'posarg1')
      }
    }, CmdArgsTest),
    makeTest({
      name: 'MultiplePositionalArgs',
      description: 'Multiple positional args',
      setup: function() {
        this.parent.objCmdArgs = {
          cmd1: {
            command: true,
            property: true,
            cmdargs: {
              cmd1opt1: {
                position: 0,
                property: true,
                metavar: 'CMD1OPT1'
              },
              cmd1opt2: {
                position: 1,
                property: true,
                metavar: 'CMD1OPT2',
                required: false
              }
            }
          },
          cmd2: {
            command: true,
            property: true,
          },
          opt1: {
            property: true,
            metavar: 'FOO'
          },
          opt2: {
            flag: true,
          }
        }
        CmdArgsTest.prototype.setup.call(this)
      },
      doTest: function() {
        var foo = this.parent.o(_.clone(this.parent.obj, true))

        process.argv = ['node', 'foo', 'cmd1', '--opt1', 'bar', '--opt2', 'posarg1', 'posarg2']

        var atom = new this.parent.Atom()

        atom._runMain(foo, require.main)

        assert('opt1' in foo)
        assert.equal(foo.opt1, 'bar')

        assert(!('opt2' in foo))

        assert('cmd1opt1' in foo)
        assert.equal(foo.cmd1opt1, 'posarg1')
        assert('cmd1opt2' in foo)
        assert.equal(foo.cmd1opt2, 'posarg2')
      }
    }, CmdArgsTest),
  ]
})

module.exports = cmdArgsTests
