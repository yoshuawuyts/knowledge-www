const boleStream = require('bole-stream')
const httpNdjson = require('http-ndjson')
const sizeStream = require('size-stream')
const summary = require('server-summary')
const stdout = require('stdout-stream')
const pumpify = require('pumpify')
const bole = require('bole')
const http = require('http')

const Gateway = require('./gateway')

module.exports = createServer

function createServer (argv) {
  bole.output({ level: argv.logLevel, stream: stdout })
  const logStream = boleStream({ level: argv.logLevel })
  const gateway = Gateway()
  const port = argv.port

  // create server
  const server = http.createServer((req, res) => {
    const httpLogger = httpNdjson(req, res)
    httpLogger.pipe(logStream, { end: false })

    const size = sizeStream()
    size.once('size', size => httpLogger.setContentLength(size))

    const sink = pumpify(size, res)
    gateway(req, res).pipe(sink)
  })

  // start the server on port
  server.listen(port, summary(server))
}
