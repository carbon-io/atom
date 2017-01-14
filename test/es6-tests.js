var assert = require('assert')
var util = require('util')

var _ = require('lodash')
var mockery = require('mockery')
var sinon = require('sinon')

var testtube = require('@carbon-io/test-tube')

var o = require('../lib/atom').o(module)
var oo = require('../lib/atom').oo(module)

var makeTest = require('./util').makeTest

NODE_MAJOR_VERSION = Number(process.version.match(/v(\d+)\..+/)[1])

function Es6Test() {
  testtube.Test.call(this)
}
util.inherits(Es6Test, testtube.Test)
Es6Test.prototype.setup = function() {
  this.parent.tsetup()
}
Es6Test.prototype.teardown = function() {
  this.parent.tteardown()
}

var es6Tests = makeTest({
  name: 'es6Tests',
  description: 'es6 tests',
  tests: [
    makeTest({
      name: 'es6ClassInstantiationTest',
      description: 'es6 class instantiation test',
      setup: function() {
        if (NODE_MAJOR_VERSION < 6) {
          throw new testtube.errors.SkipTestError('NODE_MAJOR_VERSION < 6')
        }
      },
      doTest: function() {
        class Foo {
          constructor(x, y) {
            this.x = x || 0
            this.y = y || 0
          }

          incX() {
            return ++this.x
          }
          
          incY() {
            return ++this.y
          }
        }

        var foo = o({_type: Foo})
        assert.equal(foo.x, 0)
        assert.equal(foo.y, 0)
        assert.equal(foo.incX(), 1)
        assert.equal(foo.incY(), 1)
        
        foo = o({_type: Foo, x: 1, y: 1})
        assert.equal(foo.x, 1)
        assert.equal(foo.y, 1)
        assert.equal(foo.incX(), 2)
        assert.equal(foo.incY(), 2)
      }
    })
  ]
})

module.exports = es6Tests
