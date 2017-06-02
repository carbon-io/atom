NODE_MAJOR_VERSION = Number(process.version.match(/v(\d+)\..+/)[1])

module.exports = {
  simpleInvoke: require('./simpleInvoke'),
  constructorInvoke: require('./constructorInvoke'),
  nestedObjectsInvoke: require('./nestedObjectsInvoke'),
  objectPrototypeInvoke: require('./objectPrototypeInvoke'),
  es6Invoke: NODE_MAJOR_VERSION >= 6 ? require('./es6Invoke') : undefined
}
