const express = require('express');
const router = express.Router();
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('../models'); // Use Sequelize models

// Session middleware (should be added in app.js, but for demo, add here if not present)
// router.use(session({
//   secret: process.env.SESSION_SECRET || 'nexus_secret',
//   resave: false,
//   saveUninitialized: false,
//   cookie: { secure: false, httpOnly: true, maxAge: 24*60*60*1000 }
// }));

function requireAdminLogin(req, res, next) {
  if (req.session && req.session.adminUser) {
    return next();
  }
  return res.redirect('/admin/login');
}

// Admin login page
router.get('/login', (req, res) => {
  res.send(`
    <html><head><title>Admin Login</title></head><body>
      <h2>Admin Login</h2>
      <form method="POST" action="/admin/login">
        <input name="email" type="email" placeholder="Email" required /><br/>
        <input name="password" type="password" placeholder="Password" required /><br/>
        <button type="submit">Login</button>
      </form>
      ${req.query.error ? `<p style='color:red;'>${req.query.error}</p>` : ''}
    </body></html>
  `);
});

// Admin login POST
router.post('/login', express.urlencoded({ extended: true }), async (req, res) => {
  const { email, password } = req.body;
  const admin = await db.User.findOne({ where: { email } });
  if (!admin || !await bcrypt.compare(password, admin.password_hash)) {
    return res.redirect('/admin/login?error=Invalid credentials');
  }
  req.session.adminUser = { id: admin.id, email: admin.email };
  res.redirect('/admin');
});

// Admin logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// Admin dashboard home (protected)
router.get('/', requireAdminLogin, async (req, res) => {
  // Analytics queries
  const [userCount, cardCount, txCount] = await Promise.all([
    db.User.count(),
    db.Card.count(),
    db.Transaction.count()
  ]);
  // System health (DB status, uptime)
  let dbStatus = 'OK';
  try {
    await db.sequelize.authenticate();
  } catch (e) {
    dbStatus = 'ERROR';
  }
  const uptime = process.uptime();
  const uptimeH = Math.floor(uptime / 3600);
  const uptimeM = Math.floor((uptime % 3600) / 60);
  const uptimeS = Math.floor(uptime % 60);
  res.send(`
    <html>
      <head>
        <title>Nexus Admin</title>
        <style>
          body { font-family: Arial, sans-serif; background: #f8f8f8; }
          .admin-header { background: #222; color: #fff; padding: 20px; }
          .admin-section { margin: 40px; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px #ddd; }
          .analytics { margin-bottom: 30px; }
          .health { margin-bottom: 30px; }
          a { color: #007bff; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="admin-header">
          <h1>Nexus Admin Dashboard</h1>
          <p>Welcome, ${req.session.adminUser.email}</p>
          <a href="/admin/logout">Logout</a>
        </div>
        <div class="admin-section">
          <div class="analytics">
            <h2>Analytics</h2>
            <ul>
              <li><b>Total Users:</b> ${userCount}</li>
              <li><b>Total Cards:</b> ${cardCount}</li>
              <li><b>Total Transactions:</b> ${txCount}</li>
            </ul>
          </div>
          <div class="health">
            <h2>System Health</h2>
            <ul>
              <li><b>Database Status:</b> ${dbStatus}</li>
              <li><b>Server Uptime:</b> ${uptimeH}h ${uptimeM}m ${uptimeS}s</li>
            </ul>
          </div>
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

// List users (admin only)
router.get('/users', requireAdminLogin, async (req, res) => {
  const users = await db.User.findAll({ attributes: ['id', 'email', 'created_at'], order: [['id', 'DESC']] });
  res.send(`
    <html><head><title>Users - Nexus Admin</title></head><body>
    <h1>Users</h1>
    <a href="/admin/users/add">Add User</a>
    <table border="1" cellpadding="5"><tr><th>ID</th><th>Email</th><th>Created</th><th>Actions</th></tr>
    ${users.map(u => `<tr><td>${u.id}</td><td>${u.email}</td><td>${u.created_at}</td><td><a href="/admin/users/edit/${u.id}">Edit</a> | <a href="/admin/users/delete/${u.id}" onclick="return confirm('Delete user?')">Delete</a></td></tr>`).join('')}
    </table>
    <a href="/admin">Back to admin</a>
    </body></html>
  `);
});

// Add user form
router.get('/users/add', requireAdminLogin, (req, res) => {
  res.send(`
    <html><head><title>Add User</title></head><body>
    <h1>Add User</h1>
    <form method="POST" action="/admin/users/add">
      <input name="email" type="email" placeholder="Email" required /><br/>
      <input name="password" type="password" placeholder="Password" required /><br/>
      <button type="submit">Add User</button>
    </form>
    <a href="/admin/users">Back to users</a>
    </body></html>
  `);
});

// Add user POST
router.post('/users/add', requireAdminLogin, express.urlencoded({ extended: true }), async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await db.User.create({ email, password_hash: hash });
  res.redirect('/admin/users');
});

// Edit user form
router.get('/users/edit/:id', requireAdminLogin, async (req, res) => {
  const user = await db.User.findByPk(req.params.id);
  if (!user) return res.send('User not found');
  res.send(`
    <html><head><title>Edit User</title></head><body>
    <h1>Edit User</h1>
    <form method="POST" action="/admin/users/edit/${user.id}">
      <input name="email" type="email" value="${user.email}" required /><br/>
      <input name="password" type="password" placeholder="New Password (leave blank to keep)" /><br/>
      <button type="submit">Save</button>
    </form>
    <a href="/admin/users">Back to users</a>
    </body></html>
  `);
});

// Edit user POST
router.post('/users/edit/:id', requireAdminLogin, express.urlencoded({ extended: true }), async (req, res) => {
  const user = await db.User.findByPk(req.params.id);
  if (!user) return res.send('User not found');
  user.email = req.body.email;
  if (req.body.password) {
    user.password_hash = await bcrypt.hash(req.body.password, 10);
  }
  await user.save();
  res.redirect('/admin/users');
});

// Delete user
router.get('/users/delete/:id', requireAdminLogin, async (req, res) => {
  await db.User.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/users');
});

// List cards (admin only)
router.get('/cards', requireAdminLogin, async (req, res) => {
  const cards = await db.Card.findAll({ attributes: ['id', 'card_name', 'user_id', 'balance'], order: [['id', 'DESC']] });
  res.send(`
    <html><head><title>Cards - Nexus Admin</title></head><body>
    <h1>Cards</h1>
    <table border="1" cellpadding="5"><tr><th>ID</th><th>Name</th><th>User ID</th><th>Balance</th></tr>
    ${cards.map(c => `<tr><td>${c.id}</td><td>${c.card_name}</td><td>${c.user_id}</td><td>${c.balance}</td></tr>`).join('')}
    </table>
    <a href="/admin">Back to admin</a>
    </body></html>
  `);
});

// List transactions (admin only)
router.get('/transactions', requireAdminLogin, async (req, res) => {
  const txs = await db.Transaction.findAll({ attributes: ['id', 'user_id', 'amount', 'created_at'], order: [['id', 'DESC']] });
  res.send(`
    <html><head><title>Transactions - Nexus Admin</title></head><body>
    <h1>Transactions</h1>
    <table border="1" cellpadding="5"><tr><th>ID</th><th>User ID</th><th>Amount</th><th>Created</th></tr>
    ${txs.map(t => `<tr><td>${t.id}</td><td>${t.user_id}</td><td>${t.amount}</td><td>${t.created_at}</td></tr>`).join('')}
    </table>
    <a href="/admin">Back to admin</a>
    </body></html>
  `);
});

module.exports = router;
