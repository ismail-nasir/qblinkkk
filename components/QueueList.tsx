
import React, { useState, useEffect, useCallback } from 'react';
import { User, QueueInfo, QueueData, BusinessType, QueueFeatures } from '../types';
import { queueService } from '../services/queue';
import { socketService } from '../services/socket';
import {
  Plus,
  LayoutGrid,
  Clock,
  Users,
  ExternalLink,
  Activity,
  Trash2,
  TrendingUp,
  UserCheck,
  Hourglass,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Utensils,
  Stethoscope,
  Scissors,
  Building2,
  ShoppingBag,
  PieChart as PieChartIcon,
  MapPin
} from 'lucide-react';
import { motion as m, AnimatePresence } from 'framer-motion';
// @ts-ignore
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

const motion = m as any;

interface QueueListProps {
  user: User;
  onSelectQueue: (queue: QueueInfo) => void;
  locationId?: string;
  businessId?: string;
}

export const QueueList: React.FC<QueueListProps> = ({ user, onSelectQueue, locationId, businessId }) => {
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [queueStats, setQueueStats] = useState<Record<string, QueueData>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [queueToDelete, setQueueToDelete] = useState<string | null>(null);

  // Create Wizard State
  const [step, setStep] = useState(1);
  const [newQueueName, setNewQueueName] = useState('');
  const [queueLocation, setQueueLocation] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [selectedType, setSelectedType] = useState<BusinessType>('general');
  const [featureOverrides, setFeatureOverrides] =
    useState<QueueFeatures>({ vip: false, multiCounter: false, anonymousMode: false, sms: false });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // State for toggling stats visibility per queue
  const [expandedQueues, setExpandedQueues] = useState<Set<string>>(new Set());

  // Global Charts Visibility
  const [showCharts, setShowCharts] = useState(false);

  // Aggregate Stats State
  const [stats, setStats] = useState({
    totalQueues: 0,
    totalServed: 0,
    totalWaiting: 0,
    avgWaitTime: 0,
  });

  // Chart Data State
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);

  const loadQueues = useCallback(async () => {
    try {
      let userQueues = await queueService.getUserQueues(user.id);
      
      // Filter by location if provided
      if (locationId) {
          userQueues = userQueues.filter(q => q.locationId === locationId);
      }
      
      setQueues(userQueues);

      // Load stats for each queue and calculate aggregates
      const currentStats: Record<string, QueueData> = {};
      let servedCount = 0;
      let waitingCount = 0;
      let totalWaitTime = 0;
      let activeQueuesCount = 0;

      // For Charts
      const hourlyTraffic: Record<
        number,
        { time: string; visitors: number; served: number }
      > = {};
      const queueVolumes: { name: string; visitors: number }[] = [];

      // Initialize hourly buckets (8 AM to 8 PM)
      for (let i = 8; i <= 20; i++) {
        const hourLabel = `${i > 12 ? i - 12 : i} ${i >= 12 ? 'PM' : 'AM'}`;
        hourlyTraffic[i] = { time: hourLabel, visitors: 0, served: 0 };
      }

      // Fetch data for all queues concurrently
      await Promise.all(
        userQueues.map(async (q) => {
          const data = await queueService.getQueueData(q.id);
          currentStats[q.id] = data;

          servedCount += data.metrics.served;
          waitingCount += data.metrics.waiting;

          if (data.metrics.waiting > 0) {
            totalWaitTime += data.metrics.avgWaitTime;
            activeQueuesCount++;
          }

          // --- Process Graph Data ---
          if (data.metrics.waiting + data.metrics.served > 0) {
            queueVolumes.push({
              name: q.name,
              visitors: data.metrics.waiting + data.metrics.served,
            });
          }

          data.recentActivity.forEach((log) => {
            try {
              // Parse timestamp from rawTime if available, else try parsing display time string
              let date;
              if ((log as any).rawTime) {
                  date = new Date((log as any).rawTime);
              } else {
                  // Fallback for older mock data
                  const [timeStr, modifier] = log.time.split(' ');
                  const [hours] = timeStr.split(':');
                  let h = parseInt(hours);
                  if (modifier === 'PM' && h < 12) h += 12;
                  if (modifier === 'AM' && h === 12) h = 0;
                  date = new Date();
                  date.setHours(h);
              }
              
              const h = date.getHours();

              if (hourlyTraffic[h]) {
                if (log.action === 'join') hourlyTraffic[h].visitors++;
                if (log.action === 'complete' || log.action === 'call')
                  hourlyTraffic[h].served++;
              }
            } catch (e) {}
          });
        }),
      );

      setQueueStats(currentStats);
      setStats({
        totalQueues: userQueues.length,
        totalServed: servedCount,
        totalWaiting: waitingCount,
        avgWaitTime:
          activeQueuesCount > 0
            ? Math.round(totalWaitTime / activeQueuesCount)
            : 0,
      });

      const sortedTraffic = Object.keys(hourlyTraffic)
        .map(Number)
        .sort((a, b) => a - b)
        .map((key) => hourlyTraffic[key]);

      setTrafficData(sortedTraffic);
      setVolumeData(
        queueVolumes.length > 0
          ? queueVolumes
          : [{ name: 'No Data', visitors: 1 }] // 1 to show placeholder pie
      );
    } catch (e) {
      console.error('Failed to load queues', e);
    }
  }, [user.id, locationId]);

  useEffect(() => {
    loadQueues();

    // Listen for global queue updates via socket
    socketService.on('queue:update', () => {
      loadQueues();
    });

    return () => {
      socketService.off('queue:update');
    };
  }, [loadQueues]);

  const handleCreateQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQueueName.trim()) return;
    const waitTime = estimatedTime ? parseInt(estimatedTime) : 5;

    // Use current selected locationId if available (passed from dashboard), otherwise fallback
    const targetLocationId = locationId || (queues.length > 0 ? queues[0].locationId : 'default_loc'); 

    // If queueLocation string is provided manually, we might want to create a new location or ignore it if we are in a specific location context.
    // For now, let's assume we create queue in the current location context.
    // Note: queueService.createQueue actually takes a locationId as last param.
    
    // We need to fetch locationId if not provided or create a new one?
    // queueService.createQueue signature: businessId, name, wait, type, features, locationId
    // If we are in "All Locations" view (no locationId), we might need to handle this differently, but UI enforces location selection usually.
    // Dashboard automatically creates "Main Location" if none exists.
    
    if (targetLocationId) {
        await queueService.createQueue(
          user.id,
          newQueueName,
          waitTime,
          selectedType,
          featureOverrides,
          targetLocationId
        );
    } else {
        // Fallback or error
        console.error("No location context for queue creation");
    }

    resetCreateModal();
    loadQueues();
  };

  const handleTypeSelect = (type: BusinessType) => {
      setSelectedType(type);
      const defaults = queueService.getDefaultFeatures(type);
      setFeatureOverrides(defaults);
      setStep(2);
  };

  const resetCreateModal = () => {
    setNewQueueName('');
    setEstimatedTime('');
    setQueueLocation('');
    setStep(1);
    setSelectedType('general');
    setFeatureOverrides({ vip: false, multiCounter: false, anonymousMode: false, sms: false });
    setShowAdvanced(false);
    setShowCreateModal(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, queueId: string) => {
    e.stopPropagation();
    setQueueToDelete(queueId);
  };

  const confirmDeleteQueue = async () => {
    if (queueToDelete) {
      await queueService.deleteQueue(user.id, queueToDelete);
      loadQueues();
      setQueueToDelete(null);
    }
  };

  const toggleStats = (e: React.MouseEvent, queueId: string) => {
    e.stopPropagation();
    setExpandedQueues((prev) => {
      const next = new Set(prev);
      if (next.has(queueId)) {
        next.delete(queueId);
      } else {
        next.add(queueId);
      }
      return next;
    });
  };

  const businessTypes: { type: BusinessType; icon: any; label: string }[] = [
    { type: 'general', icon: LayoutGrid, label: 'General' },
    { type: 'restaurant', icon: Utensils, label: 'Restaurant' },
    { type: 'clinic', icon: Stethoscope, label: 'Clinic' },
    { type: 'salon', icon: Scissors, label: 'Salon' },
    { type: 'bank', icon: Building2, label: 'Bank' },
    { type: 'retail', icon: ShoppingBag, label: 'Retail' },
  ];

  // Group Queues by Location (only if no specific location filter is active)
  const groupedQueues = React.useMemo(() => {
      const groups: Record<string, QueueInfo[]> = {};
      queues.forEach(q => {
          const loc = q.location || 'Main Location';
          if (!groups[loc]) groups[loc] = [];
          groups[loc].push(q);
      });
      return groups;
  }, [queues]);

  // Custom Tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-white/50 text-xs">
          <p className="font-bold text-gray-900 mb-2">{label}</p>
          {payload.map((p: any, index: number) => (
            <p
              key={index}
              style={{ color: p.color }}
              className="font-medium flex items-center gap-2"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

  return (
    <div className="container mx-auto px-4 max-w-6xl pb-20 pt-6">
      {/* Real-time Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden"
        >
          <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-blue-50 rounded-full opacity-50" />
          <div>
            <div className="flex items-center gap-2 mb-1 text-blue-600 font-bold text-xs uppercase tracking-wider">
              <LayoutGrid size={14} /> Total Queues
            </div>
            <div className="text-3xl font-black text-gray-900">
              {stats.totalQueues}
            </div>
          </div>
          <div className="text-xs text-gray-400 font-medium">
            Active managed queues
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden"
        >
          <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-green-50 rounded-full opacity-50" />
          <div>
            <div className="flex items-center gap-2 mb-1 text-green-600 font-bold text-xs uppercase tracking-wider">
              <UserCheck size={14} /> Served Today
            </div>
            <div className="text-3xl font-black text-gray-900">
              {stats.totalServed}
            </div>
          </div>
          <div className="text-xs text-gray-400 font-medium">
            Total customers served
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden"
        >
          <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-orange-50 rounded-full opacity-50" />
          <div>
            <div className="flex items-center gap-2 mb-1 text-orange-600 font-bold text-xs uppercase tracking-wider">
              <Hourglass size={14} /> Waiting Now
            </div>
            <div className="text-3xl font-black text-gray-900">
              {stats.totalWaiting}
            </div>
          </div>
          <div className="text-xs text-gray-400 font-medium">
            Across all queues
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 relative overflow-hidden"
        >
          <div className="absolute right-[-10px] top-[-10px] w-20 h-20 bg-purple-50 rounded-full opacity-50" />
          <div>
            <div className="flex items-center gap-2 mb-1 text-purple-600 font-bold text-xs uppercase tracking-wider">
              <Activity size={14} /> Avg. Wait
            </div>
            <div className="text-3xl font-black text-gray-900">
              {stats.avgWaitTime}
              <span className="text-lg text-gray-400 font-medium ml-1">
                min
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400 font-medium">
            Estimated wait time
          </div>
        </motion.div>
      </div>

      {/* Analytics Toggle */}
      <div className="flex justify-center mb-8">
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-full font-bold text-sm hover:bg-gray-50 hover:text-primary-600 transition-all shadow-sm"
        >
          {showCharts ? <ChevronUp size={16} /> : <BarChart3 size={16} />}
          {showCharts ? 'Hide Analytics' : 'View Analytics Graphs'}
        </button>
      </div>

      {/* Analytics Graphs */}
      <AnimatePresence>
        {showCharts && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
              {/* Hourly Traffic - Stacked Bar */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp
                        size={20}
                        className="text-primary-600"
                      />{' '}
                      Hourly Traffic
                    </h3>
                    <p className="text-xs text-gray-500">
                      Visitors joined vs. Served today
                    </p>
                  </div>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={trafficData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f3f4f6"
                      />
                      <XAxis
                        dataKey="time"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        iconType="circle" 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      />
                      <Bar 
                        dataKey="visitors" 
                        name="Joined" 
                        stackId="a" 
                        fill="#3b82f6" 
                        radius={[0, 0, 0, 0]} 
                      />
                      <Bar 
                        dataKey="served" 
                        name="Served" 
                        stackId="a" 
                        fill="#22c55e" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Queue Volume - Pie Chart */}
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <PieChartIcon size={20} className="text-purple-600" /> Queue
                      Volume
                    </h3>
                    <p className="text-xs text-gray-500">
                      Distribution of visitors by queue
                    </p>
                  </div>
                </div>
                <div className="h-[250px] w-full relative">
                  {volumeData.length > 0 &&
                  volumeData[0].name !== 'No Data' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={volumeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="visitors"
                          nameKey="name"
                        >
                          {volumeData.map((entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend 
                            iconType="circle" 
                            layout="vertical" 
                            verticalAlign="middle" 
                            align="right"
                            wrapperStyle={{ fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                      <BarChart3 size={32} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium">
                        No activity recorded yet
                      </p>
                      <p className="text-xs">
                        Data will appear here once visitors join
                      </p>
                    </div>
                  )}
                  {/* Center Text for Pie */}
                  {volumeData.length > 0 && volumeData[0].name !== 'No Data' && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pr-[80px]"> 
                          <span className="text-2xl font-black text-gray-900">
                              {volumeData.reduce((acc, curr) => acc + curr.visitors, 0)}
                          </span>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">Total</p>
                      </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pt-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user.businessName}
          </h1>
          <p className="text-gray-500">
            Manage your queues and monitor real-time statuses.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold shadow-lg shadow-primary-600/20 transition-all hover:scale-105 active:scale-95 w-full md:w-auto justify-center"
        >
          <Plus size={20} /> Create Queue
        </button>
      </div>

      {/* Queues List Section */}
      <div className="mb-6 space-y-8">
        {queues.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <LayoutGrid size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No queues yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Create your first queue to start managing visitors efficiently.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Create Now
            </button>
          </div>
        ) : (
          // Grouped Layout (only if using multiple locations layout or default)
          // If filtered by locationId, groupedQueues will only have 1 key roughly.
          Object.entries(groupedQueues).map(([location, locQueues]: [string, QueueInfo[]]) => (
              <div key={location}>
                  {!locationId && (
                      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 ml-1">
                          {location === 'Main Location' ? <LayoutGrid size={18} className="text-gray-400" /> : <MapPin size={18} className="text-primary-600" />}
                          {location}
                      </h2>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {locQueues.map((queue, index) => {
                      const qStats = queueStats[queue.id];
                      const isExpanded = expandedQueues.has(queue.id);
                      const TypeIcon =
                        businessTypes.find(
                          (t) => t.type === (queue.businessType || 'general'),
                        )?.icon || LayoutGrid;

                      return (
                        <motion.div
                          key={queue.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 relative group flex flex-col"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600">
                                <TypeIcon size={20} />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                  {queue.name}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-mono">
                                  Code:{' '}
                                  <span className="text-gray-900 font-bold bg-gray-100 px-1.5 py-0.5 rounded">
                                    {queue.code}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                queue.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {queue.status}
                            </span>
                          </div>

                          {/* Stats Toggle Button */}
                          <div className="flex justify-end mb-4">
                            <button
                              onClick={(e) => toggleStats(e, queue.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                isExpanded
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <BarChart3 size={14} />
                              {isExpanded ? 'Hide Statistics' : 'Show Statistics'}
                              {isExpanded ? (
                                <ChevronUp size={14} />
                              ) : (
                                <ChevronDown size={14} />
                              )}
                            </button>
                          </div>

                          {/* Collapsible Stats Grid */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                  <div className="bg-orange-50/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-orange-100">
                                    <Hourglass
                                      size={16}
                                      className="text-orange-500 mb-1.5"
                                    />
                                    <span className="text-xl font-bold text-gray-900">
                                      {qStats?.metrics.waiting || 0}
                                    </span>
                                    <span className="text-[9px] uppercase font-bold text-gray-400 mt-0.5">
                                      Waiting
                                    </span>
                                  </div>
                                  <div className="bg-green-50/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-green-100">
                                    <Users
                                      size={16}
                                      className="text-green-500 mb-1.5"
                                    />
                                    <span className="text-xl font-bold text-gray-900">
                                      {qStats?.metrics.served || 0}
                                    </span>
                                    <span className="text-[9px] uppercase font-bold text-gray-400 mt-0.5">
                                      Served
                                    </span>
                                  </div>
                                  <div className="bg-blue-50/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-blue-100">
                                    <Clock
                                      size={16}
                                      className="text-blue-500 mb-1.5"
                                    />
                                    <span className="text-xl font-bold text-gray-900">
                                      {qStats?.metrics.avgWaitTime || 0}
                                    </span>
                                    <span className="text-[9px] uppercase font-bold text-gray-400 mt-0.5">
                                      min/avg
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Actions row */}
                          <div className="flex gap-3 mt-auto relative">
                            <button
                              onClick={() => onSelectQueue(queue)}
                              className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 transition-all"
                            >
                              <Activity size={18} /> Manage
                            </button>
                            <button
                              onClick={() =>
                                window.open(
                                  `${window.location.origin}?view=display&queueId=${queue.id}`,
                                  '_blank',
                                )
                              }
                              className="w-12 flex items-center justify-center bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 hover:text-gray-900 transition-all"
                              title="Open Public Display"
                            >
                              <ExternalLink size={20} />
                            </button>

                            <button
                                onClick={(e) => handleDeleteClick(e, queue.id)}
                                className="absolute -top-24 right-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete Queue"
                            >
                                <Trash2 size={18} />
                            </button>

                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
              </div>
          ))
        )}
      </div>

      {/* Create Queue Wizard Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full"
            >
              {step === 1 ? (
                <>
                  <h3 className="text-2xl font-bold mb-2 text-center">
                    Select Business Type
                  </h3>
                  <p className="text-gray-500 mb-8 text-center">
                    Choose the template that best fits your needs.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {businessTypes.map((b) => (
                      <button
                        key={b.type}
                        onClick={() => handleTypeSelect(b.type)}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${
                          selectedType === b.type
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-100 bg-white hover:border-gray-200 text-gray-600'
                        }`}
                      >
                        <b.icon size={32} strokeWidth={1.5} />
                        <span className="font-bold text-sm">{b.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleTypeSelect(selectedType)}
                      className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg hover:bg-primary-700"
                    >
                      Next Step
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleCreateQueue}>
                  <h3 className="text-2xl font-bold mb-2">Configure Queue</h3>
                  <p className="text-gray-500 mb-6">
                    Finalize your queue settings.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Queue Name
                      </label>
                      <input
                        autoFocus
                        type="text"
                        placeholder={`e.g. ${
                          selectedType === 'restaurant'
                            ? 'Main Dining'
                            : 'Dr. Smith'
                        }`}
                        value={newQueueName}
                        onChange={(e) => setNewQueueName(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Est. Wait (Mins)
                      </label>
                      <input
                        type="number"
                        placeholder="5"
                        min="1"
                        value={estimatedTime}
                        onChange={(e) => setEstimatedTime(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                      />
                    </div>
                    {!locationId && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">
                            Location / Branch Name (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Downtown, Westside, Floor 2"
                            value={queueLocation}
                            onChange={(e) => setQueueLocation(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium"
                          />
                        </div>
                    )}
                  </div>

                  <div className="mb-8">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-sm font-bold text-primary-600 flex items-center gap-1 mb-3"
                    >
                      {showAdvanced ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}{' '}
                      Advanced Features (Pre-configured)
                    </button>

                    {showAdvanced && (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                        <label className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-primary-600"
                            checked={featureOverrides.vip}
                            onChange={(e) =>
                              setFeatureOverrides({
                                ...featureOverrides,
                                vip: e.target.checked,
                              })
                            }
                          />
                          <span className="text-sm font-medium">
                            Enable VIP/Priority Status
                          </span>
                        </label>
                        <label className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-primary-600"
                            checked={featureOverrides.multiCounter}
                            onChange={(e) =>
                              setFeatureOverrides({
                                ...featureOverrides,
                                multiCounter: e.target.checked,
                              })
                            }
                          />
                          <span className="text-sm font-medium">
                            Enable Multi-Counter / Tables
                          </span>
                        </label>
                        <label className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-primary-600"
                            checked={featureOverrides.anonymousMode}
                            onChange={(e) =>
                              setFeatureOverrides({
                                ...featureOverrides,
                                anonymousMode: e.target.checked,
                              })
                            }
                          />
                          <span className="text-sm font-medium">
                            Anonymous Mode (Mask Names)
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg"
                    >
                      Create Queue
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QueueList;
