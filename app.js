const MarkdownIt = require('markdown-it'),
    md = new MarkdownIt();

const dragDrop = require('drag-drop')

const ncp = require("copy-paste"),
    notifier = require('node-notifier'),
    path = require('path');

const { ipcRenderer, remote, shell } = require('electron');
const mainProcess = remote.require('./main.js');

const $ = selector => document.querySelector(selector)

const raw = $('.raw-markdown'),
    html = $('.rendered-html');

ipcRenderer.on('file-opened', (event, content) => {
    raw.value = content;
    render();
})
ipcRenderer.on('file-saved', () => {
    alert('File saved successfully!')
})

dragDrop('body', function (files, pos) {
    if (!files) {
        return;
    }

    var file = files[0];
    if (!file.name.toLowerCase().endsWith('.md')) {
        alert('No MD file!')
        return false;
    }

    mainProcess.openFile(file.path)
  })

$('#open-file').onclick = () => {
    mainProcess.openFile();
}

$('#save-html').onclick = () => {
    if (html.innerHTML.length <= 0) {
        alert('Nothing to save')
        return false;
    }
    save(html.innerHTML, true, true)
}

$('#save-file').onclick = () => {
    save()
}

$('#save-file-as').onclick = () => {
    save(null, true)
}

save = function (content, isSaveAs, isHtml) {
    mainProcess.saveFile(content || raw.value, isSaveAs || false, isHtml || false);
}

$('#copy-html').onclick = () => {
    if (html.innerHTML.length <= 0) {
        alert('Nothing to copy')
        return false;
    } 

    ncp.copy(html.innerHTML, function () {
        notifier.notify({
            'title': mainProcess.APP_NAME,
            'message': 'HTML copied!'
        });
    })
}

$('#close-file').onclick = () => {
    html.innerHTML = ''
    raw.value = ''
    mainProcess.closeFile()
}

raw.onkeyup = () => {
    render();
}

render = function () {
    var result = md.render(raw.value);
    html.innerHTML = result;
}

document.body.onclick = function (event) {
    if (event.target.matches('a[href^="http"]')) {
        event.preventDefault()
        shell.openExternal(event.target.href)
    }
}