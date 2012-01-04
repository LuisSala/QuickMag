var express = require('express');
var url = require('url');
var http = require('http');
var httpProxy = require('http-proxy');
var util = require('util');

var app = express.createServer();

/*
 * Simple preview server for AJAX apps. Includes a basic AJAX proxy.
 * This server will naively serve any files from the app's home directory (and its children).
 * 
 * DO NOT USE FOR PRODUCTION
*/


var APP_PORT = process.env.PORT || 3000;

console.log('\n========================================\n')
console.log('Development Preview Server\nDO NOT USE IN PRODUCTION!!!\n');
console.log('Listening on port ' + APP_PORT);
console.log('AJAX proxy bound to "/_proxy"');
console.log('     eg. http://localhost:3000/_proxy/http://example.com/a/b/c');
console.log('\n========================================\n');

app.use(express.logger());

app.use('/_proxy/', function(req, res, next){

	var target = req.url.substring("/".length, req.url.length);

	console.log("PROXY request received. Target: " + target);

  	// parse the url
  	var url_parts = url.parse(target);

    // Simple validation of well-formed URL
  	if(url_parts.host == undefined) {
  	    var err = "PROXY Error: Malformed target URL " + target;
  	    console.log('PROXY_PORT Error: '+err);
        res.statusCode=501;
    	res.write(err);
    	res.end();
  	} else {
          console.log("PROXY Request: " + url_parts.hostname + ", port: " + (url_parts.port ? url_parts.port : 80) + ", path: " + url_parts.path);

          // Create and configure the proxy.

          var proxy = new httpProxy.HttpProxy({
              target:{
                  host: url_parts.hostname,
                  port: url_parts.port ? url_parts.port : 80,
                  https: (url_parts.protocol === 'https:')
              }
          });

          //var proxy = new httpProxy.RoutingProxy();
          // Rewrite the URL on the request to remove the /proxy/ prefix.
          // Then pass along to the proxy.

          req.url = url_parts.path;
          req.headers['host']=url_parts.host;  // Reset the host header to the destination host.
          console.log(util.inspect(req.headers));
          proxy.proxyRequest(req, res);

	} // end if-else

});

// Serve static files from local directory
// TODO Add ability to recompile LESS CSS on each request.
app.use(express.static(__dirname));

app.listen(APP_PORT);