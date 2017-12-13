var _ = require('lodash')

function propertyPath() {
  var _exports = module.exports

  try {
    var o = require('carbon-io').atom.o(module)

    // pre-propertyObjectPath
    var Foo = function() {
      this.foo = {
        a: 0,
        b: 1,
        c: {
          d: 2
        }
      }
    }

    var foo = o({
      _type: Foo,
      '$foo.c.d': 3
    })
    // post-propertyObjectPath

    // pre-propertyArrayPath
    var Bar = function() {
      this.bar = [0, 1, [2]]
    }

    var bar = o({
      _type: Bar,
      '$bar.2.0': 3
    })
    // post-propertyArrayPath

    return {
      foo: foo,
      bar: bar
    }
  } finally {
    module.exports = _exports
  }
}

function propertyPathBracketNotation() {
  var _exports = module.exports

  try {
    var o = require('carbon-io').atom.o(module)

    // pre-propertyObjectPathBracketNotation
    var Foo = function() {
      this.foo = {
        a: 0,
        b: 1,
        c: {
          d: 2
        }
      }
    }

    var foo = o({
      _type: Foo,
      '$foo[c][d]': 3
    })
    // post-propertyObjectPathBracketNotation

    // pre-propertyArrayPathBracketNotation
    var Bar = function() {
      this.bar = [0, 1, [2]]
    }

    var bar = o({
      _type: Bar,
      '$bar[2][0]': 3
    })
    // post-propertyArrayPathBracketNotation

    return {
      foo: foo,
      bar: bar
    }
  } finally {
    module.exports = _exports
  }
}

function propertyPathLeaderEscape() {
  var _exports = module.exports

  try {
    var o = require('carbon-io').atom.o(module)

    // pre-propertyPathLeaderEscape
    var Foo = function() {
      this.$foo = {
        a: 0,
        b: 1,
        c: {
          $$d: 2
        }
      }
    }

    var foo = o({
      _type: Foo,
      '$$$foo.c.$$d': 3
    })
    // post-propertyPathLeaderEscape

    return foo
  } finally {
    module.exports = _exports
  }
}

module.exports = {
  propertyPath: propertyPath,
  propertyPathBracketNotation: propertyPathBracketNotation,
  propertyPathLeaderEscape: propertyPathLeaderEscape
}

