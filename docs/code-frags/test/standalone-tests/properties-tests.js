var assert = require('assert')

var sinon = require('sinon')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var testtube = require('@carbon-io/test-tube')

var o = require('../../../../lib').o(module)

__(function() {
  module.exports = o.main({
    _type: testtube.Test,
    name: 'PropertiesTests',
    setup: function() {
      this.mod = _o('../../../standalone-examples/properties')
    },
    tests: [
      o({
        _type: testtube.Test,
        name: 'ObjectWithMethodTest',
        setup: function() {
          var self = this
          this.output = ''
          this.stub = sinon.stub(console, 'log').callsFake(function(str) {
            self.output += str
          })
        },
        teardown: function() {
          this.stub.restore()
        },
        doTest: function() {
          var objects = this.parent.mod.objectWithMethod()
          assert(objects.Jo instanceof objects.Person)
          assert.equal(objects.Jo.name, 'Jo Smith')
          assert.equal(objects.Jo.email, 'jo@smith.com')
          assert.equal(objects.Jo.age, 35)
          assert.equal(this.output, 'Jo Smith')
        }
      }),
      o({
        _type: testtube.Test,
        name: 'DynamicPropertyTest',
        setup: function() {
          this.now = new Date()
          this.clock = sinon.useFakeTimers(this.now.getTime(), 'Date')
        },
        teardown: function() {
          this.clock.restore()
        },
        doTest: function() {
          var objects = this.parent.mod.dynamicProperty()
          assert.equal(objects.John.name, 'John Smith')
          assert.equal(objects.clock.now.toISOString(), this.now.toISOString())
        }
      }),
      o({
        _type: testtube.Test,
        name: '_initTest',
        setup: function() {
          var self = this
          this.output = ''
          this.stub = sinon.stub(console, 'log').callsFake(function(str) {
            self.output += str
          })
          this.now = new Date()
          this.clock = sinon.useFakeTimers(Date.now(), 'Date', 'setInterval')
        },
        teardown: function() {
          this.clock.restore()
          this.stub.restore()
        },
        doTest: function() {
          var repeater = this.parent.mod._init()
          try {
            assert.equal(repeater.delay, 1000)
            assert.equal(this.output, '')
            this.clock.tick(1000)
            assert.equal(this.output, 'Hello!')
            this.clock.tick(1000)
            assert.equal(this.output, 'Hello!Hello!')
          } finally {
            clearInterval(repeater.interval)
          }
        }
      })
    ]
  })
})

