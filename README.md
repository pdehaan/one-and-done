Welcome to the Mozilla One and Done site.
=====

## Installation:
### Install Nodejs

```
git clone https://github.com/pdehaan/one-and-done/
cd one-and-done
npm install
```

### Create Firebase account:
```
import data_model.json
import rules.json under security
enable persona logins
```
Write down your database url, and export the ```DB_BASE_URL``` on the command line. 

Now set up environment variables and fire the server.
```
  export DB_BASE_URL = https://oneanddone.firebaseIO.com
  node server.js
```

## What this is: 

A proof of concept app to see what we can learn about nodejs

