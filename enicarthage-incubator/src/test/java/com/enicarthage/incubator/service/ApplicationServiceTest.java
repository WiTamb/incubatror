package com.enicarthage.incubator.service;

import com.enicarthage.incubator.dto.response.ApplicationResponse;
import com.enicarthage.incubator.exception.ResourceNotFoundException;
import com.enicarthage.incubator.model.*;
import com.enicarthage.incubator.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock private ApplicationRepository applicationRepository;
    @Mock private SessionRepository sessionRepository;
    @Mock private UserRepository userRepository;
    @Mock private EvaluationRepository evaluationRepository;

    @InjectMocks
    private ApplicationService applicationService;

    private User candidate;
    private Session session;

    @BeforeEach
    void setUp() {
        candidate = new User();
        candidate.setId(1L);
        candidate.setEmail("candidate@test.com");
        candidate.setFirstName("John");
        candidate.setLastName("Doe");

        session = new Session();
        session.setId(10L);
        session.setName("Session X");
    }

    private void mockSecurityContext(User user) {
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getPrincipal()).thenReturn(user);
        lenient().when(authentication.getName()).thenReturn(user.getEmail());
        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void applyToSession_Success() {
        mockSecurityContext(candidate);

        when(userRepository.findById(1L)).thenReturn(Optional.of(candidate));
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(applicationRepository.findBySessionIdAndCandidateId(10L, 1L)).thenReturn(Optional.empty());

        Application savedApp = new Application();
        savedApp.setId(100L);
        savedApp.setCandidate(candidate);
        savedApp.setSession(session);
        savedApp.setStatus(ApplicationStatus.PENDING);

        when(applicationRepository.save(any(Application.class))).thenReturn(savedApp);

        ApplicationResponse response = applicationService.applyToSession(10L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.PENDING);
    }

    @Test
    void applyToSession_ThrowsException_WhenAlreadyApplied() {
        mockSecurityContext(candidate);

        when(userRepository.findById(1L)).thenReturn(Optional.of(candidate));
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(applicationRepository.findBySessionIdAndCandidateId(10L, 1L)).thenReturn(Optional.of(new Application()));

        assertThrows(IllegalStateException.class, () -> {
            applicationService.applyToSession(10L);
        });
    }

    @Test
    void rejectApplication_Success() {
        Application app = new Application();
        app.setId(100L);
        app.setCandidate(candidate);
        app.setSession(session);

        when(applicationRepository.findById(100L)).thenReturn(Optional.of(app));
        when(applicationRepository.save(any(Application.class))).thenReturn(app);

        ApplicationResponse response = applicationService.rejectApplication(100L);

        assertThat(response.getStatus()).isEqualTo(ApplicationStatus.REJECTED);
    }
}
