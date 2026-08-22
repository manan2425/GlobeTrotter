'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, PieChart as PieIcon, BarChart2, Plus, AlertTriangle, ArrowLeft, Trash2 } from 'lucide-react';
import { apiRequest } from '../../../../lib/api';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Button } from '../../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';

export default function BudgetDashboardPage() {
  const params = useParams();
  const tripId = params.id as string;

  const [budgetData, setBudgetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Expense Logger Modal Form State
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [paidBy, setPaidBy] = useState('Manan Patel');
  const [paymentMethod, setPaymentMethod] = useState('Card');

  useEffect(() => {
    fetchBudget();
  }, [tripId]);

  const fetchBudget = async () => {
    try {
      const data = await apiRequest<any>(`/trips/${tripId}/budget`);
      setBudgetData(data);
    } catch (err: any) {
      toast.error('Failed to load budget analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expId: string) => {
    if (!confirm('Are you sure you want to delete this expense entry?')) return;
    try {
      await apiRequest(`/expenses/${expId}`, { method: 'DELETE' });
      toast.success('Expense deleted');
      fetchBudget();
    } catch (err: any) {
      toast.error('Failed to delete expense');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid expense amount');
      return;
    }

    try {
      await apiRequest(`/trips/${tripId}/expenses`, {
        method: 'POST',
        body: JSON.stringify({
          category,
          amount: Number(amount),
          date,
          description,
          paid_by_name: paidBy,
          payment_method: paymentMethod
        })
      });
      toast.success('Actual expense recorded!');
      setShowAddExpense(false);
      setAmount('');
      setDescription('');
      fetchBudget();
    } catch (err: any) {
      toast.error(err.message || 'Failed to log expense');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs animate-pulse">Loading Budget Analytics & Expense Tracker...</div>;
  }

  if (!budgetData) return null;

  const COLORS = ['#0284c7', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#64748b'];

  const categoryPieData = Object.entries(budgetData.category_breakdown || {}).map(([key, value]) => ({
    name: key,
    value: Number(value)
  })).filter(item => item.value > 0);

  const cityBarData = (budgetData.city_breakdown || []).map((cb: any) => ({
    name: cb.city_name,
    Cost: cb.estimated_cost
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <Link href={`/trips/${tripId}`} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Itinerary
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" /> Budget & Expense Dashboard
          </h1>
          <p className="text-xs text-slate-500">Track planned costs, actual spending, category breakdowns, and smart savings</p>
        </div>

        <Button onClick={() => setShowAddExpense(true)} variant="default" size="default" className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-md">
          <Plus className="w-4 h-4" /> Record Actual Expense
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
          <div className="text-slate-500 text-xs font-semibold">Total Planned Target</div>
          <div className="text-2xl font-extrabold text-slate-900">₹{budgetData.planned_budget?.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">Target limit</div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
          <div className="text-slate-500 text-xs font-semibold">Total Estimated Cost</div>
          <div className="text-2xl font-extrabold text-sky-600">₹{budgetData.total_estimated_cost?.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">Sum of stays & activities</div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
          <div className="text-slate-500 text-xs font-semibold">Actual Spent So Far</div>
          <div className="text-2xl font-extrabold text-amber-600">₹{budgetData.actual_spent_total?.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">Logged receipts</div>
        </Card>

        <Card className="p-5 border-slate-200 shadow-sm bg-white space-y-1">
          <div className="text-slate-500 text-xs font-semibold">Remaining Budget</div>
          <div className={`text-2xl font-extrabold ${budgetData.remaining_budget >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            ₹{budgetData.remaining_budget?.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500">Daily Avg: ₹{budgetData.daily_average?.toLocaleString()}</div>
        </Card>
      </div>

      {/* Smart Budget Alerts Banner */}
      <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" /> Smart Budget Insights & Alerts
        </h3>
        <div className="space-y-2">
          {budgetData.alerts?.map((alert: string, idx: number) => (
            <div
              key={idx}
              className={`p-3 rounded-xl text-xs font-semibold border flex items-center gap-2.5 ${
                alert.startsWith('⚠️')
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : alert.startsWith('💡')
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <span>{alert}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Analytics Charts Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pie Chart: Category Breakdown */}
        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-sky-500" /> Category Expenses Breakdown
          </h3>
          <div className="h-64 w-full">
            {categoryPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No category breakdown data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Bar Chart: Cost per City */}
        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-600" /> Estimated Cost per Destination City
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityBarData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
                <Bar dataKey="Cost" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* Actual Expenses Logger Table */}
      <Card className="bg-white border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Logged Actual Expenses</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-200">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Category</th>
                <th className="p-3">Description</th>
                <th className="p-3">Paid By</th>
                <th className="p-3">Method</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {budgetData.actual_expenses?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">No actual expenses logged yet. Click 'Record Actual Expense' above!</td>
                </tr>
              ) : (
                budgetData.actual_expenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 text-slate-500">{exp.date}</td>
                    <td className="p-3 font-bold text-sky-600">{exp.category}</td>
                    <td className="p-3">{exp.description || '-'}</td>
                    <td className="p-3 text-slate-500">{exp.paid_by_name}</td>
                    <td className="p-3 text-slate-500">{exp.payment_method}</td>
                    <td className="p-3 text-right font-extrabold text-amber-600">₹{exp.amount?.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Record Actual Expense</h3>
            
            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none font-medium"
                >
                  <option value="Food">Food & Dining</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Activities">Activities & Tickets</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 1500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1 font-medium">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Dinner at rooftop cafe"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-medium">Paid By</label>
                  <input
                    type="text"
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1 font-medium">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 outline-none font-medium"
                  >
                    <option value="Card">Credit/Debit Card</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowAddExpense(false)} variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Save Expense
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
