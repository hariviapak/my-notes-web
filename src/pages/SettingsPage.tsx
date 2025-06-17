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

      // Merge logic for notes
      const existingNotes = await db.notes.toArray();
      const notesMap = new Map(existingNotes.map(n => [n.id, n]));
      for (const note of data.notes) {
        if (note.id && notesMap.has(note.id)) {
          if (!isEqual(notesMap.get(note.id), note)) {
            // Add as new (remove id)
            const { id, ...rest } = note;
            await db.notes.add(rest);
          }
          // else: skip (identical)
        } else {
          await db.notes.add(note);
        }
      }

      // Merge logic for transactions
      const existingTxs = await db.transactions.toArray();
      const txMap = new Map(existingTxs.map(t => [t.id, t]));
      for (const tx of data.transactions) {
        if (tx.id && txMap.has(tx.id)) {
          if (!isEqual(txMap.get(tx.id), tx)) {
            const { id, ...rest } = tx;
            await db.transactions.add(rest);
          }
        } else {
          await db.transactions.add(tx);
        }
      }

      // Merge logic for categories
      const existingCats = await db.categories.toArray();
      const catMap = new Map(existingCats.map(c => [c.id, c]));
      for (const cat of data.categories) {
        if (cat.id && catMap.has(cat.id)) {
          if (!isEqual(catMap.get(cat.id), cat)) {
            const { id, ...rest } = cat;
            await db.categories.add(rest);
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
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleExport}
              sx={{ mr: 2 }}
            >
              Export Backup
            </Button>
            <Button
              variant="outlined"
              component="label"
              sx={{ mr: 2 }}
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
          </Box>
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