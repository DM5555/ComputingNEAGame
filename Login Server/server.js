"use strict"; //Prevent odd JS behavior.
/* jshint esversion: 8 */
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
const {validateUsername, validatePassword, validateCode, base64Encode, base64Decode, splitJWT} = require('./static/sharedscripts.js'); //Shared scripts.


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

var dbconnection; //Make the database connection variable global so that all methods can access it.
var olddbconnection; //For temporarily holding database connections before closing them.


//Preload icon, index page and game page.
const iconData = fs.readFileSync("./favicon.ico");
const iconDataCompressed = zlib.gzipSync(iconData); //Compressed version of icon.
const indexPage = fs.readFileSync("./index.html");
const indexPageCompressed = zlib.gzipSync(indexPage); //Compressed index page.
const gamePage = fs.readFileSync("../Game/game.html"); //Read Game from static dir.
const gamePageCompressed = zlib.gzipSync(gamePage);

//Preload token keys.
const prvKeyFile = fs.readFileSync("./.secret/token_private.pem"); //Private key file.
const pubKeyFile = fs.readFileSync("./.secret/token_public.pem"); //Public key file.

//Private key password.
const prvKeyPassword = fs.readFileSync("./.secret/token_password");


//Create private key object from file string.
const privateKey = crypto.createPrivateKey({
  format: "pem",
  key: prvKeyFile,
  passphrase: prvKeyPassword
});

//Create the public key object. No password needed.
const publicKey = crypto.createPublicKey({
  format: "pem",
  key: pubKeyFile
});

//IP BLACKLISTER FOR API ABUSE.
var apiAccessList = {};
const apiLimit = 20;

//Get the lst modified time of the static directory.
const staticModifyDates = getFilesLastModified(__dirname + "/static");

