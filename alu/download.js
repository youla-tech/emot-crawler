var request = require('request');
var fs = require('fs');
const path = require('path')
const ALUs = require('./alu')

function cleardir (dir) {
  Array.from(fs.readdirSync(dir)).forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isFile()) {
      fs.unlinkSync(filePath)
    }
  })
}
function writeFile (file, value) {
  fs.writeFile(path.resolve(__dirname, file), value, () => {
    console.log('File Created: ', file)
  })
}

function download(uri, filename, callback){
  var stream = fs.createWriteStream(filename);
  request(uri).pipe(stream).on('close', callback);
}

function patchDownload () {
  cleardir(path.resolve(__dirname, 'pics'))
  ALUs.forEach(item => {
    let fileName = item.locImageLink.slice(item.locImageLink.lastIndexOf('/') + 1)
    if (fileName.indexOf('.') === -1) {
      if (item.type) {
        fileName = fileName + item.type
      } else {
        fileName += '.gif'
      }
    }
    download(item.locImageLink, `pics/${fileName}`, function(){
      console.log(`${fileName} 下载成功`);
    })
  })
}

// patchDownload()

function unique () {
  let aluNameArray = []
  let files = fs.readdirSync('pics')
  files.forEach(function (item, index) {
    aluNameArray.push(item)
  })
  aluNameArray = aluNameArray.sort()
  const dataJson = []
  aluNameArray.forEach(item => {
    for (let i = 0; i < ALUs.length; i++) {
      const alu = ALUs[i];
      if (alu.locImageLink.includes(item.slice(0, item.indexOf('.')))) {
        dataJson.push({
          name: unescape(alu.title.replace(/\\/g, "%")),
          url: alu.locImageLink
        })
        continue
      }
    }
  })
  writeFile('alu.json', JSON.stringify(dataJson))
}

unique()
