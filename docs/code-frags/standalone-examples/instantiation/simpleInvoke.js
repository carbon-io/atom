function simpleInvoke() {
  var o = require('carbon-io').atom.o(module)

  var obj1 = o({})

  var obj2 = o({_type: Object})

  var obj3 = o({
    a: 1,
    b: 2
  })

  var obj4 = o({
    _type: Object,
    a: 1,
    b: 2
  })

  return {
    obj1: obj1,
    obj2: obj2,
    obj3: obj3,
    obj4: obj4
  }
}

module.exports = simpleInvoke
