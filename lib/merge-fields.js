'use strict'

// merge a new set of fields into an existing set of fields,
// while optionally ignoring a set of field names
//
// @param object prev the existing fields
// @param object next the new field values
// @param array locks field names to ignore when merging
// @return object
function mergeFields(prev, next, locks=[]) {
  const result = JSON.parse(JSON.stringify(next))

  let key, i
  for(i=0; i < locks.length; i++) {
    key = locks[i]
    result[key] = prev[key] || ''
  }

  return result
}
