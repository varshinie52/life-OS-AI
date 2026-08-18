const express = require('express');
const { check } = require('express-validator');
const noteController = require('./note.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
  ],
  validate,
  noteController.createNote
);

router.get('/', noteController.getNotes);
router.get('/:id', noteController.getNoteById);

router.put('/:id', noteController.updateNote);

router.delete('/:id', noteController.deleteNote);

router.patch('/:id/pin', noteController.togglePin);
router.patch('/:id/archive', noteController.toggleArchive);

module.exports = router;
