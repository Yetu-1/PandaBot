'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Question extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Question.init({
    quiz_id: DataTypes.UUID,
    number: DataTypes.INTEGER,
    question: DataTypes.TEXT,
    options: DataTypes.ARRAY(DataTypes.TEXT),
    answer: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Question',
  });

  Question.associate = function(models) {
    Question.belongsTo(models.Quiz, { foreignKey: 'id', targetKey: 'id', onDelete: 'CASCADE' });
  };
  return Question;
};