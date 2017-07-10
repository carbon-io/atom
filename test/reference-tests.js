var assert = require('assert')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)
var testtube = require('@carbon-io/test-tube')

var util = require('./util')

var o = require('../lib/atom').o(module)
var oo = require('../lib/atom').oo(module)

/***************************************************************************************************
 * reference tests
 */
__(function() {
  module.exports = util.makeTest({
    /***************************************************************************
     * name
     */
    name: 'ReferenceTests',

    /***************************************************************************
     * description
     */
    description: 'Reference tests',

    /***************************************************************************
     * tests
     */
    tests: [
      util.makeTest({
        name: 'Simple',
        description: 'Simple',
        doTest: function() {
          var a = _o('./fixtures/SomeAnimal')

          assert(a.friend.staticCache)
          assert(a.cache)
          assert(a.isHappy)
          assert(a.friend.cache)
          assert(a.friend.isHappy)
        }
      })
    ]
  })

  util.runTestIfMain(module.exports, module)
})

