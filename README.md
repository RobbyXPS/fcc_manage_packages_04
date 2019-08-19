# APIs and Microservices Projects - Exercise Tracker REST API

### _User stories_

1. I can create a user by posting form data username to /api/exercise/new-user and returned will be an object with username and _id.
2. I can get an array of all users by getting api/exercise/users with the same info as when creating a user.
3. I can add an exercise to any user by posting form data userId(_id), description, duration, and optionally date to /api/exercise/add. If no date supplied it will use current date. Returned will the the user object with also with the exercise fields added.
4. I can retrieve a full exercise log of any user by getting /api/exercise/log with a parameter of userId(_id). Return will be the user object with added array log and count (total exercise count).
5. I can retrieve part of the log of any user by also passing along optional parameters of from & to or limit. (Date format yyyy-mm-dd, limit = int)

  <br>
  <br>
  <br>
  <br>

### _Technology and how it was used_

#### Back-End features (Node + Express)

    - Basic implemenation of CRUD endpoints (see User Stories).
    - Obtain data via URL query parameters before saving in database.

#### Front-End features (HTML + CSS + Form Submission)

    - Front-End > Back-End communication via form action/method attributes.
    - Basic HTML and CSS to render front end.

#### Database (Mongo + Mongoose)

    - MongoDB managed in the cloud via https://www.mongodb.com/cloud.
    - Mongoose ODM (Object Document Mapper) used to make DB interactions more graceful such as sort and limit.
