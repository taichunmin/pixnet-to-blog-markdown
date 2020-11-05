const _ = require('lodash')
const dayjs = require('dayjs')
const fg = require('fast-glob')
const fsPromises = require('fs').promises
const JSON5 = require('json5')
const log = require('debug')('app:index')
const transliteration = require('transliteration')
const TurndownService = require('turndown')
const yaml = require('yaml')

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '- - -',
})

require('debug').formatters.e = (() => {
  const ERROR_KEYS = [
    'address',
    'code',
    'data',
    'dest',
    'errno',
    'info',
    'message',
    'name',
    'path',
    'port',
    'reason',
    'stack',
    'status',
    'statusCode',
    'statusMessage',
    'syscall',
  ]
  return err => JSON5.stringify(_.transform(ERROR_KEYS, (json, k) => {
    if (_.hasIn(err, k)) _.set(json, k, _.get(err, k))
  }, {}), null, 2).replace(/\\n/g, '" + \n')
})()

function slugify (str) {
  return transliteration.slugify(_.toString(str).replace(/\b/g, ' ')).replace(/-+/g, '-')
}

function pixelArticleParse (txt) {
  const article = {}
  const [head, body, ...comments] = _.map(_.split(txt, '\n-----'), _.trim)
  if (!head) return null
  _.each(_.map(_.split(head, '\n'), _.trim), line => {
    const [, key, value] = line.match(/^([^:]+): (.+)$/) || [null, null, null]
    if (!key) return
    _.set(article, _.camelCase(_.trim(key)), _.trim(value))
  })
  article.date = dayjs(`${article.date}+08`)
  article.tags = JSON5.parse(`[${_.get(article, 'tags', [])}]`)
  article.body = turndown.turndown(body.slice(6))
  article.comments = comments
  article.filename = `${article.date.format('YYYY-MM-DD')}-${slugify(article.title)}`
  return article
}

function markdownStringify (article) {
  return `---
${yaml.stringify({
  title: article.title,
  date: article.date.format('YYYY-MM-DDTHH:mm:00+08'),
  tags: _.uniq([article.primaryCategory, ...article.tags]),
})}---
# ${article.title}

${article.body}`
}

async function convertPixelArticle (outDir, article) {
  try {
    article = pixelArticleParse(article)
    if (_.get(article, 'status', 'draft') === 'draft') return
    await fsPromises.writeFile(`${outDir}${article.filename}.md`, markdownStringify(article), { encoding: 'utf8' })
    return article
  } catch (err) {
    log('convertPixelArticle: err = %e, article = %O', err, article)
  }
}

async function main () {
  const pixnets = await fg('pixnet/*.txt')
  for (const pixnet of pixnets) {
    try {
      const outDir = `out/${pixnet.slice(7, -4)}/`
      await fsPromises.mkdir(outDir, { recursive: true })
      const txt = (await fsPromises.readFile(pixnet, { encoding: 'utf8' })).replace(/\r/g, '')
      await Promise.all(_.map(_.split(txt, '\n--------'), part => convertPixelArticle(outDir, part)))
    } catch (err) {
      log(err)
    }
  }
}

main()
