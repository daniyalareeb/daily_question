import React, { useState, useEffect } from 'react';
import { useQuestions } from '../contexts/QuestionsContext';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  LinearProgress,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Card,
  CardContent,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse
} from '@mui/material';
import { Send, ArrowForward, ArrowBack, ExpandMore } from '@mui/icons-material';
import CompletionScreen from '../components/CompletionScreen';

function Questions() {
  const { questions, loading, error, submitResponses, getTodayStatus } = useQuestions();
  const navigate = useNavigate();
  
  // State for current question index and answers
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: { selectedOptionIds: [], subQuestionAnswers: {} } }
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [todaySubmitted, setTodaySubmitted] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [expandedSubQuestions, setExpandedSubQuestions] = useState({}); // Track which sub-question sections are expanded

  useEffect(() => {
    checkTodayStatus();
    
    // Load question progress from sessionStorage
    const savedProgress = sessionStorage.getItem('questionProgress');
    if (savedProgress) {
      try {
        const { currentIndex: savedIndex, answers: savedAnswers } = JSON.parse(savedProgress);
        if (savedIndex !== undefined && savedIndex >= 0) {
          setCurrentIndex(savedIndex);
        }
        if (savedAnswers && Object.keys(savedAnswers).length > 0) {
          setAnswers(savedAnswers);
        }
      } catch (err) {
        console.error('Error loading question progress:', err);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save question progress to sessionStorage whenever currentIndex or answers change
  useEffect(() => {
    if (!checkingStatus && questions.length > 0) {
      const progressData = {
        currentIndex,
        answers
      };
      sessionStorage.setItem('questionProgress', JSON.stringify(progressData));
    }
  }, [currentIndex, answers, checkingStatus, questions.length]);

  // Debug: Log question structure for questions 2 and 5
  useEffect(() => {
    if (questions.length > 0 && currentIndex < questions.length) {
      const question = questions[currentIndex];
      if (question && (question.order === 2 || question.order === 5)) {
        console.log(`Question ${question.order} structure:`, {
          id: question.id,
          text: question.text,
          type: question.type,
          hasOptions: !!question.options,
          optionsCount: question.options?.length || 0,
          options: question.options,
          subQuestionsCount: question.sub_questions?.length || 0
        });
      }
    }
  }, [questions, currentIndex]);

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

  const handleSingleSelect = (questionId, optionId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        selectedOptionIds: [optionId],
        subQuestionAnswers: prev[questionId]?.subQuestionAnswers || {}
      }
    }));
    setSubmitError('');
  };

  const handleMultiSelect = (questionId, optionId, checked) => {
    setAnswers(prev => {
      const current = prev[questionId] || { selectedOptionIds: [], subQuestionAnswers: {} };
      let newOptionIds = [...current.selectedOptionIds];
      let newSubQuestionAnswers = { ...current.subQuestionAnswers };
      
      // Find the question to get option value and sub-questions
      const question = questions.find(q => q.id === questionId);
      
      if (checked) {
        if (!newOptionIds.includes(optionId)) {
          newOptionIds.push(optionId);
        }
      } else {
        // When unchecking, remove the option and clear corresponding sub-question answers
        newOptionIds = newOptionIds.filter(id => id !== optionId);
        
        // Find the option that was deselected
        if (question && question.options) {
          const deselectedOption = question.options.find(o => o.id === optionId);
          if (deselectedOption && deselectedOption.option_value) {
            // Find sub-questions that are triggered by this option
            const relevantSubQuestions = question.sub_questions?.filter(sq => 
              sq.triggering_option_value === deselectedOption.option_value
            ) || [];
            
            // Clear answers for these sub-questions
            relevantSubQuestions.forEach(subQ => {
              delete newSubQuestionAnswers[subQ.id];
            });
          }
        }
      }
      
      return {
        ...prev,
        [questionId]: {
          selectedOptionIds: newOptionIds,
          subQuestionAnswers: newSubQuestionAnswers
        }
      };
    });
    setSubmitError('');
  };

  const handleSubQuestionSingleSelect = (questionId, subQuestionId, optionId) => {
    setAnswers(prev => {
      const current = prev[questionId] || { selectedOptionIds: [], subQuestionAnswers: {} };
      return {
        ...prev,
        [questionId]: {
          selectedOptionIds: current.selectedOptionIds,
          subQuestionAnswers: {
            ...current.subQuestionAnswers,
            [subQuestionId]: [optionId]
          }
        }
      };
    });
    setSubmitError('');
  };

  const handleSubQuestionMultiSelect = (questionId, subQuestionId, optionId, checked) => {
    setAnswers(prev => {
      const current = prev[questionId] || { selectedOptionIds: [], subQuestionAnswers: {} };
      const currentSubAnswers = current.subQuestionAnswers[subQuestionId] || [];
      let newSubAnswers = [...currentSubAnswers];
      
      if (checked) {
        if (!newSubAnswers.includes(optionId)) {
          newSubAnswers.push(optionId);
        }
      } else {
        newSubAnswers = newSubAnswers.filter(id => id !== optionId);
      }
      
      return {
        ...prev,
        [questionId]: {
          selectedOptionIds: current.selectedOptionIds,
          subQuestionAnswers: {
            ...current.subQuestionAnswers,
            [subQuestionId]: newSubAnswers
          }
        }
      };
    });
    setSubmitError('');
  };

  // Validation logic: Can't select "I didn't eat" with food items
  const validateAnswers = (questionId, answer) => {
    if (!answer || !answer.selectedOptionIds) return true;
    
    // For Q2 (What did you eat?), check if user selected both "I didn't eat" and food items
    const question = questions.find(q => q.id === questionId);
    if (question && question.text.includes('What did you eat')) {
      const hasNoEat = answer.selectedOptionIds.some(optId => {
        const option = question.options?.find(o => o.id === optId);
        return option && option.option_text.toLowerCase().includes("didn't eat");
      });
      
      const hasFood = answer.selectedOptionIds.some(optId => {
        const option = question.options?.find(o => o.id === optId);
        return option && !option.option_text.toLowerCase().includes("didn't eat");
      });
      
      if (hasNoEat && hasFood) {
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSubmitError('');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSubmitError('');
    }
  };

  const handleFinalSubmit = async () => {
    if (todaySubmitted) {
      setSubmitError('You have already submitted your responses for today.');
      return;
    }

    // Validate all answers
    for (const question of questions) {
      const answer = answers[question.id];
      
      if (!answer || !answer.selectedOptionIds || answer.selectedOptionIds.length === 0) {
        setSubmitError(`Please answer question ${question.order}: ${question.text}`);
        return;
      }
      
      // Validate single-select questions
      if (question.type === 'single_select' && answer.selectedOptionIds.length !== 1) {
        setSubmitError(`Question ${question.order} requires exactly one selection.`);
        return;
      }
      
      // Validate conditional sub-questions if present
      if (question.type === 'with_sub_questions' && question.sub_questions && question.options) {
        // Check if "I didn't..." option is selected
        const hasNoOption = answer.selectedOptionIds.some(optId => {
          const option = question.options.find(o => o.id === optId);
          return option && (option.option_value === 'no_eat' || option.option_value === 'no_socialize');
        });
        
        if (!hasNoOption) {
          // For each selected main option, validate corresponding sub-question
          const selectedOptions = answer.selectedOptionIds.map(optId => {
            return question.options.find(o => o.id === optId);
          }).filter(Boolean);
          
          for (const selectedOpt of selectedOptions) {
            if (selectedOpt.option_value === 'no_eat' || selectedOpt.option_value === 'no_socialize') {
              continue; // Skip "I didn't..." options
            }
            
            // Find sub-question for this option
            const relevantSubQ = question.sub_questions.find(sq => 
              sq.triggering_option_value === selectedOpt.option_value
            );
            
            if (relevantSubQ) {
              const subAnswer = answer.subQuestionAnswers?.[relevantSubQ.id];
              if (!subAnswer || subAnswer.length === 0) {
                setSubmitError(`Please answer the sub-question for "${selectedOpt.option_text}"`);
                return;
              }
              
              if (relevantSubQ.type === 'single_select' && subAnswer.length !== 1) {
                setSubmitError(`Sub-question "${relevantSubQ.sub_question_text}" requires exactly one selection.`);
                return;
              }
            }
          }
        }
      } else if (question.type === 'with_sub_questions' && question.sub_questions && (!question.options || question.options.length === 0)) {
        // Old structure: sub-questions without main options (optional)
        for (const subQ of question.sub_questions) {
          const subAnswer = answer.subQuestionAnswers?.[subQ.id];
          if (!subAnswer || subAnswer.length === 0) {
            continue; // Sub-questions are optional
          }
          
          if (subQ.type === 'single_select' && subAnswer.length !== 1) {
            setSubmitError(`Sub-question "${subQ.sub_question_text}" requires exactly one selection.`);
            return;
          }
        }
      }
      
      // Run custom validation
      if (!validateAnswers(question.id, answer)) {
        setSubmitError(`Invalid selection for question ${question.order}. You cannot select conflicting options.`);
        return;
      }
    }

    // Build response data, filtering out empty sub-question answers
    let responseData;
    try {
      setSubmitting(true);
      setSubmitError('');
      
      responseData = {
        date: new Date().toISOString().split('T')[0],
        answers: questions.map(q => {
          const answer = answers[q.id] || {};
          const subQuestionAnswers = answer.subQuestionAnswers || {};
          
          // Filter out empty sub-question answers
          const filteredSubQuestionAnswers = {};
          for (const [subQId, optionIds] of Object.entries(subQuestionAnswers)) {
            if (optionIds && Array.isArray(optionIds) && optionIds.length > 0) {
              filteredSubQuestionAnswers[subQId] = optionIds;
            }
          }
          
          return {
            question_id: q.id,
            selected_option_ids: answer.selectedOptionIds || [],
            sub_question_answers: filteredSubQuestionAnswers
          };
        })
      };

      await submitResponses(responseData);
      setSubmitSuccess('Your responses have been submitted successfully!');
      setTodaySubmitted(true);
      
      // Clear question progress from sessionStorage after successful submission
      sessionStorage.removeItem('questionProgress');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to submit responses. Please try again.';
      setSubmitError(errorMessage);
      console.error('Submit error:', err);
      console.error('Error response:', err.response?.data);
      if (responseData) {
        console.error('Response data sent:', responseData);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getAnsweredQuestions = () => {
    return questions.filter(q => {
      const answer = answers[q.id];
      if (!answer || !answer.selectedOptionIds || answer.selectedOptionIds.length === 0) {
        return false;
      }
      // Sub-questions are optional, so main question answer is enough
      return true;
    }).length;
  };

  const isQuestionAnswered = (questionId) => {
    const answer = answers[questionId];
    const question = questions.find(q => q.id === questionId);
    
    // For questions with sub-questions and no main options
    if (question && question.type === 'with_sub_questions' && (!question.options || question.options.length === 0)) {
      // Check if at least one sub-question is answered
      if (answer && answer.subQuestionAnswers) {
        return Object.values(answer.subQuestionAnswers).some(subAnswer => 
          subAnswer && subAnswer.length > 0
        );
      }
      return false;
    }
    
    // For questions with main options
    if (!answer || !answer.selectedOptionIds || answer.selectedOptionIds.length === 0) {
      return false;
    }
    
    // For questions with conditional sub-questions
    if (question && question.type === 'with_sub_questions' && question.options && question.options.length > 0) {
      // Check if "I didn't..." option is selected - if so, question is answered
      const hasNoOption = answer.selectedOptionIds.some(optId => {
        const option = question.options.find(o => o.id === optId);
        return option && (option.option_value === 'no_eat' || option.option_value === 'no_socialize');
      });
      
      if (hasNoOption) {
        return true; // "I didn't..." selected, no sub-questions needed
      }
      
      // Check if sub-questions are required for selected options
      const selectedOptions = answer.selectedOptionIds.map(optId => {
        return question.options.find(o => o.id === optId);
      }).filter(Boolean);
      
      // For each selected option, check if corresponding sub-question is answered
      for (const selectedOpt of selectedOptions) {
        if (selectedOpt.option_value === 'no_eat' || selectedOpt.option_value === 'no_socialize') {
          continue; // Skip "I didn't..." options
        }
        
        // Find sub-question for this option
        const relevantSubQ = question.sub_questions?.find(sq => 
          sq.triggering_option_value === selectedOpt.option_value
        );
        
        if (relevantSubQ) {
          const subAnswer = answer.subQuestionAnswers?.[relevantSubQ.id];
          if (!subAnswer || subAnswer.length === 0) {
            return false; // Sub-question not answered
          }
        }
      }
      
      return true; // All required sub-questions answered
    }
    
    // For single-select, must have exactly one
    if (question && question.type === 'single_select') {
      return answer.selectedOptionIds.length === 1;
    }
    
    // For multi-select, at least one is required
    return answer.selectedOptionIds.length > 0;
  };

  // Get visible sub-questions based on selected main options
  const getVisibleSubQuestions = (question) => {
    if (!question || question.type !== 'with_sub_questions' || !question.sub_questions) {
      return [];
    }
    
    const answer = answers[question.id];
    if (!answer || !answer.selectedOptionIds || answer.selectedOptionIds.length === 0) {
      return [];
    }
    
    // Check if "I didn't..." option is selected
    const hasNoOption = answer.selectedOptionIds.some(optId => {
      const option = question.options?.find(o => o.id === optId);
      return option && (option.option_value === 'no_eat' || option.option_value === 'no_socialize');
    });
    
    if (hasNoOption) {
      return []; // Hide sub-questions if "I didn't..." is selected
    }
    
    // Get selected option values
    const selectedOptionValues = answer.selectedOptionIds
      .map(optId => question.options?.find(o => o.id === optId))
      .filter(Boolean)
      .map(opt => opt.option_value);
    
    // Return sub-questions that match selected options
    return question.sub_questions.filter(sq => 
      sq.triggering_option_value && selectedOptionValues.includes(sq.triggering_option_value)
    );
  };

  const canProceedToNext = () => {
    return isQuestionAnswered(currentQuestion.id);
  };

  const handleSubQuestionToggle = (questionId) => {
    setExpandedSubQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

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

  if (todaySubmitted === true) {
    return <CompletionScreen />;
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) {
    return (
      <Container maxWidth="md" sx={{ mt: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        <Alert severity="info">No questions available</Alert>
      </Container>
    );
  }

  // Calculate progress based on answered questions, not just position
  const answeredCount = getAnsweredQuestions();
  const progress = (answeredCount / questions.length) * 100;
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentAnswer = answers[currentQuestion.id];
  const hasSubQuestions = currentQuestion.type === 'with_sub_questions' && currentQuestion.sub_questions && currentQuestion.sub_questions.length > 0;
  const isSubQuestionsExpanded = expandedSubQuestions[currentQuestion.id] || false;

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
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: '#365E63' }}>
          Daily Reflection
        </Typography>
        <Typography variant="body2" sx={{ color: '#666666' }}>
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
            backgroundColor: '#CFE0E0',
            '& .MuiLinearProgress-bar': {
              backgroundColor: progress >= 80 ? '#8CD1BC' : progress >= 50 ? '#6B8E91' : '#365E63',
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

      {/* Question Card */}
      <Card sx={{ 
        mb: 3, 
        boxShadow: 2,
        bgcolor: '#F2F9F9',
        border: '1px solid #CFE0E0'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#365E63',
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
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              flex: 1, 
              lineHeight: 1.5,
              color: '#365E63'
            }}>
              {currentQuestion.text}
            </Typography>
          </Box>

          <Divider sx={{ my: 3, borderColor: '#CFE0E0' }} />

          {/* Render question based on type */}
          {currentQuestion.type === 'single_select' && (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500, color: '#365E63' }}>
                Choose an option
              </FormLabel>
              <RadioGroup
                value={currentAnswer?.selectedOptionIds?.[0] || ''}
                onChange={(e) => handleSingleSelect(currentQuestion.id, e.target.value)}
              >
                {currentQuestion.options?.map((option) => (
                  <FormControlLabel
                    key={option.id}
                    value={option.id}
                    control={<Radio sx={{ color: '#365E63', '&.Mui-checked': { color: '#365E63' } }} />}
                    label={<Typography sx={{ color: '#2C3E50' }}>{option.option_text}</Typography>}
                    disabled={todaySubmitted}
                    sx={{ mb: 1 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {currentQuestion.type === 'multi_select' && (
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500, color: '#365E63' }}>
                Select all that apply
              </FormLabel>
              <FormGroup>
                {currentQuestion.options?.map((option) => (
                  <FormControlLabel
                    key={option.id}
                    control={
                      <Checkbox
                        checked={currentAnswer?.selectedOptionIds?.includes(option.id) || false}
                        onChange={(e) => handleMultiSelect(currentQuestion.id, option.id, e.target.checked)}
                        disabled={todaySubmitted}
                        sx={{ color: '#365E63', '&.Mui-checked': { color: '#365E63' } }}
                      />
                    }
                    label={<Typography sx={{ color: '#2C3E50' }}>{option.option_text}</Typography>}
                    sx={{ mb: 1 }}
                  />
                ))}
              </FormGroup>
            </FormControl>
          )}

          {currentQuestion.type === 'with_sub_questions' && (
            <Box>
              {/* Main question options first (if they exist) */}
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                  <FormLabel component="legend" sx={{ mb: 2, fontWeight: 500, color: '#365E63' }}>
                    Select all that apply
                  </FormLabel>
                  <FormGroup>
                    {currentQuestion.options.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        control={
                          <Checkbox
                            checked={currentAnswer?.selectedOptionIds?.includes(option.id) || false}
                            onChange={(e) => handleMultiSelect(currentQuestion.id, option.id, e.target.checked)}
                            disabled={todaySubmitted}
                            sx={{ color: '#365E63', '&.Mui-checked': { color: '#365E63' } }}
                          />
                        }
                        label={<Typography sx={{ color: '#2C3E50' }}>{option.option_text}</Typography>}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              ) : (
                // Fallback: Show sub-questions directly if no main options (old structure)
                currentQuestion.sub_questions && currentQuestion.sub_questions.length > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Please answer the sub-questions below.
                  </Alert>
                )
              )}

              {/* Conditionally show sub-questions based on selected main options */}
              {(() => {
                const visibleSubQuestions = getVisibleSubQuestions(currentQuestion);
                if (visibleSubQuestions.length === 0) {
                  return null;
                }
                
                return (
                  <Box sx={{ mt: 3 }}>
                    {visibleSubQuestions.map((subQ, subIndex) => (
                      <Box key={subQ.id} sx={{ mb: 3, p: 2, bgcolor: '#FFFFFF', borderRadius: 2, border: '1px solid #CFE0E0' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#365E63' }}>
                          {subQ.sub_question_text}
                        </Typography>
                        
                        {subQ.type === 'single_select' && (
                          <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', color: '#365E63' }}>
                              Choose an option
                            </FormLabel>
                            <RadioGroup
                              value={currentAnswer?.subQuestionAnswers?.[subQ.id]?.[0] || ''}
                              onChange={(e) => handleSubQuestionSingleSelect(currentQuestion.id, subQ.id, e.target.value)}
                            >
                              {subQ.options?.map((option) => (
                                <FormControlLabel
                                  key={option.id}
                                  value={option.id}
                                  control={<Radio size="small" sx={{ color: '#365E63', '&.Mui-checked': { color: '#365E63' } }} />}
                                  label={<Typography sx={{ fontSize: '0.875rem', color: '#2C3E50' }}>{option.option_text}</Typography>}
                                  disabled={todaySubmitted}
                                  sx={{ mb: 0.5 }}
                                />
                              ))}
                            </RadioGroup>
                          </FormControl>
                        )}

                        {subQ.type === 'multi_select' && (
                          <FormControl component="fieldset" fullWidth>
                            <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', color: '#365E63' }}>
                              Select all that apply
                            </FormLabel>
                            <FormGroup>
                              {subQ.options?.map((option) => (
                                <FormControlLabel
                                  key={option.id}
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={currentAnswer?.subQuestionAnswers?.[subQ.id]?.includes(option.id) || false}
                                      onChange={(e) => handleSubQuestionMultiSelect(currentQuestion.id, subQ.id, option.id, e.target.checked)}
                                      disabled={todaySubmitted}
                                      sx={{ color: '#365E63', '&.Mui-checked': { color: '#365E63' } }}
                                    />
                                  }
                                  label={<Typography sx={{ fontSize: '0.875rem', color: '#2C3E50' }}>{option.option_text}</Typography>}
                                  sx={{ mb: 0.5 }}
                                />
                              ))}
                            </FormGroup>
                          </FormControl>
                        )}
                        
                        {subIndex < visibleSubQuestions.length - 1 && (
                          <Divider sx={{ mt: 3, borderColor: '#CFE0E0' }} />
                        )}
                      </Box>
                    ))}
                  </Box>
                );
              })()}
            </Box>
          )}
        </CardContent>
      </Card>

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
            disabled={submitting || todaySubmitted || !canProceedToNext()}
            sx={{ 
              flex: 1,
              py: 1.5,
              bgcolor: answeredCount === questions.length ? '#8CD1BC' : '#365E63',
              '&:hover': {
                bgcolor: answeredCount === questions.length ? '#7BC4D6' : '#3C666C',
              },
              '&:disabled': {
                bgcolor: '#CFE0E0',
                color: '#999999',
              }
            }}
          >
            {submitting ? 'Submitting...' : 'Submit All Answers'}
          </Button>
        ) : (
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={handleNext}
            disabled={!canProceedToNext() || todaySubmitted}
            sx={{ 
              flex: 1,
              py: 1.5,
              bgcolor: '#365E63',
              '&:hover': {
                bgcolor: '#3C666C',
              },
              '&:disabled': {
                bgcolor: '#CFE0E0',
                color: '#999999',
              }
            }}
          >
            Next
          </Button>
        )}
      </Stack>

      {/* Question Indicators */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        {questions.map((q, index) => (
          <Box
            key={q.id}
            onClick={() => !todaySubmitted && setCurrentIndex(index)}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: index === currentIndex ? 'grey.800' : 
                       isQuestionAnswered(q.id) ? 'success.main' : 'grey.300',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: index === currentIndex ? 2 : 'none',
              '&:hover': {
                transform: 'scale(1.3)',
                boxShadow: 2
              }
            }}
            title={`Question ${index + 1}${isQuestionAnswered(q.id) ? ' (answered)' : ''}`}
          />
        ))}
      </Box>
    </Container>
  );
}

export default Questions;
