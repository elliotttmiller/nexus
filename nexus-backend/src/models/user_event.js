module.exports = (sequelize, DataTypes) => {
  const UserEvent = sequelize.define('UserEvent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    event_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    event_subtype: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'user_events',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['event_type'],
      },
      {
        fields: ['created_at'],
      },
    ],
  });

  UserEvent.associate = function(models) {
    UserEvent.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  // Add any instance methods or hooks here
  UserEvent.beforeUpdate((userEvent) => {
    userEvent.updated_at = new Date();
  });

  // Static method to log an event
  UserEvent.logEvent = async function(userId, eventType, data = {}, options = {}) {
    try {
      const { ip, userAgent, transaction } = options;
      
      // Create event data with only the fields that exist in the database
      const eventData = {
        user_id: userId,
        event_type: eventType,
        data,
      };
      
      // Only add optional fields if they exist in the database schema
      if (options.eventSubtype) {
        eventData.event_subtype = options.eventSubtype;
      }
      if (ip) {
        eventData.ip_address = ip;
      }
      if (userAgent) {
        eventData.user_agent = userAgent;
      }
      
      return await this.create(eventData, { transaction });
    } catch (error) {
      console.error('Error logging user event:', error);
      // Don't throw error to prevent breaking the main functionality
      return null;
    }
  };

  return UserEvent;
};