<<<<<<< HEAD
// export const BASE_URL = "http://localhost:3001"; //uncomment kapag dev mode, comment out kapag deploy locally
export const BASE_URL = import.meta.env.VITE_API_URL; //uncomment kapag deploy locally, comment out kapag dev mode
=======
export const BASE_URL = "http://localhost:3001";
// export const BASE_URL = "http://192.168.254.146:3001";
>>>>>>> parent of e454cec (Refactor database connection to use environment variables; update server configuration for dynamic host and port; modify frontend API base URL; implement HashRouter for routing; add .env files for backend and frontend configurations.)
