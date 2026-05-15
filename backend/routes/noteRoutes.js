import {
    createNote,
    deleteNote,
    getUserNotes,
    updateNote,
    getNoteById,
    reorderNotes,
} from "../controllers/noteController.js";
import { protect } from "../middlewares/auth.js";
import express from "express";

const router = express.Router();

router.post('/notes', protect, createNote);
router.get('/notes', protect, getUserNotes);
router.post('/notes/reorder', protect, reorderNotes);
router.get('/notes/:id', protect, getNoteById);
router.put('/notes/:id', protect, updateNote);
router.delete('/notes/:id', protect, deleteNote);

export default router;
