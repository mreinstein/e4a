'use strict'

const { stringify: stringifyQuery } = require('querystring')
const chalk        = require('chalk')
const delay        = require('delay')
const r2           = require('r2')
const { validate } = require('email-validator')
const readEmail    = require('email-prompt')
const ora          = require('ora')
const cfg          = require('./cfg')


async function getTeams(url, token) {
  const body = await r2(`${url}/teams?token=${token}`).json
  if (body.status !== 'OK')
    throw new Error('Verification error')
  return body.teams
}


async function submitEmail(url, email) {
  const body = await r2.post(`${url}/auth`, { json: { email } }).json
  if (body.status !== 'OK')
    throw new Error('Verification error')
  return body
}


async function pollVerificationState(url, email, verificationToken) {
  const query = { email, token: verificationToken }
  const body = await r2(`${url}/auth/verify?${stringifyQuery(query)}`).json
  return body.token
}


async function auth(url, {retryEmail = false} = {}) {
  let email
  try {
    email = await readEmail({invalid: retryEmail})
  } catch (err) {
    process.stdout.write('\n')
    throw err
  }

  process.stdout.write('\n')

  if (!validate(email))
    return auth(url, { retryEmail: true })

  const { token, securityCode } = await submitEmail(url, email)
  console.log(`> Please follow the link sent to ${chalk.bold(email)} to log in.`)

  if (securityCode)
    console.log(`> Verify that the provided security code in the email matches ${chalk.cyan(chalk.bold(securityCode))}.`)

  process.stdout.write('\n')

  const spinner = ora({
    text: 'Waiting for confirmation...',
    color: 'black'
  }).start()

  let final

  do {
    await delay(2500)

    try {
      final = await pollVerificationState(url, email, token)
    } catch (err) {}
  } while (!final)

  spinner.text = 'Confirmed email address!'
  spinner.stopAndPersist({ symbol: '✔' })

  process.stdout.write('\n')

  const result = { email, token: final }

  // get the current teamId
  const teams = await getTeams(url, result.token)

  if(teams.length)
    result.currentTeam = teams[0].teamid || teams[0].id

  return result
}


module.exports = async function authenticate(url) {
  if (!process.stdin.setRawMode) {
    console.error('process.stdin.setRawMode is not available. Try running this program from a regular terminal.')
    process.exit(1)
  }

  const loginData = await auth(url)
  cfg.merge(loginData)
  return loginData
}
