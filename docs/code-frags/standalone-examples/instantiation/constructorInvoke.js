function constructorInvoke() {
  var o = require('carbon-io').atom.o(module) 

  // Person class 
  function Person() {
     this.name = "Some Person"
     this.email = null
     this.age = 0
  }

  // Instance of Person 
  var person = o({
    _type: Person, 
    name: "Jo Smith", 
    email: "jo@smith.com", 
    age: 35 
  })

  return {
    Person: Person,
    person: person
  }
}

module.exports = constructorInvoke
