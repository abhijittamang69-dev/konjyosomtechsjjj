const express = require('express');
const router = express.Router();
const { getAllProjects, getProjectBySlug, createProject, updateProject, deleteProject } = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getAllProjects);
router.get('/:slug', getProjectBySlug);
router.post('/', protect, adminOnly, createProject);
router.put('/:id', protect, adminOnly, updateProject);
router.delete('/:id', protect, adminOnly, deleteProject);

module.exports = router;
