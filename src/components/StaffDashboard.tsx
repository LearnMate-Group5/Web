import React, { useState, useEffect } from 'react';
import { bookService, chapterService, categoryService } from '../services/api';
import type { Book, CreateBookRequest, UpdateBookRequest, Chapter, CreateChapterRequest, UpdateChapterRequest, Category } from '../types';
import './StaffDashboard.css';

const StaffDashboard: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [filterOnlyActive, setFilterOnlyActive] = useState(false);
  
  // Chapter management states
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    categories: [] as string[],
    imageFile: null as File | null,
    isActive: true,
    clearImage: false
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  
  // Categories from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  // Chapter form states
  const [chapterFormData, setChapterFormData] = useState({
    pageIndex: 1,
    title: '',
    content: ''
  });

  // Fetch books
  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await bookService.getBookList({
        onlyActive: filterOnlyActive || undefined
      });
      
      if (response.isSuccess) {
        // Handle both array response and object with books property
        const booksData = Array.isArray(response.value) 
          ? response.value 
          : (response.value as any).books || [];
        setBooks(booksData);
      } else {
        setError(response.error?.description || 'Không thể tải danh sách sách');
      }
    } catch (err) {
      console.error('Error fetching books:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu';
      // Handle network errors or API errors
      if (err instanceof Error && err.message.includes('Network')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoryService.getAllCategories();
      
      if (response.isSuccess) {
        const categoriesData = Array.isArray(response.value) ? response.value : [];
        setCategories(categoriesData);
      } else {
        console.error('Error fetching categories:', response.error?.description || 'Không thể tải danh sách thể loại');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterOnlyActive]);

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, imageFile: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle category toggle (using categoryId)
  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => {
      const isSelected = prev.categories.includes(categoryId);
      if (isSelected) {
        return { ...prev, categories: prev.categories.filter(c => c !== categoryId) };
      } else {
        return { ...prev, categories: [...prev.categories, categoryId] };
      }
    });
  };

  // Get category name by categoryId
  const getCategoryNameById = (categoryId: string): string => {
    const category = categories.find(c => c.categoryId === categoryId);
    return category?.name || categoryId;
  };

  // Get display text for category dropdown
  const getCategoryDisplayText = () => {
    if (formData.categories.length === 0) {
      return 'Chọn thể loại';
    }
    if (formData.categories.length === 1) {
      return getCategoryNameById(formData.categories[0]);
    }
    return `${formData.categories.length} thể loại đã chọn`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown-container')) {
        setCategoryDropdownOpen(false);
      }
    };

    if (categoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoryDropdownOpen]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      categories: [],
      imageFile: null,
      isActive: true,
      clearImage: false
    });
    setImagePreview(null);
    setEditingBook(null);
    setShowAddForm(false);
    setCategoryDropdownOpen(false);
  };

  // Handle create book
  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate categories
    if (formData.categories.length === 0) {
      setError('Vui lòng chọn ít nhất một thể loại');
      setCategoryDropdownOpen(true);
      return;
    }

    try {
      setError('');
      const createData: CreateBookRequest = {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        imageFile: formData.imageFile,
        categories: formData.categories
      };

      const response = await bookService.createBook(createData);
      
      if (response.isSuccess) {
        await fetchBooks();
        // Get the created book ID to open chapter management
        const createdBook = response.value;
        if (createdBook && createdBook.bookId) {
          // Find the book in the updated list
          const updatedBooks = await bookService.getBookList();
          if (updatedBooks.isSuccess) {
            const booksData = Array.isArray(updatedBooks.value) 
              ? updatedBooks.value 
              : (updatedBooks.value as any).books || [];
            const newBook = booksData.find((b: Book) => b.bookId === createdBook.bookId);
            if (newBook) {
              setSelectedBook(newBook);
              setShowChapterForm(true);
              await fetchChapters(newBook.bookId);
            }
          }
        }
        resetForm();
      } else {
        setError(response.error?.description || 'Không thể thêm sách');
      }
    } catch (err) {
      console.error('Error creating book:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi thêm sách';
      if (err instanceof Error && err.message.includes('Network')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError(errorMessage);
      }
    }
  };

  // Handle update book
  const handleUpdateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    // Validate categories
    if (formData.categories.length === 0) {
      setError('Vui lòng chọn ít nhất một thể loại');
      setCategoryDropdownOpen(true);
      return;
    }

    try {
      setError('');
      const updateData: UpdateBookRequest = {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        imageFile: formData.imageFile,
        categories: formData.categories,
        isActive: formData.isActive,
        clearImage: formData.clearImage
      };

      const response = await bookService.updateBook(editingBook.bookId, updateData);
      
      if (response.isSuccess) {
        await fetchBooks();
        resetForm();
      } else {
        setError(response.error?.description || 'Không thể cập nhật sách');
      }
    } catch (err) {
      console.error('Error updating book:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi cập nhật sách';
      if (err instanceof Error && err.message.includes('Network')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError(errorMessage);
      }
    }
  };

  // Handle delete book
  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cuốn sách này?')) {
      return;
    }

    try {
      setError('');
      const response = await bookService.deleteBook(bookId);
      
      if (response.isSuccess) {
        await fetchBooks();
      } else {
        setError(response.error?.description || 'Không thể xóa sách');
      }
    } catch (err) {
      console.error('Error deleting book:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi xóa sách';
      if (err instanceof Error && err.message.includes('Network')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError(errorMessage);
      }
    }
  };

  // Get category display name
  const getCategoryName = (category: any): string => {
    // If category is a string (categoryId), find name from categories API
    if (typeof category === 'string') {
      const foundCategory = categories.find(c => c.categoryId === category);
      return foundCategory?.name || category;
    }
    // If category is an object, use name or categoryId
    return category.name || category.categoryId || '';
  };

  // Get image URL from imageUrl or imageBase64
  const getImageUrl = (book: Book): string | null => {
    // Priority: imageUrl > imageBase64
    if (book.imageUrl) {
      return book.imageUrl;
    }
    if (book.imageBase64) {
      // Convert base64 to data URL if needed
      // Check if it already has data: prefix
      if (book.imageBase64.startsWith('data:')) {
        return book.imageBase64;
      }
      // Assume it's base64 without prefix, add image/jpeg as default
      // You may need to adjust the MIME type based on your backend
      return `data:image/jpeg;base64,${book.imageBase64}`;
    }
    return null;
  };

  // Handle edit button click
  const handleEditClick = (book: Book) => {
    setEditingBook(book);
    setShowAddForm(true);
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description,
      categories: Array.isArray(book.categories) 
        ? book.categories.map((cat: any) => typeof cat === 'string' ? cat : cat.categoryId || cat.name)
        : [],
      imageFile: null,
      isActive: book.isActive,
      clearImage: false
    });
    // Use helper function to get image URL from imageUrl or imageBase64
    const imageUrl = getImageUrl(book);
    setImagePreview(imageUrl);
  };

  // Fetch chapters for a book
  const fetchChapters = async (bookId: string) => {
    try {
      setChaptersLoading(true);
      setError('');
      const response = await chapterService.getChaptersByBookId(bookId);
      
      console.log('fetchChapters response:', response);
      console.log('response.isSuccess:', response.isSuccess);
      console.log('response.value:', response.value);
      console.log('response.value type:', typeof response.value);
      console.log('response.value is array:', Array.isArray(response.value));
      
      if (response.isSuccess) {
        const chaptersData = Array.isArray(response.value) ? response.value : [];
        console.log('chaptersData:', chaptersData);
        console.log('chaptersData length:', chaptersData.length);
        if (chaptersData.length > 0) {
          console.log('First chapter:', chaptersData[0]);
          console.log('First chapter title:', chaptersData[0].title);
          console.log('First chapter content:', chaptersData[0].content);
        }
        // Sort by pageIndex
        chaptersData.sort((a, b) => a.pageIndex - b.pageIndex);
        setChapters(chaptersData);
        console.log('Set chapters state:', chaptersData);
      } else {
        setError(response.error?.description || 'Không thể tải danh sách chương');
      }
    } catch (err) {
      console.error('Error fetching chapters:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tải danh sách chương';
      if (err instanceof Error && err.message.includes('Network')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setChaptersLoading(false);
    }
  };

  // Handle chapter form input change
  const handleChapterInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChapterFormData(prev => ({ 
      ...prev, 
      [name]: name === 'pageIndex' ? parseInt(value) || 1 : value 
    }));
  };

  // Reset chapter form
  const resetChapterForm = () => {
    setChapterFormData({
      pageIndex: chapters.length > 0 ? Math.max(...chapters.map(c => c.pageIndex)) + 1 : 1,
      title: '',
      content: ''
    });
    setEditingChapter(null);
    setShowChapterForm(false);
  };

  // Handle create chapter
  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    try {
      setError('');
      const createData: CreateChapterRequest = {
        pageIndex: chapterFormData.pageIndex,
        title: chapterFormData.title,
        content: chapterFormData.content
      };

      const response = await chapterService.createChapter(selectedBook.bookId, createData);
      
      if (response.isSuccess) {
        await fetchChapters(selectedBook.bookId);
        resetChapterForm();
      } else {
        setError(response.error?.description || 'Không thể thêm chương');
      }
    } catch (err) {
      console.error('Error creating chapter:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi thêm chương';
      if (err instanceof Error && err.message.includes('Network')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError(errorMessage);
      }
    }
  };

  // Handle update chapter
  const handleUpdateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !editingChapter) return;

    try {
      setError('');
      const updateData: UpdateChapterRequest = {
        pageIndex: chapterFormData.pageIndex,
        title: chapterFormData.title,
        content: chapterFormData.content
      };

      const response = await chapterService.updateChapter(selectedBook.bookId, editingChapter.chapterId, updateData);
      
      if (response.isSuccess) {
        await fetchChapters(selectedBook.bookId);
        resetChapterForm();
      } else {
        setError(response.error?.description || 'Không thể cập nhật chương');
      }
    } catch (err) {
      console.error('Error updating chapter:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi cập nhật chương';
      if (err instanceof Error && err.message.includes('Network')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError(errorMessage);
      }
    }
  };

  // Handle delete chapter
  const handleDeleteChapter = async (chapterId: string) => {
    if (!selectedBook) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa chương này?')) {
      return;
    }

    try {
      setError('');
      const response = await chapterService.deleteChapter(selectedBook.bookId, chapterId);
      
      if (response.isSuccess) {
        await fetchChapters(selectedBook.bookId);
      } else {
        setError(response.error?.description || 'Không thể xóa chương');
      }
    } catch (err) {
      console.error('Error deleting chapter:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi xóa chương';
      if (err instanceof Error && err.message.includes('Network')) {
        setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError(errorMessage);
      }
    }
  };

  // Handle edit chapter click
  const handleEditChapterClick = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterFormData({
      pageIndex: chapter.pageIndex,
      title: chapter.title,
      content: chapter.content
    });
    setShowChapterForm(true);
  };

  // Handle manage chapters button click
  const handleManageChaptersClick = async (book: Book) => {
    setSelectedBook(book);
    setShowChapterForm(false);
    setEditingChapter(null);
    await fetchChapters(book.bookId);
  };

  // Close chapter management
  const closeChapterManagement = () => {
    setSelectedBook(null);
    setChapters([]);
    setShowChapterForm(false);
    setEditingChapter(null);
  };

  // Handle ESC key to close chapter management modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedBook) {
        closeChapterManagement();
      }
    };

    if (selectedBook) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedBook]);

  if (loading && books.length === 0) {
    return (
      <div className="staff-dashboard">
        <div className="loading-container">
          <div className="loading-spinner">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-dashboard">
      <div className="dashboard-header">
        <h1>Quản lý sách</h1>
      </div>

      <div className="dashboard-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="dashboard-actions">
          <div className="actions-left">
          <button 
              onClick={() => {
                resetForm();
                setShowAddForm(!showAddForm);
              }}
            className="add-book-button"
          >
            {showAddForm ? 'Hủy' : 'Thêm sách mới'}
          </button>
          </div>
          <div className="actions-right">
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filterOnlyActive}
                onChange={(e) => setFilterOnlyActive(e.target.checked)}
              />
              Chỉ hiển thị sách hoạt động
            </label>
          </div>
        </div>

        {showAddForm && (
          <div className="add-book-form">
            <h3>{editingBook ? 'Chỉnh sửa sách' : 'Thêm sách mới'}</h3>
            <form onSubmit={editingBook ? handleUpdateBook : handleCreateBook}>
              <div className="form-row">
                <div className="form-group">
                  <label>Tên sách: *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    aria-label="Tên sách"
                  />
                </div>
                <div className="form-group">
                  <label>Tác giả: *</label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    required
                    aria-label="Tác giả"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Mô tả: *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  aria-label="Mô tả sách"
                />
              </div>

              <div className="form-row">
                <div className="form-group category-dropdown-container">
                  <label>Thể loại: *</label>
                  <div className="category-dropdown-wrapper">
                    <button
                      type="button"
                      className={`category-dropdown-button ${formData.categories.length === 0 ? 'placeholder' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setCategoryDropdownOpen(!categoryDropdownOpen);
                      }}
                      aria-label="Chọn thể loại"
                    >
                      <span>{getCategoryDisplayText()}</span>
                      <span className="dropdown-arrow">{categoryDropdownOpen ? '▲' : '▼'}</span>
                    </button>
                    {categoryDropdownOpen && (
                      <div className="category-dropdown-menu">
                        {categoriesLoading ? (
                          <div style={{ padding: '10px', textAlign: 'center' }}>Đang tải...</div>
                        ) : categories.length === 0 ? (
                          <div style={{ padding: '10px', textAlign: 'center' }}>Không có thể loại nào</div>
                        ) : (
                          categories.map((category) => (
                            <label key={category.categoryId} className="category-option">
                              <input
                                type="checkbox"
                                checked={formData.categories.includes(category.categoryId)}
                                onChange={() => handleCategoryToggle(category.categoryId)}
                              />
                              <span>{category.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {formData.categories.length === 0 && (
                    <small className="error-text">Vui lòng chọn ít nhất một thể loại</small>
                  )}
                </div>
                <div className="form-group">
                  <label>Hình ảnh:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    aria-label="Chọn hình ảnh"
                  />
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      {editingBook && (
                        <label className="clear-image-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.clearImage}
                            onChange={(e) => setFormData(prev => ({ ...prev, clearImage: e.target.checked }))}
                          />
                          Xóa hình ảnh hiện tại
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {editingBook && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Sách đang hoạt động
                  </label>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="submit-button">
                  {editingBook ? 'Cập nhật' : 'Thêm sách'}
                </button>
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="cancel-button"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="books-table-container">
          <table className="books-table">
            <thead>
              <tr>
                <th>Hình ảnh</th>
                <th>Tên sách</th>
                <th>Tác giả</th>
                <th>Thể loại</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Lượt xem</th>
                <th>Lượt thích</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {books.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px' }}>
                    {loading ? 'Đang tải...' : 'Không có sách nào'}
                  </td>
                </tr>
              ) : (
                books.map((book) => {
                  const imageUrl = getImageUrl(book);
                  return (
                  <tr key={book.bookId}>
                    <td>
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={book.title} 
                          className="book-image-thumbnail"
                        />
                      ) : (
                        <div className="no-image">Không có ảnh</div>
                      )}
                    </td>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                    <td>
                      {Array.isArray(book.categories) && book.categories.length > 0
                        ? book.categories.map(getCategoryName).join(', ')
                        : 'N/A'}
                    </td>
                    <td className="description-cell">
                      {book.description.length > 100 
                        ? `${book.description.substring(0, 100)}...` 
                        : book.description}
                    </td>
                    <td>
                      <span className={`status-badge ${book.isActive ? 'active' : 'inactive'}`}>
                        {book.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                  </td>
                    <td>{book.views || 0}</td>
                    <td>{book.likes || 0}</td>
                  <td className="actions">
                    <button
                        onClick={() => handleEditClick(book)}
                        className="edit-button"
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleManageChaptersClick(book)}
                        className="manage-chapters-button"
                        title="Quản lý chương"
                      >
                        📖
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book.bookId)}
                      className="delete-button"
                        title="Xóa"
                    >
                        🗑️
                    </button>
                  </td>
                </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Tổng số sách</h3>
            <p className="stat-number">{books.length}</p>
          </div>
          <div className="stat-card">
            <h3>Sách hoạt động</h3>
            <p className="stat-number">{books.filter(b => b.isActive).length}</p>
          </div>
          <div className="stat-card">
            <h3>Tổng lượt xem</h3>
            <p className="stat-number">{books.reduce((sum, b) => sum + (b.views || 0), 0)}</p>
          </div>
          <div className="stat-card">
            <h3>Tổng lượt thích</h3>
            <p className="stat-number">{books.reduce((sum, b) => sum + (b.likes || 0), 0)}</p>
          </div>
        </div>
      </div>

      {/* Chapter Management Modal */}
      {selectedBook && (
        <div className="chapter-management-modal">
          <div className="chapter-management-content">
            <div className="chapter-management-header">
              <h2>Quản lý chương - {selectedBook.title}</h2>
              <button 
                onClick={closeChapterManagement}
                className="close-button"
                title="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="chapter-management-body">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="chapter-actions">
                <button 
                  onClick={() => {
                    resetChapterForm();
                    setShowChapterForm(!showChapterForm);
                  }}
                  className="add-chapter-button"
                >
                  {showChapterForm ? 'Hủy' : 'Thêm chương mới'}
                </button>
              </div>

              {showChapterForm && (
                <div className="chapter-form">
                  <h3>{editingChapter ? 'Chỉnh sửa chương' : 'Thêm chương mới'}</h3>
                  <form onSubmit={editingChapter ? handleUpdateChapter : handleCreateChapter}>
                    <div className="form-group">
                      <label>Số trang/Thứ tự: *</label>
                      <input
                        type="number"
                        name="pageIndex"
                        value={chapterFormData.pageIndex}
                        onChange={handleChapterInputChange}
                        required
                        min="1"
                        aria-label="Số trang"
                      />
                    </div>

                    <div className="form-group">
                      <label>Tiêu đề chương: *</label>
                      <input
                        type="text"
                        name="title"
                        value={chapterFormData.title}
                        onChange={handleChapterInputChange}
                        required
                        aria-label="Tiêu đề chương"
                      />
                    </div>

                    <div className="form-group">
                      <label>Nội dung: *</label>
                      <textarea
                        name="content"
                        value={chapterFormData.content}
                        onChange={handleChapterInputChange}
                        required
                        rows={10}
                        aria-label="Nội dung chương"
                      />
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="submit-button">
                        {editingChapter ? 'Cập nhật' : 'Thêm chương'}
                      </button>
                      <button 
                        type="button" 
                        onClick={resetChapterForm}
                        className="cancel-button"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="chapters-list">
                <h3>Danh sách chương ({chapters.length})</h3>
                {chaptersLoading ? (
                  <div className="loading-spinner">Đang tải...</div>
                ) : chapters.length === 0 ? (
                  <div className="no-chapters">Chưa có chương nào</div>
                ) : (
                  <table className="chapters-table">
                    <thead>
                      <tr>
                        <th>Thứ tự</th>
                        <th>Tiêu đề</th>
                        <th>Nội dung</th>
                        <th>Ngày tạo</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chapters.map((chapter) => {
                        console.log('Rendering chapter:', chapter);
                        console.log('Chapter title:', chapter.title);
                        console.log('Chapter content:', chapter.content);
                        return (
                          <tr key={chapter.chapterId}>
                            <td>{chapter.pageIndex}</td>
                            <td>{chapter.title || 'N/A'}</td>
                            <td className="chapter-content-cell">
                              {chapter.content && chapter.content.length > 100 
                                ? `${chapter.content.substring(0, 100)}...` 
                                : (chapter.content || 'N/A')}
                            </td>
                            <td>{chapter.createdAt ? new Date(chapter.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</td>
                            <td className="actions">
                              <button
                                onClick={() => handleEditChapterClick(chapter)}
                                className="edit-button"
                                title="Chỉnh sửa"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteChapter(chapter.chapterId)}
                                className="delete-button"
                                title="Xóa"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
