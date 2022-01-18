const jwt = require('jsonwebtoken');
const db = require('../models');

module.exports = authMiddleware = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) throw new Error();
    const accessToken = authorization.split(' ')[1];
    const tokenInBlacklist = await db.Blacklist.findOne({
      where: {
        token: accessToken
      }
    });
    if (tokenInBlacklist) throw new Error();
    // if JWT verify fails, it will throw and error and catch statement will catch it
    const { user_id } = jwt.verify(accessToken, process.env.JWT);
    // console.log('userid from auth', user_id);
    // console.log(req.headers);
    const user = await db.User.findOne({
      where: {
        id: user_id,
      },
      include: [{
        model: db.Follower,
        as: 'followings'
      }, {
        model: db.Follower,
        as: 'followers'
      }, {
        model: db.Post,
        as: 'posts'
      }]
    });
    // console.log('from the auth', user);
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (e) {
    res.status(403).send({ error: '403', message: 'Permission denied!' });
  }
};
