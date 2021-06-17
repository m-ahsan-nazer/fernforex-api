const moment = require('moment');
const config = require('../../src/config/config');
const { tokenTypes } = require('../../src/config/tokens');
const tokenService = require('../../src/services/token.service');
const { userOne, userThree, userFour, admin, admin2 } = require('./user.fixture');

const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
const userOneAccessToken = tokenService.generateToken(userOne._id, accessTokenExpires, tokenTypes.ACCESS);
const adminAccessToken = tokenService.generateToken(admin._id, accessTokenExpires, tokenTypes.ACCESS);
const admin2AccessToken = tokenService.generateToken(admin2._id, accessTokenExpires, tokenTypes.ACCESS);
const userThreeAccessToken = tokenService.generateToken(userThree._id, accessTokenExpires, tokenTypes.ACCESS);
const userFourAccessToken = tokenService.generateToken(userFour._id, accessTokenExpires, tokenTypes.ACCESS);

module.exports = {
  userOneAccessToken,
  userThreeAccessToken,
  userFourAccessToken,
  adminAccessToken,
  admin2AccessToken,
};
