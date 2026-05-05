package com.enicarthage.incubator.service;

import com.enicarthage.incubator.dto.request.EvaluationRequest;
import com.enicarthage.incubator.exception.ResourceNotFoundException;
import com.enicarthage.incubator.model.*;
import com.enicarthage.incubator.repository.ApplicationRepository;
import com.enicarthage.incubator.repository.EvaluationRepository;
import com.enicarthage.incubator.repository.ProjectRepository;
import com.enicarthage.incubator.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvaluationServiceTest {

    @Mock private EvaluationRepository evaluationRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private ApplicationRepository applicationRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private EvaluationService evaluationService;

    private User evaluator;
    private Application application;
    private Round activeRound;

    @BeforeEach
    void setUp() {
        evaluator = new User();
        evaluator.setId(1L);
        evaluator.setEmail("evaluator@test.com");

        activeRound = new Round();
        activeRound.setId(10L);
        activeRound.setStatus(RoundStatus.ACTIVE);

        application = new Application();
        application.setId(100L);
        application.setCurrentRound(activeRound);
    }

    @Test
    void evaluate_Success() {
        EvaluationRequest request = new EvaluationRequest();
        request.setApplicationId(100L);
        request.setScore(85);
        request.setComment("Good");

        when(userRepository.findByEmail("evaluator@test.com")).thenReturn(Optional.of(evaluator));
        when(applicationRepository.findById(100L)).thenReturn(Optional.of(application));
        
        Evaluation savedEvaluation = new Evaluation();
        savedEvaluation.setScore(85);
        savedEvaluation.setComment("Good");
        
        when(evaluationRepository.save(any(Evaluation.class))).thenReturn(savedEvaluation);

        Evaluation result = evaluationService.evaluate(request, "evaluator@test.com");

        assertThat(result.getScore()).isEqualTo(85);
        verify(evaluationRepository).save(any(Evaluation.class));
    }

    @Test
    void evaluate_ThrowsException_WhenRoundNotActive() {
        activeRound.setStatus(RoundStatus.COMPLETED);
        
        EvaluationRequest request = new EvaluationRequest();
        request.setApplicationId(100L);

        when(userRepository.findByEmail("evaluator@test.com")).thenReturn(Optional.of(evaluator));
        when(applicationRepository.findById(100L)).thenReturn(Optional.of(application));

        assertThrows(IllegalStateException.class, () -> {
            evaluationService.evaluate(request, "evaluator@test.com");
        });
    }

    @Test
    void getAverageScore_ReturnsValue() {
        when(evaluationRepository.findAverageScoreByProjectId(1L)).thenReturn(Optional.of(92.5));

        Double avg = evaluationService.getAverageScore(1L);

        assertThat(avg).isEqualTo(92.5);
    }
}
