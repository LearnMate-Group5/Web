import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound: React.FC = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1 className="error-title">Trang không tồn tại</h1>
        <p className="error-message">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="error-actions">
          <Link to="/login" className="home-button">
            Về trang đăng nhập
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="back-button"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
