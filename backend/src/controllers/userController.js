const UserModel = require('../models/userModel');

const UserController = {
  async listAll(req, res) {
    try {
      const users = await UserModel.findAllExcept(req.user.id);
      res.json({ users });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs' });
    }
  },
};

module.exports = UserController;
