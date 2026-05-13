import Note from '../models/Note.js';

export const createNote = async (req, res) => {
    try {
        const { title, content } = req.body;
        const newNote = new Note({ title, content, userId: req.user._id });
        await newNote.save();
        res.status(201).json(newNote);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const noteById = await Note.findOne({ _id: id, userId: req.user._id });
        if (!noteById) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.status(200).json(noteById);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserNotes = async (req, res) => {
    try {
        const userNotes = await Note.find({ userId: req.user._id });
        res.status(200).json(userNotes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const updatedNote = await Note.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            { title, content },
            { new: true }
        );
        if (!updatedNote) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.status(200).json(updatedNote);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedNote = await Note.findOneAndDelete({ _id: id, userId: req.user._id });
        if (!deletedNote) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
