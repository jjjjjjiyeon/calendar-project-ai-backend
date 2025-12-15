// controllers/auth.js
const { response } = require('express');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const Calendar = require('../models/Calendar');
const { generarJWT } = require('../helpers/jwt');

const crearUsuario = async (req, res = response) => {
  const { email, password, name } = req.body;

  try {
    let usuario = await Usuario.findOne({ email });
    if (usuario) {
      return res.status(400).json({ ok:false, msg:'El usuario ya existe' });
    }

    usuario = new Usuario({ name, email, password });

    const salt = bcrypt.genSaltSync();
    usuario.password = bcrypt.hashSync(password, salt);
    await usuario.save();

    const token = await generarJWT(usuario.id, usuario.name);

    return res.status(201).json({
      ok: true,
      uid: usuario.id,
      name: usuario.name,
      token,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok:false, msg:'Por favor hable con el administrador' });
  }
};

const loginUsuario = async (req, res = response) => {
  const { email, password } = req.body;

  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ ok:false, msg:'El usuario no existe con ese email' });
    }

    const validPassword = bcrypt.compareSync(password, usuario.password);
    if (!validPassword) {
      return res.status(400).json({ ok:false, msg:'Password incorrecto' });
    }

    const token = await generarJWT(usuario.id, usuario.name);

    return res.json({ ok:true, uid:usuario.id, name:usuario.name, token });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ ok:false, msg:'Por favor hable con el administrador' });
  }
};

const revalidarToken = async (req, res = response) => {
  const { uid, name } = req;
  const token = await generarJWT(uid, name);
  return res.json({ ok:true, uid, name, token });
};

module.exports = { crearUsuario, loginUsuario, revalidarToken };
