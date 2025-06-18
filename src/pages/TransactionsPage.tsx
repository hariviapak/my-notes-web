import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Fab,
  TextField,
  InputAdornment,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  IconButton,
  Stack,
  Menu,
  Popover,
  FormControl,
  InputLabel,
  Select,
  Autocomplete,
  Tooltip,
  Checkbox,
  TablePagination,
  ToggleButton,
  ToggleButtonGroup,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  ViewDay as ViewDayIcon,
  Category as CategoryIcon,
  FileDownload as FileDownloadIcon,
  ViewStream as ViewStreamIcon,
  CalendarToday as CalendarTodayIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { db } from '../db/database';
import type { Transaction } from '../db/database';
import type { SelectChangeEvent } from '@mui/material/Select';

interface TransactionFilters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  types: string[];
  people: string[];
  amountRange: {
    min: string;
    max: string;
  };
  categories: string[];
}

interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
  totalTransfers: number;
  averageTransaction: number;
  mostFrequentCategory: string;
  largestTransaction: number;
  thisMonthTotal: number;
  thisMonthVsLastMonth: number;
}

type GroupBy = 'none' | 'date' | 'category' | 'type';
type ViewMode = 'list' | 'card';
type SortBy = 'date' | 'amount' | 'description';
type SortOrder = 'asc' | 'desc';

type TransactionInput = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;
type NewTransactionForm = Omit<TransactionInput, 'amount'> & { amount: string };

