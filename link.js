// ===================================
//  http://api.ilxdh.com
//
//  link
//
//

var request = require('request');
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
const EventEmitter = require('events').EventEmitter

const pinyin = require("pinyin")

let $ = null
// 目录
const dirPreix = ['组件', '系统', 'PRD', '模板']
// 页码数
const PAGESIZE = 31
let classList = []
let classListItemObject = {}

function word2Pinyin (word) {
  const ipinyin =  pinyin(word, {
    style: pinyin.STYLE_NORMAL
  })
  let pinyinStr = ''
  for (let i = 0; i < ipinyin.length; i++) {
    pinyinStr += ipinyin[i][0]
  }
  return pinyinStr
}

function getClassList () {
  return new Promise((resolve, reject) => {
    request(`http://api.ilxdh.com/navig/home/classList`, {
      method: 'post',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
      }
    }, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          body = JSON.parse(body)
          if (body.error_code === 0) {
            classList = body.data
            resolve(classList)
          }
        } else {
          console.log('获取失败')
          reject([])
        }
      })
  })
}

function getClassListItem (name, fid) {
  return new Promise((resolve, reject) => {
    request(`http://api.ilxdh.com/navig/classify/list`, {
      method: 'post',
      json: {
        "fid": fid,
        "is_index": 0
      },
      headers: {
        "Content-Type": "application/json",
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
      }
    }, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          if (body.error_code === 0) {
            resolve(body.data)
          }
        } else {
          console.log('获取失败')
        }
      })
  })
}

async function createSidebar () {
  const sider = []
  const list = await getClassList()
  list.forEach(item => {
    const content = {
      title: item.name,
      collapsable: true,
      children: getChildName(item.children)
    }
    sider.push(content)
  })
  console.log(JSON.stringify(sider))
}

function getChildName (children) {
  return children.map(item => {
    return word2Pinyin(item.name)
  })
}

function isValidImage (url) {
  return new Promise((resolve, reject) => {
    request(url, (error, response, body) => {
      if (!error && response.statusCode == 200 && !body.includes('<!DOCTYPE')) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  })
}

function iconFilter (items) {
  items.forEach(async it => {
    let valiable = await isValidImage(it.icon)
    if (!valiable) {
      if (it.url) {
        let url = it.url.match(/^http[s]?:\/\/(.*?)[\/|\?]/) || it.url.match(/^http[s]?:\/\/(.*?)+/)
        url = url[0] || ''
        url = (url.indexOf('?') !== -1 || url.indexOf('/') !== -1) ? url.slice(0, -1) : url
        valiable = await isValidImage(url[0] + '/favicon.ico')
        if (!valiable) {
          valiable = await isValidImage(url[0] + '/images/favicon.ico')
        }
        it.icon = valiable ? url : '/aLinks/logo.png'
      } else {
        it.icon = '/aLinks/logo.png'
      }
    }
  })
}

async function createMdFile () {
  const classList = await getClassList()
  classList.forEach(async item => {
    const object = await getClassListItem(item.name, item.id)
    // object.forEach(it => {

    //   })
    for (let index = 0; index < object.length; index++) {
      const it = object[index];
      const linkItem = {
        name: it.name,
        item: []
      }
      // it.web.forEach(itw => {

      // })
      for (let index = 0; index < it.web.length; index++) {
        const itw = it.web[index]
        let matcher = '/aLinks/logo.png'
        if (itw.url) {
          try {
            matcher = itw.url.match(/^http[s]?:\/\/(.*?)[\/|\?]/)
            if (matcher) {
              matcher = matcher[0].slice(0, -1)
            } else {
              matcher = itw.url.match(/^http[s]?:\/\/(.*?)+/)
              matcher = matcher && matcher[0]
            }
            matcher = matcher + '/favicon.ico'
            const valiable = await isValidImage(matcher)
            matcher = valiable ? matcher : '/aLinks/logo.png'
          } catch {
            matcher = '/aLinks/logo.png'
          }
        }

        const image = matcher
        const info = {
          link: itw.url,
          icon: image,
          text: itw.name
        }
        linkItem.item.push(info)
      }

      // iconFilter(linkItem.item)
      const fileName = word2Pinyin(it.name)
        const md = `
  # ${it.name}
  ---

  <Common-LinkList :linkList='${JSON.stringify(linkItem)}'/>
  `
        writeFile(`link/${fileName}.md`, md)
    }
  })
}

function writeFile (file, value) {
  fs.writeFile(path.resolve(__dirname, file), value, () => {
    console.log('File Created: ', file)
  })
}

async function start () {
  // await getClassList()
  // classList.forEach(async item => {
  //   classListItemObject = Object.assign(classListItemObject, await getClassListItem(item.name, item.fid))
  // })
  // createSidebar()
  createMdFile()
  // console.log(await isValidImage("https://eamiear.github.io/aLinks/logo.png"))
}

start()
// https://www.12306.cn/favicon.ico
// isValidImage("https://eamiear.github.io/aLinks/logo.png")
