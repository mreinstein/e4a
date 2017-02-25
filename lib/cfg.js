'use strict'

const fs      = require('fs')
const homedir = require('os').homedir
const path    = require('path')


let file = path.resolve(homedir(), '.envry', '.envry.json')

function setConfigFile(nowjson) {
  file = path.resolve(nowjson)
}

function read() {
  let existing = null
  try {
    existing = fs.readFileSync(file, 'utf8')
    existing = JSON.parse(existing)
  } catch (err) {}
  return existing || {}
}

/**
 * Merges the `data` object onto the
 * JSON config stored in `.envry.json`.
 *
 * (atomic)
 * @param {Object} data
 */

function merge(data) {
  const cfg = Object.assign({}, read(), data)
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2))
}

module.exports = {
  setConfigFile,
  read,
  merge
}
