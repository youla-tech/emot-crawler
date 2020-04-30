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
async function parseRPItem (rpItem) {
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

  const link = await fetchFileUri(rpLink.replace('detail', 'download'))
  console.log('Get Link ', link)

  return {
    name: rpName,
    link: link,
    tag: rpTag,
    desc: rpDesc
  }
}

function fetchFileUri (link) {
  return new Promise(resolve =>{
    request(link, {
      headers: {
        Cookie: 'Hm_lvt_d642623fc3f6afb8c874ae3bfbbd8391=1588057863,1588057880; daniu=7TZXMOvhpk5M4nRBU1N9YN9phJyhDAIQmr9xz8sa; Hm_lvt_7f14406901827f30750e659db6c1ab68=1588149546; Hm_lpvt_7f14406901827f30750e659db6c1ab68=1588149584; Hm_lvt_d3db21ed7b338b6b97b365817a4dd104=1588151844; Hm_lpvt_d3db21ed7b338b6b97b365817a4dd104=1588151844; Hm_lpvt_d642623fc3f6afb8c874ae3bfbbd8391=1588218119',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
      }
    }, (error, response, body) => {
      resolve(response.request.href)
        console.log('Fetch File Uri ----- ', response.request.href)
    })
  })
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

function run () {
  return new Promise((resolve, reject) => {
    const rp = RPInfoList.shift()
    console.log('\n\t')
    console.log('Saving File ', `rp/${rp.tag}/${rp.name}.rp`)
    downloadFile(rp.link, `rp/${rp.tag}/${rp.name}.rp`, () => {
      if (RPInfoList.length) {
        run()
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

function thread (index) {
  return new Promise(async (resolve, reject) => {
    if (!RPInfoList.length) {
      const list = await getRpInfoList(index)
      RPInfoList = RPInfoList.concat(list)
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
