function objectWithMethod() {
  // pre-objectWithMethod
  var o = require('carbon-io').atom.o(module)

  // Person class
  var Person = function() {
    this.name = "Some Person"
    this.email = null
    this.age = 0
  }

  // Instance of Person
  var Jo = o({
    _type: Person,
    name: "Jo Smith",
    email: "jo@smith.com",
    age: 35,
    sayName: function() {
      console.log(this.name)
    }
  })

  Jo.sayName() // prints "Jo Smith"
  // post-objectWithMethod

  return {
    Person: Person,
    Jo: Jo
  }
}

function dynamicProperty() {
  var o = require('carbon-io').atom.o(module)

  // pre-keyValueProperty
  var John = o({
    name: "John Smith"
  })
  // post-keyValueProperty

  // pre-dynamicProperty
  var clock = o({
    now: {
      $property: {
        get: function() {
          return new Date()
        }
      }
    }
  })
  // post-dynamicProperty

  return {
    John: John,
    clock: clock
  }
}

function _init() {
  var o = require('carbon-io').atom.o(module)

  // pre-lifecycleInit
  var repeater = o({
    delay: 1000,
    _init: function() {
      this.interval = setInterval(function() {
        console.log("Hello!")
      }, this.delay)
    }
  })
  // post-lifecycleInit

  return repeater
}

module.exports = {
  objectWithMethod: objectWithMethod,
  dynamicProperty: dynamicProperty,
  _init: _init
}
