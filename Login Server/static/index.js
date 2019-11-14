/* jshint esversion: 6 */

var pageJS;

class PageJS { //A class is used to avoid putting variables in the global scope. Only one instance is used.

  constructor(){
    this.pageReady = false; //Stores if the page is ready or not.


    this.elementsList = [ //List of elements to be initialised.
      "notLoggedIn",
      "subtext",
      "usernameField",
      "passwordField",
      "passwordRepeatField",
      "codeField",
      "loginButton",
      "loginForm",
      "infoBox",
      "infoMsg",
      "userData",
      "loginSwitcher",
      "signupSwitcher",
      "loggedIn",
      "serversSwitcher",
      "changePasswordSwitcher",
      "logoutSwitcher",
      "serverlist",
      "changePasswordForm",
      "changePasswordUsernameText",
      "changePasswordUsername",
      "changePasswordOld",
      "changePasswordNew",
      "changePasswordNewRepeat",
      "changePasswordButton"
    ];


    this.mode = ""; //Whether to login or sign up.
    this.modeB = ""; //Whether to browse servers or change password (only when logged in.)
    this.pendingRequest = false; //Whether a request is pending.

  }


  pageLoad(){ //When page has loaded
    this.mode = "login"; //Switch between login and signup modes.
    this.modeB = "servers"; //Switch modes between servers and changing password.

    this.loginSwitcher.onclick = () => { //Switch to the login mode.
      if (this.mode !== "login") { //Only if it isnt in login mode already.
        for (let i of document.getElementsByClassName("signuponly")){ //Make all sign up elements not visible.
          i.style.display = "none";
        }
        this.loginSwitcher.classList.add("activeSwitcher"); //Set active switcher
        this.signupSwitcher.classList.remove("activeSwitcher");

        this.passwordField.autocomplete = "password"; //Set autocomplete attributes.
        this.passwordRepeatField.autocomplete = "off";
        this.codeField.autocomplete = "off";

        this.loginButton.innerText = "Log In"; //Change login button text.

        this.mode = "login";
      }
    };

    this.signupSwitcher.onclick = () => { //Switch to signup mode
      if (this.mode !== "signup") { //Only if it isnt in signup mode already.
        for (let i of document.getElementsByClassName("signuponly")){ //Make all sign up elements visible.
          if (i.tagName.toLowerCase() === "input"){ //Input elements get inline block.
            i.style.display = "inline-block";
          } else { //All others get block.
            i.style.display = "block";
          }
        }
        this.signupSwitcher.classList.add("activeSwitcher"); //Set active switcher
        this.loginSwitcher.classList.remove("activeSwitcher");

        this.passwordField.autocomplete = "new-password"; //Set autocomplete attributes.
        this.passwordRepeatField.autocomplete = "new-password";
        this.codeField.autocomplete = "one-time-code";

        this.loginButton.innerText = "Sign Up"; //Sign up button.

        this.mode = "signup"; //Switch mode
      }
    };

    this.logoutSwitcher.onclick = () => { //Log the user out.
      this.logoutUser();
    };

    this.serversSwitcher.onclick = () => { //Switch to server list.
      this.switchToServerPanel();
    };

    this.changePasswordSwitcher.onclick = () => { //Switch to change password section.
      if (this.modeB !== "changePassword"){
        this.changePasswordForm.style.display = "inline"; //Show change password section.
        this.serverlist.style.display = "none"; //Hide server list.
        this.changePasswordSwitcher.classList.add("activeSwitcher"); //Set active switcher.
        this.serversSwitcher.classList.remove("activeSwitcher");

        //Enable autocomplete.
        this.changePasswordOld.autocomplete = "password";
        this.changePasswordNew.autocomplete = "new-password";
        this.changePasswordNewRepeat.autocomplete = "new-password";

        this.modeB = "changePassword";
      }

    };

    this.pageReady = true; //Page is ready
  }

  loadElements(){ //List all elements and get them/
    for (let e of this.elementsList){
      this[e] = document.getElementById(e);
    }
  }

