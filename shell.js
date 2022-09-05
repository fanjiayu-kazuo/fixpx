/**
 * 使用方式：
 * 与引入的文件放在同一目录下进行引用配置，执行:node （定义的文件）
 */
const fs = require('fs')
const path = require('path')
/**
 * entry：入口文件路径 type:Strng
 * pxtopx：以倍数转化px数值，计算方式为除法 ，type:Boolean
 * pxtorem：以倍数转化rem数值，计算方式为除法 ，type:Boolean
 * baseNumber:指定除数的基数，type:Number
 * includeFileTypeList：指定包含的文件类型后缀，type:Array
 * excludeFile：不包括的文件，可以是路径，type:Array
 */
class fixPxUtil {
  /**
   * @type {entry: String, pxtopx: boolean, pxtorem: boolean, baseNumber: number, includeFileTypeList: Array, excludeFile: Array}
   * @param {初始化参数} option
   */
  constructor(option) {
    if (!option) {
      this._logError('请传入配置参数')
      process.exit(0)
    }
    if (!option.entry || !option.entry.trim()) {
      this._logError('未指定入口文件,请指定')
      process.exit(0)
    }
    if (!option.pxtopx && !option.pxtorem) {
      this._logError('未指定pxtopx或者pxtorem，检查配置')
      process.exit(0)
    }
    if (!option.baseNumber) {
      this._logError('未指定基数')
      process.exit(0)
    }
    if (option.pxtopx && option.pxtorem) {
      this._logError('未指定pxtopx或者pxtorem错误，检查配置')
      process.exit(0)
    }

    this._beginPath = option.entry
    this._pxtopx = option.pxtopx
    this._pxtorem = option.pxtorem
    if (this._pxtopx) this._unit = 'px'
    if (this._pxtorem) this._unit = 'rem'
    this.BASENUMBER = option.baseNumber
    this._includeFileTypeList = option.includeFileTypeList || []
    this._excludeFile = option.excludeFile || []
    this._timer = null
    this._fileNumber = 0
    this._writeFileTimer = null
    this._arr = []
    this.getRegFile()
    this.sureHandler()
  }
  getRegFile() {
    let _strconnect = ''
    this._includeFileTypeList.forEach(item => {
      _strconnect += `(${item})$|`
    })
    _strconnect = _strconnect.length > 1 ? _strconnect.slice(0, _strconnect.length - 1) : ''
    _strconnect = this._includeFileTypeList.length > 0 ? '^.+' + _strconnect : ''
    this.regFile = new RegExp(_strconnect)
  }
  sureHandler() {
    process.stdin.setEncoding('utf8')
    process.stdout.write('此操作不可逆，确认是否进行(Y/n)?')
    process.stdin.on('data', input => {
      input = input.toString().trim()
      if (['Y', 'y', 'YES', 'yes'].indexOf(input) > -1 || !Boolean(input)) {
        this.fileDisplay(this._beginPath, this.changeFile.bind(this))
      }
      if (['N', 'n', 'NO', 'no'].indexOf(input) > -1) process.exit(0)
    })
  }
  fileDisplay(url, cb) {
    const filePath = path.resolve(url)
    fs.readdir(filePath, (err, files) => {
      if (err) return console.error('Error:(spec)', err)
      files.forEach(filename => {
        const filedir = path.join(filePath, filename)
        fs.stat(filedir, (eror, stats) => {
          if (eror) return console.error('Error:(spec)', err)
          const isFile = stats.isFile()
          const isDir = stats.isDirectory()
          if (isFile) {
            let exclude = this._excludeFile.some(item => {
              return filedir.includes(item)
            })
            let checkIsImage = filedir.match(/\.(png|jpg|gif|jpeg|webp|ttf|svg)$/)
            if (filedir.match(this.regFile) && !exclude && !checkIsImage) {
              this._arr.push({
                modified: false,
                path: filedir.replace(__dirname, '').replace(/\\/gim, '/'),
              })
            }
            if (this._timer) clearTimeout(this._timer)
            this._timer = setTimeout(() => cb && cb(this._arr), 200)
          }
          // 如果是文件夹
          if (isDir) this.fileDisplay(filedir, cb)
        })
      })
    })
  }
  changeFile() {
    /**重新写入文件 替换掉文件的px数值 */
    const self = this
    this._arr.forEach(item => {
      fs.readFile('.' + item.path, (err, data) => {
        let result = data.toString()
        var reg = /(\-|- |\+ )?([0-9]*\.[0-9]*|\d)+(px\)?)/gi
        let newStr = result.replace(reg, function (_x) {
          item.modified = true
          let n = _x.search(/px\)/) >= 0 ? 'px\\)' : 'px'
          let reg = new RegExp(eval(`/(- |\\+ )+([0-9]*\\.[0-9]*|\\d)+${n}/gi`))
          if (_x.match(reg)) {
            let C = ''
            if (_x.search(/\+/) >= 0) {
              C = '+'
            } else if (_x.search(/\-/) >= 0) {
              C = '-'
            }
            if (_x.search(/px\)/)) _x = _x.replace(/(- |\+ )/, '').replace(/px/i, '')
            if (_x.search(/\)/) >= 0) return `${C} ` + parseFloat(_x) / self.BASENUMBER + `${self._unit})`
            if (!_x.search(/\)/) >= 0) return `${C} ` + parseFloat(_x) / self.BASENUMBER + `${self._unit}`
          }
          return parseFloat(_x) / self.BASENUMBER + `${self._unit}`
        })
        const opt = {
          flag: 'w',
        }
        if (newStr) {
          fs.writeFile('.' + item.path, newStr, opt, (err, success) => {
            if (this._writeFileTimer) clearTimeout(this._writeFileTimer)
            this._writeFileTimer = setTimeout(() => {
              this._logSuccess(self._fileNumber + ' 个文件写入成功')
              process.exit(0)
            }, 200)
            if (err) {
              this._logError(err)
              process.exit(0)
            } else {
              if (item.modified) {
                self._fileNumber++
                this._logSuccess('更改并写入:' + item.path.slice(1) + ' 成功')
              }
            }
          })
        }
      })
    })
  }
  _logSuccess(str) {
    console.log('\x1B[32m%s\x1B[39m', str)
  }
  _logError(str) {
    console.log('\x1B[31m%s\x1B[39m', str)
  }
}
module.exports = fixPxUtil
