#!/usr/bin/env node

module.exports = function (grunt) {
  "use strict";

  // Load all our grunt tasks from our package.json `devDependencies`.
  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    "pkg": grunt.file.readJSON("package.json"),
    "jshint": {
      "files": [
        "**/*.js",
        "**/*.json"
      ],
      "options": {
        "jshintrc": ".jshintrc"
      }
    }
  });

  grunt.registerTask("default", ["jshint"]);
};
