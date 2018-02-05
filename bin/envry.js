#!/usr/bin/env node

'use strict'

const cfg         = require(__dirname + '/../lib/cfg')
const chalk       = require('chalk')
const dotenv      = require('dotenv')
const fs          = require('fs')
const homedir     = require('os').homedir
const auth        = require(__dirname + '/../lib/auth')
const minimist    = require('minimist')
const nodeVersion = require('node-version')
const path        = require('path')
const r2          = require('r2')
const resolve     = require('path').resolve


// envry link myproject/.env myproject-dev
function fileLink(file, envName) {
  const tmpName = path.resolve(homedir(), '.envry', 'links', envName)

  const envFilepath = path.resolve(file)

  // write the location of the env file based on the env name
  fs.writeFileSync(tmpName, envFilepath)
}


async function filePush(envName) {
  const tmpName = path.resolve(homedir(), '.envry', 'links', envName)
  if (!fs.existsSync(tmpName)) {
    console.error('ERROR:', envName, 'not linked.')
    process.exit(1)
  }

  const envFilepath = fs.readFileSync(tmpName, 'utf8').trim()
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

  try {
    const response = await r2.post(`${API_URL}/push?token=${config.token}&currentTeam=${config.currentTeam}`, { json: { envName, fields } }).response

    if(response.status >= 400)
      throw new Error('HTTP request failed. status code:', response.status)

  } catch(er) {
    console.error('ERROR: could not sync the env file.', er.message)
    process.exit(1)
  }
}


async function filePull(envName) {
  const tmpName = path.resolve(homedir(), '.envry', 'links', envName)
  if (!fs.existsSync(tmpName)) {
    console.error('ERROR:', envName, 'not linked.')
    process.exit(1)
  }

  const envFilepath = fs.readFileSync(tmpName, 'utf8').trim()

  try {
    const response = await r2(`${API_URL}/pull/${envName}?token=${config.token}&currentTeam=${config.currentTeam}`).response

    if(response.status >= 400)
      throw new Error('HTTP request failed. status code:', response.status)

    const body = await response.json()

    if (body.status === 'failure')
      throw new Error('failed to retrieve file from remote:', body.reason)

    let out = ''
    const keys = Object.keys(body.fields)
    for(let i=0; i < keys.length; i++) {
      out += `${keys[i]}=${body.fields[keys[i]]}\n`
    }

    fs.writeFileSync(envFilepath, out, 'utf8')
  } catch(er) {
    console.error('ERROR: could not retrieve the env file from remote:', er.message)
    process.exit(1)
  }
}


function printGeneralUsage() {
  console.log(chalk.whiteBright.bold('\n  envry command [options]\n'))
  console.log(chalk.dim('  Commands:\n'))
  console.log('    link  [filepath] [name]  link an environment file to sync')
  console.log('    pull  [name]             pull changes into a linked env file from remote')
  console.log('    push  [name]             push changes from a linked env file to remote')
  console.log(' ')
}


function printTeamUsage() {
  console.log(chalk.whiteBright.bold('\n  envry teams command [options]\n'))
  console.log(chalk.dim('  Commands:\n'))
  console.log('    add     [name]           create a new team name')
  console.log('    invite  [team] [email]   invite an email to the team')
  console.log('    ls                       list all teams you belong to')
  console.log('    switch  [name]           set the current team')
  console.log(' ')
}


async function listTeams() {
  // TODO: show spinner

  const response = await r2(`${API_URL}/teams?token=${config.token}&currentTeam=${config.currentTeam}`).response

  // TODO: render output like this:
  /*
      id               email / name
    ✔ voiceco          voiceco
      nekoflux         reinstein.mike@gmail.com
      dreamingbits     Dreamingbits
  */
  console.log('teams response:', response)
}


async function run() {
  if(argv.h || argv.help || subcommand === 'help')
    return printGeneralUsage()

  if (!config.token) {
    const result = await auth(API_URL)
    Object.assign(config, result)
  }

  if (subcommand === 'link')
    fileLink(argv._[1], argv._[2])
  else if (subcommand === 'push')
    filePush(argv._[1])
  else if (subcommand === 'pull')
    filePull(argv._[1])
  else if (subcommand === 'teams') {
    if (!argv._[1])
      printTeamUsage()
    else if (argv._[1] === 'ls')
      listTeams()
  }
}


// throw an error if node version is too low
if (nodeVersion.major < 7) {
  error('envry requires at least version 7 of Node. Please upgrade!')
  process.exit(1)
}

dotenv.config({ path: __dirname + '/../.env' })

const API_URL = process.env.API_URL || 'https://envry.reinstein.me'
const argv = minimist(process.argv.slice(2))
const subcommand = argv._[0]

const config = cfg.read()

run()
