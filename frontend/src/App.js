import { useEffect, useState } from 'react';
import InicioDerick from './inicio/pages/InicioDerick';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomeDerick from './inicio/pages/HomeDerick.jsx';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Chat from './inicio/pages/Chat.jsx';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="" element={<InicioDerick/>} />
        <Route path="/HomeDerick" element={<HomeDerick/>} />
      </Routes>
    </BrowserRouter>

  );
}

export default App;
