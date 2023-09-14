export const PROJECT_NAME = "NPMRDS";

let API_HOST = "https://graph.availabs.org";
let AUTH_HOST = "https://availauth.availabs.org";
let CLIENT_HOST = "https://transportny.org";
let DAMA_HOST = "https://graph.availabs.org";

if (process.env.NODE_ENV === "development") {
  API_HOST = "https://graph.availabs.org";
  CLIENT_HOST = "localhost:3000";
  //DAMA_HOST = "http://localhost:3369";
}

export { API_HOST, AUTH_HOST, CLIENT_HOST, DAMA_HOST };

