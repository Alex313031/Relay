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

// Get version info
const appName = app.getName();
const appVersion = app.getVersion();
const electronVer = process.versions.electron;
const chromeVer = process.versions.chrome;
const nodeVer = process.versions.node;
const v8Ver = process.versions.v8;

// Globally export what OS we are on
const isLinux = process.platform === 'linux';
const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

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

// Use .ico on Windows, and a 64px or less .png on other OSes.
let iconPath;
if (isWin) {
  iconPath = path.join(__dirname, 'static/icon.ico');
} else {
  iconPath = path.join(__dirname, 'static/icon64.png');
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

async function createWindow() {
  win = new BrowserWindow({
    title: 'Relay IRC',
    width: 1024,
    height: 800,
    minHeight: 340,
    minWidth: 680,
    useContentSize: true,
    icon: iconPath,
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      experimentalFeatures: true,
      webviewTag: true,
      devTools: true,
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

  if (windowDetails) {
    win.setSize(
      windowDetails.size[0],
      windowDetails.size[1]
    );
    win.setPosition(
      windowDetails.position[0],
      windowDetails.position[1]
    );
  } else {
    win.setSize(1024, 800);
  }

  //const dockIconPath = `${__dirname}/static/dock-icon.png`
  //if (process.platform === 'darwin') {
    // macOS
    //app.dock.setIcon(dockIconPath);
  //} else {
    // Windows, Linux, etc.
    //win.setIcon(dockIconPath);
  //}

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
      .catch((err) => electronLog.warn('An error occurred: ', err));

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
  showSearchWithGoogle: false,
  prepend: (defaultActions, parameters) => [
  {
    label: 'Open Link in New Window',
    // Only show it when right-clicking a link
    visible: parameters.linkURL.trim().length > 0,
    click: () => {
      const toURL = parameters.linkURL;
      const linkWin = new BrowserWindow({
        title: 'New Window',
        width: 1024,
        height: 700,
        useContentSize: true,
        darkTheme: true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          experimentalFeatures: true,
          devTools: true
        }
      });
      linkWin.loadURL(toURL);
      electronLog.info('Opened Link in New Window');
    }
  },
  {
    label: "Search with Google",
    // Only show it when right-clicking text
    visible: parameters.selectionText.trim().length > 0,
    click: () => {
      const queryURL = `${encodeURIComponent(parameters.selectionText)}`
      const searchURL = `https://google.com/search?q=${encodeURIComponent(parameters.selectionText)}`;
      const searchWin = new BrowserWindow({
        width: 1024,
        height: 700,
        useContentSize: true,
        darkTheme: true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          experimentalFeatures: true,
          devTools: true
        }
      });
      searchWin.loadURL(searchURL);
      electronLog.info('Searched for "' + queryURL + '" on Google');
    }
  },
  {
    label: 'Open Image in New Window',
    // Only show it when right-clicking an image
    visible: parameters.mediaType === 'image',
    click: () => {
      const imgURL = parameters.srcURL;
      const imgTitle = imgURL.substring(imgURL.lastIndexOf('/') + 1);
      const imgWin = new BrowserWindow({
        title: imgTitle,
        useContentSize: true,
        darkTheme: true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          experimentalFeatures: true,
          devTools: true
        }
      });
      imgWin.loadURL(imgURL);
      electronLog.info('Opened Image in New Window');
    }
  },
  {
    label: 'Open Video in New Window',
    // Only show it when right-clicking a video
    visible: parameters.mediaType === 'video',
    click: () => {
      const vidURL = parameters.srcURL;
      const vidTitle = vidURL.substring(vidURL.lastIndexOf('/') + 1);
      const vidWin = new BrowserWindow({
        title: vidTitle,
        useContentSize: true,
        darkTheme: true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          experimentalFeatures: true,
          devTools: true
        }
      });
      vidWin.loadURL(vidURL);
      electronLog.info('Popped out Video');
    }
  }]
});

// Chromium cmdline flags
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-quic');
app.commandLine.appendSwitch('force-dark-mode');
// app.commandLine.appendSwitch('enable-local-file-accesses');

// Enable remote debugging only if we are in development mode
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
    console.log(`  V8 Version: ` + v8Ver);
    console.log(`  OS: ` + currentOS + '\n');
    app.quit();
  } else {
    console.log('\n');
    electronLog.info('Welcome to Relay IRC!');
    createWindow();
  }
})

// Create a second window
app.on('new-window', () => {
  electronLog.info('Secondary Windows not implemented yet.');
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit();
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
