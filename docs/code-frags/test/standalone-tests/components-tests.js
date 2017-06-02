var assert = require('assert')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var testtube = require('@carbon-io/test-tube')

var o = require('../../../../lib/atom').o(module)

__(function() {
  module.exports = o.main({
    _type: testtube.Test,
    name: 'ComponentsTests',
    setup: function() {
      this.mod = _o('../../../standalone-examples/components')
    },
    tests: [
      o({
        _type: testtube.Test,
        name: 'ComponentTest',
        doTest: function(ctx, done) {
          var objects = this.parent.mod.component()
          try {
            assert.equal(Object.getPrototypeOf(objects.job).name, 
                         objects.ScheduledJob.name)
            assert.equal(objects.job.interval, 30000)
            objects.job.doIt(done)
          } catch (e) {
            return done(e)
          }
        }
      }),
      o({
        _type: testtube.Test,
        name: 'ComponentReferenceTest',
        doTest: function() {
          var objects = this.parent.mod.componentReference()
          assert.equal(objects.generator.idGenerator.name, 
                       objects.MyIdGenerator.name)
        }
      })
    ]
  })
})

