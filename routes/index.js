#!/usr/bin/env node

/*
 * GET home page.
 */

var Firebase = require('firebase'),
    fs = require("fs"),
    path = require("path"),
    request = require('request'),
    url = require("url");

var dbBaseUrl = "https://onedone-dev.firebaseIO.com";

function getTasks(){

}

exports.index = function (req, res) {
  "use strict";
  var q = url.parse(req.url, true).query;
  var user = q.user || "";
  var task_id = q.task_id || "";

  //fetch all tasks
  var tasks = new Firebase(dbBaseUrl+'/tasks');
  tasks.once('value', function(dataSnapshot) {
    var taskData = dataSnapshot.val();

    // Take a task
    if (q.user && q.task_id){
      var users = new Firebase(dbBaseUrl+'/users');
      users.child(q.user).once('value', function(userData) {
        var newTotalTasks = userData.val().totalTasks+1;
        users.child(q.user).set({currentTask:q.task_id, totalTasks:newTotalTasks});

        res.render("index", {
          "title": "Mozilla One and Done",
          "tasks": taskData,
          "user": user,
          "task_id": task_id
        });
      });
    }else{
        // TODO: big hack due to async issue
        res.render("index", {
          "title": "Mozilla One and Done",
          "tasks": taskData,
          "user": user,
          "task_id": task_id
        });
    }

  });
};


exports.leaderboard = function (req, res) {
  "use strict";

};

