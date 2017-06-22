#!/usr/bin/env node

'use strict'

const cfg         = require(__dirname + '/../lib/cfg')
const dotenv      = require('dotenv')
const fs          = require('fs')
const homedir     = require('os').homedir
const login       = require(__dirname + '/../lib/login')
const minimist    = require('minimist')
const nodeVersion = require('node-version')
const path        = require('path')
const request     = require('request')
const resolve     = require('path').resolve


// throw an error if node version is too low
if (nodeVersion.major < 7) {
  error('envry requires at least version 7 of Node. Please upgrade!')
  process.exit(1)
}

dotenv.config({ path: __dirname + '/../.env' })

const API_URL = process.env.API_URL || 'https://envry.reinstein.me'
const argv = minimist(process.argv.slice(2))

const subcommand = argv._[0]

// ensure the config environment is set up
function checkConfigDirectory() {
  const configDir = path.resolve(homedir(), '.envry')
  if(!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir)
  }

  const linksDir = path.resolve(homedir(), '.envry', 'links')
  if(!fs.existsSync(linksDir)) {
    fs.mkdirSync(linksDir)
  }
}

// envry link myproject/.env myproject-dev
function fileLink(file, envName) {
  const tmpName = path.resolve(homedir(), '.envry', 'links', envName)

  const envFilepath = path.resolve(file)

  // write the location of the env file based on the env name
  fs.writeFileSync(tmpName, envFilepath)
}


function filePush(envName) {
  const tmpName = path.resolve(homedir(), '.envry', 'links', envName)
  if (!fs.existsSync(tmpName)) {
    console.error('ERROR:', envName, 'not linked.')
    process.exit(1)
  }

  const envFilepath = fs.readFileSync(tmpName, 'utf8')
  if (!fs.existsSync(envFilepath)) {
    console.error('ERROR:', envFilepath, 'file does not exist.')
    process.exit(1)
  }

  let fields
  const buf = fs.readFileSync(envFilepath)
  try {
    fields = dotenv.parse(buf)
  } catch (er) {
    console.error('ERROR: invalid format in file', envFilepath, er.message)
    process.exit(1)
  }

  const options = {
    url: `${API_URL}/push?token=${config.token}`,
    json: true,
    body: { envName, fields }
  }

  request.post(options, function(err, response, body) {
    if (err) {
      console.error('ERROR: could not sync the env file.', err.message)
      process.exit(1)
    }

    if(response.statusCode >= 400) {
      console.error('ERROR: could not sync the env file. HTTP request failed. status code:', response.statusCode)
      process.exit(1)
    }
  })
}

function filePull(envName) {
  const tmpName = path.resolve(homedir(), '.envry', 'links', envName)
  if (!fs.existsSync(tmpName)) {
    console.error('ERROR:', envName, 'not linked.')
    process.exit(1)
  }

  const envFilepath = fs.readFileSync(tmpName, 'utf8').trim()

  const options = {
    url: `${API_URL}/pull?token=${config.token}`,
    json: true,
    body: { envName }
  }

  request.get(options, function(err, response, body) {
    if (err) {
      console.error('ERROR: could not retrieve the env file from remote:', err.message)
      process.exit(1)
    }

    if(response.statusCode >= 400) {
      console.error('ERROR: could not sync the env file. HTTP request failed. status code:', response.statusCode)
      process.exit(1)
    }

    if (body.status === 'failure') {
      console.error('ERROR: could not retrieve the env file from remote:', body.reason)
      process.exit(1)
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

const config = cfg.read()

async function run() {
  if (!config.token) {
    await login(API_URL)
  }

  if (subcommand === 'link') {
    fileLink(argv._[1], argv._[2])
  } else if (subcommand === 'push') {
    filePush(argv._[1])
  } else if (subcommand === 'pull') {
    filePull(argv._[1])
  }
}

run()
