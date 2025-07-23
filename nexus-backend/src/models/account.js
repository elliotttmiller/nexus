module.exports = (sequelize, DataTypes) => {
  const Account = sequelize.define('Account', {
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
    plaid_access_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    plaid_item_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    institution_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    institution_name: {
      type: DataTypes.STRING,
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
    tableName: 'accounts',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['plaid_item_id'],
      },
    ],
  });

  Account.associate = function(models) {
    Account.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });

    Account.hasMany(models.Card, {
      foreignKey: 'account_id',
      as: 'cards',
    });
  };

  // Add any instance methods or hooks here
  Account.beforeUpdate((account) => {
    account.updated_at = new Date();
  });

  return Account;
};