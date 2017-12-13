var assert = require('assert')

var sinon = require('sinon')
var tmp = require('tmp')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var testtube = require('@carbon-io/test-tube')

var o = require('../../../../lib').o(module)

__(function() {
  module.exports = o.main({
    _type: testtube.Test,
    name: 'CliTests',
    tests: [
      o({
        _type: testtube.Test,
        name: 'DiceRollCliTest',
        setup: function() {
          var self = this
          this.atom = require('../../../../lib')
          this.o = this.atom.o
          this.output = ''

          this.sb = sinon.sandbox.create()
          this.oMock = this.sb.stub(this.atom, 'o').callsFake(function() {
            var o = self.o(require.main)
            o.reset()
            return o
          })
          this.sb.stub(process, 'argv').value([
            'node',
            'DiceRollCli.js',
            '-s', '10',
            '--num', '2',
            '--verbose'
          ])
          this.sb.stub(Math, 'random').callsFake(function() {
            return 0
          })
          this.sb.stub(console, 'log').callsFake(function(msg) {
            self.output += typeof msg === 'string' ? msg : JSON.stringify(msg)
          })
        },
        teardown: function() {
          this.sb.restore()
        },
        doTest: function() {
          var diceRollCli = _o('../../../standalone-examples/DiceRollCli')
          assert.equal(
            this.output,
            'Here is the input{"sides":10,"num":2,"verbose":true}' +
            'Ok... rolling.......[1,1]')
        }
      }),
      o({
        _type: testtube.Test,
        name: 'HelloServerTest',
        setup: function() {
          var self = this
          this.atom = require('../../../../lib')
          this.o = this.atom.o
          this.output = ''
          this.pid = 0
          this.tmpFile = tmp.fileSync()
          this.server = {
            listen: sinon.stub().callsFake(function(port, addr, cb) {
              return cb()
            })
          }
          this.sb = sinon.sandbox.create()
          this.oMock = this.sb.stub(this.atom, 'o').callsFake(function() {
            var o = self.o(require.main)
            // fix state in atom
            o.reset()
            return o
          })
          this.sb.stub(process, 'argv').value([
            'node',
            'HelloServer.js',
            '-v',
            'start-server'
          ])
          this.sb.stub(console, 'log').callsFake(function(msg) {
            self.output += typeof msg === 'string' ? msg : JSON.stringify(msg)
          })
          this.sb.stub(require('http'), 'createServer').callsFake(function() {
            return self.server
          })
          var fs = require('fs')
          var fsWriteFileSync = fs.writeFileSync
          var fsReadFileSync = fs.readFileSync
          this.sb.stub(fs, 'writeFileSync').callsFake(function(path, pid, encoding) {
            var args = Array.prototype.slice.call(arguments, 0)
            args[0] = args[0] === '/tmp/server.pid' ? self.tmpFile.name : args[0]
            return fsWriteFileSync.apply(null, args)
          })
          this.sb.stub(fs, 'readFileSync').callsFake(function() {
            var args = Array.prototype.slice.call(arguments, 0)
            args[0] = args[0] === '/tmp/server.pid' ? self.tmpFile.name : args[0]
            return fsReadFileSync.apply(null, args)
          })
          this.sb.stub(process, 'kill').callsFake(function (pid) {
            // do nothing
          })
        },
        teardown: function() {
          this.sb.restore()
          this.tmpFile.removeCallback()
        },
        doTest: function() {
          var helloServer = _o('../../standalone-examples/HelloServer')
          assert.equal(
            this.output, 'Server listening on port: ' + helloServer.port)
          this.sb.stub(process, 'argv').value([
            'node',
            'HelloServer.js',
            'stop-server'
          ])
          // ensure the server is instantiated again
          delete require.cache[
            require.resolve('../../standalone-examples/HelloServer')]
          var goodbyeServer = _o('../../standalone-examples/HelloServer')
          assert(process.kill.called)
          assert.equal(process.kill.firstCall.args[0], process.pid)
        }
      })
    ]
  })
})
