'use strict'

const { stringify: stringifyQuery } = require('querystring')
const chalk        = require('chalk')
const r2           = require('r2')
const { validate } = require('email-validator')
const readEmail    = require('email-prompt')
const ora          = require('ora')
const cfg          = require('./cfg')


async function getVerificationData(url, email) {
  const body = await r2(`${url}/registration`, { json: { email } }).json
  if (body.status !== 'OK') {
    throw new Error('Verification error')
  }
  return body
}


async function verify(url, email, verificationToken) {
  const query = {
    email,
    token: verificationToken
  }

  const body = await r2(`${url}/registration/verify?${stringifyQuery(query)}`).json
  return body.token
}


function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}


async function register(url, {retryEmail = false} = {}) {
  let email
  try {
    email = await readEmail({invalid: retryEmail})
  } catch (err) {
    process.stdout.write('\n')
    throw err
  }

  process.stdout.write('\n')

  if (!validate(email)) {
    return register(url, { retryEmail: true })
  }

  const { token, securityCode } = await getVerificationData(url, email)
  console.log(`> Please follow the link sent to ${chalk.bold(email)} to log in.`)

  if (securityCode) {
    console.log(`> Verify that the provided security code in the email matches ${chalk.cyan(chalk.bold(securityCode))}.`)
  }

  process.stdout.write('\n')

  const spinner = ora({
    text: 'Waiting for confirmation...',
    color: 'black'
  }).start()

  let final

  do {
    await sleep(2500)

    try {
      final = await verify(url, email, token)
    } catch (err) {}
  } while (!final)

  spinner.text = 'Confirmed email address!'
  spinner.stopAndPersist('✔')

  process.stdout.write('\n')

  return { email, token: final }
}


module.exports = async function login(url) {
  if (!process.stdin.setRawMode) {
    console.error('process.stdin.setRawMode is not available. Try running this program from a regular terminal.')
    process.exit(1)
  }
  const loginData = await register(url)
  cfg.merge(loginData)
  return loginData.token
}
