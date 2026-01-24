import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Compass, 
  PlaySquare, 
  Folder, 
  Clock, 
  ThumbsUp,
  Music,
  Gamepad2,
  Trophy,
  ShoppingBag,
  Settings 
} from 'lucide-react'
import './Sidebar.css'

const Sidebar = ({ isOpen }) => {
  const location = useLocation()

  const mainItems = [
    { icon: <Home size={24} />, label: 'Home', path: '/' },
    { icon: <Compass size={24} />, label: 'Explore', path: '/explore' },
    { icon: <PlaySquare size={24} />, label: 'Subscriptions', path: '/subscriptions' },
  ]

  const libraryItems = [
    { icon: <Folder size={24} />, label: 'Library', path: '/library' },
    { icon: <Clock size={24} />, label: 'History', path: '/history' },
    { icon: <PlaySquare size={24} />, label: 'Your Videos', path: '/your-videos' },
    { icon: <ThumbsUp size={24} />, label: 'Liked Videos', path: '/liked' },
  ]

  const subscriptions = [
    { icon: <Music size={24} />, label: 'Music' },
    { icon: <Gamepad2 size={24} />, label: 'Gaming' },
    { icon: <Trophy size={24} />, label: 'Sports' },
  ]

  const moreItems = [
    { icon: <ShoppingBag size={24} />, label: 'Shopping' },
    { icon: <Settings size={24} />, label: 'Settings' },
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <nav className="sidebar__nav">
        <div className="sidebar__section">
          {mainItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`sidebar__item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="sidebar__divider"></div>

        <div className="sidebar__section">
          <h3 className="sidebar__title">Library</h3>
          {libraryItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`sidebar__item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="sidebar__divider"></div>

        <div className="sidebar__section">
          <h3 className="sidebar__title">Subscriptions</h3>
          {subscriptions.map((item, index) => (
            <div key={index} className="sidebar__item">
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="sidebar__divider"></div>

        <div className="sidebar__section">
          <h3 className="sidebar__title">More from YouTube</h3>
          {moreItems.map((item, index) => (
            <div key={index} className="sidebar__item">
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar