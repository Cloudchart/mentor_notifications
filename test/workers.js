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

      queue.enqueue('notifications', 'catcher', '7f9d8b54-2f30-437d-9f8c-6c3ee503f47c')
      worker.start()
    })
  })

  describe('spreader', () => {
    it('should send notifications', (done) => {
      worker.on('success', (workerId, q, job, result) => {
        try { result.should.equal(true) } catch (e) { return worker.end(() => { done(e) }) }
        worker.end(done)
      })

      queue.enqueue('notifications', 'spreader', '7f9d8b54-2f30-437d-9f8c-6c3ee503f47c')
      worker.start()
    })
  })

})
