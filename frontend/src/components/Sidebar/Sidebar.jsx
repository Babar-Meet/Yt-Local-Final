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
  Film,
  FolderOpen,
  ListVideo
} from 'lucide-react'
import './Sidebar.css'

const Sidebar = ({ size, categories, videos }) => {
  const location = useLocation()

  const mainItems = [
    { icon: <Home size={24} />, label: 'Home', path: '/' }
  ]

  // Get top 5 categories based on video count
  const topCategories = categories?.slice(0, 5) || []

  // Count videos by folder/category
  const getCategoryCount = (categoryPath) => {
    if (!videos) return 0
    return videos.filter(video => {
      if (!categoryPath) return !video.folder || video.folder === ''
      return video.folder === categoryPath || video.folder?.startsWith(categoryPath + '/')
    }).length
  }

  // Get popular folders (folders with most videos)
  const getPopularFolders = () => {
    if (!videos) return []
    
    const folderCounts = {}
    videos.forEach(video => {
      if (video.folder) {
        folderCounts[video.folder] = (folderCounts[video.folder] || 0) + 1
      }
    })
    
    return Object.entries(folderCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([folder, count]) => ({
        name: folder.split('/').pop(),
        path: folder,
        count: count
      }))
  }

  const popularFolders = getPopularFolders()

  const subscriptions = [
    { icon: <Folder size={24} />, label: 'My Videos', path: '/category/' },
    { icon: <Film size={24} />, label: 'All Videos', path: '/category/all' },
  ]

  const playlistItems = popularFolders.map((folder, index) => ({
    icon: <FolderOpen size={24} />,
    label: `${folder.name} (${folder.count})`,
    path: `/category/${encodeURIComponent(folder.path)}`
  }))

  const moreOptions = [
    { icon: <Clock size={24} />, label: 'History', path: '/history' },
    { icon: <ThumbsUp size={24} />, label: 'Liked Videos', path: '/liked' },
    { icon: <Settings size={24} />, label: 'Player Settings', path: '/VideoplayerSettings' },
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


        {/* Categories Section - Dynamic */}
        <div className="sidebar__section">
          <h3 className="sidebar__title">Categories</h3>
          {topCategories.map((category, index) => (
            <Link 
              key={index} 
              to={`/category/${encodeURIComponent(category.path)}`}
              className={`sidebar__item ${location.pathname === `/category/${category.path}` ? 'active' : ''}`}
            >
              <span className="sidebar__icon">
                <Gamepad2 size={24} />
              </span>
              <div className="sidebar__label-wrapper">
                <span className="sidebar__label">{category.displayName}</span>
                <span className="sidebar__count">{category.count}</span>
              </div>
            </Link>

            
          ))}
          
          {categories?.length > 5 && (
            <Link 
              to="/categories" 
              className="sidebar__item sidebar__view-all"
            >
              <span className="sidebar__icon">
                <ListVideo size={24} />
              </span>
              <span className="sidebar__label">View All Categories</span>
            </Link>
          )}
        </div>

        <div className="sidebar__divider" />

        {/* Subscriptions Section */}
        <div className="sidebar__section">
          <h3 className="sidebar__title">Library</h3>
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

        {/* Popular Folders Section */}
        <div className="sidebar__section">
          <h3 className="sidebar__title">Popular Folders</h3>
          {playlistItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}   
              className={`sidebar__item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="sidebar__icon">{item.icon}</span>
              <div className="sidebar__label-wrapper">
                <span className="sidebar__label">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="sidebar__divider" />

        {/* More Options */}
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