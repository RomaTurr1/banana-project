import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import SearchPage from './pages/SearchPage';
import ArtworkDetailPage from './pages/ArtworkDetailPage';
import ExpoPage from './pages/ExpoPage';
import ExpoViewPage from './pages/ExpoViewPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <div className="app">
      <Header />
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/artwork/:id" element={<ArtworkDetailPage />} />
        <Route path="/expo" element={<ExpoPage />} />
        <Route path="/expo/view" element={<ExpoViewPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}
