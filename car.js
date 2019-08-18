var request = require('request');
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
const pinyin = require("pinyin")

class Cario {
  writeFile (file, value) {
    // if (!fs.existsSync(path.resolve(__dirname, file))) {
    //   fs.mkdirSync(path.resolve(__dirname, file))
    // }
    fs.writeFile(path.resolve(__dirname, file), JSON.stringify(Array.from(new Set(value))), () => {
      console.log('File Created: ', file)
    })
  }
  distinct(a = [], b = []) {
    let arr = a.concat(b)
    let result = []
    let obj = {}
    for (let i of arr) {
      if (!obj[i.text]) {
        result.push(i)
        obj[i.text] = 1
      }
    }
    return result
  }
  getCountry () {
    return new Promise((resolve, reject) => {
      let c1 = []
      let c2 = []
      request('http://www.chebiao.cc/', (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(body)
          const $c1 = $('.headr > p > a')
          const $c2 = $('.headea  a')
          for (let i = 0; i < $c1.length; i++) {
            c1.push({
              url: $($c1[i]).prop('href'),
              text: $($c1[i]).text()
            })
          }
          for (let i = 0; i < $c2.length; i++) {
            if ($($c2[i]).text() === '车标大全') continue
            c2.push({
              url: $($c2[i]).prop('href'),
              text: $($c2[i]).text()
            })
          }
          c1 = c1.concat(c2)
          c1 = this.distinct(c1)
          this.writeFile('./json/country.json', c1)
          resolve(c1)
        } else {
          reject()
        }
      })
    }).catch(() => {
      console.log('Car Country Fetch Error: ')
    })
  }
  getLetterList () {
    return new Promise(resolve => {
      request('http://www.chebiao.cc/', async (error, response, body) => {
        if (!error && response.statusCode == 200) {
          let letterList = []
          const $ = cheerio.load(body)
          const $letters = $('.zimu li a')
          for (let i = 0; i < $letters.length; i++) {
            const $letter = $($letters[i])
            letterList.push({
              text: $letter.text(),
              link: $letter.prop('href')
            })
          }
          console.log('[Success] Get Letter List')
          resolve(letterList)
        }
      })
    }).catch(() => {
      console.log('[Error] Letter Fetch Fail')
    })
  }
  filterLetterByLink (url) {
    return new Promise(resolve => {
      let letter = url.slice(0, -1)
      letter = letter.slice(letter.lastIndexOf('/') + 1)
      request(url, async (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(body)
          const $list = $('.mainbox a')
          let letterList = []
          for (let i = 0; i < $list.length; i++) {
            const $item = $($list[i])
            let link = $item.prop('href')
            const detailObj = await this.getCarDetailByLink(link)
            let name = $('p', $item).eq(0).text()
            let en = $('p span', $item).text()
            if (!this.isContainChineseLetter(name) && this.isContainChineseLetter(en)) {
              const tmp = name
              name = en
              en = tmp
            }
            letterList.push({
              key: letter.toUpperCase(),
              letter: letter.toUpperCase(),
              name,
              en,
              logo: $('img', $item).prop('src'),
              ...detailObj
            })
          }
          console.log('[Success] Get Letter Info')
          resolve(letterList)
        } else {
          console.log('[Error] Link')
        }
      })
    }).catch(() => {
      console.log('[Error] Filter Letter Fail', letter)
    })
  }
  getCarLetterDetail () {
    let carLetterDetailList = []
    this.getLetterList().then(letterList => {
      letterList.forEach(letter => {
        this.filterLetterByLink(letter.link).then(res => {
          const letterInfo = {
            title: letter.text,
            item: res
          }
          carLetterDetailList.push(letterInfo)
          console.log('Start Writing File...\n')
          this.writeFile(`letter/${letter.text}.json`, [letterInfo])

        }).catch(err => {
          console.error('[Error]', letter.text)
        })
      })
    })
  }
  getCarLogoByLetter (url) {
    return new Promise(resolve => {
      request(url, async (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(body)
          const $carLogoList = $('.liebiao ul')
          let carArray = []
          for (let i = 0; i < $carLogoList.length; i++) {
            const $target = $($carLogoList[i])
            const carLogoUrl = $('a > img', $target).prop('src')
            const carBrandName = $('h3 > a', $target).text()
            const carIntro = $('p', $target).text()
            const carDetailLink = $('a', $target).prop('href')
            const detailObj = await this.getCarDetailByLink(carDetailLink)
            const pinyins = this.word2Pinyin(carBrandName)
            const carType = await this.getMainCarType(pinyins)
            let letter = pinyins.slice(0, 1).toUpperCase()
            if (!this.isContainChineseLetter(detailObj.aliasName)) {
              const subLetter = detailObj.aliasName.slice(0, 1).toUpperCase()
              if (letter !== subLetter) letter += ',' + subLetter
            }
            let carObj = {
              letter,
              carLogoUrl,
              carBrandName,
              pinyin: pinyins,
              carType,
              carIntro,
              ...detailObj
            }
            carArray.push(carObj)
          }
          resolve(carArray)
        }
      })
    }).catch(() => {
      console.log('CarLogo Created Error: ', url)
    })
  }
  getCarLogo (url, file, country) {
    return new Promise(resolve => {
      request(url, async (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(body)
          const $carLogoList = $('.liebiao ul')
          let carArray = []
          for (let i = 0; i < $carLogoList.length; i++) {
            const $target = $($carLogoList[i])
            const carLogoUrl = $('a > img', $target).prop('src')
            const carBrandName = $('h3 > a', $target).text()
            const carIntro = $('p', $target).text()
            const carDetailLink = $('a', $target).prop('href')
            const detailObj = await this.getCarDetailByLink(carDetailLink)
            const pinyins = this.word2Pinyin(carBrandName)
            const carType = await this.getMainCarType(pinyins)
            let letter = pinyins.slice(0, 1).toUpperCase()
            if (!this.isContainChineseLetter(detailObj.aliasName)) {
              const subLetter = detailObj.aliasName.slice(0, 1).toUpperCase()
              if (letter !== subLetter) letter += ',' + subLetter
            }
            let carObj = {
              country,
              letter,
              carLogoUrl,
              carBrandName,
              carBrandPinyin: pinyins,
              carType,
              carIntro,
              ...detailObj
            }
            carArray.push(carObj)
          }
          this.writeFile(file, carArray)
          resolve(carArray)
        }
      })
    }).catch(() => {
      console.log('CarLogo Created Error: ', url)
    })
  }
  isContainChineseLetter (str) {
    return /[\u4E00-\u9FA5\uF900-\uFA2D]/.test(str)
  }
  word2Pinyin (word) {
    const ipinyin =  pinyin(word, {
      style: pinyin.STYLE_NORMAL
    })
    let pinyinStr = ''
    for (let i = 0; i < ipinyin.length; i++) {
      pinyinStr += ipinyin[i][0]
    }
    return pinyinStr
  }
  getMainCarType (pattern) {
    let url = 'http://www.chebiaow.com/logo/chebiao/$.html'.replace('$', pattern)
    return new Promise((resolve, reject) => {
      request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(body)
          const $carType = $('.bz-detail ul li').eq(5)
          const carTypeText = $('span', $carType).text()
          console.log('[Success] car type fetch success - ', pattern)
          resolve(carTypeText)
        } else {
          reject()
        }
      })
    }).catch(() => {
      console.log('[Error] car type fetch fail - ', pattern)
    })
  }
  getCarDetailByLink (url) {
    return new Promise((resolve, reject) => {
      request(url, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(body)
          const $container = $('.container')
          const $mainInfo = $('.mainart_info li', $container)
          let $aliasName = $mainInfo.eq(1).text()
          $aliasName = $aliasName.slice($aliasName.indexOf('：') + 1)
          let $place = $mainInfo.eq(2).text()
          $place = $place.slice($place.indexOf('：') + 1, $place.length)
          let $company = $mainInfo.eq(3).text()
          $company = $company.slice($company.indexOf('：') + 1, $company.length)
          let $createTime = $mainInfo.eq(4).text()
          $createTime = $createTime.slice($createTime.indexOf('：') + 1, $createTime.length)

          let $description = []
          Array.from($('.mainart_bottom_body p')).forEach((item) => {
            return $description.push($(item).text().replace(/\n\t|\s+/g, ''))
          })
          let obj = {
            aliasName: $aliasName,
            place: $place,
            company: $company,
            createTime: $createTime,
            description: $description
          }
          console.log('[Succeess] Car Detail Fetch: ', url)
          resolve(obj)
        }
      })
    }).catch(() => {
      console.log('[Error] Car Detail Fetch: ', url)
    })
  }
  getCountryFiles () {
    this.getCountry().then((countrys) => {
      Array.from(countrys).forEach((country, index) => {
        console.log('===============================================\n\t')
        console.log(`=============== ${index}. Start Fetching ${country.url} =============`)
        this.getCarLogo(country.url, 'json/car_' + this.word2Pinyin(country.text.replace('标志', '').replace('车标', '')) + '.json', country.text.replace('标志', '').replace('车标', ''))
        if (index === countrys.length - 1) {
          console.log('\n\tproccess finish.\n\t')
        }
      })
    })
  }
  combileLetterFiles () {
    let letterArray = []
    let files = fs.readdirSync('letter')
    files.forEach(function (item, index) {
      const data = fs.readFileSync(path.join('letter', item), 'utf8')
      letterArray= letterArray.concat(JSON.parse(data))
    })
    this.writeFile('letter/letter.all.json', letterArray)
  }
  combineCarFiles () {
    let jsonArray = []
    let files = fs.readdirSync('json')
    files.forEach(function (item, index) {
      if (item === 'country.json') return
      const data = fs.readFileSync(path.join('json', item), 'utf8')
      jsonArray= jsonArray.concat(JSON.parse(data))
    })
    this.writeFile('json/car.all.json', jsonArray)
  }
}

// new Cario().getCarLogo('http://www.chebiao.cc/guojiabiaozhi/zhongguochebiaozhi/', 'json/car_zh.json', '中国')
const cario = new Cario()
// cario.getCountry()
// 按国家获取车标
// cario.getCountryFiles()
// 组合
// cario.combineCarFiles()


//获取字母文件
// cario.getCarLetterDetail()
// 字母文件合成
cario.combileLetterFiles()
