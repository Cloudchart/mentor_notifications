import should from 'should'
import { worker, queue } from '../initializers/node_resque'

describe('Workers', () => {

  beforeEach((done) => {
    queue.connect(done)
  })

  afterEach((done) => {
    worker.removeAllListeners('success')
    queue.end(done)
  })

  describe('catcher', () => {
    it('should properly enqueue spreader', (done) => {
      worker.on('success', (workerId, q, job, result) => {
        try { result.should.equal(true) } catch (e) { return worker.end(() => { done(e) }) }
        worker.end(done)
      })

      queue.enqueue('notifications', 'catcher', 'd51bc108-6e93-4bc3-bb63-0871f7d26bea')
      worker.start()
    })
  })

  describe('spreader', () => {
    it('should send notifications', (done) => {
      worker.on('success', (workerId, q, job, result) => {
        try { result.should.equal(true) } catch (e) { return worker.end(() => { done(e) }) }
        worker.end(done)
      })

      queue.enqueue('notifications', 'spreader', 'd51bc108-6e93-4bc3-bb63-0871f7d26bea')
      worker.start()
    })
  })

})
