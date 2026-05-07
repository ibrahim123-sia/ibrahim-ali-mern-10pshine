import note from '../models/noteModel.js';

export const createNote = async (req, res) => {
    try {
        const { title, content } = req.body;
        const newNote = new note({ title, content });
        await newNote.save();
        res.status(201).json(newNote);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const noteById = await note.findById(id);
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
        const { id } = req.params;
        const userNotes = await note.find({ userId: id });
        res.status(200).json(userNotes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const updatedNote = await note.findByIdAndUpdate(id, { title, content }, { new: true });
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
        const deletedNote = await note.findByIdAndDelete(id);
        if (!deletedNote) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.status(200).json({ message: 'Note deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
