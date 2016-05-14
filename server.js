r = require('rethinkdb')
var host = 'ec2-52-74-122-161.ap-southeast-1.compute.amazonaws.com'
var port = 28015
var app = require('express')()
var bodyParser = require('body-parser');

app.use(bodyParser.json());


var connection = null
r .connect({
  host,
  port,
  user: "admin",
  password: "angelhack",
  db : "fira"
}, function(err, conn) {
  if(err) throw err;
  connection = conn;
  test()
});


function test() {
  r.table("reservations").insert({
    "title": "Lorem ipsum",
    "content": "Dolor sit amet"
  }).run(connection)
}



app.get('/reservations', function(req, res){
  r.table('reservations').run(connection, function(err, cursor) {
    cursor.toArray(function(err, result) {
      if(err) {
        return next(err);
      }
      console.log(result)
      res.send(result)
    });
  })
})

app.listen(3000, function(err){
  if (err) throw err
  console.log("Cool yeah")
})
