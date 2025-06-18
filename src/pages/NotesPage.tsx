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
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Switch,
  FormControlLabel,
  Divider,
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
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import CloseIcon from '@mui/icons-material/Close';

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
  const [viewNote, setViewNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [groupByDate, setGroupByDate] = useState(true);

  // Responsive state for view and grouping
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 600;
  const effectiveViewMode = isSmallScreen ? 'list' : viewMode;
  const effectiveGroupByDate = isSmallScreen ? true : groupByDate;

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

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    const dateA = new Date(a.date || a.createdAt).getTime();
    const dateB = new Date(b.date || b.createdAt).getTime();
    return dateB - dateA;
  });

  function formatNoteDate(date: Date | string | undefined) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  // Group notes by actual date string
  function groupNotesByDateString(notes: Note[]) {
    const groups: Record<string, Note[]> = {};
    notes.forEach(note => {
      const noteDate = new Date(note.date || note.createdAt);
      const group = noteDate.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
      if (!groups[group]) groups[group] = [];
      groups[group].push(note);
    });
    return groups;
  }

  const groupedNotes = groupNotesByDateString(sortedNotes);

  return (
    <>
      <Box sx={{
        maxWidth: 1200,
        mx: 'auto',
        p: { xs: 1, sm: 2 },
        width: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        minHeight: '100vh',
        background: theme.palette.background.default,
      }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'center', gap: 2 }}>
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
            sx={{ maxWidth: 420, mx: 'auto' }}
          />
          {/* Only show toggles on sm and up */}
          {!isSmallScreen && (
            <>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, val) => val && setViewMode(val)}
                sx={{ height: 48 }}
              >
                <ToggleButton value="list" aria-label="List view"><ViewListIcon /></ToggleButton>
                <ToggleButton value="grid" aria-label="Grid view"><ViewModuleIcon /></ToggleButton>
              </ToggleButtonGroup>
              <FormControlLabel
                control={<Switch checked={groupByDate} onChange={(_, checked) => setGroupByDate(checked)} />}
                label="Group by Date"
                sx={{ ml: 2 }}
              />
            </>
          )}
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : sortedNotes.length === 0 ? (
          <Box sx={{ textAlign: 'center', color: 'text.secondary', mt: 8, maxWidth: 420, mx: 'auto' }}>
            <Typography variant="h6">No notes found</Typography>
            <Typography variant="body2">Click the + button to add your first note!</Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mt: 0.5 }}>
            {effectiveGroupByDate ? (
              Object.entries(groupedNotes).map(([group, notes]) => (
                <Box key={group} sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, mt: 4, pl: { xs: 0.5, sm: 0 }, pr: { xs: 0.5, sm: 0 } }}>{group}</Typography>
                  {effectiveViewMode === 'list' ? (
                    <Stack spacing={2} sx={{ width: '100%', boxSizing: 'border-box' }}>
                      {notes.map((note) => (
                        <Card key={note.id} sx={{
                          borderRadius: 3,
                          background: theme.palette.background.paper,
                          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)',
                          p: { xs: 2.5, sm: 3 },
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: 140,
                          boxSizing: 'border-box',
                          overflow: 'hidden',
                          m: 0,
                          cursor: 'pointer',
                        }} onClick={() => setViewNote(note)}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: 0.2 }}>
                              {formatNoteDate(note.date)}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <IconButton onClick={e => { e.stopPropagation(); handleOpenEditor(note); }} size="small" color="inherit" sx={{ p: 0.5 }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton onClick={e => { e.stopPropagation(); setDeleteId(note.id ?? null); }} size="small" color="inherit" sx={{ p: 0.5 }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                          <Typography variant="h6" fontWeight={700} sx={{ mb: 1.2, color: theme.palette.text.primary, fontSize: { xs: '1.1rem', sm: '1.25rem' }, lineHeight: 1.3 }}>
                            {note.title}
                          </Typography>
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 1.2,
                              fontSize: { xs: '0.98rem', sm: '1.05rem' },
                              lineHeight: 1.7,
                              whiteSpace: 'pre-line',
                            }}
                          >
                            {note.content.replace(/<[^>]+>/g, '').slice(0, 180)}
                            {note.content.replace(/<[^>]+>/g, '').length > 180 ? '...' : ''}
                          </Typography>
                          {note.category && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                              {note.category}
                            </Typography>
                          )}
                          {note.tags.length > 0 && (
                            <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {note.tags.map((tag) => (
                                <Chip
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  sx={{ bgcolor: theme.palette.grey[100], color: theme.palette.text.secondary, fontSize: '0.75rem', height: 22, borderRadius: 1 }}
                                />
                              ))}
                            </Box>
                          )}
                        </Card>
                      ))}
                    </Stack>
                  ) : (
                    <Grid container spacing={3} sx={{ width: '100%', margin: 0, px: { xs: 1, sm: 0 } }}>
                      {notes.map((note) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={note.id} sx={{ display: 'flex' }}>
                          <Card sx={{
                            borderRadius: 3,
                            background: theme.palette.background.paper,
                            boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)',
                            p: { xs: 2.5, sm: 3 },
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 140,
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            m: 0,
                            cursor: 'pointer',
                          }} onClick={() => setViewNote(note)}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: 0.2 }}>
                                {formatNoteDate(note.date)}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <IconButton onClick={e => { e.stopPropagation(); handleOpenEditor(note); }} size="small" color="inherit" sx={{ p: 0.5 }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton onClick={e => { e.stopPropagation(); setDeleteId(note.id ?? null); }} size="small" color="inherit" sx={{ p: 0.5 }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.2, color: theme.palette.text.primary, fontSize: { xs: '1.1rem', sm: '1.25rem' }, lineHeight: 1.3 }}>
                              {note.title}
                            </Typography>
                            <Typography
                              variant="body1"
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                mb: 1.2,
                                fontSize: { xs: '0.98rem', sm: '1.05rem' },
                                lineHeight: 1.7,
                                whiteSpace: 'pre-line',
                              }}
                            >
                              {note.content.replace(/<[^>]+>/g, '').slice(0, 180)}
                              {note.content.replace(/<[^>]+>/g, '').length > 180 ? '...' : ''}
                            </Typography>
                            {note.category && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                                {note.category}
                              </Typography>
                            )}
                            {note.tags.length > 0 && (
                              <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {note.tags.map((tag) => (
                                  <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    sx={{ bgcolor: theme.palette.grey[100], color: theme.palette.text.secondary, fontSize: '0.75rem', height: 22, borderRadius: 1 }}
                                  />
                                ))}
                              </Box>
                            )}
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              ))
            ) : (
              effectiveViewMode === 'list' ? (
                <Stack spacing={2} sx={{ width: '100%', boxSizing: 'border-box' }}>
                  {sortedNotes.map((note) => (
                    <Card key={note.id} sx={{
                      borderRadius: 3,
                      background: theme.palette.background.paper,
                      boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)',
                      p: { xs: 2.5, sm: 3 },
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: 140,
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      m: 0,
                      cursor: 'pointer',
                    }} onClick={() => setViewNote(note)}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: 0.2 }}>
                          {formatNoteDate(note.date)}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton onClick={e => { e.stopPropagation(); handleOpenEditor(note); }} size="small" color="inherit" sx={{ p: 0.5 }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton onClick={e => { e.stopPropagation(); setDeleteId(note.id ?? null); }} size="small" color="inherit" sx={{ p: 0.5 }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.2, color: theme.palette.text.primary, fontSize: { xs: '1.1rem', sm: '1.25rem' }, lineHeight: 1.3 }}>
                        {note.title}
                      </Typography>
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 1.2,
                          fontSize: { xs: '0.98rem', sm: '1.05rem' },
                          lineHeight: 1.7,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {note.content.replace(/<[^>]+>/g, '').slice(0, 180)}
                        {note.content.replace(/<[^>]+>/g, '').length > 180 ? '...' : ''}
                      </Typography>
                      {note.category && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                          {note.category}
                        </Typography>
                      )}
                      {note.tags.length > 0 && (
                        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {note.tags.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{ bgcolor: theme.palette.grey[100], color: theme.palette.text.secondary, fontSize: '0.75rem', height: 22, borderRadius: 1 }}
                            />
                          ))}
                        </Box>
                      )}
                    </Card>
                  ))}
                </Stack>
              ) : (
                <Grid container spacing={3} sx={{ width: '100%', margin: 0 }}>
                  {sortedNotes.map((note) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={note.id} sx={{ display: 'flex' }}>
                      <Card sx={{
                        borderRadius: 3,
                        background: theme.palette.background.paper,
                        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.06)',
                        p: { xs: 2.5, sm: 3 },
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 140,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        m: 0,
                        cursor: 'pointer',
                      }} onClick={() => setViewNote(note)}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: 0.2 }}>
                            {formatNoteDate(note.date)}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconButton onClick={e => { e.stopPropagation(); handleOpenEditor(note); }} size="small" color="inherit" sx={{ p: 0.5 }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton onClick={e => { e.stopPropagation(); setDeleteId(note.id ?? null); }} size="small" color="inherit" sx={{ p: 0.5 }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 1.2, color: theme.palette.text.primary, fontSize: { xs: '1.1rem', sm: '1.25rem' }, lineHeight: 1.3 }}>
                          {note.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 1.2,
                            fontSize: { xs: '0.98rem', sm: '1.05rem' },
                            lineHeight: 1.7,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {note.content.replace(/<[^>]+>/g, '').slice(0, 180)}
                          {note.content.replace(/<[^>]+>/g, '').length > 180 ? '...' : ''}
                        </Typography>
                        {note.category && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 500 }}>
                            {note.category}
                          </Typography>
                        )}
                        {note.tags.length > 0 && (
                          <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {note.tags.map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                sx={{ bgcolor: theme.palette.grey[100], color: theme.palette.text.secondary, fontSize: '0.75rem', height: 22, borderRadius: 1 }}
                              />
                            ))}
                          </Box>
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )
            )}
          </Box>
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
                slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
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
        <Dialog open={!!viewNote} onClose={() => setViewNote(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5 }}>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
                {viewNote?.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: 0.2 }}>
                {viewNote ? formatNoteDate(viewNote.date) : ''}
              </Typography>
              {viewNote && Array.isArray(viewNote.tags) && viewNote.tags.length > 0 && (
                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {viewNote.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{ bgcolor: theme.palette.grey[100], color: theme.palette.text.secondary, fontSize: '0.75rem', height: 22, borderRadius: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Box>
            <IconButton onClick={() => setViewNote(null)} size="small" sx={{ ml: 2 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 1.5, pb: 2, px: { xs: 2, sm: 3 } }}>
            {viewNote?.category && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 500 }}>
                {viewNote.category}
              </Typography>
            )}
            <Box sx={{
              color: 'text.primary',
              fontSize: { xs: '1.05rem', sm: '1.13rem' },
              lineHeight: 1.8,
              wordBreak: 'break-word',
              minHeight: 80,
              '& p': { margin: 0, marginBottom: 1 },
            }}
              dangerouslySetInnerHTML={{ __html: viewNote?.content || '' }}
            />
          </DialogContent>
        </Dialog>
      </Box>
    </>
  );
} 