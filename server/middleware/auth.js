const { clerkClient, getAuth } = require('@clerk/express');
const db = require('../db');

function authenticate(req, res, next) {
  if (!getAuth(req).userId) return res.status(401).json({ error: 'Please sign in to continue.' });
  next();
}

function createSyncUser(database = db, client = clerkClient) {
  return async (req, res, next) => {
    const { userId } = getAuth(req);
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses.find(item => item.id === user.primaryEmailAddressId)?.emailAddress
      || user.emailAddresses[0]?.emailAddress;
    if (!email) return res.status(422).json({ error: 'Add an email address to your account before using the wallet.' });
    const role = user.publicMetadata?.role || 'member';
    try {
      // Clerk ID is the identity. Never merge records by email.
      await database.query(
        `INSERT INTO users (id, username, email, role) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role`,
        [userId, userId, email, role],
      );
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'This email or username belongs to another wallet identity. Contact the administrator; your records have not been merged.' });
      }
      throw error;
    }
    req.clerkUser = user;
    req.userRole = role;
    next();
  };
}

const syncUser = createSyncUser();
const requireRole = (...roles) => (req, res, next) => {
  if (!getAuth(req).userId) return res.status(401).json({ error: 'Please sign in to continue.' });
  if (!roles.includes(req.userRole)) return res.status(403).json({ error: 'Insufficient permissions.' });
  next();
};

module.exports = { authenticate, syncUser, createSyncUser, requireRole };