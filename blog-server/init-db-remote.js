// 远程数据库初始化脚本
// 使用方法：在 blog-server 目录下执行
//   node init-db-remote.js <MySQL地址> <密码>
// 例如：
//   node init-db-remote.js roundhouse.proxy.rlwy.net AbCdEf1234

const host = process.argv[2]
const password = process.argv[3]

if (!host || !password) {
  console.log('')
  console.log('  使用方法：')
  console.log('  node init-db-remote.js <MySQL公网地址> <密码>')
  console.log('')
  console.log('  例如：')
  console.log('  node init-db-remote.js roundhouse.proxy.rlwy.net AbCdEf1234')
  console.log('')
  process.exit(1)
}

// 写入临时 .env
const fs = require('fs')
fs.writeFileSync('.env', `DB_HOST=${host}\nDB_PASSWORD=${password}\nDB_NAME=railway\n`)

// 执行初始化
require('./init-db')
