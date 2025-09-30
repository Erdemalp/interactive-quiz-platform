import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import TeacherPanel from './pages/TeacherPanel';
import StudentJoin from './pages/StudentJoin';
import StudentQuiz from './pages/StudentQuiz';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teacher/:sessionCode" element={<TeacherPanel />} />
        <Route path="/join/:sessionCode?" element={<StudentJoin />} />
        <Route path="/quiz/:sessionCode" element={<StudentQuiz />} />
      </Routes>
    </Router>
  );
}

export default App;

