const http = require('node:http')
const gcloud = require('@google-cloud/tasks')
const protos = gcloud.protos
const CloudTasksClient = gcloud.CloudTasksClient
const credentials = require('@grpc/grpc-js').credentials

const client = new CloudTasksClient({
  servicePath: 'localhost',
  port: 8123,
  sslCreds: credentials.createInsecure(),  
})

const enqueue = (req, res) => {
  const parent = client.queuePath('example', 'asia-northeast1', 'example')

  const task = {
    httpRequest: {
      httpMethod: protos.google.cloud.tasks.v2.HttpMethod.POST,
      url: 'http://local_tasks:3000/task',
      body: Buffer.from(JSON.stringify({
        name: 'hello'
      })).toString("base64"),
      oidcToken: {
        serviceAccountEmail: process.env.SERVICE_ACCOUNT_EMAIL,
      },
      headers: {
        "content-type": "application/json",
      },
    },
  }

  const request = { parent: parent, task: task }
  client.createTask(request).then(() => {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      done: true
    }))
  }).catch(err => {
    console.log(err.stack)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      error: err.message
    }))
  })
}

const task = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({
    done: true
  }))
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/enqueue') {
    enqueue(req, res)
  } else if (req.method === 'POST' && req.url === '/task') {
    task(req, res)
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(process.env.POET || 3000)
