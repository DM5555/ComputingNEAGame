"use strict"; //Prevent odd JS behavior.
/* jshint esversion: 6 */
/* jshint node: true */

/*
IMPORTANT: This will not use any object-orientated programming, however other pieces of code will.
*/

//IMPORTS
const https = require('https'); //For main server.
const http = require('http'); //For redirecting to HTTPS>
const fs = require('fs'); //For accessing files.
const url = require('url'); //URL parsing.
const querystring = require('querystring'); //Processing queries for the API.
const mysql = require('mysql'); //For accessing the database.
const crypto = require('crypto'); //For generating salts and hashes.
const buffer = require('buffer'); //For procesing data (e.g: converting string into hex). This is pretty much a more advanced string class and a string can be converted to a buffer and vice-versa.
const zlib = require('zlib'); //For compression.
const stream = require('stream'); //For data streaming.
const {validateUsername, validatePassword, validateCode} = require('./static/sharedscripts.js'); //Shared scripts.


const contentTypes = { //Content types list.
  "html" : "text/html",
  "txt" : "text/plain",
  "png" : "image/png",
  "ico" : "image/x-icon",
  "js" : "application/javascript",
  "css" : "text/css",
  "gif" : "image/gif",
  "jpeg" : "image/jpeg",
  "jpg" : "image/jpeg",
  "svg" : "image/svg+xml",
  "pem" : "application/x-pem-file"
};

var dbconnection; //Make the database connection variable global


//Preload icon and index page.
const iconData = fs.readFileSync("./favicon.ico");
const iconDataCompressed = zlib.gzipSync(iconData); //Compressed version of icon.
const indexPage = fs.readFileSync("./index.html");
const indexPageCompressed = zlib.gzipSync(indexPage); //Compressed index page.

//Preload token keys.
const prvKeyFile = fs.readFileSync("./.secret/token_private.pem"); //Private key file.
const pubKeyFile = fs.readFileSync("./.secret/token_public.pem"); //Public key file.

//Private key password.
const prvKeyPassword = fs.readFileSync("./.secret/token_password");


//Create private key object from file string.
const pviateKey = crypto.createPrivateKey({
  format: "pem",
  key: prvKeyFile,
  passphrase: prvKeyPassword
});

//Get the lst modified time of the static directory.
const staticModifyDates = getFilesLastModified(__dirname + "/static");

