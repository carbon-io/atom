function simpleInvoke() {
  // pre-simpleInvokeNoType
  var o = require('carbon-io').atom.o(module)
  var obj1 = o({})
  // post-simpleInvokeNoType

  // pre-simpleInvoke
  var o = require('carbon-io').atom.o(module)
  var obj2 = o({_type: Object})
  // post-simpleInvoke

  // pre-simpleInvokeWithPropertiesNoType
  var o = require('carbon-io').atom.o(module)
  var obj3 = o({
    a: 1,
    b: 2
  })
  // post-simpleInvokeWithPropertiesNoType

  // pre-simpleInvokeWithProperties
  var o = require('carbon-io').atom.o(module)
  var obj4 = o({
    _type: Object,
    a: 1,
    b: 2
  })
  // post-simpleInvokeWithProperties

  return {
    obj1: obj1,
    obj2: obj2,
    obj3: obj3,
    obj4: obj4
  }
}

module.exports = simpleInvoke
