# Reservation API



# Schema
## Reservations
```
customer_id           : int
customer_name         : string
profile_pic           : string (url)
pax                   : int
restaurant_id         : int
time                  : Date
notes                 : string
```

## Settings
```
restaurant_id         : int
opening_hour          : Date
closing_hour          : Date
reservation_limit     : int
notes                 : string
```

# Requests

## POST /reservation/new
### Request
```
{
    "month"       :4,
    "date"        :15,
    "hour"        :15,
    "minute"      :0,
    "year"        :2016,
    "pax"         :"33",
    "notes"       :"BLAHDEEBLAH",
    "customer_id" :"12345678"
}
```
### Response
```
200 OK
```
## POST /reservation/update
### Requests
```
{
  "customer_name": "vishnu",
  "customer_pic": "www.fb.com/img.png",
  "page_id": "401297586642494",
  "customer_id": "12345678"
}
```
### Response
If not error,
```
200 OK
```

If reservation limit has reached,
```
This is reservation slot is full
```
If reservation is outside opening hours,
```
Please choose a slot between <reservation_opening_hour> and <reservation_closing_hour>
```
