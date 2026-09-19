import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';

export const FoodCustomizationModal = ({ item, isOpen, onClose, onConfirm }) => {
  const [selectedChoices, setSelectedChoices] = useState({});
  const [specialInstruction, setSpecialInstruction] = useState('');
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !item) return null;

  const basePrice = item.discountPrice > 0 ? item.discountPrice : item.price;

  const handleSelectOption = (groupName, choice) => {
    setSelectedChoices((prev) => ({
      ...prev,
      [groupName]: choice
    }));
  };

  // Calculate total extra prices
  const extraTotal = Object.values(selectedChoices).reduce((sum, c) => sum + (c.extraPrice || 0), 0);
  const unitPrice = basePrice + extraTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    const formattedCustomizations = Object.entries(selectedChoices).map(([groupName, choice]) => ({
      groupName,
      choiceLabel: choice.label,
      extraPrice: choice.extraPrice || 0
    }));

    onConfirm({
      item,
      quantity,
      selectedCustomizations: formattedCustomizations,
      specialInstruction
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" />

      <div className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl z-10 border border-slate-100 space-y-4">
        {/* Header */}
        <div className="relative h-44 bg-slate-100">
          <img
            src={item.image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500'}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm p-2 rounded-full text-slate-700 hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <h3 className="font-extrabold text-slate-900 text-xl">{item.name}</h3>
            <p className="text-xs text-slate-500 mt-1">{item.description}</p>
          </div>

          {/* Render Customization Options */}
          {item.customizations?.map((group, idx) => (
            <div key={idx} className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between">
                <span>{group.name}</span>
                {group.required && <span className="text-[10px] text-red-500 font-bold uppercase">Required</span>}
              </h4>

              <div className="space-y-1.5">
                {group.choices.map((choice, cIdx) => {
                  const isSelected = selectedChoices[group.name]?.label === choice.label;
                  return (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => handleSelectOption(group.name, choice)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 text-orange-900'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-orange-600 bg-orange-600 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{choice.label}</span>
                      </div>
                      {choice.extraPrice > 0 && (
                        <span className="font-bold text-orange-600">+₹{choice.extraPrice}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Special Cooking Instructions */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <label className="font-bold text-slate-800 text-xs">Special Instructions (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Less spicy, Extra chutney, No onion"
              value={specialInstruction}
              onChange={(e) => setSpecialInstruction(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="font-extrabold text-slate-600 text-base px-2"
            >
              -
            </button>
            <span className="font-extrabold text-slate-900 text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="font-extrabold text-slate-600 text-base px-2"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            <span>Add Item</span>
            <span>•</span>
            <span>₹{totalPrice}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
