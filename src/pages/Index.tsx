import { Navigate } from 'react-router-dom';

// Index route redirects to the main dashboard
const Index = () => {
  return <Navigate to="/narratives" replace />;
};

export default Index;