const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const AuthController = {
  // Inscription
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Cet email est déjà utilisé' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await UserModel.create({ username, email, passwordHash });

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, username: newUser.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({ user: newUser, token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
    }
  },

  // Connexion
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email et mot de passe requis' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Identifiants invalides' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      await UserModel.updateStatus(user.id, 'online');

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
        },
        token,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
    }
  },
};

module.exports = AuthController;
