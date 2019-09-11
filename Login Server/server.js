"use strict"; //Prevent odd JS behavior.

const https = require('https');
const fs = require('fs');

const loginPage = fs.readFileSync("./login.html");

https.createServer({
  cert: fs.readFileSync("./.secret/MyCertificate.crt"),
  key: fs.readFileSync("./.secret/MyKey.key")
},(req,res) => {
  res.writeHead(200);
  res.end(loginPage);
}).listen(443);
