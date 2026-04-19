import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CircleDollarSign, 
  History, 
  PieChart as LucidePieChart, 
  Settings, 
  PlusCircle,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
  ArrowRight
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { 
  BudgetCategory, 
  BudgetItem, 
  Transaction, 
  MonthlyBudget 
} from './types';
import { INITIAL_CATEGORIES } from './constants';
import { cn, formatCurrency, getMonthName } from './lib/utils';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as ReTooltip
} from 'recharts';

export default function App() {
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [activeTab, setActiveTab] = useState<'budget' | 'transactions' | 'insights'>('budget');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedItemForTx, setSelectedItemForTx] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Persist to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('every_birr_budget');
    if (saved) {
      try {
        setBudget(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved budget", e);
      }
    } else {
      const initialBudget: MonthlyBudget = {
        id: uuidv4(),
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        categories: INITIAL_CATEGORIES,
        transactions: [],
      };
      setBudget(initialBudget);
    }
  }, []);

  useEffect(() => {
    if (budget) {
      localStorage.setItem('every_birr_budget', JSON.stringify(budget));
    }
  }, [budget]);

  const totals = useMemo(() => {
    if (!budget) return { income: 0, planned: 0, spent: 0, leftToBudget: 0 };
    
    let income = 0;
    let planned = 0;
    let spent = 0;
    
    budget.categories.forEach(cat => {
      cat.items.forEach(item => {
        if (cat.type === 'income') {
          income += item.planned;
        } else {
          planned += item.planned;
          spent += item.spent;
        }
      });
    });
    
    return {
      income,
      planned,
      spent,
      leftToBudget: income - planned
    };
  }, [budget]);

  if (!budget) return null;

  const handleUpdatePlanned = (catId: string, itemId: string, value: number) => {
    setBudget(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categories: prev.categories.map(cat => 
          cat.id === catId 
            ? { ...cat, items: cat.items.map(item => item.id === itemId ? { ...item, planned: value } : item) }
            : cat
        )
      };
    });
  };

  const handleUpdateItemName = (catId: string, itemId: string, name: string) => {
    setBudget(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categories: prev.categories.map(cat => 
          cat.id === catId 
            ? { ...cat, items: cat.items.map(item => item.id === itemId ? { ...item, name } : item) }
            : cat
        )
      };
    });
  };

  const handleAddItem = (catId: string) => {
    const newItem: BudgetItem = {
      id: uuidv4(),
      name: 'New Item',
      planned: 0,
      spent: 0,
      type: budget.categories.find(c => c.id === catId)?.type || 'expense'
    };

    setBudget(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categories: prev.categories.map(cat => 
          cat.id === catId 
            ? { ...cat, items: [...cat.items, newItem] }
            : cat
        )
      };
    });
    setEditingId(newItem.id);
  };

  const handleDeleteItem = (catId: string, itemId: string) => {
    setBudget(prev => {
      if (!prev) return null;
      // Also cleanup transactions for this item
      return {
        ...prev,
        transactions: prev.transactions.filter(t => t.budgetItemId !== itemId),
        categories: prev.categories.map(cat => 
          cat.id === catId 
            ? { ...cat, items: cat.items.filter(i => i.id !== itemId) }
            : cat
        )
      };
    });
  };

  const handleAddCategory = (type: 'income' | 'expense') => {
    const newCat: BudgetCategory = {
      id: uuidv4(),
      name: 'New Category',
      type,
      items: []
    };

    setBudget(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categories: [...prev.categories, newCat]
      };
    });
    setEditingId(newCat.id);
  };

  const handleUpdateCategoryName = (catId: string, name: string) => {
    setBudget(prev => {
      if (!prev) return null;
      return {
        ...prev,
        categories: prev.categories.map(cat => cat.id === catId ? { ...cat, name } : cat)
      };
    });
  };

  const handleDeleteCategory = (catId: string) => {
    const cat = budget.categories.find(c => c.id === catId);
    if (!cat) return;
    const itemIds = cat.items.map(i => i.id);

    setBudget(prev => {
      if (!prev) return null;
      return {
        ...prev,
        transactions: prev.transactions.filter(t => !itemIds.includes(t.budgetItemId)),
        categories: prev.categories.filter(c => c.id !== catId)
      };
    });
  };

  const handleAddTransaction = (amount: number, description: string, itemId: string) => {
    const item = budget.categories.flatMap(c => c.items).find(i => i.id === itemId);
    const categoryName = budget.categories.find(c => c.items.some(i => i.id === itemId))?.name || 'Unknown';

    const newTx: Transaction = {
      id: uuidv4(),
      date: new Date().toISOString(),
      amount,
      description,
      budgetItemId: itemId,
      categoryName
    };

    setBudget(prev => {
      if (!prev) return null;
      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        categories: prev.categories.map(cat => ({
          ...cat,
          items: cat.items.map(i => i.id === itemId ? { ...i, spent: i.spent + amount } : i)
        }))
      };
    });
    setIsTxModalOpen(false);
  };

  const handleDeleteTransaction = (txId: string) => {
    const tx = budget.transactions.find(t => t.id === txId);
    if (!tx) return;

    setBudget(prev => {
      if (!prev) return null;
      return {
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== txId),
        categories: prev.categories.map(cat => ({
          ...cat,
          items: cat.items.map(i => i.id === tx.budgetItemId ? { ...i, spent: Math.max(0, i.spent - tx.amount) } : i)
        }))
      };
    });
  };

  const chartData = budget.categories
    .filter(c => c.type === 'expense')
    .map(c => ({
      name: c.name,
      value: c.items.reduce((acc, i) => acc + i.planned, 0)
    }))
    .filter(d => d.value > 0);

  const COLORS = ['#009739', '#FFD100', '#EF3340', '#4A90E2', '#9013FE', '#F5A623'];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-ethiopia-green rounded-xl flex items-center justify-center text-white font-bold shadow-lg overflow-hidden">
                <div className="relative w-full h-full flex flex-col">
                  <div className="h-1/3 w-full bg-ethiopia-green" />
                  <div className="h-1/3 w-full bg-ethiopia-yellow" />
                  <div className="h-1/3 w-full bg-ethiopia-red" />
                  <div className="absolute inset-0 flex items-center justify-center text-white drop-shadow-md">E</div>
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Every Birr</h1>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">
                  {getMonthName(budget.month)} {budget.year}
                </p>
              </div>
            </div>
            
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Zero-Based Status Bar */}
        <div className="bg-white border-t px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <div className={cn(
              "p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 transition-all duration-300",
              totals.leftToBudget === 0 
                ? "bg-ethiopia-green/10 border border-ethiopia-green/20" 
                : totals.leftToBudget > 0 
                ? "bg-ethiopia-yellow/10 border border-ethiopia-yellow/20"
                : "bg-ethiopia-red/10 border border-ethiopia-red/20"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  totals.leftToBudget === 0 ? "bg-ethiopia-green text-white" : "bg-white text-gray-600 shadow-sm"
                )}>
                  {totals.leftToBudget === 0 ? <PlusCircle className="w-5 h-5 rotate-45" /> : <Wallet className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {totals.leftToBudget === 0 ? "Perfectly Budgeted" : totals.leftToBudget > 0 ? "Left to Budget" : "Over Budget"}
                  </div>
                  <div className={cn(
                    "text-2xl font-bold font-mono tracking-tighter",
                    totals.leftToBudget === 0 ? "text-ethiopia-green" : totals.leftToBudget > 0 ? "text-gray-900" : "text-ethiopia-red"
                  )}>
                    {formatCurrency(Math.abs(totals.leftToBudget))}
                  </div>
                </div>
              </div>
              
              {totals.leftToBudget !== 0 && (
                <div className="text-sm font-medium text-gray-600 max-w-xs text-center sm:text-right">
                  {totals.leftToBudget > 0 
                    ? `Assign your remaining ${formatCurrency(totals.leftToBudget)} to reach zero.`
                    : `You've over-planned by ${formatCurrency(Math.abs(totals.leftToBudget))}. Reduce your spending items.`}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'budget' && (
            <motion.div 
              key="budget"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {budget.categories.map((category) => (
                <div key={category.id} className="bg-white rounded-3xl shadow-sm border overflow-hidden group/cat">
                  <div className={cn(
                    "px-6 py-4 flex justify-between items-center border-b",
                    category.type === 'income' ? "bg-ethiopia-green text-white" : "bg-gray-50 text-gray-900"
                  )}>
                    {editingId === category.id ? (
                      <input 
                        autoFocus
                        value={category.name}
                        onChange={(e) => handleUpdateCategoryName(category.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                        className="bg-transparent border-b border-white/50 outline-none font-bold text-lg w-full"
                      />
                    ) : (
                      <div className="flex items-center gap-2 group/title">
                        <h2 
                          className="font-bold text-lg cursor-text"
                          onClick={() => setEditingId(category.id)}
                        >
                          {category.name}
                        </h2>
                        <button 
                          onClick={() => handleDeleteCategory(category.id)}
                          className={cn(
                            "p-1 rounded-md transition-opacity opacity-0 group-hover/cat:opacity-100",
                            category.type === 'income' ? "hover:bg-white/20" : "hover:bg-gray-200 text-gray-400 hover:text-ethiopia-red"
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="text-xs font-bold uppercase tracking-widest opacity-80">
                      {category.type === 'income' ? 'Total Income' : 'Expenses'}
                    </div>
                  </div>
                  
                  <div className="divide-y">
                    {category.items.map((item) => (
                      <div key={item.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors group">
                        <div className="flex-1 min-w-0">
                          {editingId === item.id ? (
                            <input 
                              autoFocus
                              value={item.name}
                              onChange={(e) => handleUpdateItemName(category.id, item.id, e.target.value)}
                              onBlur={() => setEditingId(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                              className="bg-transparent border-b border-ethiopia-green outline-none font-semibold text-gray-800 w-full"
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 
                                className="font-semibold text-gray-800 truncate cursor-text"
                                onClick={() => setEditingId(item.id)}
                              >
                                {item.name}
                              </h3>
                              <button 
                                onClick={() => handleDeleteItem(category.id, item.id)}
                                className="p-1 rounded-md text-gray-300 hover:text-ethiopia-red hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          {category.type === 'expense' && (
                            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (item.spent / (item.planned || 1)) * 100)}%` }}
                                className={cn(
                                  "h-full rounded-full transition-all duration-1000",
                                  item.spent > item.planned ? "bg-ethiopia-red" : "bg-ethiopia-green"
                                )}
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 sm:gap-8">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Planned</span>
                            <div className="relative group/input flex items-center">
                              <span className="absolute left-0 text-gray-400 text-xs font-mono ml-2 pointer-events-none">ETB</span>
                              <input 
                                type="number" 
                                value={item.planned || ''} 
                                onChange={(e) => handleUpdatePlanned(category.id, item.id, parseFloat(e.target.value) || 0)}
                                className="w-28 pl-9 pr-2 py-1 bg-transparent border-b border-dashed border-gray-300 focus:border-ethiopia-green outline-none font-mono text-right font-bold text-gray-700"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          {category.type === 'expense' && (
                            <div className="flex flex-col items-end w-24">
                              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Remaining</span>
                              <span className={cn(
                                "font-mono font-bold tracking-tight",
                                item.planned - item.spent < 0 ? "text-ethiopia-red" : "text-gray-900"
                              )}>
                                {formatCurrency(item.planned - item.spent)}
                              </span>
                            </div>
                          )}

                          <button 
                            onClick={() => {
                              setSelectedItemForTx(item.id);
                              setIsTxModalOpen(true);
                            }}
                            className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            <PlusCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => handleAddItem(category.id)}
                    className="w-full py-3 px-6 bg-gray-50/50 hover:bg-gray-100 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
              ))}
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => handleAddCategory('expense')}
                  className="flex-1 py-4 px-6 rounded-3xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-ethiopia-green hover:text-ethiopia-green hover:bg-ethiopia-green/5 transition-all font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add Expense Category
                </button>
                <button 
                  onClick={() => handleAddCategory('income')}
                  className="flex-1 py-4 px-6 rounded-3xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-ethiopia-green hover:text-ethiopia-green hover:bg-ethiopia-green/5 transition-all font-bold flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add Income Category
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div 
              key="transactions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Recent Spending</h2>
                <button 
                  onClick={() => setIsTxModalOpen(true)}
                  className="bg-ethiopia-green text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5" /> Log Birr
                </button>
              </div>

              {budget.transactions.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No transactions yet</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">Start tracking your daily expenses to see exactly where your Birr goes.</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                  <div className="divide-y">
                    {budget.transactions.map((tx) => (
                      <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500 group-hover:bg-ethiopia-green/10 group-hover:text-ethiopia-green transition-all">
                            <TrendingDown className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{tx.description}</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                              <span>{tx.categoryName}</span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full" />
                              <span>{new Date(tx.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-bold text-gray-900">
                            {formatCurrency(tx.amount)}
                          </span>
                          <button 
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-2 text-gray-300 hover:text-ethiopia-red opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'insights' && (
            <motion.div 
              key="insights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-bold text-gray-900">Budget Insights</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border h-[400px] flex flex-col">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <LucidePieChart className="w-4 h-4" /> Category Breakdown
                  </h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={chartData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ReTooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] uppercase font-bold">
                    {chartData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-500 truncate">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border h-[400px] flex flex-col">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Budget Status
                  </h3>
                  <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    {budget.categories.filter(c => c.type === 'expense').map(cat => (
                      <div key={cat.id} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                          <span className="text-gray-500">{cat.name}</span>
                          <span className={cn(
                            cat.items.reduce((s, i) => s + i.spent, 0) > cat.items.reduce((s, i) => s + i.planned, 0)
                              ? "text-ethiopia-red"
                              : "text-ethiopia-green"
                          )}>
                            {Math.round((cat.items.reduce((s, i) => s + i.spent, 0) / (cat.items.reduce((s, i) => s + i.planned, 0) || 1)) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              cat.items.reduce((s, i) => s + i.spent, 0) > cat.items.reduce((s, i) => s + i.planned, 0)
                                ? "bg-ethiopia-red"
                                : "bg-ethiopia-green"
                            )}
                            style={{ width: `${Math.min(100, (cat.items.reduce((s, i) => s + i.spent, 0) / (cat.items.reduce((s, i) => s + i.planned, 0) || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-ethiopia-green to-green-700 p-8 rounded-3xl text-white shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Financial Tip</h3>
                    <p className="text-white/80 text-sm">Grow your wealth, one birr at a time.</p>
                  </div>
                </div>
                <p className="text-lg leading-relaxed font-medium">
                  Investing in your local "Iqub" or "Edir" is a traditional Ethiopian way of saving. 
                  Make sure to include these as fixed items in your "Personal" or "Savings" category 
                  to ensure you're consistently building your financial future!
                </p>
                <button className="mt-8 bg-white text-ethiopia-green px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-100 transition-all shadow-lg active:scale-95">
                  Learn about local saving <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto px-4 py-2 flex justify-around items-center">
          <NavItem 
            active={activeTab === 'budget'} 
            onClick={() => setActiveTab('budget')} 
            icon={<Wallet className="w-6 h-6" />}
            label="Budget"
          />
          <NavItem 
            active={activeTab === 'transactions'} 
            onClick={() => setActiveTab('transactions')} 
            icon={<History className="w-6 h-6" />}
            label="Spend"
          />
          <div className="relative -top-8 bg-white border-t p-2 rounded-full border-gray-200 shadow-xl">
            <button 
              onClick={() => {
                setSelectedItemForTx(null);
                setIsTxModalOpen(true);
              }}
              className="w-14 h-14 bg-ethiopia-green text-white rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(0,151,57,0.3)] hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>
          <NavItem 
            active={activeTab === 'insights'} 
            onClick={() => setActiveTab('insights')} 
            icon={<LucidePieChart className="w-6 h-6" />}
            label="Insights"
          />
          <NavItem 
            active={false} 
            onClick={() => {}} 
            icon={<CircleDollarSign className="w-6 h-6" />}
            label="Learn"
          />
        </div>
      </nav>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isTxModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTxModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden relative"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold">Log Consumption</h2>
                  <button onClick={() => setIsTxModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                <form className="space-y-6" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const amount = parseFloat(formData.get('amount') as string);
                  const desc = formData.get('description') as string;
                  const item = formData.get('item') as string;
                  if (amount && desc && item) {
                    handleAddTransaction(amount, desc, item);
                  }
                }}>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-gray-400 tracking-widest pl-2">Amount (Birr)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-mono font-bold">ETB</span>
                      <input 
                        name="amount"
                        type="number" 
                        step="0.01"
                        autoFocus
                        className="w-full pl-16 pr-8 py-6 bg-gray-50 rounded-3xl text-3xl font-mono font-bold focus:bg-white focus:ring-4 focus:ring-ethiopia-green/10 outline-none transition-all"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-gray-400 tracking-widest pl-2">Description</label>
                    <input 
                      name="description"
                      type="text" 
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-medium focus:bg-white focus:ring-4 focus:ring-ethiopia-green/10 outline-none transition-all"
                      placeholder="e.g., Lunch at Taitu Hotel"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-gray-400 tracking-widest pl-2">Budget Item</label>
                    <select 
                      name="item"
                      defaultValue={selectedItemForTx || ""}
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl font-medium focus:bg-white focus:ring-4 focus:ring-ethiopia-green/10 outline-none transition-all appearance-none"
                      required
                    >
                      <option value="" disabled>Select where to deduct from</option>
                      {budget.categories.filter(c => c.type === 'expense').map(cat => (
                        <optgroup key={cat.id} label={cat.name}>
                          {cat.items.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-5 bg-ethiopia-green text-white rounded-3xl text-lg font-bold shadow-xl shadow-green-200 hover:shadow-2xl hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    Track Birr <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        active ? "text-ethiopia-green scale-110" : "text-gray-400 hover:text-gray-600"
      )}
    >
      <div className={cn(
        "p-1 rounded-xl transition-all",
        active ? "bg-ethiopia-green/10" : ""
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-dot"
          className="w-1 h-1 bg-ethiopia-green rounded-full mt-0.5"
        />
      )}
    </button>
  );
}
