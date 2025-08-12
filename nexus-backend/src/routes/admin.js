const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/authenticateToken');
const db = require('../db'); // Assumes you have a db.js for database access

// Admin dashboard home (HTML, similar to Django admin)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Nexus Admin</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f8f8f8; }
          .admin-header { background: #222; color: #fff; padding: 20px; }
          .admin-section { margin: 40px; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px #ddd; }
          a { color: #007bff; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="admin-header">
          <h1>Nexus Admin Dashboard</h1>
          <p>Welcome, ${req.user.email}</p>
        </div>
        <div class="admin-section">
          <h2>Models</h2>
          <ul>
            <li><a href="/admin/users">Users</a></li>
            <li><a href="/admin/cards">Cards</a></li>
            <li><a href="/admin/transactions">Transactions</a></li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// List users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  const users = await db.query('SELECT id, email, created_at FROM users ORDER BY id DESC');
  res.send(`
    <html><head><title>Users - Nexus Admin</title></head><body>
    <h1>Users</h1>
    <table border="1" cellpadding="5"><tr><th>ID</th><th>Email</th><th>Created</th></tr>
    ${users.rows.map(u => `<tr><td>${u.id}</td><td>${u.email}</td><td>${u.created_at}</td></tr>`).join('')}
    </table>
    <a href="/admin">Back to admin</a>
    </body></html>
  `);
});

// List cards
router.get('/cards', authenticateToken, requireAdmin, async (req, res) => {
  const cards = await db.query('SELECT id, name, user_id, balance FROM cards ORDER BY id DESC');
  res.send(`
    <html><head><title>Cards - Nexus Admin</title></head><body>
    <h1>Cards</h1>
    <table border="1" cellpadding="5"><tr><th>ID</th><th>Name</th><th>User ID</th><th>Balance</th></tr>
    ${cards.rows.map(c => `<tr><td>${c.id}</td><td>${c.name}</td><td>${c.user_id}</td><td>${c.balance}</td></tr>`).join('')}
    </table>
    <a href="/admin">Back to admin</a>
    </body></html>
  `);
});

// List transactions
router.get('/transactions', authenticateToken, requireAdmin, async (req, res) => {
  const txs = await db.query('SELECT id, user_id, amount, created_at FROM transactions ORDER BY id DESC');
  res.send(`
    <html><head><title>Transactions - Nexus Admin</title></head><body>
    <h1>Transactions</h1>
    <table border="1" cellpadding="5"><tr><th>ID</th><th>User ID</th><th>Amount</th><th>Created</th></tr>
    ${txs.rows.map(t => `<tr><td>${t.id}</td><td>${t.user_id}</td><td>${t.amount}</td><td>${t.created_at}</td></tr>`).join('')}
    </table>
    <a href="/admin">Back to admin</a>
    </body></html>
  `);
});

module.exports = router;
