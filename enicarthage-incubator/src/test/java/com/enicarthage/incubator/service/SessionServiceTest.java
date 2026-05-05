package com.enicarthage.incubator.service;

import com.enicarthage.incubator.dto.request.SessionRequest;
import com.enicarthage.incubator.dto.response.SessionResponse;
import com.enicarthage.incubator.exception.ResourceNotFoundException;
import com.enicarthage.incubator.model.Session;
import com.enicarthage.incubator.model.SessionStatus;
import com.enicarthage.incubator.repository.ApplicationRepository;
import com.enicarthage.incubator.repository.RoundRepository;
import com.enicarthage.incubator.repository.SessionRepository;
import com.enicarthage.incubator.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private ApplicationRepository applicationRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private UserRepository userRepository;
    @Mock private QuestionnaireService questionnaireService;

    @InjectMocks
    private SessionService sessionService;

    private Session testSession;

    @BeforeEach
    void setUp() {
        testSession = new Session();
        testSession.setId(1L);
        testSession.setName("Test Session");
        testSession.setStatus(SessionStatus.OPEN);
        testSession.setRounds(new ArrayList<>());
    }

    @Test
    void getAllSessions_ReturnsListOfSessions() {
        when(sessionRepository.findAll()).thenReturn(List.of(testSession));
        when(applicationRepository.countBySessionId(1L)).thenReturn(5L);

        List<SessionResponse> results = sessionService.getAllSessions();

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Test Session");
        assertThat(results.get(0).getTotalApplicants()).isEqualTo(5L);
    }

    @Test
    void getSessionById_ThrowsResourceNotFoundException_WhenNotFound() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            sessionService.getSessionById(99L);
        });
    }

    @Test
    void createSession_Success() {
        SessionRequest request = new SessionRequest();
        request.setName("New Session");
        request.setStatus(SessionStatus.OPEN);
        
        Session savedSession = new Session();
        savedSession.setId(2L);
        savedSession.setName("New Session");
        savedSession.setRounds(new ArrayList<>());

        when(sessionRepository.save(any(Session.class))).thenReturn(savedSession);

        SessionResponse response = sessionService.createSession(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(2L);
        verify(sessionRepository).save(any(Session.class));
    }

    @Test
    void deleteSession_Success() {
        when(sessionRepository.existsById(1L)).thenReturn(true);
        
        sessionService.deleteSession(1L);
        
        verify(sessionRepository).deleteById(1L);
    }

    @Test
    void deleteSession_ThrowsException_WhenNotFound() {
        when(sessionRepository.existsById(1L)).thenReturn(false);
        
        assertThrows(ResourceNotFoundException.class, () -> {
            sessionService.deleteSession(1L);
        });
    }
}
