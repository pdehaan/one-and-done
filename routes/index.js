#!/usr/bin/env node

var Firebase = require('firebase'),
    url = require("url"),
    verify = require('browserid-verify')({ type : 'remote' });

var DB_BASE_URL = process.env.DB_BASE_URL || "https://onedone-dev.firebaseIO.com";

function renderIndex(res, params) {
  "use strict";

  params.title = "Mozilla One and Done";
  res.render("tasks", params);
}

function getTaskById(id, data) {
  "use strict";

  var key,
      prop;
  //loop over taskData for the title
  for (key in data) {
    for (prop in data[key]) {
      if (prop === "id" && data[key][prop] === id) {
        return data[key];
      }
    }
  }
}


exports.index = function (req, res) {
  res.render("index", {"title": "Mozilla One and Done"});
};

/*
 * GET home page.
 */
exports.tasks = function (req, res) {
  "use strict";

  var q = url.parse(req.url, true).query;
  var user_id = q.user_id || "";
  var task_id = parseInt(q.task_id, 10) || 0;

  //fetch all tasks
  var tasks = new Firebase(DB_BASE_URL + '/tasks');
  tasks.once('value', function (snap) {
    var taskData = snap.val();

    // Take a task
    if (user_id && task_id) {
      var users = new Firebase(DB_BASE_URL + '/users');
      users.child(user_id).once('value', function (snap) {
        var userData = snap.val();
        if (userData === null) {
          // Add new user with data
          users.child(user_id).update({
            "currentTask": task_id,
            "totalTasks": 1
          });
        } else {
          // returning user
          var newTotalTasks = userData.totalTasks + 1;
          users.child(user_id).set({
            "currentTask": task_id,
            "totalTasks": newTotalTasks
          });
        }

        var task = getTaskById(task_id, taskData);
        renderIndex(res, {
          "tasks": taskData,
          "user_id": user_id,
          "task_id": task_id,
          "task_title": task.title
        });
      });
    } else {
      // TODO: big hack due to async issue
      renderIndex(res, {
        "tasks": taskData,
        "user_id": user_id,
        "task_id": task_id
      });
    }
  });
};


exports.leaderboard = function (req, res) {
  "use strict";

  var users = new Firebase(DB_BASE_URL + '/users');
  users.once('value', function (snap) {
    var usersList = snap.val();
    console.log(usersList);
    res.render("leaderboard", {
      "users": usersList
    });
  });
};


exports.auth = function (audience) {
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
        return res.redirect('/');
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

exports.logout = function (req, res) {
  req.session.destroy();
  res.redirect('/');
};


