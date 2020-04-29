// ===================================
//  https://www.pmdaniu.com/explore/rp
//
//  原型资源下载
//
//

var request = require('request');
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
let $ = null
const dirPreix = ['组件', '系统', 'PRD', '模板']
const PAGESIZE = 31

function writeFile (file, value, callback) {
  fs.writeFile(path.resolve(__dirname, file), value, () => {
    console.log('File Created: ', file)
    callback && callback()
  })
}

// 获取某页的 RP 信息
function getRpInfoList (i = 1) {
  return new Promise((resolve, reject) => {
    const RPInfoList = []
    request(`https://www.pmdaniu.com/explore/rp?page=${i}`, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        body = body.replace(/[\n\t]/g, '')
        $ = cheerio.load(body)
        const rpItemList = $('.home-rp_item')
        for (let i = rpItemList.length - 1; i >= 0; i--) {
          const rpItem = parseRPItem(rpItemList[i])
          rpItem && RPInfoList.push(rpItem)
        }
        resolve(RPInfoList)
      } else {
        reject(error)
      }
    })
  })
}

// 获取可下载的 RP 信息
function parseRPItem (rpItem) {
  if (!rpItem) return ''
  const hasDownloadText = $(rpItem).find('.home-rp_item_num').text()
  const canDownload = hasDownloadText.indexOf('下载') !== -1
  if (!canDownload) return ''
  const rpName = $(rpItem).find('a').text()
  const rpLink = $(rpItem).find('a').prop('href')
  const rpTags = $(rpItem).find('.home-tag')
  const rpDesc = $(rpItem).find('.home-tag').text()
  let rpTag = '系统'
  for (let i = 0; i < rpTags.length; i++) {
    const item = rpTags[i]
    if (dirPreix.includes($(item).text())) {
      rpTag = $(item).text()
      return
    }
  }
  return {
    name: rpName,
    link: rpLink,
    tag: rpTag,
    desc: rpDesc
  }
}

function patchEmotUrl () {
  for (let i = 1; i < 625; i++) {
    getEmotUrlList(i).then((emotUrlArray) => {
      console.log(emotUrlArray)
      writeFile(`emot/${i}.js`, `export default ${JSON.stringify(emotUrlArray)}`)
    })
  }
}


function downloadFile(uri, filename, callback){
  if (!filename || fs.existsSync(path.resolve(__dirname, filename))) {
    callback && callback()
  }

  let dirs = []
  if (filename.includes('/')) {
    dirs = filename.split('/')

    dirs = dirs.slice(0, -1).join('/')
    if (dirs && !fs.existsSync(path.resolve(__dirname, dirs))) {
      fs.mkdirSync(path.resolve(__dirname, dirs), {
        recursive: true
      })
    }
  }
  var stream = fs.createWriteStream(filename)
  request(uri).pipe(stream).on('close', callback)
}

let RPInfoList = []
let isFinish = false

function run () {
  return new Promise((resolve, reject) => {
    isFinish = false
    const rp = RPInfoList.pop()
    downloadFile(rp.link, `rp/${rp.tag}/${rp.name}.rp`, () => {
      if (RPInfoList.length) {
        run()
        resolve(false)
      } else {
        isFinish = true
        resolve(isFinish)
      }
    })
  })
}

function thread (index) {
  return new Promise(async (resolve, reject) => {
    if (!RPInfoList.length) {
      RPInfoList = await getRpInfoList(index)
    }
    run().then(isFinish => {
      resolve(!!isFinish)
    })
  })
}

let index = PAGESIZE
async function start () {
  const isFinish = await thread(index)
  if (isFinish) {
    index--
    start()
  }
}

start()
