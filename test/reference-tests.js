var assert = require('assert')

var _o = require('@carbon-io/bond')._o(module)
var testtube = require('@carbon-io/test-tube')

var makeTest = require('./util').makeTest

var o = require('../lib/atom').o(module)
var oo = require('../lib/atom').oo(module)

/*******************************************************************************
 * reference tests
 */
var referenceTests = makeTest({
  /**********************************************************************
   * name
   */
  name: 'ReferenceTests',

  /**********************************************************************
   * description
   */
  description: 'Reference tests',

  /**********************************************************************
   * tests
   */
  tests: [
    makeTest({
      name: 'Simple',
      description: 'Simple',
      doTest: function() {
        var a = _o('./lib/SomeAnimal')

        assert(a.friend.staticCache)
        assert(a.cache)
        assert(a.isHappy)
        assert(a.friend.cache)
        assert(a.friend.isHappy)
      }
    })
  ]
})

module.exports = referenceTests


