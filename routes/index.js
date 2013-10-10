#!/usr/bin/env node

/*
 * GET home page.
 */

var fs = require("fs"),
    path = require("path");

exports.index = function (req, res) {
  "use strict";

  var tasksJSON = fs.readFileSync(path.join("data", "tasks.json"));
  res.render("index", {
    "title": "Mozilla One and Done",
    "tasks": JSON.parse(tasksJSON)
  });
};
