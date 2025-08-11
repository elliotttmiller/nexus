module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    card_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cards',
        key: 'id',
      },
    },
    account_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'accounts',
        key: 'id',
      },
    },
    plaid_transaction_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
    },
    merchant: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    merchant_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    datetime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pending: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    payment_meta: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    payment_channel: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transaction_type: {
      type: DataTypes.ENUM('purchase', 'payment', 'fee', 'interest', 'other'),
      allowNull: false,
      defaultValue: 'purchase',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ai_card_analysis: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Stores AI card recommendation analysis for this transaction',
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
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['card_id'],
      },
      {
        fields: ['account_id'],
      },
      {
        fields: ['date'],
      },
      {
        fields: ['merchant'],
      },
      {
        fields: ['category'],
      },
    ],
  });

  Transaction.associate = function(models) {
    Transaction.belongsTo(models.Card, {
      foreignKey: 'card_id',
      as: 'card',
      onDelete: 'CASCADE',
    });

    Transaction.belongsTo(models.Account, {
      foreignKey: 'account_id',
      as: 'account',
      onDelete: 'CASCADE',
    });
  };

  // Add any instance methods or hooks here
  Transaction.beforeUpdate((transaction) => {
    transaction.updated_at = new Date();
  });

  return Transaction;
};