function checkPathChars(uri){ //Regular expressions are a disgrace to society. This function is designed to stop any path traversal attacks on my server.
  var prevchrcode;
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

function generateHeaders(type, cacheTime, compressed){ //Generate headers based on file type and how long to cache the file.
  var headers = {
    "X-Frame-Options":"DENY"
  };

  if (type !== ""){ //No type
    var typeName = contentTypes[type];
    headers["Content-Type"] = typeName===undefined?"text/plain":typeName; //Default to plaintext
  }

  if(compressed){ //If there is compression enabled.
    headers["Content-Encoding"] = "gzip"; //Gzip only.
  }

  headers["Cache-Control"] = cacheTime!==-1?"public, max-age="+cacheTime:"no-store"; //Wheteher or not to cache the file.

  if (cacheTime !== -1){ //Set expiry time for cache.
    headers.Expires = new Date(Date.now()+cacheTime*1000).toGMTString(); //Adds time in milliseconds to current date.
  }

  return headers;
}

//************
//RETURNS A DATE OBJECT PER FILE, NOT A TIME IN SECONDS;
//************
function getFilesLastModified(dir){ //Recursively finds files in a directory and returns their last modified time.
  var folderQueue = [].concat(dir); //Create a queue for folders to index with the dir parameter as the first folder.
  var files = {};
  while (folderQueue.length > 0){ //While there are folders to index. Process the folders inside this loop.
    let folderContents = fs.readdirSync(folderQueue[0]); //Index first folder.
    for (let i of folderContents){ //Index the folder contents.
      let filePath = folderQueue[0] + "/" + i; //Relative path of the file.
      let item = fs.statSync(filePath);
      if (item.isDirectory()){ //If the item is a folder.
        folderQueue.push(filePath); //Add the folder to the path.
      } else { //The item is a file.
        files[filePath] = item.mtime; //Add last modification time (as a date object).
      }
    }
    folderQueue.shift(0); //Remove first item from queue.
  }
  return files;
}


function shouldFileBeSent(headers, filepath){ //Cheks if he file has been last modified since the time specified. Returns true if the file needs resending.
  if (headers["if-modified-since"] !== undefined){ //Check if there is an if-modifed-since header.
    var lastModifiedDate;
    var lastModifed = headers["if-modified-since"]; //Set the value of the if-modified-since header to this.
    try { //Try catch for date.
      lastModifiedDate = new Date(lastModifed); //The date that it was last modified in the date object.

    } catch (e){ //If the date was note valid.
      return true;
    }

    //The date is valid.
    if (staticModifyDates[filepath] !== undefined){
      var fileDate = staticModifyDates[filepath]; //Get the modification date of the file.

      if (fileDate.getTime() >= lastModifiedDate.getTime()){ //Compare dates.
        return true; //File needs resending.
      } else {
        return false; //The file does not need resending.
      }
    } else {
      return true;
    }
  } else {
    return true;
  }
}

function supportsCompression(headers){ //Check if the browser supports gzip compression.
  if (headers["accept-encoding"] !== undefined){
    return headers["accept-encoding"].includes("gzip"); //Chcek if the accept encoding string contains gzip.
  } else {
    return false;
  }
}

function getFileType(filename){ //Return the type to be used for the generateHeaders function.
  const extensions = Object.keys(contentTypes); //Get list of extensions

  for (var ex of extensions){ //Index extensions
    if (filename.endsWith(".".concat(ex))){ //Extension matches.
      return ex;
    }
  }

  return "txt"; //Default type
}

function error404(res){ //Generaic error 404 for when a page is not found.
  res.writeHead(404, generateHeaders("html",-1,false));
  res.end("404: Page not found!");
}

function error401(res){ //Used when a path cannot be trusted and no attempt will be made to find it.
  res.writeHead(401, generateHeaders("html",-1,false));
  res.end("401: The path was invalid or you do not have access!");
}

function error500(res){ //Used when something went wrong.
  res.writeHead(500, generateHeaders("html",-1,false));
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

function randomSalt(){ //Creates a random string to be added to the password when hashed
  const randomBytes = crypto.randomBytes(32); //Generate 32 random bytes to be used as a salt.
  return buffer.from(randomBytes).toString("hex"); //Convert this into a 64 byte hex string.
}

function hashPassword(password, salt){ //Generates the password hash from the password and the salt.
  const hasher = crypto.createHash("sha256"); //Create a function to hash data (I will be using the SHA-256 algorithm.). Think of this as a meat grinder when you throw in the meat and then turn the machine on to process it.
  hasher.update(password.concat(salt)); //Put the password with the salt appended to it into the hasher. (Puts meat in the grinder.)
  return hasher.digest("hex"); //Grinds the meat in the metaphorical grinder. This will return a hex string.
}

function apiCall(method, req, res, dbconn){ //When an api call is made to the /api/ path.
  if (req.method == "POST"){ //Post methods
    getPostData(req).then((params) => {
      if (method == "create-account"){ //Account creation
        createAccount(params, res, dbconn);
      } else if (method == "login"){ //Logging in.
        apiErrorInternal(res); //REMOVE THIS.
      } else {
        apiErrorDoesntExist(res); //Methods is nonexistent.
      }
    }).catch((e) => {
      apiErrorInternal(res); //Something weird happened.
      throw e; //Throw the error.
    });
  } else {
    apiErrorDoesntExist(res); //Method nonexistent.
  }
}

function createAccount(params, res, dbconn){ //Creates an ccount in the database.
  if (params === undefined){ //Make sure the params are defined.
    apiErrorInvalidDetails(res); //No details passed.
  } else if (params.username === undefined || params.password === undefined || params.code === undefined){ //Validity Check #1
    apiErrorInvalidDetails(res); //Invalid details.
  } else if (!validateUsername(params.username) || !validatePassword(params.password) || !validateCode(params.code)){ //Something is wrong with the data entered.
    apiErrorInvalidDetails(res); //The username, password or code provided was invalid.
  } else if (!validateCodeDB(params.code,dbconn)){ //Check the code on the database.
    apiErrorInvalidCode(res); //Code is invalid.
  } else { //No error yet.
    
  }
}

function validateCodeDB(code,dbconn){ //Validate codes with the database.
  return new Promise((resolve,reject)=>{
    const query = "SELECT Code FROM Codes WHERE Code = ? AND Valid = TRUE;"; //Query.
    const insert = [code]; //Unsafe values in query.
    const sql = mysql.format(query,insert); //Prevent sql injection.

    dbconn.query(sql,(err,results,fields) => { //Call query to the database to check the code.
      if (err) {//SQL Related Error.
        reject(err);
      } else { //No sql error
        if (results.length > 0){
          resolve(true); //There were results meaning the code is valid.
        } else {
          resolve(false); //No results means there was no authorisation code.
        }
      }
    });
  });
}

function useCodeDB(code,dbconn){ //Invalidate code.
  return new Promise(function(resolve, reject){
    const query = "UPDATE Codes SET Valid=FALSE WHERE Code = ? AND Valid = TRUE;"; //Query
    const insert = [code];
    const sql = mysql.format(query,insert); //Formatted query.

    dbconn.query(sql, (err,results,fields)=>{ //Run the sql
      if (err){ //Error check.
        reject(err);
      } else { //No errors found.
        if (results.affectedRows > 0){
          resolve(true);
        } else {
          resolve(false);
        }
      }
    });
  });
}

function apiErrorDoesntExist(res){ //Error 404 in JSON format.
  res.writeHead(404);
  res.end(JSON.stringify({
    error: true,
    errorCode :404,
    errorMsg: "This api call does not exist or you are using the wrong method!"
  }));
}

function apiErrorInternal(res){ //Internal Server error in JSON format. This uses error 500.
  res.writeHead(500);
  res.end(JSON.stringify({
    error: true,
    errorCode: 500,
    errorMsg: "An internal server error occurred."
  }));
}

function apiErrorInvalidDetails(res){ //Invalid detauks! Error Code: 600
  res.writeHead(400);
  res.end(JSON.stringify({
    error: true,
    errorCode: 600,
    errorMsg: "Your details did not satisfy the requirement for making an account."
  }));
}

function apiErrorInvalidCode(res){ //Invalid code! Error Code: 601
  res.writeHead(400);
  res.end(JSON.stringify({
    error: true,
    errorCode: 601,
    errorMsg: "The code you entered is already used or never existed!"
  }));
}

function apiErrorInvalidPassword(res){ //Invalid login credidentials! Error Code: 602
  res.writeHead(400);
  res.end(JSON.stringify({
    error: true,
    errorCode: 602,
    errorMsg: "The username or password you have entered is incorrect."
  }));
}



const server = https.createServer({
  cert: fs.readFileSync("./.secret/cert.crt"), //Open the server certificate.
  key: fs.readFileSync("./.secret/key.key") //Open the server key.
},(req,res) => {
  var gzipEnabled = supportsCompression(req.headers); //If gzip is allowed.
  var urlstate = checkPathSafe(req.url);

  if (urlstate.status == "safe"){ //Check path state
    var path = urlstate.uri.toLowerCase(); //Path which will be always lowercase;

    if (path === "/favicon.ico"){ //Website icon.
      res.writeHead(200, generateHeaders("ico",3600, gzipEnabled));
      if (gzipEnabled){
        res.end(iconDataCompressed); //Compressed icon.
      } else {
        res.end(iconData); //Regular icon.
      }
    } else if(path==="/tokenkey.pem"){ //Token public key
      res.writeHead(200, generateHeaders("pem"), -1, gzipEnabled);
      res.end(pubKeyFile);
    } else if (path === "/"){ //Index page.
      res.writeHead(200 , generateHeaders("html", -1, gzipEnabled));
      if (gzipEnabled){ //Whether to send the compressed version or not.
        res.end(indexPageCompressed);
      } else {
        res.end(indexPage);
      }
    } else if (path.startsWith("/static/")){ //Static content directory: Just "/static" without the "/"" after is not accepted.
      let customPath = path.substr(8); //The length of "/static/" is 8 characters long.
      if (shouldFileBeSent(req.headers, __dirname + "/static/" + customPath)){ //Check if the file should actually be sent as the user may have cached it.
        if (fs.existsSync(__dirname + "/static/" + customPath)){ //Check if the file exists.
          res.writeHead(200,generateHeaders(getFileType(customPath),86400,gzipEnabled)); //Send the headers with an exipiry time of 1 day.
          var readStream = fs.createReadStream(__dirname + "/static/" + customPath); //Open the file.
          var outputStream; //Define the output stream.
          if (gzipEnabled){ //For compression
            outputStream = zlib.createGzip(); //Create a gzip compressor.
            outputStream.pipe(res); //Pipe the compressed data into the response.

            outputStream.on('error',() => { //Error handling.
              error500(res);
            });
          } else {
            outputStream = res; //Default the output stream to the response;
          }

          readStream.pipe(outputStream); //Pipe the read stream into the output stream.

          readStream.on('error', (err)=>{ //File not found.
            error500(res); //Internal server error.
          });
        } else { //File not found.
          error404(res);
        }
      } else {
        res.writeHead(304,generateHeaders("",-1,false)); //Respond with 304 file is already there.
        res.end();
      }

    } else if(path.startsWith("/api/")){ //Api (Ccalls must never end with a /)
      let customPath = path.substr(5); //Remove the "/api/" from the path.
      apiCall(customPath, req, res, dbconnection);
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
});


const httpserver = http.createServer((req,res)=>{ //Port 80 redirect from HTTP to HTTPS.
        res.writeHead(301, {"Location":"https://"+req.headers.host+req.url}); //HTTPS Redirect
        res.end(); //Close connection.
});

dbconnection = mysql.createConnection({ //Create a sql database connection;
  host: "localhost", //Login to localhost server.
  user: "login_server", //Username is login_server.
  password: fs.readFileSync("./.secret/db_password"), //Password is read from the db_password file in the secret folder.
  database: "domsgame" //Select 'domsgame' database.
});

dbconnection.connect((err) => { //Attempt the connection to the server
  if(err){ //Error thrown if connection is failed.
    throw err;
  }
  //Reaches here if the connection is scucessful.
  console.log("Database connection successful!");
  //Start the webservers now that the database can be accessed.
  httpserver.listen(80); //Listens on port 80 to redirect incoming insecure HTTP traffic.
  server.listen(443); //Run the server on the default https port 443.
});
