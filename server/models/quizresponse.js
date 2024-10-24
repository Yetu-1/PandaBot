'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class QuizResponse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  QuizResponse.init({
    quiz_id: DataTypes.UUID,
    user_id: DataTypes.STRING,
    username: DataTypes.STRING,
    number: DataTypes.INTEGER,
    answer: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'QuizResponse',
  });
  return QuizResponse;
};