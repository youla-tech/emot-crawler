var request = require('request');
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
const pinyin = require("pinyin")

class Plate {
  writeFile (file, value, skip) {
    fs.writeFile(path.resolve(__dirname, file), JSON.stringify(skip ? value : Array.from(new Set(value))), () => {
      console.log('File Created: ', file)
    })
  }
  getPlateDetailByLink (url) {
    return new Promise(resolve => {
      request(url, {timeout: 50000}, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const $ = cheerio.load(body)
          const list = $('.cp-cont-list li')
          const plate = list.eq(0).text()
          const province = list.eq(1).text()
          const city = list.eq(2).text()
          const areaCode = list.eq(3).text()
          const zipCode = list.eq(4).text()
          const example = list.eq(5).text()
          resolve({
            plate: plate.slice(plate.indexOf('：') + 1).trim(),
            province: province.slice(province.indexOf('：') + 1).trim(),
            city: city.slice(city.indexOf('：') + 1).trim(),
            areaCode: areaCode.slice(areaCode.indexOf('：') + 1).trim(),
            zipCode: zipCode.slice(zipCode.indexOf('：') + 1).trim(),
            example: example.slice(example.indexOf('：') + 1).trim()
          })
        } else {
          console.log('[Error] Request Disconnected ', error)
        }
      })
    }).catch(() => {
      console.log('[Error] Plate Detail Fetch: ', url)
    })
  }
  getLicensePlates (url) {
    return new Promise(resolve => {
      request(url, async (error, response, body) => {
        if (!error && response.statusCode == 200) {
          body = body.replace(/[\n\t]/g, '')
          const $ = cheerio.load(body)
          const list = $('li table')
          let plateArr = []
          let plateObj = {}
          for (let i = 0; i < list.length; i++) {
            let item = {}
            let plate = []
            let l = list[i]
            const province = $(l).find('caption a').text()
            item.province = province

            const $detail = $(l).find('tr')
            let currentIndex = ''
            console.log('[Info] Fetch Plate ', province)
            for (let j = 1; j < $detail.length; j++) {
              const prefix = $('td a', $detail[j]).text()
              prefix && (currentIndex = prefix.slice(0, 1))
              const link = $('td a', $detail[j]).prop('href')
              const belongs = $('td', $detail[j]).eq(1).text()
              console.log('[Info] Fetch Plate\'s Detail ', prefix, ' -- ', link)
              let detail = {}
              if (link) {
                detail = await this.getPlateDetailByLink('http://www.chebiaow.com' + link)
              }
              plate.push({
                key: prefix,
                // belongs,
                ...detail
              })
            }
            item.plates = plate
            plateArr.push(item)
            plateObj[currentIndex] = plate
          }
          resolve(plateObj, plateArr)
        } else {
          console.log('[Error] Request disconnect ', error)
        }
      })
    }).catch(() => {
      console.log('[Error] Plates Fetch')
    })
  }
  createLicensePlate () {
    this.getLicensePlates('http://www.chebiaow.com/chepai/').then((plateObj, plateArr) => {
      console.log('[Info] Created File')
      // this.writeFile('plate/index.json', plateArr)
      console.log(JSON.stringify(plateObj))
      this.writeFile('plate/obj.json', plateObj, 1)
    })
  }
}

const plate = new Plate()
plate.createLicensePlate()
