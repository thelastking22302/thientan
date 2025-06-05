import React, { useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import LoginPage from './components/Login';
import Posts from './components/Post';
import HeroSplitCard from './components/IntroSection';
import Articles from './components/Articles';
import AppServer from './components/server';

function App() {
  // Tạo các ref để tham chiếu đến từng section
  const heroRef = useRef(null);
  const heroSplitCardRef = useRef(null);
  const postsRef = useRef(null);
  const articlesRef = useRef(null);
  const footerRef = useRef(null);

  return (
    <div className="App" style={{ overflow: 'hidden' }}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar 
                refs={{
                  Home: heroRef,
                  About: heroSplitCardRef,
                  album: postsRef,
                  Articles: articlesRef,
                  contact: footerRef,
                }}
              />
              <div ref={heroRef}>
                <Hero />
              </div>
              <div ref={heroSplitCardRef}>
                <HeroSplitCard />
              </div>
              <div ref={postsRef}>
                <Posts />
              </div>
              <div ref={articlesRef}>
                <Articles />
              </div>
              <div ref={footerRef}>
                <Footer />
              </div>
            </>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/server/*" element={<AppServer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;