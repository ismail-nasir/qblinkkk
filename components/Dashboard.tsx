
import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Settings, ChevronDown, Trash2, X, Plus, MapPin, Store } from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
import { User, QueueInfo, LocationInfo } from '../types';
import { authService } from '../services/auth';
import { queueService } from '../services/queue';
import AdminPanel from './AdminPanel';
import QueueManager from './QueueManager';
import QueueList from './QueueList';

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

  // Queue State
  const [selectedQueue, setSelectedQueue] = useState<QueueInfo | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize Locations Listener
  useEffect(() => {
      const unsub = queueService.getLocations(user.id, (locs) => {
          setLocations(locs);
          if (locs.length > 0 && !selectedLocation) {
              setSelectedLocation(locs[0]);
          }
      });
      return () => unsub();
  }, [user.id]);

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
    <div className="min-h-screen bg-[#F8FAFC] animate-fade-in relative">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100/50">
        <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setSelectedQueue(null)}>
             <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
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
                  className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-soft border border-gray-100 py-2 z-50"
                >
                    <div className="px-5 py-3 border-b border-gray-50 mb-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.businessName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
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
          
          {/* Location Selector (Only show if not in manager mode) */}
          {!selectedQueue && (
              <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                          <MapPin size={16} /> Locations
                      </h2>
                      <button onClick={() => setShowAddLocation(true)} className="text-primary-600 text-sm font-bold flex items-center gap-1 hover:underline bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100">
                          <Plus size={16} /> Add Location
                      </button>
                  </div>
                  
                  {locations.length > 0 ? (
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {locations.map(loc => (
                              <button
                                key={loc.id}
                                onClick={() => setSelectedLocation(loc)}
                                className={`px-5 py-3 rounded-xl border font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${selectedLocation?.id === loc.id ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                              >
                                  {loc.name}
                              </button>
                          ))}
                      </div>
                  ) : (
                      <div className="p-8 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                          <p className="text-gray-500 mb-4">You haven't added any business locations yet.</p>
                          <button onClick={() => setShowAddLocation(true)} className="px-6 py-2 bg-primary-600 text-white rounded-xl font-bold">Add First Location</button>
                      </div>
                  )}
              </div>
          )}

          <AnimatePresence mode="wait">
              {selectedQueue ? (
                  <motion.div key="manager" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <QueueManager queue={selectedQueue} user={user} onBack={() => setSelectedQueue(null)} />
                  </motion.div>
              ) : (
                  selectedLocation && (
                      <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <LocationQueueList 
                              user={user} 
                              location={selectedLocation} 
                              onSelectQueue={setSelectedQueue} 
                          />
                      </motion.div>
                  )
              )}
          </AnimatePresence>
      </main>

      {/* Add Location Modal */}
      <AnimatePresence>
          {showAddLocation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-3xl p-8 max-w-sm w-full">
                      <h3 className="text-xl font-bold mb-4">Add Location</h3>
                      <form onSubmit={handleAddLocation}>
                          <input autoFocus type="text" placeholder="e.g. Main Branch" value={newLocName} onChange={(e) => setNewLocName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500" />
                          <div className="flex gap-3">
                              <button type="button" onClick={() => setShowAddLocation(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm">Cancel</button>
                              <button type="submit" className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm">Create</button>
                          </div>
                      </form>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

const LocationQueueList: React.FC<{ user: User, location: LocationInfo, onSelectQueue: (q: QueueInfo) => void }> = ({ user, location, onSelectQueue }) => {
    return <QueueList user={user} onSelectQueue={onSelectQueue} locationId={location.id} businessId={user.id} />;
};

export default Dashboard;
