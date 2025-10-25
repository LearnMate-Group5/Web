import React, { useState } from 'react';
import './StaffDashboard.css';

const StaffDashboard: React.FC = () => {
  const [books, setBooks] = useState([
    {
      id: 1,
      title: 'React Development Guide',
      author: 'John Doe',
      category: 'Programming',
      status: 'Available',
      publishedDate: '2024-01-15'
    },
    {
      id: 2,
      title: 'JavaScript Fundamentals',
      author: 'Jane Smith',
      category: 'Programming',
      status: 'Borrowed',
      publishedDate: '2024-02-20'
    },
    {
      id: 3,
      title: 'TypeScript Advanced',
      author: 'Mike Johnson',
      category: 'Programming',
      status: 'Available',
      publishedDate: '2024-03-10'
    }
  ]);

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    category: '',
    publishedDate: ''
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBook.title && newBook.author && newBook.category && newBook.publishedDate) {
      const book = {
        id: books.length + 1,
        ...newBook,
        status: 'Available'
      };
      setBooks([...books, book]);
      setNewBook({ title: '', author: '', category: '', publishedDate: '' });
      setShowAddForm(false);
    }
  };

  const handleStatusChange = (bookId: number, newStatus: string) => {
    setBooks(books.map(book => 
      book.id === bookId ? { ...book, status: newStatus } : book
    ));
  };

  const handleDeleteBook = (bookId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cuốn sách này?')) {
      setBooks(books.filter(book => book.id !== bookId));
    }
  };

  return (
    <div className="staff-dashboard">
      <div className="dashboard-header">
        <h1>Quản lý sách</h1>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-actions">
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-book-button"
          >
            {showAddForm ? 'Hủy' : 'Thêm sách mới'}
          </button>
        </div>

        {showAddForm && (
          <div className="add-book-form">
            <h3>Thêm sách mới</h3>
            <form onSubmit={handleAddBook}>
              <div className="form-row">
                <div className="form-group">
                  <label>Tên sách:</label>
                  <input
                    type="text"
                    value={newBook.title}
                    onChange={(e) => setNewBook({...newBook, title: e.target.value})}
                    required
                    aria-label="Tên sách"
                  />
                </div>
                <div className="form-group">
                  <label>Tác giả:</label>
                  <input
                    type="text"
                    value={newBook.author}
                    onChange={(e) => setNewBook({...newBook, author: e.target.value})}
                    required
                    aria-label="Tác giả"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Thể loại:</label>
                  <select
                    value={newBook.category}
                    onChange={(e) => setNewBook({...newBook, category: e.target.value})}
                    required
                    aria-label="Thể loại sách"
                  >
                    <option value="">Chọn thể loại</option>
                    <option value="Programming">Programming</option>
                    <option value="Science">Science</option>
                    <option value="Literature">Literature</option>
                    <option value="History">History</option>
                    <option value="Art">Art</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Ngày xuất bản:</label>
                  <input
                    type="date"
                    value={newBook.publishedDate}
                    onChange={(e) => setNewBook({...newBook, publishedDate: e.target.value})}
                    required
                    aria-label="Ngày xuất bản"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-button">Thêm sách</button>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
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
                <th>ID</th>
                <th>Tên sách</th>
                <th>Tác giả</th>
                <th>Thể loại</th>
                <th>Ngày xuất bản</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td>{book.id}</td>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.category}</td>
                  <td>{new Date(book.publishedDate).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <select
                      value={book.status}
                      onChange={(e) => handleStatusChange(book.id, e.target.value)}
                      className={`status-select ${book.status.toLowerCase()}`}
                      aria-label={`Trạng thái của ${book.title}`}
                    >
                      <option value="Available">Có sẵn</option>
                      <option value="Borrowed">Đã mượn</option>
                      <option value="Maintenance">Bảo trì</option>
                    </select>
                  </td>
                  <td className="actions">
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="delete-button"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Tổng số sách</h3>
            <p className="stat-number">{books.length}</p>
          </div>
          <div className="stat-card">
            <h3>Sách có sẵn</h3>
            <p className="stat-number">{books.filter(b => b.status === 'Available').length}</p>
          </div>
          <div className="stat-card">
            <h3>Sách đã mượn</h3>
            <p className="stat-number">{books.filter(b => b.status === 'Borrowed').length}</p>
          </div>
          <div className="stat-card">
            <h3>Đang bảo trì</h3>
            <p className="stat-number">{books.filter(b => b.status === 'Maintenance').length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
