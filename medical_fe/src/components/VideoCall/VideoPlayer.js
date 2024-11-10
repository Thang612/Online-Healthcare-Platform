import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

export const VideoPlayer = ({ user }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (user.videoTrack) {
      user.videoTrack.play(videoRef.current);
    }

    return () => {
      if (user.videoTrack) {
        user.videoTrack.stop();
      }
    };
  }, [user]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '80vh',
        padding: '10px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        backgroundColor: '#000', // Background đen để làm nổi bật video
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box
        component="video"
        ref={videoRef}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '12px',
          border: '2px solid #ffffff', // Viền trắng mỏng để nổi bật video
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        }}
        autoPlay
        playsInline
      />
      <Box
        sx={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 'bold',
        }}
      >
        UID: {user.uid} {/* Hiển thị UID của user */}
      </Box>
    </Box>
  );
};
