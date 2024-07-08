const express = require("express");
require('dotenv').config();
const md5 = require('md5');
const path = require("path")
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const session = require('express-session');
const publicStaticPath = path.join(__dirname, "../public")
const temp_path = path.join(__dirname, "../views")
/* const partials_path = path.join(__dirname, "../templates/partials") */
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const nodemailer = require('nodemailer');
const sharedSession = require('express-socket.io-session');
/* dealing the sessions */
const expressSession = session({
  secret: process.env.SECRETKEY,
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge:12000000}
});

// Use expressSession middleware
app.use(expressSession);

// Attach the session middleware to socket.io
io.use(sharedSession(expressSession, {
  autoSave: true // Automatically save the session data
}));
/* dealing the sessions */

/* connecting database */
const mongoose = require("mongoose");
const { error } = require("console");
const { Socket } = require("dgram");

const uri = 'mongodb://localhost:27017/cbithack';
mongoose.connect(uri).then(()=>{
    console.log("connection successful with database")
}).catch((error)=>{
    console.log(error);
});
const Schema = mongoose.Schema;
const userSchema = new Schema({
    email: String, 
    password: String,
    name: String,
    mobile: Number
  });
const userChat = new Schema({
    email: String, 
    message: String,
    timestamp: { type: Date, default: Date.now },
});
const incidentSchema = new Schema({
  username:{
    type: String,
    required: true
  },
  anum: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  info: {
    type: String,
    required: true
  }
})
const eventSchema = new Schema({
  fname: String,
  eventname: String,
  description: String,
  location: String,
  eventdate: String,
  contact:String
});

const MyObj = mongoose.model('Hackuser', userSchema);
const TheObj = mongoose.model("Groupchat", userChat);
const reportIncident = mongoose.model("Incidents", incidentSchema);
const MyEvent = mongoose.model('MyEvent', eventSchema);
/* connecting to data base ends here */
app.set("view engine", "ejs");

app.set("views", temp_path);

app.use(express.static(publicStaticPath))


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

/* entering the users into the database */
/* handling the basic get requests */

app.get("/", (req, res)=>{
  res.render("login", {texthi: ""});

})
app.get("/home", (req, res)=>{
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
}
  res.render("home")
})
app.get("/signin", (req, res)=>{
  res.render("signin");

})
app.get("/report", (req, res)=>{
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
}
  res.render("report_incident")
})
app.get("/safetym", (req, res)=>{
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
}
  res.render("safety")
})
app.get("/about", (req, res)=>{
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
}
  res.render("aboutus")
})
app.get("/contact", (req, res)=>{
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
}
  res.render("contactus")
})
app.get("/law", (req, res)=>{
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
}
  res.render("law_enf")
})
app.get("/addevent", (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
}
  res.render("addevent");
});

/* handling the basic get requests */

/* handling the post requests */
app.post("/login", async (req, res)=>{
  const username = req.body.useremail;
  req.session.user = { username };
  try {
    const foundObject = await MyObj.findOne({ email: req.body.useremail, password: md5(req.body.userpassword) })

    if (foundObject) {
      
      res.redirect("/home")  
      
    } else {
    console.log('Object not found or authentication failed');
    res.render("login", {texthi: "Please enter the correct password!"})
    
    }

  } catch (error) {
    console.error('Error finding object:', error);
    res.status(500).json({ message: 'Internal server error' });
}
});

app.post("/signin", (req, res)=>{
  const username = req.body.useremaili;
  req.session.user = { username };
  const person_registeres = new MyObj({
    email: req.body.useremaili, 
    password: md5(req.body.userpasswordi),
    name: req.body.hisname,
    mobile: Number(req.body.hismobile)
})
  person_registeres.save()
  .then(savedObj => {
    console.log('Object saved successfully');
  })
  .catch(error => {
    console.error('Error saving object:', error);
  });
  res.redirect("/home");
})
/* handling the post requests */

