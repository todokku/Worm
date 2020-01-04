const {
    app,
    BrowserWindow,
    shell,
    ipcMain
} = require('electron');
const fs = require('fs');
const auth = require('./authorize');
const TOKEN_PATH = 'token.json';
let win;
let clientwin;
let client;
let data;
let spreadsheetId;

//open authorization url
function openUrl() {
    fs.readFile('credentials.json', (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Google Sheets API.
        client = auth.getClient(JSON.parse(content));
        const url = auth.getAuthUrl(client);
        shell.openExternal(url);
    });

}

//load crawled data
function loadData() {
    fs.readFile('crawler/fetchcheckpoint/dump.json', (err, channels) => {
        data = JSON.parse(channels);
        console.log("Loaded data");
    });
}

//create the client window
function createWindow() {
    clientwin = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });
    clientwin.loadFile('spreadsheet.html');
    var code = `var ipcRenderer = require('electron').ipcRenderer;
                var button = document.getElementById('spreadsheetsubmit');
                button.addEventListener('click', () =>{
                    ipcRenderer.send('sheetIdSubmit', document.getElementById('spreadsheetId').value);
                });`;
    clientwin.webContents.executeJavaScript(code);

    clientwin.on('close', () => {
        clientwin = null;
    });
}

//attach google sheets to the client page
function attachSheets() {

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
    auth.getToken(client, args);
    createWindow();
    win.close();
});

ipcMain.on('sheetIdSubmit', (event, args) => {
    spreadsheetId = args;
    clientwin.loadFile('index.html');
    auth.getChannels(client, spreadsheetId);
});
//app.on('ready', createAuthWindow)
app.on('ready', () => {
    fs.readFile(TOKEN_PATH, (err, token) => {
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
                createWindow();
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