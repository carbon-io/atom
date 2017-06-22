var assert = require('assert')
var os = require('os')

var _ = require('lodash')
var sinon = require('sinon')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var logging = require('@carbon-io/logging')

var util = require('./util')

var o = require('../lib/atom').o(module)

__(function() {
  module.exports = util.makeTest({
    name: 'InternalLoggingTests',
    tsetup: function() {
      // do not run this in the top level test since we are mocking Date 
      // (would screw up test timings otherwise)
      this.sb = sinon.sandbox.create({
        useFakeTimers: ['Date']
      })
      this.sb.stub(os, 'hostname').callsFake(function() {
        return 'foo.bar'
      })
      this.atomLogger = logging.getLogger('carbon-io.atom')
      this.sb.stub(this.atomLogger._logger, '_level').value(logging.levels.TRACE)
      this.outStream = o({
        _type: logging.streams.StringIO,
        raw: true
      })
      this.sb.stub(this.atomLogger.streams[0].stream, '_stream').value(this.outStream)
      this.sb.stub(this.atomLogger.streams[0], 'level').value(logging.levels.TRACE)
    },
    tteardown: function() {
      this.sb.restore()
    },
    tests: [
      util.makeTest({
        name: 'TestResolverStackTrace',
        setup: function() {
          this.parent.tsetup()
        },
        teardown: function() {
          this.parent.tteardown()
        },
        doTest: function() {
          assert.throws(function() {
            o({
              _type: 'DoesNotExist'
            })
          })
          assert(
            this.parent.outStream.getValue().includes(
              'Error: Cannot find module \'DoesNotExist\''))
        }
      }),
      util.makeTest({
        name: 'runMainInFiberDeprecationWarningTest',
        setup: function() {
          this.parent.tsetup()
        },
        teardown: function() {
          this.parent.tteardown()
        },
        doTest: function() {
          var self = this
          var mainCalled = false
          var o_ = require('../lib/atom').o(require.main)
          var app = o_.main({
            runMainInFiber: true,
            _main: function() {
              mainCalled = true
            }
          })
          assert(mainCalled)
          assert(self.parent.outStream.getValue().includes('DEPRECATED'))
        }
      }),
      util.makeTest({
        name: 'badExitCodeWarningTest',
        setup: function() {
          this.parent.tsetup()
        },
        teardown: function() {
          this.parent.tteardown()
        },
        doTest: function() {
          var self = this
          var mainCalled = false
          var o_ = require('../lib/atom').o(require.main)
          var app = o_.main({
            _main: function() {
              mainCalled = true
              return 'foo'
            }
          })
          assert(mainCalled)
          var logLine = self.parent.outStream.getValue()
          assert(logLine.includes('non-numeric exit code'))
          assert(logLine.includes('foo'))
          assert(logLine.includes('128'))
        }
      }),
      util.makeTest({
        name: 'missingEnvironmentVariableTest',
        setup: function() {
          var self = this
          this.parent.tsetup()
          this.exitVal = undefined
          this.parent.sb.stub(process, 'exit').callsFake(function(exitVal) {
            self.exitVal = exitVal
          })
        },
        teardown: function() {
          this.parent.tteardown()
        },
        doTest: function() {
          var self = this
          var mainCalled = false
          var o_ = require('../lib/atom').o(require.main)
          var app = o_.main({
            environmentVariables: {
              DOES_NOT_EXIST: {
                required: true
              }
            },
            _main: function() {
              mainCalled = true
              return 0
            }
          })
          assert(mainCalled)
          assert(!_.isNil(this.exitVal))
          var logLine = self.parent.outStream.getValue()
          assert(logLine.includes('Environment variable'))
          assert(logLine.includes('DOES_NOT_EXIST'))
        }
      }),
    ]
  })

  util.runTestIfMain(module.exports, module)
})

