var request = require('request');
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
const pinyin = require("pinyin")

function writeFile (file, value) {
  fs.writeFile(path.resolve(__dirname, file), value, () => {
    console.log('File Created: ', file)
  })
}

function fetchEmot (url = 'https://pic.sogou.com/pic/emo/classify.jsp?id=178&from=emoclassify_tab&spver=0&rcer=', pid, ptitle) {
  return new Promise(resolve => {
    request(url, async (error, response, body) => {
      if (!error && response.statusCode == 200) {
        body = body.replace(/[\n\t]/g, '')
        const $ = cheerio.load(body)
        const modules = $('.recall-module')
        const emotArray = []
        for (let i = 0; i < modules.length; i++) {
          const moduleItem = modules[i]
          const emotObject = {}
          const title = $('.emo-tit-recall', moduleItem).text()
          const count = +$('.more-emo', moduleItem).text().replace(/[^0-9]/g, '')
          const img1 =  $('.noscroll-list > li', moduleItem).eq(0).find('a > img').prop('rsrc')
          const img2 =  $('.noscroll-list > li', moduleItem).eq(1).find('a > img').prop('rsrc')
          const img3 =  $('.noscroll-list > li', moduleItem).eq(2).find('a > img').prop('rsrc')
          const showUrl = [img1, img2, img3] //$('.noscroll-list > li > a > img', moduleItem).prop('src')
          emotObject.pid = pid
          emotObject.ptitle = ptitle
          emotObject.hot = i
          emotObject.title = title
          emotObject.count = count
          emotObject.showUrl = showUrl
          emotArray.push(emotObject)
        }
        // console.log(emotArray)
        resolve(emotArray)
      } else {
        console.log('[Error] Request disconnect ', error)
      }
    })
  }).catch(() => {
    console.log('[Error] Plates Fetch')
  })
}

const hotGroup = [{
  id: 154,
  hot: 1,
  title: '热门表情',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=154&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 192,
  hot: 2,
  title: '聊天斗图',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=192&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 190,
  hot: 3,
  title: '动态表情',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=190&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 183,
  hot: 4,
  title: '明星红人',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=183&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 193,
  hot: 5,
  title: '污表情',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=193&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 188,
  hot: 6,
  title: '撩妹示爱',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=188&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 197,
  hot: 7,
  title: '蘑菇头',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=197&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 151,
  hot: 8,
  title: '综艺影视',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=151&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 170,
  hot: 9,
  title: '二次元',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=170&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 184,
  hot: 10,
  title: '段子秀场',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=184&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 150,
  hot: 11,
  title: '萌萌哒',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=150&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 191,
  hot: 12,
  title: '搞笑表情',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=191&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 177,
  hot: 13,
  title: '节日热点',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=177&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 178,
  hot: 14,
  title: '表情头牌',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=178&from=emoclassify_tab&spver=0&rcer='
}, {
  id: 175,
  hot: 15,
  title: '卡通形象',
  url: 'https://pic.sogou.com/pic/emo/classify.jsp?id=175&from=emoclassify_tab&spver=0&rcer='
}]

function patch () {
  hotGroup.forEach(async (item) => {
    const emotArray = await fetchEmot(item.url, item.id, item.title)
    const fileName =  pinyin(item.title, {
      style: pinyin.STYLE_NORMAL
    }).join('')
    item.list = emotArray
    delete item.url
    writeFile(`emot/patch/${fileName}.json`, JSON.stringify(item))
  })
  // fetchEmot().then(emotArray => {
  //   const obj = {
  //     type: '表情头牌',
  //     list: emotArray
  //   }
  //   writeFile('emot/toupai.json', JSON.stringify(obj))
  // })
}
function patchGroup () {
  hotGroup.forEach(async (item, index) => {
    const emotArray = await fetchEmot(item.url, item.id, item.title)
    const fileName =  pinyin(item.title, {
      style: pinyin.STYLE_NORMAL
    }).join('')
    delete item.url
    item.showUrl = emotArray[0].showUrl
    item.promot = [emotArray[0], emotArray[1], emotArray[2], emotArray[3]]
    writeFile(`emot/hotGroup/${fileName}.json`, JSON.stringify(item))
    if (index === hotGroup.length - 1) {
      // writeFile(`emot/hotGroup/${fileName}.json`, JSON.stringify(hotGroup))
    }
  })
}

function combinePatchGroup () {
  let letterArray = []
  let files = fs.readdirSync('emot/hotGroup')
  files.forEach(function (item, index) {
    const data = fs.readFileSync(path.join('emot/hotGroup', item), 'utf8')
    console.log(data)
    // letterArray= letterArray.concat(JSON.parse(data))
  })
  writeFile('emot/hotGroup/hot.all.json', letterArray)
}

function getEmotTemplate () {
  return new Promise(resolve => {
    request('https://pic.sogou.com/pic/emo/make.jsp?mi=4&spver=0&rcer=', async (error, response, body) => {
      if (!error && response.statusCode == 200) {
        body = body.replace(/[\n\t]/g, '')
        const $ = cheerio.load(body)
        const modules = $('.modelimg-list li')
        const emotArray = []
        for (let i = 0; i < modules.length; i++) {
          const moduleItem = modules[i]
          let tempImageUrl = $(moduleItem).prop('data-tpic')
          if (tempImageUrl.indexOf('img=') !== -1) {
            tempImageUrl = tempImageUrl.slice((tempImageUrl.indexOf('img=') + 4))
            emotArray.push(tempImageUrl)
          }
        }
        resolve(emotArray)
      } else {
        console.log('[Error] Request disconnect ', error)
      }
    })
  }).catch(() => {
    console.log('[Error] Plates Fetch')
  })
}

function patchTemplate () {
  getEmotTemplate().then((emotArray) => {
    const obj = {
      title: '表情模板',
      key: 'emotion_template',
      count: emotArray.length,
      list: emotArray
    }
    writeFile(`emot/emotTemplate.json`, JSON.stringify(obj))
  })
}

// 表情分组
// patch()
// patchGroup()
combinePatchGroup()

// 获取模板
// patchTemplate()
