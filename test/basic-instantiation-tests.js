var o = require('../lib/atom').o(module);
var oo = require('../lib/atom').oo(module);
var assert = require('assert');

/*******************************************************************************
 * basic instantiation tests
 */
var Animal = oo({
  _C: function() {
    this.instanceCache = {}
    this.isHappy = true
    this.name = "Animal"
  },

  _init: function() {
    this.initCalledByAnimalInit = true
  },

  classCache: {},

  say: function() {
    return "I am a " + this.name + "- Am I happy?" + this.isHappy
  },
})

var a1 = o({
  _type: Animal
})

var a2 = o({
  _type: Animal,
  name: "pookie"
})

// instanceof 
assert(a1.isHappy == true)
assert(a1.name == "Animal")
assert(a1.initCalledByAnimalInit == true)
assert(a1 instanceof Animal)

assert(a2.isHappy == true)
assert(a2.name == "pookie")
assert(a2 instanceof Animal)

// prototype vs local fields
a1.instanceCache.a = 1
assert(a2.instanceCache.a == undefined)
a1.classCache.a = 1
assert(a2.classCache.a == 1)

// can override prototype property on instance
var a3 = o({
  _type: Animal,
  name: "Fluffy",
  classCache: {p: 6}
})

assert(a3.classCache.p == 6)
assert(a2.classCache.a == Animal.prototype.classCache.a == 1)

var a4 = o({
  _type: a3,
  classCache: {r: 7},
  a3: a3
})

assert(a4.classCache.r == 7)
assert(a3.classCache.p == 6)
assert(a2.classCache.a == Animal.prototype.classCache.a == 1)

var a5 = o({
  _type: Animal,
  name: "Lucky",
  luckyCharm: o({
    _type: Animal,
    name: "Lucky's charm"
  }),
  a3: a3
})
assert(a5.isHappy == true)
assert(a4.a3 == a5.a3) // same pointer

// testing make with targetType
var a6 = o({
  name: "Kiki"
}, Animal)
assert(a6.isHappy === true)

// test of calling constructor of oo defined class directly and having _init called
var FunAnimal = oo({
   _type: Animal,
  _init: function(arg1, arg2) {
    if (arg1) {
      this.isHappy = arg1
      this.isSad = arg2
    } else {
      this.isHappy = false
    }
  }
})

var a7 = new FunAnimal()  
assert(a7.isHappy == false)
assert(a7.initCalledByAnimalInit != true) // init should not automatically chain

// test constructor args get passed through to _init
var a8 = new FunAnimal(8)
assert(a8.isHappy == 8)

var a9 = o({}, FunAnimal, 88, 99)
assert(a9.isHappy == 88)
assert(a9.isSad == 99)

// test _init suppression

var Foo = oo({})
var Bar = oo({_type: Foo})
var Baz = oo({
  _type: Bar,
  _C: function() {
    var self = this
    this.baz = function() {
      self.x = 1
    }
  },
  _init: function() {
    this.baz()
  }
})

var baz = null
assert.doesNotThrow(function() {
  baz = o({_type: Baz})
}, TypeError)
assert.equal(baz.x, 1)

var baz = null
assert.doesNotThrow(function() {
  baz = new Baz()
}, TypeError)
assert.equal(baz.x, 1)
