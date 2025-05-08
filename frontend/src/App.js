import { useEffect, useState } from 'react';
import Inicio from './inicio/pages/Inicio.jsx';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './inicio/pages/Home.jsx';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Chat from './inicio/pages/Chat.jsx';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio/>} />
        <Route path="/Home" element={<Home/>} />
        <Route path="/Chat" element={<Chat/>} />
      </Routes>
    </BrowserRouter>

  );
}

export default App;
