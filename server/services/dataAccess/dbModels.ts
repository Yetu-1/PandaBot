import env from "dotenv";
import { DataTypes, Model, Sequelize } from "sequelize";
import { v4 as uuidv4 } from "uuid";

env.config();

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: "postgres",
  ssl: true,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  protocol: "postgres",
});

export class DiscordGuild extends Model {
  public id!: string;
  public name!: string;
  public prefix!: string;
}

DiscordGuild.init(
  {
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
  },
  {
    sequelize,
    modelName: "guild",
  }
);

export class DiscordAIMessage extends Model {
  public id!: string;
  public content!: string;
  public authorId!: string;
  public conversationId!: string;
  public role!: 'user' | 'assistant' | 'system';
}

DiscordAIMessage.init(
  {
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
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user",
    },
  },
  {
    sequelize,
    modelName: "discord_ai_message",
  }
);

export class Conversation extends Model {
  public id!: string;
  public channelId!: string;
  public guildId!: string;
}

Conversation.init(
  {
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
  },
  {
    sequelize,
    modelName: "conversation",
  }
);

Conversation.beforeCreate((conversation: any) => {
  conversation.id = uuidv4();
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
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};
