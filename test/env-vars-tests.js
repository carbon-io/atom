var assert = require('assert')
var util = require('util')

var _ = require('lodash')
var sinon = require('sinon')

var _o = require('bond')._o(module)
var testtube = require('@carbon-io/test-tube')

var makeTest = require('./util').makeTest

var Atom = require('../lib/atom').Atom

// constants from atom.js
var ENVIRONMENT_VARIABLES_FIELD = 'environmentVariables'
var PRIVATE_ENV_FIELD = '__privateEnv'

function EnvTest() {
  testtube.Test.call(this)
}
util.inherits(EnvTest, testtube.Test)

EnvTest.prototype.setup = function() {
  this.sandbox = sinon.sandbox.create()
  this.sandbox.stub(process, 'env', _.cloneDeep(process.env))
}

EnvTest.prototype.teardown = function() {
  delete process[PRIVATE_ENV_FIELD]
  this.sandbox.restore()
}

/*******************************************************************************
 env vars tests
 */
var envVarsTests = makeTest({
  /**********************************************************************
   * name
   */
  name: 'EnvVarsTests',

  /**********************************************************************
   * description
   */
  description: 'Env vars tests',

  /**********************************************************************
   * setup
   */
  setup: function() {
    this.atom = new Atom()
    this.atom._argparser.printer(function() { })
  },

  /**********************************************************************
   * teardown
   */
  teardown: function() {
    this.atom._argparser.printer(undefined)
  },

  /**********************************************************************
   * tests
   */
  tests: [
    makeTest({
      name: 'ProcessEnvVar',
      description: 'Process env var',
      setup: function() {
        EnvTest.prototype.setup.call(this)
        process.env.FOO = 'foo'
        this.obj = {
          [ENVIRONMENT_VARIABLES_FIELD]: {
            FOO: {
              help: 'FOO'
            }
          }
        }
      },
      doTest: function() {
        var self = this
        assert.doesNotThrow(function() {
          self.parent.atom._processEnvironmentVariables(self.obj)
        }, Error)
        assert.equal(process.env.FOO, 'foo')
      }
    }, EnvTest),
    makeTest({
      name: 'ProcessRequiredEnvVar',
      description: 'Process required env var',
      setup: function() {
        EnvTest.prototype.setup.call(this)
        this.sandbox.spy(this.parent.atom._argparser, 'print')
        this.obj = {
          [ENVIRONMENT_VARIABLES_FIELD]: {
            FOO: {
              help: 'FOO',
              required: true
            }
          }
        }
      },
      doTest: function() {
        var self = this
        assert.doesNotThrow(function() {
          self.parent.atom._processEnvironmentVariables(self.obj)
        }, Error)
        assert(this.parent.atom._argparser.print.called)
        process.env.FOO = 'foo'
        assert.doesNotThrow(function() {
          self.parent.atom._processEnvironmentVariables(self.obj)
        }, Error)
        assert.equal(process.env.FOO, 'foo')
      }
    }, EnvTest),
    makeTest({
      name: 'ProcessPrivateEnvVar',
      description: 'Process private env var',
      setup: function() {
        EnvTest.prototype.setup.call(this)
        process.env.FOO = 'foo'
        this.obj = {
          [ENVIRONMENT_VARIABLES_FIELD]: {
            FOO: {
              help: 'FOO',
              private: true
            }
          }
        }
      },
      doTest: function() {
        var self = this
        assert.doesNotThrow(function() {
          self.parent.atom._processEnvironmentVariables(self.obj)
        }, Error)
        assert.equal(process[PRIVATE_ENV_FIELD].FOO, 'foo')
        assert(!('FOO' in process.env))
      }
    }, EnvTest),
    makeTest({
      name: 'EnvVarHelp',
      description: 'Env var help',
      setup: function() {
        EnvTest.prototype.setup.call(this)
        process.env.FOO = 'foo'
        this.obj = {
          [ENVIRONMENT_VARIABLES_FIELD]: {
            FOO: {
              help: 'FOO'
            },
            BAR: {
              help: 'BAR',
              required: true
            },
            BAZ: {
              help: 'BAZ',
              private: true
            },
            YAZ: {
              required: true,
              private: true
            }
          }
        }
      },
      doTest: function() {
        var help = this.parent.atom._getEnvironmentVariableHelp(this.obj)
        assert(_.isString(help))
        assert.equal(help, 'Environment variables: \n  FOO - FOO\n  BAR - BAR (required)\n  BAZ - BAZ\n  YAZ (required)\n')
      }
    }, EnvTest),
  ]
})

module.exports = envVarsTests
