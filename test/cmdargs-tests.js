var assert = require('assert')
var mockery = require('mockery')
var nomnom = require('nomnom')
var _ = require('lodash')

var Atom, o, oo
var Foo, Bar

var _argv

var setup = function() {
  mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false,
    useCleanCache: true
  })

  mockery.registerMock('nomnom', nomnom())

  Atom = require('../lib/atom').Atom
  o = require('../lib/atom').o(module)
  oo = require('../lib/atom').oo(module)

  Foo = oo({
    _main: function(options) {
      return 0
    }
  })

  _argv = process.argv
}

var teardown = function() {
  mockery.disable()
  process.argv = _argv
}

// -- test options

setup()

try {
  process.env.FOOBISH = "hello"
  process.argv = ['node', 'foo', '-b', '--foo-foo', 'bar']

  var foo = o({
    _type: Foo,
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

  var atom = new Atom()

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
finally {
  teardown()
}

// -- test subcommand options

obj = {
  _type: Foo,
  cmdargs: {
    foo: {
      command: true,
      // test deprecated "options" property
      options: {
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
}  

setup()

try {
  var foo = o(_.clone(obj, true))  

  process.argv = ['node', 'foo', 'bar-bar', '-b']

  var atom = new Atom()

  atom._runMain(foo, require.main)

  assert('bar' in foo)
  assert('baz' in foo)
  assert(foo.baz)
  assert('baz' in foo.bar)
  assert(foo.bar.baz)
  assert(!('foo' in foo))
}
finally {
  teardown()
}

setup()

try {
  var foo = o(_.clone(obj, true))  

  process.argv = ['node', 'foo', 'foo', '--foo-foo', 'baz', '-b']

  var atom = new Atom()

  atom._runMain(foo, require.main)

  assert('fooo' in foo)
  assert(foo['fooo'] === 'baz')

  assert(!('foo' in foo))

  assert(!('bar' in foo))
}
finally {
  teardown()
}

// -- test absent subcommand

setup()

try {
  var foo = o(_.clone(obj, true))  

  process.argv = ['node', 'foo']

  var atom = new Atom()

  // atom._runMain(foo, require.main)
}
finally {
  teardown()
}

// -- test subcommand with global options

obj = {
  _type: Foo,
  cmdargs: {
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
}

setup()

try {
  var foo = o(_.clone(obj, true))

  process.argv = ['node', 'foo', 'foo', '--baz', 'bar', '--blah', '-b', '-f', 'blah']

  var atom = new Atom()

  atom._runMain(foo, require.main)
  
  assert('baz' in foo)
  assert(foo.baz === 'bar')
  assert('blah' in foo)
  assert(foo.blah)
  assert(!('bar' in foo))

  assert('foo' in foo)
  assert(!('baz' in foo.foo))
  assert(!('blah' in foo.foo))
  assert('bar' in foo.foo)
}
finally {
  teardown()
}

// -- test subcommand dispatch

obj = {
  _type: Foo,
  cmdargs: {
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
  },
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

setup()

try {
  var foo = o(_.clone(obj, true))

  process.argv = ['node', 'foo', 'cmd1', '--opt1', 'bar', '--opt2', '--bar']

  var atom = new Atom()

  atom._runMain(foo, require.main)
  
  assert('opt1' in foo)
  assert(foo.opt1 === 'bar')

  assert(!('opt2' in foo))

  assert('bar' in foo)
  assert(foo.bar)

  assert(!('cmd2' in foo))

  assert('cmd1' in foo)
  assert(foo.cmd1.opt2)

  assert(foo._handlerCalled === 'cmd1')
}
finally {
  teardown()
}

setup()

try {
  var foo = o(_.clone(obj, true))

  process.argv = ['node', 'foo', 'cmd2', '--opt1', 'bar', '--opt2', '--bar']

  var atom = new Atom()

  atom._runMain(foo, require.main)
  
  assert('opt1' in foo)
  assert(foo.opt1 === 'bar')

  assert(!('opt2' in foo))

  assert('bar' in foo)
  assert(foo.bar)

  assert(!('cmd1' in foo))

  assert('cmd2' in foo)
  assert(foo.cmd2.opt2)

  assert(foo._handlerCalled === 'cmd2')
}
finally {
  teardown()
}

// -- test subcommand dispatch default

obj = {
  _type: Foo,
  cmdargs: {
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
  },
  _handlerCalled: null,
  _main: {
    cmd1: function(options) {
      this._handlerCalled = 'cmd1'
    },
    cmd2: function(options) {
      this._handlerCalled = 'cmd2'
    },
    default: function(options) {
      this._handlerCalled = 'default'
    }
  }
}

setup()

try {
  var foo = o(_.clone(obj, true))

  process.argv = ['node', 'foo', '--opt1', 'bar', '--opt2']

  var atom = new Atom()

  atom._runMain(foo, require.main)
  
  assert(foo._handlerCalled === 'default')  

  assert('opt1' in foo)
  assert(foo.opt1 === 'bar')

  assert(!('opt2' in foo))
}
finally {
  teardown()
}

obj._main = function(options) {
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

setup()

try {
  var foo = o(_.clone(obj, true))

  process.argv = ['node', 'foo', '--opt1', 'bar', '--opt2']

  var atom = new Atom()

  atom._runMain(foo, require.main)
  
  assert(foo._handlerCalled === 'default')  

  assert('opt1' in foo)
  assert(foo.opt1 === 'bar')

  assert(!('opt2' in foo))
}
finally {
  teardown()
}

setup()

try {
  var foo = o(_.clone(obj, true))

  process.argv = ['node', 'foo', 'cmd1', '--opt1', 'bar', '--opt2']

  var atom = new Atom()

  atom._runMain(foo, require.main)
  
  assert(foo._handlerCalled === 'cmd1')  

  assert('opt1' in foo)
  assert(foo.opt1 === 'bar')

  assert(!('opt2' in foo))
}
finally {
  teardown()
}

// -- test default command property

obj = {
  _type: Foo,
  cmdargs: {
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
  },
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

setup()

try {
  var foo = o(_.clone(obj, true))

  process.argv = ['node', 'foo', '--opt1', 'bar', '--opt2']

  var atom = new Atom()

  atom._runMain(foo, require.main)
  
  assert(foo._handlerCalled === 'cmd1')  

  assert('opt1' in foo)
  assert(foo.opt1 === 'bar')

  assert(!('opt2' in foo))
}
finally {
  teardown()
}

// -- test positional arg

obj = {
  _type: Foo,
  cmdargs: {
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
  },
}

setup()

try {
  var foo = o(_.clone(obj, true))

  process.argv = ['node', 'foo', 'cmd1', 'posarg1']

  var atom = new Atom()

  atom._runMain(foo, require.main)
  
  assert('cmd1opt1' in foo)
  assert(foo.cmd1opt1 === 'posarg1')
}
finally {
  teardown()
}


// -- test multiple positional args

obj = {
  _type: Foo,
  cmdargs: {
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
  },
}

setup()

try {
  var foo = o(_.clone(obj, true))

  process.argv = ['node', 'foo', 'cmd1', '--opt1', 'bar', '--opt2', 'posarg1', 'posarg2']

  var atom = new Atom()

  atom._runMain(foo, require.main)
  
  assert('opt1' in foo)
  assert(foo.opt1 === 'bar')

  assert(!('opt2' in foo))

  assert('cmd1opt1' in foo)
  assert(foo.cmd1opt1 === 'posarg1')
  assert('cmd1opt2' in foo)
  assert(foo.cmd1opt2 === 'posarg2')
}
finally {
  teardown()
}

