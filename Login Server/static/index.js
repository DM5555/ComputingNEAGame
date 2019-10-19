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

    this.pageReady = true; //Page is ready
  }

  loadElements(){ //List all elements and get them/
    for (let e of this.elementsList){
      this[e] = document.getElementById(e);
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
            this.showMessage("Logged in successfully!", "success");
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
          this.showMessage("Your code should be 12 characters in length and alphanumerical (including spaces).","error"); //Bad code.
        } else { //Username and password valid.
          params = "username=" + encodeURIComponent(this.usernameField.value) + "&password=" + encodeURIComponent(this.passwordField.value) + "&code=" + encodeURIComponent(this.codeField.value); //Params to input

          this.makeRequest("/api/create-account", "POST", params).then((responseData) => { //Make a request to the server to create an account.
            this.showMessage("Account creation successful!", "success");
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

  makeRequest(url, type, params){ //Make an xhr request. ALSO SHOWS ERRORS.
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

  loginAs(token){ //Login as a user.
    document.cookie = "token=" + token + ";"; //Set the document cookie.

    var headerEnd = token.indexOf(".");
    var headerB64 = token.slice(0,headerEnd); //Get JWT header.
    var remainingToken = token.slice(headerEnd+1); //Remove header part of token.

    var payloadEnd = remainingToken.indexOf(".");
    var payloadB64 = remainingToken.slice(0,payloadEnd); //Get JWT payload.

    var signature = remainingToken.slice(payloadEnd+1); //Get JWT signature.

    userData = JSON.parse(atob(payloadB64)); //Parse the payload and set the userdata to it.
  }
}



window.onload = () => {
  pageJS = new PageJS();
  pageJS.loadElements();
  pageJS.pageLoad();
};
