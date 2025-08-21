var crypto = require('crypto')

exports.generateRandomString = (length) =>
  crypto.randomBytes(60).toString('hex').slice(0, length)
