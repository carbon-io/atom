var http = require('http')
var fs = require('fs')
var carbon = require('carbon-io')
var o = carbon.atom.o(module)

module.exports = o.main({
  verbose: false,
  _app: undefined,

  cmdargs: {
    startServer: {
      command: true,
      full: 'start-server',
      default: true,
      cmdargs: {
        port: {
          abbr: 'p',
          help: 'port server should listen on',
          default: 8080
        }
      }
    },
    stopServer: {
      command: true,
      full: 'stop-server',
    },
    verbose: {
      abbr: 'v',
      help: 'enable verbose logging',
      required: false,
      flag: true,
      property: true // set this value as a field on this object when parsed
                     // as a cmdline option
    }
  },

  _main: {
    startServer: function(options) {
      var self = this
      this.port = options.startServer.port
      this._app = http.createServer(function(req, res) {
        res.end('Hello')
      })
      this._app.listen(this.port, '127.0.0.1', function() {
        fs.writeFileSync('/tmp/server.pid', process.pid, {encoding: 'utf8'})
        if (self.verbose) {
          console.log('Server listening on port: ' + self.port)
        }
      })
    },
    stopServer: function(options) {
      var pid = fs.readFileSync('/tmp/server.pid', {encoding: 'utf8'})
      if (pid) {
        if (this.verbose) {
          console.log('Stopping server with pid: ' + pid)
        }
        process.kill(pid, 'SIGTERM')
      }
    }
  }
})
