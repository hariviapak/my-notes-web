import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from '@mui/material';
import { db } from '../db/database';
import isEqual from 'lodash/isEqual';

export default function SettingsPage() {
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const handleExport = async () => {
    try {
      const notes = await db.notes.toArray();
      const transactions = await db.transactions.toArray();
      const categories = await db.categories.toArray();

      const data = {
        notes,
        transactions,
        categories,
        exportDate: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage('Backup exported successfully!');
      setShowMessage(true);
    } catch (error) {
      setMessage('Error exporting backup');
      setShowMessage(true);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate data structure
      if (!data.notes || !data.transactions || !data.categories) {
        throw new Error('Invalid backup file format');
      }

      // Merge logic for notes (by createdAt, keep latest updatedAt)
      const existingNotes = await db.notes.toArray();
      const notesByCreatedAt = new Map(existingNotes.map(n => [new Date(n.createdAt).getTime(), n]));
      for (const note of data.notes) {
        const createdAtKey = new Date(note.createdAt).getTime();
        const existing = notesByCreatedAt.get(createdAtKey);
        if (existing) {
          if (new Date(note.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
            await db.notes.update(existing.id!, note);
          }
        } else {
          await db.notes.add(note);
        }
      }

      // Merge logic for transactions (by composite key)
      const existingTxs = await db.transactions.toArray();
      function txKey(tx: any) {
        return [tx.amount, new Date(tx.date).getTime(), tx.type, tx.from, tx.to, tx.category].join('|');
      }
      const txKeys = new Set(existingTxs.map(txKey));
      for (const tx of data.transactions) {
        if (!txKeys.has(txKey(tx))) {
          await db.transactions.add(tx);
        }
      }

      // Merge logic for categories (by id, as before)
      const existingCats = await db.categories.toArray();
      const catMap = new Map(existingCats.map(c => [c.id, c]));
      for (const cat of data.categories) {
        if (cat.id && catMap.has(cat.id)) {
          // If different, update
          if (!isEqual(catMap.get(cat.id), cat)) {
            await db.categories.update(cat.id, cat);
          }
        } else {
          await db.categories.add(cat);
        }
      }

      setMessage('Backup imported and merged successfully!');
      setShowMessage(true);
    } catch (error) {
      setMessage('Error importing backup');
      setShowMessage(true);
    }
  };

  const handleClearTransactions = async () => {
    await db.transactions.clear();
    setClearDialogOpen(false);
    setMessage('All transactions cleared!');
    setShowMessage(true);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Backup & Restore
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', sm: 'center' }, mt: 2 }}
          >
            <Button
              variant="contained"
              onClick={handleExport}
            >
              Export Backup
            </Button>
            <Button
              variant="outlined"
              component="label"
            >
              Import Backup
              <input
                type="file"
                hidden
                accept=".json"
                onChange={handleImport}
              />
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setClearDialogOpen(true)}
            >
              Clear All Transactions
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Snackbar
        open={showMessage}
        autoHideDuration={6000}
        onClose={() => setShowMessage(false)}
      >
        <Alert
          onClose={() => setShowMessage(false)}
          severity={message.includes('Error') ? 'error' : 'success'}
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
      <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
        <DialogTitle>Clear All Transactions?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete all transactions? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleClearTransactions}>
            Clear
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 