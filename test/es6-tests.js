/**
 * known limitations:
 *  - `oo`
 *    - you can not subclass an ES6 class
 */
var assert = require('assert')
var inherits = require('util').inherits

var _ = require('lodash')
var mockery = require('mockery')
var sinon = require('sinon')

var __ = require('@carbon-io/fibers').__(module)
var testtube = require('@carbon-io/test-tube')

var o = require('../lib/atom').o(module)
var oo = require('../lib/atom').oo(module)

var util = require('./util')

function Es6Test() {
  testtube.Test.call(this)
}
inherits(Es6Test, testtube.Test)
Es6Test.prototype.setup = function() {
  this.parent.tsetup()
}
Es6Test.prototype.teardown = function() {
  this.parent.tteardown()
}

__(function() {
  module.exports = util.makeTest({
    name: 'es6Tests',
    description: 'es6 tests',
    tests: [
      util.makeTest({
        name: 'es6ClassInstantiationTest',
        description: 'es6 class instantiation test',
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
      }),
      util.makeTest({
        name: 'SubclassEs6ClassWithOOTest',
        description: 'subclass es6 class with oo test',
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
          var Bar = oo({_type: Foo, _C: function() { this.z = "zed" }})
          assert.throws(function() {
            o({_type: Bar})
          }, /TypeError: Class constructor Foo cannot be invoked without 'new'/)
        }
      })
    ]
  })

  util.runTestIfMain(module.exports, module)
})

