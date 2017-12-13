function objectPrototypeInvoke() {
  // pre-objectPrototypeInvoke
  var o = require('carbon-io').atom.o(module)

  // Person constructor
  function Person() {
    this.name = "Some Person"
    this.email = null
    this.age = 0
  }

  // Instance of Person
  var Jo = o({
    _type: Person,
    name: "Jo Smith",
    email: "jo@smith.com",
    age: 35
  })

  // Instance of Jo
  var LittleJo = o({
    _type: Jo, // Will "inherit" all the properties of Jo
    age: 2
  })
  // post-objectPrototypeInvoke

  return {
    Person: Person,
    Jo: Jo,
    LittleJo: LittleJo
  }
}

module.exports = objectPrototypeInvoke
