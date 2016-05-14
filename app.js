express = require('express')
app = express()
bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res){
  res.send("Hi")
})

app.post('/new', function(req, res){
  const review = req.body.text
  console.log(review)
})

app.listen(3000)
