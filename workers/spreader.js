#!/usr/bin/env babel-node --optional es7.asyncFunctions

import path from 'path'
import moment from 'moment'
import postmark from 'postmark'
import apn from 'apn'

import config from '../config/app.json'
import { Trace } from '../models'
import { Insight, UsersThemesInsight, User } from '../models/web_app'

const postmarkClient = new postmark.Client(config.postmarkApiKey)

const safariApnConnection = new apn.Connection({
  cert: path.resolve('./certificates', 'safari', 'cert.pem'),
  key: path.resolve('./certificates', 'safari', 'key.pem'),
  production: true
})


// Helpers
//
function findLastTrace(userId) {
  return Trace.findOne({ order: [['createdAt', 'DESC']], where: { userId: userId } })
}

function sendEmail(user, insightIds) {
  if (!user.email) return

  postmarkClient.sendEmail({
    from: config.defaultFrom,
    to: user.email,
    subject: 'Notification',
    TextBody: insightIds.join(', ')
  }, async (error, success) => {
    if(error) {
      console.error('Unable to send via postmark: ' + error.message)
      return
    }
  })
}

function sendPush() {
  let myDevice = new apn.Device('4C37DA3F4C27318B8347AB2426AACD1AB2328F31877F5F4DF73C36305D39126D')
  let note = new apn.Notification()
  note.alert = {
    title: 'Hello World',
    body: 'We made it!'
  }
  note.urlArgs = ['']
  safariApnConnection.pushNotification(note, myDevice)
  console.log('i think i sent push')
}


// Worker (sends notification to a user)
//
export default {
  perform: async (userId, done) => {
    console.log('spreader here', moment().format())
    // find user
    let
      user = await User.findById(userId),
      lastTrace = await findLastTrace(userId),
      range = { $lte: moment().utc().format() };

    if (lastTrace) { range['$gte'] = lastTrace.createdAt }

    // get insights without user reactions
    let usersThemesInsights = await UsersThemesInsight.findAll({
      attributes: ['insight_id'],
      where: { user_id: user.id, rate: null, created_at: range }
    })

    let insightIds = usersThemesInsights.map((uti) => { return uti.insight_id })

    if (insightIds.length == 0) {
      console.log('no insights were found')
      return done(null, true)
    }

    // send notification (email, push)
    // TODO: error handling
    sendEmail(user, insightIds)
    sendPush()

    // leave trace
    let trace = await Trace.create({ userId: user.id, status: 'delivered' })
    console.log(trace.status)
    done(null, true)
  }
}
