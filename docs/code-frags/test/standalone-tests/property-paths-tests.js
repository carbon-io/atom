var assert = require('assert')

var sinon = require('sinon')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var testtube = require('@carbon-io/test-tube')

var o = require('../../../../lib').o(module)

__(function() {
  module.exports = o.main({
    _type: testtube.Test,
    name: 'PropertyPathsTests',
    setup: function() {
      this.mod = _o('../../../standalone-examples/property-paths')
    },
    tests: [
      o({
        _type: testtube.Test,
        name: 'PropertyPathTest',
        doTest: function() {
          var {foo, bar} = this.parent.mod.propertyPath()
          assert.deepEqual(foo, {
            foo: {
              a: 0,
              b: 1,
              c: {
                d: 3
              }
            }
          })
          assert.deepEqual(bar, {
            bar: [0, 1, [3]]
          })
        }
      }),
      o({
        _type: testtube.Test,
        name: 'PropertyPathBracketNotationTest',
        doTest: function() {
          var {foo, bar} = this.parent.mod.propertyPathBracketNotation()
          assert.deepEqual(foo, {
            foo: {
              a: 0,
              b: 1,
              c: {
                d: 3
              }
            }
          })
          assert.deepEqual(bar, {
            bar: [0, 1, [3]]
          })
        }
      }),
      o({
        _type: testtube.Test,
        name: 'PropertyPathLeaderEscapeTest',
        doTest: function() {
          var foo = this.parent.mod.propertyPathLeaderEscape()
          assert.deepEqual(foo, {
            $foo: {
              a: 0,
              b: 1,
              c: {
                $$d: 3
              }
            }
          })
        }
      })
    ]
  })
})

