export const PROJECT_NAME = "NPMRDS";

let API_HOST = "https://dmsserver.availabs.org";
<<<<<<< HEAD
let NPMRDS_API_HOST = "https://graph.availabs.org";
=======
>>>>>>> 8357f1e941b5f6dee5ca66d42a367f6c1e374484
let AUTH_HOST = "https://dmsserver.availabs.org";
let CLIENT_HOST = "https://transportny.org";
let DAMA_HOST = "https://graph.availabs.org";
let GRAPH_HOST = "https://graph.availabs.org";

if (process.env.NODE_ENV === "development") {
<<<<<<< HEAD
  // API_HOST = "http://localhost:3001";
  // DAMA_HOST = "http://localhost:4444";
  // CLIENT_HOST = "localhost:5173";
  // AUTH_HOST = "http://localhost:3001";
  // NPMRDS_API_HOST = http://localhost:4444
}

export { API_HOST, AUTH_HOST, CLIENT_HOST, DAMA_HOST, NPMRDS_API_HOST };
=======
  // API_HOST = "http://localhost:4444";
  // AUTH_HOST = "http://localhost:4444";
  // CLIENT_HOST = "localhost:5173";
  DAMA_HOST = "http://localhost:4444";
  GRAPH_HOST = "http://localhost:4444";
}

export { API_HOST, AUTH_HOST, CLIENT_HOST, DAMA_HOST, GRAPH_HOST };
>>>>>>> 8357f1e941b5f6dee5ca66d42a367f6c1e374484
