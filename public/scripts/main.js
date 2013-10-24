/* globals Firebase:false, FirebaseSimpleLogin:false */
/* exported login */

function login(type, firebaseDB) {
  var mydoc = window.parent.document;
  var fb = new Firebase(firebaseDB);
  var auth = new FirebaseSimpleLogin(fb, function (error, user) {
    if (error) {
      console.log(error);
    } else if (user) {
      console.log("HERE in auth");
      var authToken = mydoc.getElementById("_authToken");
      authToken.value = user.firebaseAuthToken;
      var email = mydoc.getElementById("_email");
      email.value = user.email;
      var id  = mydoc.getElementById("_id");
      id.value = user.id;
      var md5_hash = mydoc.getElementById("_md5_hash");
      md5_hash.value = user.md5_hash;
      var login_form = mydoc.getElementById("login-form");
      login_form.submit();
    } else {
      console.log('No user object, and no error');
    }
  });
  auth.login('persona', {
    "rememberMe": true
  });
}

$("a#logout").click(function () {
});
