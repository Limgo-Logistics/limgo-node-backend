const db = require("../models");
const User = db.user;

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};




exports.viewProfile = (req, res) => {
  User.findOne({
    _id:req.userId
  })
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "Invalid Email!" });
      }

      res.status(200).send({
        id: user._id,
        firstName: user.firstName ? user.firstName : '',
        lastName: user.lastName ? user.lastName : '',
        email: user.email,
        phoneNumber: user.smsmobile
      });
    });
}
/* exports.editProfile = async (req, res) => {
  // User.findOne({
  //   email: req.body.email
  // })
  //   .populate("roles", "-__v")
  //   .exec((err, user) => {
  //     if (err) {
  //       res.status(500).send({ message: err });
  //       return;
  //     }

  //     if (!user) {
  //       return res.status(404).send({ message: "Invalid Email!" });
  //     }

  //     res.status(200).send({
  //       id: user._id,
  //       firstName: user.firstName ? user.firstName : '',
  //       lastName: user.lastName ? user.lastName : '',
  //       email: user.email,
  //       phoneNumber: user.smsmobile
  //     });
  //   });
  const { firstName, lastName, email, phoneNumber } = req.body;
  let doc = await User.findOneAndUpdate({ email },
    {
      firstName,
      lastName,
      email,
      phoneNumber
    }, {
    new: true
  });

  console.log(doc);
} */

exports.editProfile = async (req, res) => {
  const { firstName, lastName, email, phoneNumber } = req.body;
  User.findOneAndUpdate({ _id:req.userId },
    {
      firstName,
      lastName,
      email,
      phoneNumber
    }, {
    new: true
  })
    .exec((error, user) => {
      if (error) {
        res.status(500).send({ message: error });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "Invalid User." });
      }


      user.save(err => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }
        res.status(200).send({
          id: user._id,
          firstName: user.firstName ? user.firstName : '',
          lastName: user.lastName ? user.lastName : '',
          email: user.email,
          phoneNumber: user.smsmobile
        });
      });

    })
}