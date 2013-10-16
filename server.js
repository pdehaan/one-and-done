#!/usr/bin/env node

/**
 * Module dependencies.
 */

var http = require('http');
var path = require('path');

var express = require('express');
var routes = require('./routes');

var PORT = process.env.PORT || 3000;
var AUDIENCE = 'http://localhost:' + PORT;

var app = express();
// all environments
app.set('port', PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({'secret': 'What Does the Fox Say'}));
// app.use(express.csrf());
app.use(function(req, res, next) {
    if ( req.session.user ) {
        res.locals.user = req.session.user;
    }
    next();
});
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/tasks', routes.tasks);
app.get('/leaderboard', routes.leaderboard);
app.get('/logout', routes.logout);
app.post('/auth', routes.auth(AUDIENCE));

http.createServer(app).listen(app.get('port'), function () {
  "use strict";

  console.log('Express server listening on port %d', app.get('port'));
});
