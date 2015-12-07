import { worker, queue } from '../clients'

describe('Workers', () => {

  describe('catcher', () => {
    beforeEach((done) => {
      worker.connect(() => {
        queue.connect(() => {
          done()
        })
      })
    })

    afterEach((done) => {
      worker.end()
      done()
    })

    it('should properly enqueue spreader', (done) => {
      worker.on('success', function(queue, job, result){
        // queue.should.equal()
        // job.class.should.equal()
        // result.should.equal()
        console.log(3)
        worker.removeAllListeners('success')
        done()
      })

      queue.enqueue('notifications', 'catcher', '7f9d8b54-2f30-437d-9f8c-6c3ee503f47c')
      console.log(1)
      worker.start()
      console.log(2)
    })
  })

})
