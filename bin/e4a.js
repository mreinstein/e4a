#!/usr/bin/env node

'use strict'

const dotenv      = require('dotenv')
const fs          = require('fs')
const homedir     = require('os').homedir
const minimist    = require('minimist')
const nodeVersion = require('node-version')
const path        = require('path')
const request     = require('request')
const resolve     = require('path').resolve


// throw an error if node version is too low
if (nodeVersion.major < 6) {
  error('e4a requires at least version 6 of Node. Please upgrade!')
  process.exit(1)
}

dotenv.config({ path: __dirname + '/../.env' })

const API_URL = process.env.API_URL || 'https://e4a.reinstein.me'
const argv = minimist(process.argv.slice(2))

const subcommand = argv._[0]

// ensure the config environment is set up
function checkConfigDirectory() {
  const configDir = path.resolve(homedir(), '.e4a')
  if(!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir)
  }

  const linksDir = path.resolve(homedir(), '.e4a', 'links')
  if(!fs.existsSync(linksDir)) {
    fs.mkdirSync(linksDir)
  }
}

// e4a link myproject/.env myproject-dev
function fileLink(file, envName) {
  const tmpName = path.resolve(homedir(), '.e4a', 'links', envName)

  const envFilepath = path.resolve(file)

  if (!fs.existsSync(envFilepath)) {
    console.error('ERROR:', file, 'does not exist')
    return
  }

  const buf = fs.readFileSync(envFilepath)
  try {
    const fields = dotenv.parse(buf)
    const options = {
      url: `${API_URL}/push?token=something123`,
      json: true,
      body: { envName, fields }
    }

    request.post(options, function(err, response, body) {
      if (err) {
        console.error('ERROR: could not sync the env file.', err.message)
      } else {
        // write the location of the env file based on the env name
        fs.writeFileSync(tmpName, envFilepath)
      }
    })
  } catch (er) {
    console.error('ERROR: invalid format in file', file, er.message)
  }
}


function filePush(envName) {
  const tmpName = path.resolve(homedir(), '.e4a', 'links', envName)
  if (!fs.existsSync(tmpName)) {
    console.error('ERROR:', envName, 'not linked.')
    return
  }

  const envFilepath = fs.readFileSync(tmpName, 'utf8')
  if (!fs.existsSync(envFilepath)) {
    console.error('ERROR:', envFilepath, 'file does not exist.')
    return
  }

  let fields
  const buf = fs.readFileSync(envFilepath)
  try {
    fields = dotenv.parse(buf)
  } catch (er) {
    console.error('ERROR: invalid format in file', envFilepath, er.message)
    return
  }

  const options = {
    url: `${API_URL}/push?token=something123`,
    json: true,
    body: { envName, fields }
  }

  request.post(options, function(err, response, body) {
    if (err) {
      console.error('ERROR: could not sync the env file.', err.message)
    }
  })
}

function filePull(envName) {
  const tmpName = path.resolve(homedir(), '.e4a', 'links', envName)
  if (!fs.existsSync(tmpName)) {
    console.error('ERROR:', envName, 'not linked.')
    return
  }

  const envFilepath = fs.readFileSync(tmpName, 'utf8')

  const options = {
    url: `${API_URL}/pull?token=something123`,
    json: true,
    body: { envName }
  }

  request.get(options, function(err, response, body) {
    if (err) {
      console.error('ERROR: could not retrieve the env file from remote:', err.message)
      return
    }

    let out = ''
    const keys = Object.keys(body.fields)
    for(let i=0; i < keys.length; i++) {
      out += `${keys[i]}=${body.fields[keys[i]]}\n`
    }

    fs.writeFileSync(envFilepath, out, 'utf8')
  })
}

checkConfigDirectory()

if (subcommand === 'link') {
  fileLink(argv._[1], argv._[2])
} else if (subcommand === 'push') {
  filePush(argv._[1])
} else if (subcommand === 'pull') {
  filePull(argv._[1])
}
