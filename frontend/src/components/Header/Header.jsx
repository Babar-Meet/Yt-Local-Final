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
<div class="header__left">
  <button class="header__menu-btn" onClick={toggleSidebar}>
    ☰
  </button>

  <a href="/" class="header__logo">
    <div class="logo">
      <img
        src="/YT_Logo.svg"
        alt="YouTube Logo"
        class="logo__icon"
      />
    </div>
    <h1 class="logo__text">Dr . YouTube</h1>
  </a>
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