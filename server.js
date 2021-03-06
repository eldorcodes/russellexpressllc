const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const keys = require('./config/key');
const Nexmo = require('nexmo');
const Handlebars = require('handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const nodemailer = require("nodemailer");
const formidable = require('formidable');
const cors = require('cors');
// Load models
const Contact = require('./models/contact');
const Driver = require('./models/driver');
const Review = require('./models/review');
// initalize app
const app = express();
const {
    formatDate,
    getLastMinute,
    getYear
} = require('./helpers/time');
const { upload } = require('./helpers/aws');
// Body Parser Middleware
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors());
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    helpers: {
        formatDate: formatDate,
        getLastMinute: getLastMinute,
        getYear: getYear
    }
}));
app.set('view engine', 'handlebars');
const publicPath = path.join(__dirname, './public');
const port = process.env.PORT || 3000;
app.use(express.static(publicPath));
// connect to MongoDB
mongoose.connect(keys.MongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB...');
}).catch((err) => {
    console.log(err);
});
app.get('/', (req, res) => {
    res.render('home');
});
app.get('/about', (req, res) => {
    res.render('about')
})
app.get('/apply', (req, res) => {
    res.render('apply')
})
app.get('/applyindetail', (req, res) => {
    res.send('URL expired')
})
app.get('/contact', (req, res) => {
    res.render('contactus');
});
app.get('/terms', (req, res) => {
    res.render('terms');
});
app.get('/privacy', (req, res) => {
    res.render('privacy');
});
// app.get('/applications', (req, res) => {
//     Driver.find({}).then((drivers) => {
//         res.render('inbox', {
//             drivers: drivers
//         })
//     }).catch((e) => console.log(e))
// })
app.get('/inbox', (req, res) => {
    res.render('checker', {
        errorMessage: ''
    });
});
app.post('/check', (req, res) => {
        if (req.body.code == keys.code) {
            Contact.find({}).then((contacts) => {
                Driver.find({}).then((drivers) => {
                    res.render('contacts', {
                        contacts: contacts,
                        drivers: drivers
                    })
                }).catch((e) => console.log(e))
            }).catch(e => console.log(e))
        } else {
            res.render('checker', {
                errorMessage: 'Passcode is incorrect'
            })
        }
    })
    // receive image
app.post('/uploadImage', upload.any(), (req, res) => {
    const form = new formidable.IncomingForm();
    form.on('file', (field, file) => {
        console.log(file);
    });
    form.on('error', (err) => {
        console.log(err);
    });
    form.on('end', () => {
        console.log('Image received successfully..');
    });
    form.parse(req);
});
const server = http.createServer(app);
// SOCKET CONNECTION AND NOTIFIER STARTS
const io = socketIO(server);
io.on('connection', (socket) => {
    console.log('Connected to Client');

    // listen to new contact event
    socket.on('newContact', (newContact) => {
        console.log(newContact);
        new Contact(newContact).save((err, contact) => {
            if (err) {
                console.log(err);
            }
            if (contact) {
                console.log('Someone contacted us..');
            }
        });
    });
    // listen to serviceRequest event
    socket.on('newDriverInfo', (newDriver) => {
        console.log(newDriver);
        const newDriverInfo = {
            name: newDriver.name,
            email: newDriver.email,
            number: newDriver.number,
            ssn: newDriver.ssn,
            address: newDriver.address,
            age: newDriver.age,
            clientDrivingExperience: newDriver.clientDrivingExperience,
            typeOfLicense: newDriver.typeOfLicense,
            clientLicenseNumber: newDriver.clientLicenseNumber,
            legalDocument: newDriver.legalDocument,
            licenseImage: `https://car-rental-app.s3.amazonaws.com/${newDriver.imageUrl}`,
            date: new Date()
        }
        new Driver(newDriverInfo).save((err, driver) => {
            if (err) {
                console.log(err);
            }
            if (driver) {
                console.log('New Driver Info received ..');
                // NEXMO
                const phone = parseInt(newDriver.number);
                const nexmo = new Nexmo({
                    apiKey: keys.NextmoApiKey,
                    apiSecret: keys.NextmoApiSecret,
                });

                const from = 17034684937;
                const to = 13104150055;
                const text = `${newDriver.name} just submitted his information online!`;

                nexmo.message.sendSms(from, to, text);

                // NODE MAILER
                // create reusable transporter object using the default SMTP transport
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: 'eldor2887@gmail.com', // generated ethereal user
                        pass: keys.pass, // generated ethereal password
                    },
                    tls: {
                        // do not fail on invalid certs
                        rejectUnauthorized: false
                    }
                });

                // send mail with defined transport object
                transporter.sendMail({
                    from: '"Russell Express LLC" <russellexpressllc@gmail.com>', // sender address
                    to: "russellxpress@gmail.com, eldorcodes@icloud.com", // list of receivers
                    subject: "New CDL Driver just submitted application online.", // Subject line
                    text: "Here is detailed information below.", // plain text body
                    html: `Hello! Here is new driver information recently submitted online. <br> Name: ${newDriver.name},
                        <br>
                        Email: ${newDriver.email},<br>
                        Phone: ${newDriver.number}, <br>
                        SSN: ${newDriver.ssn}, <br>
                        Address: ${newDriver.address},<br>
                        Driving Experience: ${newDriver.clientDrivingExperience},<br>
                        License Type: ${newDriver.typeOfLicense},<br>
                        License Number: ${newDriver.clientLicenseNumber},<br>
                        Legal Document: ${newDriver.legalDocument},<br>
                        Date: ${newDriver.date}. <br>
                        <img src="${newDriver.licenseImage}" width="200px" />
                        <p>To see all new drivers application in detail, click a following link: <a href="https://russellexpressllc.herokuapp.com/drivers">Open Website now!</a></p>, <br>
                        I will update you later! <br>
                        Thank you! Have a good day!<br>
                        <small>This is automatic email ..</small>`, // html body
                }).catch((e) => console.log(e))
            }
        });
    });
    // handling typing event triggered by client
    // socket.on('email',(email) => {
    //     console.log(email.email)
    // })
    // socket.on('number',(number) => {
    //     console.log(number.number)
    // })
    // listen to newReview event
    socket.on('newReview', (newReview) => {
        console.log(newReview);
        new Review(newReview).save((err, review) => {
            if (err) {
                console.log(err);
            }
            if (review) {
                console.log('New Review received', newReview);
            }
        })
    });
    // send only 4 and 5 star review to client
    Review.find({ $or: [{ rating: 4 }, { rating: 5 }] }).then((reviews) => {
        socket.emit('reviews', { reviews: reviews });
    }).catch((err) => { console.log(err) });
});
io.on('disconnection', () => {
    console.log('Disconnected from Client');
});
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});