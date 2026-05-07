import {createNote, deleteNote, getUserNotes, updateNote,getNoteById} from "../controllers/noteController.js";
import express from "express";

const router = express.Router();

router.post('/notes', createNote);
router.get('/notes/:id', getNoteById);
router.get('/notes/user/:id', getUserNotes);
router.put('/notes/:id', updateNote);
router.delete('/notes/:id', deleteNote);

export default router;