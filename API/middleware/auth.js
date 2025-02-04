const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    const token = req.header('Authorization'); // Token kinyerése az Authorization fejlécből
    if (!token) {
      console.error('Authentication failed: No token provided.');
      return res.status(401).json({ error: 'No token provided, access denied!' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token with the secret
      req.user = decoded;
      next(); // Continue to the next middleware or route handler
    } catch (error) {
      console.error('Authentication failed: Invalid token.', error);
      res.status(400).json({ error: 'Invalid token!' });
    }
  };
  

// Admin jogosultság ellenőrzése
const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {  // Ellenőrizzük, hogy a felhasználónak van-e admin jogosultsága
        return res.status(403).json({ error: 'Nincs jogosultság!' });
    }
    next(); // Tovább a következő middleware vagy route handler felé
};

module.exports = { authenticate, authorizeAdmin };
