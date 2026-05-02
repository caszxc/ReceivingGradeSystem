const { app, BrowserWindow } = require("electron");
const path = require("path");

// Start backend automatically
require("../backend/server");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "icon", "PLVLogo.ico"), // ICON TO
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

<<<<<<< HEAD
  // Load production build - uncomment when ready for production
  const distPath = path.join(__dirname, "../frontend/dist/index.html");
  win.loadFile(distPath);

  // Dev mode: uncomment to test with Vite dev server
  // win.loadURL("http://localhost:5173");  //uncomment kapag dev mode
=======
  // DEV MODE
  win.loadURL("http://localhost:5173");

  // PROD MODE (use later)
  // win.loadFile(path.join(__dirname, "../frontend/dist/index.html"));
>>>>>>> parent of 648562f (Refactor code structure for improved readability and maintainability)
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
<<<<<<< HEAD

//////////////////---OLD CODE FOR DEV MODE---

// const { app, BrowserWindow } = require("electron");
// const path = require("path");

// // Start backend automatically
// require("../backend/server");

// function createWindow() {
//   const win = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     icon: path.join(__dirname, "icon", "PLVLogo.ico"), // ICON TO
//     webPreferences: {
//       preload: path.join(__dirname, "preload.js"),
//       contextIsolation: true,
//     },
//   });

//   // DEV MODE
//   win.loadURL("http://localhost:5173");

//   // PROD MODE (use later)
//   // win.loadFile(path.join(__dirname, "../frontend/dist/index.html"));
// }

// app.whenReady().then(createWindow);

// app.on("window-all-closed", () => {
//   if (process.platform !== "darwin") app.quit();
// });
=======
>>>>>>> parent of 648562f (Refactor code structure for improved readability and maintainability)
