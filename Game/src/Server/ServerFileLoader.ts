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
        const cfgObject:object = JSON.parse(fs.readFileSync("./config.json").toString()); //Load and parse the file.
        resolve(cfgObject);
      } catch(e){ //Error handling.
        console.error("An error occured reading the config.json file on the server.")
        reject(-1);
      }
    });
  }

  /**Load a given JSON file.*/
  public loadJSONFile(name:string):Promise<object>{
    return new Promise((resolve:(obj:object)=>void,reject:(errCode:number)=>void)=>{
      try {
        const jsonObject:object = JSON.parse(fs.readFileSync("./src/resources/"+name+".json").toString()); //More file parsing.
        resolve(jsonObject);
      } catch(e){ //More error handling.
        console.error("An error occurred reading a JSON file!");
        console.error(e);
        reject(-1);
      }
    });
  }
}
