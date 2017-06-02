var assert = require('assert')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var testtube = require('@carbon-io/test-tube')

var o = require('../../../../lib/atom').o(module)

__(function() {
  module.exports = o.main({
    /**********************************************************************
     * _type
     */
    _type: testtube.Test,

    /**********************************************************************
     * name
     */
    name: 'StandaloneTests',

    /**********************************************************************
     * description
     */
    description: 'Standalone examples tests',
    
    /**********************************************************************
     * setup
     */
    setup: function() {
    },

    /**********************************************************************
     * teardown
     */
    teardown: function() {
    },

    /**********************************************************************
     * tests
     */
    tests: [
      _o('./instantiation-tests'),
      _o('./properties-tests'),
      _o('./components-tests'),
      _o('./cli-tests')
    ]
  })
})

