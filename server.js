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
const app = express();

//create http server
var httpPort = normalizePort(8080);

// Express config;
app.get('/access', (req, res) => {
    res.send('hello test');
});
//app.use('/', express.static(path.join(__dirname, 'public')));
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
app.post('/access', (req, res) => {
	console.log('test');
	console.log(req.body);

    	let access = (req.body.code || '').trim();
    	if (access.length === 12) {
    		res.status(200).json({ success: true });
	} else {
		res.status(300).json({ success: false });
	}
});

const httpServer = http.createServer(app);

//listen on provided ports
httpServer.listen(httpPort);

//add error handler
httpServer.on("error", onError);

//start listening on port
httpServer.on("listening", onListening);

// listen for TERM signal .e.g. kill 
process.on ('SIGTERM', gracefulShutdown);

// listen for INT signal e.g. Ctrl-C
process.on ('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log("Received kill signal, shutting down gracefully.");
  httpServer.close(function() {
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
