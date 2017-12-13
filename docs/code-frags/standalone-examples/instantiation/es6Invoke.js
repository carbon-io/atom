function es6Invoke() {
  // pre-es6Invoke
  var o = require('carbon-io').atom.o(module)

  // Person class
  class Person {
    constructor() {
      this.name = "Some Person"
      this.email = null
      this.age = 0
    }
  }

  // Instance of Person
  var person = o({
    _type: Person,
    name: "Jo Smith",
    email: "jo@smith.com",
    age: 35
  })
  // post-es6Invoke

  return {
    Person: Person,
    person: person
  }
}

module.exports = es6Invoke
