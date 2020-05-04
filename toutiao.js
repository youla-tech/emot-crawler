// ===================================
//  头条视频检测
//
//

var request = require('request');
const cheerio = require('cheerio')
const qs = require('qs')
const fs = require('fs')
const path = require('path')
const EventEmitter = require('events').EventEmitter
let $ = null

const event = new EventEmitter()

const searchDefaultOptions = {
  aid: 24,
  app_name: 'web_search',
  offset: 0,
  format: 'json',
  keyword: '',
  autoload: true,
  count: 20,
  en_qc: 1,
  cur_tab: 1,
  from: 'search_tab',
  pd: 'synthesis',
  timestamp: +new Date(),
  _signature: 'cSVDmAAgEBAidvcOK-wQ.3EkAoAAC-NvXvqpcuVFGcvBcfiaeC1H2yvfv66h3WaF7IVkqC4KgPnUT1kgeyKz0IpxrOTNnFQ0MbXnhy0G7FKsrXRtscv261ReYPkD0IFO-ex'
}

const defaultHeaders = {
  headers: {
     Cookie: 'csrftoken=3d91205b36a8393af78f191eb1e37c27; sso_auth_status=15cfb773fdb6a1fdec84ae198b733e94; passport_auth_status=b905f31371f81fc8326caee48b3073ed%2C910975d86ee6f1405ae4703e83bbaf29; sso_uid_tt=66a83d3efc92cabbb9a1cfe7d5d1090c; sso_uid_tt_ss=66a83d3efc92cabbb9a1cfe7d5d1090c; toutiao_sso_user=8a27cd544e0ba3b08143fd9b7a965bf2; toutiao_sso_user_ss=8a27cd544e0ba3b08143fd9b7a965bf2; sid_guard=cc21e367eaf966d9f11be67d40620375%7C1586855719%7C5184000%7CSat%2C+13-Jun-2020+09%3A15%3A19+GMT; uid_tt=1e5c2248a6b23d5fa3e6091ebfbf5494; uid_tt_ss=1e5c2248a6b23d5fa3e6091ebfbf5494; sid_tt=cc21e367eaf966d9f11be67d40620375; sessionid=cc21e367eaf966d9f11be67d40620375; sessionid_ss=cc21e367eaf966d9f11be67d40620375; ttcid=f06d2aa4cdc84e0fa28281d09bd0665625; SLARDAR_WEB_ID=bcdb5681-9126-46fe-bd51-002fc7bab3f7; tt_webid=6816518538347693575; _ga=GA1.2.140295969.1587094538; s_v_web_id=verify_k9j8pye1_3WGNpg0I_m1Eu_4vXk_8ZN5_5i8GDho7T9d5; tt_webid=6816518538347693575; WEATHER_CITY=%E5%8C%97%E4%BA%AC; __tasessionId=2lsjw14ay1588556921101; tt_scid=tsvHA6FSjS.xCMGLmhasxtn2bM9-t4B55x5QPOEbbRMja5cqO-ZtDqx2B6WKG4P89d00',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'
  }
}

function Fetch (keyword, options = {}) {
  if (!keyword) return
  const searchOpt = Object.assign({}, searchDefaultOptions, options)
  keyword = keyword.trim()
  keyword = keyword.includes(' ') ? keyword.replace(' ', '+') : keyword
  searchOpt.keyword = keyword
  const params = qs.stringify(searchOpt)
  return new Promise((resolve, reject) => {
    request(`https://www.toutiao.com/api/search/content/?` + params, defaultHeaders, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        const resultList = JSON.parse(body).data
        resolve(resultList)
      } else {
        reject(error)
      }
    })
  })
}

function Filter (list) {
  if (!list || !list.length) return []
  return list.filter(item => !item.cell_type)
}

async function Search(keyword, offset = 0) {
  const result = await Fetch(keyword, {offset})
  if (!result.length) {
    const os = offset + 20
    Search(keyword, os)
  } else {

  }
  console.log(JSON.stringify(Filter(result)))
}

Search('Snack Attack')
