r = require('rethinkdb')
var host = 'ec2-52-74-122-161.ap-southeast-1.compute.amazonaws.com'
var port = 28015
var app = require('express')()
var bodyParser = require('body-parser')
var validator = require('express-validator')

app.use(bodyParser.json())
app.use(validator())


var connection = null

r.connect({
  host,
  port,
  user: "admin",
  password: "angelhack",
  db : "fira"},
  function(err, conn) {
    if(err) throw err;
    connection = conn;
    console.log("Connected to rethinkdb")
  }
)

app.get('/reservations', function(req, res){
  const e = []
  r.table('reservations').run(connection, function(err, cursor) {
    cursor.toArray(function(err, result) {
      if(err) {
        return next(err);
      }
      res.send(result)
      // result.map(i => console.log(i.name))
    })
  })
})

app.post('/new', function(req, res){
  r.table("reservations").insert({name:req.body.name,
    phone:req.body.phone}).run(connection, function(err){
      if (err) {
        console.log(err)
        res.send(err)
      }
      res.sendStatus(200)
    })
  })

app.listen(3000, function(err){
  if (err) throw err
  console.log("Reservation server listening on port 3000")
})
