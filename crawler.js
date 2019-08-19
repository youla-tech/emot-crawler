// 斗图
var request = require('request');
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')

function writeFile (file, value) {
  fs.writeFile(path.resolve(__dirname, file), value, () => {
    console.log('File Created: ', file)
  })
}

function getEmotUrlList (i = 1) {
  return new Promise((resolve, reject) => {
    const emotUrlArray = []
    request(`https://www.doutula.com/article/list/?page=${i}`, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        body = body.replace(/[\n\t]/g, '')
        const $ = cheerio.load(body)
        const modules = $('.center-wrap .list-group-item')
        for (let i = 0; i < modules.length; i++) {
          const moduleItem = modules[i]
          let tempImageUrl = $(moduleItem).prop('href')
          if (tempImageUrl) {
            emotUrlArray.push(tempImageUrl)
          }
        }
        resolve(emotUrlArray)
      } else {
        // console.log('[Error] Request disconnect ', error)
        reject(error)
      }
    })
    // for (let i = 1; i <= 625; i++) {
    //   request(`https://www.doutula.com/article/list/?page=${i}`, {
    //     headers: {
    //       'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
    //       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
    //     },
    //   }, (error, response, body) => {
    //     if (!error && response.statusCode == 200) {
    //       body = body.replace(/[\n\t]/g, '')
    //       const $ = cheerio.load(body)
    //       const modules = $('.center-wrap list-group-item')
    //       for (let i = 0; i < modules.length; i++) {
    //         const moduleItem = modules[i]
    //         let tempImageUrl = $(moduleItem).prop('href')
    //         if (tempImageUrl) {
    //           emotUrlArray.push(tempImageUrl)
    //         }
    //       }
    //       resolve(emotUrlArray)
    //     } else {
    //       console.log('[Error] Request disconnect ', error)
    //     }
    //   })
    // }
  })
}

function patchEmotUrl () {
  for (let i = 1; i < 625; i++) {
    getEmotUrlList(i).then((emotUrlArray) => {
      console.log(emotUrlArray)
      writeFile(`emot/${i}.js`, `export default ${JSON.stringify(emotUrlArray)}`)
    })
  }
  // getEmotUrlList(1).then((emotUrlArray) => {
  //   console.log(emotUrlArray)
  //   writeFile(`emot/url.js`, `export default ${JSON.stringify(emotUrlArray)}`)
  // })
}

// patchEmotUrl()
// let k = 1
// setInterval(() => {
//   console.log('==========================\n')
//   console.log(`执行 ${k}`)
//   k += 1
//   patchEmotUrl()
// }, 10000)

function downloadFile(uri, filename, callback){
  var stream = fs.createWriteStream(filename);
  request(uri).pipe(stream).on('close', callback);
}

function download () {
  let files = fs.readdirSync('emot')
  const emotArray = []
  files.forEach(function (item, index) {
    if (item.includes('js')) {
      let data = fs.readFileSync(path.join('emot', item), 'utf8')
      data = data.slice(data.indexOf('['))
      data = JSON.parse(data)
      Array.from(data).forEach(element => {
        try {
          request(element, (error, response, body) => {
            try{
              // console.log(response.statusCode)
              if (!error && response.statusCode == 200) {
                const $ = cheerio.load(body)
                const $list = $('.artile_des')
                let title = $('.pic-title > h1 > a').text()
                title = title.slice(0, title.indexOf('（'))
                const emotGroup = {
                  title,
                  list: []
                }

                for (let i = 0; i < $list.length; i++) {
                  const obj = {}
                  const $listItem = $($list[i]);
                  const $target = $('img', $listItem)
                  console.log($target.prop('src'))
                  obj.url = $target.prop('src')
                  obj.desc = $target.prop('alt')
                  emotGroup.list.push(obj)
                  if (!fs.existsSync(path.resolve(__dirname, title))) {
                    fs.mkdirSync(path.resolve(__dirname, title))
                  }
                  let fileName = obj.url.slice(obj.url.lastIndexOf('/') + 1)
                  downloadFile(obj.url, `pics/${title}/${fileName}`, function(){
                    console.log(`${fileName} 下载成功`);
                  })
                }
                writeFile(`data/${title}.json`, `export default ${JSON.stringify(emotGroup)}`)
                emotArray.push(emotGroup)
              }
            }catch(e) {
            }
          })
        } catch(e) {

        }
      });
    }
  })
  setTimeout(() => {
    writeFile(`emot/data/emotjson.js`, `export default ${JSON.stringify(emotArray)}`)
  }, 60000)
}

let k = 1
download()
setInterval(() => {
  console.log('==========================\n')
  console.log(`执行 ${k}`)
  k += 1
  download()
}, 10000)
