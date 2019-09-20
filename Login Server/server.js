"use strict"; //Prevent odd JS behavior.

/*
IMPORTANT: This will not use any object-orientated programming, however other pieces of code will.
*/

//IMPORTS
const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');
const querystring = require('querystring');


const contentTypes = { //Content types list.
  "html" : "text/html",
  "txt" : "text/plain",
  "png" : "image/png",
  "ico" : "image/x-icon",
  "js" : "application/javascript",
  "css" : "text/css",
  "gif" : "image/gif",
  "jpeg" : "image/jpeg",
  "svg" : "image/svg+xml"
};

const contentDirectory = "/static"; //Images js and stuff.

//Preload icon and index page.
const iconData = fs.readFileSync("./favicon.ico");
const indexPage = fs.readFileSync("./index.html");

function checkPathChars(uri){ //Regular expressions are a disgrace to society. This function is designed to stop any path traversal attacks on my server.
  var prevchrcode = undefined;
  for(var i in uri){
    var chrcode = uri.charCodeAt(i);

    if ((chrcode >= 45 && chrcode <= 90)||(chrcode >= 97 && chrcode <= 122)){ // "-./ABCDEGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" are allowed. Everything else is blocked.
      if ((chrcode === 46 && prevchrcode === 46) || (chrcode === 47 && prevchrcode === 47)){ //Prevent ".." and "//".
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

function getFileType(filename){ //Return the type to be used for the generateHeaders function.
  const extensions = Object.keys(contentTypes); //Get list of extensions

  for (var i in extensions){ //Index extensions
    if (filename.endsWith(extensions[i])){
      return extensions[i];
    }
  }

  return "txt"; //Default type
}

function error404(res){ //Generaic error 404 for when a page is not found.
  res.writeHead(404, generateHeaders("html"));
  res.end("404: Page not found!");
}

function error401(res){ //Used when a path cannot be trusted and no attempt will be made to find it.
  res.writeHead(401, generateHeaders("html"));
  res.end("401: The path was invalid or you do not have access!");
}

function error500(res){ //Used when something went wrong.
  res.writeHead(500, generateHeaders("html"));
  res.end("500: Internal server error.");
}

function getPostData(req){ //Gets fields from a POST request.
  return new Promise(function(resolve, reject) {
    var buffer = ""; //Create a buffer
    req.on('data',(d) => { //Data recieved.
      if (buffer.length + d.length > 4096){ //Max length so that someone doesnt try to DoS me by sending large amounts of data.
        buffer += d.substr(0,4096-d.length); //LIMIT TO 4096 CHARS
        let parsed = querystring.parse(buffer);
        resolve(parsed);
      } else {
        buffer += d; //Append data to buffer
      }
    });

    req.on('end', () => { //Request close
      let parsed = querystring.parse(buffer);
      resolve(parsed);
    });

    req.on('error', (e) => { //Something went wrong. This shouldn't usually happen.
      reject(e);
    });
  });
}

function apiCall(method, req, res){

  if (req.method == "POST"){ //Post methods
    getPostData(req).then((params) => {
      if (method == "create-account"){
        //TODO make a create account feature
      } else {
        apiErrorDoesntExist();
      }
    }).catch((e) => {
      apiErrorInternal(res);
    });
  } else {
    apiErrorDoesntExist();
  }

  if (method == "create-account" && req.method == "POST"){ // /api/createAccount -- Create an account on my website



    res.writeHead(200);
    res.end();
  } else {
    apiErrorDoesntExist(res);
  }
}

function apiErrorDoesntExist(res){ //Error 404 in JSON format.
  res.writeHead(404);
  res.end(JSON.stringify({
    error: true,
    errorCode :404,
    errorMsg: "This api call does not exist or you are using the wrong method!"
  }));
}

function apiErrorInternal(res){
  res.writeHead(500);
  res.end(JSON.stringify({
    error: true,
    errorCode: 500,
    errorMsg: "An internal server error occurred."
  }));
}

https.createServer({
  cert: fs.readFileSync("./.secret/cert.crt"),
  key: fs.readFileSync("./.secret/key.key")
},(req,res) => {

  var urlstate = checkPathSafe(req.url);

  if (urlstate.status == "safe"){ //Check path state
    var path = urlstate.uri.toLowerCase(); //Path which will be always lowercase;

    if (path === "/favicon.ico"){ //Website icon.
      res.writeHead(200, generateHeaders("ico"));
      res.end(iconData);
    } else if (path === "/"){ //Index page.
      res.writeHead(200);
      res.end(indexPage);
    } else if (path.startsWith("/static/")){ //Static content directory: Just "/static" without the "/"" after is not accepted.
      var customPath = path.substr(8); //The length of "/static/" is 8 characters long.

      var readStream = fs.createReadStream(__dirname + "/static/" + customPath);
      var headersSent = false; //Whether the headers have been sent or not.

      readStream.on('error', (err)=>{ //File not found.
        if (!headersSent){ //Only do an error 404 if there is no data sent yet.
          error404(res);
        } else {
          res.end(); //Terminate the connection if there is a read error midway through the operation.
        }
      });



      readStream.on('data', (dat) => { //File is found
        if (!headersSent){
          res.writeHead(200, generateHeaders(getFileType("customPath"))); //Write the headers and the content type of the file to be sent.
          headersSent = true;
        }

        res.write(dat);
      });

      readStream.on('close',() => { //Ends the response when all of the file has been read or the connection has eneded.
        res.end();
      });

    } else if(path.startsWith("/api/")){ //Api (Ccalls must never end with a /)
      var customPath = path.substr(5); //Remove the "/api/" from the path.
      apiCall(customPath, req, res);
    } else { //Page not found
      error404(res);
    }


  } else if (urlstate.status == "nopath"){ //Invalid uri
    error404(res);
  } else if (urlstate.status == "unsafe"){ //Disallowed characters
    error401(res);
  } else { //Default case. This could should never be called but is there to prevent the server from hanging or crashing.
    error404(res);
  }



}).listen(443); //Run the server on the default https port 443.


http.createServer((req,res)=>{ //Port 80 redirect from HTTP to HTTPS.
        res.writeHead(301, {"Location":"https://"+req.headers["host"]+req.url}); //HTTPS Redirect
        res.end();
}).listen(80);
