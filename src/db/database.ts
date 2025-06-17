import Dexie from 'dexie';

export interface Note {
  id?: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  linkedTransactions?: number[];
  date?: Date;
}

export interface Transaction {
  id?: number;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  description: string;
  category: string;
  date: Date;
  linkedNoteId?: number;
  balance: number;
  from?: string;
  to?: string;
}

export interface Category {
  id?: number;
  name: string;
  type: 'note' | 'transaction';
  color: string;
}

export class NotesDatabase extends Dexie {
  notes!: Dexie.Table<Note, number>;
  transactions!: Dexie.Table<Transaction, number>;
  categories!: Dexie.Table<Category, number>;

  constructor() {
    super('NotesDatabase');
    
    this.version(2).stores({
      notes: '++id, title, category, tags, createdAt, updatedAt',
      transactions: '++id, type, category, date, balance, from, to',
      categories: '++id, name, type'
    });
  }
}

export const db = new NotesDatabase(); 