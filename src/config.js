export const PROJECT_NAME = "NPMRDS";

let API_HOST = "https://graph.availabs.org";
let AUTH_HOST = "https://graph.availabs.org";
let CLIENT_HOST = "https://transportny.org";
let DAMA_HOST = "https://graph.availabs.org";

if (process.env.NODE_ENV === "development") {
<<<<<<< HEAD
  //API_HOST = "http://localhost:4444";
  //DAMA_HOST = "http://localhost:4444";
  //CLIENT_HOST = "localhost:5173";
  // AUTH_HOST = "http://localhost:4444";
=======
  API_HOST = "http://localhost:4444";
  DAMA_HOST = "http://localhost:4444";
  CLIENT_HOST = "localhost:5173";
  AUTH_HOST = "http://localhost:4444";
>>>>>>> 762a0a62e623be7fcc3bd58c698227ea880df081
}

export { API_HOST, AUTH_HOST, CLIENT_HOST, DAMA_HOST };
