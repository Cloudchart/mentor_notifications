import NR from 'node-resque'
import workers from '../workers'
import redisClient from './redisClient'

const queue = new NR.queue({ connection: { redis: redisClient } }, workers)

export default queue
