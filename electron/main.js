const { app, BrowserWindow } = require("electron");
const path = require("path");

// Detect if running on server or client
const isServerMode = process.env.SERVER_MODE === "true";

if (isServerMode) {
  // Start backend only on server PC
  require("../backend/server");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "icon", "PLVLogo.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  // Load production build - uncomment when ready for production
  // const distPath = path.join(__dirname, "../frontend/dist/index.html");
  // win.loadFile(distPath);

  // Dev mode: uncomment to test with Vite dev server
  win.loadURL("http://localhost:5173");  //uncomment kapag dev mode
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

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
