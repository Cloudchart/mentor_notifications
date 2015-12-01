import path from 'path'
import apn from 'apn'

const env = process.env.NODE_ENV || 'development'
let iosCert, iosKey;

if (env === 'production') {
  iosCert = process.env.IOS_CERT
  iosKey = process.env.IOS_KEY
} else {
  iosCert = path.resolve('./certificates', 'ios', 'cert.pem')
  iosKey = path.resolve('./certificates', 'ios', 'key.pem')
}

const iosApnConnection = new apn.Connection({ cert: iosCert, key: iosKey, production: true })

// TODO: configure APN feedback service


// APN error handlers
//
iosApnConnection.on('transmissionError', (errorCode, notification, device) => {
  console.error('transmissionError, code:', errorCode)
  console.log('device', device)
  console.log('notification', notification)
})

export default iosApnConnection
