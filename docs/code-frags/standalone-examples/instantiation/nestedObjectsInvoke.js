function nestedObjectsInvoke() {
  var oo = require('carbon-io').atom.oo(module)
  var Address = oo({
    _C: function() {
      this.street = '24 N Plaza',
      this.city = 'Paris',
      this.state = 'TX',
      this.zip = '75460'
    }
  })
  var Person = oo({
    _C: function() {
       this.name = 'Some Person'
       this.email = null
       this.age = 0
    }
  })

  var o = require('carbon-io').atom.o(module)

  // pre-nestedObjectsInvoke
  var person = o({
    _type: Person,
    name: 'Jo Smith',
    email: 'jo@smith.com',
    age: 35,
    address: o({
      _type: Address,
      street: '401 Avenue Alhambra',
      city: 'Half Moon Bay',
      state: 'CA',
      zip: '94019'
    })
  })
  // post-nestedObjectsInvoke

  return {
    Address: Address,
    Person: Person,
    person: person
  }
}

module.exports = nestedObjectsInvoke
