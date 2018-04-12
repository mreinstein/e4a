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
const ora         = require('ora')
const path        = require('path')
const r2          = require('r2')
const resolve     = require('path').resolve
const table       = require('text-table')


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
    console.error(chalk.red('> Error! ') + envName, 'not linked.')
    process.exit(1)
  }

  const envFilepath = fs.readFileSync(tmpName, 'utf8').trim()
  if (!fs.existsSync(envFilepath)) {
    console.error(chalk.red('> Error! ') + envFilepath, 'file does not exist.')
    process.exit(1)
  }

  let fields
  const buf = fs.readFileSync(envFilepath)
  try {
    fields = dotenv.parse(buf)
  } catch (er) {
    console.error(chalk.red('> Error! ') + 'invalid format in file', envFilepath, er.message)
    process.exit(1)
  }

  try {
    const body = {
      envName,
      fields,
      teamid: config.currentTeam
    }
    const response = await r2.post(`${API_URL}/push?token=${config.token}&teamid=${config.currentTeam}`, { json: body }).response

    if(response.status >= 400)
      throw new Error('HTTP request failed. status code:', response.status)

  } catch(er) {
    console.error(chalk.red('> Error! ') + 'could not sync the env file.', er.message)
    process.exit(1)
  }
}


async function filePull(envName) {
  const tmpName = path.resolve(homedir(), '.envry', 'links', envName)
  if (!fs.existsSync(tmpName)) {
    console.error(chalk.red('> Error! ') + envName, 'not linked.')
    process.exit(1)
  }

  const envFilepath = fs.readFileSync(tmpName, 'utf8').trim()

  try {
    const response = await r2(`${API_URL}/pull/${envName}?token=${config.token}&teamid=${config.currentTeam}`).response

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
    console.error(chalk.red('> Error!') + 'could not retrieve the env file from remote:', er.message)
    process.exit(1)
  }
}


function printGeneralUsage() {
  console.log(chalk.whiteBright.bold('\n  envry command [options]\n'))
  console.log(chalk.dim('  Commands:\n'))
  console.log('    link  [filepath] [name]  link an environment file to sync')
  console.log('    ls                       list all environment files in envry')
  console.log('    pull  [name]             pull changes into a linked env file from remote')
  console.log('    push  [name]             push changes from a linked env file to remote')
  console.log('    switch                   change the currently active team')
  console.log('    teams                    teams subcommand')
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


async function createTeam(name) {
  if(name)
    name = name.trim()

  name = name.trim()
  if (!name) {
    console.error('usage: envry teams add [name]')
    return
  }

  const body = { name }
  const response = await r2.post(`${API_URL}/teams/${config.currentTeam}?token=${config.token}`, { json: body }).response

  console.log(' ')
}


async function inviteMember(teamName, email) {
  if(!teamName || !email)
    return console.error('usage: envry teams invite [team] [email]')

  const body = { name: teamName, email }
  const response = await r2.post(`${API_URL}/teams/${config.currentTeam}/members?token=${config.token}`, { json: body }).response

  console.log(' ')
}


async function listTeams() {

  const spinner = ora({
    text: chalk.black('Fetching teams'),
    color: 'black'
  }).start()

  const response = await r2(`${API_URL}/teams?token=${config.token}`).response
  const myTeams = await response.json()

  spinner.text = ' '
  spinner.stopAndPersist({ symbol: ' ' })

  console.log(chalk.black('  team name'))
  myTeams.teams.forEach(function(t) {
    const icon = (t.id === config.currentTeam) ? '✔' : ' '
    console.log(`${icon} ${t.name}`)
  })

  console.log(' ')
}


async function listEnvs() {

  const spinner = ora({
    text: chalk.black('Fetching .env list for current team'),
    color: 'black'
  }).start()

  const response = await r2(`${API_URL}/teams/${config.currentTeam}/list?token=${config.token}`).response
  const myList = await response.json()

  spinner.text = ' '
  spinner.stopAndPersist({ symbol: ' ' })


  const i = [
    [ chalk.black('name'), chalk.black('fields'), chalk.black('linked location') ]
  ]

  for (let entry of myList) {
    let location
    let tmpName = path.resolve(homedir(), '.envry', 'links', entry.name)
    if (!fs.existsSync(tmpName))
      location = chalk.red('not linked')
    else
      location = chalk.white(fs.readFileSync(tmpName, 'utf8').trim())

    location = location.replace(homedir(), '~')

    i.push([ chalk.whiteBright(entry.name), chalk.white(entry.fields), location ])
  }

  console.log(table(i, { align: [ 'l', 'c', 'l' ] }))

  console.log(' ')
}


async function switchTeam(name) {
  if(name)
    name = name.trim()

  if(!name)
    return console.error('usage: envry switch [team_name]')

  const spinner = ora({
    text: chalk.black('Fetching teams'),
    color: 'black'
  }).start()

  const response = await r2(`${API_URL}/teams?token=${config.token}`).response
  const myTeams = await response.json()

  spinner.text = ' '
  spinner.stopAndPersist({ symbol: ' ' })

  const current = myTeams.teams.find(function(t) {
    return t.id === name || t.name === name
  })

  if(!current)
    return console.error(chalk.red('> Error!') + ' Could not find membership for team ' + chalk.black('"') + chalk.whiteBright.bold(name) + chalk.black('"') + '\n')

  config.currentTeam = current.id
  cfg.merge({ currentTeam: current.id })
  console.log(chalk.cyan('> Success!') + ' The team ' + chalk.whiteBright.bold(name) + ' is now active!\n')
}


async function run() {
  if(argv.h || argv.help || subcommand === 'help')
    return printGeneralUsage()

  if (!config.token) {
    const result = await auth(API_URL)
    Object.assign(config, result)
  }

  if (subcommand === 'ls')
    return listEnvs()

  if(!argv._[1])
    return printGeneralUsage()

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
    else if (argv._[1] === 'add')
      createTeam(argv._[2])
    else if (argv._[1] === 'switch')
      switchTeam(argv._[2])
    else if (argv._[1] === 'invite')
      inviteMember(argv._[2], argv._[3])
  } else if(subcommand === 'switch') {
    switchTeam(argv._[1])
  } else {
    console.error(chalk.red('> Error!') + ' Invalid subcommand ' + chalk.black('"') + chalk.whiteBright.bold(argv._[1]) + chalk.black('"') + '\n')
  }
}


// throw an error if node version is too low
if (nodeVersion.major < 7) {
  console.error(chalk.red('> Error! ') + 'envry requires at least version 7 of Node. Please upgrade!')
  process.exit(1)
}

dotenv.config({ path: __dirname + '/../.env' })

const API_URL = process.env.API_URL || 'https://envry.reinstein.me'
const argv = minimist(process.argv.slice(2))
const subcommand = argv._[0]

const config = cfg.read()

run()
