"use strict";

//module dependencies
const debug = require("debug")("express:server");
const http = require("http");
const bodyParser = require("body-parser");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const errorHandler = require("errorhandler");
const methodOverride = require("method-override");
const logger = require("morgan");
const path = require("path");
const express = require("express");
// const jsonfile = require('jsonfile');
const basicAuth = require('express-basic-auth');
const Engine = require('tingodb')();
const _ = require('lodash');

const app = express();
const httpServer = http.createServer(app);
const io = require('socket.io')(httpServer);

const db = new Engine.Db('./data', {});

// let queueRunning = false;
// var file = 'data.json'
// var codes = undefined;

// jsonfile.readFile(file, function(err, obj) {
//   if (err) {
//     throw new Error(err.message);
//   }

//   codes = obj;

//     const collection = db.collection('tokens');
//     // Insert some documents
//     collection.insert(_.map(obj, (o) => {
//       return { token: o, forName: '', used: false, created: new Date(), createdBy: 'server-init', updated: new Date()};
//     }), {}, function(err, result) {
//       // assert.equal(err, null);
//       // assert.equal(3, result.result.n);
//       // assert.equal(3, result.ops.length);
//       console.log("Inserted 3 documents into the collection");
//       console.log(err);
//       console.log(result);
//     });
// });


//create http server
var httpPort = normalizePort(8080);

// Express config;
app.get('/access', (req, res) => {
  res.send('hello test');
});
app.use('/', express.static(path.join(__dirname, 'public')));
const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
};
app.use(allowCrossDomain);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(compression());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser('WEBSITE_SECRET'));
app.use(methodOverride());
app.use((err, req, res, next) => {
  err.status = 404;
  next(err);
})
app.use(errorHandler());
app.get('/admin', basicAuth({
  users: { 'justin': 'id384478', 'latrujano': 'Fackdis**10' },
  challenge: true,
  realm: 'MspCompanionChallenge',
}), (req, res) => {
  console.log(req.body);
  console.log(req.auth);
  res.status(200).sendFile(path.join(__dirname, 'public', 'token.html'));
});
app.post('/admin', basicAuth({
  users: { 'justin': 'id384478', 'latrujano': 'Fackdis**10' },
  challenge: true,
  realm: 'MspCompanionChallenge',
}), (req, res) => {
  const date = new Date()
  if (req.body['_id'] === '') {
    db.collection("tokens").findOne({ token: req.body['token'] }, function(err, result) {
      if (err || result !== null) {
        res.status(200).sendFile(path.join(__dirname, 'public', 'token.html'));
        return;
      }

      if (result === null) {
        db.collection('tokens').insert(
          { 
            token: req.body['token'], 
            forName: req.body['name'], 
            used: req.body['used'] == 'true', 
            created: date, 
            createdBy: req.auth['user'], 
            updated: date
          }
        );
        res.status(200).sendFile(path.join(__dirname, 'public', 'token.html'));
      }
    });
  } else {
    //       return { token: o, forName: '', used: false, created: new Date(), createdBy: 'server-init', updated: new Date()};
    db.collection('tokens').findAndModify(
      { _id: req.body['_id'] }, // query
      [['_id', 'asc']],  // sort order
      { $set: 
        { 
          token: req.body['token'], 
          forName: req.body['name'],
          used: req.body['used'] == 'true',
          updated: date
        } 
      }, // replacement, replaces only the field "hi"
      {}, // options
      function (err, object) {
        res.status(200).sendFile(path.join(__dirname, 'public', 'token.html'));
      }
    );
  }

});
app.get('/tokens', basicAuth({
  users: { 'justin': 'id384478', 'latrujano': 'Fackdis**10' },
  challenge: true,
  realm: 'MspCompanionChallenge',
}), (req, res) => {
  db.collection('tokens').find().toArray((err, docs) => {
    res.status(200).json(docs);
  });
});
io.on('connection', function (client) {
  console.log('Client connected...');

  client.on('join', function (data) {
    console.log(data);
  });

  // client.on('messages', function (data) {
  //   client.emit('broad', data);
  //   client.broadcast.emit('broad', data);
  // });

});

app.post('/access', (req, res) => {
  if (req.body.token === undefined || req.body.token !== '71c463c3d908fd07c14f784f622ea8b6') {
    res.status(300).json({ success: false, reason: 'All calls require an api key!' });
    return;
  }

  let access = (req.body.code || '').trim();
  let index;
  if (access !== '_MASTER_TOKEN_') {
    db.collection('tokens').findAndModify(
      { token: access, used: false }, // query
      [['_id', 'asc']],  // sort order
      { $set: { used: true, usedDate: new Date() } }, // replacement, replaces only the field "hi"
      {}, // options
      function (err, object) {
        if (err || object === undefined) {
          res.status(300).json({ success: false, reason: 'either token has been used or doesn\'t exist' });
        } else {
          res.status(200).json({ success: true });
        }
      }
    );
  } else {
    res.status(200).json({ success: true });
  }
});


//listen on provided ports
httpServer.listen(httpPort);

//add error handler
httpServer.on("error", onError);

//start listening on port
httpServer.on("listening", onListening);

// listen for TERM signal .e.g. kill 
process.on('SIGTERM', gracefulShutdown);

// listen for INT signal e.g. Ctrl-C
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log("Received kill signal, shutting down gracefully.");
  httpServer.close(function () {
    console.log("Closed out remaining connections.");
    process.exit()
  });
}


/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (val !== null && val !== undefined && typeof val !== undefined) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof httpPort === "string"
    ? "Pipe " + httpPort
    : "Port " + httpPort;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  var addr = httpServer.address();
  var bind = typeof addr === "string"
    ? "pipe " + addr
    : "port " + addr.port;
  debug("Listening on " + bind);
}
