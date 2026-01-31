import React, { useState } from 'react'
import VideoGrid from '../../components/VideoGrid/VideoGrid'
import { Grid, List, FolderOpen } from 'lucide-react'
import './Home.css'

const Home = ({ videos, categories, loading }) => {
  const [viewMode, setViewMode] = useState('grid')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Filter videos by selected category
  const filteredVideos = selectedCategory === 'all' 
    ? videos 
    : videos.filter(video => {
        if (!video.folder) return false
        return video.folder === selectedCategory || 
               video.folder.startsWith(selectedCategory + '/')
      })

  // Get top 10 categories
  const displayedCategories = [
    { id: 'all', name: 'All Videos', count: videos.length },
    ...(categories?.slice(0, 9) || [])
  ]

  return (
    <div className="home">
      {/* Categories Bar */}
      <div className="home__categories">
        <div className="categories__scroll">
          {displayedCategories.map((category) => {
            const count = category.id === 'all' 
              ? category.count 
              : category.count || 0
            
            return (
              <button
                key={category.id || category.path}
                className={`category-btn ${selectedCategory === (category.id || category.path) ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id || category.path)}
                title={category.displayName || category.name}
              >
                <span className="category-btn__text">
                  {category.displayName || category.name}
                </span>
                {count > 0 && (
                  <span className="category-btn__count">{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Header with View Toggle */}
      <div className="home__header">
        <div className="header__left">
          <h2 className="home__title">
            {selectedCategory === 'all' 
              ? 'Recommended Videos' 
              : `Videos in ${categories?.find(c => c.path === selectedCategory)?.displayName || selectedCategory}`}
          </h2>
          {selectedCategory !== 'all' && (
            <div className="category-info">
              <FolderOpen size={16} />
              <span className="category-path">{selectedCategory}</span>
            </div>
          )}
        </div>
        <div className="view-toggle">
          <button
            className={`view-toggle__btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <Grid size={20} />
          </button>
          <button
            className={`view-toggle__btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* Video Count */}
      <div className="video-count">
        Showing {filteredVideos.length} of {videos.length} videos
        {selectedCategory !== 'all' && ` in "${selectedCategory}"`}
      </div>

      {/* Video Grid */}
      <VideoGrid 
        videos={filteredVideos} 
        loading={loading} 
        viewMode={viewMode} 
      />

      {/* Categories Grid */}
      {categories?.length > 0 && selectedCategory === 'all' && (
        <div className="categories-grid-section">
          <h3 className="section-title">Browse by Category</h3>
          <div className="categories-grid">
            {categories.slice(0, 12).map(category => (
              <a
                key={category.path}
                href={`/category/${encodeURIComponent(category.path)}`}
                className="category-card"
                style={{
                  backgroundImage: category.thumbnail ? `url(${category.thumbnail})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }}
              >
                <div className="category-card__overlay">
                  <h4>{category.displayName}</h4>
                  <p>{category.count} videos</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Home