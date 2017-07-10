var assert = require('assert')

var sinon = require('sinon')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var testtube = require('@carbon-io/test-tube')

var util= require('./util')

var o = require('../lib/atom').o(module)
var oo = require('../lib/atom').oo(module)

/***************************************************************************************************
 * basic instantiation tests
 */


__(function() {
  module.exports = util.makeTest({
    /***************************************************************************
     * name
     */
    name: 'BasicInstantiationTests',

    /***************************************************************************
     * description
     */
    description: 'Basic instantiation tests',

    /***************************************************************************
     * setup
     */
    setup: function () {
      this.classes = {}
      this.instances = {}
    },

    /***************************************************************************
     * teardown
     */
    teardown: function () { },

    tests: [
      util.makeTest({
        name: 'BasicObjectInstantiation',
        doTest: function() {
          var myObj = o({})
          assert(typeof(myObj) === 'object')
          assert(Object.keys(myObj).length == 0)

          var myObj2 = o({_type: Object})
          assert(typeof(myObj2) === 'object')
          assert(Object.keys(myObj2).length == 0)

          assert.throws(function() {
            var t = undefined
            o({_type: t})
          })
        }
      }),

      util.makeTest({
        name: '',
        description: '',
        doTest: function() {
          var self = this
          assert.doesNotThrow(function() {
            self.parent.classes.Animal = oo({
              _C: function () {
                this.instanceCache = {}
                this.isHappy = true
                this.name = "Animal"
              },

              _init: function () {
                this.initCalledByAnimalInit = true
              },

              classCache: {},

              say: function () {
                return "I am a " + this.name + "- Am I happy?" + this.isHappy
              },
            })
          }, Error)
        }
      }),
      util.makeTest({
        name: '',
        description: '',
        doTest: function() {
          var self = this
          assert.doesNotThrow(function() {
            self.parent.instances.a1 = o({
              _type: self.parent.classes.Animal
            })
          }, Error)
        }
      }),
      util.makeTest({
        name: '',
        description: '',
        doTest: function() {
          var self = this
          assert.doesNotThrow(function() {
            self.parent.instances.a2 = o({
              _type: self.parent.classes.Animal,
              name: "pookie"
            })
          }, Error)
        }
      }),
      util.makeTest({
        name: '',
        description: '',
        doTest: function() {
          assert.equal(this.parent.instances.a1.isHappy, true)
          assert.equal(this.parent.instances.a1.name, "Animal")
          assert.equal(this.parent.instances.a1.initCalledByAnimalInit, true)
          assert(this.parent.instances.a1 instanceof this.parent.classes.Animal)
          assert.equal(this.parent.instances.a2.isHappy, true)
          assert.equal(this.parent.instances.a2.name, "pookie")
          assert(this.parent.instances.a2 instanceof this.parent.classes.Animal)
        }
      }),
      util.makeTest({
        name: '',
        description: '',
        doTest: function() {
          // prototype vs local fields
          this.parent.instances.a1.instanceCache.a = 1
          assert.equal(this.parent.instances.a2.instanceCache.a, undefined)
          this.parent.instances.a1.classCache.a = 1
          assert.equal(this.parent.instances.a2.classCache.a, 1)
        }
      }),
      util.makeTest({
        name: '',
        description: '',
        doTest: function () {
          var self = this
          // can override prototype property on instance
          assert.doesNotThrow(function () {
            self.parent.instances.a3 = o({
              _type: self.parent.classes.Animal,
              name: "Fluffy",
              classCache: {p: 6}
            })
          }, Error)

          assert.equal(this.parent.instances.a3.classCache.p, 6)
          assert.equal(this.parent.instances.a2.classCache.a, 1)
          assert.equal(this.parent.classes.Animal.prototype.classCache.a, 1)

          assert.doesNotThrow(function () {
            self.parent.instances.a4 = o({
              _type: self.parent.instances.a3,
              classCache: {r: 7},
              a3: self.parent.instances.a3
            })
          }, Error)

          assert.equal(this.parent.instances.a4.classCache.r, 7)
          assert.equal(this.parent.instances.a3.classCache.p, 6)
          assert.equal(this.parent.instances.a2.classCache.a, 1)
          assert.equal(this.parent.classes.Animal.prototype.classCache.a, 1)
        }
      }),
      util.makeTest({
        name: '',
        description: '',
        doTest: function () {
          var self = this
          assert.doesNotThrow(function() {
            self.parent.instances.a5 = o({
              _type: self.parent.classes.Animal,
              name: "Lucky",
              luckyCharm: o({
                _type: self.parent.classes.Animal,
                name: "Lucky's charm"
              }),
              a3: self.parent.instances.a3
            })
          }, Error)
          assert.equal(this.parent.instances.a5.isHappy, true)
          assert.equal(this.parent.instances.a4.a3, this.parent.instances.a5.a3) // same pointer
        }
      }),
      util.makeTest({
        name: '',
        description: '',
        doTest: function () {
          var self = this
          // testing make with targetType
          assert.doesNotThrow(function() {
            self.parent.instances.a6 = o({
              name: "Kiki"
            }, self.parent.classes.Animal)
          }, Error)
          assert.equal(this.parent.instances.a6.isHappy, true)
        }
      }),
      util.makeTest({
        name: '',
        description: '',
        doTest: function () {
          var self = this
          // test of calling constructor of oo defined class directly and having _init called
          assert.doesNotThrow(function() {
            self.parent.classes.FunAnimal = oo({
              _type: self.parent.classes.Animal,
              _init: function (arg1, arg2) {
                if (arg1) {
                  this.isHappy = arg1
                  this.isSad = arg2
                } else {
                  this.isHappy = false
                }
              }
            })
          }, Error)

          assert.doesNotThrow(function() {
            self.parent.instances.a7 = new self.parent.classes.FunAnimal()
          }, Error)

          assert.equal(this.parent.instances.a7.isHappy, false)
          assert.notEqual(this.parent.instances.a7.initCalledByAnimalInit, true) // init should not automatically chain

          // test constructor args get passed through to _init
          assert.doesNotThrow(function() {
            self.parent.instances.a8 = new self.parent.classes.FunAnimal(8)
          }, Error)
          assert.equal(this.parent.instances.a8.isHappy, 8)

          assert.doesNotThrow(function() {
            self.parent.instances.a9 = o({}, self.parent.classes.FunAnimal, 88, 99)
          }, Error)
          assert.equal(this.parent.instances.a9.isHappy, 88)
          assert.equal(this.parent.instances.a9.isSad, 99)

        }
      }),
      util.makeTest({
        name: 'BaseClassInitSuppressionTest',
        description: 'Test that _init is not called on base class',
        doTest: function () {
          var self = this

          var Foo = oo({})
          var Bar = oo({_type: Foo})
          var Baz = oo({
            _type: Bar,
            _C: function () {
              var self = this
              this.baz = function () {
                self.x = 1
              }
            },
            _init: function () {
              this.baz()
            }
          })

          var baz = undefined
          assert.doesNotThrow(function () {
            baz = o({_type: Baz})
          }, TypeError)
          assert.equal(baz.x, 1)

          baz = undefined
          assert.doesNotThrow(function () {
            baz = new Baz()
          }, TypeError)
          assert.equal(baz.x, 1)
        }
      }),
      util.makeTest({
        name: 'BaseClassInitSuppressionTest',
        description: 'Test that _init is not called on base class',
        doTest: function () {
          var Foo = oo({
            _C: function () {
              this._foo = 0
            },

            foo: {
              $property: {
                get: function () {
                  return this._foo
                },
                set: function (val) {
                  this._foo = val
                }
              }
            }
          })

          var foo = o({
            _type: Foo,
            foo: 1
          })

          assert.equal(foo._foo, 1)

          // test that prototype chain is walked when checking for accessor

          var Bar = oo({
            _type: Foo
          })

          var bar = o({
            _type: Bar,
            foo: 1
          })

          assert.equal(bar._foo, 1)

          // test accessor is shadowed if set method is not defined

          var Baz = oo({
            _C: function () {
              this._baz = 0
            },

            baz: {
              $property: {
                get: function () {
                  return this._baz
                }
              }
            }
          })

          var baz = o({_type: Baz, baz: 1})

          assert.equal(baz._baz, 0)
          assert.equal(baz.baz, 1)
        }
      }),
      util.makeTest({
        name: 'runMainInFiberDeprecationWarningTest',
        description: 'Test that a deprecation warning is printed when ' +
                     'runMainInFiber is requested',
        setup: function() {
          this.sandbox = sinon.sandbox.create()
          this.warnSpy = this.sandbox.spy(console, 'warn')
        },
        teardown: function() {
          this.sandbox.restore()
        },
        doTest: function(ctx, done) {
          var self = this
          var mainCalled = false
          var o_ = require('../lib/atom').o(require.main)
          var app = o_.main({
            runMainInFiber: true,
            _main: function() {
              mainCalled = true
            }
          })
          setImmediate(function() {
            var err = undefined
            try {
              assert(mainCalled)
              assert.equal(self.warnSpy.callCount, 1)
              assert(self.warnSpy.firstCall.args[0].includes('DEPRECATED'))
            } catch (e) {
              err = e
            }
            done(err)
          })
        }
      }),
      util.makeTest({
        name: 'propertyPathAssignmentTest',
        description: 'Test that properties with "." in the name assigns values to nested ' +
                     'objects appropriately',
        doTest: function() {
          var Foo = oo({
              _C: function() {
                this.foo = 0
              }
          })
          var Bar = oo({
            _C: function() {
              this.foo = o({
                _type: Foo
              })
              this.baz = {
                a: {
                  b: {
                    c: {
                      d: 0
                    }
                  }
                }
              }
            }
          })
          var bar = o({
            _type: Bar,
            'foo.foo': 1,
            'baz.a.b.c.d': 2
          })
          assert.equal(bar.foo.foo, 1)
          assert.equal(bar.baz.a.b.c.d, 2)
        }
      })
    ]
  })

  util.runTestIfMain(module.exports, module)
})
