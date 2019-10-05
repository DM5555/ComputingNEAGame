/* jshint esversion: 6 */
var pageReady = false; //Stores if the page is ready or not.

//Initialise varaibles
var usernameField;
var passwordField;
var passwordRepeatField;
var codeField;
var loginButton;
var loginForm;
var errorBox;
var errorMsg;


var mode = ""; //Whether to login or sign up.
var pendingRequest = false; //Whether a request is pending.

function login(){ //Login submitted
  if (pageReady && !pendingRequest){ //Only calls if the page is ready and there is not a request pending.
    var request;
    var params;
    if (mode === "login"){ //Login mode.
      if (!validateUsername(usernameField.value)){ //Check username before sending.
        showError("Your username must be between 3-16 characters and be alphanumerical (underscores allowed)."); //Bad username.
      } else if (!validatePassword(passwordField.value)){ //Check password before sending.
        showError("Your password must be between 8-32 characters in length and secure."); //Bad password.
      } else {
        request = new XMLHttpRequest(); //Create a request
        //Create the form parameters which have been encoded to ensure that the server is not confused by certian characters (although it is protected against this).
        params = "username=" + encodeURIComponent(usernameField.value) + "&password=" + encodeURIComponent(passwordField.value);

        request.open("POST", "/api/login", true); //Establish the request.
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); //Content type

        request.onreadystatechange = () => { //Called when the request's state changes.
          if (request.readyState == XMLHttpRequest.DONE){
            if (request.statusCode == 200){
              console.log(request.responseText); //SHOULD REMOVE THIS
            }
            pendingRequest = false; //There is no longer a pending request.
          }
        };

        request.send(params); //Send request
        pendingRequest = true; //There is now a request pending
        showError(""); //Remove error message.
      }
    } else if (mode === "signup"){ //Signup mode.
      if (passwordField.value !== passwordRepeatField.value){ //Make sure the check password field is valid
        showError("The passwords you have entered do not match."); //Show an error message.
      } else if (!validateUsername(usernameField.value)) { //Validate username.
        showError("Your username must be between 3-16 characters and be alphanumerical (underscores allowed)."); //Bad username.
      } else if (!validatePassword(passwordField.value)) { //Validate password.
        showError("Your password must be between 8-32 characters in length and secure."); //Bad password.
      } else if (!validateCode(codeField.value)) { //Validate code.
        showError("Your code should be 12 characters in length and alphanumerical (including spaces)."); //Bad code.
      } else { //Username and password valid.
        request = new XMLHttpRequest(); //Create a request
        params = "username=" + encodeURIComponent(usernameField.value) + "&password=" + encodeURIComponent(passwordField.value) + "&code=" + encodeURIComponent(codeField.value); //Params to input

        request.open("POST","/api/create-account", true); //Request begins.
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); //Urlencoded form.

        request.onreadystatechange = () => { //Request's state has changed.
          if (request.readyState == XMLHttpRequest.DONE){
            if (request.statusCode == 200){
              //TODO Add stuff here
            }
            pendingRequest = false; //No pending request.
          }
        };

        request.send(params); //Send
        pendingRequest = true; //Request is now pending.
        showError(""); //Hide error box,
      }
    }
  } //Do nothing if the page is not ready.

  return true;
}

function showError(msg){ //Show an error message, if there is none, the box will dissappear. Should only be called after the window has loaded.
  if (msg === ""){
    errorBox.style.display = "none"; //Hide the box.
  } else {
    errorMsg.innerText = msg; //Set message.
    errorBox.style.display = "inline-block"; //Show the box.
  }
}

window.onload = () => { //When page has loaded
  usernameField = document.getElementById("usernameField"); //Username field.
  passwordField = document.getElementById("passwordField"); //Password field.
  passwordRepeatField = document.getElementById("passwordRepeatField"); //Repeat password field.
  codeField = document.getElementById("codeField"); //Code field
  loginButton = document.getElementById("loginButton"); //Login button.
  loginForm = document.getElementById("loginForm"); //Login form.
  errorBox = document.getElementById("errorBox"); //Error box.
  errorMsg = document.getElementById("errorMsg"); //Error msg.

  const loginSwitcher = document.getElementById("loginSwitcher"); //Login switcher <a> element.
  const signupSwitcher = document.getElementById("signupSwitcher"); //Signup switcher <a> element.
  mode = "login"; //Switch between login and signup modes.

  loginSwitcher.onclick = () => { //Switch to the login mode.
    if (mode !== "login") { //Only if it isnt in login mode already.
      for (let i of document.getElementsByClassName("signuponly")){ //Make all sign up elements not visible.
        i.style.display = "none";
      }
      loginSwitcher.classList.add("activeSwitcher"); //Set active switcher
      signupSwitcher.classList.remove("activeSwitcher");

      passwordField.autocomplete = "password"; //Set autocomplete attributes.
      passwordRepeatField.autocomplete = "off";
      codeField.autocomplete = "off";

      mode = "login";
    }
  };

  signupSwitcher.onclick = () => { //Switch to signup mode
    if (mode !== "signup") { //Only if it isnt in signup mode already.
      for (let i of document.getElementsByClassName("signuponly")){ //Make all sign up elements visible.
        if (i.tagName.toLowerCase() === "input"){ //Input elements get inline block.
          i.style.display = "inline-block";
        } else { //All others get block.
          i.style.display = "block";
        }
      }
      signupSwitcher.classList.add("activeSwitcher"); //Set active switcher
      loginSwitcher.classList.remove("activeSwitcher");

      passwordField.autocomplete = "new-password"; //Set autocomplete attributes.
      passwordRepeatField.autocomplete = "new-password";
      codeField.autocomplete = "one-time-code";

      mode = "signup"; //Switch mode
    }
  };

  pageReady = true; //Page is ready
};
