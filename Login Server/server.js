"use strict"; //Prevent odd JS behavior.

const https = require('https');
const fs = require('fs');
const url = require('url');
const path = require('path');


/* =================
DOESNT WORK NEED TO FIX
==================*/

function evaluatePath(input){ //Turn a url into a useable path
  if (input == ""){
    return "/";
  } else {
    var pathname =  url.parse(input).pathname;
    if (pathname == ""){
      return "/";
    } else {
      return path.posix.normalize(pathname); //Removes any relative paths.
    }
  }
}

function error404(res){
  res.writeHead(404);
  res.end("404: Page not found!");
}


https.createServer({
  cert: fs.readFileSync("./.secret/MyCertificate.crt"),
  key: fs.readFileSync("./.secret/MyKey.key")
},(req,res) => {
  var ep = evaluatePath(req.url);

  res.writeHead(200);
  res.end(ep);

}).listen(443);
