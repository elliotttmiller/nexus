const { User } = require('./src/models');

async function main() {
  const user = await User.findOne({ where: { email: 'elliotttmiller@hotmail.com' } });
  if (!user) {
    console.error('User not found');
    process.exit(1);
  }
  console.log('User ID for elliotttmiller@hotmail.com:', user.id);
}

main().catch(e => { console.error(e); process.exit(1); });
