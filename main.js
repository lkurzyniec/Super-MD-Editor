const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs')
const settings = require('electron-settings');

const reload = require('electron-reload');  //reload application after changes
const isDev = require('electron-is-dev');   //determine is DEV env

if (isDev) {
    const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron');  //get electron path
    //reload(__dirname, { electronPath: electronPath });  //watch root folder, if changes then run electron (here is the path)
}

const APP_NAME = 'Super-MD-Editor';
let mainWindow = null,
    filePath = null;

app.on('ready', () => {
    mainWindow = new BrowserWindow({ show: false });
    mainWindow.maximize();
    mainWindow.loadURL('file://' + path.join(__dirname, 'index.html'));

    require('devtron').install();
    //mainWindow.openDevTools();

    setTitle()
    if (settings.has('filePath')) {
        filePath = settings.get('filePath')
    }
    
    mainWindow.webContents.on('did-finish-load', () => {
        if (filePath != null) {
            openFile(filePath)
            setTitle()
        }
        mainWindow.show();
    })

    mainWindow.on('closed', () => {
        if (filePath != null) {
            settings.set('filePath', filePath)
        }
        mainWindow = null;
    });
});

function openFile(fileToOpen) {
    if (!fileToOpen) {
        const files = dialog.showOpenDialog(mainWindow, {
            properties: ['openfile'],
            filters: [
                { name: 'Markdown files', extensions: ['md', 'txt'] },
                { name: 'All files', extensions: ['*'] }
            ],
            title: 'Choose MD file to open',
            buttonLabel: 'Open MD',
            defaultPath: app.getPath('documents')
        })

        if (!files) {
            return;
        }

        filePath = files[0];
    } else {
        filePath = fileToOpen;
    }

    const content = fs.readFileSync(filePath).toString()
    mainWindow.webContents.send('file-opened', content)
    setTitle()
}

function saveFile(content, isSaveAs, isHtml) {
    if (filePath == null || isSaveAs) {
        var type = isHtml ? 'HTML' : 'MD',
            ext = type.toLowerCase();
        dialog.showSaveDialog(mainWindow, {
            filters: [
                { name: `${type} file`, extensions: [ext] },
                { name: 'All files', extensions: ['*'] }
            ],
            title: `Where to save ${type}`,
            buttonLabel: `Save ${type}`,
            defaultPath: app.getPath('documents'),
        }, function (selectedFile) {
            if (!selectedFile) {
                return;
            }

            filePath = selectedFile;
            save(content)
        })
    } else {
        save(content)
    }
}

exports.closeFile = function () {
    settings.set('filePath', null)
    filePath = null
    setTitle()    
}

save = function (content) {
    fs.writeFileSync(filePath, content)
    mainWindow.webContents.send('file-saved')
    setTitle()
}

function setTitle() {
    if (filePath == null) {
        mainWindow.setTitle(`${APP_NAME}`);
        return;
    }
    mainWindow.setTitle(`${APP_NAME} - ${path.basename(filePath)}`);
}

app.on('window-all-closed', () => {
    app.quit();
});

exports.saveFile = saveFile;
exports.openFile = openFile;
exports.APP_NAME = APP_NAME;