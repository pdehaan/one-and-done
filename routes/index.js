#!/usr/bin/env node

/*
 * GET home page.
 */

var Firebase = require('firebase'),
    fs = require("fs"),
    path = require("path"),
    url = require("url");

var dbBaseUrl = "https://onedone-dev.firebaseIO.com";

function renderIndex(res, params) {
  params.title = "Mozilla One and Done";
  res.render("index", params);
}

function getTaskById(id, data){
  //loop over taskData for the title
  for (var key in data) {
    for (var prop in data[key]) {
      if (prop == "id" && data[key][prop] == id){
        return data[key];
      }
    }
  }
}

exports.index = function (req, res) {
  "use strict";
  var q = url.parse(req.url, true).query;
  var user = q.user || "";
  var task_id = q.task_id || "";

  //fetch all tasks
  var tasks = new Firebase(dbBaseUrl+'/tasks');
  tasks.once('value', function(snap) {
    var taskData = snap.val();

    // Take a task
    if (user && task_id){
      var users = new Firebase(dbBaseUrl+'/users');
      users.child(user).once('value', function(snap) {
        var userData = snap.val();
        if (userData === null){
          // Add new user with data
          users.child(user).update({currentTask:task_id, 
                                    totalTasks:1});
        }else{
          // returning user
          var newTotalTasks = userData.totalTasks+1;
          users.child(user).set({currentTask:task_id, 
                                             totalTasks:newTotalTasks});
        }

        var task = getTaskById(task_id, taskData);

        renderIndex(res, {"tasks":taskData, 
                          "user":user, 
                          "task_id":task_id,
                          "task_title":task.title});
      });
    }else{
        // TODO: big hack due to async issue
        renderIndex(res, {"tasks":taskData, "user":user, "task_id":task_id});
    }

  });
};


exports.leaderboard = function (req, res) {
  "use strict";
  var users = new Firebase(dbBaseUrl+'/users');
  users.once('value', function(snap) {
    var usersList = snap.val();
    console.log(usersList);
    res.render("leaderboard", 
              {"users":usersList});
  });
};

