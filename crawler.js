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

patchEmotUrl()
let k = 1
setInterval(() => {
  console.log('==========================\n')
  console.log(`执行 ${k}`)
  k += 1
  patchEmotUrl()
}, 60000)


