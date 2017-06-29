/*******************************************************************************
 *
 * Copyright (c) 2012 ObjectLabs Corporation
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var _ = require('lodash')

var __ = require('@carbon-io/fibers').__(module)
var _o = require('@carbon-io/bond')._o(module)

var util = require('./util')
var SkipTest = require('@carbon-io/test-tube').util.SkipTest

NODE_MAJOR_VERSION = Number(process.version.match(/v(\d+)\..+/)[1])

mod = module

/**************************************************************************
 * All tests
 */
__(function() {
  module.exports = util.makeTest({
    /**********************************************************************
     * name
     */
    name: 'AtomTests',

    /**********************************************************************
     * description
     */
    description: 'Atom tests',

    /**********************************************************************
     * tests
     */
    tests: [
      _o('./basic-instantiation-tests'),
      _o('./inheritance-tests'),
      _o('./reference-tests'),
      _o('./cmdargs-tests'),
      _o('./env-vars-tests'),
      NODE_MAJOR_VERSION >= 6 ? _o('./es6-tests') : _.merge(
        new SkipTest(), {name: 'skipEs6Tests', description: 'skip es6 tests'}),
      _o('../docs/code-frags/test')
    ]
  })

  util.runTestIfMain(module.exports, module)
})

