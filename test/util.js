var _ = require('lodash')

var __ = require('@carbon-io/fibers').__(module)
var testtube = require('@carbon-io/test-tube')

var makeTest = function(test, TestClass) {
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

var runTestIfMain = function(test, mod) {
  if (require.main == mod) {
    test._main.run.call(test)
  }
}

module.exports = {
  makeTest: makeTest,
  runTestIfMain: runTestIfMain
}
