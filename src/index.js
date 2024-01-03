const { app, BrowserWindow, Menu, nativeTheme } = require('electron');
const path = require('path');
const electronLog = require('electron-log');
const contextMenu = require('electron-context-menu');
const Store = require('electron-store');
const menu = require('./menu.js');

const store = new Store();

try {
  require('electron-reloader')(module)
} catch (err) {}

// Initialize Electron remote module
require('@electron/remote/main').initialize();

// Restrict main.log size to 100Kb
electronLog.transports.file.maxSize = 1024 * 100;

// Get app details from package.json
const appName = app.getName();
const appVersion = app.getVersion();
// Export Electron versions
const electronVer = process.versions.electron;
const chromeVer = process.versions.chrome;
const nodeVer = process.versions.node;
const v8Ver = process.versions.v8;

// Are we on Windows?
const isWin = process.platform === 'win32';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {
  win = new BrowserWindow({
    title: 'Relay IRC',
    width: 1024,
    height: 800,
    minHeight: 340,
    minWidth: 680,
    useContentSize: true,
    icon: isWin ? path.join(__dirname, 'static/icon.ico') : path.join(__dirname, 'static/icon64.png'),
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      experimentalFeatures: true,
      webviewTag: true,
      devTools: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'static/client-preload.js')
    }
  });
  require('@electron/remote/main').enable(win.webContents);

  // Emitted when the window is closing
  win.on('close', () => {
    if (win) {
      store.set('windowDetails', {
        position: win.getPosition(),
        size: win.getSize()
      });
      electronLog.info('Saved windowDetails.');
    } else {
      electronLog.error('Error: Window was not defined while trying to save windowDetails.');
    }
  });

  const windowDetails = store.get('windowDetails');

  win.setSize(
    windowDetails.size[0],
    windowDetails.size[1]
  );
  win.setPosition(
    windowDetails.position[0],
    windowDetails.position[1]
  );

  // const iconPath = `${__dirname}/static/dock-icon.png`
  // if (process.platform === 'darwin') {
    // macOS
    // app.dock.setIcon(iconPath)
  // } else {
    // Windows, Linux, etc.
    // win.setIcon(iconPath)
  // }

  // And load the index.html of the app.
  /* eslint-disable quotes */
  win.loadURL(path.join(`file://${__dirname}`, `index.html`));

  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  });

  if (process.env.NODE_ENV === 'development') {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
      REDUX_DEVTOOLS
    } = require('electron-devtools-installer')

    installExtension([REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS])
      .then((name) => electronLog.info(`Added Extension:  ${name}`))
      .catch((err) => electronLog.warn('An error occurred: ', err))

    win.webContents.openDevTools({ mode: 'detach' });
  }

  // Dark mode
  nativeTheme.themeSource = 'dark';

  // Create The Menubar
  Menu.setApplicationMenu(menu(app, win));
}

contextMenu({
  // Chromium context menu defaults
  showSelectAll: true,
  showCopyImage: true,
  showCopyImageAddress: true,
  showSaveImageAs: true,
  showCopyVideoAddress: true,
  showSaveVideoAs: true,
  showCopyLink: true,
  showSaveLinkAs: true,
  showInspectElement: true,
  showLookUpSelection: true,
  showSearchWithGoogle: true,
  prepend: (defaultActions, parameters) => [
  {
    label: 'Open Video in New Window',
    // Only show it when right-clicking video
    visible: parameters.mediaType === 'video',
    click: () => {
      const newWin = new BrowserWindow({
      title: 'New Window',
      width: 1024,
      height: 768,
      useContentSize: true,
      webPreferences: {
        nodeIntegration: false,
        experimentalFeatures: true,
        devTools: true
      }
      });
      const vidURL = parameters.srcURL;
      newWin.loadURL(vidURL);
      electronLog.info('Opened ' + vidURL + ' in new window');
    }
  },
  {
    label: 'Open Link in New Window',
    // Only show it when right-clicking a link
    visible: parameters.linkURL.trim().length > 0,
    click: () => {
      const newWin = new BrowserWindow({
      title: 'New Window',
      width: 1024,
      height: 768,
      useContentSize: true,
      webPreferences: {
        nodeIntegration: false,
        experimentalFeatures: true,
        devTools: true
      }
      });
      const toURL = parameters.linkURL;
      newWin.loadURL(toURL);
      electronLog.info('Opened ' + toURL + ' in new window');
    }
  }]
});

// Chromium cmdline flags
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-quic');
app.commandLine.appendSwitch('force-dark-mode');
app.commandLine.appendSwitch('enable-local-file-accesses');

// Enable remote debugging only if we in development mode
if (process.env.NODE_ENV === 'development') {
  app.commandLine.appendSwitch('remote-debugging-port', '9222');
  electronLog.warn('Note: Remote debugging port 9222 open');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async() => {
  // Show versions
  if (process.argv.some(arg => arg === '-v' || arg === '--version')) {
    console.log(`\n  ` + appName + ` Version: ` + appVersion);
    console.log(`  Electron Version: ` + electronVer);
    console.log(`  Chromium Version: ` + chromeVer);
    console.log(`  NodeJS Version: ` + nodeVer);
    console.log(`  V8 Version: ` + v8Ver + '\n');
    app.quit();
  } else {
  console.log('\n');
  electronLog.info('Welcome to Relay IRC!');
  createWindow();
  }
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

app.on('will-quit', () => {
  electronLog.info('app.quit()');
});
