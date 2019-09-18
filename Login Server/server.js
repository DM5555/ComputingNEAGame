"use strict"; //Prevent odd JS behavior.

/*
IMPORTANT: This will not use any object-orientated programming, however other pieces of code will.
*/


const https = require('https');
const fs = require('fs');
const url = require('url');
const path = require('path');


const contentTypes = { //Content types list.
  "html" : "text/html",
  "txt" : "text/plain",
  "png" : "image/png",
  "ico" : "image/x-icon"
};

const contentDirectory = "/static"; //Images js and stuff.

//Preload icon and index page.
const iconData = fs.readFileSync("./favicon.ico");
const indexPage = fs.readFileSync("./index.html");

function checkPathChars(uri){ //Regular expressions are a disgrace to society. This function is designed to stop any path traversal attacks on my server.
  var prevchrcode = undefined;
  for(var i in uri){
    var chrcode = uri.charCodeAt(i);

    if ((chrcode >= 45 && chrcode <= 57)||(chrcode >= 97 && chrcode <= 122)){ // "-./ABCDEGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" are allowed. Everything else is blocked.
      if (chrcode === 46 && prevchrcode === 46){ //Prevent ".."
        return false;
      }
    } else {
      return false;
    }

    prevchrcode = chrcode;
  }

  return true;
}

function checkPathSafe(uri){ //Make sure passed path is safe, and return a useable path if so.


  if (uri === undefined || uri === null || uri == ""){ //No input or empty string
    return {
      status: "nopath"
    };
  }

  var pathname = url.parse(uri).pathname;

  if (pathname === undefined || pathname === null || pathname === ""){ //Safe
    return {
      status: "safe",
      uri: "/"
    };
  }


  if (checkPathChars(pathname)){ //alphanumerical , "." and "/" allowed but ".." is not.
    return {
      status: "safe",
      uri: pathname.startsWith("/")?pathname:pathname+"/" //Adds a forward slash if there isnt one.
    };
  } else {
    return {
      status: "unsafe"
    };
  }

}

function generateHeaders(type){ //Generate headers based on file type
  var headers = {
    "X-Frame-Options":"DENY",
  }

  var typeName = contentTypes[type];

  headers["Content-Type"] = typeName===undefined?"text/plain":typeName; //Default to plaintext

  return headers;
};

function error404(res){
  res.writeHead(404, generateHeaders("html"));
  res.end("404: Page not found!");
}

function error401(res){
  res.writeHead(401, generateHeaders("html"));
  res.end("401: The path was invalid or you do not have access!");
}

https.createServer({
  cert: fs.readFileSync("./.secret/MyCertificate.crt"),
  key: fs.readFileSync("./.secret/MyKey.key")
},(req,res) => {

  var urlstate = checkPathSafe(req.url);

  if (urlstate.status == "safe"){ //Check path state
    var path = urlstate.uri; //Path

    if (path === "/favicon.ico"){ //Website icon.
      res.writeHead(200, generateHeaders("ico"));
      res.end(iconData);
    } else if (path === "/"){ //Index page.
      res.writeHead(200);
      res.end(indexPage);
    } else if (path.startsWith("/static/")){ //Static content directory: Just "/static" without the "/"" after is not accepted.
      //TODO do static content directory.
      //TEMP 404
      error404(res);
    } else { //Page not found
      error404(res);
    }


  } else if (urlstate.status == "nopath"){ //Invalid uri
    error404(res);
  } else if (urlstate.status == "unsafe"){ //Disallowed characters
    error401(res);
  }



}).listen(443);
