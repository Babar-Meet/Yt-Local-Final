import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Mic,
  HardDrive,
  User,
  Github,
  Linkedin,
  Twitter,
  PiIcon,
  InfoIcon,
  DollarSign
} from 'lucide-react'
import './Header.css'

const Header = ({ toggleSidebar }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [videoCount, setVideoCount] = useState(0)
  const [showAbout, setShowAbout] = useState(false)
  const [showSocials, setShowSocials] = useState(false)

  const navigate = useNavigate()
  const aboutRef = useRef(null)
  const socialsRef = useRef(null)

  // 🔥 SEARCH INPUT REF (NO UI CHANGE)
  const searchInputRef = useRef(null)

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
    window.open(ytUrl, '_blank')
  }

  // 🔥 GLOBAL KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement.tagName.toLowerCase()

      // If user is already typing somewhere → ignore
      if (tag === 'input' || tag === 'textarea') return

      // "/" key
      if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }

      // Ctrl + K
      if (e.ctrlKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close tooltips when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aboutRef.current && !aboutRef.current.contains(event.target)) {
        setShowAbout(false)
      }
      if (socialsRef.current && !socialsRef.current.contains(event.target)) {
        setShowSocials(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleAbout = () => {
    setShowAbout(!showAbout)
    if (!showAbout) setShowSocials(false)
  }

  const toggleSocials = () => {
    setShowSocials(!showSocials)
    if (!showSocials) setShowAbout(false)
  }

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__menu-btn" onClick={toggleSidebar}>☰</button>

        <a href="/" className="header__logo">
          <div className="logo">
            <img src="/YT_Logo.svg" alt="YouTube Logo" className="logo__icon" />
          </div>
          <h1 className="logo__text">Dr . YouTube</h1>
        </a>
      </div>

      <div className="header__center">
        <form className="header__search-form" onSubmit={handleSearch}>
          <div className="search__container">
            <input
              ref={searchInputRef}
              type="text"
              className="search__input"
              placeholder="Search on YouTube"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search__button">
              <Search size={20} />
            </button>
          </div>
        </form>
        <button className="header__mic-btn"><Mic size={20} /></button>
      </div>

      <div className="header__right">
        <div className="header__icon-btn">
          <HardDrive size={22} />
          <span className="storage-count">{videoCount}</span>
        </div>

        <div ref={aboutRef} className="header__icon-btn" onClick={toggleAbout}>
          <User size={22} />
          {showAbout && (
            <div className="about-tooltip">
              <img src="/Creator.jpg" alt="Meet Profile" className="profile-pic" />
              <h3>About Me</h3>
              <p>I Am A Creator</p>
              <p>Enjoyyyyyyyyyyyyyyyyyy</p>
            </div>
          )}
        </div>

        <a href="https://github.com/Babar-Meet" target="_blank" className="header__icon-btn">
          <Github size={22} />
        </a>
        <a href="https://buymeacoffee.com/babariyameet" target="_blank" className="header__icon-btn">
          <DollarSign size={22} />
        </a>
        <a href="#" className="header__icon-btn">
          <Linkedin size={22} />
        </a>
        <a href="#" className="header__icon-btn">
          <Twitter size={22} />
        </a>

        <div ref={socialsRef} className="header__icon-btn" onClick={toggleSocials}>
          <InfoIcon size={22} />
          {showSocials && (
            <div className="about-tooltip">
              <h3>
                <PiIcon size={18} /> Socials / Support
              </h3>
              <ul>
                <li>Instagram: @babar_meet</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
