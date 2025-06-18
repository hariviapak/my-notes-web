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
  Autocomplete,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { db } from '../db/database';
import type { Transaction } from '../db/database';

interface TransactionWithId extends Transaction {
  id?: number;
  from?: string;
  to?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithId[]>([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState<TransactionWithId[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [nameOptions, setNameOptions] = useState<string[]>([]);
  const theme = useTheme();

  useEffect(() => {
    db.transactions.orderBy('date').reverse().toArray().then((txs) => {
      setTransactions(txs);
      // Collect unique names from 'from' and 'to' fields
      const names = Array.from(new Set(txs.flatMap(tx => [tx.from, tx.to]).filter(Boolean)));
      setNameOptions(names as string[]);
    });
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(transactions);
    } else {
      setFiltered(
        transactions.filter(
          (tx) =>
            tx.description.toLowerCase().includes(search.toLowerCase()) ||
            tx.category.toLowerCase().includes(search.toLowerCase()) ||
            (tx.from && tx.from.toLowerCase().includes(search.toLowerCase())) ||
            (tx.to && tx.to.toLowerCase().includes(search.toLowerCase()))
        )
      );
    }
  }, [search, transactions]);

  const getTypeColor = (type: string) => {
    if (type === 'expense') return '#e57373';
    if (type === 'income') return theme.palette.secondary.main;
    if (type === 'transfer') return '#4bb7b7';
    return '#bdbdbd';
  };

  const handleOpenDialog = (tx?: TransactionWithId) => {
    if (tx) {
      setEditId(tx.id ?? null);
      setType(tx.type);
      setAmount(String(tx.amount));
      setDescription(tx.description || '');
      setCategory(tx.category || '');
      setDate(tx.date instanceof Date ? tx.date.toISOString().slice(0, 10) : String(tx.date).slice(0, 10));
      setFrom(tx.from || '');
      setTo(tx.to || '');
    } else {
      setEditId(null);
      setType('expense');
      setAmount('');
      setDescription('');
      setCategory('');
      setDate(new Date().toISOString().slice(0, 10));
      setFrom('');
      setTo('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSave = async () => {
    const tx: TransactionWithId = {
      type,
      amount: parseFloat(amount),
      description,
      category,
      date: new Date(date),
      balance: 0,
      from,
      to,
    };
    console.log('Saving transaction:', tx);
    if (editId) {
      await db.transactions.update(editId, tx);
    } else {
      await db.transactions.add(tx);
    }
    setDialogOpen(false);
    db.transactions.orderBy('date').reverse().toArray().then((txs) => {
      console.log('Loaded transactions from DB:', txs);
      setTransactions(txs);
    });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await db.transactions.delete(deleteId);
      setDeleteId(null);
      db.transactions.orderBy('date').reverse().toArray().then((txs) => {
        setTransactions(txs);
      });
    }
  };

  const sortedTransactions = [...filtered].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  return (
    <>
      <Typography variant="h5" fontWeight={700} align="center" gutterBottom sx={{ mt: 0 }}>
        Transactions
      </Typography>
      <Box sx={{ mb: 2, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <TextField
          fullWidth
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: {
              borderRadius: 999,
              background: theme.palette.secondary.light + '10',
              px: 2,
              height: 48,
              maxWidth: 420,
            },
          }}
          sx={{ maxWidth: 420 }}
        />
      </Box>
      {sortedTransactions.length === 0 ? (
        <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 8, maxWidth: 420, mx: 'auto' }}>
          <Typography variant="h6">No transactions found</Typography>
          <Typography variant="body2">Click the + button to add your first transaction!</Typography>
        </Box>
      ) : (
        <Stack spacing={3} sx={{ width: '100%', maxWidth: 420, mx: 'auto', alignItems: 'center', mt: 0.5 }}>
          {sortedTransactions.map((tx) => {
            console.log('Rendering card:', tx);
            return (
              <Card
                key={tx.id}
                sx={{
                  borderRadius: 4,
                  background: theme.palette.secondary.light + '10',
                  boxShadow: '0 2px 16px 0 rgba(123,183,198,0.08)',
                  p: 3,
                  width: '100%',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                      size="small"
                      sx={{
                        background: tx.type === 'transfer' ? 'rgba(75,183,183,0.12)' : '#f0f4f8',
                        color: getTypeColor(tx.type),
                        fontWeight: 600,
                        borderRadius: 8,
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {tx.date instanceof Date
                        ? tx.date.toISOString().slice(0, 10)
                        : String(tx.date).slice(0, 10)}
                    </Typography>
                    <IconButton onClick={() => handleOpenDialog(tx)} size="small" color="primary">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => setDeleteId(tx.id ?? null)} size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{ color: getTypeColor(tx.type), mb: 1 }}
                  >
                    ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                  {(tx.type === 'transfer' || tx.type === 'expense') && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      From: <b>{tx.from || '-'}</b> To: <b>{tx.to || '-'}</b>
                    </Typography>
                  )}
                  {tx.type === 'income' && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Category: <b>{tx.category}</b>
                    </Typography>
                  )}
                  {tx.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>
                      Purpose: {tx.description}
                    </Typography>
                  )}
                </Box>
              </Card>
            );
          })}
        </Stack>
      )}
      <Fab
        color="secondary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value as 'expense' | 'income' | 'transfer')}
            margin="normal"
          >
            <MenuItem value="expense">Expense</MenuItem>
            <MenuItem value="income">Income</MenuItem>
            <MenuItem value="transfer">Transfer</MenuItem>
          </TextField>
          <TextField
            fullWidth
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            margin="normal"
          />
          <Autocomplete
            freeSolo
            options={nameOptions}
            value={from}
            onInputChange={(_, newValue) => setFrom(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label="From"
                margin="normal"
              />
            )}
            sx={{ mb: 2 }}
          />
          <Autocomplete
            freeSolo
            options={nameOptions}
            value={to}
            onInputChange={(_, newValue) => setTo(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label="To"
                margin="normal"
              />
            )}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!amount || !category}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Transaction?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this transaction?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 