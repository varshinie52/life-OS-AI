const express = require('express');
const { check } = require('express-validator');
const noteController = require('./note.controller');
const { validate } = require('../../middleware/validate.middleware');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// All note routes require authentication
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
router.get('/search', noteController.searchNotes);
router.get('/folders', noteController.getFolders);

router.get('/:id', noteController.getNoteById);

router.patch('/:id', noteController.updateNote);
router.put('/:id', noteController.updateNote);

router.delete('/:id', noteController.deleteNote);

router.post('/:id/pin', noteController.togglePin);
router.patch('/:id/pin', noteController.togglePin);

router.post('/:id/archive', noteController.toggleArchive);
router.patch('/:id/archive', noteController.toggleArchive);

module.exports = router;