// Utility function for Indian number formatting
function formatINR(amount: number) {
  return amount.toLocaleString('en-IN');
}

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    dateRange: {
      start: null,
      end: null,
    },
    types: [],
    people: [],
    amountRange: {
      min: '',
      max: '',
    },
    categories: [],
  });
  const [uniquePeople, setUniquePeople] = useState<string[]>([]);
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([]);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [stats, setStats] = useState<TransactionStats>({
    totalIncome: 0,
    totalExpense: 0,
    totalTransfers: 0,
    averageTransaction: 0,
    mostFrequentCategory: '',
    largestTransaction: 0,
    thisMonthTotal: 0,
    thisMonthVsLastMonth: 0,
  });
  const [showStats, setShowStats] = useState(true);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [newTransactionOpen, setNewTransactionOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkCategorizeDialogOpen, setBulkCategorizeDialogOpen] = useState(false);
  const [bulkCategory, setBulkCategory] = useState('');
  const theme = useTheme();

  const defaultTransaction: NewTransactionForm = {
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    from: '',
    to: '',
    date: new Date(),
    balance: 0,
  };
  const [newTransaction, setNewTransaction] = useState<NewTransactionForm>({ ...defaultTransaction });

  const loadTransactions = async () => {
    const loadedTransactions = await db.transactions.toArray();
    setTransactions(loadedTransactions);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    let filtered = [...transactions];

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.description?.toLowerCase().includes(searchLower) ||
        tx.from?.toLowerCase().includes(searchLower) ||
        tx.to?.toLowerCase().includes(searchLower) ||
        tx.category?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filters
    if (filters.dateRange.start) {
      filtered = filtered.filter(tx => new Date(tx.date) >= filters.dateRange.start!);
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(tx => new Date(tx.date) <= filters.dateRange.end!);
    }
    if (filters.types.length > 0) {
      filtered = filtered.filter(tx => filters.types.includes(tx.type));
    }
    if (filters.people.length > 0) {
      filtered = filtered.filter(tx => 
        (tx.from && filters.people.includes(tx.from)) ||
        (tx.to && filters.people.includes(tx.to))
      );
    }
    if (filters.amountRange.min) {
      filtered = filtered.filter(tx => tx.amount >= parseFloat(filters.amountRange.min));
    }
    if (filters.amountRange.max) {
      filtered = filtered.filter(tx => tx.amount <= parseFloat(filters.amountRange.max));
    }
    if (filters.categories.length > 0) {
      filtered = filtered.filter(tx => tx.category && filters.categories.includes(tx.category));
    }

    setFilteredTransactions(filtered);
  }, [search, filters, transactions]);

  // Calculate statistics
  useEffect(() => {
    if (transactions.length === 0) return;

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const thisMonthTxs = transactions.filter(tx => new Date(tx.date) >= thisMonth);
    const lastMonthTxs = transactions.filter(tx => 
      new Date(tx.date) >= lastMonth && new Date(tx.date) < thisMonth
    );

    const categoryCount: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;
    let totalTransfers = 0;
    let largestTx = 0;

    transactions.forEach(tx => {
      if (tx.category) {
        categoryCount[tx.category] = (categoryCount[tx.category] || 0) + 1;
      }
      if (tx.amount > largestTx) largestTx = tx.amount;
      
      switch (tx.type) {
        case 'income':
          totalIncome += tx.amount;
          break;
        case 'expense':
          totalExpense += tx.amount;
          break;
        case 'transfer':
          totalTransfers += tx.amount;
          break;
      }
    });

    const thisMonthTotal = thisMonthTxs.reduce((sum, tx) => 
      tx.type === 'expense' ? sum - tx.amount : sum + tx.amount, 0
    );
    const lastMonthTotal = lastMonthTxs.reduce((sum, tx) => 
      tx.type === 'expense' ? sum - tx.amount : sum + tx.amount, 0
    );

    const mostFrequentCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    setStats({
      totalIncome,
      totalExpense,
      totalTransfers,
      averageTransaction: transactions.reduce((sum, tx) => sum + tx.amount, 0) / transactions.length,
      mostFrequentCategory,
      largestTransaction: largestTx,
      thisMonthTotal,
      thisMonthVsLastMonth: lastMonthTotal ? 
        ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0,
    });
  }, [transactions]);

  // Sort and group transactions
  const processTransactions = (txs: Transaction[]): Transaction[] | Record<string, Transaction[]> => {
    // Apply sorting
    const sortedTransactions = [...txs].sort((a: Transaction, b: Transaction) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
          break;
        case 'amount':
          comparison = b.amount - a.amount;
          break;
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '');
          break;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    // Apply grouping
    if (groupBy !== 'none') {
      const groups: Record<string, Transaction[]> = {};
      for (const tx of sortedTransactions) {
        let key = '';
        switch (groupBy) {
          case 'date':
            key = new Date(tx.date).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            break;
          case 'category':
            key = tx.category || 'Uncategorized';
            break;
          case 'type':
            key = tx.type.charAt(0).toUpperCase() + tx.type.slice(1);
            break;
        }
        if (!groups[key]) groups[key] = [];
        groups[key].push(tx);
      }
      return groups;
    }

    return sortedTransactions;
  };

  const handleExportCSV = () => {
    const txsToExport = selectedTransactions.length > 0
      ? transactions.filter(tx => selectedTransactions.includes(tx.id!))
      : filteredTransactions;
    const headers = ['Date', 'Type', 'Amount', 'Description', 'Category', 'From', 'To'];
    const csvContent = [
      headers.join(','),
      ...txsToExport.map(tx => [
        new Date(tx.date).toISOString().split('T')[0],
        tx.type,
        tx.amount,
        `"${tx.description || ''}"`,
        tx.category || '',
        tx.from || '',
        tx.to || ''
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setFilters({
      dateRange: {
        start: null,
        end: null,
      },
      types: [],
      people: [],
      amountRange: {
        min: '',
        max: '',
      },
      categories: [],
    });
    setFilterAnchorEl(null);
  };

  const hasActiveFilters = () => {
    return filters.dateRange.start !== null ||
           filters.dateRange.end !== null ||
           filters.types.length > 0 ||
           filters.people.length > 0 ||
           filters.amountRange.min !== '' ||
           filters.amountRange.max !== '' ||
           filters.categories.length > 0;
  };

  const handleBulkDeleteClick = () => setBulkDeleteDialogOpen(true);
  const handleBulkDeleteConfirm = async () => {
    await db.transactions.bulkDelete(selectedTransactions);
    const updatedTxs = await db.transactions.toArray();
    setTransactions(updatedTxs);
    setSelectedTransactions([]);
    setBulkDeleteDialogOpen(false);
  };
  const handleBulkDeleteCancel = () => setBulkDeleteDialogOpen(false);

  const handleBulkCategorizeClick = () => setBulkCategorizeDialogOpen(true);
  const handleBulkCategorizeConfirm = async () => {
    await Promise.all(selectedTransactions.map(id => db.transactions.update(id, { category: bulkCategory })));
    await loadTransactions();
    setBulkCategorizeDialogOpen(false);
    setBulkCategory('');
    setSelectedTransactions([]);
  };
  const handleBulkCategorizeCancel = () => {
    setBulkCategorizeDialogOpen(false);
    setBulkCategory('');
  };

  const handleAddTransaction = async (transaction: TransactionInput) => {
    await db.transactions.add(transaction);
    await loadTransactions();
    setNewTransactionOpen(false);
  };

  const handleEditTransaction = async (transaction: Transaction) => {
    if (transaction.id) {
      await db.transactions.update(transaction.id, transaction);
      await loadTransactions();
      setEditingTransaction(null);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId !== null) {
      await db.transactions.delete(deleteId);
      await loadTransactions();
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  // Update the form handlers
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingTransaction) {
      setEditingTransaction({
        ...editingTransaction,
        description: e.target.value
      });
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingTransaction) {
      setEditingTransaction({
        ...editingTransaction,
        amount: Number(e.target.value)
      });
    }
  };

  const handleTypeChange = (e: SelectChangeEvent<'expense' | 'income' | 'transfer'>) => {
    if (editingTransaction) {
      const type = e.target.value as 'expense' | 'income' | 'transfer';
      setEditingTransaction({
        ...editingTransaction,
        type
      });
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (editingTransaction && date) {
      setEditingTransaction({
        ...editingTransaction,
        date
      });
    }
  };

  // Define chip color helpers
  const getTypeChipStyles = (type: string) => {
    switch (type) {
      case 'income':
        return { bgcolor: '#E3F9E5', color: '#27ae60' };
      case 'expense':
        return { bgcolor: '#FFE3E3', color: '#e74c3c' };
      case 'transfer':
        return { bgcolor: '#E3F0FF', color: '#2980b9' };
      default:
        return { bgcolor: theme.palette.grey[200], color: theme.palette.text.primary };
    }
  };
  const getCategoryChipStyles = () => ({ bgcolor: '#F3E8FF', color: '#8e44ad' });
  const getTransferChipStyles = () => ({ bgcolor: '#E3F6FF', color: '#0984e3' });

  // Add this useEffect after the existing useEffect for loadTransactions
  useEffect(() => {
    // Extract unique categories and people from transactions
    const categories = new Set<string>();
    const people = new Set<string>();
    
    transactions.forEach(tx => {
      if (tx.category) categories.add(tx.category);
      if (tx.from) people.add(tx.from);
      if (tx.to) people.add(tx.to);
    });

    setUniqueCategories(Array.from(categories).sort());
    setUniquePeople(Array.from(people).sort());
  }, [transactions]);

  // Add this before the return statement
  const processedTransactions = processTransactions(filteredTransactions);
  const paginatedTransactions = Array.isArray(processedTransactions) ?
    processedTransactions.slice(page * rowsPerPage, (page + 1) * rowsPerPage) :
    processedTransactions;

  const handleOpenNewTransaction = () => {
    setNewTransaction({ ...defaultTransaction });
    setNewTransactionOpen(true);
  };

  const handleCloseTransactionDialog = () => {
    setNewTransactionOpen(false);
    setEditingTransaction(null);
    setNewTransaction({ ...defaultTransaction });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 3 }, width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        {/* Header with Stats */}
        {showStats && (
          <Card sx={{ mb: 3, p: 3, borderRadius: 2 }}>
            <Stack direction="row" spacing={4} alignItems="center" justifyContent="space-around">
              <Box>
                <Typography variant="body2" color="text.secondary">Total Income</Typography>
                <Typography variant="h6" color="secondary.main">₹{formatINR(stats.totalIncome)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Expenses</Typography>
                <Typography variant="h6" color="error.main">₹{formatINR(stats.totalExpense)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">This Month</Typography>
                <Typography variant="h6" color={stats.thisMonthTotal >= 0 ? 'secondary.main' : 'error.main'}>
                  ₹{formatINR(Math.abs(stats.thisMonthTotal))}
                </Typography>
              </Box>
            </Stack>
          </Card>
        )}

        {/* Toolbar */}
        <Stack 
          direction="row" 
          spacing={2} 
          alignItems="center" 
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search transactions..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: 250 }}
            />
            <IconButton onClick={() => setShowStats(!showStats)}>
              {showStats ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <IconButton 
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              color={hasActiveFilters() ? "primary" : "default"}
            >
              <FilterListIcon />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="list">
                <Tooltip title="List View">
                  <ViewListIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="card">
                <Tooltip title="Card View">
                  <ViewModuleIcon />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              value={groupBy}
              exclusive
              onChange={(_, value) => value && setGroupBy(value)}
              size="small"
            >
              <ToggleButton value="none">
                <Tooltip title="No Grouping">
                  <ViewStreamIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="date">
                <Tooltip title="Group by Date">
                  <CalendarTodayIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="category">
                <Tooltip title="Group by Category">
                  <CategoryIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="type">
                <Tooltip title="Group by Type">
                  <AccountBalanceWalletIcon />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            <Button
              variant="outlined"
              onClick={(e) => setSortAnchorEl(e.currentTarget)}
              endIcon={<ArrowDropDownIcon />}
            >
              Sort
            </Button>
          </Stack>
        </Stack>

        {/* Sort Menu */}
        <Menu
          anchorEl={sortAnchorEl}
          open={Boolean(sortAnchorEl)}
          onClose={() => setSortAnchorEl(null)}
        >
          <MenuItem 
            onClick={() => {
              setSortBy('date');
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
              setSortAnchorEl(null);
            }}
          >
            Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
          </MenuItem>
          <MenuItem 
            onClick={() => {
              setSortBy('amount');
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
              setSortAnchorEl(null);
            }}
          >
            Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
          </MenuItem>
          <MenuItem 
            onClick={() => {
              setSortBy('description');
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
              setSortAnchorEl(null);
            }}
          >
            Description {sortBy === 'description' && (sortOrder === 'desc' ? '↓' : '↑')}
          </MenuItem>
        </Menu>

        {/* Bulk Actions Speed Dial */}
        {selectedTransactions.length > 0 && (
          <SpeedDial
            ariaLabel="Bulk actions"
            sx={{ position: 'fixed', bottom: 96, right: 32, zIndex: 1301 }}
            icon={<CheckCircleIcon sx={{ color: '#1976d2', fontSize: 32, background: 'white', borderRadius: '50%', boxShadow: 2 }} />}
            FabProps={{ sx: { background: 'white', boxShadow: 2, color: '#1976d2', '&:hover': { background: '#f0f4f8' } } }}
            direction="up"
          >
            <SpeedDialAction
              icon={<FilterListIcon sx={{ color: '#1976d2' }} />}
              tooltipTitle={`Delete ${selectedTransactions.length} items`}
              onClick={handleBulkDeleteClick}
              sx={{ background: 'white', boxShadow: 2, '&:hover': { background: '#f0f4f8' } }}
            />
            <SpeedDialAction
              icon={<CategoryIcon sx={{ color: '#1976d2' }} />}
              tooltipTitle="Categorize"
              onClick={handleBulkCategorizeClick}
              sx={{ background: 'white', boxShadow: 2, '&:hover': { background: '#f0f4f8' } }}
            />
            <SpeedDialAction
              icon={<FileDownloadIcon sx={{ color: '#1976d2' }} />}
              tooltipTitle="Export as CSV"
              onClick={handleExportCSV}
              sx={{ background: 'white', boxShadow: 2, '&:hover': { background: '#f0f4f8' } }}
            />
          </SpeedDial>
        )}

        {/* Filter Dialog */}
        <Popover
          open={Boolean(filterAnchorEl)}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ p: 2, width: 320 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Filters</Typography>
              
              {/* Date Range */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Date Range</Typography>
                <Stack direction="row" spacing={1}>
                  <DatePicker
                    label="Start"
                    value={filters.dateRange.start}
                    onChange={(date) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: date } }))}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                  <DatePicker
                    label="End"
                    value={filters.dateRange.end}
                    onChange={(date) => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: date } }))}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Stack>
              </Box>

              {/* Transaction Types */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Transaction Types</Typography>
                <Stack direction="row" spacing={1}>
                  {['expense', 'income', 'transfer'].map((type) => (
                    <Chip
                      key={type}
                      label={type.charAt(0).toUpperCase() + type.slice(1)}
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          types: prev.types.includes(type)
                            ? prev.types.filter(t => t !== type)
                            : [...prev.types, type]
                        }))
                      }}
                      color={filters.types.includes(type) ? 'primary' : 'default'}
                      variant={filters.types.includes(type) ? 'filled' : 'outlined'}
                      size="small"
                    />
                  ))}
                </Stack>
              </Box>

              {/* Categories */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Categories</Typography>
                <Autocomplete
                  multiple
                  options={uniqueCategories}
                  value={filters.categories}
                  onChange={(_, newValue) => setFilters(prev => ({ ...prev, categories: newValue }))}
                  renderInput={(params) => (
                    <TextField {...params} size="small" placeholder="Select categories" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                        sx={getCategoryChipStyles()}
                      />
                    ))
                  }
                />
              </Box>

              {/* People */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>People</Typography>
                <Autocomplete
                  multiple
                  options={uniquePeople}
                  value={filters.people}
                  onChange={(_, newValue) => setFilters(prev => ({ ...prev, people: newValue }))}
                  renderInput={(params) => (
                    <TextField {...params} size="small" placeholder="Select people" />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option}
                        size="small"
                        {...getTagProps({ index })}
                        sx={getTransferChipStyles()}
                      />
                    ))
                  }
                />
              </Box>

              {/* Amount Range */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>Amount Range</Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    label="Min"
                    type="number"
                    value={filters.amountRange.min}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, min: e.target.value }
                    }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                  <TextField
                    size="small"
                    label="Max"
                    type="number"
                    value={filters.amountRange.max}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      amountRange: { ...prev.amountRange, max: e.target.value }
                    }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Stack>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
                <Button onClick={clearFilters} color="inherit">
                  Clear All
                </Button>
                <Button 
                  onClick={() => setFilterAnchorEl(null)}
                  variant="contained" 
                  color="primary"
                >
                  Apply
                </Button>
              </Box>
            </Stack>
          </Box>
        </Popover>

        {/* Active Filter Chips */}
        {hasActiveFilters() && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {filters.dateRange.start && (
                <Chip
                  label={`From: ${filters.dateRange.start.toLocaleDateString()}`}
                  onDelete={() => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: null } }))}
                  size="small"
                />
              )}
              {filters.dateRange.end && (
                <Chip
                  label={`To: ${filters.dateRange.end.toLocaleDateString()}`}
                  onDelete={() => setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: null } }))}
                  size="small"
                />
              )}
              {filters.types.map(type => (
                <Chip
                  key={type}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  onDelete={() => setFilters(prev => ({ ...prev, types: prev.types.filter(t => t !== type) }))}
                  size="small"
                  sx={getTypeChipStyles(type)}
                />
              ))}
              {filters.categories.map(category => (
                <Chip
                  key={category}
                  label={category}
                  onDelete={() => setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== category) }))}
                  size="small"
                  sx={getCategoryChipStyles()}
                />
              ))}
              {filters.people.map(person => (
                <Chip
                  key={person}
                  label={person}
                  onDelete={() => setFilters(prev => ({ ...prev, people: prev.people.filter(p => p !== person) }))}
                  size="small"
                  sx={getTransferChipStyles()}
                />
              ))}
              {filters.amountRange.min && (
                <Chip
                  label={`Min: ₹${filters.amountRange.min}`}
                  onDelete={() => setFilters(prev => ({ ...prev, amountRange: { ...prev.amountRange, min: '' } }))}
                  size="small"
                />
              )}
              {filters.amountRange.max && (
                <Chip
                  label={`Max: ₹${filters.amountRange.max}`}
                  onDelete={() => setFilters(prev => ({ ...prev, amountRange: { ...prev.amountRange, max: '' } }))}
                  size="small"
                />
              )}
            </Stack>
          </Box>
        )}

        {/* Add Transaction FAB */}
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 32, right: 32 }}
          onClick={handleOpenNewTransaction}
        >
          <AddIcon />
        </Fab>

        {/* Transaction Form Dialog */}
        <Dialog 
          open={newTransactionOpen || !!editingTransaction} 
          onClose={handleCloseTransactionDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={editingTransaction ? editingTransaction.type : newTransaction.type}
                  onChange={editingTransaction ? handleTypeChange : (e) => setNewTransaction((t) => ({ ...t, type: e.target.value as 'expense' | 'income' | 'transfer' }))}
                  label="Type"
                >
                  <MenuItem value="expense">Expense</MenuItem>
                  <MenuItem value="income">Income</MenuItem>
                  <MenuItem value="transfer">Transfer</MenuItem>
                </Select>
              </FormControl>
              <Autocomplete
                freeSolo
                options={uniqueCategories}
                value={editingTransaction ? editingTransaction.category : newTransaction.category}
                onInputChange={editingTransaction ? (e, value) => setEditingTransaction(prev => prev ? { ...prev, category: value } : null) : (e, value) => setNewTransaction(t => ({ ...t, category: value }))}
                onChange={(e, value) => {
                  if (editingTransaction) {
                    setEditingTransaction(prev => prev ? { ...prev, category: value || '' } : null);
                  } else {
                    setNewTransaction(t => ({ ...t, category: value || '' }));
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} fullWidth label="Category" />
                )}
              />
              {((editingTransaction ? editingTransaction.type : newTransaction.type) === 'expense' || (editingTransaction ? editingTransaction.type : newTransaction.type) === 'transfer') && (
                <Autocomplete
                  freeSolo
                  options={uniquePeople}
                  value={editingTransaction ? editingTransaction.from : newTransaction.from}
                  onInputChange={editingTransaction ? (e, value) => setEditingTransaction(prev => prev ? { ...prev, from: value } : null) : (e, value) => setNewTransaction(t => ({ ...t, from: value }))}
                  onChange={(e, value) => {
                    if (editingTransaction) {
                      setEditingTransaction(prev => prev ? { ...prev, from: value || '' } : null);
                    } else {
                      setNewTransaction(t => ({ ...t, from: value || '' }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth label="From" />
                  )}
                />
              )}
              {((editingTransaction ? editingTransaction.type : newTransaction.type) === 'expense' || (editingTransaction ? editingTransaction.type : newTransaction.type) === 'transfer' || (editingTransaction ? editingTransaction.type : newTransaction.type) === 'income') && (
                <Autocomplete
                  freeSolo
                  options={uniquePeople}
                  value={editingTransaction ? editingTransaction.to : newTransaction.to}
                  onInputChange={editingTransaction ? (e, value) => setEditingTransaction(prev => prev ? { ...prev, to: value } : null) : (e, value) => setNewTransaction(t => ({ ...t, to: value }))}
                  onChange={(e, value) => {
                    if (editingTransaction) {
                      setEditingTransaction(prev => prev ? { ...prev, to: value || '' } : null);
                    } else {
                      setNewTransaction(t => ({ ...t, to: value || '' }));
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth label="To" />
                  )}
                />
              )}
              <TextField
                fullWidth
                label="Description"
                value={editingTransaction ? editingTransaction.description : newTransaction.description}
                onChange={editingTransaction ? handleDescriptionChange : (e) => setNewTransaction(t => ({ ...t, description: e.target.value }))}
                autoFocus
              />
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={editingTransaction ? String(editingTransaction.amount) : newTransaction.amount}
                onChange={editingTransaction ? handleAmountChange : (e) => setNewTransaction((t) => ({ ...t, amount: e.target.value }))}
                inputProps={{ min: 0 }}
              />
              <DatePicker
                label="Date"
                value={editingTransaction ? (editingTransaction.date ? new Date(editingTransaction.date) : null) : (newTransaction.date ? new Date(newTransaction.date) : null)}
                onChange={editingTransaction ? handleDateChange : (date) => date && setNewTransaction((t) => ({ ...t, date }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTransactionDialog}>Cancel</Button>
            <Button variant="contained" onClick={() => {
              if (editingTransaction) {
                handleEditTransaction({
                  ...editingTransaction,
                  amount: Number(editingTransaction.amount),
                  balance: editingTransaction.type === 'income' ? Number(editingTransaction.amount) : -Number(editingTransaction.amount),
                });
              } else {
                handleAddTransaction({
                  description: newTransaction.description,
                  amount: Number(newTransaction.amount),
                  type: newTransaction.type,
                  category: newTransaction.category,
                  from: newTransaction.from,
                  to: newTransaction.to,
                  date: newTransaction.date,
                  balance: newTransaction.type === 'income' ? Number(newTransaction.amount) : -Number(newTransaction.amount),
                });
              }
            }} disabled={!newTransaction.amount || Number(newTransaction.amount) <= 0}>{editingTransaction ? 'Save' : 'Add'}</Button>
          </DialogActions>
        </Dialog>

        {/* Transaction List */}
        {filteredTransactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 8 }}>
            <Typography variant="h6">No transactions found</Typography>
            <Typography variant="body2">Try adjusting your search or filters</Typography>
          </Box>
        ) : (
          groupBy === 'none' ? (
            Array.isArray(paginatedTransactions) ? (
              viewMode === 'list' ? (
                <Stack spacing={2} sx={{ width: '100%', boxSizing: 'border-box' }}>
                  {paginatedTransactions.map((tx: Transaction) => (
                    <Card key={tx.id} sx={{ borderRadius: 2, background: theme.palette.background.paper, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.05)', p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Checkbox
                          checked={selectedTransactions.includes(tx.id || -1)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTransactions([...selectedTransactions, tx.id || -1]);
                            } else {
                              setSelectedTransactions(selectedTransactions.filter(id => id !== tx.id));
                            }
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
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
                              <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                                {tx.description}
                              </Typography>
                              {(tx.from || tx.to) && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {tx.from && tx.to ? `${tx.from} → ${tx.to}` : tx.from ? `From: ${tx.from}` : `To: ${tx.to}`}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  color:
                                    tx.type === 'income'
                                      ? theme.palette.success.main
                                      : tx.type === 'expense'
                                      ? theme.palette.error.main
                                      : theme.palette.info.main,
                                }}
                              >
                                ₹{formatINR(tx.amount)}
                              </Typography>
                              <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => setEditingTransaction(tx)}
                                  sx={{ color: theme.palette.primary.main }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(tx.id!)}
                                  sx={{ color: theme.palette.error.main }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 1 }}>
                                <Chip
                                  label={tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                  size="small"
                                  sx={getTypeChipStyles(tx.type)}
                                />
                                {tx.category ? (
                                  <Chip
                                    label={tx.category}
                                    size="small"
                                    sx={getCategoryChipStyles()}
                                  />
                                ) : null}
                              </Stack>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Grid container spacing={2} sx={{ width: '100%', margin: 0 }}>
                  {paginatedTransactions.map((tx: Transaction) => (
                    <Grid item xs={12} sm={6} md={4} key={tx.id} sx={{ display: 'flex', width: '100%' }}>
                      <Card sx={{
                        borderRadius: 2,
                        background: theme.palette.background.paper,
                        boxShadow: '0 2px 16px 0 rgba(0,0,0,0.05)',
                        p: { xs: 2, sm: 3 },
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: 140,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Checkbox
                            checked={selectedTransactions.includes(tx.id || -1)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTransactions([...selectedTransactions, tx.id || -1]);
                              } else {
                                setSelectedTransactions(selectedTransactions.filter(id => id !== tx.id));
                              }
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
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
                                <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                                  {tx.description}
                                </Typography>
                                {(tx.from || tx.to) && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {tx.from && tx.to ? `${tx.from} → ${tx.to}` : tx.from ? `From: ${tx.from}` : `To: ${tx.to}`}
                                  </Typography>
                                )}
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color:
                                      tx.type === 'income'
                                        ? theme.palette.success.main
                                        : tx.type === 'expense'
                                        ? theme.palette.error.main
                                        : theme.palette.info.main,
                                  }}
                                >
                                  ₹{formatINR(tx.amount)}
                                </Typography>
                                <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => setEditingTransaction(tx)}
                                    sx={{ color: theme.palette.primary.main }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteClick(tx.id!)}
                                    sx={{ color: theme.palette.error.main }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 1 }}>
                                  <Chip
                                    label={tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                    size="small"
                                    sx={getTypeChipStyles(tx.type)}
                                  />
                                  {tx.category ? (
                                    <Chip
                                      label={tx.category}
                                      size="small"
                                      sx={getCategoryChipStyles()}
                                    />
                                  ) : null}
                                </Stack>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )
            ) : null
          ) : (
            !Array.isArray(paginatedTransactions) ? (
              Object.entries(paginatedTransactions).map(([group, transactions]) => (
                <Box key={group} sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>{group}</Typography>
                  {viewMode === 'list' ? (
                    <Stack spacing={2} sx={{ width: '100%', boxSizing: 'border-box' }}>
                      {transactions.map((tx: Transaction) => (
                        <Card key={tx.id} sx={{ borderRadius: 2, background: theme.palette.background.paper, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.05)', p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Checkbox
                              checked={selectedTransactions.includes(tx.id || -1)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTransactions([...selectedTransactions, tx.id || -1]);
                                } else {
                                  setSelectedTransactions(selectedTransactions.filter(id => id !== tx.id));
                                }
                              }}
                            />
                            <Box sx={{ flex: 1 }}>
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
                                  <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                                    {tx.description}
                                  </Typography>
                                  {(tx.from || tx.to) && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                      {tx.from && tx.to ? `${tx.from} → ${tx.to}` : tx.from ? `From: ${tx.from}` : `To: ${tx.to}`}
                                    </Typography>
                                  )}
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      color:
                                        tx.type === 'income'
                                          ? theme.palette.success.main
                                          : tx.type === 'expense'
                                          ? theme.palette.error.main
                                          : theme.palette.info.main,
                                    }}
                                  >
                                    ₹{formatINR(tx.amount)}
                                  </Typography>
                                  <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => setEditingTransaction(tx)}
                                      sx={{ color: theme.palette.primary.main }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteClick(tx.id!)}
                                      sx={{ color: theme.palette.error.main }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Stack>
                                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 1 }}>
                                    <Chip
                                      label={tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                      size="small"
                                      sx={getTypeChipStyles(tx.type)}
                                    />
                                    {tx.category ? (
                                      <Chip
                                        label={tx.category}
                                        size="small"
                                        sx={getCategoryChipStyles()}
                                      />
                                    ) : null}
                                  </Stack>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    <Grid container spacing={2} sx={{ width: '100%', margin: 0 }}>
                      {transactions.map((tx: Transaction) => (
                        <Grid item xs={12} sm={6} md={4} key={tx.id} sx={{ display: 'flex', width: '100%' }}>
                          <Card sx={{
                            borderRadius: 2,
                            background: theme.palette.background.paper,
                            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.05)',
                            p: { xs: 2, sm: 3 },
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: 140,
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              <Checkbox
                                checked={selectedTransactions.includes(tx.id || -1)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTransactions([...selectedTransactions, tx.id || -1]);
                                  } else {
                                    setSelectedTransactions(selectedTransactions.filter(id => id !== tx.id));
                                  }
                                }}
                              />
                              <Box sx={{ flex: 1 }}>
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
                                    <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                                      {tx.description}
                                    </Typography>
                                    {(tx.from || tx.to) && (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        {tx.from && tx.to ? `${tx.from} → ${tx.to}` : tx.from ? `From: ${tx.from}` : `To: ${tx.to}`}
                                      </Typography>
                                    )}
                                  </Box>
                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography
                                      variant="h6"
                                      sx={{
                                        color:
                                          tx.type === 'income'
                                            ? theme.palette.success.main
                                            : tx.type === 'expense'
                                            ? theme.palette.error.main
                                            : theme.palette.info.main,
                                      }}
                                    >
                                      ₹{formatINR(tx.amount)}
                                    </Typography>
                                    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
                                      <IconButton
                                        size="small"
                                        onClick={() => setEditingTransaction(tx)}
                                        sx={{ color: theme.palette.primary.main }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteClick(tx.id!)}
                                        sx={{ color: theme.palette.error.main }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 1 }}>
                                      <Chip
                                        label={tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                        size="small"
                                        sx={getTypeChipStyles(tx.type)}
                                      />
                                      {tx.category ? (
                                        <Chip
                                          label={tx.category}
                                          size="small"
                                          sx={getCategoryChipStyles()}
                                        />
                                      ) : null}
                                    </Stack>
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              ))
            ) : null
          )
        )}

        {/* Delete Transaction Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
          <DialogTitle>Delete Transaction</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this transaction?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Delete Dialog */}
        <Dialog open={bulkDeleteDialogOpen} onClose={handleBulkDeleteCancel}>
          <DialogTitle>Delete Selected Transactions</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete {selectedTransactions.length} selected transactions?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleBulkDeleteCancel}>Cancel</Button>
            <Button onClick={handleBulkDeleteConfirm} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Categorize Dialog */}
        <Dialog open={bulkCategorizeDialogOpen} onClose={handleBulkCategorizeCancel}>
          <DialogTitle>Categorize Transactions</DialogTitle>
          <DialogContent>
            <Autocomplete
              freeSolo
              options={uniqueCategories}
              value={bulkCategory}
              onInputChange={(e, value) => setBulkCategory(value)}
              onChange={(e, value) => setBulkCategory(value || '')}
              renderInput={(params) => (
                <TextField {...params} fullWidth label="Category" autoFocus />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleBulkCategorizeCancel}>Cancel</Button>
            <Button onClick={handleBulkCategorizeConfirm} variant="contained" disabled={!bulkCategory}>
              Apply
            </Button>
          </DialogActions>
        </Dialog>

        {filteredTransactions.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <TablePagination
              component="div"
              count={filteredTransactions.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[25, 50, 100]}
            />
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default TransactionsPage; 