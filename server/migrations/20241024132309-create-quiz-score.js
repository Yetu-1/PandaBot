'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('QuizScores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      quiz_id: {
        type: Sequelize.UUID,
        references: {
          model: 'Quizzes', // Ensure this matches your quizzes table name
          key: 'id', // Reference to the primary key in the quizzes table
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.STRING(20)
      },
      username: {
        type: Sequelize.STRING(80)
      },
      score: {
        type: Sequelize.INTEGER
      }
    });
    // Adding a constraint
    await queryInterface.addConstraint('QuizScores', {
      fields: ['quiz_id', 'user_id'],
      type: 'unique',
      name: 'unique_quiz_score',
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('QuizScores');
  }
};