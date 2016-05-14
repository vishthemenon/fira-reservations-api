r = require('rethinkdb')
var host = 'ec2-52-74-122-161.ap-southeast-1.compute.amazonaws.com'
var port = 28015
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
  console.log("done")
}
