const { app, BrowserWindow, dialog, Menu, shell } = require('electron');
const path = require('path');
const electronLog = require('electron-log');
const Os = require('os');
// Export app info
const appName = app.getName();
const appVersion = app.getVersion();
const userDataDir = app.getPath('userData');
const userLogFile = path.join(userDataDir, 'logs/main.log');
const userMacLogFile = path.join('/Users/usuario/Library/Logs', appName, 'main.log');

module.exports = (app, win) => {
  // Globally export what OS we are on
  const isLinux = process.platform === 'linux';
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const archType = Os.arch();

  let currentOS;
  if (isLinux) {
    currentOS = 'Linux';
  } else if (isWin) {
    currentOS = 'Windows';
  } else if (isMac) {
    currentOS = 'MacOS';
  } else {
    currentOS = 'BSD';
  }

  return Menu.buildFromTemplate([
    {
      label: appName,
      submenu: [
        {
          label: 'Go Back',
          accelerator: 'Alt+Left',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.goBack();
            const currentURL = focusedWindow.webContents.getURL();
            electronLog.info('Navigated backward to ' + [ currentURL ]);
          }
        },
        {
          label: 'Go Forward',
          accelerator: 'Alt+Right',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.goForward();
            const currentURL = focusedWindow.webContents.getURL();
            electronLog.info('Navigated forward to ' + [ currentURL ]);
          }
        },
        { type: 'separator' },
        {
          label: 'Open File',
          accelerator: 'Ctrl+Shift+O',
          click() {
            dialog.showOpenDialog({ properties: ['openFile'] }).then(result => {
            electronLog.info('Opened file: ' + result.filePaths);
            const openURI = result.filePaths
            const openWindow = new BrowserWindow({
              webPreferences: {
                nodeIntegration: false,
                experimentalFeatures: true,
                devTools: true
              }
            });
            openWindow.loadFile(openURI[0]);
            openWindow.setTitle(openURI[0])
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit'
        }
      ]
    },
    {
      role: 'editMenu',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ]
    },
    {
      role: 'viewMenu',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.reload();
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.reloadIgnoringCache();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click(item, focusedWindow) {
            const currentURL = focusedWindow.webContents.getURL();
            electronLog.info('Toggling Developer Tools on ' + currentURL);
            focusedWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Developer',
      submenu: [
        {
          label: 'Reload F5',
          accelerator: 'F5',
          visible: false,
          acceleratorWorksWhenHidden: true,
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.reload();
          }
        },
        {
          label: 'Open Log File',
          click() {
            if (isMac) {
              electronLog.info('Opening ' + [ userMacLogFile ]);
              const logWindow = new BrowserWindow({ width: 600, height: 768, useContentSize: true, title: userMacLogFile });
              logWindow.loadFile(userMacLogFile);
            } else {
              electronLog.info('Opening ' + [ userLogFile ]);
              const logWindow = new BrowserWindow({ width: 600, height: 768, useContentSize: true, title: userLogFile });
              logWindow.loadFile(userLogFile);
            }
          }
        },
        {
          label: 'Open User Data Dir',
          click() {
            electronLog.info('Opening ' + [ userDataDir ]);
            shell.openPath(userDataDir);
          }
        },
        { type: 'separator' },
        {
          label: 'Open Electron DevTools',
          accelerator: isMac ? 'Cmd+Shift+F12' : 'F12',
          click(item, focusedWindow) {
            electronLog.info('Opening Electron DevTools on mainWindow.');
            focusedWindow.openDevTools({ mode: 'detach' });
          }
        },
        {
          label: 'Open Electron DevTools Extra',
          accelerator: 'Ctrl+Shift+F12',
          visible: false,
          acceleratorWorksWhenHidden: true,
          click(item, focusedWindow) {
            electronLog.info('Opening Electron DevTools on mainWindow.');
            focusedWindow.openDevTools({ mode: 'detach' });
          }
        },
        {
          label: 'Open chrome://gpu',
          accelerator: 'CmdorCtrl+Alt+G',
          click() {
            const gpuWindow = new BrowserWindow({ width: 900, height: 700, useContentSize: true, title: 'GPU Internals' });
            gpuWindow.loadURL('chrome://gpu');
            electronLog.info('Opened chrome://gpu');
          }
        },
        {
          label: 'Open chrome://process-internals',
          accelerator: 'CmdorCtrl+Alt+P',
          click() {
            const procsWindow = new BrowserWindow({ width: 900, height: 700, useContentSize: true, title: 'Process Model Internals' });
            procsWindow.loadURL('chrome://process-internals');
            electronLog.info('Opened chrome://process-internals');
          }
        },
        {
          label: 'Open chrome://media-internals',
          accelerator: 'CmdorCtrl+Alt+M',
          click() {
            const mediaWindow = new BrowserWindow({ width: 900, height: 700, useContentSize: true, title: 'Media Internals' });
            mediaWindow.loadURL('chrome://media-internals');
            electronLog.info('Opened chrome://media-internals');
          }
        },
        {
          label: 'Restart App',
          click() {
            app.relaunch();
            app.quit();
          }
        }
      ]
    },
    {
      role: 'help',
      label: 'About',
      submenu: [
        { label: appName + ' v' + appVersion, enabled: false },
        {
          label: 'Created by Matt Brandly &&',
          click() {
            new BrowserWindow({ width: 1024, height: 768, useContentSize: true }).loadURL('https://github.com/brandly/Lax#readme');
          }
        },
        {
          label: 'Maintained by Alex313031',
          click() {
            new BrowserWindow({ width: 1024, height: 768, useContentSize: true }).loadURL('https://github.com/Alex313031/Relay-IRC#readme');
          }
        },
        { type: 'separator' },
        {
          label: 'View Humans.txt',
          accelerator: 'CmdorCtrl+Alt+H',
          click() {
            const humansWindow = new BrowserWindow({
              width: 532,
              height: 600,
              useContentSize: true,
              autoHideMenuBar: true,
              title: 'humans.txt'
            });
            humansWindow.loadFile(path.join(__dirname, 'humans.txt'));
            electronLog.info('Opened humans.txt :)');
          }
        },
        {
          label: 'View License',
          accelerator: 'CmdorCtrl+Alt+L',
          click() {
            const licenseWindow = new BrowserWindow({
              width: 532,
              height: 550,
              useContentSize: true,
              autoHideMenuBar: true,
              title: 'License'
            });
            licenseWindow.loadFile(path.join(__dirname, 'static/license.md'));
            electronLog.info('Opened license.md');
          }
        },
        {
          label: 'About App',
          accelerator: 'CmdorCtrl+Alt+A',
          click() {
            const electronVer = process.versions.electron;
            const chromeVer = process.versions.chrome;
            const nodeVer = process.versions.node;
            const v8Ver = process.versions.v8;
            const appVer = app.getVersion();
            const info = [
              'Relay IRC v' + appVer,
              '',
              'Electron : ' + electronVer,
              'Chromium : ' + chromeVer,
              'Node : ' + nodeVer,
              'V8 : ' + v8Ver,
              'OS : ' + currentOS + ' ' + archType
            ]
            dialog.showMessageBox({
              type: 'info',
              title: 'About Relay IRC',
              message: info.join('\n'),
              buttons: [('Ok')]
            });
          }
        },
        {
          label: 'About Application',
          visible: false,
          selector: 'orderFrontStandardAboutPanel:'
        }
      ]
    }
  ]);
};
