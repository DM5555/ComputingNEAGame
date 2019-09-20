"use strict"; //No weird behavior!
window.onload = () => { //When page has loaded
  const usernameField = document.getElementById("usernameField"); //Username field.
  const passwordField = document.getElementById("passwordField"); //Password field.

  document.getElementById("loginButton").onclick = () => { //Login button click
    var request = new XMLHttpRequest(); //Create a request
    //Create the form parameters which have been encoded to ensure that the server is not confused by certian characters.
    var params = "username=" + encodeURIComponent(usernameField.value) + "&password=" + encodeURIComponent(passwordField.value);

    request.open("POST", "/api/create-account", true); //Establish the request.
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); //Content type

    request.onreadystatechange = () => { //Called when the request's state changes.
      if (request.readyState == XMLHttpRequest.DONE && request.statusCode == 200){
        console.log(request.responseText);
      }
    }

    request.send(params);
  }
}
