const generateInvoiceData = (order) => {
  return {
    invoiceNumber: `INV-${order.orderNumber.replace('#', '')}`,
    orderNumber: order.orderNumber,
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : new Date().toLocaleString(),
    vendor: {
      name: order.vendor?.stallName || 'Street Vendor Stall',
      address: order.vendor?.address?.street || 'Local Food Square',
      city: order.vendor?.address?.city || 'Delhi',
      upiId: order.vendor?.bankDetails?.upiId || 'vendor@upi'
    },
    customer: {
      name: order.customer?.name || 'Valued Customer',
      mobile: order.customer?.mobile || ''
    },
    orderType: order.orderType,
    tableNo: order.tableNo || 'N/A',
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      customizations: item.selectedCustomizations ? item.selectedCustomizations.map(c => `${c.groupName}: ${c.choiceLabel}`).join(', ') : ''
    })),
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    taxAmount: order.taxAmount,
    finalAmount: order.finalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus
  };
};

module.exports = {
  generateInvoiceData
};
