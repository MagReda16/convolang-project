const { Op } = require("sequelize");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../models');

const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;


exports.register = async (req, res) => {
  try {
    const { username, password, nativeLanguages, learningLanguages } = req.body;
    const hash = await bcrypt.hash(password, saltRounds);
    const foundUser = await db.User.findAll({ where: { username } });
    if (foundUser.length > 0) return res.status(409).send({ error: '409', message: 'User with this username already exists' });
    const user = await db.User.create({
      ...req.body,
      password: hash,
      learningLanguages: learningLanguages.toLowerCase(),
      nativeLanguages: nativeLanguages.toLowerCase()
    });
    res.status(200).send(user);
  } catch (e) {
    console.error(e);
    res.status(500).send('error');
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await db.User.findOne({ where: { username } });
    if (user.length === 0) throw new Error();
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw new Error();
    // create JWT and sign it with USER_ID to identify user, and send it back to the client
    // response will send JWT back
    const accessToken = jwt.sign({ user_id: user.id }, process.env.JWT);
    res.status(200).send({ accessToken });
  } catch (e) {
    // console.error(e);
    res.status(401).send({ error: '401', message: 'Invalid username and/or password' });
  }

};

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await db.User.findAll({
      where: {
        id
      },
      include: [{
        model: db.Follower,
        as: 'followings'
      }, {
        model: db.Follower,
        as: 'followers'
      }, {
        model: db.Message,
        as: 'messages'
      }, {
        model: db.Post,
        as: 'posts'
      }]
    });
    res.status(200).send(user);
  } catch (e) {
    // console.error(e);
    res.status(500).send('error');
  }
};

exports.getMe = async (req, res) => {
  res.status(200).send(req.user);
};

exports.getNativeLanguageSpeaker = async (req, res) => {
  try {
    const language = req.user.learningLanguages;
    const users = await db.User.findAll({
      where: {
        nativeLanguages: {
          [Op.substring]: language
        }
      }
    });
    // console.log(users);
    res.status(200).send(users);
  } catch (e) {
    console.error(e);
    res.status(500).send('error');
  }
};

exports.getLearningLanguageSpeaker = async (req, res) => {
  try {
    const language = req.user.nativeLanguages;
    const users = await db.User.findAll({
      where: {
        learningLanguages: {
          [Op.substring]: language
        }
      }
    });
    // console.log(users);
    res.status(200).send(users);
  } catch (e) {
    console.error(e);
    res.status(500).send('error');
  }
};

exports.logout = async (req, res) => {
  const { token } = req.body;
  try {
    const blacklistedToken = await db.Blacklist.create({
      token
    });
    // console.log(blacklistedToken);
    res.status(200).send({ message: 'Successfully logged out' });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: '500', message: 'Could not logout, please try again.' })
  }

};

exports.followUser = async (req, res) => {
  const { id } = req.params;
  try {
    const follower = await db.Follower.create({
      userId: req.user.id,
      followerId: id
    });
    res.status(200).send(follower);
  } catch (e) {
    console.error('error follow', e);
    res.status(500).send('error');
  }
};

exports.unfollowUser = async (req, res) => {
  const { id } = req.params;
  try {
    await db.Follower.destroy({
      where: {
        userId: req.user.id,
        followerId: id
      }
    });
    res.status(200).send({message: 'unfollowed'});
  } catch (e) {
    console.error('error unfollow', e);
    res.status(500).send('error');
  }
};

exports.createPost = async (req, res) => {
  try {
    // console.log('userid from cretepost', req.user.id)
    const post = await db.Post.create({
      content: req.body.content,
      userId: req.user.id,
    });
    // console.log(post);
    res.status(200).send({ message: 'created post' });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: '500', message: 'Error while creating post' });
  }
};

exports.getUserPosts = async (req, res) => {
  // console.log('id from the getuserposts', id);
  try {
    const id = req.user.id;
    const ids = req.user.followings.map(u => u.followerId);
    const userPosts = await db.Post.findAll({
      where: {
        userId: {
          [Op.in]: [...ids, id]
        }
      },
      order: [
        ['createdAt', 'DESC']
      ]
    });
    res.status(200).send(userPosts);
  } catch (e) {
    console.error(e);
    res.status(500).send({error: '500', message: 'Error while retrieving posts'});
  }
};

exports.getFollowers = async (req, res) => {
  try {
    const followers = await db.Follower.findAll({
      where: {
        followerId: 3,
      },
      include: [{
        model: db.User,
        as: 'followings',
        attributes: ['id', 'firstName', 'lastName']
      }]
    });
    // console.log(followers);
    res.status(200).send(followers.map(follower => follower.followings));
  } catch (e) {
    console.error(e);
    res.status(500).send({error: '500', message: 'Error retrieving followers'});
  }
};

exports.getFollowingsPosts = async (req, res) => {
  try {
    const ids = req.user.followings.map(u => u.followerId);
    // console.log(ids);
    const posts = await db.Post.findAll({
      where: {
        userId: {
          [Op.in]: ids
        }
      }
    });
    // console.log(posts);
    res.status(200).send(posts);
  } catch(e) {
    console.error(e);
    res.status(500).send({error: '500', message: 'Error retrieving followings posts'});
  }
};