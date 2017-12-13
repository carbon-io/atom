function merge() {
  var _exports = module.exports

  try {
    var o = require('carbon-io').atom.o(module)

    // pre-merge
    var Foo = function() {
      this.foo = {
        a: 0,
        b: 1,
        c: {
          d: 2,
          e: 3
        }
      }
    }

    var foo = o({
      _type: Foo,
      foo: {
        $merge: {
          c: {
            f: 4
          },
          g: 5
        }
      }
    })
    // post-merge

    // pre-mergeChain
    var Bar = function() {
      this.bar = {
        a: 0,
        b: 1,
        c: {
          d: 2,
          e: 3
        }
      }
    }

    var bar = o({
      _type: Bar,
      bar: {
        $merge: {
          c: {
            $merge: {
              f: 4
            }
          },
          g: 5
        }
      }
    })
    // post-mergeChain

    // pre-noMerge
    var Baz = function() {
      this.baz = {
        a: 0,
        b: 1,
        c: {
          d: 2,
          e: 3
        }
      }
    }

    var baz = o({
      _type: Baz,
      baz: {
        $merge: {
          c: {
            f: 4
          },
          g: 5
        },
        h: 6
      }
    })
    // post-noMerge


    return {
      foo: foo,
      bar: bar,
      baz: baz
    }
  } finally {
    module.exports = _exports
  }
}

module.exports = {
  merge: merge,
}


