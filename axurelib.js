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
const EventEmitter = require('events').EventEmitter
let $ = null
// 目录
const dirPreix = ['组件', '系统', 'PRD', '模板']
// 页码数
const PAGESIZE = 2

const event = new EventEmitter()

// 获取某页的 RP 信息
function getRpInfoList (i = 1) {
  return new Promise((resolve, reject) => {
    const RPInfoList = []
    request(`https://www.pmdaniu.com/explore/rplib/download?page=${i}`, async (error, response, body) => {
      if (!error && response.statusCode == 200) {
        body = body.replace(/[\n\t]/g, '')
        $ = cheerio.load(body)
        const rpItemList = $('.home-rplib_item')
        for (let i = rpItemList.length - 1; i >= 0; i--) {
          const rpItem = await parseRPItem(rpItemList[i])
          rpItem && RPInfoList.push(rpItem)
          console.log('\t||||--> Parsing Rp Item ' + i)
          // console.log('RPList ', JSON.stringify(RPInfoList))
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
  const hasDownloadText = $(rpItem).find('.home-rplib_item_num').next().text()
  const ta = (/\d+/).exec(hasDownloadText)
  if (ta.length && ta[0] && +ta[0] < 100) {
    return ''
  }

  const rpName = $(rpItem).find('h4 > a').text()
  const rpLink = $(rpItem).find('.home-rplib_img_wrap').prop('href')
  const rpTag = '组件'

  const link = await fetchFileUri(rpLink.replace('detail', 'download'))

  return {
    name: rpName.trim().replace('|', ''),
    link: link,
    tag: rpTag
  }
}

// 获取真正的下载url --> 时间久了，Cookie 需要替换
function fetchFileUri (link) {
  return new Promise(resolve =>{
    request(link, {
      headers: {
        Cookie: 'Hm_lvt_d642623fc3f6afb8c874ae3bfbbd8391=1588057863,1588057880; daniu=7TZXMOvhpk5M4nRBU1N9YN9phJyhDAIQmr9xz8sa; Hm_lvt_7f14406901827f30750e659db6c1ab68=1588149546; Hm_lpvt_7f14406901827f30750e659db6c1ab68=1588149584; Hm_lvt_d3db21ed7b338b6b97b365817a4dd104=1588151844; Hm_lpvt_d3db21ed7b338b6b97b365817a4dd104=1588151844; Hm_lpvt_d642623fc3f6afb8c874ae3bfbbd8391=1588218119',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
      }
    }, (error, response, body) => {
      resolve(response.request.href)
    })
  })
}

function downloadFile(uri, filename, callback){
  if (!filename || fs.existsSync(path.resolve(__dirname, filename))) {
    console.log('\t||||--> File "', filename, '" has already exists')
    callback && callback()
    return
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
  const rp = RPInfoList.shift()
  if (!rp || rp.then) {
    return
  }
  console.log('\t||||--> Saving File: ', `rp/${rp.tag}/${rp.name}.rp`)
  downloadFile(rp.link, `rp/${rp.tag}/${rp.name}.rp`, () => {
    if (RPInfoList.length) {
      run()
    } else {
      return setTimeout(() => {
        event.emit('finish', true)
      }, 1500)
    }
  })
}

async function thread (index) {
  console.log('\n||||--> Start Parsing Rp Info')
  if (!RPInfoList.length) {
    RPInfoList = await getRpInfoList(index)
  }
  if (!RPInfoList.length) {
    console.log('\n||||--> Without Valid File To Download')
    event.emit('finish', true)
  }
  console.log('\n||||--> Start Downlading Rp File')
  run()
}

let index = PAGESIZE
function start () {
  if (index < 1) {
    console.log('\n||||--> End <-- ||||\n')
    return
  }
  console.log('\n||||--> Start Thread ', index)
  thread(index)
}
event.on('finish', (isFinish) => {
  if (isFinish) {
    index--
    start()
  }
})

start()