function checkPathChars(uri){ //Regular expressions are a disgrace to society. This function is designed to stop any path traversal attacks on my server.
  var prevchrcode;
  for(var i in uri){
    var chrcode = uri.charCodeAt(i);

    if ((chrcode >= 45 && chrcode <= 90)||(chrcode >= 97 && chrcode <= 122)||(chrcode == 95)){ // "-./ABCDEGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_" are allowed. Everything else is blocked.
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
  if (typeof uri === "undefined" || uri === null || uri == ""){ //No input or empty string
    return {
      status: "nopath"
    };
  }

  var pathname = url.parse(uri).pathname;

  if (typeof pathname === "undefined" || pathname === null || pathname === ""){ //Safe
    return {
      status: "safe",
      uri: "/"
    };
  }

  if (uri.length > 128){ //Length limitation
    return {
      status: "toolong"
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
    headers["Content-Type"] = (typeof typeName==="undefined")?"text/plain":typeName; //Default to plaintext
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
  if (typeof headers["if-modified-since"] !== "undefined"){ //Check if there is an if-modifed-since header.
    var lastModifiedDate;
    var lastModifed = headers["if-modified-since"]; //Set the value of the if-modified-since header to this.
    try { //Try catch for date.
      lastModifiedDate = new Date(lastModifed); //The date that it was last modified in the date object.

    } catch (e){ //If the date was note valid.
      return true;
    }

    //The date is valid.
    if (typeof staticModifyDates[filepath] !== "undefined"){
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
  if (typeof headers["accept-encoding"] !== "undefined"){
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

function error414(res){ //Input to long.
  res.writeHead(414, generateHeaders("html",-1,false));
  res.end("414: The URI is too long.");
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
  return Buffer.from(randomBytes).toString("hex"); //Convert this into a 64 byte hex string.
}

function hashPassword(password, salt){ //Generates the password hash from the password and the salt.
  const hasher = crypto.createHash("sha256"); //Create a function to hash data (I will be using the SHA-256 algorithm.). Think of this as a meat grinder when you throw in the meat and then turn the machine on to process it.
  hasher.update(password.concat(salt)); //Put the password with the salt appended to it into the hasher. (Puts meat in the grinder.)
  return hasher.digest("hex"); //Grinds the meat in the metaphorical grinder. This will return a hex string.
}



function generateJWT(uuid,username,isAdmin){ //Generate a json web token for user authentication. This contains the username, userid and expiry time as well as jwt encoding info.
  var header = { //JWT header.
    alg: "RS256",
    typ: "JWT"
  };

  var payload = { //JWT payload.
    uuid: uuid,
    username: username,
    expiresMs: Date.now() + 86400000 //One day.
  };

  if (isAdmin){ //For admins.
    payload.isAdmin = true;
  }

  var mainCombo = base64Encode(JSON.stringify(header)) + "." + base64Encode(JSON.stringify(payload)); //Convert header and payload to base64.
  var signer = crypto.createSign("RSA-SHA256"); //Create signer using RSA-SHA256.
  signer.update(mainCombo); //Update signer with the data.
  var signature = signer.sign(privateKey);//Sign the data.
  var signatureB64 = base64Encode(signature); //Base64 encode the signature.

  return mainCombo + "." + signatureB64; //Combain the main part and the signature.
}

function verifyJWT(token){ //Verify the json web token.
  let jwt = splitJWT(token);
  if (jwt === false){ //Invalid token.
    return false;
  } else {
    let verify = crypto.createVerify("RSA-SHA256");//Create verify.
    verify.update(jwt.mainTokenData); //Insert main token data.
    let signature;
    try {
      signature = base64Decode(jwt.signature,true);
    } catch (e){
      return false;
    }
    if (verify.verify(publicKey, signature) && typeof jwt.payload.expiresMs === "number" && jwt.payload.expiresMs>Date.now()){ //Verify the signature, date and return the result.
      return true;
    } else {
      return false; //The signature is invalid.
    }
  }
}

function signTest(){ //TESTING PURPOSES ONLY
  let testString = "Hello world"; //Test string
  let sign = crypto.createSign("RSA-SHA256"); //Signer
  let verify = crypto.createVerify("RSA-SHA256"); //Verifier
  sign.update(testString); //Input test string.
  let signature = sign.sign(privateKey); //Sign test string.
  verify.update(testString); //Input test string.
  let verified = verify.verify(publicKey,signature);
  console.log("Verified: " + verified);
}

function getJWTFromHeader(req){ //Will return an empty string if there is no JWT. Does not check or verify it.
  if (typeof req.headers.authorization !== "string"){ //Non string header.
    return "";
  } else if(req.headers.authorization.length < 6){ //Header too short.
    return "";
  } else { //Token found.
    return req.headers.authorization.slice(6);
  }
}

function apiCall(method, req, res, dbconn){ //When an api call is made to the /api/ path
  var ipAddress = req.connection.remoteAddress;
  if (typeof apiAccessList[ipAddress] === "undefined"){ //IP is not recorded.
    apiAccessList[ipAddress] = 0; //Log IP temporarily.
  }

  if (apiAccessList[ipAddress] < apiLimit){ //User is under limit.
    if (req.method == "POST"){ //Post methods
      getPostData(req).then((params) => {
        if (method == "create-account"){ //Account creation
          createAccount(params, res, ipAddress, dbconn);
        } else if (method == "login"){ //Logging in.
          console.log(ipAddress);
          userLogin(params, res, ipAddress, dbconn);
        } else if (method == "change-password"){ //Changing a password.
          let jwt = getJWTFromHeader(req);
          changePassword(params, res, jwt, ipAddress, dbconn);
        } else {
          apiError("DOES_NOT_EXIST",res); //Methods is nonexistent.
        }
      }).catch((e) => {
        apiError("INTERNAL",res); //Something weird happened.
        throw e; //Throw the error.
      });
    } else {
      apiError("DOES_NOT_EXIST",res); //Method nonexistent.
    }
  } else if (apiAccessList[ipAddress] < apiLimit*3){ //Return too many requets. If the user is under 3 times the limit.
    apiError("TOO_MANY_REQUESTS",res);
  } else { //Drop connection without JSON after 10 seconds.
    setTimeout(function () {
      res.writeHead(429);
      res.end();
    }, 10000);
  }

  apiAccessList[ipAddress]++; //Increment counter by 1.

}

async function createAccount(params, res, ipAddress, dbconn){ //Creates an ccount in the database.
  if (typeof params === "undefined"){ //Make sure the params are defined.
    apiError("INVALID_DETAILS",res); //No details passed.
  } else if (typeof params.username === "undefined" || typeof params.password === "undefined" || typeof params.code === "undefined"){ //Validity Check #1
    apiError("INVALID_DETAILS",res); //Invalid details.
  } else if (!validateUsername(params.username) || !validatePassword(params.password) || !validateCode(params.code)){ //Something is wrong with the data entered.
    apiError("INVALID_DETAILS",res); //The username, password or code provided was invalid.
  } else if (!await validateCodeDB(params.code,dbconn)){ //Check the code on the database.
    logActionInDatabase(dbconn, "CREATE_ACCOUNT_BAD_CODE", ipAddress); //Log the failed attempt at creating an account.
    apiError("INVALID_AUTH_CODE",res); //Code is invalid.
  } else { //No error so create the user.
    var uuid = generateUUID(); //User id.
    var passwordSalt = randomSalt(); //Create password salt.
    var passwordHash = hashPassword(params.password,passwordSalt); //Create password hash.

    var query = "INSERT INTO Users (UUID,Username,IsAdmin,PasswordHash,PasswordSalt) VALUES (?,?,FALSE,?,?)"; //Sql query for non admin user.
    var insert = [uuid,params.username,passwordHash,passwordSalt]; //Create parameter set.
    var sql = mysql.format(query,insert); //Create statement to be executed.

    dbconn.query(sql,(err,results,fields) => { //Make call to database.
      if (err){ //Error catching
        if (err.code === "ER_DUP_ENTRY"){ //Username is taken.
          apiError("USERNAME_TAKEN",res);
          logActionInDatabase(dbconn, "CREATE_ACCOUNT_USERNAME_TAKEN", ipAddress); //Log the failed attempt at creating an account.
        } else {
          throw err;
        }
      } else {
        useCodeDB(params.code,dbconn).then(() => { //Remove code from database.
          let jwt = generateJWT(uuid,params.username,false);

          apiLoginUser(res, jwt); //Log the user in.


          logActionInDatabase(dbconn, "CREATE_ACCOUNT", ipAddress, uuid); //Log the account creation.

        }).catch((e) => {
          if (e) throw e;
        });
      }
    });
  }
}

function userLogin(params, res, ipAddress, dbconn){
  if (typeof params === "undefined"){ //No params.
    apiError("INVALID_DETAILS",res);
  } else if (typeof params.username === "undefined" || typeof params.password === "undefined"){ //Username or password is undefined.
    apiError("INVALID_DETAILS",res);
  } else if (!validateUsername(params.username) || !validatePassword(params.password)){ //Invalid username or password.
    apiError("INVALID_DETAILS",res);
  } else {
    verifyPassword(params.username,params.password,dbconn).then((userInfo)=>{
      let jwt = generateJWT(userInfo.UUID, userInfo.username, userInfo.isAdmin==1); //Generate a validation token.
      apiLoginUser(res,jwt); //Log the user in.
      logActionInDatabase(dbconn, "LOGIN_SUCCESS", ipAddress, userInfo.UUID); //Log the action in the database along with the UUID.
    }).catch((err)=>{
      if (typeof err === "string"){ //Check if the error is throwable or a failed verification.
        if (err === "INVALID_PASSWORD" || err === "INVALID_USERNAME"){ //Check to see if the error was because of a bad username-password combination.
          apiError("BAD_PASSWORD",res);
          logActionInDatabase(dbconn, "LOGIN_INCORRECT", ipAddress); //Log the action in the database with no uuid
        } else {
          apiError("INTERNAL",res);
          console.error("Unknown Login Error: " + err);
        }
      } else {
        throw err; //Throw genuine errors.
      }
    });
  }
}

function verifyPassword(username,password,dbconn){ //Check the password in the database against the one given.
  return new Promise((resolve,reject)=>{
    const query = "SELECT * FROM Users WHERE Username=?"; //Begin a query.
    const insert = [username];
    const sql = mysql.format(query,insert);

    dbconn.query(sql, (err,results,fields)=>{
      if (err){ //An error occurred.
        reject(err);
      }

      if (results.length > 0){ //Check if there was actually a user found.
        let result = results[0]; //Select first result.

        if (result.PasswordHash === hashPassword(password,result.PasswordSalt)){ //Check to see if the password is valid.
          resolve({ //Return user info.
            UUID: result.UUID,
            username: result.Username,
            isAdmin: result.IsAdmin==1
          });
        } else {
          reject("INVALID_PASSWORD");
        }
      } else {
        reject("INVALID_USERNAME"); //Could not find the user.
      }
    });
  });
}

function changePassword(params,res,token,ipAddress,dbconn){ //Change a user's password.
  if (!verifyJWT(token)){ //Check the JWT
    apiError("AUTHORISATION_FAILED",res);
  } else if(typeof params === "undefined"){ //Parameters undefined
    apiError("INVALID_DETAILS",res);
  } else if (typeof params.oldPassword === "undefined" || typeof params.newPassword === "undefined"){ //Make sure the username and password are defined.
    apiError("INVALID_DETAILS",res);
  } else if (!validatePassword(params.oldPassword) || !validatePassword(params.newPassword)){ //Make sure the passwords are valid.
    apiError("INVALID_DETAILS",res);
  } else { //Inputs appear to be valid. Proceed to checking the old password and token to ensure it's correct.
    let tokenInfo = splitJWT(token);

    if (tokenInfo !== false){ //Make sure token isn't invalid.
      verifyPassword(tokenInfo.payload.username,params.oldPassword,dbconn).then((userInfo)=>{ //User information is valid.
        let newPasswordSalt = randomSalt(); //Generate a salt for the password.
        let newPasswordHash = hashPassword(params.newPassword, newPasswordSalt); //Generate a hash for the salt.

        let query = "UPDATE Users SET PasswordHash=?,PasswordSalt=? WHERE Username=?"; //Create an sql statement.
        let insert = [newPasswordHash,newPasswordSalt,tokenInfo.payload.username]; //Create an insert array.
        let sql = mysql.format(query,insert); //Prepare the statement

        dbconn.query(sql, (err,results,fields)=>{
          if (err){ //Catch any odd errors.
            throw err;
          }
          //No error found.
          apiPasswordChange(res); //Return info the user.

          logActionInDatabase(dbconn, "CHANGE_PASSWORD", ipAddress, tokenInfo.payload.uuid); //Log the action in the database with the UUID
        });
      }).catch((err)=>{ //Catch an issue such as an incorrect combination.
        if (typeof err === "string"){
          if (err === "INVALID_USERNAME" || err === "INVALID_PASSWORD"){
            apiError("BAD_PASSWORD",res);
            logActionInDatabase(dbconn, "CHANGE_PASSWORD_FAIL", ipAddress); //Log the action in the database
          } else {
            apiError("INTERNAL",res);
            console.error("Unknown Login Error: " + err);
          }
        } else {
          throw err;
        }
      });
    } else {
      apiError("AUTHORISATION_FAILED",res);
    }
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

function logActionInDatabase(dbconn, action, ipAddress, uuid=""){ //Logs an API action in the database.
  let query;
  let inserts;

  let actionName;
  switch(action){ //Conver the action into the database name and if it was successful. Only calls on the database will end up logged.
    case "CREATE_ACCOUNT": //Account created.
      actionName="user.create.success";
      break;
    case "CREATE_ACCOUNT_BAD_CODE": //Invalid auth code for account creation.
      actionName="user.create.badCode";
      break;
    case "CREATE_ACCOUNT_USERNAME_TAKEN": //Invalid auth code for account creation.
      actionName="user.create.usernameTaken";
      break;
    case "LOGIN_SUCCESS": //Successful login.
      actionName="user.login.success";
      break;
    case "LOGIN_INCORRECT": //Incorrect username or pasword.
      actionName="user.login.fail";
      break;
    case "CHANGE_PASSWORD": //Password changed.
      actionName="user.changePassword.success";
      break;
    case "CHANGE_PASSWORD_FAIL": //User entered a bad old password so it failed.
      actionName="user.changePassword.fail";
      break;
  }

  if (uuid === ""){ //NO UUID PRESENT.
    query = "INSERT INTO APILog (IPAddress,Action,Timestamp) VALUES (INET6_ATON(?),?,?)"; //Create a query to be sent to the server.
    inserts = [ipAddress, actionName, new Date()]; //Inserts to prepare.
  } else { //UUID PRESENT.
    query = "INSERT INTO APILog (UUID,IPAddress,Action,Timestamp) VALUES (?,INET6_ATON(?),?,?)";
    inserts = [uuid, ipAddress, actionName, new Date()];
  }

  let sql = mysql.format(query,inserts); //Prepare the statement.


  dbconn.query(sql, (err,results,fields)=>{ //Make call to database.
    if (err){ //Catch errors;
      throw err;
    }
  });


}

function useCodeDB(code,dbconn){ //Invalidate code.
  return new Promise(function(resolve, reject){
    const query = "UPDATE Codes SET Valid=FALSE WHERE Code = ? AND Valid = TRUE;"; //Query
    const insert = [code];
    const sql = mysql.format(query,insert); //Formatted query.

    dbconn.query(sql, (err,results,fields) => { //Run the sql
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

function generateUUID(){ //Generate a version 4 uuid.
  var rdmBytes = crypto.randomBytes(16); //Generate 16 random bytes.
  var hexString = rdmBytes.toString("hex"); //Convert to hex.
  return hexString.slice(0,8) + "-" + hexString.slice(8,12) + "-4" + hexString.slice(13,16) + "-" + hexString.slice(16,20) + "-" + hexString.slice(20,32); //Put the hex into a uuid.
}

function apiError(errName, res){ //Core function for API errors.
  let errorCode; //The numeric code.
  let errorMsg; //The error message.
  let httpErrorCode; //The HTTP status code to send.

  switch(errName){ //Error cases.
    case "DOES_NOT_EXIST": //Api method does not exist or the wrong method is being used.
      errorCode=404;
      httpErrorCode=404;
      errorMsg="This api call does not exist or you are using the wrong method!";
      break;
    case "INTERNAL": //An internal server error occurred.
      errorCode=500;
      httpErrorCode=500;
      errorMsg="An internal server error occurred.";
      break;
    case "INVALID_DETAILS": //The details entered do not meet the requirements (e.g: password is too short).
      errorCode=600;
      httpErrorCode=400;
      errorMsg="Your details did not satisfy the requirement for this action.";
      break;
    case "INVALID_AUTH_CODE": //The authorisation code to create an account is invalid.
      errorCode=601;
      httpErrorCode=400;
      errorMsg="The code you entered is already used or never existed!";
      break;
    case "BAD_PASSWORD": //The username and password combination is incorrect.
      errorCode=602;
      httpErrorCode=400;
      errorMsg="The username or password you have entered is incorrect.";
      break;
    case "USERNAME_TAKEN": //The username for a new account is already taken.
      errorCode=603;
      httpErrorCode=400;
      errorMsg="The username you entered is taken!";
      break;
    case "TOO_MANY_REQUESTS": //The user(or bot) is being rate limited for spamming the API with requests.
      errorCode=429;
      httpErrorCode=429;
      errorMsg="Too many requests!";
      break;
    case "AUTHORISATION_FAILED": //The JWT token is invalid.
      errorCode=401;
      httpErrorCode=401;
      errorMsg="Authorisation Failed! Please log out and log in again.";
      break;
    default:
      errorCode=400;
      httpErrorCode=400;
      errorMsg="Something went wrong!";
      break;
  }

  res.writeHead(httpErrorCode); //Write the HTTP status code.
  res.end(JSON.stringify({ //Send the error data in JSON format.
    error:true,
    errorCode: errorCode,
    errorMsg: errorMsg
  }));
}

function apiLoginUser(res,token){ //Return the login data to the user.
  res.writeHead(200); //Valid response.
  res.end(JSON.stringify({ //Return the data. To the user.
    error: false,
    data: {
      token: token
    },
    method:"LOGIN"
  }));
}

function apiPasswordChange(res){ //Password has been changed.
  res.writeHead(200);
  res.end(JSON.stringify({
    error:false,
    method: "CHANGE_PASSWORD"
  }));
}


function resolveStaticPath(pth){ //Resolve the static path to the /static directory or the game files.
  if (pth.startsWith("game/")){ //Game file
	let gamePth = pth.substr(5); //Remove game/ from the path.
    return __dirname + "/../Game/" + gamePth;
  } else { //Regular static file.
    return __dirname + "/static/" + pth;
  }
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
    } else if (path === "/game"){ //Game page.
      res.writeHead(200, generateHeaders("html", -1, gzipEnabled));
      if (gzipEnabled){
        res.end(gamePageCompressed);
      } else {
        res.end(gamePage);
      }
    } else if (path.startsWith("/static/")){ //Static content directory: Just "/static" without the "/"" after is not accepted.
      let customPath = path.substr(8); //The length of "/static/" is 8 characters long.
      let filePath = resolveStaticPath(customPath); //Resolve the static path.
      if (filePath !== -1){ //Make sure it isn't blocked.
        if (shouldFileBeSent(req.headers, filePath)){ //Check if the file should actually be sent as the user may have cached it.
          if (fs.existsSync(filePath)){ //Check if the file exists.
            res.writeHead(200,generateHeaders(getFileType(customPath),86400,gzipEnabled)); //Send the headers with an exipiry time of 1 day.
            var readStream = fs.createReadStream(filePath); //Open the file.
            var outputStream; //Define the output stream.
            if (gzipEnabled){ //For compression
              outputStream = zlib.createGzip(); //Create a gzip compressor.
              outputStream.pipe(res); //Pipe the compressed data into the response.

              outputStream.on('error',(err) => { //Error handling.
                error500(res);
              });
            } else {
              outputStream = res; //Default the output stream to the response;
            }

            readStream.pipe(outputStream); //Pipe the read stream into the output stream.

            readStream.on('error', (err)=>{ //File not found.
              if (err.code === "EISDIR"){ //File is a folder.
                error404(res);
              } else { //Error occurred.
                error500(res); //Internal server error.
              }
            });
          } else { //File not found.
            error404(res);
          }
        } else {
          res.writeHead(304,generateHeaders("",-1,false)); //Respond with 304 file is already there.
          res.end();
        }
      } else {
        error404(res);
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
  } else if (urlstate.status == "toolong"){ //Too long url.
    error414(res);
  } else { //Default case. This could should never be called but is there to prevent the server from hanging or crashing.
    error404(res);
  }
});


const httpserver = http.createServer((req,res)=>{ //Port 80 redirect from HTTP to HTTPS.
        res.writeHead(301, {"Location":"https://"+req.headers.host+req.url}); //HTTPS Redirect
        res.end(); //Close connection.
});

function connectDatabase(callback){
  if (typeof dbconnection !== "undefined"){ //Check if there is an already open connection.
    console.log("Refreshing database connection!");
    olddbconnection = dbconnection;

    setTimeout(()=>{
      olddbconnection.end();
    }, 20000); //Close old connection after 20 seconds.
  }

  dbconnection = mysql.createConnection({ //Create a sql database connection;
    host: "localhost", //Login to localhost server.
    user: "login_server", //Username is login_server.
    password: fs.readFileSync("./.secret/db_password"), //Password is read from the db_password file in the secret folder.
    database: "domsgame" //Select 'domsgame' database.
  });

  dbconnection.connect((err) => { //Attempt the connection to the server
    if (typeof callback === "function"){
      callback(err);
    }
  });
}

connectDatabase((err)=>{
  if(err){ //Error thrown if connection is failed.
    throw err;
  }
  //Reaches here if the connection is scucessful.
  console.log("Database connection successful!");
  //Start the webservers now that the database can be accessed.
  httpserver.listen(80); //Listens on port 80 to redirect incoming insecure HTTP traffic.
  server.listen(443); //Run the server on the default https port 443.
});

setInterval(function () { //Clears recent ips every minute.
  apiAccessList = {};
}, 60000);

setInterval(()=>{ //Reset database connection every 4 hours
  connectDatabase();
}, 14400000);
