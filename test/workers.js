import should from 'should'
import { worker, queue } from '../initializers/node_resque'

describe('Workers', () => {

  beforeEach((done) => {
    worker.connect(() => {
      queue.connect(done)
    })
  })

  afterEach((done) => {
    worker.end(done)
  })

  it('should work', (done) => {
    worker.on('success', (q, job, result) => {
      try {
        result.should.equal(true)
      } catch (e) {
        return done(e)
      } finally {
        worker.removeAllListeners('success')
      }

      done()
    })

    queue.enqueue('notifications', 'spreader', '7f9d8b54-2f30-437d-9f8c-6c3ee503f47c')
    queue.enqueue('notifications', 'catcher', '7f9d8b54-2f30-437d-9f8c-6c3ee503f47c')
    worker.start()
  })

})
