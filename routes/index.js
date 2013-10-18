#!/usr/bin/env node

var Firebase = require('firebase'),
    url = require("url"),
    verify = require('browserid-verify')({type : 'remote'});

var DB_BASE_URL = process.env.DB_BASE_URL || "https://oneanddone.firebaseIO.com";
var DEF_TITLE = "Mozilla One and Done";


function getLeaderboard(cb) {
  "use strict";

  var fb = new Firebase(DB_BASE_URL);
  fb.child('users').once('value', function (snap) {
    var usersList = snap.val();

    console.log(JSON.stringify(usersList, null, 2));
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
      "users": usersList
    });
  });
};

/*
 * GET Tasks page
 */

exports.tasks = function (req, res) {
  "use strict";

  //fetch all tasks
  var fb = new Firebase(DB_BASE_URL);
  fb.child('tasks').once('value', function (snap) {
    res.render("tasks", {
      "title": DEF_TITLE + " > Tasks",
      "tasks": snap.val()
    });
  });
};

/*
 * GET Assign task to user
 */

exports.take = function (req, res) {
  "use strict";

  console.log("Are you %s?", req.session.user);


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
      var newTotalTasks = (snap.val().numTasksCompleted || 0) + 1;
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
      "users": usersList
    });
  });
};

/*
 * GET Persona Auth Magic
 */

exports.auth = function (audience) {
  "use strict";

  return function (req, res) {
    console.info('verifying with persona');

    var assertion = req.body.assertion;

    verify(assertion, audience, function (err, email, data) {
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

exports.userCheck = function (req, res) {
  console.log("gotcha! Your username is %s", req.session.user);
  res.redirect("/");
};


/*
 * GET Persona Auth Magic
 */

exports.logout = function (req, res) {
  "use strict";

  req.session.destroy();
  res.redirect('/');
};


