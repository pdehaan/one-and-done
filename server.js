#!/usr/bin/env node

/**
 * Module dependencies.
 */

var http = require('http');
var path = require('path');
var url = require('url');

var express = require('express');
var routes = require('./routes/index.js');
var auth = require('./routes/auth.js');
var task = require('./routes/tasks.js');

var PORT = process.env.PORT || 3000;
var HOST_URL = process.env.HOST_URL || "http://localhost";
// var AUDIENCE = HOST_URL + ':' + PORT;
var DB_BASE_URL = process.env.DB_BASE_URL || "https://oneanddone.firebaseIO.com";

var app = express();
// all environments
app.set('port', PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('db_base_url', DB_BASE_URL);

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({'secret': 'What Does the Fox Say'}));
// app.use(express.csrf());
app.use(function (req, res, next) {
  var path = url.parse(req.url).pathname;
  path = path.replace('/', ' > ');
  if (req.session.user) {
    res.locals.user = req.session.user;
  }
  res.locals.db_base_url = DB_BASE_URL;
  res.locals.title = "Mozilla One and Done" + path;
  next();
});
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if (app.get('env') === 'development') {
  console.log("Welcome, DEV!");
  app.locals.pretty = true;
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/tasks', task.tasks);
app.get('/task/take/:task_id', task.take);
app.get('/task/complete/:task_id', task.complete);
app.get('/task/cancel/:task_id', task.cancel);
app.get('/task/view/:task_id', task.view);
app.get('/leaderboard', routes.leaderboard);
app.get('/logout', auth.logout);
app.post('/auth', auth.auth);
app.get('/user/check', routes.userCheck);
app.post('/user/create', routes.userCreate);

http.createServer(app).listen(app.get('port'), '127.0.0.1', function () {
  "use strict";
  console.log('Express server listening on port %d', app.get('port'));
});
