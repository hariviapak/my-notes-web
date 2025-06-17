import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Drawer,
  Chip,
} from '@mui/material';
import { db } from '../db/database';
import type { Transaction } from '../db/database';

interface LedgerEntry {
  name: string;
  sent: number;
  received: number;
  balance: number;
}

function groupByPerson(transactions: Transaction[], mode: 'transfers' | 'all'): LedgerEntry[] {
  const ledger: Record<string, LedgerEntry> = {};
  transactions.forEach((tx) => {
    if (mode === 'transfers') {
      if (tx.type === 'transfer') {
        if (tx.from) {
          if (!ledger[tx.from]) ledger[tx.from] = { name: tx.from, sent: 0, received: 0, balance: 0 };
          ledger[tx.from].sent += tx.amount;
          ledger[tx.from].balance -= tx.amount;
        }
        if (tx.to) {
          if (!ledger[tx.to]) ledger[tx.to] = { name: tx.to, sent: 0, received: 0, balance: 0 };
          ledger[tx.to].received += tx.amount;
          ledger[tx.to].balance += tx.amount;
        }
      }
    } else {
      // 'all' mode: include transfers and expenses
      if (tx.type === 'transfer') {
        if (tx.from) {
          if (!ledger[tx.from]) ledger[tx.from] = { name: tx.from, sent: 0, received: 0, balance: 0 };
          ledger[tx.from].sent += tx.amount;
          ledger[tx.from].balance -= tx.amount;
        }
        if (tx.to) {
          if (!ledger[tx.to]) ledger[tx.to] = { name: tx.to, sent: 0, received: 0, balance: 0 };
          ledger[tx.to].received += tx.amount;
          ledger[tx.to].balance += tx.amount;
        }
      } else if (tx.type === 'expense') {
        if (tx.from) {
          if (!ledger[tx.from]) ledger[tx.from] = { name: tx.from, sent: 0, received: 0, balance: 0 };
          ledger[tx.from].sent += tx.amount;
          ledger[tx.from].balance -= tx.amount;
        }
      }
    }
  });
  return Object.values(ledger);
}

export default function LedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tab, setTab] = useState<'transfers' | 'all'>('transfers');
  const theme = useTheme();

  useEffect(() => {
    db.transactions.toArray().then((txs) => {
      setTransactions(txs);
      setEntries(groupByPerson(txs, tab));
    });
  }, [tab]);

  const handleCardClick = (entry: LedgerEntry) => {
    setSelectedEntry(entry);
    setDrawerOpen(true);
  };

  const handleTabChange = (_: any, newValue: string) => {
    setTab(newValue as 'transfers' | 'all');
  };

  const relatedTransactions = selectedEntry
    ? transactions.filter((tx) => {
        if (tab === 'transfers') {
          return tx.type === 'transfer' && (tx.from === selectedEntry.name || tx.to === selectedEntry.name);
        } else {
          return (tx.type === 'transfer' || tx.type === 'expense') && (tx.from === selectedEntry.name || tx.to === selectedEntry.name);
        }
      })
      // Sort: first by 'to' (asc), then by 'date' (desc)
      .sort((a, b) => {
        const toA = (a.to || '').toLowerCase();
        const toB = (b.to || '').toLowerCase();
        if (toA < toB) return -1;
        if (toA > toB) return 1;
        // If 'to' is the same, sort by date descending
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      })
    : [];

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, mb: 8 }}>
      <Typography variant="h5" fontWeight={700} align="center" gutterBottom sx={{ mt: 1 }}>
        Ledger
      </Typography>
      <Tabs
        value={tab}
        onChange={handleTabChange}
        centered
        sx={{ mb: 1 }}
        textColor="secondary"
        indicatorColor="secondary"
      >
        <Tab label="Transfers" value="transfers" />
        <Tab label="All" value="all" />
      </Tabs>
      <Grid container spacing={3}>
        {entries.length === 0 ? (
          <Grid item xs={12}>
            <Typography align="center" color="text.secondary" sx={{ mt: 8 }}>
              No ledger entries found. Add some transactions!
            </Typography>
          </Grid>
        ) : (
          entries.map((entry) => (
            <Grid item xs={12} key={entry.name}>
              <Card
                sx={{
                  borderRadius: 4,
                  background: theme.palette.secondary.light + '10',
                  boxShadow: '0 2px 16px 0 rgba(123,183,198,0.08)',
                  p: 1,
                  cursor: 'pointer',
                }}
                onClick={() => handleCardClick(entry)}
              >
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                    {entry.name}
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Sent
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{ color: entry.sent > 0 ? '#e57373' : '#bdbdbd' }}
                      >
                        ₹{entry.sent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Received
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{ color: entry.received > 0 ? theme.palette.secondary.main : '#bdbdbd' }}
                      >
                        ₹{entry.received.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Balance
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                      color:
                        entry.balance > 0
                          ? theme.palette.secondary.main
                          : entry.balance < 0
                          ? '#e57373'
                          : '#bdbdbd',
                    }}
                  >
                    {entry.balance < 0 ? '-' : ''}₹{Math.abs(entry.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
      {/* Drawer for related transactions */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 400 }, p: 2 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Transactions for {selectedEntry?.name}
          </Typography>
          {relatedTransactions.length === 0 ? (
            <Typography>No related transactions found.</Typography>
          ) : (
            relatedTransactions.map((tx) => (
              <Card key={tx.id} sx={{ mb: 2, p: 2, borderRadius: 2, background: theme.palette.background.paper }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip
                    label={tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    size="small"
                    sx={{
                      background: tx.type === 'transfer' ? 'rgba(75,183,183,0.12)' : (tx.type === 'expense' ? '#ffe0e0' : theme.palette.secondary.light),
                      color: tx.type === 'transfer' ? '#4bb7b7' : (tx.type === 'expense' ? '#e57373' : theme.palette.secondary.main),
                      fontWeight: 600,
                      borderRadius: 8,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {tx.date instanceof Date ? tx.date.toISOString().slice(0, 10) : String(tx.date).slice(0, 10)}
                  </Typography>
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body2">
                  From: <b>{tx.from}</b> To: <b>{tx.to || '-'}</b>
                </Typography>
                {tx.description && (
                  <Typography variant="body2" color="text.secondary">
                    {tx.description}
                  </Typography>
                )}
              </Card>
            ))
          )}
          <Button fullWidth variant="outlined" sx={{ mt: 2 }} onClick={() => setDrawerOpen(false)}>
            Close
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
} 