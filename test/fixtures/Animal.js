var o = require('../../lib').o(module);
var oo = require('../../lib').oo(module);

module.exports = oo({
  _C: function() {
    this.cache = {}
    this.isHappy = true
    this.name = "Animal"
  },

  staticCache: {},

  say: function() {
    return "I am a " + this.name + " - Am I happy? " + this.isHappy
  },

  _main: function(options) {
    console.log("_main")
    console.log(this.say())
  }
})
