import React, { useState, useEffect, useRef } from 'react';
import { useQuestions } from '../contexts/QuestionsContext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  LinearProgress,
  Stack,
  Fade
} from '@mui/material';
import { Send, ArrowForward, ArrowBack } from '@mui/icons-material';
import CompletionScreen from '../components/CompletionScreen';

function Questions() {
  const { questions, loading, error, submitResponses, getTodayStatus } = useQuestions();
  const navigate = useNavigate();
  
  // State for current question index and answers
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [todaySubmitted, setTodaySubmitted] = useState(null); // null = checking, true/false = checked
  const [checkingStatus, setCheckingStatus] = useState(true);
  const textFieldRef = useRef(null);

  useEffect(() => {
    checkTodayStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkTodayStatus = async () => {
    try {
      setCheckingStatus(true);
      const status = await getTodayStatus();
      setTodaySubmitted(status.submitted);
      if (status.submitted) {
        setSubmitSuccess('You have already submitted your responses for today!');
      }
    } catch (err) {
      console.error('Error checking today status:', err);
      setTodaySubmitted(false);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleAnswerChange = (answer) => {
    const questionId = questions[currentIndex].id;
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Auto-focus text field when question changes
  useEffect(() => {
    if (textFieldRef.current) {
      textFieldRef.current.focus();
    }
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSubmitError(''); // Clear any errors when navigating
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSubmitError(''); // Clear any errors when navigating
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      const isLast = currentIndex === questions.length - 1;
      const isFirst = currentIndex === 0;
      
      if (e.key === 'ArrowRight' && !isLast && answers[questions[currentIndex].id]?.trim()) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && !isFirst) {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, answers, questions.length]);

  const handleFinalSubmit = async () => {
    if (todaySubmitted) {
      setSubmitError('You have already submitted your responses for today.');
      return;
    }

    // Check if current question is answered
    const currentQuestion = questions[currentIndex];
    if (!answers[currentQuestion.id]?.trim()) {
      setSubmitError('Please answer this question before submitting.');
      return;
    }

    // Check if all questions are answered
    const unansweredQuestions = questions.filter(q => !answers[q.id]?.trim());
    if (unansweredQuestions.length > 0) {
      setSubmitError(`Please answer all questions. You have ${unansweredQuestions.length} unanswered questions.`);
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      
      const responseData = {
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        answers: questions.map(q => ({
          questionId: q.id,
          text: answers[q.id]
        }))
      };

      await submitResponses(responseData);
      setSubmitSuccess('Your responses have been submitted successfully!');
      setTodaySubmitted(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Failed to submit responses. Please try again.');
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Track which questions have been answered
  const getAnsweredQuestions = () => {
    return questions.filter(q => answers[q.id]?.trim()).length;
  };

  // Show loading while checking status or loading questions
  if (checkingStatus || loading) {
    return (
      <Container maxWidth="md" sx={{ mt: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            {checkingStatus ? 'Checking submission status...' : 'Loading questions...'}
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  // Show completion screen immediately if already submitted (no flash of questions page)
  if (todaySubmitted === true) {
    return <CompletionScreen />;
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = getAnsweredQuestions();

  return (
    <Container 
      maxWidth="md" 
      sx={{ 
        py: { xs: 2, sm: 4 },
        px: { xs: 2, sm: 3 },
        transition: 'all 0.3s ease-in-out'
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Daily Reflection
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Question {currentIndex + 1} of {questions.length} • {answeredCount} answered
        </Typography>
      </Box>

      {/* Progress Bar */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {Math.round(progress)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              backgroundColor: progress >= 80 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#ef4444',
              transition: 'background-color 0.3s ease'
            }
          }}
        />
      </Box>

      {/* Alerts */}
      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSubmitSuccess('')}>
          {submitSuccess}
        </Alert>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError('')}>
          {submitError}
        </Alert>
      )}

      {/* Question */}
      <Fade in={true} timeout={300}>
        <Box 
          sx={{ 
            mb: 3,
            bgcolor: 'white',
            borderRadius: 4,
            p: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid',
            borderColor: 'divider',
            transition: 'all 0.3s ease'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'grey.800',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.2rem',
                mr: 2,
                flexShrink: 0,
                boxShadow: 2
              }}
            >
              {currentIndex + 1}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, lineHeight: 1.5 }}>
              {currentQuestion.text}
            </Typography>
          </Box>

          <TextField
            inputRef={textFieldRef}
            fullWidth
            multiline
            minRows={6}
            maxRows={12}
            variant="outlined"
            placeholder="Share your thoughts... Be as detailed as you'd like."
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={todaySubmitted}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: '1rem',
                transition: 'border-color 0.3s ease',
                '& fieldset': {
                  borderWidth: 2,
                  borderColor: answers[currentQuestion.id]?.trim() ? 'primary.main' : 'divider',
                },
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                  borderWidth: 2,
                },
              },
            }}
          />
          {answers[currentQuestion.id] && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {answers[currentQuestion.id].length} characters
            </Typography>
          )}
        </Box>
      </Fade>

      {/* Navigation Buttons */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handlePrevious}
          disabled={isFirstQuestion || todaySubmitted}
          sx={{ flex: 1 }}
        >
          Previous
        </Button>
        
        {isLastQuestion ? (
          <Button
            variant="contained"
            endIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Send />}
            onClick={handleFinalSubmit}
            disabled={submitting || todaySubmitted || !answers[currentQuestion.id]?.trim()}
            sx={{ 
              flex: 1,
              py: 1.5,
              bgcolor: answeredCount === questions.length ? 'success.main' : 'grey.800',
              '&:hover': {
                bgcolor: answeredCount === questions.length ? 'success.dark' : 'grey.900',
              },
              '&:disabled': {
                bgcolor: 'grey.300'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {submitting ? 'Submitting...' : answeredCount === questions.length ? 'Submit All Answers' : 'Submit'}
          </Button>
        ) : (
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={handleNext}
            disabled={!answers[currentQuestion.id]?.trim() || todaySubmitted}
            sx={{ 
              flex: 1,
              py: 1.5,
              bgcolor: 'grey.800',
              '&:hover': {
                bgcolor: 'grey.900',
              },
              transition: 'all 0.3s ease'
            }}
          >
            Next
          </Button>
        )}
      </Stack>

      {/* Question Indicators */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        {questions.map((_, index) => (
          <Box
            key={index}
            onClick={() => !todaySubmitted && setCurrentIndex(index)}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: index === currentIndex ? 'grey.800' : 
                       answers[questions[index].id]?.trim() ? 'success.main' : 'grey.300',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: index === currentIndex ? 2 : 'none',
              '&:hover': {
                transform: 'scale(1.3)',
                boxShadow: 2
              }
            }}
            title={`Question ${index + 1}${answers[questions[index].id]?.trim() ? ' (answered)' : ''}`}
          />
        ))}
      </Box>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
        Use ← → arrow keys to navigate
      </Typography>
    </Container>
  );
}

export default Questions;


