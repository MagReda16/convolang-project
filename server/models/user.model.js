const db = require('./');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    nativeLanguages: DataTypes.STRING,
    learningLanguages: DataTypes.STRING,
  });

  User.associate = db => {
    db.User.hasMany(db.Follower, {sourceKey: 'id', foreignKey: 'userId', as: 'followers'});
    db.User.hasMany(db.Follower, {sourceKey: 'id', foreignKey: 'followerId', as: 'followings'});
  };

  return User;
};