r = require('rethinkdb')
var host = 'ec2-52-74-122-161.ap-southeast-1.compute.amazonaws.com'
var port = 28015
var app = require('express')()
var bodyParser = require('body-parser')
var validator = require('express-validator')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));

app.use(validator())
app.use(validator({
  customValidators: {
    isCoolDate: function (input) {
      var testDate = input.split("-")
      if(testDate.length == 3) if(parseInt(testDate[0]) > 2015) if(parseInt(testDate[1])>0 && parseInt(testDate[1])<13) if(parseInt(testDate[2])>0 && parseInt(testDate[2])<=31) return true
      return false
    },
    isCoolTime: function (input) {
      var testTime = input.split(":")
      if(testTime.length == 2)  if(parseInt(testTime[0])>=0 && parseInt(testTime[0]) < 24) if(parseInt(testTime[1])>= 0 && parseInt(testTime[1])<60) return true
      return false
    }
  }
}))

function logError(err, res){
  console.log(err)
  res.send(err)
}

var connection = null

r.connect({
  host,
  port,
  user: "admin",
  password: "angelhack",
  db : "fira"},
  function(err, conn) {
    if (err) {
      logError(err, res)
      return
    }
    connection = conn;
    console.log("Connected to rethinkdb")
  }
)

app.get('/reservations', function(req, res){
  r.table('reservations').run(connection, function(err, cursor) {
    cursor.toArray(function(err, result) {
      if (err) {
        logError(err, res)
        return next(err)
      }
      res.send(result)
    })
  })
})

app.get('/reservations/:restaurant_id', function(req, res){
  console.log(req.params.restaurant_id)
  r.table('reservations').filter({restaurant_id: req.params.restaurant_id}).run(connection, function(err, cursor) {
    cursor.toArray(function(err, result) {
      if (err) {
        logError(err, res)
        return next(err)
      }
      res.send(result)
    })
  })
})

app.post('/reservation/new', function(req, res) {
  // Validate request
  req.checkBody("customer_name"       , "Enter a valid user name."                ).isAlpha()
  req.checkBody("customer_id"         , "Enter a valid user id."                  ).isInt()
  req.checkBody("customer_pic"        , "Enter a valid phone number."             ).isURL()
  req.checkBody("pax"                 , "Enter a valid number of pax reserving."  ).isInt()
  req.checkBody("page_id"             , "Enter a valid page id."            ).isInt()
  req.checkBody("date"                , "Enter a valid date of reservation"       ).isCoolDate()
  req.checkBody("time"                , "Enter a valid start time of reservation" ).isCoolTime()
  var err = req.validationErrors();
  if (err) {
    logError(err, res)
    return
  }

  // JSON Parsing
  const customer_name = req.body.customer_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()})
  var time = new Date(req.body.date + " " + req.body.time)
  const pax  = req.body.pax

  // Reservation validation
  // const end_time = new Date(time.setHours(time.getHours()+1))
  // time = new Date(req.body.date + " " + req.body.time)
  const day = time.getDate()
  const month = time.getMonth()+1
  const year = time.getFullYear()
  const hour = time.getHours()
  const min = time.getMinutes()

  r.table('restaurants')
  .filter({pageId: req.body.page_id}).run(connection, function(err, cursor) {
    cursor.toArray(function(err, result) {
      if (err) {
        logError(err, res)
        return next(err)
      }
      var restaurant_id = result[0].id
      var limit = result[0].reservation_limit

      console.log(restaurant_id)
      r.table('reservations')
      .filter({restaurant_id: restaurant_id})
      .filter(function(g) {
        return g("time").lt(r.time(year,month,day,hour+1,min,0,'+08:00'))
      }).filter(function(g) {
        return g("time").gt(r.time(year,month,day,hour,min-1,0,'+08:00'))
      }).count()
      .run(connection, function(err, filled) {
        console.log(r.time(year,month,day,hour+1,min,0,'+08:00'))
        console.log(r.time(year,month,day,hour,min-1,0,'+08:00'))
        console.log("Filled: " + filled)
        console.log("Limit " + limit)
        console.log((filled+pax)>=limit)
        if((filled+pax)>=limit){
          res.send("This is reservation slot is full")
        }
        else {
          const j = {
            customer_name,
            customer_id: req.body.customer_id,
            customer_pic: req.body.customer_pic,
            pax,
            restaurant_id: restaurant_id,
            time,
            notes: req.body.notes
          }
          console.log(j)
          //Send to rethinkdb
          r.table("reservations")
          .insert(j)
          .run(connection, function(err) {
            if (err) {
              logError(err, res)
              return
            }
            res.sendStatus(200)
          })
        }
      })
    })
  })
})

app.post('/settings', function(req, res){
  req.checkBody("restaurant_id"       , "Enter a valid restaurant_id."              ).isAlpha()
  req.checkBody("reservation_opening_hour"        , "Enter a valid opening hour."               ).isCoolTime()
  req.checkBody("reservation_closing_hour"        , "Enter a valid closing hour."               ).isCoolTime()
  req.checkBody("reservation_limit"   , "Enter a valid reservation limit."          ).isInt()
  req.checkBody("note"                , "Enter a valid note."                       ).isAlphanumeric()
  var reservation_opening_hour = new Date()
  reservation_opening_hour.setHours(parseInt(req.body.reservation_opening_hour.split(":")[0]), parseInt(req.body.reservation_opening_hour.split(":")[1]), 0)
  var reservation_closing_hour = new Date()
  reservation_closing_hour.setHours(parseInt(req.body.reservation_closing_hour.split(":")[0]), parseInt(req.body.reservation_closing_hour.split(":")[1]), 0)

  r.table("restaurants")
  .get(req.body.restaurant_id)
  .update({
    reservation_opening_hour,
    reservation_closing_hour
  })
  .run(connection, function(err) {
    if (err) {
      logError(err, res)
      return
    }
    res.sendStatus(200)
  })
})

app.listen(3000, function(err){
  if (err) {
    logError(err, res)
    return
  }
  console.log("Reservation server listening on port 3000")
})
