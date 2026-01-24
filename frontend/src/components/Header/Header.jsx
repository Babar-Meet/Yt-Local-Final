import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Menu, Search, Mic, Video, Bell, User } from 'lucide-react'
import './Header.css'

const Header = ({ toggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__menu-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <Link to="/" className="header__logo">
          <div className="logo">
            <svg className="logo__icon" viewBox="0 0 24 24">
              <path fill="#FF0000" d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
          </div>
          <h1 className="logo__text">LocalTube</h1>
        </Link>
      </div>

      <div className="header__center">
        <form className="header__search-form" onSubmit={handleSearch}>
          <div className="search__container">
            <input
              type="text"
              className="search__input"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search__button">
              <Search size={20} />
            </button>
          </div>
        </form>
        <button className="header__mic-btn">
          <Mic size={20} />
        </button>
      </div>

      <div className="header__right">
        <button className="header__icon-btn">
          <Video size={22} />
        </button>
        <button className="header__icon-btn notification-btn">
          <Bell size={22} />
          <span className="notification-badge">3</span>
        </button>
        <button className="header__avatar-btn">
          <User size={22} />
        </button>
      </div>
    </header>
  )
}

export default Header