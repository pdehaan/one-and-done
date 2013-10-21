#!/usr/bin/env node

var Firebase = require('firebase'),
    verify = require('browserid-verify')({type : 'remote'});

var DB_BASE_URL = process.env.DB_BASE_URL || "https://oneanddone-dev.firebaseIO.com";
var DEF_TITLE = "Mozilla One and Done";


function escapeEmailAddress(email) {
  "use strict";

  if (!email) {
    return false;
  }

  // Replace '.' (not allowed in a Firebase key) with ','
  return email.toLowerCase().replace(/\./g, ',');
}



function getLeaderboard(cb) {
  "use strict";

  var fb = new Firebase(DB_BASE_URL);
  fb.child('users').once('value', function (snap) {
    var usersList = snap.val();
    cb(usersList);
  });
}


/*
 * GET home page.
 */
exports.index = function (req, res) {
  "use strict";

  getLeaderboard(function (usersList) {
    res.render("index", {
      "title": DEF_TITLE + " > Home",
      "users": usersList,
      "user_name": req.session.username || "Stranger"
    });
  });
};


/*
 * GET Tasks page
 */
exports.tasks = function (req, res) {
  "use strict";
  var user_id = escapeEmailAddress(req.session.user) || "";
  var task_id = parseInt(req.params.task_id, 10) || 0;
  //fetch all tasks
  var fb = new Firebase(DB_BASE_URL);
  //Get All Tasks
  fb.child('tasks').once('value', function (tasks) {
    //Get user's current task
    fb.child('tasks/' + task_id).once('value', function (userTask) {
      // Get user info
      fb.child("users/" + user_id).once('value', function (userData) {
        console.log(userTask.val());
        res.render("tasks", {
          "title": DEF_TITLE + " > Tasks",
          "tasks": tasks.val(),
          "userData": userData.val(),
          "currentTask": userTask.val()
        });
      });
    });
  });
};


/*
 * GET Assign task to user
 */
exports.take = function (req, res) {
  "use strict";

  var user_id = escapeEmailAddress(req.session.user) || "";
  var task_id = parseInt(req.params.task_id, 10) || 0;
  var fb = new Firebase(DB_BASE_URL);

  // User takes task, update db
  if (user_id && task_id) {
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
 * GET Complete a task
 */
exports.complete = function (req, res) {
  "use strict";

  var user_id = escapeEmailAddress(req.session.user) || "";
  var task_id = parseInt(req.params.task_id, 10) || 0;
  var fb = new Firebase(DB_BASE_URL);

  // User takes task, update db
  if (user_id && task_id) {
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


/*
 * GET Leaderboard
 */
exports.leaderboard = function (req, res) {
  "use strict";

  getLeaderboard(function (usersList) {
    res.render("leaderboard", {
      "title": DEF_TITLE + " > Leaderboard",
      "users": usersList,
      "user_name": req.session.username || "Stranger"
    });
  });
};


/*
 * GET Persona Auth Magic
 */
exports.auth = function (audience) {
  "use strict";

  return function (req, res) {
    var assertion = req.body.assertion;

    console.info('verifying with persona');

    verify(assertion, audience, function (err, email, data) {
      console.log(data);
      if (err) {
        // return JSON with a 500 saying something went wrong
        console.warn('request to verifier failed : ' + err);
        return res.send(200, {
          "status": "failure",
          "reason": err.toString()
        });
      }

      // got a result, check if it was okay or not
      if (email) {
        console.info('browserid auth successful, setting req.session.user');
        req.session.user = email;
        return res.redirect('/user/check');
      }

      // request worked, but verfication didn't, return JSON
      if (!email) {
        req.session = null;
        return res.json({
          "ok": false,
          "msg": res.reason
        });
      }
    });
  };
};


/**
 * GET userCheck
 */
exports.userCheck = function (req, res) {
  "use strict";

  var user_id = escapeEmailAddress(req.session.user);
  var fb = new Firebase(DB_BASE_URL + "/users");
  fb.child(user_id).once('value', function (snap) {
    var user = snap.val();
    if (!user) {
      // We dont know this user, show them the registration form.
      res.render("usercheck", {
        "title": DEF_TITLE + " > Create Profile",
        "username": user_id.split("@")[0]
      });
    } else {
      // They're cool, let them in.
      req.session.username = user.displayName;
      res.redirect("/tasks");
    }
  });
};


/*
 * POST userCreate
 */
exports.userCreate = function (req, res) {
  var user_id = escapeEmailAddress(req.session.user);
  var user_name = req.body.username.trim();
  var fb = new Firebase(DB_BASE_URL + "/users");
  fb.child(user_id).update({
    "displayName": user_name,
    "email": req.session.user,
    "createdOnDate": Date.now(),
    "completed_tasks": [],
    "currentTaskClaimedDate": 0,
    "lastCompletedDate": 0,
    "lastLoginDate": Date.now()
  });
  req.session.username = user_name;
  res.redirect("/tasks");
};


/*
 * GET Persona Auth Magic
 */
exports.logout = function (req, res) {
  "use strict";

  req.session.destroy();
  res.redirect('/');
};


