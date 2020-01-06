const {
    app,
    BrowserWindow,
    shell,
    ipcMain
} = require('electron');
const fs = require('fs');
const auth = require('./auth');
const TOKEN_PATH = 'token.json';
//authorization and client windows (BrowserWindows)
let win;
let clientwin;
// client = oAuth2Client, data from dump.json and google sheet
let client;
let data;
let dataMap;
let config;
// spreadsheet info, subsheet id, range of the channel ids
let spreadsheetId;
let spreadsheetName;
let sheetId;
let rangeInput;
//current spot in the google sheet
let currentIndex;
//open authorization url if needed
function openUrl() {
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Sheets API.
        client = auth.getClient(JSON.parse(content));
        const url = auth.getAuthUrl(client);
        shell.openExternal(url);
    });

}

//load crawled data and position
function loadConfig() {
    fs.readFile('dump.json', (err, channels) => {
        data = JSON.parse(channels);
        console.log("Loaded data");
    });
    fs.readFile('config.json', (err, content) => {
        config = JSON.parse(content);
        currentIndex = config['currentPosition'];
        spreadsheetId = config['spreadsheetId'];
        spreadsheetName = config['subsheetName'];
        rangeInput = config['range'];
        console.log("Loaded position");
        console.log('current index ' + currentIndex);
    });
}

//create the main application window
function createClientWindow() {
    clientwin = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
    clientwin.loadFile('index.html');
    auth.getSheetId(client, spreadsheetId, spreadsheetName).then((res) => {
        sheetId = res;
        console.log('Loaded sheet id');
    }).catch(() => console.log('Sheet id err'));
    auth.getChannels(spreadsheetName, client, spreadsheetId, rangeInput).then((res) => {
        dataMap = res;
        console.log(dataMap);
        var code = `var ipcRenderer = require('electron').ipcRenderer;
                var iframe = document.getElementById('video');
                ipcRenderer.on('loadVideo', (event, args)=>{
                    console.log(args);
                    iframe.setAttribute('src', args);
                });
                var rejectButton = document.getElementById('rejectButton');
                rejectButton.addEventListener('click', () =>{
                    ipcRenderer.send('rejectSubmit');
                });
                var forwardButton = document.getElementById('forwardButton');
                forwardButton.addEventListener('click', ()=>{
                    ipcRenderer.send('forwardClick');
                });
                var backButton = document.getElementById('backButton');
                backButton.addEventListener('click', () => {
                    ipcRenderer.send('backClick');
                });`

        clientwin.webContents.executeJavaScript(code).then(() => {
            clientwin.webContents.send('loadVideo', data[dataMap[currentIndex].channel]);
        }).catch(() => console.log('Load video err'));
    }).catch(() => console.log('Load channels err'));
    client.on('close', () => {
        client = null;
    });
}

//create the authorization window
function createAuthWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.loadFile('authenticate.html');
    //open the auth url
    openUrl();
    var code = `
                var ipcRenderer = require('electron').ipcRenderer;
                var button = document.getElementById('submit');
                button.addEventListener('click', () =>{
                    var data = document.getElementById('authorizationField').value
                    ipcRenderer.send('authSubmit', data);
                });`;
    //inject javascript into renderer
    win.webContents.executeJavaScript(code);
    // Emitted when the window is closed.
    win.on('closed', () => {
        win = null
    });

}

//authorize the user
ipcMain.on('authSubmit', (event, args) => {
    console.log(args);
    auth.getToken(client, args, createClientWindow);

});

//fires when the reject button is clicked on index.html
ipcMain.on('rejectSubmit', (event, args) => {
    auth.deleteRow(dataMap[currentIndex].position - 1, client, spreadsheetId, sheetId);
    console.log('current index ' + currentIndex);
    dataMap = auth.shiftDataMap(currentIndex, dataMap);
    event.reply('loadVideo', data[dataMap[currentIndex].channel]);
});

//fires when the back button is clicked on index.html
ipcMain.on('backClick', (event, args) => {
    if (currentIndex > 0) {
        currentIndex--;
    }
    console.log('current index ' + currentIndex);
    console.log(dataMap[currentIndex].channel);
    event.reply('loadVideo', data[dataMap[currentIndex].channel]);
    config.currentPosition = currentIndex;
    fs.writeFile('config.json', JSON.stringify(config), (err) => {
        if (err) console.log('Err');
    });
});
//fires when the forward button is clicked on index.html
ipcMain.on('forwardClick', (event, args) => {
    if (currentIndex < Object.keys(dataMap).length - 1) {
        currentIndex++;
    }
    console.log('current index ' + currentIndex);
    console.log(dataMap[currentIndex].channel);
    event.reply('loadVideo', data[dataMap[currentIndex].channel]);
    config.currentPosition = currentIndex;
    fs.writeFile('config.json', JSON.stringify(config), (err) => {
        if (err) console.log('Err');
    });

});
app.on('ready', () => {
    fs.readFile(TOKEN_PATH, (err, token) => {
        loadConfig();
        //open auth window if client has not been verified
        if (err) {
            console.log("Token err");
            createAuthWindow();
        } else {
            //read credentials file and authorize
            fs.readFile('credentials.json', (err, content) => {
                if (err) return console.log('Error loading client secret file:', err);
                // Authorize a client with credentials, then call the Google Sheets API.
                client = auth.getClient(JSON.parse(content));
                client.setCredentials(JSON.parse(token));
                createClientWindow();
            });
        }
    });
});
// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (win === null) {
        createWindow()
    }
})