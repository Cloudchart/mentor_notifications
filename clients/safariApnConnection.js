import path from 'path'
import apn from 'apn'

const env = process.env.NODE_ENV || 'development'
let safariCert, safariKey;

if (env === 'production') {
  safariCert = process.env.SAFARI_CERT
  safariKey = process.env.SAFARI_KEY
} else {
  safariCert = path.resolve('./certificates', 'safari', 'cert.pem')
  safariKey = path.resolve('./certificates', 'safari', 'key.pem')
}

const safariApnConnection = new apn.Connection({ cert: safariCert, key: safariKey, production: true })

export default safariApnConnection
