import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
  Chip,
  Stack,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tab,
  Tabs,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CompareArrows as CompareArrowsIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Note as NoteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { db } from '../db/database';
import type { Transaction } from '../db/database';
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardStats {
  totalExpenses: number;
  totalIncome: number;
  totalTransfers: number;
  recentTransactions: Transaction[];
  monthlyTotals: {
    month: string;
    expenses: number;
    income: number;
  }[];
  expensesByCategory: {
    category: string;
    amount: number;
  }[];
  topPeople: {
    name: string;
    amount: number;
    type: 'sent' | 'received';
  }[];
  insights: {
    type: 'info' | 'warning' | 'success';
    message: string;
  }[];
}

interface MoneyOwed {
  name: string;
  amount: number;
  type: 'owes' | 'owed';
}

interface PersonDetails {
  name: string;
  transactions: Transaction[];
  sent: number;
  received: number;
  balance: number;
  moneyOwed: MoneyOwed[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    totalIncome: 0,
    totalTransfers: 0,
    recentTransactions: [],
    monthlyTotals: [],
    expensesByCategory: [],
    topPeople: [],
    insights: [],
  });
  const [selectedPerson, setSelectedPerson] = useState<PersonDetails | null>(null);
  const [personDialogTab, setPersonDialogTab] = useState(0);
  const theme = useTheme();

  useEffect(() => {
    const calculateStats = async () => {
      const transactions = await db.transactions.toArray();
      
      // Calculate totals
      let totalExpenses = 0;
      let totalIncome = 0;
      let totalTransfers = 0;
      const categoryTotals: Record<string, number> = {};
      const peopleTotals: Record<string, { sent: number; received: number }> = {};

      transactions.forEach(tx => {
        if (tx.type === 'expense') {
          totalExpenses += tx.amount;
          if (tx.category) {
            categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
          }
        } else if (tx.type === 'income') {
          totalIncome += tx.amount;
        } else if (tx.type === 'transfer') {
          totalTransfers += tx.amount;
          // Track sent/received amounts for people
          if (tx.from) {
            peopleTotals[tx.from] = peopleTotals[tx.from] || { sent: 0, received: 0 };
            peopleTotals[tx.from].sent += tx.amount;
          }
          if (tx.to) {
            peopleTotals[tx.to] = peopleTotals[tx.to] || { sent: 0, received: 0 };
            peopleTotals[tx.to].received += tx.amount;
          }
        }
      });

      // Calculate monthly totals (last 6 months)
      const monthlyData: Record<string, { expenses: number; income: number }> = {};
      const now = new Date();
      for (let i = 0; i < 6; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = month.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyData[monthKey] = { expenses: 0, income: 0 };
      }

      transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        const monthKey = txDate.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (monthlyData[monthKey]) {
          if (tx.type === 'expense') {
            monthlyData[monthKey].expenses += tx.amount;
          } else if (tx.type === 'income') {
            monthlyData[monthKey].income += tx.amount;
          }
        }
      });

      // Get top people by transaction volume
      const topPeople = Object.entries(peopleTotals)
        .map(([name, { sent, received }]) => {
          const netAmount = received - sent;
          return {
            name,
            amount: Math.abs(netAmount),
            type: netAmount > 0 ? 'received' as const : 'sent' as const
          };
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      // Calculate insights
      const insights: { type: 'info' | 'warning' | 'success'; message: string }[] = [];
      
      // Monthly spending trend
      const lastTwoMonths = Object.entries(monthlyData).slice(0, 2);
      if (lastTwoMonths.length === 2) {
        const [currentMonth, lastMonth] = lastTwoMonths;
        const spendingChange = ((currentMonth[1].expenses - lastMonth[1].expenses) / lastMonth[1].expenses) * 100;
        if (spendingChange > 20) {
          insights.push({
            type: 'warning',
            message: `Your spending this month is ${spendingChange.toFixed(1)}% higher than last month`
          });
        } else if (spendingChange < -20) {
          insights.push({
            type: 'success',
            message: `Great job! You've reduced spending by ${Math.abs(spendingChange).toFixed(1)}% compared to last month`
          });
        }
      }

      // Income vs Expenses
      const currentMonthData = monthlyData[Object.keys(monthlyData)[0]];
      if (currentMonthData) {
        const savingsRate = ((currentMonthData.income - currentMonthData.expenses) / currentMonthData.income) * 100;
        if (savingsRate > 0) {
          insights.push({
            type: 'success',
            message: `You're saving ${savingsRate.toFixed(1)}% of your income this month`
          });
        } else if (savingsRate < -20) {
          insights.push({
            type: 'warning',
            message: `Your expenses exceed your income by ${Math.abs(savingsRate).toFixed(1)}% this month`
          });
        }
      }

      // Category spending insights
      const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a);
      
      if (sortedCategories.length > 0) {
        const topCategory = sortedCategories[0];
        const categoryPercentage = (topCategory[1] / totalExpenses) * 100;
        if (categoryPercentage > 40) {
          insights.push({
            type: 'info',
            message: `${topCategory[0]} is your highest expense category (${categoryPercentage.toFixed(1)}% of total expenses)`
          });
        }
      }

      setStats({
        totalExpenses,
        totalIncome,
        totalTransfers,
        recentTransactions: transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5),
        monthlyTotals: Object.entries(monthlyData)
          .map(([month, data]) => ({
            month,
            expenses: data.expenses,
            income: data.income,
          }))
          .reverse(),
        expensesByCategory: Object.entries(categoryTotals)
          .map(([category, amount]) => ({
            category,
            amount,
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5),
        topPeople,
        insights,
      });
    };

    calculateStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
  };

  const handlePersonClick = async (personName: string) => {
    const transactions = await db.transactions.toArray();
    const personTransactions = transactions.filter(
      tx => tx.from === personName || tx.to === personName
    );

    let sent = 0;
    let received = 0;
    
    // Track money owed per person
    const owedMap = new Map<string, number>();
    
    personTransactions.forEach(tx => {
      if (tx.from === personName) {
        sent += tx.amount;
        // When person sends money, they are owed by the recipient
        const currentOwed = owedMap.get(tx.to || '') || 0;
        owedMap.set(tx.to || '', currentOwed + tx.amount);
      }
      if (tx.to === personName) {
        received += tx.amount;
        // When person receives money, they owe the sender
        const currentOwed = owedMap.get(tx.from || '') || 0;
        owedMap.set(tx.from || '', currentOwed - tx.amount);
      }
    });

    // Convert owed map to array of MoneyOwed objects
    const moneyOwed: MoneyOwed[] = Array.from(owedMap.entries())
      .filter(([name, amount]) => name && amount !== 0)
      .map(([name, amount]) => ({
        name,
        amount: Math.abs(amount),
        type: amount > 0 ? 'owes' as const : 'owed' as const
      }))
      .sort((a, b) => b.amount - a.amount);

    setSelectedPerson({
      name: personName,
      transactions: personTransactions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
      sent,
      received,
      balance: received - sent,
      moneyOwed
    });
  };

  const handleCloseDialog = () => {
    setSelectedPerson(null);
    setPersonDialogTab(0);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ background: theme.palette.secondary.light + '10', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingDownIcon sx={{ color: '#e57373', mr: 1 }} />
                <Typography variant="h6">Total Expenses</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#e57373' }}>
                {formatCurrency(stats.totalExpenses)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ background: theme.palette.secondary.light + '10', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ color: theme.palette.secondary.main, mr: 1 }} />
                <Typography variant="h6">Total Income</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: theme.palette.secondary.main }}>
                {formatCurrency(stats.totalIncome)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ background: theme.palette.secondary.light + '10', borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CompareArrowsIcon sx={{ color: '#4bb7b7', mr: 1 }} />
                <Typography variant="h6">Total Transfers</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: '#4bb7b7' }}>
                {formatCurrency(stats.totalTransfers)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Financial Insights */}
      {stats.insights.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Financial Insights
          </Typography>
          <Grid container spacing={2}>
            {stats.insights.map((insight, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card 
                  sx={{ 
                    background: 
                      insight.type === 'warning' ? '#fff3e0' :
                      insight.type === 'success' ? '#e8f5e9' :
                      '#e3f2fd',
                    borderRadius: 2,
                  }}
                >
                  <CardContent>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 
                          insight.type === 'warning' ? '#f57c00' :
                          insight.type === 'success' ? '#2e7d32' :
                          '#1976d2',
                      }}
                    >
                      {insight.message}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Charts and Lists */}
      <Grid container spacing={3}>
        {/* Monthly Trends */}
        <Grid item xs={12} md={8}>
          <Card sx={{ background: theme.palette.secondary.light + '10', borderRadius: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>Monthly Trends</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyTotals}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="expenses" stroke="#e57373" name="Expenses" />
                  <Line type="monotone" dataKey="income" stroke={theme.palette.secondary.main} name="Income" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Expense Categories */}
        <Grid item xs={12} md={4}>
          <Card sx={{ background: theme.palette.secondary.light + '10', borderRadius: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>Top Expense Categories</Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.expensesByCategory}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.expensesByCategory.map((entry, index) => (
                      <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>

        {/* Top People */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: theme.palette.secondary.light + '10', borderRadius: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>Top People</Typography>
            <Stack spacing={2}>
              {stats.topPeople.map((person) => (
                <Box 
                  key={person.name} 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                    }
                  }}
                  onClick={() => handlePersonClick(person.name)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>{person.name}</Typography>
                    <Typography sx={{ 
                      color: person.type === 'received' ? theme.palette.secondary.main : '#e57373'
                    }}>
                      {formatCurrency(person.amount)}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(person.amount / Math.max(...stats.topPeople.map(p => p.amount))) * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: theme.palette.secondary.light + '20',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: person.type === 'received' ? theme.palette.secondary.main : '#e57373',
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>

        {/* Person Details Dialog */}
        <Dialog
          open={selectedPerson !== null}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          {selectedPerson && (
            <>
              <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{selectedPerson.name}'s Transactions</Typography>
                <IconButton onClick={handleCloseDialog} size="small">
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ background: '#e8f5e9', borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Received</Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.secondary.main }}>
                          {formatCurrency(selectedPerson.received)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ background: '#ffebee', borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Sent</Typography>
                        <Typography variant="h6" sx={{ color: '#e57373' }}>
                          {formatCurrency(selectedPerson.sent)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ 
                      background: selectedPerson.balance >= 0 ? '#e8f5e9' : '#ffebee',
                      borderRadius: 2 
                    }}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary">Balance</Typography>
                        <Typography variant="h6" sx={{ 
                          color: selectedPerson.balance >= 0 ? theme.palette.secondary.main : '#e57373'
                        }}>
                          {formatCurrency(Math.abs(selectedPerson.balance))}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Main Content Grid */}
                <Grid container spacing={3}>
                  {/* Money Owed Section - Left Side */}
                  {selectedPerson.moneyOwed.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <Box sx={{ position: 'sticky', top: 0 }}>
                        <Typography variant="h6" gutterBottom>Money Owed</Typography>
                        <Stack spacing={2}>
                          {selectedPerson.moneyOwed.map((owed) => (
                            <Card key={owed.name} sx={{ 
                              background: owed.type === 'owes' ? '#e8f5e9' : '#ffebee',
                              borderRadius: 2 
                            }}>
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body1">{owed.name}</Typography>
                                  <Typography 
                                    variant="h6" 
                                    sx={{ 
                                      color: owed.type === 'owes' ? theme.palette.secondary.main : '#e57373'
                                    }}
                                  >
                                    {formatCurrency(owed.amount)}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                  {owed.type === 'owes' ? 'Owes money' : 'Owed money'}
                                </Typography>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      </Box>
                    </Grid>
                  )}

                  {/* Transactions Section - Right Side */}
                  <Grid item xs={12} md={selectedPerson.moneyOwed.length > 0 ? 8 : 12}>
                    <Tabs 
                      value={personDialogTab} 
                      onChange={(_, newValue) => setPersonDialogTab(newValue)}
                      sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                    >
                      <Tab label="All Transactions" />
                      <Tab label="Money Received" />
                      <Tab label="Money Sent" />
                    </Tabs>

                    <Stack spacing={2}>
                      {selectedPerson.transactions
                        .filter(tx => {
                          if (personDialogTab === 1) return tx.to === selectedPerson.name;
                          if (personDialogTab === 2) return tx.from === selectedPerson.name;
                          return true;
                        })
                        .map((tx) => (
                          <Card key={tx.id} sx={{ 
                            background: theme.palette.background.paper,
                            borderRadius: 2,
                          }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {new Date(tx.date).toLocaleDateString(undefined, {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </Typography>
                                  <Typography variant="body1" sx={{ mt: 1 }}>
                                    {tx.description}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {tx.from === selectedPerson.name ? 
                                      `Sent to ${tx.to}` : 
                                      `Received from ${tx.from}`}
                                  </Typography>
                                </Box>
                                <Typography variant="h6" sx={{ 
                                  color: tx.to === selectedPerson.name ? 
                                    theme.palette.secondary.main : '#e57373'
                                }}>
                                  {formatCurrency(tx.amount)}
                                </Typography>
                              </Box>
                              <Chip
                                label={tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                size="small"
                                sx={{
                                  background: tx.type === 'transfer' ? 'rgba(75,183,183,0.12)' : 
                                            tx.type === 'expense' ? '#ffe0e0' : 
                                            theme.palette.secondary.light,
                                  color: tx.type === 'transfer' ? '#4bb7b7' : 
                                        tx.type === 'expense' ? '#e57373' : 
                                        theme.palette.secondary.main,
                                  fontWeight: 600,
                                  borderRadius: 8,
                                }}
                              />
                            </CardContent>
                          </Card>
                        ))
                      }
                    </Stack>
                  </Grid>
                </Grid>
              </DialogContent>
            </>
          )}
        </Dialog>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Card sx={{ background: theme.palette.secondary.light + '10', borderRadius: 2, p: 2 }}>
            <Typography variant="h6" gutterBottom>Recent Transactions</Typography>
            <Stack spacing={2}>
              {stats.recentTransactions.map((tx) => (
                <Box key={tx.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      {tx.type === 'transfer' ? `${tx.from} → ${tx.to}` : tx.description}
                    </Typography>
                    <Chip
                      label={tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      size="small"
                      sx={{
                        background: tx.type === 'transfer' ? 'rgba(75,183,183,0.12)' : 
                                  tx.type === 'expense' ? '#ffe0e0' : 
                                  theme.palette.secondary.light,
                        color: tx.type === 'transfer' ? '#4bb7b7' : 
                               tx.type === 'expense' ? '#e57373' : 
                               theme.palette.secondary.main,
                        fontWeight: 600,
                        borderRadius: 8,
                      }}
                    />
                  </Box>
                  <Typography sx={{
                    color: tx.type === 'income' ? theme.palette.secondary.main :
                           tx.type === 'expense' ? '#e57373' :
                           '#4bb7b7'
                  }}>
                    {formatCurrency(tx.amount)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 