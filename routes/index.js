#!/usr/bin/env node

var Firebase = require('firebase'),
    url = require("url");

var dbBaseUrl = "https://onedone-dev.firebaseIO.com";

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
  var user = q.user || "";
  var task_id = Number(q.task_id) || 0;

  //fetch all tasks
  var tasks = new Firebase(dbBaseUrl + '/tasks');
  tasks.once('value', function (snap) {
    var taskData = snap.val();

    // Take a task
    if (user && task_id) {
      var users = new Firebase(dbBaseUrl + '/users');
      users.child(user).once('value', function (snap) {
        var userData = snap.val();
        if (userData === null) {
          // Add new user with data
          users.child(user).update({"currentTask": task_id,
                                    "totalTasks": 1});
        } else {
          // returning user
          var newTotalTasks = userData.totalTasks + 1;
          users.child(user).set({"currentTask": task_id,
                                 "totalTasks": newTotalTasks});
        }

        var task = getTaskById(task_id, taskData);
        renderIndex(res, {"tasks": taskData,
                          "user": user,
                          "task_id": task_id,
                          "task_title": task.title});
      });
    } else {
      // TODO: big hack due to async issue
      renderIndex(res, {
        "tasks": taskData,
        "user": user,
        "task_id": task_id
      });
    }
  });
};


exports.leaderboard = function (req, res) {
  "use strict";

  var users = new Firebase(dbBaseUrl + '/users');
  users.once('value', function (snap) {
    var usersList = snap.val();
    console.log(usersList);
    res.render("leaderboard", {
      "users": usersList
    });
  });
};