app.post("/addevent", async (req, res) => {
  try {
    
    const eventData = {
      fname: req.body.fname,
      eventname: req.body.eventname,
      description: req.body.description,
      location: req.body.location,
      eventdate: req.body.eventdate,
      contact:req.body.contact
    };

   
    const events = new MyEvent(eventData);
    await events.save();

    console.log('Event saved successfully');
    res.redirect("/home");
  } catch (error) {
    console.error('Error saving event:', error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/calendar", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }
  try {
    const currentDate = new Date();
    

    // Fetch all events
    const events = await MyEvent.find();

    // Delete past events
    const pastEvents = events.filter(event => new Date(event.eventdate) < currentDate);
    for (const event of pastEvents) {
      await MyEvent.deleteOne({ _id: event._id });
    }

    // Fetch the updated list of events after deletion
    const updatedEvents = await MyEvent.find();
    

    res.render("calendar", { events: updatedEvents });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send("Error fetching events: " + err.message);
  }
});



app.post("/complainpost", (req, res) => {
  const complain = req.body.complain;
  const anum = req.body.anum;
  const subject = req.body.subject;
  const info = req.body.info;

  const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
          user: process.env.SENDERMAIL,
          pass: process.env.EMAIL_PASS
      }
  });

  const mailOptions = {
      from: process.env.SENDERMAIL,
      to: process.env.RECEIVERMAIL,
      subject: `New Complaint: ${subject}`,
      text: `Complain: ${complain}\nApartment Number: ${anum}\n\nBody:\n${info}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error('Error sending email:', error);
          res.status(500).json({ success: false, message: 'Error sending email' });
      } else {
          res.redirect("/home");
      }
  });
});
app.post("/repinc", (req, res) => {
 
  const anum = req.body.anum;
  const subject = req.body.subject;
  const info = req.body.info;

  const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
          user: process.env.SENDERMAIL,
          pass: process.env.EMAIL_PASS
      }
  });

  const repobj = new reportIncident ({

    username: JSON.stringify(req.session.user),
    anum: anum,
    subject: subject,
    info: info
  })
  repobj.save()
  .then(savedObj => {
    console.log('Object saved successfully');
  })
  .catch(error => {
    console.error('Error saving object:', error);
  });
  const mailOptions = {
      from: process.env.SENDERMAIL,
      to: process.env.RECEIVERMAIL,
      subject: `New Complaint: ${subject}`,
      text: `Apartment Number: ${anum}\n\nBody:\n${info}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.error('Error sending email:', error);
          res.status(500).json({ success: false, message: 'Error sending email' });
      } else {
          res.redirect("/home");
      }
  });
});

/* entering the users into the database */

/* groupchat messages making */
/* app.post("/chatpage", (req, res) => {
  if (!req.session.user) {
      return res.status(401).send('Unauthorized');
  }

  const text  = req.body.message_box;
  const username = req.session.user.username;
  console.log(username)
  const newText = new TheObj({ 
    email: username, 
    message: text,
     });
  newText.save()
  .then(savedObj => {
    console.log('Object saved successfully:', savedObj);
  })
  .catch(error => {
    console.error('Error saving object:', error);
  });
  res.redirect("/groupchat");

}); */
/* groupchat messages making */

/* groupchat rendering */
app.get("/groupchat", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized');
  }
  
  try {
    const username = req.session.user.username;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Delete messages older than 30 days
    await TheObj.deleteMany({ "timestamp": { $lt: thirtyDaysAgo } });
    
    const groupChats = await TheObj.find({});
    
    res.render("groupchat", { groupChats: groupChats, presentUser: username });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
  /* res.render("groupchat") */
});

/* groupchat rendering */

/* socket.io doing hahaaha iam too dumb do anyone really read this!! */

io.on('connection', (socket)=>{
  console.log("user connected");

  socket.on('disconnect', ()=>{
    console.log('user disconnect')
  })
  socket.on('chatmessage', msg => {
    
    if (!socket.handshake.session.user) {
      socket.emit('unauthorizedAccess');

      return ;
    }

    const text  = msg;
    if (text === ''){return }
    const username = socket.handshake.session.user.username;
    const newText = new TheObj({ 
      email: username, 
      message: text,
      });
    newText.save()
    .then(savedObj => {
      console.log('Object saved successfully');
    })
    .catch(error => {
      console.error('Error saving object:', error);
    });
    const timestamp = new Date().toLocaleString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
  });
    io.emit('message', [msg, username, timestamp])

})
})
app.get('/error404', (req, res) => {

  // Render the 404 error page
  res.render('error404');
});

/* 


/* socket.io doing hahaaha iam too dumb do anyone really read this!! */


/* reload */
app.post("/reload", (req, res)=>{
  res.redirect("/groupchat")
})
/* reload */
/* listen port */
httpServer.listen(process.env.PORT || 8000, function () {
  console.log("Server started on port 8000");
});
/* listen port */
