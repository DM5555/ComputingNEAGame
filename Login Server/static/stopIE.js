//WARNING FOR INTERNET EXPLORER
function checkIE(){
  if (navigator.userAgent.indexOf("MSIE") !== -1 || navigator.userAgent.indexOf("Trident") !== -1){ //Check for IE.
    var infoBox = document.getElementById("infoBox");
    var infoMsg = document.getElementById("infoMsg");

    infoMsg.innerText = "You are using Internet Explorer. This is really not advised and will lead to big problems with this site! Continue at your own risk or use another browser.";

    infoBox.style.backgroundColor = "#fa4d4d"; //Red
    infoBox.style.display = "inline-block";
  }
}
window.addEventListener("load",checkIE);
