var assert = require('assert')

var sinon = require('sinon')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var testtube = require('@carbon-io/test-tube')

var o = require('../../../../lib').o(module)

__(function() {
  module.exports = o.main({
    _type: testtube.Test,
    name: 'OperatorsTests',
    setup: function() {
      this.mod = _o('../../../standalone-examples/operators')
    },
    tests: [
      o({
        _type: testtube.Test,
        name: 'MergeTest',
        doTest: function() {
          var {foo, bar, baz} = this.parent.mod.merge()
          assert.deepEqual(foo, {
            foo: {
              a: 0,
              b: 1,
              c: {
                f: 4
              },
              g: 5
            }
          })
          assert.deepEqual(bar, {
            bar: {
              a: 0,
              b: 1,
              c: {
                d: 2,
                e: 3,
                f: 4
              },
              g: 5
            }
          })
          assert.deepEqual(baz, {
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
        }
      }),
      o({
        _type: testtube.Test,
        name: 'DeleteTest',
        doTest: function() {
          var {foo, bar, baz} = this.parent.mod.delete()
          assert.deepEqual(foo, {
            foo: {
              a: 0,
              b: 1
            }
          })
          assert.deepEqual(bar, {
            bar: {
              b: 1
            }
          })
          assert.deepEqual(baz, {
            baz: {
              $delete: 'a',
              $merge: {h: 6}
            }
          })
        }
      }),
      o({
        _type: testtube.Test,
        name: 'MultiOpTest',
        doTest: function() {
          var {foo} = this.parent.mod.multiop()
          assert.deepEqual(foo, {
            foo: {
              b: 1,
              c: {
                d: 2,
                e: 3
              },
              h: 6
            }
          })
        }
      })
    ]
  })
})

