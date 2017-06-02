function objectWithMethod() {
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

  return {
    Person: Person,
    Jo: Jo
  }
}

function dynamicProperty() {
  var o = require('carbon-io').atom.o(module) 

  var John = o({
    name: "John Smith"
  })

  var clock = o({
    now: {
      $property: {
        get: function() {
          return new Date()
        }
      }
    }
  })

  return {
    John: John,
    clock: clock
  }
}

function _init() {
  var o = require('carbon-io').atom.o(module) 

  var repeater = o({
    delay: 1000,
    _init: function() {
      this.interval = setInterval(function() {
        console.log("Hello!")
      }, this.delay)
    }
  })

  return repeater
}

module.exports = {
  objectWithMethod: objectWithMethod,
  dynamicProperty: dynamicProperty,
  _init: _init
}
