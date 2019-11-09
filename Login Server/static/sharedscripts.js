//SCRIPTS THAT ARE EXPORTED GO HERE
/* jshint esversion: 6 */

function validateUsername(username){ //Ensures that the username entered is valid. It can be alphanumerical and have underscores. It must also be 3 characters in length or more but no more than 16.
  if (username !== undefined && username !== null || typeof password == "string"){ //Null check.
    if (username.length >= 3 && username.length <= 16){ //Length check.
      if (/^[a-zA-Z0-9_]*$/g.test(username)){ //I have only used regex here because it was absolutely necessary. I do not want to do ascii code matching again. I could also make this shorter by plugging the match straight into the return statement but then I would not be able to comment it as easily.
        return true; //Their username is somehow valid.
      } else {
        return false; //Looks like someone had illegal characters in their username!
      }
    } else { //Username is too short!
      return false;
    }
  } else { //Not a string.
    return false;
  }
}

function validatePassword(password){ //This is a bit like the username validator except it will ensure that the password is minimum 8 chars (but max 32), it is up to the user as to whether they want to use chars or not. "password" is strictly not allowed.
  if (password !== undefined && password !== null && typeof password == "string"){ //Null check.
    if (password.toLowerCase() === "password" || password.length < 8 || password.length > 32){ //Don't even try it.
      return false; //This password is bad for sure.
    } else{
      if(/^[ -~£€]*$/g.test(password)){ //Time for more regex! Accepts pretty much everything in ASCII between char 32 (space) and 126(~). Also accepts the pound (£) and euro (€).
        return true; //This is valid.
      } else {
        return false; //Not valid.
      }
    }
  } else { //Not a string.
    return false;
  }
}

function validateCode(code){ //Doesnt actually verify the code, just validates it.
  if(code.length === 12){ //Length check
    if(/^[a-zA-Z0-9 ]*$/g.test(code)){ //Alphanumerical only (and spaces)
      return true; //Code is valid.
    } else {
      return false; //Code is not valid.
    }
  } else {
    return false; //Code is not 12 characters.
  }
}

function base64Encode(data) { //Encodes data into base 64.
  var b64;
  if (typeof btoa === "undefined"){ //For node.
    b64 = Buffer.from(data).toString('base64'); //Convert to base64
  } else { //For browser
    b64 = btoa(data); //Convert to base64
  }
  return b64.replace(/\=/g,"").replace(/\+/g,"-").replace(/\//,"_"); //Replaces characters and removes padding.
}

function base64Decode(data,rawData=false){ //Decodes data from base64. Can return the raw data in node.
  var b64 = data.replace(/\-/g,"+").replace(/\_/g,"/"); //Replace characters.
  if (b64.length%4 !== 0){ //Only add padding if the string is a multiple of 4.
    b64 += "=".repeat(4-(b64.length%4)); //Add padding.
  }

  if (typeof atob === "undefined"){ //node
    if (rawData){
      return Buffer.from(b64,"base64"); //Return raw data.
    } else {
      return Buffer.from(b64, "base64").toString("utf8"); //Main conversion.
    }
  } else { //browser.
    return atob(b64); //Main conversion
  }
}

function splitJWT(token){ //Split a JSON web token. Into the header and the signature.
  var headerEnd = token.indexOf(".");

  if (headerEnd === -1 || headerEnd+1 === token.length){ //Header end cannot be found or there is nothing after the end of header.
    return false;
  } else { //Header end found.
    var headerB64 = token.slice(0,headerEnd); //Get JWT header.
    var remainingToken = token.slice(headerEnd+1); //Remove header part of token.

    var payloadEnd = remainingToken.indexOf(".");

    if (payloadEnd === -1 || payloadEnd+1 === remainingToken.length){ //Payload end not found or it is the last character in the string.
      return false;
    } else { //Payload end found.
      var payloadB64 = remainingToken.slice(0,payloadEnd); //Get JWT payload.

      var signature = remainingToken.slice(payloadEnd+1); //Get JWT signature.

      let payload;

      try { //Attempt to decode the payload.
        let payloadString = base64Decode(payloadB64); //Decode payload data.
        payload = JSON.parse(payloadString); //Parse the payload and set the userdata to it.
      } catch (e){
        return false;
      }

      let mainTokenData = token.slice(0,headerEnd+payloadEnd+1); //Gets main token (header and payload) +1 for the dot in the middle.

      return { //Return data and signature.
        payload:payload,
        signature:signature,
        mainTokenData: mainTokenData
      };
    }
  }
}

function getCookies(){ //Get all cookies.
  let sets = document.cookie.split(";"); //Split the cookies by semicolons.

  let splitSets = []; //Split the sets by "=";
  for (let s of sets){
    splitSets.push(s.split("="));
  }

  let groups = []; //Create groups for the cookies and attributes;
  let buf = []; //Create a buffer for properties to add.

  for (let s of splitSets){ //Index split sets.
    switch(s[0].toLowerCase()){ //Check if it is an attribute.
      case "Secure":
      case "Domain":
      case "Path":
      case "HTTPOnly":
      case "Expires":
        buf.push(s);
        break;
      default:
        if (buf.length !==0){
          groups.push(buf); //Only push to groups if buffer is not empty.
        }
        buf = [s]; //Reset buffer and add first object.
        break;
    }
  }
  groups.push(buf); //Empty remaining buffer.

  let cookies = {};

  for (let g of groups){ //Index groups.
    for (let i of g){ //Index properties.
      if (i.length === 1){ //Has no pair.
        i[1] = "true"; //Create a pair.
      }

      for (let j of i){ //Index each property and remove spaces at beginning and end.
        if (j.startsWith(" ")){ //Remove beginning space.
          j = j.slice(1);
        }
        if (j.endsWith(" ")){ //Remove ending space.
          j = j.slice(0,-1); //Removes ending space.
        }
      }
    }

    let cookieInfo = g.shift(); //Take first pair off for name and value.
    let cookieName = cookieInfo[0];
    let thisCookie = { //Create a cookie object.
      value:cookieInfo[1]
    };

    for (let i of g){ //Add attributes.
      thisCookie[i[0]] = i[1]; //Add attributes.
    }

    cookies[cookieName] = thisCookie; //Add the cookie to the list.
  }

  return cookies;

}


if (typeof module !== "undefined"){ //Only for node.
  module.exports = {
    validateUsername: validateUsername,
    validatePassword: validatePassword,
    validateCode: validateCode,
    base64Encode: base64Encode,
    base64Decode: base64Decode,
    splitJWT: splitJWT,
    getCookies: getCookies
  }
}
