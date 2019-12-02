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

  /**Load <name>.json file. This used to exclusively do resources.json but is now adaptable for more files*/
  public loadJSONFile(name:string):Promise<object>{ //Despite being similar to the loadconfig function this is not implemented from an interface.
    return new Promise((resolve:(obj:object)=>void,reject:(errCode:number)=>void)=>{ //Async promise.
      const xhrRequest:XMLHttpRequest = new XMLHttpRequest();

      xhrRequest.onreadystatechange = ()=>{ //XHR state change.
        if (xhrRequest.readyState === XMLHttpRequest.DONE){ //Wait for request to finish.
          if (xhrRequest.status === 200){ //Status code 200 means that the file was found.
            let objectJSON:object = JSON.parse(xhrRequest.responseText); //Parse the response JSON.
            resolve(objectJSON); //Resolve with the asset registry.
          } else { //There was a problem loading the asset registry.
            console.error("The asset registry failed to load! Error: " + xhrRequest.status);
            reject(xhrRequest.status);
          }
        }
      };

      xhrRequest.open("GET","/static/game/src/resources/"+name+".json"); //Create the request with a URL.
      xhrRequest.send(); //Send request.
    });
  }
}
