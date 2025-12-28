
import React, { useContext, useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { OrdersContext, LanguageContext, MenuContext, SettingsContext } from '../index';
import { TRANSLATIONS, MENU_ITEMS } from '../constants';
import { Order, OrderStatus, MenuItem, RestaurantSettings, Language } from '../types';

type AdminTab = 'orders' | 'history' | 'analytics' | 'menu' | 'settings';
type SortKey = 'date' | 'status' | 'amount';
type SortOrder = 'asc' | 'desc';
type SyncStatus = 'connected' | 'reconnecting' | 'failed' | 'offline';
type ReportRange = 'daily' | 'weekly' | 'monthly';

interface StatusChangeRequest {
  orderId: string;
  status: OrderStatus;
  customerName: string;
}

const AdminDashboard: React.FC = () => {
  const ordersCtx = useContext(OrdersContext);
  const menuCtx = useContext(MenuContext);
  const settingsCtx = useContext(SettingsContext);
  const langCtx = useContext(LanguageContext);
  
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [statusChangePending, setStatusChangePending] = useState<StatusChangeRequest | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportRange, setReportRange] = useState<ReportRange>('daily');
  
  // Real-time Sync Simulation State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connected');
  const syncIntervalRef = useRef<number | null>(null);

  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortOrder>('desc');

  // Context & Settings
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(true);

  // Menu Management State
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuSearchTerm, setMenuSearchTerm] = useState('');
  const [menuCategoryFilter, setMenuCategoryFilter] = useState<string>('all');

  if (!ordersCtx || !langCtx || !menuCtx || !settingsCtx) return null;
  const { orders, updateOrderStatus } = ordersCtx;
  const { menuItems, updateMenuItem, toggleAvailability, deleteMenuItem } = menuCtx;
  const { settings, updateSettings } = settingsCtx;
  const { language } = langCtx;
  const t = TRANSLATIONS[language];

  const prevOrderCount = useRef(orders.length);

  const connectToOrderStream = useCallback(() => {
    setSyncStatus('connected');
    syncIntervalRef.current = window.setInterval(() => {
      // Simulate occasional connectivity blips for realism
      if (Math.random() < 0.05) {
        setSyncStatus('reconnecting');
        setTimeout(() => setSyncStatus('connected'), 2000);
      }
    }, 15000);
  }, []);

  useEffect(() => {
    connectToOrderStream();
    return () => { if (syncIntervalRef.current) clearInterval(syncIntervalRef.current); };
  }, [connectToOrderStream]);

  const playNotificationSound = useCallback(() => {
    if (!audioAlertsEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.6);
    } catch (e) {}
  }, [audioAlertsEnabled]);

  useEffect(() => {
    if (activeTab === 'orders' && orders.length > prevOrderCount.current) {
      playNotificationSound();
    }
    prevOrderCount.current = orders.length;
  }, [orders.length, activeTab, playNotificationSound]);

  // Comprehensive Metrics Calculation
  const stats = useMemo(() => {
    const now = new Date();
    const rangeInDays = reportRange === 'daily' ? 0 : reportRange === 'weekly' ? 7 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - rangeInDays);
    cutoffDate.setHours(0, 0, 0, 0);

    // Only count orders that are paid or cash (accepted)
    const paidOrders = orders.filter(o => 
      o.payment?.status === 'paid' || o.payment?.method === 'cash'
    );

    const filteredOrders = paidOrders.filter(o => 
      o.status === 'completed' && 
      (reportRange === 'daily' 
        ? new Date(o.createdAt).toDateString() === new Date().toDateString()
        : new Date(o.createdAt) >= cutoffDate)
    );

    const revenue = filteredOrders.reduce((acc, o) => acc + o.total, 0);
    const orderCount = filteredOrders.length;
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0;
    
    const itemCounts: Record<string, number> = {};
    const categoryRevenue: Record<string, number> = {};

    filteredOrders.forEach(o => o.items.forEach(i => {
      itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity;
      const menuItem = MENU_ITEMS.find(m => m.id === i.id);
      if (menuItem) {
        categoryRevenue[menuItem.category] = (categoryRevenue[menuItem.category] || 0) + (i.price * i.quantity);
      }
    }));
    
    const topItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const totalDishes = Object.values(itemCounts).reduce((a, b) => a + b, 0);

    // Dutch BTW Calculation (9% for food)
    const btwAmount = revenue * (9 / 109);
    const netRevenue = revenue - btwAmount;

    // Active orders are only those that are paid/cash and not completed/cancelled
    const activeOrders = paidOrders.filter(o => !['completed', 'cancelled'].includes(o.status));

    return { 
      revenue, 
      activeCount: activeOrders.length,
      orderCount, 
      totalDishes, 
      topItems, 
      btwAmount, 
      netRevenue,
      avgOrderValue,
      categoryRevenue 
    };
  }, [orders, reportRange]);

  const processedOrders = useMemo(() => {
    // Filter only paid orders or cash orders (accepted for preparation)
    const validOrders = orders.filter(o => 
      o.payment?.status === 'paid' || o.payment?.method === 'cash'
    );

    return validOrders
      .filter(o => {
        const matchesSearch = o.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm);
        let matchesTab = true;
        if (activeTab === 'orders') matchesTab = !['completed', 'cancelled'].includes(o.status);
        if (activeTab === 'history') matchesTab = ['completed', 'cancelled'].includes(o.status);
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesSearch && matchesTab && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'date') comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        else if (sortBy === 'amount') comparison = a.total - b.total;
        return sortDirection === 'desc' ? -comparison : comparison;
      });
  }, [orders, searchTerm, statusFilter, sortBy, sortDirection, activeTab]);

  const performActualPrint = (order: Order) => {
    setIsPrinting(true);
    setTimeout(() => {
      if (order.status !== 'completed' && order.status !== 'cancelled') {
        updateOrderStatus(order.id, 'completed');
      }
      setIsPrinting(false);
      setPrintingOrder(null);
    }, 2500);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
      case 'preparing': return 'text-blue-500 border-blue-500/20 bg-blue-500/5';
      case 'ready': return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5';
      case 'delivery': return 'text-purple-500 border-purple-500/20 bg-purple-500/5';
      case 'completed': return 'text-zinc-500 border-zinc-800 bg-zinc-900/50';
      case 'cancelled': return 'text-red-500 border-red-500/20 bg-red-500/5';
      default: return 'text-zinc-500 border-zinc-800 bg-zinc-900/50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col lg:flex-row pt-24 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-80 border-r border-blue-200 bg-white/90 backdrop-blur-3xl p-8 flex flex-col gap-12 relative z-20">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-10">
             <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center font-serif font-bold text-white text-xl shadow-lg">I</div>
             <div className="leading-tight">
                <h2 className="text-lg font-serif font-bold text-gray-800">Staff Console</h2>
                <p className="text-[9px] uppercase tracking-[0.3em] text-gray-600 font-bold">Greek Irini Premium</p>
             </div>
          </div>

          <div className="mb-8 p-4 rounded-2xl glass border border-blue-200 flex items-center gap-4">
             <div className="relative">
                <span className={`block w-2.5 h-2.5 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                {syncStatus === 'connected' && <span className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-40" />}
             </div>
             <p className="text-[10px] font-bold uppercase tracking-widest text-gray-800">
                {syncStatus === 'connected' ? 'Live Link Active' : 'Synchronizing...'}
             </p>
          </div>
          
          {[
            { id: 'orders', label: 'Live Orders', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { id: 'history', label: 'History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2' },
            { id: 'menu', label: 'Menu Mgmt', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13' },
            { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as AdminTab); setSelectedOrder(null); }}
              className={`w-full flex items-center gap-5 px-6 py-5 rounded-2xl transition-all duration-500 group relative overflow-hidden ${
                activeTab === item.id ? 'text-white' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 transition-transform duration-500 ease-out ${activeTab === item.id ? 'translate-x-0' : '-translate-x-full'}`} />
              <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] relative z-10">{item.label}</span>
              {item.id === 'orders' && stats.activeCount > 0 && (
                <span className={`ml-auto w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold relative z-10 ${activeTab === item.id ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
                  {stats.activeCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <button 
          onClick={() => setShowReport(true)}
          className="mt-auto w-full group relative overflow-hidden glass border border-gold-400/20 rounded-2xl p-6 transition-all hover:border-gold-400/50 active:scale-95"
        >
          <div className="text-left relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold-400 mb-0.5">Period Report</p>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">Financial Insights</p>
          </div>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar p-8 lg:p-16">
        {(activeTab === 'orders' || activeTab === 'history') && (
          <div className="max-w-7xl mx-auto space-y-12 animate-reveal">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div>
                <h2 className="text-6xl font-serif font-bold text-gray-900 mb-2">
                  {activeTab === 'orders' ? 'Service Queue' : 'Archive'}
                </h2>
                <p className="text-zinc-500 uppercase tracking-[0.4em] text-[10px] font-bold">
                  {activeTab === 'orders' ? `${stats.activeCount} active requests` : 'Historical Data'}
                </p>
              </div>
              
              <div className="flex gap-4 w-full md:w-auto">
                <input 
                  type="text" 
                  placeholder="Search orders..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/70 border border-blue-300 rounded-2xl px-6 py-4 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all placeholder:text-gray-500 w-full md:w-64"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
              <div className="xl:col-span-2 space-y-4">
                {processedOrders.length === 0 ? (
                  <div className="glass rounded-[3rem] p-20 border border-zinc-900 text-center">
                    <p className="text-zinc-600 font-serif italic text-2xl">No orders found for this view.</p>
                  </div>
                ) : (
                  processedOrders.map((order) => (
                    <div 
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`group relative glass rounded-[2.5rem] p-8 border transition-all duration-500 cursor-pointer overflow-hidden ${
                        selectedOrder?.id === order.id ? 'border-gold-400/40 bg-gold-400/[0.02]' : 'border-zinc-900 hover:border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-8 items-center">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-mono font-bold text-zinc-600 bg-zinc-900/50 px-3 py-1 rounded-lg">#{order.id.split('-')[1]}</span>
                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border ${getStatusColor(order.status)}`}>
                              {t.orderStatus[order.status]}
                            </div>
                          </div>
                          <h3 className="text-3xl font-serif font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{order.customer.name}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-serif font-bold text-gray-900">€{order.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Detail Sidebar */}
              {selectedOrder && (
                <div className="glass rounded-[3rem] p-10 border border-gold-400/20 sticky top-0 h-fit space-y-10 animate-reveal">
                  <div className="flex justify-between items-start border-b border-zinc-800 pb-6">
                    <div>
                      <h4 className="text-3xl font-serif font-bold text-gray-900">Order Details</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Order ID: {selectedOrder.id}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} title="Close" aria-label="Close" className="text-gray-500 hover:text-gray-900 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Items</p>
                    <div className="space-y-4">
                       {selectedOrder.items.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                               <p className="text-sm text-gray-800 font-medium">{item.quantity}x {item.name}</p>
                            </div>
                            <span className="text-zinc-400 text-sm">€{(item.price * item.quantity).toFixed(2)}</span>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-zinc-800 space-y-8">
                     <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Customer Info</p>
                        <p className="text-gray-900 text-sm font-medium">{selectedOrder.customer.address}</p>
                        <p className="text-zinc-500 text-sm">{selectedOrder.customer.phone}</p>
                     </div>

                     <div className="flex justify-between items-end">
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Total Bill</span>
                        <span className="text-4xl font-serif font-bold text-amber-500">€{selectedOrder.total.toFixed(2)}</span>
                     </div>

                     <div className="grid grid-cols-1 gap-4">
                        <button 
                          onClick={() => setPrintingOrder(selectedOrder)}
                          className="w-full py-5 glass border border-blue-300 rounded-2xl text-blue-600 font-bold uppercase text-[11px] tracking-widest hover:border-blue-500 transition-all"
                        >
                          Print Receipt
                        </button>
                        {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                          <button 
                            onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                            className="w-full py-5 gold-bg text-zinc-950 rounded-2xl font-bold uppercase text-[11px] tracking-widest shadow-xl shadow-gold-400/10 hover:scale-[1.02] transition-all"
                          >
                            Mark as Completed
                          </button>
                        )}
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="max-w-7xl mx-auto space-y-16 animate-reveal">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-6xl font-serif font-bold text-gray-900 mb-2">Metrics</h2>
                <p className="text-zinc-500 uppercase tracking-[0.5em] text-[10px] font-bold">Comprehensive Performance</p>
              </div>
              <div className="flex gap-2 glass p-1.5 rounded-2xl border border-zinc-900">
                {(['daily', 'weekly', 'monthly'] as ReportRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setReportRange(r)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                      reportRange === r ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
               {[
                 { label: 'Revenue', value: `€${stats.revenue.toFixed(0)}`, color: 'gold' },
                 { label: 'Total Orders', value: stats.orderCount, color: 'emerald' },
                 { label: 'Avg Order Value', value: `€${stats.avgOrderValue.toFixed(2)}`, color: 'blue' },
                 { label: 'Dishes Sold', value: stats.totalDishes, color: 'amber' }
               ].map((card, i) => (
                 <div key={i} className="glass p-10 rounded-[3rem] border border-zinc-900 group hover:border-gold-400/30 transition-all">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-6 group-hover:text-zinc-400 transition-colors">{card.label}</p>
                    <span className={`text-5xl font-serif font-bold ${card.color === 'gold' ? 'text-amber-500' : 'text-gray-900'}`}>{card.value}</span>
                 </div>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="glass p-12 rounded-[3.5rem] border border-zinc-900 space-y-10">
                  <h4 className="text-2xl font-serif font-bold text-gray-900">Revenue by Category</h4>
                  <div className="space-y-8">
                     {Object.entries(stats.categoryRevenue).map(([cat, rev]) => {
                       const revNum = typeof rev === 'number' ? rev : 0;
                       const percentage = stats.revenue > 0 ? (revNum / stats.revenue) * 100 : 0;
                       return (
                         <div key={cat} className="space-y-3">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                               <span className="text-zinc-400">{cat}</span>
                               <span className="text-amber-500">€{revNum.toFixed(2)} ({percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                               <div className={`h-full gold-bg transition-all duration-1000 w-[${Math.round(percentage)}%]`} />
                            </div>
                         </div>
                       );
                     })}
                  </div>
               </div>

               <div className="glass p-12 rounded-[3.5rem] border border-zinc-900 space-y-10">
                  <h4 className="text-2xl font-serif font-bold text-gray-900">Top 5 Bestsellers</h4>
                  <div className="space-y-4">
                     {stats.topItems.map(([name, count], i) => (
                        <div key={i} className="flex justify-between items-center p-5 bg-zinc-950/50 rounded-2xl border border-zinc-900 hover:border-gold-400/20 transition-all">
                           <div className="flex items-center gap-4">
                              <span className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[10px] font-bold text-gold-400">#{i+1}</span>
                              <span className="text-sm text-gray-900 font-medium">{name}</span>
                           </div>
                           <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{count} Units</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Menu Management Tab */}
        {activeTab === 'menu' && (
          <div className="max-w-7xl mx-auto space-y-12 animate-reveal">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
              <div>
                <h2 className="text-6xl font-serif font-bold text-gray-900 mb-2">Menu Management</h2>
                <p className="text-zinc-500 uppercase tracking-[0.4em] text-[10px] font-bold">
                  {menuItems.length} items • {menuItems.filter(m => m.isAvailable !== false).length} available
                </p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <input 
                  type="text" 
                  placeholder="Search menu..." 
                  value={menuSearchTerm}
                  onChange={(e) => setMenuSearchTerm(e.target.value)}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-gold-400/50 transition-all placeholder:text-zinc-700 w-full md:w-64"
                />
                <select
                  value={menuCategoryFilter}
                  title="Filter by category"
                  onChange={(e) => setMenuCategoryFilter(e.target.value)}
                  className="bg-white/70 border border-blue-300 rounded-2xl px-6 py-4 text-sm text-gray-900 outline-none focus:border-blue-500 transition-all"
                >
                  <option value="all">All Categories</option>
                  <option value="mains">Mains</option>
                  <option value="starters_cold">Cold Starters</option>
                  <option value="starters_warm">Warm Starters</option>
                  <option value="salads">Salads</option>
                  <option value="desserts">Desserts</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {menuItems
                .filter(item => {
                  const matchesSearch = item.names[language].toLowerCase().includes(menuSearchTerm.toLowerCase());
                  const matchesCategory = menuCategoryFilter === 'all' || item.category === menuCategoryFilter;
                  return matchesSearch && matchesCategory;
                })
                .map(item => (
                  <div 
                    key={item.id}
                    className={`glass rounded-3xl border overflow-hidden transition-all ${
                      item.isAvailable !== false ? 'border-zinc-800 hover:border-gold-400/30' : 'border-red-500/20 opacity-60'
                    }`}
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.names[language]}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        {item.isPopular && (
                          <span className="px-3 py-1 bg-gold-400 text-zinc-950 rounded-full text-[8px] font-bold uppercase">Popular</span>
                        )}
                        {item.isNew && (
                          <span className="px-3 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-bold uppercase">New</span>
                        )}
                      </div>
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase ${
                          item.isAvailable !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {item.isAvailable !== false ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-serif font-bold text-gray-900">{item.names[language]}</h3>
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500">{t.categories[item.category as keyof typeof t.categories]}</p>
                        </div>
                        <span className="text-2xl font-serif font-bold text-amber-500">€{item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-zinc-500 text-sm line-clamp-2">{item.descriptions[language]}</p>
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => toggleAvailability(item.id)}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                            item.isAvailable !== false 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                        >
                          {item.isAvailable !== false ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                        <button
                          onClick={() => setEditingMenuItem(item)}
                          className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest glass border border-blue-300 text-gray-700 hover:text-gray-900 hover:border-blue-500 transition-all"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-12 animate-reveal">
            <div>
              <h2 className="text-6xl font-serif font-bold text-gray-900 mb-2">Settings</h2>
              <p className="text-zinc-500 uppercase tracking-[0.4em] text-[10px] font-bold">Restaurant Configuration</p>
            </div>

            {/* Restaurant Info */}
            <div className="glass rounded-[3rem] border border-zinc-800 p-10 space-y-8">
              <h3 className="text-2xl font-serif font-bold text-white flex items-center gap-4">
                <svg className="w-6 h-6 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Restaurant Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Restaurant Name</label>
                  <input
                    type="text"
                    placeholder="Restaurant name"
                    value={settings.name}
                    onChange={(e) => updateSettings({ name: e.target.value })}
                    className="w-full bg-white/70 border border-blue-300 rounded-xl px-4 py-3 text-gray-900 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Phone</label>
                  <input
                    type="text"
                    placeholder="Phone number"
                    value={settings.phone}
                    onChange={(e) => updateSettings({ phone: e.target.value })}
                    className="w-full bg-white/70 border border-blue-300 rounded-xl px-4 py-3 text-gray-900 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={settings.email}
                    onChange={(e) => updateSettings({ email: e.target.value })}
                    className="w-full bg-white/70 border border-blue-300 rounded-xl px-4 py-3 text-gray-900 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Address</label>
                  <input
                    type="text"
                    placeholder="Street address"
                    value={settings.address}
                    onChange={(e) => updateSettings({ address: e.target.value })}
                    className="w-full bg-white/70 border border-blue-300 rounded-xl px-4 py-3 text-gray-900 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="glass rounded-[3rem] border border-zinc-800 p-10 space-y-8">
              <h3 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-4">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Opening Hours
              </h3>
              <div className="space-y-4">
                {Object.entries(settings.openingHours).map(([day, hoursData]) => {
                  const hours = hoursData as { open: string; close: string; closed?: boolean };
                  return (
                  <div key={day} className="flex items-center gap-6 p-4 bg-zinc-900/30 rounded-2xl">
                    <span className="w-28 text-sm font-medium text-gray-900 capitalize">{day}</span>
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="time"
                        title="Opening time"
                        value={hours.open}
                        onChange={(e) => updateSettings({
                          openingHours: {
                            ...settings.openingHours,
                            [day]: { ...hours, open: e.target.value }
                          }
                        })}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-400/50 outline-none"
                      />
                      <span className="text-zinc-600">-</span>
                      <input
                        type="time"
                        title="Closing time"
                        value={hours.close}
                        onChange={(e) => updateSettings({
                          openingHours: {
                            ...settings.openingHours,
                            [day]: { ...hours, close: e.target.value }
                          }
                        })}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-gold-400/50 outline-none"
                      />
                    </div>
                    <button
                      onClick={() => updateSettings({
                        openingHours: {
                          ...settings.openingHours,
                          [day]: { ...hours, closed: !hours.closed }
                        }
                      })}
                      className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        hours.closed 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {hours.closed ? 'Closed' : 'Open'}
                    </button>
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Settings */}
            <div className="glass rounded-[3rem] border border-zinc-800 p-10 space-y-8">
              <h3 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-4">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
                Delivery Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Minimum Order (€)</label>
                  <input
                    type="number"
                    step="0.50"
                    placeholder="15.00"
                    value={settings.deliveryZones.minOrder}
                    onChange={(e) => updateSettings({
                      deliveryZones: { ...settings.deliveryZones, minOrder: parseFloat(e.target.value) }
                    })}
                    className="w-full bg-white/70 border border-blue-300 rounded-xl px-4 py-3 text-gray-900 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Delivery Fee (€)</label>
                  <input
                    type="number"
                    step="0.50"
                    placeholder="3.50"
                    value={settings.deliveryZones.fee}
                    onChange={(e) => updateSettings({
                      deliveryZones: { ...settings.deliveryZones, fee: parseFloat(e.target.value) }
                    })}
                    className="w-full bg-white/70 border border-blue-300 rounded-xl px-4 py-3 text-gray-900 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Free Delivery From (€)</label>
                  <input
                    type="number"
                    step="0.50"
                    placeholder="35.00"
                    value={settings.deliveryZones.freeFrom}
                    onChange={(e) => updateSettings({
                      deliveryZones: { ...settings.deliveryZones, freeFrom: parseFloat(e.target.value) }
                    })}
                    className="w-full bg-white/70 border border-blue-300 rounded-xl px-4 py-3 text-gray-900 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="glass rounded-[3rem] border border-zinc-800 p-10 space-y-8">
              <h3 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-4">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Payment Methods
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'ideal' as const, label: 'iDEAL', icon: '🏦' },
                  { key: 'card' as const, label: 'Credit Card', icon: '💳' },
                  { key: 'cash' as const, label: 'Cash', icon: '💵' },
                  { key: 'bancontact' as const, label: 'Bancontact', icon: '🇧🇪' },
                ].map(method => (
                  <button
                    key={method.key}
                    onClick={() => updateSettings({
                      payments: { ...settings.payments, [method.key]: !settings.payments[method.key] }
                    })}
                    className={`p-6 rounded-2xl border transition-all flex flex-col items-center gap-3 ${
                      settings.payments[method.key]
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-900/30 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <span className="text-3xl">{method.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{method.label}</span>
                    <span className={`text-[8px] font-bold uppercase tracking-widest ${
                      settings.payments[method.key] ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {settings.payments[method.key] ? 'Enabled' : 'Disabled'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="glass rounded-[3rem] border border-zinc-800 p-10 space-y-8">
              <h3 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-4">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 bg-zinc-900/30 rounded-2xl">
                  <div>
                    <p className="text-gray-900 font-medium">Sound Alerts</p>
                    <p className="text-zinc-500 text-sm">Play sound when new order arrives</p>
                  </div>
                  <button
                    onClick={() => {
                      setAudioAlertsEnabled(!audioAlertsEnabled);
                      updateSettings({
                        notifications: { ...settings.notifications, soundEnabled: !audioAlertsEnabled }
                      });
                    }}
                    className={`w-14 h-8 rounded-full transition-all relative ${
                      audioAlertsEnabled ? 'bg-gold-400' : 'bg-zinc-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                      audioAlertsEnabled ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-5 bg-zinc-900/30 rounded-2xl">
                  <div>
                    <p className="text-white font-medium">Email Notifications</p>
                    <p className="text-zinc-500 text-sm">Receive email for new orders</p>
                  </div>
                  <button
                    onClick={() => updateSettings({
                      notifications: { ...settings.notifications, emailEnabled: !settings.notifications.emailEnabled }
                    })}
                    className={`w-14 h-8 rounded-full transition-all relative ${
                      settings.notifications.emailEnabled ? 'bg-gold-400' : 'bg-zinc-700'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${
                      settings.notifications.emailEnabled ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Menu Item Modal */}
      {editingMenuItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-2xl" onClick={() => setEditingMenuItem(null)} />
          <div className="relative w-full max-w-2xl glass rounded-[3rem] border border-gold-400/20 shadow-3xl overflow-hidden animate-reveal p-10 space-y-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-3xl font-serif font-bold text-white mb-2">Edit Menu Item</h3>
                <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-bold">{editingMenuItem.id}</p>
              </div>
              <button onClick={() => setEditingMenuItem(null)} title="Close" aria-label="Close" className="w-10 h-10 rounded-full glass border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Price (€)</label>
                <input
                  type="number"
                  step="0.50"
                  value={editingMenuItem.price}
                  onChange={(e) => {
                    const newPrice = parseFloat(e.target.value);
                    setEditingMenuItem({ ...editingMenuItem, price: newPrice });
                  }}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-gold-400/50 outline-none transition-all text-2xl font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setEditingMenuItem({ ...editingMenuItem, isPopular: !editingMenuItem.isPopular })}
                  className={`p-4 rounded-xl border transition-all ${
                    editingMenuItem.isPopular ? 'bg-gold-400/10 border-gold-400/30 text-gold-400' : 'bg-zinc-900/30 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="text-xl">⭐</span>
                  <p className="text-[9px] font-bold uppercase mt-1">Popular</p>
                </button>
                <button
                  onClick={() => setEditingMenuItem({ ...editingMenuItem, isNew: !editingMenuItem.isNew })}
                  className={`p-4 rounded-xl border transition-all ${
                    editingMenuItem.isNew ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-zinc-900/30 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="text-xl">🆕</span>
                  <p className="text-[9px] font-bold uppercase mt-1">New</p>
                </button>
                <button
                  onClick={() => setEditingMenuItem({ ...editingMenuItem, isVegetarian: !editingMenuItem.isVegetarian })}
                  className={`p-4 rounded-xl border transition-all ${
                    editingMenuItem.isVegetarian ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-zinc-900/30 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <span className="text-xl">🥬</span>
                  <p className="text-[9px] font-bold uppercase mt-1">Vegetarian</p>
                </button>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEditingMenuItem(null)}
                  className="flex-1 py-4 glass border border-zinc-800 rounded-2xl text-zinc-400 font-bold uppercase text-[10px] tracking-widest hover:border-zinc-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    updateMenuItem(editingMenuItem.id, editingMenuItem);
                    setEditingMenuItem(null);
                  }}
                  className="flex-[2] py-4 gold-bg text-zinc-950 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg hover:scale-[1.02] transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Business Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-2xl" onClick={() => setShowReport(false)} />
          <div className="relative w-full max-w-2xl glass rounded-[4rem] border border-gold-400/20 shadow-3xl overflow-hidden animate-reveal p-12 space-y-12">
             <div className="flex justify-between items-start">
                <div>
                   <h3 className="text-5xl font-serif font-bold text-white mb-2">Business Audit</h3>
                   <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-bold">Reporting Period: {reportRange}</p>
                </div>
                <button onClick={() => setShowReport(false)} title="Close" aria-label="Close" className="w-12 h-12 rounded-full glass border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
             </div>

             <div className="grid grid-cols-2 gap-8">
                <div className="glass p-8 rounded-3xl border border-zinc-900">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-2">Gross Revenue</p>
                    <p className="text-5xl font-serif font-bold text-white">€{stats.revenue.toFixed(2)}</p>
                </div>
                <div className="glass p-8 rounded-3xl border border-zinc-900">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-2">BTW Tax (9%)</p>
                    <p className="text-5xl font-serif font-bold text-amber-500">€{stats.btwAmount.toFixed(2)}</p>
                </div>
             </div>

             <div className="space-y-6">
                 <div className="flex justify-between text-sm py-4 border-b border-zinc-900">
                     <span className="text-zinc-400 font-medium">Net Sales (Excl. Tax)</span>
                     <span className="text-white font-bold">€{(stats.revenue - stats.btwAmount).toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm py-4 border-b border-zinc-900">
                     <span className="text-zinc-400 font-medium">Orders Completed</span>
                     <span className="text-white font-bold">{stats.orderCount}</span>
                 </div>
                 <div className="flex justify-between text-sm py-4">
                     <span className="text-zinc-500 font-bold uppercase tracking-widest">Final Net Result</span>
                     <span className="text-3xl font-serif font-bold gold-gradient">€{stats.netRevenue.toFixed(2)}</span>
                 </div>
             </div>

             <button 
               onClick={() => window.print()}
               className="w-full py-6 rounded-3xl gold-bg text-zinc-950 font-bold uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-transform hover:scale-[1.02] active:scale-95"
             >
                Download Audit Report (PDF)
             </button>
          </div>
        </div>
      )}

      {/* Simulated Receipt Preview */}
      {printingOrder && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-xl" onClick={() => !isPrinting && setPrintingOrder(null)} />
          <div className="relative w-full max-w-lg glass rounded-[3.5rem] border border-white/10 overflow-hidden animate-reveal p-10 space-y-10">
            <h3 className="text-2xl font-serif font-bold text-white text-center">Receipt Confirmation</h3>
            <div className="relative">
               {isPrinting && (
                 <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-sm rounded-2xl">
                    <div className="w-16 h-16 border-4 border-gold-400/20 border-t-gold-400 rounded-full animate-spin" />
                    <p className="mt-4 text-xs font-bold uppercase tracking-widest text-white">Processing Print Job...</p>
                 </div>
               )}
               <div className="bg-white p-10 rounded-2xl text-zinc-950 font-mono text-[11px] space-y-6 shadow-2xl">
                  <div className="text-center space-y-1">
                    <p className="font-bold text-2xl font-serif tracking-widest">GREEK IRINI</p>
                    <p>Weimarstraat 174, Den Haag</p>
                    <p className="text-[10px] opacity-60">BTW nr: NL123456789B01</p>
                  </div>
                  <div className="border-t border-zinc-200 pt-4 space-y-1">
                    <p className="font-bold">Customer: {printingOrder.customer.name}</p>
                    <p>Address: {printingOrder.customer.address}</p>
                    <p>Order Date: {new Date(printingOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="space-y-2 py-4">
                    {printingOrder.items.map((i, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{i.quantity}x {i.name}</span>
                        <span>€{(i.price * i.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-zinc-950 pt-4 space-y-1">
                    <div className="flex justify-between text-zinc-600">
                      <span>Subtotal (Excl. BTW)</span><span>€{(printingOrder.total * 0.91).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                      <span>BTW 9%</span><span>€{(printingOrder.total * 0.09).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl pt-2">
                      <span>TOTAL</span><span>€{printingOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-center pt-6 text-[10px] opacity-40 uppercase tracking-widest">Efcharistó - Thank You!</p>
               </div>
            </div>
            <div className="flex gap-4">
              <button disabled={isPrinting} onClick={() => setPrintingOrder(null)} className="flex-1 py-5 glass border border-zinc-800 rounded-2xl text-zinc-500 font-bold uppercase text-[10px]">Cancel</button>
              <button disabled={isPrinting} onClick={() => performActualPrint(printingOrder)} className="flex-[2] py-5 gold-bg text-zinc-950 rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-lg">Confirm & Execute Print</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; border-radius: 10px; }
      `}} />
    </div>
  );
};

export default AdminDashboard;
