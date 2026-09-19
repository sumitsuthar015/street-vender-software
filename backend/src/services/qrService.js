const QRCode = require('qrcode');

const generateVendorQRCode = async (vendorId, tableId = null) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  let targetUrl = `${baseUrl}/vendor/${vendorId}`;
  if (tableId) {
    targetUrl += `/table/${tableId}`;
  }

  try {
    const dataUrl = await QRCode.toDataURL(targetUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
    return { targetUrl, dataUrl };
  } catch (error) {
    console.error('[QR Service Error]:', error);
    throw new Error('Failed to generate QR code');
  }
};

module.exports = {
  generateVendorQRCode
};
