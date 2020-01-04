const fs = require('fs');
const {
    google
} = require('googleapis');
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = 'token.json';

module.exports.tokenAuth = (client, token) => {
    client.setCredentials(token);
}
module.exports.getClient = (credentials) => {
    const {
        client_secret,
        client_id,
        redirect_uris
    } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);
    return oAuth2Client;
};

module.exports.getAuthUrl = (oAuth2Client) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    return authUrl;
};

module.exports.getToken = (oAuth2Client, code) => {
    oAuth2Client.getToken(code, (err, token) => {
        oAuth2Client.setCredentials(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) console.error(err);
            console.log("Saved token to " + TOKEN_PATH);
        });
    });
};

module.exports.getChannels = (auth, SPREADSHEET_ID) => {
    let sheets = google.sheets({
        version: 'v4',
        auth
    });
    console.log(auth);
    console.log(SPREADSHEET_ID);
    sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        var sheetid = res.data.sheets[1].properties.sheetId;
        removeEmptyRow(sheetid);

    });
    /*
    sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "'Mexico (Transfer)'!G2:G",
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        console.log(rows);
        rows.forEach()
        
    });
    */
}
/*
module.exports.rejectChannel = (auth, spreadsheetId) => {
    let sheets = google.sheets({
        version: 'v4',
        auth
    });
    sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,

    })
}
*/

function removeEmptyRow(sheetId) {
    let requests = []
    let request = {
        deleteDimension: {
            range: {
                sheetId:sheetId,
                dimension: "ROWS",
                startIndex:0,
                endIndex:1
            }
        }
    }
    requests.push(request);
    const updateReq = {requests};
    sheets.spreadsheets.batchUpdate({
        spreadsheetId:SPREADSHEET_ID,
        resource: updateReq, 
    }, (err, response)=>{
        if (err) console.error(err);
        console.log("Updated rows");
        console.log(response);
    });


}