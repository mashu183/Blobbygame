import React from 'react';
import { useNavigate } from 'react-router-dom';
import FacebookAdPageComponent from '@/components/game/FacebookAdPage';

const FacebookAdPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <FacebookAdPageComponent onBack={() => navigate('/play')} />
  );
};

export default FacebookAdPage;
