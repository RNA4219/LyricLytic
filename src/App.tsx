import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Editor from './pages/Editor';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="project/:projectId" element={<Editor />} />
      </Route>
    </Routes>
  );
}

export default App;