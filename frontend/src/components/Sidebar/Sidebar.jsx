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
  Settings,
} from 'lucide-react'
import './Sidebar.css'

const Sidebar = ({ size }) => {
  const location = useLocation()

   const mainItems = [
    { icon: <Home size={24} />, label: 'Home', path: '/' }
  ]

  const categoryItems = [
    { icon: <Gamepad2 size={24} />, label: 'Gaming', path: '/category/gaming' },
    { icon: <Music size={24} />, label: 'Learning', path: '/category/learning' },
    { icon: <Trophy size={24} />, label: 'Science', path: '/category/science' },
  ]

  const subscriptions = [
    { icon: <Folder size={24} />, label: 'Channel 1', path: '/channel/1' },
    { icon: <Folder size={24} />, label: 'Channel 2', path: '/channel/2' },
    { icon: <Folder size={24} />, label: 'Channel 3', path: '/channel/3' },
  ]

  const playlistItems = [
    { icon: <PlaySquare size={24} />, label: 'Playlist 1', path: '/playlist/1' },
    { icon: <PlaySquare size={24} />, label: 'Playlist 2', path: '/playlist/2' },
  ]


  const moreOptions = [
    { icon: <Clock size={24} />, label: 'History', path: '/history' },
    { icon: <ThumbsUp size={24} />, label: 'Recycle Bin', path: '/recycle-bin' },
    { icon: <Settings size={24} />, label: 'Settings', path: '/settings' },
  ]

  return (
    <aside
      className={`sidebar ${
        size === 'large' ? 'sidebar--open' : size === 'small' ? '' : 'sidebar--hidden'
      }`}
    >
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

        <div className="sidebar__divider" />

        <div className="sidebar__section">
          <h3 className="sidebar__title">Categories</h3>
          {categoryItems.map((item, index) => (
            <Link key={index} to={item.path} className="sidebar__item">
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="sidebar__divider" />

      <div className="sidebar__section">
        <h3 className="sidebar__title">Subscriptions</h3>
        {subscriptions.map((item, index) => (
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

      <div className="sidebar__divider" />

      
      <div className="sidebar__section">
        <h3 className="sidebar__title">Playlists</h3>
        {playlistItems.map((item, index) => (
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


        <div className="sidebar__divider" />

        <div className="sidebar__section">
          {moreOptions.map((item, index) => (
            <Link key={index} to={item.path} className="sidebar__item">
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
            </Link>
          ))}
        </div>

      </nav>
    </aside>
  )
}

export default Sidebar
