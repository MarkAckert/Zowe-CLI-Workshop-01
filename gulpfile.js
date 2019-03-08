var gulp = require('gulp-help')(require('gulp'));
var gulpSequence = require('gulp-sequence');
var PluginError = require('plugin-error');
var cmd = require('node-cmd');

/**
 * await Job Callback
 * @callback awaitJobCallback
 * @param {Error} err 
 */

/**
* Polls jobId. Callback is made without error if Job completes with CC < MaxRC in the allotted time
* @param {string}           jobId     jobId to check the completion of
* @param {number}           [maxRC=0] maximum allowable return code
* @param {awaitJobCallback} callback  function to call after completion
* @param {number}           tries     max attempts to check the completion of the job
* @param {number}           wait      wait time in ms between each check
*/
function awaitJobCompletion(jobId, maxRC=0, callback, tries = 30, wait = 1000) {
  if (tries > 0) {
      sleep(wait);
      cmd.get(
      'zowe jobs view job-status-by-jobid ' + jobId + ' --rff retcode --rft string',
      function (err, data, stderr) {
          retcode = data.trim();
          //retcode should either be null of in the form CC nnnn where nnnn is the return code
          if (retcode == "null") {
            awaitJobCompletion(jobId, maxRC, callback, tries - 1, wait);
          } else if (retcode.split(" ")[1] <= maxRC) {
            callback(null);
          } else {
            callback(new Error(jobId + " had a return code of " + retcode + " exceeding maximum allowable return code of " + maxRC));
          }
      }
      );
  } else {
      callback(new Error(jobId + " timed out."));
  }
}

/**
 * Sleep function.
 * @param {number} ms Number of ms to sleep
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

gulp.task('bind-n-grant', 'Bind & Grant Job', function (callback) {
  var command = 'zowe jobs submit data-set "CUST0_WORKSHOP_USER_ID_.MARBLES.JCL(MARBIND)" --rff jobid --rft string';
  
  // Submit job, await completion
  cmd.get(command, function (err, data, stderr) {
    if(err){
      callback(err);
    } else if (stderr){
      callback(new Error("\nCommand:\n" + command + "\n" + stderr + "Stack Trace:"));
    } else {
      // Strip unwanted whitespace/newline
      var jobId = data.trim();
      
      // Await the jobs completion
      awaitJobCompletion(jobId, 4, function(err){
        if(err){
          callback(err);
        } else{
          callback();
        }
      });
    }
  });
});

gulp.task('build', 'Build COBOL program', function (callback) {
  var command = 'zowe jobs submit data-set "CUST0_WORKSHOP_USER_ID_.MARBLES.JCL(MARSGEN)" --rff jobid --rft string';
  
  // Submit job, await completion
  cmd.get(command, function (err, data, stderr) {
    if(err){
      callback(err);
    } else if (stderr){
      callback(new Error("\nCommand:\n" + command + "\n" + stderr + "Stack Trace:"));
    } else {
      // Strip unwanted whitespace/newline
      var jobId = data.trim();
      
      // Await the jobs completion
      awaitJobCompletion(jobId, 4, function(err){
        if(err){
          callback(err);
        } else{
          callback();
        }
      });
    }
  });
});

gulp.task('cics-refresh', 'Refresh(new-copy) MARBLE_WORKSHOP_USER_ID_ CICS Program', function (callback) {
  var cics = (typeof process.env.CICS === "undefined") ? "" : process.env.CICS,
      command = 'zowe cics refresh program "MARBLE_WORKSHOP_USER_ID_" ' + cics;

  cmd.get(command, function (err, data, stderr) {
    if(err){
      callback(err);
    } else if (stderr){
      callback(new Error("\nCommand:\n" + command + "\n" + stderr + "Stack Trace:"));
    } else {
      callback();
    };
  });
});

gulp.task('copy', 'Copy program to test environment', function (callback) {
  var command = 'zowe jobs submit data-set "CUST0_WORKSHOP_USER_ID_.MARBLES.JCL(MARSCOPY)" --rff jobid --rft string';
  
  // Submit job, await completion
  cmd.get(command, function (err, data, stderr) {
    if(err){
      callback(err);
    } else if (stderr){
      callback(new Error("\nCommand:\n" + command + "\n" + stderr + "Stack Trace:"));
    } else {
      // Strip unwanted whitespace/newline
      var jobId = data.trim();
      
      // Await the jobs completion
      awaitJobCompletion(jobId, 0, function(err){
        if(err){
          callback(err);
        } else{
          callback();
        }
      });
    }
  });
});

gulp.task('deploy', 'Deploy Program', gulpSequence('copy','bind-n-grant','cics-refresh'));