import path from 'path'
import moment from 'moment'
import postmark from 'postmark'
import apn from 'apn'

import { Trace } from '../models'
import { Insight, UsersThemesInsight, User } from '../models/web_app'
import Users from '../data/users'

const env = process.env.NODE_ENV || 'development'
const postmarkClient = new postmark.Client(process.env.POSTMARK_API_KEY)

// APN connections
//
let safariCert, safariKey, iosCert, iosKey;

if (env === 'production') {
  safariCert = process.env.SAFARI_CERT
  safariKey = process.env.SAFARI_KEY
  iosCert = process.env.IOS_CERT
  iosKey = process.env.IOS_KEY
} else {
  safariCert = path.resolve('./certificates', 'safari', 'cert.pem')
  safariKey = path.resolve('./certificates', 'safari', 'key.pem')
  iosCert = path.resolve('./certificates', 'ios', 'cert.pem')
  iosKey = path.resolve('./certificates', 'ios', 'key.pem')
}

const safariApnConnection = new apn.Connection({ cert: safariCert, key: safariKey, production: true })
const iosApnConnection = new apn.Connection({ cert: iosCert, key: iosKey, production: true })

// TODO: configure APN feedback service

// APN error handlers
//
iosApnConnection.on('transmissionError', (errorCode, notification, device) => {
  console.error('transmissionError, code:', errorCode)
  console.log('device', device)
  console.log('notification', notification)
})


// Helpers
//
function findLastTrace(userId) {
  return Trace.findOne({ order: [['createdAt', 'DESC']], where: { userId: userId } })
}

function sendEmail(user, insightIds) {
  if (!user.email) return

  postmarkClient.sendEmail({
    from: 'staff@insights.vc',
    to: user.email,
    subject: 'Notification',
    TextBody: insightIds.join(', ')
  }, async (error, success) => {
    if(error) {
      console.error('unable to send via postmark:', error.message)
    } else {
      console.log('email sent')
    }
  })
}

function sendPush(userId) {
  let user = Users.find((user) => { return user.id === userId })

  // safari test
  let safariDevice = new apn.Device(user.pushTokens.safari)
  let safariNote = new apn.Notification()
  safariNote.alert = {
    title: 'Mentor',
    body: 'Testing...'
  }
  safariNote.urlArgs = ['']
  safariApnConnection.pushNotification(safariNote, safariDevice)
  console.log('safari push sent')

  // ios test
  let iosDevice = new apn.Device(user.pushTokens.ios)
  let iosNote = new apn.Notification()
  iosNote.alert = 'Testing...'
  iosNote.sound = 'default'
  iosApnConnection.pushNotification(iosNote, iosDevice)
  console.log('ios push sent')
}


// Worker (sends notification to a user)
//
export default {
  perform: async (userId, done) => {
    // find user
    let user = await User.findById(userId)

    if (!user) {
      console.error('user', userId, 'was not found')
      return done(null, true)
    }

    // find last trace and define range
    let lastTrace = await findLastTrace(userId)
    let range = { $lte: moment().utc().format() }
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
    sendEmail(user, insightIds)
    sendPush(userId)

    // leave trace
    let trace = await Trace.create({ userId: user.id, status: 'delivered' })
    console.log('trace created with status:', trace.status)
    done(null, true)
  }
}
