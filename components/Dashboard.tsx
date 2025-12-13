
import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, ChevronDown, Trash2, X, Plus, MapPin, Store, LayoutGrid } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { User, QueueInfo, LocationInfo } from '../types';
import { authService } from '../services/auth';
import { queueService } from '../services/queue';
import AdminPanel from './AdminPanel';
import QueueManager from './QueueManager';
import QueueList from './QueueList';
import GlassCard from './GlassCard';

const motion = m as any;

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // Location Management
  const [locations, setLocations] = useState<LocationInfo[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocName, setNewLocName] = useState('');
  const creatingLocationRef = useRef(false);

  // Queue State
  const [selectedQueue, setSelectedQueue] = useState<QueueInfo | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize Locations Listener & Auto-Create Logic
  useEffect(() => {
      const unsub = queueService.getLocations(user.id, (locs) => {
          setLocations(locs);
          
          if (locs.length > 0) {
              if (!selectedLocation) {
                  setSelectedLocation(locs[0]);
              }
          } else {
              // SAFETY NET: If no locations exist (fresh account), create 'Main Location'
              if (!creatingLocationRef.current) {
                  creatingLocationRef.current = true;
                  queueService.createLocation(user.id, 'Main Location')
                      .then(() => { creatingLocationRef.current = false; })
                      .catch(e => { creatingLocationRef.current = false; });
              }
          }
      });
      return () => unsub();
  }, [user.id, selectedLocation]);

  const handleAddLocation = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newLocName) return;
      await queueService.createLocation(user.id, newLocName);
      setNewLocName('');
      setShowAddLocation(false);
  };

  if (isAdminOpen) {
      return <AdminPanel onClose={() => setIsAdminOpen(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] animate-fade-in relative font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100/50">
        <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedQueue(null)}>
             <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-primary-600/20">
                <Store size={16} />
             </div>
             <span className="font-bold text-xl tracking-tight text-gray-900">Qblink</span>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 sm:pr-3 rounded-full hover:bg-white hover:shadow-sm transition-all duration-200 border border-transparent hover:border-gray-200 focus:outline-none"
            >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-cyan-100 text-primary-600 flex items-center justify-center font-bold rounded-full border-2 border-white shadow-sm text-sm shrink-0">
                    {user.businessName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:block text-sm font-semibold text-gray-700 truncate max-w-[150px]">{user.businessName}</span>
                <ChevronDown size={16} className="text-gray-400" />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
                >
                    <div className="px-5 py-3 border-b border-gray-50 mb-1 bg-gray-50/50">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.businessName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    {user.role === 'admin' || user.role === 'superadmin' ? (
                        <button onClick={() => setIsAdminOpen(true)} className="w-full text-left px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                            <Settings size={18} /> Admin Console
                        </button>
                    ) : null}
                    <button onClick={onLogout} className="w-full text-left px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3">
                        <LogOut size={18} /> Logout
                    </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto pt-6 md:pt-10 relative z-0 px-4">
          
          <AnimatePresence mode="wait">
              {selectedQueue ? (
                  <motion.div key="manager" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <QueueManager queue={selectedQueue} user={user} onBack={() => setSelectedQueue(null)} />
                  </motion.div>
              ) : (
                  <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {/* Location Tabs - Only show if > 1 location */}
                      {locations.length > 1 && (
                          <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
                              <div className="flex gap-3">
                                  {locations.map(loc => (
                                      <button
                                        key={loc.id}
                                        onClick={() => setSelectedLocation(loc)}
                                        className={`px-5 py-3 rounded-xl border font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${selectedLocation?.id === loc.id ? 'bg-gray-900 text-white border-gray-900 shadow-lg scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                      >
                                          <MapPin size={16} /> {loc.name}
                                      </button>
                                  ))}
                                  <button onClick={() => setShowAddLocation(true)} className="px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors">
                                      <Plus size={16} /> New Location
                                  </button>
                              </div>
                          </div>
                      )}

                      {/* Header Area for Single Location (Hidden if using tabs above) */}
                      {locations.length <= 1 && (
                          <div className="flex justify-between items-center mb-6">
                              <div className="flex items-center gap-2 text-gray-400 font-medium text-sm">
                                  <LayoutGrid size={16} /> Dashboard
                              </div>
                              <button onClick={() => setShowAddLocation(true)} className="text-xs font-bold text-primary-600 hover:underline">
                                  Add Location
                              </button>
                          </div>
                      )}

                      {selectedLocation ? (
                          <LocationQueueList 
                              user={user} 
                              location={selectedLocation} 
                              onSelectQueue={setSelectedQueue} 
                          />
                      ) : (
                          <div className="p-12 text-center text-gray-400">
                              <p className="animate-pulse">Loading workspace...</p>
                          </div>
                      )}
                  </motion.div>
              )}
          </AnimatePresence>
      </main>

      {/* Add Location Modal */}
      <AnimatePresence>
          {showAddLocation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                      <h3 className="text-xl font-bold mb-4">Add New Location</h3>
                      <form onSubmit={handleAddLocation}>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Location Name</label>
                          <input autoFocus type="text" placeholder="e.g. Downtown Branch" value={newLocName} onChange={(e) => setNewLocName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mb-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500" />
                          <div className="flex gap-3">
                              <button type="button" onClick={() => setShowAddLocation(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-200">Cancel</button>
                              <button type="submit" className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black">Create</button>
                          </div>
                      </form>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

// Wrapper to isolate queue fetching per location
const LocationQueueList: React.FC<{ user: User, location: LocationInfo, onSelectQueue: (q: QueueInfo) => void }> = ({ user, location, onSelectQueue }) => {
    return <QueueList user={user} onSelectQueue={onSelectQueue} locationId={location.id} businessId={user.id} />;
};

export default Dashboard;
