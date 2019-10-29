/*
This is the server file loader.
*/
import {FileLoader} from "../Common/FileLoader";
import fs = require("fs");

export class ServerFileLoader implements FileLoader {

  /**Load the config from the config.json file.*/
  public loadConfig():Promise<object>{
    return new Promise((resolve:(obj:object)=>void,reject:(errCode:number)=>void)=>{
      try {
        const cfgObject:object = JSON.parse(fs.readFileSync(__dirname + "/../config.json").toString());
        resolve(cfgObject);
      } catch(e){
        console.error("An error occured reading the config.json file on the server.")
        reject(-1);
      }
    });
  }
}
