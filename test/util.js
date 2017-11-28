var assert = require('assert')

var _ = require('lodash')

var __ = require('@carbon-io/fibers').__(module)
var testtube = require('@carbon-io/test-tube')

function makeTest(test, TestClass) {
  if (_.isUndefined(TestClass)) {
    TestClass = testtube.Test
  }
  var test_ = new TestClass()
  for (var prop in test) {
    test_[prop] = test[prop]
  }
  if (!_.isUndefined(test._init)) {
    test_._init()
  } else {
    testtube.Test.prototype._init.call(test_)
  }
  return test_
}

function runTestIfMain(test, mod) {
  if (require.main == mod) {
    test._main.run.call(test)
  }
}

function isMatch(actual, expected) {
  if (!_.isMatch(actual, expected)) {
    assert.fail(
      actual, expected, 'The expected value is not subsumed by the actual value', 'isMatch', isMatch)
  }
}

function notIsMatch(actual, expected) {
  try {
    isMatch(actual, expected)
  } catch (e) {
    if (!(e instanceof assert.AssertionError)) {
      throw e
    }
    return
  }
  assert.fail(
    actual, expected, 'The expected value is subsumed by the actual value', 'notIsMatch', notIsMatch)
}

module.exports = {
  isMatch: isMatch,
  makeTest: makeTest,
  notIsMatch: notIsMatch,
  runTestIfMain: runTestIfMain
}
