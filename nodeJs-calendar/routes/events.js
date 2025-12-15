// routes/events.js
/*
  /api/events
*/
const { Router } = require('express');
const { check } = require('express-validator');
const { validarCampos } = require('../middlewares/validar-campos');
const { validarJWT } = require('../middlewares/validar-jwt');
const { isDate } = require('../helpers/isDate');

const {
  getEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento
} = require('../controllers/events');

const router = Router();
router.use(validarJWT);

router.get('/', getEventos);

router.post('/',
  [
    check('title','El titulo es obligatorio').not().isEmpty(),
    check('start','Fecha de inicio es obligatoria').custom(isDate),
    check('end','Fecha de finalización es obligatoria').custom(isDate),
    check('calendarId','calendarId es obligatorio').not().isEmpty(),
    validarCampos
  ],
  crearEvento
);

router.put('/:id',
  [
    check('title','El titulo es obligatorio').not().isEmpty(),
    check('start','Fecha de inicio es obligatoria').custom(isDate),
    check('end','Fecha de finalización es obligatoria').custom(isDate),
    validarCampos
  ],
  actualizarEvento
);

router.delete('/:id', eliminarEvento);

module.exports = router;
