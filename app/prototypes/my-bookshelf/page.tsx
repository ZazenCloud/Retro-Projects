'use client';

import { useEffect, useState } from 'react';
import styles from './bookshelf.module.css';
import './bookshelf.global.css';
import { Instrument_Sans } from 'next/font/google';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Initialize the Instrument Sans font
const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  coverImage: string | null;
  rating: number | null;
  review: string | null;
}

type Tab = 'books' | 'trends';

// Custom colors for the charts
const COLORS = ['#2c3e50', '#95a5a6', '#3498db', '#e74c3c', '#9b59b6', '#f1c40f', '#1abc9c', '#e67e22'];

export default function MyBookshelfPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('books');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        // Fetch books from our server-side API route
        const response = await fetch('/api/books');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch books');
        }
        
        const data = await response.json();
        setBooks(data.books);
        
        // Extract unique genres from books
        const uniqueGenres = Array.from(new Set(data.books.map((book: Book) => book.genre).filter(Boolean))) as string[];
        setGenres(uniqueGenres);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch books from Notion. Check console for details and ensure your database is shared with the integration.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Generate star rating display
  const renderStars = (rating: number) => {
    if (rating === 5) return '★★★★★';
    if (rating === 4) return '★★★★☆';
    if (rating === 3) return '★★★☆☆';
    if (rating === 2) return '★★☆☆☆';
    if (rating === 1) return '★☆☆☆☆';
    return '☆☆☆☆☆';
  };

  // Filter books based on selected genre
  const filteredBooks = selectedGenre 
    ? books.filter(book => book.genre === selectedGenre) 
    : books;

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(selectedGenre === genre ? null : genre);
  };

  // Generate data for genre chart
  const genreChartData = genres.map(genre => {
    const count = books.filter(book => book.genre === genre).length;
    return { name: genre, value: count };
  }).sort((a, b) => b.value - a.value); // Sort by count descending

  // Generate data for rating chart
  const ratingChartData = [
    { name: '5 Stars', count: books.filter(book => book.rating === 5).length },
    { name: '4 Stars', count: books.filter(book => book.rating === 4).length },
    { name: '3 Stars', count: books.filter(book => book.rating === 3).length },
    { name: '2 Stars', count: books.filter(book => book.rating === 2).length },
    { name: '1 Star', count: books.filter(book => book.rating === 1).length },
    { name: 'Unrated', count: books.filter(book => book.rating === null).length }
  ].filter(item => item.count > 0); // Only show ratings that have books

  if (loading) {
    return <div className={styles.loading}>Loading your bookshelf...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={`${styles.container} ${instrumentSans.className} ${activeTab === 'trends' ? styles.noScroll : ''}`}>
      {/* Animated background layer */}
      <div className={styles.animatedBg} aria-hidden="true" />
      
      <header className={styles.header}>
        <h1 className={styles.title}>My bookshelf</h1>
        <div className={styles.tabsContainer}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'books' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('books')}
          >
            Books
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'trends' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            Trends
          </button>
        </div>
      </header>

      {activeTab === 'books' && (
        <>
          <div className={styles.bookCount}>{filteredBooks.length} books {selectedGenre ? `in ${selectedGenre}` : ''}</div>
          
          {/* Genre filters */}
          <div className={styles.genreFilters}>
            <button 
              className={`${styles.genreButton} ${selectedGenre === null ? styles.active : ''}`}
              onClick={() => setSelectedGenre(null)}
            >
              All Genres
            </button>
            {genres.map(genre => (
              <button 
                key={genre} 
                className={`${styles.genreButton} ${selectedGenre === genre ? styles.active : ''}`}
                onClick={() => handleGenreSelect(genre)}
              >
                {genre}
              </button>
            ))}
          </div>

          {filteredBooks.length === 0 && !loading && (
            <div className={styles.emptyState}>
              {selectedGenre 
                ? `No books found in the "${selectedGenre}" genre.` 
                : 'No books found. Make sure your Notion database is populated and shared correctly with the integration.'}
            </div>
          )}

          <div className={styles.grid}>
            {filteredBooks.map((book) => (
              <div key={book.id} className={styles.bookCard}>
                {/* Genre accent bar */}
                <div className={styles.genreBar} />
                <div className={styles.coverContainer}>
                  {book.coverImage ? (
                    <img 
                      src={book.coverImage} 
                      alt={`Cover of ${book.title}`} 
                      className={styles.coverImage}
                    />
                  ) : (
                    <div className={styles.noCover}>
                      <span role="img" aria-label="book">📚</span>
                    </div>
                  )}
                </div>
                <h2 className={styles.bookTitle}>{book.title}</h2>
                <p className={styles.bookAuthor}>{book.author}</p>
                
                <div className={styles.rating}>
                  <span className={styles.stars}>{book.rating !== null ? renderStars(book.rating) : ''}</span>
                </div>
                
                {book.review && (
                  <p className={styles.reviewText}>
                    <span>{book.review}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'trends' && (
        <div className={styles.trendsContainer}>
          <h2 className={styles.trendsTitle}>Reading Insights</h2>
          
          <div className={`${styles.chartContainer} ${styles.pieChartContainer}`}>
            <h3 className={styles.chartTitle}>Books by Genre</h3>
            {genreChartData.length > 0 ? (
              <div className={styles.pieChartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genreChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genreChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} books`, 'Count']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={styles.noChartData}>No genre data available</div>
            )}
          </div>
          
          <div className={`${styles.chartContainer} ${styles.barChartContainer}`}>
            <h3 className={styles.chartTitle}>Books by Rating</h3>
            {ratingChartData.length > 0 ? (
              <div className={styles.barChartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Number of Books" fill="#2c3e50" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={styles.noChartData}>No rating data available</div>
            )}
          </div>
        </div>
      )}
      
      {/* Floating Action Button */}
      <button className={styles.fab} title="Add Book">
        +
      </button>
    </div>
  );
} 