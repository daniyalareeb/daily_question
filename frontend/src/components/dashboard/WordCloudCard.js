// Word cloud visualization component
import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import wordcloud from 'wordcloud';
import EmptyState from './EmptyState';
import { 
  WORD_CLOUD_CONFIG, 
  EMPTY_STATE_MESSAGES 
} from '../../config/dashboardConfig';
import { 
  formatWordCloudData, 
  isValidWordCloudData 
} from '../../utils/dashboardUtils';

const WordCloudCard = ({ topKeywords, title = 'Your Most Used Words' }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const wordCloudData = formatWordCloudData(topKeywords);
  const hasValidData = isValidWordCloudData(wordCloudData);

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 800,
          height: WORD_CLOUD_CONFIG.containerHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Generate word cloud
  useEffect(() => {
    if (!hasValidData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Convert data format for wordcloud library: [text, size] -> [text, size]
    const wordList = wordCloudData.map(([text, size]) => [text, size]);

    try {
      // Get min and max values for scaling
      const sizes = wordCloudData.map(([, size]) => size);
      const minSize = Math.min(...sizes);
      const maxSize = Math.max(...sizes);
      const range = maxSize - minSize || 1;

      wordcloud(canvas, {
        list: wordList,
        gridSize: WORD_CLOUD_CONFIG.gridSize,
        weightFactor: (size) => {
          // Scale the size to ensure even small words are visible
          // Minimum size will be at least 40px, max up to 120px
          const minFont = 40;
          const maxFont = 120;
          const normalized = (size - minSize) / range;
          return minFont + (normalized * (maxFont - minFont));
        },
        fontFamily: WORD_CLOUD_CONFIG.fontFamily,
        fontWeight: WORD_CLOUD_CONFIG.fontWeight,
        color: (word, weight, fontSize, distance, theta) => {
          // Color based on frequency - more frequent = darker/more vibrant
          const colors = [
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
          ];
          return colors[Math.floor(Math.random() * colors.length)];
        },
        rotateRatio: 0.3,
        rotationSteps: WORD_CLOUD_CONFIG.rotationSteps,
        shuffle: true,
        backgroundColor: 'transparent',
      });
    } catch (error) {
      console.error('Error generating word cloud:', error);
    }
  }, [wordCloudData, hasValidData, dimensions]);

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent sx={{ padding: '12px 16px !important' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {title}
        </Typography>
        
        {hasValidData ? (
          <Box 
            ref={containerRef}
            sx={{ 
              height: WORD_CLOUD_CONFIG.containerHeight, 
              width: '100%',
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              overflow: 'hidden',
              position: 'relative',
              minHeight: WORD_CLOUD_CONFIG.containerHeight,
              padding: 0,
              margin: 0,
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
              }}
            />
          </Box>
        ) : (
          <EmptyState message={EMPTY_STATE_MESSAGES.noKeywords} />
        )}
      </CardContent>
    </Card>
  );
};

export default WordCloudCard;