  switchToServerPanel(){ //Switches the active panel from the password changer to the server panel.
    if (this.modeB !== "servers"){
      this.serverlist.style.display = "inline-block"; //Show server list.
      this.changePasswordForm.style.display = "none"; //Hide change password form.
      this.serversSwitcher.classList.add("activeSwitcher"); //Set active switcher.
      this.changePasswordSwitcher.classList.remove("activeSwitcher");

      //Disable autocompletes.
      this.changePasswordOld.autocomplete = "off";
      this.changePasswordNew.autocomplete = "off";
      this.changePasswordNewRepeat .autocomplete= "off";

      //Clear fields.
      this.changePasswordOld.value = "";
      this.changePasswordNew.value = "";
      this.changePasswordNewRepeat.value = "";

      this.modeB = "servers"; //Set mode.
    }
  }

  login(){ //Login submitted
    if (this.pageReady && !this.pendingRequest){ //Only calls if the page is ready and there is not a request pending.
      var params;
      if (this.mode === "login"){ //Login mode.
        if (!validateUsername(this.usernameField.value)){ //Check username before sending.
          this.showMessage("Your username must be between 3-16 characters and be alphanumerical (underscores allowed).","error"); //Bad username.
        } else if (!validatePassword(this.passwordField.value)){ //Check password before sending.
          this.showMessage("Your password must be between 8-32 characters in length and secure.","error"); //Bad password.
        } else {
          //Create the form parameters which have been encoded to ensure that the server is not confused by certian characters (although it is protected against this).
          params = "username=" + encodeURIComponent(this.usernameField.value) + "&password=" + encodeURIComponent(this.passwordField.value);

          this.makeRequest("/api/login","POST", params).then((responseData) => {
            this.showMessage("Logged in successfully!", "success"); //Update the message box to show a successful login.
            this.loginAs(responseData.data.token); //Login as the user with the token recieved.

          }).catch((e) => {
            if (typeof e !== "undefined"){ //An actual error.
              throw e;
            }
          });

          this.showMessage("Logging in...","info"); //Show pending message.
        }
      } else if (this.mode === "signup"){ //Signup mode.
        if (this.passwordField.value !== this.passwordRepeatField.value){ //Make sure the check password field is valid
          this.showMessage("The passwords you have entered do not match.","error"); //Show an error message.
        } else if (!validateUsername(this.usernameField.value)) { //Validate username.
          this.showMessage("Your username must be between 3-16 characters and be alphanumerical (underscores allowed).","error"); //Bad username.
        } else if (!validatePassword(this.passwordField.value)) { //Validate password.
          this.showMessage("Your password must be between 8-32 characters in length and secure.","error"); //Bad password.
        } else if (!validateCode(this.codeField.value)) { //Validate code.
          this.showMessage("Your code must be 12 characters in length and alphanumerical (including spaces).","error"); //Bad code.
        } else { //Username and password valid.
          params = "username=" + encodeURIComponent(this.usernameField.value) + "&password=" + encodeURIComponent(this.passwordField.value) + "&code=" + encodeURIComponent(this.codeField.value); //Params to input

          this.makeRequest("/api/create-account", "POST", params).then((responseData) => { //Make a request to the server to create an account.
            this.showMessage("Account creation successful!", "success");

            this.loginAs(responseData.data.token); //Log the user in with the returned token
          }).catch((e) => {
            if (typeof e !== "undefined"){ //Actual error.
              throw e;
            }
          });

          this.showMessage("Creating an account...","info"); //Show pending message.
        }
      }
    } //Do nothing if the page is not ready.

    return true;
  }

  changePassword(){ //Called when the change password button is clicked.
    if (this.pageReady && !this.pendingRequest){ //Ensure the page is ready and that there is not a pending request.
      if (!validatePassword(this.changePasswordOld.value)){ //Check to ensure that the passwords match.
        this.showMessage("The old password you have entered is not a valid password (8-32 characters range).","error"); //Bad old password.
      } else if (!validatePassword(this.changePasswordNew.value)){
        this.showMessage("The new password you have entered must be between 9-32 characters in length and secure.","error"); //Bad new password
      } else if(this.changePasswordNew.value !== this.changePasswordNewRepeat.value){ //Validate old password.
          this.showMessage("The new passwords you have entered do not match.","error");
      } else if(this.changePasswordNew.value === this.changePasswordOld.value){ //Validate new password.
          this.showMessage("Your old password cannot be your new password!", "error");
      } else { //Inputs appear to be valid.
        var params = "oldPassword=" + encodeURIComponent(this.changePasswordOld.value) + "&newPassword=" + encodeURIComponent(this.changePasswordNew.value); //Encode the parameters to be sent to the server.

        this.makeRequest("/api/change-password","POST",params,true).then((responseData)=>{ //Send the request to the server.
          this.showMessage("Password change successful!", "success"); //Inform the user that their password change was successful.

          this.switchToServerPanel();
        }).catch((e)=> {
          if (typeof e !== "undefined"){ //Actual error occurred.
            throw e;
          }
        });
        this.showMessage("Changing password...","info");
      }
    } // Do nothing if the page is not ready yet.

    return true;
  }

