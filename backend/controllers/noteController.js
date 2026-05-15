import Note from '../models/Note.js';
import mongoose from 'mongoose';

const ALLOWED_UPDATE_FIELDS = [
    'title',
    'content',
    'category',
    'tags',
    'pinned',
    'favorite',
    'archived',
    'deletedAt',
    'noteColor',
    'textColor',
    'fontStyle',
    'checklist',
    'moodLabel',
    'order',
];

const FONT_STYLES = ['sans', 'serif', 'mono'];
const MOOD_LABELS = ['', 'productive', 'study', 'idea', 'important'];
const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const sanitizeCategory = (value) => {
    if (value === null || value === '' || value === undefined) return null;
    if (mongoose.isValidObjectId(value)) return value;
    return undefined; // signal invalid so caller can skip
};

const sanitizeTags = (value) => {
    if (!Array.isArray(value)) return undefined;
    const cleaned = value
        .map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
        .filter((t) => t.length > 0 && t.length <= 40);
    return Array.from(new Set(cleaned));
};

const sanitizeColor = (value) => {
    if (value === '' || value === null) return '';
    if (typeof value === 'string' && HEX_COLOR_RE.test(value)) return value;
    return undefined;
};

const sanitizeChecklist = (value) => {
    if (!Array.isArray(value)) return undefined;
    return value
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
            text: typeof item.text === 'string' ? item.text.slice(0, 200) : '',
            done: !!item.done,
        }))
        .slice(0, 100); // cap at 100 items
};

const buildUpdate = (body) => {
    const update = {};
    for (const key of ALLOWED_UPDATE_FIELDS) {
        if (!(key in body)) continue;
        const raw = body[key];
        if (key === 'category') {
            const sanitized = sanitizeCategory(raw);
            if (sanitized !== undefined) update.category = sanitized;
        } else if (key === 'tags') {
            const sanitized = sanitizeTags(raw);
            if (sanitized !== undefined) update.tags = sanitized;
        } else if (key === 'deletedAt') {
            update.deletedAt = raw ? new Date(raw) : null;
        } else if (['pinned', 'favorite', 'archived'].includes(key)) {
            update[key] = !!raw;
        } else if (key === 'noteColor' || key === 'textColor') {
            const sanitized = sanitizeColor(raw);
            if (sanitized !== undefined) update[key] = sanitized;
        } else if (key === 'fontStyle') {
            if (FONT_STYLES.includes(raw)) update.fontStyle = raw;
        } else if (key === 'moodLabel') {
            if (MOOD_LABELS.includes(raw)) update.moodLabel = raw;
        } else if (key === 'checklist') {
            const sanitized = sanitizeChecklist(raw);
            if (sanitized !== undefined) update.checklist = sanitized;
        } else if (key === 'order') {
            const n = Number(raw);
            if (Number.isFinite(n)) update.order = n;
        } else if (typeof raw === 'string') {
            update[key] = raw;
        }
    }
    return update;
};

export const createNote = async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }
        const doc = {
            title,
            content,
            userId: req.user._id,
            ...buildUpdate(req.body),
        };
        // title/content already set above; buildUpdate would also set them — harmless
        const newNote = new Note(doc);
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
        const userNotes = await Note.find({ userId: req.user._id }).sort({ updatedAt: -1 });
        res.status(200).json(userNotes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const update = buildUpdate(req.body);
        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: 'Nothing to update' });
        }
        const updatedNote = await Note.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            update,
            { new: true, runValidators: true }
        );
        if (!updatedNote) {
            return res.status(404).json({ message: 'Note not found' });
        }
        res.status(200).json(updatedNote);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const reorderNotes = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'ids array is required' });
        }
        const valid = ids.filter((id) => mongoose.isValidObjectId(id));
        if (valid.length === 0) {
            return res.status(400).json({ message: 'No valid note ids provided' });
        }
        // bulkWrite scoped to the current user — never touch other users' notes
        const ops = valid.map((id, idx) => ({
            updateOne: {
                filter: { _id: id, userId: req.user._id },
                update: { $set: { order: idx } },
            },
        }));
        const result = await Note.bulkWrite(ops);
        return res.json({
            matched: result.matchedCount,
            modified: result.modifiedCount,
        });
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
