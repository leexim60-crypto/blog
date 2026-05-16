// 远程数据库初始化脚本
// 使用方法：
//   node init-db-remote.js <Host> <密码> <端口> <SSL> <用户名>
//
// 本地 MySQL：
//   node init-db-remote.js localhost root123 3306 false root
//
// TiDB Cloud：
//   node init-db-remote.js gateway01.us-west-2.prod.aws.tidbcloud.com 你的密码 4000 true xxxxxx.root

const host = process.argv[2]
const password = process.argv[3]
const port = process.argv[4] || '3306'
const ssl = process.argv[5] || 'false'
const user = process.argv[6] || 'root'

if (!host || !password) {
  console.log('')
  console.log('  使用方法：')
  console.log('  node init-db-remote.js <Host> <密码> [端口] [SSL] [用户名]')
  console.log('')
  console.log('  本地 MySQL：')
  console.log('  node init-db-remote.js localhost your_password 3306 false root')
  console.log('')
  console.log('  TiDB Cloud：')
  console.log('  node init-db-remote.js gateway01.us-west-2.prod.aws.tidbcloud.com your_password 4000 true xxxxxx.root')
  console.log('')
  process.exit(1)
}

const fs = require('fs')
const envContent = [
  `DB_HOST=${host}`,
  `DB_USER=${user}`,
  `DB_PASSWORD=${password}`,
  `DB_PORT=${port}`,
  `DB_NAME=personal_blog`,
  ssl === 'true' ? 'DB_SSL=true' : ''
].filter(Boolean).join('\n')

fs.writeFileSync('.env', envContent + '\n')
console.log(`正在连接 ${user}@${host}:${port} ...`)

require('./init-db')
