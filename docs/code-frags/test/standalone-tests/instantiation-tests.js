var assert = require('assert')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var testtube = require('@carbon-io/test-tube')

var o = require('../../../../lib').o(module)

__(function() {
  module.exports = o.main({
    _type: testtube.Test,
    name: 'InstantionTests',
    setup: function() {
      this.mod = _o('../../../standalone-examples/instantiation')
    },
    tests: [
      o({
        _type: testtube.Test,
        name: 'SimpleInvokeTest',
        doTest: function() {
          var objects = this.parent.mod.simpleInvoke()
          assert.deepEqual(objects.obj1, {})
          assert.deepEqual(objects.obj2, {})
          assert.deepEqual(objects.obj1, objects.obj2)
          assert.deepEqual(objects.obj3, {
            a: 1,
            b: 2
          })
          assert.deepEqual(objects.obj4, {
            a: 1,
            b: 2
          })
          assert.deepEqual(objects.obj3, objects.obj4)
        }
      }),
      o({
        _type: testtube.Test,
        name: 'ConstructorInvokeTest',
        doTest: function() {
          var objects = this.parent.mod.constructorInvoke()
          assert(objects.person instanceof objects.Person)
          assert.equal(objects.person.name, 'Jo Smith')
          assert.equal(objects.person.email, 'jo@smith.com')
          assert.equal(objects.person.age, 35)
        }
      }),
      o({
        _type: testtube.Test,
        name: 'NestedObjectsInvokeTest',
        doTest: function() {
          var objects = this.parent.mod.nestedObjectsInvoke()
          assert(objects.person instanceof objects.Person)
          assert(objects.person.address instanceof objects.Address)
          assert.equal(objects.person.name, 'Jo Smith')
          assert.equal(objects.person.email, 'jo@smith.com')
          assert.equal(objects.person.age, 35)
          assert.equal(objects.person.address.street, '401 Avenue Alhambra')
          assert.equal(objects.person.address.city, 'Half Moon Bay')
          assert.equal(objects.person.address.state, 'CA')
          assert.equal(objects.person.address.zip, '94019')
        }
      }),
      o({
        _type: testtube.Test,
        name: 'ObjectPrototypeInvokeTest',
        doTest: function() {
          var objects = this.parent.mod.objectPrototypeInvoke()
          assert(objects.Jo instanceof objects.Person)
          assert(objects.LittleJo instanceof objects.Person)
          assert.equal(objects.Jo.name, 'Jo Smith')
          assert.equal(objects.Jo.email, 'jo@smith.com')
          assert.equal(objects.Jo.age, 35)
          assert.equal(objects.LittleJo.name, objects.Jo.name)
          assert.equal(objects.LittleJo.email, objects.Jo.email)
          assert.equal(objects.LittleJo.age, 2)
        }
      }),
      o({
        _type: testtube.Test,
        name: 'es6InvokeTest',
        doTest: function() {
          if (typeof this.parent.mod.es6Invoke === 'undefined') {
            throw new testtube.errors.SkipTestError('es6 not supported')
          }
          var objects = this.parent.mod.es6Invoke()
          assert(objects.person instanceof objects.Person)
          assert.equal(objects.person.name, 'Jo Smith')
          assert.equal(objects.person.email, 'jo@smith.com')
          assert.equal(objects.person.age, 35)
        }
      })
    ]
  })
})

