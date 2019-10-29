/*
File loader for the client. This uses XMLHTTPRequests instead of the node requests.
*/

import {FileLoader} from "../Common/FileLoader";

export class ClientFileLoader implements FileLoader {

  /**Load the config using an XHR request.*/
  public loadConfig():Promise<object>{
    return new Promise((resolve:(obj:object)=>void,reject:(errCode:number)=>void)=>{ //Async promise
      const xhrRequest:XMLHttpRequest = new XMLHttpRequest();

      xhrRequest.onreadystatechange = ()=>{ //On XHR state change.
        if (xhrRequest.readyState === XMLHttpRequest.DONE){ //When the page is ready
          if (xhrRequest.status == 200){ //File could be retrieved
            resolve(JSON.parse(xhrRequest.responseText)); //Parse the reponse text into an object.
          } else {
            console.error("Something bad happened while loading the config file. Error: " + xhrRequest.status) //Log error in console.
            reject(xhrRequest.status);
          }
        }
      }

      xhrRequest.open("GET","/static/Game/config.json",true); //Open and send the request to the server.
      xhrRequest.send();
    });
  }
}
