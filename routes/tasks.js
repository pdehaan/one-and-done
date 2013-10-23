var Firebase = require('firebase'),
  url = require("url");
var DB_BASE_URL = process.env.DB_BASE_URL || "https://oneanddone.firebaseIO.com";

/*
 * GET Tasks page
 */
exports.tasks = function (req, res) {
  "use strict";
  var fb = new Firebase(DB_BASE_URL);
  console.log(req.session.user);
  //Get All User Tasks
  if(req.session.auth) {
    var user_id = req.session.auth.id;
    var task_id = parseInt(req.params.task_id, 10) || 0;
    //fetch all tasks
    fb.child('tasks').once('value', function (tasks) {
      //Get user's current task
      fb.child('tasks/' + task_id).once('value', function (userTask) {
        // Get user info
        console.log(userTask.val());
        fb.child("users/" + user_id).once('value', function (userData) {
          res.render("tasks", {
            "userData": userData.val(),
            "currentTask": userTask.val(),
            "tasks": tasks.val()
          });
        });
      });
    });
  } else {
   //Get All Tasks
   fb.child('tasks').once('value', function (tasks) {
       res.render("tasks", {"tasks": tasks.val()});
   });
  }
};

 /*
  * GET Assign task to user
  */

 exports.view = function (req, res) {
    
 }

 exports.take = function (req, res) {
   "use strict";
   if (req.session.auth && parseInt(req.params.task_id) > 0) {
     var user_id = req.session.auth.id;
     var task_id = parseInt(req.params.task_id, 10) || 0;
     var fb = new Firebase(DB_BASE_URL);
 
     // User takes task, update db
     var epoch = Math.round(Date.now() / 1000);
     console.log('epoch: ' + epoch);
     // Add new user with data
     fb.child("users/" + user_id).once('value', function (userData) {
       console.log(userData.val());
       // Update current task info for user
       fb.child("users/" + user_id).update({
         "currentTaskId": task_id,
         "currentTaskComplete": 0,
         "currentTaskClaimedDate": epoch
       });
       // Update task order to bottom of stack
       fb.child("tasks/" + task_id).update({
         "order": 1
       });
       res.redirect('/tasks');
     });
   } else {
     res.json({
       "status": "fail",
       "user_id": user_id,
       "task_id": task_id
     });
   }
 };

/*
* GET Cancel task
*/
exports.cancel = function (req, res) {
  "use strict";
  if(req.session.auth && parseInt(req.params.task_id) > 0 ) {
    var user_id = req.session.auth.id ;
    var task_id = parseInt(req.params.task_id, 10) || 0;
    var fb = new Firebase(DB_BASE_URL);

    fb.child("users/" + user_id).once('value', function (userData) {
      fb.child("users/" + user_id).update({
        "currentTaskId": -1,
        "currentTaskComplete": 0
      });
      res.redirect('/tasks');
    });
  } else {
    res.json({
      "status": "fail",
      "user_id": user_id,
      "task_id": task_id
    });
  }
};

 /*
  * GET Complete a task
  */
 exports.complete = function (req, res) {
   "use strict";

   if(req.session.auth && parseInt(req.params.task_id) > 0 ) {
     var user_id = user.auth.id;
     var task_id = parseInt(req.params.task_id, 10) || 0;
     var fb = new Firebase(DB_BASE_URL);

     var epoch = Math.round(Date.now() / 1000);
     // Get User Data
     fb.child("users/" + user_id).once('value', function (userData) {
       console.log(userData.val());
       // Get current completed_tasks
       fb.child("users/" + user_id + "/completed_tasks").once('value', function (userTasks) {
         var completedTasksString = userTasks.val() + "," + task_id;
         var newCompletedTasks = JSON.parse("[" + completedTasksString + "]");
         // Update current task info for user
         fb.child("users/" + user_id).update({
           "currentTaskId": task_id,
           "currentTaskComplete": 1,
           "lastCompletedDate": epoch
         });
         fb.child("users/" + user_id + "/completed_tasks").update(newCompletedTasks);
         res.redirect('/tasks');
       });
     });
   } else {
     res.json({
       "status": "fail",
       "user_id": user_id,
       "task_id": task_id
     });
   }
 };
