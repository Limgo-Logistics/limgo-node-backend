require('dotenv').config();

const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
const serviceId = process.env.TWILIO_SERVICE_SID;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

exports.signup = (req, res) => {
  const user = new User({
    // username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
    smsmobile: req.body.phoneNumber
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }
    client.verify.services(`${serviceId}`)
      .verifications
      .create({ to: `${req.body.phoneNumber}`, channel: 'sms' })
      .then(verification => console.log(verification.status));

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles }
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map(role => role._id);
          user.save(err => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully0!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        var token = jwt.sign({ id: user.id }, config.secret, {
          expiresIn: 86400 // 24 hours
        });

        user.save(err => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.status(200).send({
            id: user._id,
            email: user.email,
            phoneNumber: user.smsmobile,
            roles: authorities,
            firstName: user.firstName,
            lastName: user.lastName,
            accessToken: token
          });
        });
      });
    }
  });
};

exports.signin = (req, res) => {
  User.findOne({
    email: req.body.email
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "Invalid Email!" });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }
      res.status(200).send({
        id: user._id,
        email: user.email,
        phoneNumber: user.smsmobile,
        roles: authorities,
        firstName: user.firstName,
        lastName: user.lastName,
        accessToken: token
      });
    });
};

exports.verify = (req, res) => {
  client.verify.services(`${serviceId}`)
    .verificationChecks
    .create({ to: req.body.phoneNumber, code: req.body.code })
    .then(verification_check => {
      console.log(verification_check.status)

      if (verification_check.status === 'approved') {
        const updateVerify = async () => {
          const user = await User.findOne({ smsmobile: req.body.phoneNumber });
          const updatedStatus = { verified: true };
          await user.updateOne(updatedStatus);
        }
        updateVerify();
        res.send({ 'message': "Verified" })
      }

    });

};

exports.forgotPasswordRequest = async (req, res) => {
  const email = req.body.email;
  const code = generateCode();
  Mailer(email, code)

  try {
    const user = await User.findOne({ email: email });
    const updatedStatus = { passwordReset: code };
    await user.updateOne(updatedStatus);
  } catch (error) {
    res.status(500).send({ message: error });
    return error
  }

  res.send({ "message": "verification Code Sent" })
};

exports.forgotpassword = async (req, res) => {
  const email = req.body.email;
  const code = generateCode();


  User.findOne({
    email: email
  })
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "Invalid Email." });
      }

      Mailer(email, code);
      user.passwordReset = code;

      user.save(err => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        res.send({ "message": "verification Code Sent" });
      });
    }
    );
}
exports.forgotPasswordVerify = (req, res) => {
  User.findOne({
    email: req.body.email
  })
    .exec((err, user) => {
      if (err) {
        console.log("Invalid Email 1");

        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        console.log("Invalid Email");
        return res.status(404).send({ message: "Invalid Email." });
      }

      if (user.passwordReset != req.body.code) {
        console.log(`${req.body.code} Code Doesent mattch ${user.passwordReset}`)
        return res.status(401).send({
          message: "Invalid Code!"
        });
      }
      user.passwordReset = ''
      user.save(err => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }
      });
      return res.status(200).send({
        message: "Valid Code!"
      });
    }
    );
};

exports.updatePassword = (req, res) => {
  User.findOne({
    email: req.body.email
  })
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "Invalid Email." });
      }
      user.password = bcrypt.hashSync(req.body.password, 8);

      user.save(err => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        res.send({ message: "Password Change Successfully!" });
      });
    }
    );
};




const generateCode = () => {
  var val = Math.floor(1000 + Math.random() * 9000);
  return val;
}

function Mailer(email, code) {

  // async..await is not allowed in global scope, must use a wrapper
  async function main() {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: 'ekisnzaki@gmail.com', // generated ethereal user
        pass: 'jhsnhulffadzipqk', // generated ethereal password
      },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"Limgo Support" <support@limgo.com>', // sender address
      to: `${email}`, // list of receivers
      subject: "Recovery Password Email from Limgo", // Subject line
      // text: "This is Your Password Recovery Code", // plain text body
      html: `
        This is a Password Recovery Email from Limgo App, please treat it as important
        <br/> 
        <br/> 
        <b>Your Password recovery Code is: 
        <br/>
        <h1>${code}</h1></b>
        Please Don't share this with Anyone.
        <br/>
        If you didn't send this please Ignore the mail.
      `, // html body
    });

    console.log("Message sent: %s", info.messageId);
  }


  main().catch(console.error);
}