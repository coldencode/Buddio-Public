'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createWorker } from 'tesseract.js';
import Webcam from 'react-webcam';
import { Home, Star, Camera, RefreshCw, Plus, Trash2, Upload } from 'lucide-react';

export default function BillSplitter() {
  const router = useRouter();
  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [items, setItems] = useState([]);
  const [participants, setParticipants] = useState(['Me']);
  const [newParticipant, setNewParticipant] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    splitBetween: ['Me']
  });

  const fileInputRef = useRef(null);

  // Function to process the image using Tesseract OCR
  const processImage = async (imageSrc) => {
    setIsProcessing(true);
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(imageSrc);
      
      // Basic parsing of receipt text
      const lines = text.split('\n').filter(line => line.trim());
      const parsedItems = lines.map(line => {
        // Try to find price pattern (e.g., $12.99)
        const priceMatch = line.match(/\$?\d+\.\d{2}/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace('$', '')) : 0;
        const name = line.replace(/\$?\d+\.\d{2}/, '').trim();
        
        if (name && price > 0) {
          return {
            id: Date.now() + Math.random(),
            name,
            price,
            splitBetween: ['Me']
          };
        }
        return null;
      }).filter(item => item !== null);

      setItems(prev => [...prev, ...parsedItems]);
      await worker.terminate();
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Error processing image. Please try again.');
    }
    setIsProcessing(false);
    setShowCamera(false);
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      processImage(imageSrc);
    }
  }, [webcamRef]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Convert uploaded file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result;
        if (base64Image) {
          await processImage(base64Image);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File Upload Error:', error);
      alert('Error processing uploaded image. Please try again.');
      setIsProcessing(false);
    }
  };

  const addParticipant = (e) => {
    e.preventDefault();
    if (newParticipant.trim() && !participants.includes(newParticipant.trim())) {
      setParticipants([...participants, newParticipant.trim()]);
      setNewParticipant('');
    }
  };

  const toggleParticipantForItem = (itemId, participant) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newSplitBetween = item.splitBetween.includes(participant)
          ? item.splitBetween.filter(p => p !== participant)
          : [...item.splitBetween, participant];
        return { ...item, splitBetween: newSplitBetween };
      }
      return item;
    }));
  };

  const deleteItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const totals = {};
    participants.forEach(participant => {
      totals[participant] = 0;
    });

    items.forEach(item => {
      if (item.splitBetween.length > 0) {
        const splitAmount = item.price / item.splitBetween.length;
        item.splitBetween.forEach(participant => {
          totals[participant] = (totals[participant] || 0) + splitAmount;
        });
      }
    });

    return totals;
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.name && newItem.price) {
      setItems(prev => [...prev, {
        id: Date.now() + Math.random(),
        name: newItem.name,
        price: parseFloat(newItem.price),
        splitBetween: newItem.splitBetween
      }]);
      setNewItem({ name: '', price: '', splitBetween: ['Me'] });
      setShowAddItemModal(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-20 bg-green-200 flex flex-col items-center p-4 space-y-4">
        <button 
          onClick={() => router.push('/dashboard')}
          className="p-3 rounded-full bg-green-300"
        >
          <Home size={24} />
        </button>
        {[...Array(4)].map((_, i) => (
          <button
            key={i}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-green-300 transition"
          >
            <Star size={24} />
            <span className="text-xs">Label</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Bill Splitter</h1>

          {/* Participants Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Participants</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {participants.map(participant => (
                <span 
                  key={participant}
                  className="px-3 py-1 bg-green-100 rounded-full text-sm"
                >
                  {participant}
                </span>
              ))}
            </div>
            <form onSubmit={addParticipant} className="flex gap-2">
              <input
                type="text"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                placeholder="Add participant"
                className="flex-1 p-2 border rounded-md"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
              >
                <Plus size={20} />
              </button>
            </form>
          </div>

          {/* Scan and Upload Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setShowCamera(true)}
              className="p-4 border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center gap-2 hover:bg-green-50 transition"
            >
              <Camera size={24} />
              Scan Receipt
            </button>

            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center gap-2 hover:bg-green-50 transition"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="animate-spin" size={24} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload size={24} />
                    Upload Receipt
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Item</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Split Between</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3 text-right">${item.price.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {participants.map(participant => (
                          <button
                            key={participant}
                            onClick={() => toggleParticipantForItem(item.id, participant)}
                            className={`px-2 py-1 rounded-full text-xs ${
                              item.splitBetween.includes(participant)
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100'
                            }`}
                          >
                            {participant}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Add Row Button */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddItemModal(true)}
                className="w-full p-2 border-2 border-dashed border-green-300 rounded-lg flex items-center justify-center gap-2 hover:bg-green-50 transition text-green-600"
              >
                <Plus size={20} />
                Add Row
              </button>
            </div>
          </div>

          {/* Totals */}
          {items.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-3">Totals</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(calculateTotals()).map(([participant, total]) => (
                  <div key={participant} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">{participant}</div>
                    <div className="text-lg font-semibold">${total.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Item Modal */}
          {showAddItemModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Add Item</h2>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Item Name</label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      placeholder="Enter item name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Price</label>
                    <input
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Split Between</label>
                    <div className="flex flex-wrap gap-2">
                      {participants.map(participant => (
                        <button
                          key={participant}
                          type="button"
                          onClick={() => {
                            const isSelected = newItem.splitBetween.includes(participant);
                            setNewItem({
                              ...newItem,
                              splitBetween: isSelected
                                ? newItem.splitBetween.filter(p => p !== participant)
                                : [...newItem.splitBetween, participant]
                            });
                          }}
                          className={`px-2 py-1 rounded-full text-xs ${
                            newItem.splitBetween.includes(participant)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100'
                          }`}
                        >
                          {participant}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddItemModal(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      Add Item
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Scan Receipt</h3>
              <button 
                onClick={() => setShowCamera(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="relative">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full rounded-lg"
              />
              <div className="mt-4 flex justify-center gap-4">
                <button
                  onClick={capture}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera size={20} />
                      Capture
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 