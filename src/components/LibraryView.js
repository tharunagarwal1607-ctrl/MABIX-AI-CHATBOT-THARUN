'use client';

import { useState } from 'react';

const RESTYLE_CARDS = [
  {
    id: 'hairstyle',
    title: 'Hairstyle gallery',
    badge: 'Popular',
    tag: 'Hairstyle gallery',
    description: 'Transform portraits with new creative hairstyles & cuts.',
    previewBefore: '👩‍💼 Original Portrait',
    previewAfter: '✨ 9 Hairstyle Variations',
    bgGradient: 'linear-gradient(135deg, #1e1e38 0%, #2a2a4e 100%)',
    icon: '💇‍♀️',
  },
  {
    id: 'neon',
    title: 'Neon fantasy',
    badge: 'Trending',
    tag: 'Neon fantasy',
    description: 'Turn wildlife, pets, or portraits into psychedelic neon artwork.',
    previewBefore: '🐼 Real Panda',
    previewAfter: '🌈 Psychedelic Neon Art',
    bgGradient: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 50%, #06b6d4 100%)',
    icon: '✨',
  },
  {
    id: 'anime80s',
    title: '1980s anime',
    badge: 'Retro',
    tag: '1980s anime',
    description: 'Reimagine couple photos and cityscapes in classic hand-drawn 80s anime aesthetic.',
    previewBefore: '👫 Modern Photo',
    previewAfter: '🌆 Golden Retro Anime',
    bgGradient: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 50%, #ea580c 100%)',
    icon: '🎨',
  },
  {
    id: 'keyframe',
    title: 'Anime keyframe',
    badge: 'Action',
    tag: 'Anime keyframe',
    description: 'Convert candid portraits into high-octane cinematic anime battle keyframes.',
    previewBefore: '👧 Smiling Selfie',
    previewAfter: '⚡ Shonen Battle Frame',
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #be185d 100%)',
    icon: '⚡',
  },
];

const INSPIRATION_CARDS = [
  {
    id: 'metallic_couture',
    title: 'Futuristic Metallic Couture',
    prompt: 'High-fashion editorial portrait of a model wearing an avant-garde dress sculpted entirely from shimmering chrome metallic petal spoons, soft studio lighting, ultra-realistic texture.',
    tag: 'Fashion • 3D Sculpture',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=80',
    likes: '1.4k',
  },
  {
    id: 'rollercoaster_joy',
    title: 'Pure Joy at Golden Hour',
    prompt: 'Cinematic candid shot of a happy young woman raising both arms joyfully on an amusement park roller coaster, soft lens flare, golden hour sunset, 35mm film grain.',
    tag: 'Cinematic • Candid',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=700&q=80',
    likes: '2.1k',
  },
  {
    id: 'clay_monsters',
    title: 'Fluffy Claymation Friends',
    prompt: 'Three cute colorful fluffy claymation creature characters, one vibrant yellow, one bright lime green, and one soft pastel blue, with big cute googly eyes, macro photography, studio depth of field.',
    tag: '3D Art • Character Design',
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=80',
    likes: '3.8k',
  },
];

export default function LibraryView({ onOpenImagine, onInspirePrompt, onBackToChat }) {
  const [activeTab, setActiveTab] = useState('images');
  const [likedCards, setLikedCards] = useState({});

  const toggleLike = (id) => {
    setLikedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="library-view-container">
      {/* Top Bar with Navigation Tabs */}
      <div className="library-top-bar">
        <div className="library-nav-tabs">
          <button
            type="button"
            className={`library-tab-pill ${activeTab === 'images' ? 'active' : ''}`}
            onClick={() => setActiveTab('images')}
          >
            Images
          </button>
          <button
            type="button"
            className={`library-tab-pill ${activeTab === 'pages' ? 'active' : ''}`}
            onClick={() => setActiveTab('pages')}
          >
            Pages
          </button>
          <button
            type="button"
            className={`library-tab-pill ${activeTab === 'research' ? 'active' : ''}`}
            onClick={() => setActiveTab('research')}
          >
            Research reports
          </button>
          <span className="library-tab-dropdown-arrow">▾</span>
        </div>

        <button
          type="button"
          className="library-create-image-btn"
          onClick={() => onOpenImagine()}
        >
          Create image
        </button>
      </div>

      <div className="library-content-scroll">
        {/* Hero Gallery Banner matching Image 1 */}
        <div className="library-hero-banner">
          <div className="hero-banner-image-grid">
            <div className="hero-img-box img1">
              <span className="hero-box-label">Hand &amp; Flora</span>
            </div>
            <div className="hero-img-box img2">
              <span className="hero-box-label">Prism Rainbow Light</span>
            </div>
            <div className="hero-img-box img3">
              <span className="hero-box-label">Alpine Meadow</span>
            </div>
            <div className="hero-img-box img4">
              <span className="hero-box-label">Tropical Ocean Cove</span>
            </div>
          </div>

          <div className="hero-banner-content">
            <h1 className="hero-banner-title">Create and customize images in any style</h1>
            <button
              type="button"
              className="hero-banner-cta-btn"
              onClick={() => onOpenImagine()}
            >
              Create image
            </button>
          </div>
        </div>

        {/* Section 1: Restyle your photos matching Image 3 */}
        <section className="library-section">
          <div className="section-header-row">
            <h2 className="section-title highlight-blue">Restyle your photos</h2>
          </div>

          <div className="restyle-cards-grid">
            {RESTYLE_CARDS.map((card) => (
              <div
                key={card.id}
                className="restyle-card"
                onClick={() => onOpenImagine()}
                style={{ background: card.bgGradient }}
              >
                <div className="restyle-card-header">
                  <span className="restyle-tag">{card.tag}</span>
                </div>

                <div className="restyle-card-visual">
                  <div className="restyle-card-pair">
                    <div className="restyle-thumb before">
                      <span>{card.icon}</span>
                      <small>{card.previewBefore}</small>
                    </div>
                    <div className="restyle-thumb after">
                      <span className="sparkle">✨</span>
                      <small>{card.previewAfter}</small>
                    </div>
                  </div>
                </div>

                <div className="restyle-card-desc">
                  <p>{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Inspire your next image matching Image 3 */}
        <section className="library-section">
          <div className="section-header-row">
            <h2 className="section-title">Inspire your next image</h2>
          </div>

          <div className="inspire-cards-grid">
            {INSPIRATION_CARDS.map((item) => (
              <div
                key={item.id}
                className="inspire-card"
                onClick={() => onInspirePrompt(item.prompt)}
              >
                <div className="inspire-img-wrapper">
                  <img src={item.image} alt={item.title} className="inspire-img" />
                  <button
                    type="button"
                    className={`inspire-heart-btn ${likedCards[item.id] ? 'liked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(item.id);
                    }}
                    title="Favorite image"
                  >
                    {likedCards[item.id] ? '❤️' : '🤍'}
                  </button>
                  <span className="inspire-tag-pill">{item.tag}</span>
                </div>
                <div className="inspire-card-body">
                  <h3 className="inspire-card-title">{item.title}</h3>
                  <p className="inspire-card-prompt">{item.prompt}</p>
                  <div className="inspire-card-footer">
                    <span className="inspire-cta-text">Click to generate in Chat →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
