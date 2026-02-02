import React from 'react'
import { Routes, Route } from "react-router-dom";
import SampleHome from './Sample/SampleHome.jsx';

function App() {


  return (
   <>
    <Routes>
      <Route path="/" element={<SampleHome />} />
    </Routes>
   </>
  )
}

export default App
