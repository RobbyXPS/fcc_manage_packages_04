// import dependencies
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config();
const mongoose = require('mongoose')

// configuration for server
mongoose.connect(process.env.MLAB_URI || 3000)
app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(express.static('public'))

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

const Schema = mongoose.Schema;

// create schema and mondel for exercise objects
const ExerciseSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
});

const Exercise = mongoose.model('exercise', ExerciseSchema);

// create schema and mondel for user objects
const UserSchema = new Schema({
  username: {
    type: String,
    required: true
  }
});

const User = mongoose.model('user', UserSchema);

// landing page endpoint
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// endpoint to add a new user to the db so that it can be associated with exercises later
app.post('/api/exercise/new-user', function(req, res) {
  //capture the name supplied by the user in the name field
  var user_name = req.body.username
  
  //check the db for the user
  User.find({username: user_name}, function(err, existingUser){
    // if you can't find the user in the db, create a new one
    if (existingUser.length == 0) {
      // create user object with supplied name from form
      const newUser = new User({
        username: user_name
      })
      // save the user to the db and display it in the response object to the user
      newUser.save((err, savedUser) => {
        if (err) return res.json(err)
        else {
          res.json({
            username: savedUser.username,
            _id: savedUser.id
          })
        }
      })
    }
    // if it already exists let the user know
    else {
        res.json({message: "username already exists, please choose another"})
    }
  })
})

app.get('/api/exercise/users', function(req, res) {
  User.find().select('-__v').then(user => res.json(user))
})

// return a log of a users exercises
app.get('/api/exercise/log', function(req, res) {
  // capture the query params supplied from user form
  let user_id = req.query.userId;
  let limit = req.query.limit;
  let from = new Date(req.query.from)
  let to = new Date(req.query.to)
  // look the user up in the db
  User.findById(user_id, function(err, existingUser){
    // display error if user didn't supply a valid id
    if (existingUser == undefined) {
      return res.json({message: 'User does not exist, please check id and try again.'})
    } 
    else {
      // search db for exercises associated with the user id and that match the date range supplied
      Exercise.find({ 
        user : user_id,
        date: {
          //if user supplies invalid date then use less then now and greater then start of epoch time
          $lt: to != 'Invalid Date' ? to.getTime() : Date.now() ,
          $gt: from != 'Invalid Date' ? from.getTime() : 0
        }
      })
      // sort the exercises so the closest to now is on top
      .sort('-date')
      // only show a certain amount if the user requested it
      .limit(parseInt(req.query.limit))
      // once all the exercises are found, create the response object with them
      .exec(function (err, stories) {
        if (err) return res.json(err)
          // create an array for the response object (aka 'log' array)
          let exercise_list = [];
          // for each object in the db, add it's relevant parameters to the response object
          stories.map(function(item){
          exercise_list.push({description: item.description, duration: item.duration, date: item.date.toDateString()})  
          })
        // add the user's info to the response object in association with the exercise count and log for them
        res.json({id: user_id,username: existingUser.username,count: exercise_list.length, log: exercise_list})
      })
    }
  })
})


// endpoint to create and associate an exercise object to an existing user object
app.post('/api/exercise/add', function(req, res){
  // caputre the variables from the form
  var user_id = req.body.userId
  var description = req.body.description
  var duration = parseInt(req.body.duration)
  // date is optional; 1. if supplied then create new date object based off (yyyy-mm-dd) string format. 2. create a new date if it's blank
  var date = (req.body.date == false) ? new Date() : new Date(req.body.date);
  // access the user info from the db to interact with and send back in the response
  User.findById(user_id, function(err, existingUser){
    // handle any errors from the user submission form
    if (existingUser == undefined || description.length == 0 || duration <= 0 || isNaN(duration)) {
      let error_message = [];
      // for each error that occurs, add it to the error message response array
      if (existingUser == undefined) {
        error_message.push(`User Error: User with id of ${user_id} does not exist, please check your id and try again.`)
      }
      if (description.length == 0 ) {
        error_message.push("Description Error: Description can't be blank.")
      }
      if (duration <= 0 || isNaN(duration)) {
        error_message.push("Duration Error: Duration must be a number greater than zero.")
      }
      // let the user know what errors they need to fix
      res.json({errors: error_message})
    }
    // if there are no errors, process the request
    else {
      // create a new exercise object from the supplied form data variables
      var exercise = new Exercise({
              user: user_id,
              description: description,
              duration: duration,
              date: date
          });
        // save the exercise to the db before adjusting any fields for the response object
        exercise.save(function (err) {
          if (err) return res.json(err);
          // create a response object seperate from the exercise objected saved in the db, the response object will have adjusted fields so it displays better to the user
          // create and return resposne object inside db save call or it doesn't work
          // cast the exercise model into an object, so it can be updated
          var newExercise = exercise.toObject();
          // add the username parameter to the start of the object for better visibility
          newExercise = {'username': existingUser.username, ...newExercise};
          // remove parameters that the user doesn't need to see
          delete newExercise.__v
          delete newExercise.user
          // add the id of the user the exercise was associated with
          newExercise._id = user_id
          // update the date format to display so the user can read it easier
          newExercise.date = date.toDateString()
          // display the reponse object to the user
          res.json(newExercise)
        })
    }
  })
})

