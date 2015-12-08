const lrScript = require('inject-lr-script-stream')
const toServer = require('wayfarer-to-server')
const html = require('simple-html-index')
const browserify = require('browserify')
const match = require('pathname-match')
const wr = require('watchify-request')
const watchify = require('watchify')
const wayfarer = require('wayfarer')
const bl = require('bl')

module.exports = gateway

// create an API gateway
// null -> (req, res, obj) -> null
function gateway () {
  const router = toServer(wayfarer('404'))

  handle404(router)
  handleHtml(router)
  handleJs(router)

  return function (req, res, ctx) {
    router(match(req.url), req, res)
  }
}

// handle 404 requests
// obj -> null
function handle404 (router) {
  router.on('404', {
    all: function (req, res) {
      res.statusCode = 404
      res.end('error')
    }
  })
}

// handle html requests
// obj -> null
function handleHtml (router) {
  const htmlOpts = {
    title: 'GIANT SPHERE',
    entry: 'static/bundle.js',
    css: 'static/bundle.css'
  }

  const htmlBuf = html(htmlOpts)
    .pipe(lrScript())
    .pipe(bl())

  router.on('/', {
    get: function (req, res) {
      htmlBuf.duplicate().pipe(res)
    }
  })
}

// handle javascript
// obj -> null
function handleJs (router) {
  var b = browserify({
    cache: {},
    packageCache: {},
    entries: [ require.resolve('client-main') ],
    fullPaths: true
  })

  if (process.env.NODE_ENV === 'development') b = watchify(b)

  const handler = wr(b)

  router.on('/bundle.js', {
    get: (req, res) => handler(req, res, (err, body) => {
      if (err) return console.error(err)
      res.end(body)
    })
  })
}
