const { verifySignUp } = require("../middlewares");
const controller = require("../controllers/auth.controller");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted
    ],
    controller.signup
  );

  app.post("/api/auth/signin", controller.signin);

  app.patch("/api/auth/verify", controller.verify);

  app.post("/api/auth/forgotPassword", controller.forgotpassword); 

  app.patch("/api/auth/forgotPasswordVerify", controller.forgotPasswordVerify);

  app.patch("/api/auth/updatePassword", controller.updatePassword);
}; 
