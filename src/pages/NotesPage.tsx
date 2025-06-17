import { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { db } from '../db/database';
import type { Note } from '../db/database';
import { useTheme } from '@mui/material';

export default function NotesPage() {
  const theme = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [date, setDate] = useState<Date | null>(new Date());

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredNotes(notes);
    } else {
      setFilteredNotes(
        notes.filter(
          (note) =>
            note.title.toLowerCase().includes(search.toLowerCase()) ||
            note.content.toLowerCase().includes(search.toLowerCase()) ||
            note.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
        )
      );
    }
  }, [search, notes]);

  const loadNotes = async () => {
    setLoading(true);
    const allNotes = await db.notes.orderBy('updatedAt').reverse().toArray();
    setNotes(allNotes);
    setLoading(false);
  };

  const handleOpenEditor = (note?: Note) => {
    if (note) {
      setEditId(note.id ?? null);
      setSelectedNote(note);
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
      setTags(note.tags);
      setDate(note.date ? new Date(note.date) : new Date());
    } else {
      setEditId(null);
      setSelectedNote(null);
      setTitle('');
      setContent('');
      setCategory('');
      setTags([]);
      setDate(new Date());
    }
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setCategory('');
    setTags([]);
    setDate(new Date());
  };

  const handleSave = async () => {
    const noteData: Note = {
      title,
      content,
      category,
      tags,
      date: date || new Date(),
      createdAt: selectedNote?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    if (editId) {
      await db.notes.update(editId, noteData);
    } else {
      await db.notes.add(noteData);
    }
    handleCloseEditor();
    loadNotes();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await db.notes.delete(deleteId);
      setDeleteId(null);
      loadNotes();
    }
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  return (
    <>
      <Typography variant="h5" fontWeight={700} align="center" gutterBottom sx={{ mt: 1 }}>
        Notes
      </Typography>
      <Box sx={{ mb: 2, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <TextField
          fullWidth
          placeholder="Search notes..."
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
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <Typography>Loading...</Typography>
        </Box>
      ) : filteredNotes.length === 0 ? (
        <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 8, maxWidth: 420, mx: 'auto' }}>
          <Typography variant="h6">No notes found</Typography>
          <Typography variant="body2">Click the + button to add your first note!</Typography>
        </Box>
      ) : (
        <Stack spacing={3} sx={{ width: '100%', maxWidth: 420, mx: 'auto', alignItems: 'center', mt: 0.5 }}>
          {filteredNotes.map((note) => (
            <Card
              key={note.id}
              sx={{
                borderRadius: 4,
                background: 'linear-gradient(135deg, #e3f0ff 0%, #f3e8ff 100%)',
                boxShadow: '0 4px 24px 0 rgba(123,183,198,0.10)',
                p: 3,
                width: '100%',
                mb: 2,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {note.date ? new Date(note.date).toISOString().slice(0, 10) : ''}
                  </Typography>
                  <IconButton onClick={() => handleOpenEditor(note)} size="small" color="primary">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => setDeleteId(note.id ?? null)} size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1, color: '#7b6eea' }}>
                  {note.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {note.category}
                  {note.tags.length > 0 && (
                    <>
                      {' '}
                      {note.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </>
                  )}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                >
                  {/* Strip HTML tags for preview */}
                  {note.content.replace(/<[^>]+>/g, '').slice(0, 120)}
                  {note.content.replace(/<[^>]+>/g, '').length > 120 ? '...' : ''}
                </Typography>
              </Box>
            </Card>
          ))}
        </Stack>
      )}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}
        onClick={() => handleOpenEditor()}
      >
        <AddIcon />
      </Fab>
      <Dialog open={editorOpen} onClose={handleCloseEditor} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedNote ? 'Edit Note' : 'New Note'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            autoFocus
          />
          <TextField
            fullWidth
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            margin="normal"
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              renderInput={(params) => (
                <TextField {...params} fullWidth margin="normal" />
              )}
            />
          </LocalizationProvider>
          <Box sx={{ mt: 2, mb: 2 }}>
            <TextField
              label="Add Tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              size="small"
            />
            <Button
              variant="contained"
              onClick={handleAddTag}
              sx={{ ml: 1 }}
            >
              Add
            </Button>
          </Box>
          <Box sx={{ mt: 2 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => setTags(tags.filter((t) => t !== tag))}
                sx={{ mr: 0.5, mb: 0.5 }}
              />
            ))}
          </Box>
          <Box sx={{ mt: 2, height: 250 }}>
            <ReactQuill
              value={content}
              onChange={setContent}
              style={{ height: '200px' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditor}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!title.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Note?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this note?</Typography>
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