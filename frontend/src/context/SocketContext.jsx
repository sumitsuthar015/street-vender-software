import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, vendor } = useAuth();
  const [socket, setSocket] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (window.location.origin.includes('5173')
      ? 'http://localhost:5001'
      : window.location.origin
    );

    const newSocket = io(socketUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket Connected]:', newSocket.id);

      if (user?._id) {
        newSocket.emit('join_user_room', user._id);
      }
      if (vendor?._id) {
        newSocket.emit('join_vendor_room', vendor._id);
      }
    });

    // Listen for new orders (Vendor)
    newSocket.on('order:created', (data) => {
      playAlertSound();
      setActiveAlert({
        type: 'ORDER_CREATED',
        title: '🔔 New Order Received!',
        message: data.message,
        order: data.order
      });
    });

    // Listen for order status transitions (Customer & Vendor)
    newSocket.on('order:status_updated', (data) => {
      playAlertSound();
      setActiveAlert({
        type: 'STATUS_UPDATED',
        title: `⚡ Order ${data.orderNumber} Status: ${data.orderStatus}`,
        message: `Your order status has been updated to ${data.orderStatus}.`,
        data
      });
    });

    // Listen for inventory low stock warnings
    newSocket.on('inventory:low_stock', (data) => {
      setActiveAlert({
        type: 'LOW_STOCK',
        title: '⚠️ Low Stock Alert',
        message: data.message
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id, vendor?._id]);

  const playAlertSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      // Audio playback blocked by browser policy until user interaction
    }
  };

  const closeAlert = () => setActiveAlert(null);

  return (
    <SocketContext.Provider value={{ socket, activeAlert, closeAlert }}>
      {children}

      {/* Floating In-App Real-time Notification Banner */}
      {activeAlert && (
        <div className="fixed top-5 right-5 z-50 max-w-md w-full bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-orange-500/30 flex items-start justify-between gap-3 animate-bounce">
          <div>
            <h4 className="font-bold text-orange-400 text-sm">{activeAlert.title}</h4>
            <p className="text-xs text-slate-300 mt-1">{activeAlert.message}</p>
          </div>
          <button
            onClick={closeAlert}
            className="text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
