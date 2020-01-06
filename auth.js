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

module.exports.getToken = (oAuth2Client, code, callback) => {
    oAuth2Client.getToken(code, (err, token) => {
        oAuth2Client.setCredentials(token);
        console.log(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) console.error(err);
            console.log("Saved token to " + TOKEN_PATH);
            if(callback){
                callback();
            }
        });
    });
};
//row_index, spreadsheet_index, 
module.exports.deleteRow = (row_index, auth, spreadsheetId, sheetId) => {
    let sheets = google.sheets({
        version: 'v4',
        auth
    });
    sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        let requests = [];
        let request = {
            deleteDimension: {
                range: {
                    sheetId: sheetId,
                    dimension: "ROWS",
                    startIndex: row_index,
                    endIndex: row_index+1
                }
            }
        }
        requests.push(request);
        const updateReq = {
            requests
        };
        sheets.spreadsheets.batchUpdate({
            spreadsheetId: spreadsheetId,
            resource: updateReq,
        }, (err, response) => {
            if (err) console.error(err);
            console.log("Updated rows");
        });

    });
}
module.exports.getChannels = async (subsheet, auth, spreadsheetId, range) => {
    let sheets = google.sheets({
        version: 'v4',
        auth
    });
    let res = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `'${subsheet}'${range}`,
    });

    let data = getDataMap(res);
    return data;
}
const getDataMap = (res) => {
    const rows = res.data.values;
    let arr = [];
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].length > 0) {
            let map = {};
            map['position'] = i + 2;
            map['channel'] = rows[i];
            arr.push(map);
        }
    }
    return arr;
}


module.exports.getSheetId = async (auth, spreadsheetId, sheetName) => {
    let sheets = google.sheets({
        version: 'v4',
        auth
    });
    let res = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
    });
    let sheetId;
    for (var i = 0; i < res.data.sheets.length; i++) {
        if (res.data.sheets[i].properties.title === sheetName) {
            sheetId = res.data.sheets[i].properties.sheetId;
        }
    }
    return sheetId;
}

//remove index item from the dataMap
module.exports.shiftDataMap = (index, data) => {
    let newArr = [];
    for (var i = 0; i < index; i++) {
        newArr.push(data[i]);
    }
    for (var i = index + 1; i < data.length; i++) {
        newArr.push({
            'position': data[i].position - 1,
            'channel': data[i].channel
        });
    }
    return newArr;

}