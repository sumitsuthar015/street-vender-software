const express = require('express');
const MenuItem = require('../models/MenuItem');
const Vendor = require('../models/Vendor');
const { HttpError, validate, objectId } = require('../utils');

const router = express.Router();

// Photos are stored in MongoDB. Their URLs contain ?v=<timestamp>, so browsers can cache them forever.
function sendImage(res, image) {
  if (!image?.data) throw new HttpError(404, 'No photo');
  res.set('Content-Type', image.contentType);
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.send(image.data);
}

router.get('/menu/:id', async (req, res) => {
  const item = await MenuItem.findById(validate(objectId, req.params.id)).select('+image');
  sendImage(res, item?.image);
});

// Stall photo or logo: /api/images/shop/<vendorId>/cover  or  .../logo
router.get('/shop/:id/:kind', async (req, res) => {
  const kind = req.params.kind;
  if (kind !== 'cover' && kind !== 'logo') throw new HttpError(404, 'Not found');
  const vendor = await Vendor.findById(validate(objectId, req.params.id)).select(`+${kind}`);
  sendImage(res, vendor?.[kind]);
});

module.exports = router;
