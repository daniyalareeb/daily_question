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
  Stack
} from '@mui/material';
import { Send, ArrowForward, ArrowBack } from '@mui/icons-material';

function Questions() {
  const { questions, loading, error, submitResponses, getTodayStatus } = useQuestions();
  const navigate = useNavigate();
  
  // State for current question index and answers
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [todaySubmitted, setTodaySubmitted] = useState(false);
  const textFieldRef = useRef(null);

  useEffect(() => {
    checkTodayStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkTodayStatus = async () => {
    try {
      const status = await getTodayStatus();
      setTodaySubmitted(status.submitted);
      if (status.submitted) {
        setSubmitSuccess('You have already submitted your responses for today!');
      }
    } catch (err) {
      console.error('Error checking today status:', err);
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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const answeredCount = getAnsweredQuestions();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
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
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ mb: 3, height: 6, borderRadius: 3 }}
      />

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
      <Box 
        sx={{ 
          mb: 3,
          bgcolor: 'white',
          borderRadius: 3,
          p: 4,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              mr: 2,
              flexShrink: 0
            }}
          >
            {currentIndex + 1}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
            {currentQuestion.text}
          </Typography>
        </Box>

        <TextField
          inputRef={textFieldRef}
          fullWidth
          multiline
          rows={8}
          variant="outlined"
          placeholder="Share your thoughts..."
          value={answers[currentQuestion.id] || ''}
          onChange={(e) => handleAnswerChange(e.target.value)}
          disabled={todaySubmitted}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '1rem',
              '& fieldset': {
                borderWidth: 2,
              },
            },
          }}
        />
      </Box>

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
            endIcon={submitting ? <CircularProgress size={20} /> : <Send />}
            onClick={handleFinalSubmit}
            disabled={submitting || todaySubmitted || !answers[currentQuestion.id]?.trim()}
            sx={{ flex: 1 }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        ) : (
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={handleNext}
            disabled={!answers[currentQuestion.id]?.trim() || todaySubmitted}
            sx={{ flex: 1 }}
          >
            Next
          </Button>
        )}
      </Stack>

      {/* Question Indicators */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
        {questions.map((_, index) => (
          <Box
            key={index}
            onClick={() => !todaySubmitted && setCurrentIndex(index)}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: index === currentIndex ? 'primary.main' : 
                       answers[questions[index].id]?.trim() ? 'success.main' : 'grey.300',
              cursor: 'pointer'
            }}
          />
        ))}
      </Box>
    </Container>
  );
}

export default Questions;


