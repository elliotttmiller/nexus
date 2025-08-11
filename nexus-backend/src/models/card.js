module.exports = (sequelize, DataTypes) => {
  const Card = sequelize.define('Card', {
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
    account_id: {
      type: DataTypes.STRING,
      allowNull: true, // Now optional, Plaid cards use plaid_account_id
    },
    plaid_account_id: {
      type: DataTypes.STRING,
      allowNull: true, // For Plaid-linked cards
    },
    card_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    apr: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
    },
    credit_limit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rewards: {
      type: DataTypes.JSONB,
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
    tableName: 'cards',
    timestamps: true,
    underscored: true,
  });

  Card.associate = function(models) {
    Card.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    // Add any other associations here
  };

  return Card;
};