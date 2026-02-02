const { app, BrowserWindow } = require("electron");
const path = require("path");

// Start backend automatically
require("../backend/server");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });

  // DEV MODE
  win.loadURL("http://localhost:5173");

  // PROD MODE (use later)
  // win.loadFile(path.join(__dirname, "../frontend/dist/index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
