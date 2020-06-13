const {sendPasswordResetEmail, signUp, logIn} = require('../../lib/users')
const logger = require('../../lib/log')(__filename)
const db = require('../../sequelize/db')
const routes = {}

routes.resetPassword = async (req, res) => {
  const email = req.body.email
  logger.info('request received to send notification')

  if (!email) {
    return res.status(400).json({error: {message: "invalid input"}})
  }
  logger.info('user email is', email)
  const {Accounts} = db.getModels()
  const userAccount = await Accounts.findOne({
    where: {
      email: email
    }
  })
  if (!userAccount) {
    return res.status(400).json({error: {message: "Account does not exist"}})
  }
  logger.info(`User account found for user ${userAccount.id}, sending email now`)
  try {
    const account = await sendPasswordResetEmail(userAccount)
    logger.info(`user reset password email sent to user ${userAccount.id}`)
    return res.status(200).json(account)
  } catch (err) {
    logger.error(`Could not send email to user ${userAccount.id}`)
    return res.status(500).json({error: {message: 'Email delivery failed. Please try again'}})
  }
}

routes.createUser = async (req, res) => {
  const userInfo = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  }
  try {
    const account = await signUp(userInfo)
    logger.info('Succeded creating user account', userInfo.username)
    logger.warn(account)
    return res.status(200).json(account)
  } catch (err) {
    logger.error("Creating user failed", userInfo.username, err)
    return res.status(500).json({error: {message: 'Creating user failed. Please try again'}})
  }
}

routes.deleteUser = async (req, res) => {
  if (!req.params.id) {
    logger.info("user id was not provided")
    return res.status(400).json({error: {message: "user id was not provided"}})
  }
  const {Accounts} = db.getModels()
  try {
    const account = await Accounts.findOne({
      where: {
        id: req.params.id
      }
    })
    if (!account) {
      logger.info("Cannot find user", req.params.id)
      return res.status(404).json({error: {message: "Cannot find user"}})
    }
    if (account.username !== req.session.username) {
      logger.error("Username does not match to cookie", account.username, req.session.username)
      return res.status(403).json({error: {message: "Username does not match to cookie"}})
    }
    const result = await account.destroy()
    logger.info('Succeded deleting user account', req.params.id)
    return res.status(200).json(result)
  } catch (err) {
    logger.error("Deleting user failed", req.params.id, err)
      res.status(500).json({error: {message: 'Deleting user failed. Please try again'}})
    }
}

routes.loginUser = async (req, res) => {
  const inputInfo = {
    username: req.body.username,
    password: req.body.password,
    email: req.body.email
  }
  try {
    const userInfo = await logIn(inputInfo)
    req.session.username = userInfo.username
    logger.info('Logged in', userInfo.username)
    return res.status(200).json(userInfo)
  } catch (err) {
    logger.info(err)
    return res.status(500).json({error: {message: 'Login user failed. Please try again'}})
  }
}

routes.logoutUser = (req, res) => {
  req.session.username = ''
  logger.info('user logged out', `id: ${req.params.id}`)
  return res.status(200).json({
    message: `Logout succeded`
  })
}

module.exports = routes

