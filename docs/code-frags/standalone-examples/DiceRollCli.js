var o = require('carbon-io').atom.o(module)

module.exports = o.main({ // Note the .main here since this is the main
                          // application
  verbose: false,

  cmdargs: {
    sides: {
      abbr: "s",
      help: "The number of sides each die should have.",
      required: false,
      default: 6
    },
    num: {
      position: 0,
      flag: false,
      help: "The number of dice to roll.",
      required: false,
      default: 1
    },
    verbose: {
      abbr: "v",
      flag: true,
      help: "Log verbose output.",
      required: false,
      property: true // Will result in this.verbose having the value passed
                     // at the cmdline
    }
  },

  _main: function(options) {
    if (this.verbose) {
      console.log("Here is the input")
      console.log(options)
      console.log("Ok... rolling.......")
    }

    var numDice = options.num
    var numSides = options.sides
    var result = []
    for (var i = 0; i < numDice; i++) {
      // Random integer between 1 and numSides
      result.push(Math.floor(Math.random() * numSides + 1))
    }

    console.log(result)
  }
})

