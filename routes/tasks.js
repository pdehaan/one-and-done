var Firebase = require('firebase');
var DB_BASE_URL = process.env.DB_BASE_URL || "https://oneanddone.firebaseIO.com/";

/*
 * GET Tasks page
 */
exports.tasks = function (req, res) {
  "use strict";

  var fb = new Firebase(DB_BASE_URL);
  //Get All User Tasks
  if (req.session.auth) {
    var user_id = req.session.auth.id;
    var task_id = parseInt(req.params.task_id, 10);
    // Get user info
    fb.child("users/" + user_id).once('value', function (userData) {
      //fetch all tasks
      fb.child('tasks').once('value', function (tasks) {
        //Get user's current task
          // Get user info
          res.render("tasks", {
            "userData": userData.val(),
            "tasks": tasks.val()
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
  var fb = new Firebase(DB_BASE_URL + 'tasks/');
  var task_id = parseInt(req.params.task_id, 10);
  fb.child(task_id).once('value', function (task) {
    res.render("viewtask", {
      "task": task.val()
    });
  });
};

exports.take = function (req, res) {
  "use strict";
  var user_id = -99;
  var task_id = -99;
  if (req.session.auth && parseInt(req.params.task_id, 10) > -1) {
    user_id = req.session.auth.id;
    task_id = req.params.task_id;
    var fb = new Firebase(DB_BASE_URL + "users/" + user_id);
    // User takes task, update db
    var epoch = Math.round(Date.now() / 1000);
    console.log('epoch: ' + epoch);
    // Add new user with data
    fb.child("currentTasks/task"+task_id).set({
      "id": task_id,
      "status": "taken",
      "start": epoch,
      "stop": 0
    });
    console.log("just pushed update");
    // Update task order to bottom of stack
    var fb = new Firebase(DB_BASE_URL);
    fb.child("tasks/" + task_id).update({
      "order": 1
    });
    res.redirect('/tasks');
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
  var user_id = -99;
  var task_id = -99;
  if (req.session.auth && parseInt(req.params.task_id, 10) > -1) {
    user_id = req.session.auth.id;
    task_id = req.params.task_id;
    var fb = new Firebase(DB_BASE_URL + "users/" + user_id);
    if (fb) {
      fb.child("/currentTasks/task"+task_id).remove();
      res.redirect('/tasks');
    }
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

  var user_id = -99;
  var task_id = -99;

  if (req.session.auth && parseInt(req.params.task_id, 10) > -1) {
    user_id = req.session.auth.id;
    task_id = req.params.task_id;
    var fb = new Firebase(DB_BASE_URL + "users/" + user_id);
 
    var epoch = Math.round(Date.now() / 1000);
    // Get current completed_tasks
    console.log(task_id);
    fb.child("/currentTasks/task" + task_id).once('value', function (currentTask) {
      console.log("outputing" + currentTask.val());
      fb.child("/completedTasks/task" +task_id).once('value', function (completedTask) {
        console.log("completeTasks " + completedTask);
        if (completedTask.val() == null && currentTask.val().status == "taken") {
        // Update current task info for user
          fb.child("/currentTasks/task" + task_id).update({
            "id": task_id,
            "status": "review",
            "stop": epoch
          });
        }
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
