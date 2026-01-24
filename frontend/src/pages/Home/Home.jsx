import React, { useState } from 'react'
import VideoGrid from '../../components/VideoGrid/VideoGrid'
import { Grid, List } from 'lucide-react'
import './Home.css'

const Home = ({ videos, loading }) => {
  const [viewMode, setViewMode] = useState('grid')
  const [category, setCategory] = useState('all')

  const categories = [
    'All', 'Music', 'Gaming', 'Live', 'Mixes', 'Computer programming',
    'Comedy', 'Recently uploaded', 'Watched', 'New to you'
  ]

  return (
    <div className="home">
      <div className="home__categories">
        <div className="categories__scroll">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${category === cat.toLowerCase() ? 'active' : ''}`}
              onClick={() => setCategory(cat.toLowerCase())}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="home__header">
        <h2 className="home__title">Recommended Videos</h2>
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

      <VideoGrid videos={videos} loading={loading} viewMode={viewMode} />

      {videos.length > 0 && !loading && (
        <div className="home__stats">
          <p>Showing {videos.length} videos from your local collection</p>
        </div>
      )}
    </div>
  )
}

export default Home