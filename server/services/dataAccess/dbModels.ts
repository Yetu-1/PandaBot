import env from "dotenv";
import { DataTypes, Sequelize } from "sequelize";

env.config();

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false,
});

export const DiscordGuild = sequelize.define("guild", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  prefix: {
    type: DataTypes.STRING,
    defaultValue: "/",
  },
});


export const DiscordAIMessage = sequelize.define("discord_ai_message", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  content: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  authorId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  conversationId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

export const Conversation = sequelize.define("conversation", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  channelId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  guildId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

Conversation.hasMany(DiscordAIMessage, {
  foreignKey: "conversationId",
  as: "messages",
});
DiscordAIMessage.belongsTo(Conversation, {
  foreignKey: "conversationId",
});

export const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    await sequelize.sync();
    console.log("Database synchronized.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};
