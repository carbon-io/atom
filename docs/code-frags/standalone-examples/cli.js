var carbon = require('carbon-io')

var _o = carbon.bond(module)

module.exports = {
  DiceRollCli: _o('./DiceRollCli'),
  HelloServer: _o('./HelloServer')
}
