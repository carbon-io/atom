var o = require('../../lib').o(module);
var _o = require('@carbon-io/bond')._o(module)

module.exports = o({
  _type: './Animal',
  name: 'SomeAnimal',
  friend: _o('./SomeOtherAnimal')
})
