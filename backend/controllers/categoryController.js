import Category from '../models/Category.js';
import Note from '../models/Note.js';
import logger from '../configs/logger.js';

const isHexColor = (s) => typeof s === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s);

export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ userId: req.user._id }).sort({ name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        logger.error({ err: error, userId: req.user?._id?.toString() }, 'get categories failed');
        res.status(500).json({ message: 'Server error' });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name, color, icon } = req.body;
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        if (!trimmedName) {
            return res.status(400).json({ message: 'Name is required' });
        }
        const payload = { userId: req.user._id, name: trimmedName };
        if (isHexColor(color)) payload.color = color;
        if (typeof icon === 'string') payload.icon = icon;
        const category = await Category.create(payload);
        res.status(201).json(category);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A category with this name already exists' });
        }
        logger.error({ err: error, userId: req.user?._id?.toString() }, 'create category failed');
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const update = {};
        if (typeof req.body.name === 'string') {
            const trimmed = req.body.name.trim();
            if (!trimmed) return res.status(400).json({ message: 'Name cannot be empty' });
            update.name = trimmed;
        }
        if (isHexColor(req.body.color)) update.color = req.body.color;
        if (typeof req.body.icon === 'string') update.icon = req.body.icon;
        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: 'Nothing to update' });
        }
        const category = await Category.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            update,
            { new: true, runValidators: true }
        );
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.status(200).json(category);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A category with this name already exists' });
        }
        logger.error({ err: error, userId: req.user?._id?.toString() }, 'update category failed');
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findOneAndDelete({ _id: id, userId: req.user._id });
        if (!category) return res.status(404).json({ message: 'Category not found' });
        await Note.updateMany(
            { userId: req.user._id, category: category._id },
            { $set: { category: null } }
        );
        res.status(200).json({ message: 'Category deleted', _id: category._id });
    } catch (error) {
        logger.error({ err: error, userId: req.user?._id?.toString() }, 'delete category failed');
        res.status(500).json({ message: 'Server error' });
    }
};
