'use strict'

const Joi = require('joi')
const schema = require('./schema.js')
const AirbrakeClient = require('airbrake-js')
const makeErrorHandler = require('airbrake-js/dist/instrumentation/hapi')

exports.register = (server, options, next) => {
  Joi.validate(options, schema.options, (err, result) => {
    if (err) throw err

    // Create Airbrake client
    const airbrake = new AirbrakeClient({
      projectId: result.appId,
      projectKey: result.key,
      host: result.host ? result.host : null
    })

    server.method({
      name: result.notify,
      method: function (err, callback) {
        airbrake.notify(err)
          .then(() => {
            callback()
          })
          .catch((err) => {
            callback(err)
          })
      },
      options: {}
    })

    // Register Airbrake error handler
    server.register({
      register: makeErrorHandler(airbrake)
    }, (error) => {
      if (error) {
        throw error
      }
      next()
    })
  })
}

exports.register.attributes = {
  pkg: require('../package.json')
}
