import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            default: null,
            index: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        pinned: {
            type: Boolean,
            default: false,
        },
        favorite: {
            type: Boolean,
            default: false,
        },
        archived: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
            index: true,
        },
        noteColor: {
            type: String,
            default: '',
        },
        textColor: {
            type: String,
            default: '',
        },
        fontStyle: {
            type: String,
            enum: ['sans', 'serif', 'mono'],
            default: 'sans',
        },
        checklist: {
            type: [
                {
                    _id: false,
                    text: { type: String, default: '' },
                    done: { type: Boolean, default: false },
                },
            ],
            default: [],
        },
        moodLabel: {
            type: String,
            enum: ['', 'productive', 'study', 'idea', 'important'],
            default: '',
        },
        order: {
            type: Number,
            default: 0,
        },
        voiceNote: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

const Note = mongoose.model('Note', noteSchema);
export default Note;
