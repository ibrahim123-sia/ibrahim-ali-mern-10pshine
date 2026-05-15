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
    },
    { timestamps: true }
);

const Note = mongoose.model('Note', noteSchema);
export default Note;
