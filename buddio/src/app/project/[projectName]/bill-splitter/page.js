'use client';

import { useState, useRef, useCallback, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createWorker } from 'tesseract.js';
import Webcam from 'react-webcam';
import { Home, Star, Camera, RefreshCw, Plus, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';

export default function BillSplitter({ params }) {
  const projectName = use(params).projectName;
  const router = useRouter();
  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [items, setItems] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [newParticipant, setNewParticipant] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    splitBetween: []
  });

  const fileInputRef = useRef(null);

  // Fetch project data and update participants
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const response = await fetch('http://localhost:8000/get-projects');
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        const data = await response.json();
        const currentProject = data.projects.find(p => p.project_name === decodeURIComponent(projectName));
        
        if (currentProject && currentProject.members) {
          // Add project members to participants list
          const memberNames = currentProject.members.map(member => member.name);
          setParticipants(prev => {
            const uniqueParticipants = new Set([...prev, ...memberNames]);
            return Array.from(uniqueParticipants);
          });
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      }
    };

    fetchProjectData();
  }, [projectName]);

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
            splitBetween: []
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
      setNewItem({ name: '', price: '', splitBetween: [] });
      setShowAddItemModal(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <div className="w-20 bg-[#e8f5e9] p-4 flex flex-col items-center">
        <Link href="/dashboard" className="mb-8">
          <div className="w-12 h-12 bg-[#f1faf2] rounded-full flex items-center justify-center shadow-sm hover:bg-[#d7ecd9] transition-colors">
            <Home className="h-6 w-6" />
          </div>
        </Link>
        <Link href={`/project/${projectName}/calendar`} className="mb-4">
          <div className="w-12 h-12 bg-[#f1faf2] rounded-full flex items-center justify-center shadow-sm hover:bg-[#d7ecd9] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </Link>
        <div className="w-12 h-12 bg-[#d7ecd9] rounded-full flex items-center justify-center shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 bg-[#e8f5e9] -mx-8 -mt-8 px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/project/${projectName}`}>
              <div className="w-10 h-10 bg-[#f1faf2] rounded-full flex items-center justify-center hover:bg-[#d7ecd9] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </Link>
            <h1 className="text-2xl font-semibold">Bill Splitter</h1>
          </div>
        </div>

        {/* Bill Splitter Content */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-[#f1faf2] rounded-lg p-6">
            {/* Participants Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Participants</h2>
              <div className="bg-white rounded-lg p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {participants.map(participant => (
                    <span 
                      key={participant}
                      className="px-3 py-1 bg-green-100 rounded-full text-sm text-green-700"
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
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </form>
              </div>
            </div>

            {/* Scan and Upload Section */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setShowCamera(true)}
                className="p-4 bg-white rounded-lg border-2 border-dashed border-green-300 flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
              >
                <Camera size={24} className="text-green-600" />
                <span className="text-green-700">Scan Receipt</span>
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
                  className="w-full p-4 bg-white rounded-lg border-2 border-dashed border-green-300 flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="animate-spin text-green-600" size={24} />
                      <span className="text-green-700">Processing...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} className="text-green-600" />
                      <span className="text-green-700">Upload Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <table className="w-full">
                <thead className="bg-[#f1faf2]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Item</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Split Between</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-gray-700">{item.name}</td>
                      <td className="px-4 py-3 text-right text-gray-700">${item.price.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {participants.map(participant => (
                            <button
                              key={participant}
                              onClick={() => toggleParticipantForItem(item.id, participant)}
                              className={`px-2 py-1 rounded-full text-xs ${
                                item.splitBetween.includes(participant)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-700'
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
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Add Row Button */}
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => setShowAddItemModal(true)}
                  className="w-full p-2 bg-white rounded-lg border-2 border-dashed border-green-300 flex items-center justify-center gap-2 hover:bg-green-50 transition-colors text-green-700"
                >
                  <Plus size={20} />
                  Add Row
                </button>
              </div>
            </div>

            {/* Totals */}
            {items.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-xl font-semibold mb-4">Totals</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(calculateTotals()).map(([participant, total]) => (
                    <div key={participant} className="bg-[#f1faf2] p-3 rounded-lg">
                      <div className="text-sm text-gray-700">{participant}</div>
                      <div className="text-lg font-semibold text-gray-900">${total.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add Item</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Split Between</label>
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
                          : 'bg-gray-100 text-gray-700'
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
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Scan Receipt</h2>
              <button 
                onClick={() => setShowCamera(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full"
                />
              </div>
              <button
                onClick={capture}
                disabled={isProcessing}
                className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
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
      )}
    </div>
  );
} 