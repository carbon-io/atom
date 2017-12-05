var assert   = require('assert')

var _        = require('lodash')

var __       = require('@carbon-io/fibers').__(module)
var testtube = require('@carbon-io/test-tube')

var util     = require('./util')

var o        = require('../lib/atom').o(module)
var oo       = require('../lib/atom').oo(module)

/***************************************************************************************************
 * define property command tests
 */
__(function() {
  module.exports = util.makeTest({
    /***************************************************************************
     * name
     */
    name: 'DefinePropertyCommandTests',

    /***************************************************************************
     * description
     */
    description: 'Define property command tests',

    /***************************************************************************
     * setup
     */
    setup: function () { },

    /***************************************************************************
     * teardown
     */
    teardown: function () { },

    /***************************************************************************
     * tests
     */
    tests: [
      util.makeTest({
        name: 'SetTests',
        tests: [
          util.makeTest({
            name: 'DotPathSetTest',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: 1
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$a.b.c': 2,
                d: 3
              })
              util.isMatch(object, {
                a: {
                  b: {
                    c: 2
                  }
                },
                d: 3
              })
            }
          }),
          util.makeTest({
            name: 'DotPathSetNonExistentPathTest',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: 1
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$d.e.f': 2
              })
              util.isMatch(object, {
                a: {
                  b: {
                    c: 1
                  }
                },
                d: {
                  e: {
                    f: 2
                  }
                }
              })
            }
          }),
          util.makeTest({
            name: 'DotPathArrayIndexTest',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: 1
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$a.b.d[0]': 2
              })
              util.isMatch(object, {
                a: {
                  b: {
                    c: 1,
                    d: [2]
                  }
                },
              })
            }
          }),
          util.makeTest({
            name: 'DotPathSparseArrayIndexTest',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: 1
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$a.b.d[100]': 2
              })
              util.isMatch(object, {
                a: {
                  b: {
                    c: 1,
                    d: _.map(_.range(100), i => i === 99 ? 2 : undefined)
                  }
                },
              })
            }
          }),
          util.makeTest({
            name: 'DotPathIntLikeStringsTreatedAsPropertiesTest',
            description: 'Test the behavior of integer like strings (e.g., "01")',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: 1
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$a.b.d[01]': 2
              })
              util.isMatch(object, {
                a: {
                  b: {
                    c: 1,
                    d: {
                      '01': 2
                    }
                  }
                },
              })
            }
          }),
          util.makeTest({
            name: 'DotPathArrayIndexIntoObjectTest',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: 1,
                    d: {
                      e: 2
                    }
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$a.b.d[1]': 3
              })
              util.isMatch(object, {
                a: {
                  b: {
                    c: 1,
                    d: {
                      e: 2,
                      1: 3
                    }
                  }
                },
              })
            }
          }),
          util.makeTest({
            name: 'DotPathStringIndexThrowsTest',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: 'bar',
                  }
                }
              }
              assert.throws(
                () => {
                  let object = o({
                    _type: _prototype,
                    '$a.b.c[2]': 'z'
                  })
                }, TypeError)
            }
          }),
          util.makeTest({
            name: 'DotPathLeaderCharaterNonDotPathTest',
            description: 'Test that a leader character followed by a non property path is ' +
                         'not interpreted as a property path',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: 1,
                  }
                }
              }
              let object = o({
                _type: _prototype,
                $a: 2
              })
              util.isMatch(object, {
                $a: 2
              })
            }
          }),
          util.makeTest({
            name: 'DotPathLeaderCharaterEscapeNonDotPathTest',
            description: 'Test that an even number of leader characters (e.g., "$") does not' +
                         'does not get interpreted as a property path.',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: 1,
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$$$$a.b.c': 2
              })
              util.isMatch(object, {
                a: {
                  b: {
                    c: 1
                  }
                },
                '$$a.b.c': 2
              })
            }
          }),
          util.makeTest({
            name: 'DotPathLeaderCharaterEscapeTest',
            description: 'Test that an odd number of leader characters (e.g., "$") gets ' +
                         'interpreted as a property path with trailing leader characters ' +
                         'escaped properly.',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: 1,
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$$$$$a.b.c': 2
              })
              util.isMatch(object, {
                a: {
                  b: {
                    c: 1
                  }
                },
                $$a: {
                  b: {
                    c: 2
                  }
                }
              })
            }
          }),
          util.makeTest({
            name: 'DotPathLeaderCharaterInPathTreatedLiterallyTest',
            description: 'Test that a property name with leader characters in the ' +
                         'property path is treated literally',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: 1,
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$a.b.$c': 2,
                '$a.b.$$c': 3,
                '$a.b.$$$c': 4
              })
              util.isMatch(object, {
                a: {
                  b: {
                    c: 1,
                    $c: 2,
                    $$c: 3,
                    $$$c: 4
                  }
                },
              })
            }
          }),
        ]
      }),
      util.makeTest({
        name: 'MergeTests',
        tests: [
          util.makeTest({
            name: 'SingleLevelMergeTest',
            doTest: function() {
              let _prototype = {
                a: 1,
                b: 2,
                c: {
                  d: 3,
                  e: 4
                }
              }
              let object = o({
                _type: _prototype,
                g: 5,
                c: {
                  $merge: {
                    d: 6,
                    f: 7
                  }
                }
              })
              util.isMatch(object, {
                a: 1,
                b: 2,
                g: 5,
                c: {
                  d: 6,
                  e: 4,
                  f: 7
                }
              })
            }
          }),
          util.makeTest({
            name: 'MultiLevelMergeOverwriteTest',
            doTest: function() {
              let _prototype = {
                a: 1,
                b: 2,
                c: {
                  d: {
                    e: 3
                  }
                }
              }
              let object = o({
                _type: _prototype,
                c: {
                  $merge: {
                    d: {
                      f: 4
                    },
                    g: 5
                  }
                }
              })
              // confirm "c.d.f" is present
              util.isMatch(object, {
                a: 1,
                b: 2,
                c: {
                  d: {
                    f: 4
                  },
                  g: 5
                }
              })
              // confirm "c.d.e" is not
              util.notIsMatch(object, {
                c: {
                  d: {
                    e: 4
                  }
                }
              })
            }
          }),
          util.makeTest({
            name: 'InnerUnchainedMergeDoesNotMergeTest',
            description: 'Verify that a nested "$merge" whose parent objects do ' +
                         'not contain "$merge" commands does not merge',
            doTest: function() {
              let _prototype = {
                a: 1,
                b: 2,
                c: {
                  d: {
                    e: 3
                  }
                }
              }
              let object = o({
                _type: _prototype,
                c: {
                  d: {
                    $merge: {
                      f: 4
                    }
                  },
                  g: 5
                }
              })
              // confirm "c.d.$merge.f" is present
              util.isMatch(object, {
                a: 1,
                b: 2,
                c: {
                  d: {
                    $merge: {
                      f: 4
                    }
                  }
                }
              })
            }
          }),
          util.makeTest({
            name: 'ChainMergeTest',
            doTest: function() {
              let _prototype = {
                a: 1,
                b: 2,
                c: {
                  d: {
                    e: {
                      f: 3
                    }
                  }
                }
              }
              let object = o({
                _type: _prototype,
                c: {
                  $merge: {
                    d: {
                      $merge: {
                        e: {
                          $merge: {
                            g: 4
                          }
                        }
                      }
                    }
                  }
                }
              })
              util.isMatch(object, {
                a: 1,
                b: 2,
                c: {
                  d: {
                    e: {
                      f: 3,
                      g: 4
                    }
                  }
                }
              })
            }
          }),
          util.makeTest({
            name: 'ChainMergeNonExistentPathTest',
            doTest: function() {
              let _prototype = {
                a: 1,
                b: 2,
                c: {
                  d: {
                    e: {
                      f: 3
                    }
                  }
                }
              }
              let object = o({
                _type: _prototype,
                g: {
                  $merge: {
                    h: {
                      $merge: {
                        i: {
                          $merge: {
                            j: 4
                          }
                        }
                      }
                    }
                  }
                }
              })
              util.isMatch(object, {
                a: 1,
                b: 2,
                c: {
                  d: {
                    e: {
                      f: 3,
                    }
                  }
                },
                g: {
                  h: {
                    i: {
                      j: 4
                    }
                  }
                }
              })
            }
          }),
          util.makeTest({
            name: 'DotPathInnerMergeTest',
            description: 'Test dot notation $merge',
            doTest: function() {
              let _prototype = {
                a: 1,
                b: 2,
                c: {
                  d: {
                    e: {
                      f: 3
                    }
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$c.d.e': {
                  $merge: {
                    g: 4
                  }
                }
              })
              util.isMatch(object, {
                a: 1,
                b: 2,
                c: {
                  d: {
                    e: {
                      f: 3,
                      g: 4
                    }
                  }
                }
              })
            }
          }),
          util.makeTest({
            name: 'DotPathInnerMergeNonExistentPathTest',
            description: 'Test dot notation $merge on non existent path',
            doTest: function() {
              let _prototype = {
                a: 1,
                b: 2,
                c: {
                  d: {
                    e: {
                      f: 3
                    }
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$g.h.i': {
                  $merge: {
                    j: 4
                  }
                }
              })
              util.isMatch(object, {
                a: 1,
                b: 2,
                c: {
                  d: {
                    e: {
                      f: 3
                    }
                  }
                },
                g: {
                  h: {
                    i: {
                      j: 4
                    }
                  }
                }
              })
            }
          }),
          util.makeTest({
            name: 'ObjectWithMergeCommandContainsExtraKeysTest',
            description: 'Test dot notation $merge on non existent path',
            doTest: function() {
              let _prototype = {
                a: 1,
                b: 2,
                c: {
                  d: {
                    e: {
                      f: 3
                    }
                  }
                }
              }
              let object = o({
                _type: _prototype,
                'c.d.e': {
                  $merge: {
                    g: 4
                  },
                  h: 5
                }
              })
              util.isMatch(object, {
                a: 1,
                b: 2,
                c: {
                  d: {
                    e: {
                      f: 3
                    }
                  }
                },
                'c.d.e': {
                  $merge: {
                    g: 4
                  },
                  h: 5
                }
              })
            }
          }),
          util.makeTest({
            name: 'MergeWithArrayTest',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: [0]
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$a.b.c': {
                  $merge: {
                    j: 4
                  }
                }
              })
              util.isMatch(object, {
                a: {
                  b: {
                    c: _.assign([0], {j: 4})
                  }
                }
              })
            }
          }),
          util.makeTest({
            name: 'MergeWithArrayElementTest',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: [{
                      d: 1
                    }]
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$a.b.c[0]': {
                  $merge: {
                    e: 2
                  }
                }
              })
              util.isMatch(object, {
                a: {
                  b: {
                    c: [{
                      d: 1,
                      e: 2
                    }]
                  }
                }
              })
            }
          }),
          util.makeTest({
            name: 'MergeWithNonObjectThrowsTest',
            doTest: function() {
              let _prototype = {
                a: 'foo'
              }
              assert.throws(
                () => {
                  let object = o({
                    _type: _prototype,
                    a: {
                      $merge: {
                        b: 1
                      }
                    }
                  })
                }, TypeError)
            }
          }),
        ]
      }),
      util.makeTest({
        name: 'PropertyTests',
        tests: [
          util.makeTest({
            name: 'DotPathPropertyTest',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: 1
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$a.b.c': {
                  $property: {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: 2
                  }
                }
              })
              util.isMatch(object, {
                a: {
                  b: {
                    c: 2
                  }
                }
              })
              object.a.b.c = 3
              assert.equal(object.a.b.c, 2)
              assert.equal(_.keys(object.a.b).length, 0)
            }
          }),
          util.makeTest({
            name: 'DotPathPropertyNonExistentPathTest',
            doTest: function() {
              let _prototype = {
                a: {
                  b: {
                    c: 1
                  }
                }
              }
              let object = o({
                _type: _prototype,
                '$d.e.f': {
                  $property: {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: 2
                  }
                }
              })
              util.isMatch(object, {
                a: {
                  b: {
                    c: 1
                  }
                },
                d: {
                  e: {
                    f: 2
                  }
                }
              })
              object.a.b.c = 3
              assert.equal(object.a.b.c, 3)
              object.d.e.f = 3
              assert.equal(object.d.e.f, 2)
              assert.equal(_.keys(object.a.b).length, 1)
              assert.equal(_.keys(object.d.e).length, 0)
            }
          })
        ]
      }),
      util.makeTest({
        name: 'DeleteTests',
        tests: [
          util.makeTest({
            name: 'SingleLevelDeleteTest',
            doTest: function() {
              let _prototype = {
                a: 1,
                b: 2,
                c: {
                  d: 3,
                  e: 4
                }
              }
              let object = o({
                _type: _prototype,
                c: {
                  $delete: 'e'
                }
              })
              assert.equal(object.c.d, 3)
              assert.ok(_.isNil(object.c.e))
            }
          }),
          util.makeTest({
            name: 'SingleLevelMultiDeleteTest',
            doTest: function() {
              let _prototype = {
                a: 1,
                b: 2,
                c: {
                  d: 3,
                  e: 4
                }
              }
              let object = o({
                _type: _prototype,
                c: {
                  $delete: ['d', 'e']
                }
              })
              assert.ok(_.isNil(object.c.d))
              assert.ok(_.isNil(object.c.e))
            }
          })
        ]
      })
    ]
  }),

  util.runTestIfMain(module.exports, module)
})

