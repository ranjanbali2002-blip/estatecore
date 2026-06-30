const express = require('express');
const multer = require('multer');
const ctrl = require('../controllers/workspaceController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { enforceWorkspace } = require('../middleware/workspace');
const AppError = require('../utils/AppError');

const router = express.Router();

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new AppError('Only JPEG, PNG or WebP images allowed', 422, 'VALIDATION_ERROR'));
    }
    return cb(null, true);
  },
});

router.use(authenticateJWT, enforceWorkspace);

router.get('/brand', ctrl.getBrand);
router.put('/brand', requireRole('admin'), ctrl.updateBrand);
router.post('/brand/logo', requireRole('admin'), upload.single('logo'), ctrl.uploadBrandLogo);

module.exports = router;
