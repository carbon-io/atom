var assert = require('assert')

var _o = require('bond')._o(module)
var testtube = require('test-tube')

var makeTest = require('./util').makeTest

var o = require('../lib/atom').o(module)
var oo = require('../lib/atom').oo(module)

/*******************************************************************************
 * inheritance tests
 */
var inheritanceTests = makeTest({
  /**********************************************************************
   * name
   */
  name: 'InheritanceTests',

  /**********************************************************************
   * description
   */
  description: 'Inheritance tests',

  /**********************************************************************
   * setup
   */
  setup: function () {
    this.classes = {}
    this.instances = {}
  },

  /**********************************************************************
   * teardown
   */
  teardown: function () {
  },

  /**********************************************************************
   * tests
   */
  tests: [
    makeTest({
      name: '',
      description: '',
      doTest: function() {

      }
    }),
    makeTest({
      name: 'SimpleInheritance',
      description: 'Simple inheritance',
      doTest: function() {
        var self = this
        assert.doesNotThrow(function() {
          self.parent.classes.Animal = oo({
            _C: function() {
              this.instanceCache = {}
              this.isHappy = true
              this.name = "Animal"
            },

            classCache: {},
            say: function() {
              return "I am a " + this.name + " - Am I happy? " + this.isHappy
            },
          })
        }, Error)
        assert.doesNotThrow(function() {
          self.parent.classes.Cat = oo({
            _type: self.parent.classes.Animal,
            _C: function() {
              this.name = "Cat"
            },

            say: function() {
              return "Super: " + self.parent.classes.Animal.prototype.say.call(this)
            },

            meow: {
              $property: {
                get: function() {
                  return "Meow: " + this.name
                }
              }
            }
          })
        }, Error)
        assert.doesNotThrow(function() {
          self.parent.classes.SubAnimal = oo({
            _type: self.parent.classes.Animal
          })
        }, Error)
      }
    }),
    makeTest({
      name: 'SimpleInstantiation',
      description: 'Simple instantiation',
      doTest: function () {
        var self = this
        assert.doesNotThrow(function() {
          self.parent.instances.a = o({
            _type: self.parent.classes.Animal
          })
        }, Error)
        assert.doesNotThrow(function() {
          self.parent.instances.c = o({
            _type: self.parent.classes.Cat
          })
        }, Error)
        assert.doesNotThrow(function() {
          self.parent.instances.c2 = o({
            _type: self.parent.classes.Cat,
            name: "fluffy"
          })
        }, Error)
        assert.doesNotThrow(function() {
          self.parent.instances.cc = o({
            _type: self.parent.classes.Cat,
            say: function() { return "YoYo" }
          })
        }, Error)

      }
    }),
    makeTest({
      name: 'BaseClassInstancePropertiesAndType',
      description: 'Base class instance properties and type',
      doTest: function() {
        assert.equal(this.parent.instances.a.isHappy, true)
        assert.equal(this.parent.instances.a.name, "Animal")
        assert(this.parent.instances.a instanceof this.parent.classes.Animal)
      }
    }),
    makeTest({
      name: 'DerivedClassInstancePropertiesAndType',
      description: 'Dervived class instance properties and type',
      doTest: function() {
        assert.equal(this.parent.instances.c.isHappy, true)
        assert.equal(this.parent.instances.c.name, "Cat")
        assert(this.parent.instances.c instanceof this.parent.classes.Animal)
        assert(this.parent.instances.c instanceof this.parent.classes.Cat)
        assert(this.parent.instances.c2.isHappy == true)
        assert(this.parent.instances.c2.name == "fluffy")
        assert(this.parent.instances.c2 instanceof this.parent.classes.Animal)
        assert(this.parent.instances.c2 instanceof this.parent.classes.Cat)
      }
    }),
    makeTest({
      name: 'InstanceAsType',
      description: 'Instance as type',
      doTest: function() {
        var self = this
        var ccc = undefined
        assert.doesNotThrow(function() {
          ccc = o({
            _type: self.parent.instances.cc,
            say: function() { return "YoYoYo" }
          })
        }, Error)
        assert.equal(ccc.say(), "YoYoYo")
      }
    }),
    makeTest({
      name: 'InstanceVariables',
      description: 'Instance variables',
      doTest: function() {
        this.parent.instances.c.instanceCache.a = 1
        assert.equal(this.parent.instances.c2.instanceCache.a, undefined)
        assert.equal(this.parent.instances.c2.meow, "Meow: fluffy")
      }
    }),
    makeTest({
      name: 'AbsentConstructor',
      description: 'Absent constructor',
      doTest: function() {
        var sa = o({
          _type: this.parent.classes.SubAnimal
        })
        assert(sa.isHappy)
      }
    }),
    makeTest({
      name: 'CallSuperclassMethod',
      description: 'Call superclassMethod',
      doTest: function() {
        var c3 = o({
          _type: this.parent.classes.Cat,
          name: "fluffy",
          say: function() {
            return this.constructor.prototype.say.bind(this)()
          },
        })

        assert.equal(c3.say(), this.parent.instances.c2.say())
      }
    }),
  ]
})

module.exports = inheritanceTests
