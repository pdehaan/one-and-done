 var Firebase = require('firebase'),
  url = require("url");
 var DB_BASE_URL = process.env.DB_BASE_URL || "https://oneanddone.firebaseIO.com";

/*
  * GET Persona Auth Magic
  */
 
 exports.auth = function (req, res) {
   "use strict";
   var auth = { token: req.body._authToken,
                id:    req.body._id,
                email: req.body._email,
                md5_hash: req.body._md5_hash
   };
   if (auth.token && auth.id &&
         auth.email && auth.md5_hash) {
     console.log("setting req.session.user / auth");
     req.session.auth = auth;
     req.session.user = auth.email;
   }
   var path = url.parse(req.headers['referer']).pathname;
   res.redirect(path);
 };

 exports.logout = function (req, res) {
   "use strict";
   var fb = new Firebase(DB_BASE_URL);
   fb.unauth();
   req.session.destroy();
   res.redirect('/');
 };
