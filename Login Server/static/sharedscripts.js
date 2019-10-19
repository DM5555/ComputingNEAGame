//SCRIPTS THAT ARE EXPORTED GO HERE

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

function base64Decode(data){ //Decodes dta from base64.
  var b64 = data.replace(/\-/g,"+").replace(/\_/g,"/"); //Replace characters.
  b64 += "=".repeat((3-(b64.length%3))%3); //Re-adds = padding.
  if (typeof atob === "undefined"){ //node
    return Buffer.from(b64, "base64").toString(); //Main conversion.
  } else { //browser.
    return atob(b64); //Main conversion
  }
}

if (typeof module !== "undefined"){ //Only for node.
  module.exports.validateUsername = validateUsername;
  module.exports.validatePassword = validatePassword;
  module.exports.validateCode = validateCode;
  module.exports.base64Encode = base64Encode;
  module.exports.base64Decode = base64Decode;
}
