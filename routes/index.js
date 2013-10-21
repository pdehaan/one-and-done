#!/usr/bin/env node

var Firebase = require('firebase'),
    url = require("url");
 
var DB_BASE_URL = process.env.DB_BASE_URL || "https://oneanddone.firebaseIO.com";
var fb = new Firebase(DB_BASE_URL);

function renderIndex(res, params) {
  "use strict";

  params.title = "Mozilla One and Done";
  res.render("tasks", params);
}

/*
 * GET home page.
 */

exports.index = function (req, res) {
  res.render("index", {"title": "Mozilla One and Done",
                       "db_base_url": DB_BASE_URL});
};

/*
 * GET Tasks page
 */

exports.tasks = function (req, res) {
  "use strict";

  //fetch all tasks
  var fb = new Firebase(DB_BASE_URL);
  fb.child('tasks').once('value', function (snap) {
        renderIndex(res, {"tasks": snap.val()});
      });
};

/*
 * GET Assign task to user
 */

exports.take = function (req, res) {
  "use strict";

  var q = url.parse(req.url, true).query;
  var user_id = q.user_id || "";
  var task_id = parseInt(q.task_id, 10) || 0;
  var fb = new Firebase(DB_BASE_URL);

  // User takes task, update db
  if (user_id && task_id) {
    var epoch = parseInt(new Date().getTime() / 1000, 10);
    console.log('epoch: ' + epoch);
    console.log('epoch2: %d', Date.now() / 1000);
    // Add new user with data
    fb.child("users/" + user_id).once('value', function (snap) {
      var newTotalTasks = snap.val().numTasksCompleted + 1;
      fb.child("users/" + user_id).update({
        "user_id": user_id,
        "currentTaskId": task_id,
        "currentTaskComplete": 0,
        "currentTaskClaimedDate": epoch,
        "lastCompletedDate": epoch,
        "numTasksCompleted": newTotalTasks
      });
      res.redirect('/tasks');
    });
  }
};

/*
 * GET Leaderboard
 */

exports.leaderboard = function (req, res) {
  "use strict";

  var fb = new Firebase(DB_BASE_URL);
  fb.child('users').once('value', function (snap) {
    var usersList = snap.val();
    console.log(usersList);
    res.render("leaderboard", {"users": usersList });
  });
};

/*
 * GET Persona Auth Magic
 */

exports.auth = function (req, res) {
  "use strict";
  var auth = { token: req.body._authToken,
               id:    req.body._id, 
               email: req.body._email, 
               md5_hash: req.body._md5_hash
  };
  if (auth.token && auth.id &&
        auth.email && auth.md5_hash) {
    console.log("setting req.session.user / auth");
    req.session.auth = auth;
    req.session.user = auth.email;
  }
  res.redirect('/');
};

exports.logout = function (req, res) {
  var fb = new Firebase(DB_BASE_URL);
  fb.unauth();
  req.session.destroy();
  res.redirect('/');
};


