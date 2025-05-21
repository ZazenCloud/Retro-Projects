'use client';

import { useEffect, useState } from 'react';
import styles from './bookshelf.module.css';
import './bookshelf.global.css';
import { Instrument_Sans } from 'next/font/google';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

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
  isDeleting?: boolean;
}

interface BookFormData {
  title: string;
  author: string;
  genre: string;
  rating: number | null;
  review: string;
  coverImageUrl: string;
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGenreValue, setNewGenreValue] = useState('');
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    genre: '',
    rating: null,
    review: '',
    coverImageUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? (value ? Number(value) : null) : value
    }));

    // If this is the new genre input field, update the newGenreValue state
    if (name === 'newGenre') {
      setNewGenreValue(value);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use the newGenreValue if New Genre was selected
    const finalFormData = {
      ...formData,
      genre: formData.genre === 'New Genre' ? newGenreValue : formData.genre
    };
    
    try {
      setIsSubmitting(true);
      setSubmitMessage(null);
      
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFormData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add book');
      }
      
      // Reset form data
      setFormData({
        title: '',
        author: '',
        genre: '',
        rating: null,
        review: '',
        coverImageUrl: '',
      });
      
      setSubmitMessage({
        text: 'Book added successfully!',
        type: 'success'
      });
      
      // Refresh books list
      await fetchBooks();
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowAddModal(false);
        setSubmitMessage(null);
      }, 1500);
      
    } catch (err: any) {
      console.error(err);
      setSubmitMessage({
        text: err.message || 'Failed to add book',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDeleteMode = () => {
    setDeleteMode(prev => !prev);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      
      // Get reference to the book being deleted for animation
      const bookToDelete = books.find(book => book.id === bookId);
      if (!bookToDelete) return;
      
      // Create a copy of books and mark the selected one for deletion animation
      const updatedBooks = books.map(book => 
        book.id === bookId ? { ...book, isDeleting: true } : book
      );
      setBooks(updatedBooks);
      
      // Wait for animation to complete before API call and state update
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/books?id=${bookId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete book');
          }
          
          // Update the books list by filtering out the deleted book
          setBooks(prev => {
            const newBooks = prev.filter(book => book.id !== bookId);
            
            // Extract unique genres from remaining books
            const updatedGenres = Array.from(new Set(newBooks.map(book => book.genre).filter(Boolean))) as string[];
            
            // Update the genres state
            setGenres(updatedGenres);
            
            // If the selected genre no longer has books, reset the selection
            const deletedBookGenre = bookToDelete.genre;
            if (selectedGenre === deletedBookGenre) {
              const genreStillExists = newBooks.some(book => book.genre === deletedBookGenre);
              if (!genreStillExists) {
                setSelectedGenre(null);
              }
            }
            
            return newBooks;
          });
        } catch (err: any) {
          console.error('Error deleting book:', err);
          alert(`Failed to delete book: ${err.message}`);
          
          // Reset the deletion flag if there was an error
          setBooks(prev => prev.map(book => 
            book.id === bookId ? { ...book, isDeleting: false } : book
          ));
        } finally {
          setIsDeleting(false);
        }
      }, 600); // Match this to the animation duration
      
    } catch (err: any) {
      console.error('Error initiating delete:', err);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        {/* Animated background layer - always visible */}
        <div className={styles.animatedBg} aria-hidden="true" />
        <div className={styles.loading}>
          <div className={styles.loadingText}>
            Loading your bookshelf...
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {/* Animated background layer - always visible */}
        <div className={styles.animatedBg} aria-hidden="true" />
        <div className={styles.error}>Error: {error}</div>
      </>
    );
  }

  return (
    <>
      {/* Animated background layer - always visible */}
      <div className={styles.animatedBg} aria-hidden="true" />
      
      <div className={`${styles.container} ${instrumentSans.className} ${activeTab === 'trends' as Tab ? styles.noScroll : ''}`}>
        {/* Back to Home button */}
        <Link href="/" className={styles.backButton}>
          <span>←</span>
        </Link>
        
        <header className={styles.header}>
          <h1 className={styles.title}>My bookshelf</h1>
          <div className={styles.tabsContainer}>
            <button 
              className={`${styles.tabButton} ${activeTab === ('books' as Tab) ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('books')}
            >
              Books
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === ('trends' as Tab) ? styles.activeTab : ''}`}
              onClick={() => {
                setActiveTab('trends');
                // Exit delete mode when switching to Trends
                if (deleteMode) {
                  setDeleteMode(false);
                }
              }}
            >
              Trends
            </button>
          </div>
        </header>

        {activeTab === ('books' as Tab) && (
          <>
            <div className={styles.booksHeader}>
              <div className={styles.bookCount}>
                {filteredBooks.length} books {selectedGenre ? 
                  <>in <span className={styles.genreBold}>{selectedGenre}</span></> 
                  : ''}
              </div>
            </div>
            
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
              {filteredBooks.map((book, index) => (
                <div 
                  key={book.id} 
                  className={`${styles.bookCard} 
                    ${deleteMode ? styles.tremblingCard : ''} 
                    ${book.isDeleting ? styles.deletingCard : ''}`}
                  style={{ '--card-index': index } as React.CSSProperties}
                >
                  {deleteMode && (
                    <button 
                      className={styles.deleteX} 
                      onClick={() => handleDeleteBook(book.id)}
                      disabled={isDeleting || book.isDeleting}
                    >
                      ✕
                    </button>
                  )}
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

        {activeTab === ('trends' as Tab) && (
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
        
        {/* Floating action buttons - only show in Books tab */}
        {activeTab === ('books' as Tab) && (
          <div className={styles.fabContainer}>
            <button 
              className={`${styles.deleteButton} ${deleteMode ? styles.active : ''}`}
              onClick={toggleDeleteMode}
              title={deleteMode ? "Exit Delete Mode" : "Delete Books"}
            >
              {deleteMode ? "✓" : "−"}
            </button>
            
            <button 
              className={styles.fab} 
              title="Add Book"
              onClick={() => setShowAddModal(true)}
            >
              +
            </button>
          </div>
        )}

        {/* Add Book Modal */}
        {showAddModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <button 
                className={styles.modalCloseButton} 
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
              <h2 className={styles.modalTitle}>Add New Book</h2>
              
              <form onSubmit={handleAddBook} className={styles.bookForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="title">Title*</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Book title"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="author">Author</label>
                  <input
                    type="text"
                    id="author"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    placeholder="Author name"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="genre">Genre</label>
                  <select
                    id="genre"
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a genre</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                    <option value="New Genre">+ Add new genre</option>
                  </select>
                  
                  {formData.genre === 'New Genre' && (
                    <input
                      type="text"
                      name="newGenre"
                      value={newGenreValue}
                      onChange={handleInputChange}
                      placeholder="Enter new genre name"
                      className={styles.additionalInput}
                    />
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="rating">Rating</label>
                  <select
                    id="rating"
                    name="rating"
                    value={formData.rating === null ? '' : formData.rating}
                    onChange={handleInputChange}
                  >
                    <option value="">Select a rating</option>
                    <option value="5">★★★★★ (5 stars)</option>
                    <option value="4">★★★★☆ (4 stars)</option>
                    <option value="3">★★★☆☆ (3 stars)</option>
                    <option value="2">★★☆☆☆ (2 stars)</option>
                    <option value="1">★☆☆☆☆ (1 star)</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="review">Review</label>
                  <textarea
                    id="review"
                    name="review"
                    value={formData.review}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Write your review here"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="coverImageUrl">Cover Image URL</label>
                  <input
                    type="url"
                    id="coverImageUrl"
                    name="coverImageUrl"
                    value={formData.coverImageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/book-cover.jpg"
                  />
                </div>
                
                {submitMessage && (
                  <div className={`${styles.submitMessage} ${styles[submitMessage.type]}`}>
                    {submitMessage.text}
                  </div>
                )}
                
                <div className={styles.formActions}>
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)}
                    className={styles.cancelButton}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={isSubmitting || !formData.title}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Book'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 