  makeRequest(url, type, params, useAuthorisation=false){ //Make an xhr request. ALSO SHOWS ERRORS.
    return new Promise((resolve, reject)=>{
      var request = new XMLHttpRequest(); //Create a request
      request.timeout = 15000; //15 sec timeout.
      request.open(type, url, true); //Open request.

      request.onreadystatechange = () => { //Called when the request's state changes.
        if (request.readyState == XMLHttpRequest.DONE){ //Wait for request to be done.
          let responseData;
          if (request.status != 0){ //Request didnt fail.
            if (request.responseText.length > 0){ //Non empty reponse.
              responseData = JSON.parse(request.responseText); //Get response data.
            } else { //Empty reponse.
              responseData = {
                error: true,
                errorMsg: "The server did not respond with any data."
              };
            }
          } else { //Request failed.
            this.showMessage("The request failed.","error");
            reject(); //May not always be an error.
          }
          if (request.status == 200){ //Ensure that the load is valid.
            this.showMessage("");
            resolve(responseData);
          } else if(request.status >= 400 && request.status < 500){ //Invalid request between error 400 and 500.
            this.showMessage(responseData.errorMsg,"warning");
            reject();
          } else if(request.status == 500){ //Server Error.
            this.showMessage("An internal server error occurred.", "error");
            reject();
          } else if(request.status != 0){ //Was not a failed request.
            this.showMessage("Something went wrong.", "error");
            reject();
          }
          this.pendingRequest = false; //There is no longer a pending request.
        }
      };

      if (useAuthorisation) {
        request.setRequestHeader("Authorization", "Basic " + this.token);
      }

      if (params !== ""){
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); //Send content types.
        request.send(params); //Send request with parameters.
      } else {
        request.send(); //Send request.
      }



      this.pendingRequest = true;

    });

  }

  showMessage(msg, type){ //Show a user message, if there is none, the box will dissappear. Should only be called after the window has loaded.
    if (msg === ""){
      this.infoBox.style.display = "none"; //Hide the box.
    } else {
      this.infoMsg.innerText = msg; //Set message.
      this.infoBox.style.display = "inline-block"; //Show the box

      if (type == "error") { //Types of display message.
        this.infoBox.style.backgroundColor = "#fa4d4d";
      } else if (type == "warning"){
        this.infoBox.style.backgroundColor = "#FF9900";
      } else if (type == "info") {
        this.infoBox.style.backgroundColor = "#2377fc";
      } else if (type == "success"){
        this.infoBox.style.backgroundColor = "#21cf66";
      }
    }
  }

  loginAs(token, updateCookie=true){ //Login as a user from the token given.
    var tokenData = splitJWT(token); //Split the JSON web token into parts.

    if (tokenData.payload.expiresMs > Date.now()){ //Date check.
      if (updateCookie){ //Update the cookie if told to do so.
        document.cookie = "token=" + token + ";Expires="+(new Date(tokenData.payload.expiresMs)).toGMTString(); //Set the document cookie.
      }

      this.token = token;

      this.notLoggedIn.style.display = "none";
      this.loggedIn.style.display = "block"; //Show account panel.
      this.subtext.innerText = "Welcome " + tokenData.payload.username + "!";
    } else { //Token has expired.
      logoutUser();
    }
  }

  logoutUser(){ //Log a user out.
    document.cookie = "token=;Expires=Thu, 01 Jan 1970 00:00:00 GMT"; //Delete the cookie and set it's expiry time to 0;

    this.notLoggedIn.style.display = "block"; //Show login form.
    this.loggedIn.style.display = "none";
    this.subtext.innerText = "Please login or create an account to continue.";
  }


}

window.onload = ()=>{

  pageJS = new PageJS();
  pageJS.loadElements();
  pageJS.pageLoad();
  let token = getCookies().token;

  if (typeof token !== "undefined"){
    pageJS.loginAs(token.value,false); //Log in the user without resetting the cookie.
  } else {
    pageJS.logoutUser();
  }

};
