#!/usr/bin/env node

var Firebase = require('firebase');
var DB_BASE_URL = process.env.DB_BASE_URL || "https://oneanddone.firebaseIO.com";

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
      "users": usersList
    });
  });
};

/*
 * GET Leaderboard
 */
exports.leaderboard = function (req, res) {
  "use strict";

  getLeaderboard(function (usersList) {
    res.render("leaderboard", {
      "users": usersList,
      "user_name": req.session.username || "Stranger"
    });
  });
};


/**
 * GET userCheck
 */
exports.userCheck = function (req, res) {
  "use strict";

  var user_id = req.session.auth.id;
  var fb = new Firebase(DB_BASE_URL + "/users");
  fb.child(user_id).once('value', function (snap) {
    var user = snap.val();
    if (!user) {
      // We dont know this user, show them the registration form.
      res.render("usercheck", {
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
  'use strict';

  var fb = new Firebase(DB_BASE_URL + "/users");
  var user_id = req.session.auth.id;
  var user_name = req.body.username.trim();
  var user = {
    "displayName": user_name,
    "email": req.session.auth.email,
    "createdOnDate": Date.now(),
    "completed_tasks": [],
    "currentTaskClaimedDate": 0,
    "lastCompletedDate": 0,
    "lastLoginDate": Date.now()
  };

  fb.child(user_id).update(user);
  req.session.user = user;
  res.redirect("/tasks");
};


exports.userEdit = function (req, res) {
  "use strict";

  var fb = new Firebase(DB_BASE_URL + "/users");
  var user_id = req.session.auth.id;

  fb.child(user_id).once('value', function (user) {
    res.render("userprofile", {"user": user.val()});
  });
};


exports.userUpdate = function (req, res) {
  "use srtict";

  var fb = new Firebase(DB_BASE_URL + "/users");
  var user_id = req.session.auth.id;
  var displayName = req.body.displayname.trim();
  var user = {"displayName": displayName};

  fb.child(user_id).update(user);
  req.session.user.displayName = user.displayName;
  res.redirect("/user/edit");
};
