var sinon = require('sinon')
var mockery = require('mockery')

var bond = require('@carbon-io/bond') 
var fibers = require('@carbon-io/fibers')
var testtube = require('@carbon-io/test-tube')
var __ = fibers.__(module)
var _o = bond._o(module)

var atom = require('../../../lib/atom')
var o = atom.o(module)

var carbonioMock = {
  atom: atom,
  bond: bond,
  fibers: fibers,
  testtube: testtube
}

__(function() {
  module.exports = o.main({
    /**********************************************************************
     * _type
     */
    _type: testtube.Test,

    /**********************************************************************
     * name
     */
    name: 'AtomCodeFragsTestSuite',

    /**********************************************************************
     * description
     */
    description: 'Atom code frags tests',
    
    /**********************************************************************
     * setup
     */
    setup: function() {
      mockery.registerMock('carbon-io', carbonioMock)
      mockery.enable({
        warnOnReplace: false,
        warnOnUnregistered: false
      })
    },

    /**********************************************************************
     * teardown
     */
    teardown: function() {
      mockery.disable()
      mockery.deregisterMock('carbon-io')
    },

    /**********************************************************************
     * tests
     */
    tests: {
      $property: {
        get: function() {
          return [
            _o('./standalone-tests'),
          ]
        }
      }
    }
  })
})


