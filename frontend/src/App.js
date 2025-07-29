import React from "react";
import VisiblityTool from "./Pages/Visibility-tool/VisibilityTool";
import Competitors from "./Pages/Visibility-tool/Competitors";
import Ranking from "./Pages/Visibility-tool/Ranking";
import Screenshots from "./Pages/Visibility-tool/screenshots";
import Chatbot from "./Components/chatbot"; // Import the Chatbot component
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar/Navbar";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<VisiblityTool />} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/screenshots" element={<Screenshots />} />
        </Routes>
        <Chatbot  /> {/* Add Chatbot at the root level to appear on all routes */}
      </div>
    </Router>
  );
}

export default App;