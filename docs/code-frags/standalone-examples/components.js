function component() {
  var _exports = module.exports

  try {
    // pre-component
    var o = require('carbon-io').atom.o(module)
    var ScheduledJob = require('./ScheduledJob')

    module.exports = o({
      _type: ScheduledJob,
      interval: 30000,
      doIt: function(cb) {
        try {
          // do some work
        } catch (e) {
          cb(e)
        }
        cb()
      }
    })
    // post-component

    return {
      ScheduledJob: ScheduledJob,
      job: module.exports
    }
  } finally {
    module.exports = _exports
  }
}

function componentReference() {
  var _exports = module.exports

  try {
    // pre-componentReference
    var _o = require('carbon-io').bond._o(module)
    var o = require('carbon-io').atom.o(module)

    module.exports = o({
      // ...
      idGenerator: _o('./MyIdGenerator')
      // ...
    })
    // post-componentReference

    return {
      MyIdGenerator: _o('./MyIdGenerator'),
      generator: module.exports
    }
  } finally {
    module.exports = _exports
  }
}

module.exports = {
  component: component,
  componentReference: componentReference
}

