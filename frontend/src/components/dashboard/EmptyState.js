/**
 * EmptyState Component with Lottie Animation
 * Displays animated empty state messages when no data is available
 */
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import Lottie from 'lottie-react';
import { EMPTY_STATE_MESSAGES } from '../../config/dashboardConfig';
import { QuestionAnswer } from '@mui/icons-material';

// Simple animated empty state JSON (fallback if no Lottie file)
const emptyStateAnimation = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 400,
  h: 400,
  nm: "Empty State",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [
          { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0] },
          { t: 60, s: [360] }
        ]},
        p: { a: 0, k: [200, 200, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [
          { i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] }, o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] }, t: 0, s: [50, 50, 100] },
          { i: { x: [0.667, 0.667, 0.667], y: [1, 1, 1] }, o: { x: [0.333, 0.333, 0.333], y: [0, 0, 0] }, t: 30, s: [120, 120, 100] },
          { t: 60, s: [50, 50, 100] }
        ]}
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [100, 100] },
              p: { a: 0, k: [0, 0] },
              nm: "Ellipse Path 1"
            },
            {
              ty: "st",
              c: { a: 0, k: [0.21176470588235294, 0.3686274509803922, 0.38823529411764707, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 4 },
              lc: 2,
              lj: 1,
              ml: 4,
              bm: 0,
              nm: "Stroke 1"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
              nm: "Transform"
            }
          ],
          nm: "Ellipse 1",
          mn: "ADBE Vector Group"
        }
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    }
  ],
  markers: []
};

// Fallback animated SVG component
const AnimatedEmptyIcon = () => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setScale(prev => prev === 1 ? 1.1 : 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        mb: 3,
        animation: 'pulse 2s ease-in-out infinite',
        '@keyframes pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: 1,
          },
          '50%': {
            transform: 'scale(1.05)',
            opacity: 0.8,
          },
        },
      }}
    >
      <Box
        sx={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          bgcolor: '#E8F4F5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '3px solid #CFE0E0',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '3px solid #365E63',
            borderTopColor: 'transparent',
            animation: 'spin 2s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' },
            },
          },
        }}
      >
        <QuestionAnswer 
          sx={{ 
            fontSize: 80, 
            color: '#365E63',
            zIndex: 1,
            animation: 'bounce 1.5s ease-in-out infinite',
            '@keyframes bounce': {
              '0%, 100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(-10px)' },
            },
          }} 
        />
      </Box>
    </Box>
  );
};

const EmptyState = ({ message, variant = 'default' }) => {
  const displayMessage = message || EMPTY_STATE_MESSAGES.noData;
  const [hovered, setHovered] = useState(false);
  
  return (
    <Box 
      sx={{ 
        textAlign: 'center', 
        py: 6,
        px: 2,
        transition: 'all 0.3s ease',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatedEmptyIcon />
      
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 600,
          color: '#365E63',
          mb: 2,
          opacity: hovered ? 1 : 0.9,
          transition: 'opacity 0.3s ease',
        }}
      >
        No Data Yet
      </Typography>
      
      <Typography 
        variant="body1" 
        sx={{ 
          color: '#666666',
          mb: 3,
          maxWidth: 500,
          mx: 'auto',
          lineHeight: 1.8,
        }}
      >
        {displayMessage}
      </Typography>
      
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          mt: 4,
        }}
      >
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: '#8CD1BC',
            animation: 'pulse-dot 1.5s ease-in-out infinite',
            '@keyframes pulse-dot': {
              '0%, 100%': {
                transform: 'scale(1)',
                opacity: 1,
              },
              '50%': {
                transform: 'scale(1.5)',
                opacity: 0.5,
              },
            },
          }}
        />
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: '#6B8E91',
            animation: 'pulse-dot 1.5s ease-in-out infinite 0.3s',
            '@keyframes pulse-dot': {
              '0%, 100%': {
                transform: 'scale(1)',
                opacity: 1,
              },
              '50%': {
                transform: 'scale(1.5)',
                opacity: 0.5,
              },
            },
          }}
        />
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            bgcolor: '#365E63',
            animation: 'pulse-dot 1.5s ease-in-out infinite 0.6s',
            '@keyframes pulse-dot': {
              '0%, 100%': {
                transform: 'scale(1)',
                opacity: 1,
              },
              '50%': {
                transform: 'scale(1.5)',
                opacity: 0.5,
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default EmptyState;
