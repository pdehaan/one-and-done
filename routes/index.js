#!/usr/bin/env node

/*
 * GET home page.
 */

var fs = require("fs"),
    path = require("path"),
    request = require('request');


exports.index = function (req, res) {
  "use strict";

  var tasksJSON = "";
  request('https://onedone-dev.firebaseIO.com/.json', function (error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log(body);
      res.render("index", {
        "title": "Mozilla One and Done",
        "tasks": JSON.parse(body)
      });
    }
  });
};
