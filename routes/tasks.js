var marked = require("marked");
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
        tasks = tasks.val().map(function (task) {
          task.description = marked(task.description);
          return task;
        });
        // Get user's current task
        // Get user info
        res.render("tasks", {
          "userData": userData.val(),
          "tasks": tasks
        });
      });
    });
  } else {
    //Get All Tasks
    fb.child('tasks').once('value', function (tasks) {
      tasks = tasks.val().map(function (task) {
        task.description = marked(task.description);
        return task;
      });
      res.render("tasks", {
        "tasks": tasks
      });
    });
  }
};

 /*
  * GET Assign task to user
  */

exports.view = function (req, res) {
  var fb = new Firebase(DB_BASE_URL);
  var task_id = parseInt(req.params.task_id, 10);
  var role = "contributor";
  var commentable = false;
  var editable = false;
  var user_id = null;
  function next() {
    fb.child("tasks/" + task_id).once('value', function (task) {
      fb.child("taskcomments/task" + task_id).once('value', function (comments) {
        var edited_comments = comments.val();
        for (var index in edited_comments) {
          delete edited_comments[index]['user'];
        }
        res.render("viewtask", {
          "task": task.val(),
          "comments": edited_comments,
          "commentable": commentable,
          "editable": editable
        });
      });
    });
  }
  if (req.session.auth) {
    user_id = req.session.auth.id;
    fb.child("/users/" + user_id).once('value', function (user) {
      role = user.val().role;
      if (role.substring("admin")) {
        commentable = true;
        editable = true;
      } else {
        var currentTasks = user.val().currentTasks;
        for (var id in currentTasks) {
          if (task_id === id.substring(4)) {
            commentable = true;
          }
        }
      }
      next();
    });
  } else {
    next();
  }
};


exports.create = function (req, res) {
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
    console.log('task: ' + task_id);
    var fb2 = new Firebase(DB_BASE_URL);
    fb2.child("tasks/" + task_id).once("value", function (task) {
      var instances = task.val().instances;
      if (instances >= 1) {
        instances--;
      }
      // Add new user with data
      fb.child("currentTasks/task" + task_id).set({
        "id": task_id,
        "status": "taken",
        "start": epoch,
        "stop": 0
      });
      console.log("just pushed update");
      // Update task, decrement instances allowed, and set order to bottom of stack
      fb2.child("tasks/" + task_id).update({
        "order": 1,
        "instances" : instances
      });
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
      fb.child("/currentTasks/task" + task_id).remove();
      var taskRef = new Firebase(DB_BASE_URL + "tasks/");
      taskRef.child(task_id).once('value', function (task) {
        var instances = task.val().instances;
        if (instances >= 0) {
          instances++;
        }
        taskRef.child(task_id).update({
          "instances": instances
        });
      });
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
      fb.child("/completedTasks/task" + task_id).once('value', function (completedTask) {
        console.log("completeTasks " + completedTask);
        if (completedTask.val() == null && currentTask.val().status === "taken") {
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
