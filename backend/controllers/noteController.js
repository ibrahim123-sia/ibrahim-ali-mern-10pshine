import Note from '../models/Note.js';

export const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = new Note({ title, content, user: req.user.id });
    await note.save();
    res.status(201).json(note);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getNotes = async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id });
    res.status(200).json(notes);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(200).json(note);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { title, content, updatedAt: Date.now() },
      { new: true }
    );
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(200).json(note);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(200).json(note);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

