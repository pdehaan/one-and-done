#!/usr/bin/env node

/**
 * Module dependencies.
 */

var http = require('http');
var path = require('path');

var express = require('express');
var routes = require('./routes');

var app = express();
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/tasks', routes.tasks);
app.get('/leaderboard', routes.leaderboard);

http.createServer(app).listen(app.get('port'), function () {
  "use strict";

  console.log('Express server listening on port %d', app.get('port'));
});
