import NR from 'node-resque'

///////////////////////////
// SET UP THE CONNECTION //
///////////////////////////

let connectionDetails = {
  package: 'ioredis',
  host: '127.0.0.1',
  password: null,
  port: 6379,
  database: 0,
  namespace: 'mentor_notifications'
  // looping: true,
  // options: {password: 'abc'}
};

//////////////////////////////
// DEFINE YOUR WORKER TASKS //
//////////////////////////////

// var jobs = {
//   "add": {
//     plugins: [ 'jobLock' ],
//     pluginOptions: {
//       jobLock: {},
//     },
//     perform: function(a,b,callback){
//       var answer = a + b;
//       callback(null, answer);
//     },
//   },
//   "subtract": {
//     perform: function(a,b,callback){
//       var answer = a - b;
//       callback(null, answer);
//     },
//   },
// };

////////////////////
// START A WORKER //
////////////////////

// var worker = new NR.worker({connection: connectionDetails, queues: ['math', 'otherQueue']}, jobs);
// worker.connect(function(){
//   worker.workerCleanup(); // optional: cleanup any previous improperly shutdown workers on this host
//   worker.start();
// });

///////////////////////
// START A SCHEDULER //
///////////////////////

// var scheduler = new NR.scheduler({connection: connectionDetails});
// scheduler.connect(function(){
//   scheduler.start();
// });

/////////////////////////
// REGESTER FOR EVENTS //
/////////////////////////

// worker.on('start',           function(){ console.log("worker started"); });
// worker.on('end',             function(){ console.log("worker ended"); });
// worker.on('cleaning_worker', function(worker, pid){ console.log("cleaning old worker " + worker); });
// worker.on('poll',            function(queue){ console.log("worker polling " + queue); });
// worker.on('job',             function(queue, job){ console.log("working job " + queue + " " + JSON.stringify(job)); });
// worker.on('reEnqueue',       function(queue, job, plugin){ console.log("reEnqueue job (" + plugin + ") " + queue + " " + JSON.stringify(job)); });
// worker.on('success',         function(queue, job, result){ console.log("job success " + queue + " " + JSON.stringify(job) + " >> " + result); });
// worker.on('failure',         function(queue, job, failure){ console.log("job failure " + queue + " " + JSON.stringify(job) + " >> " + failure); });
// worker.on('error',           function(queue, job, error){ console.log("error " + queue + " " + JSON.stringify(job) + " >> " + error); });
// worker.on('pause',           function(){ console.log("worker paused"); });

// scheduler.on('start',             function(){ console.log("scheduler started"); });
// scheduler.on('end',               function(){ console.log("scheduler ended"); });
// scheduler.on('poll',              function(){ console.log("scheduler polling"); });
// scheduler.on('master',            function(state){ console.log("scheduler became master"); });
// scheduler.on('error',             function(error){ console.log("scheduler error >> " + error); });
// scheduler.on('working_timestamp', function(timestamp){ console.log("scheduler working timestamp " + timestamp); });
// scheduler.on('transferred_job',   function(timestamp, job){ console.log("scheduler enquing job " + timestamp + " >> " + JSON.stringify(job)); });

////////////////////////
// CONNECT TO A QUEUE //
////////////////////////

// var queue = new NR.queue({connection: connectionDetails}, jobs);
// queue.on('error', function(error){ console.log(error); });
// queue.connect(function(){
//   queue.enqueue('math', "add", [1,2]);
//   queue.enqueue('math', "add", [1,2]);
//   queue.enqueue('math', "add", [2,3]);
//   queue.enqueueIn(3000, 'math', "subtract", [2,1]);
// });
