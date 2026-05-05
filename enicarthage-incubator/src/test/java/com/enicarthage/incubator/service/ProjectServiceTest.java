package com.enicarthage.incubator.service;

import com.enicarthage.incubator.dto.request.ProjectRequest;
import com.enicarthage.incubator.exception.ResourceNotFoundException;
import com.enicarthage.incubator.model.*;
import com.enicarthage.incubator.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock private ProjectRepository projectRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProgramRepository programRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private ApplicationRepository applicationRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private ProjectService projectService;

    private User testUser;
    private ProjectRequest projectRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@test.com");

        projectRequest = new ProjectRequest();
        projectRequest.setTitle("My Test Project");
        projectRequest.setDescription("A description");
        projectRequest.setDomain("AI");
    }

    @Test
    void submitProject_ThrowsResourceNotFoundException_WhenUserNotFound() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            projectService.submitProject(projectRequest, null, null, "unknown@test.com");
        });
    }

    @Test
    void submitProject_ThrowsIllegalStateException_WhenNoActiveSession() {
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testUser));
        when(applicationRepository.findByCandidateId(1L)).thenReturn(List.of());

        assertThrows(IllegalStateException.class, () -> {
            projectService.submitProject(projectRequest, null, null, "test@test.com");
        });
    }

    @Test
    void submitProject_Success() {
        // Arrange
        Session activeSession = new Session();
        activeSession.setStatus(SessionStatus.OPEN);
        
        Round round = new Round();
        round.setName("Round 1");
        round.setOrderIndex(1);
        activeSession.setRounds(List.of(round));

        Application application = new Application();
        application.setSession(activeSession);
        application.setStatus(ApplicationStatus.ACCEPTED_ROUND_1);
        application.setCurrentRound(round);

        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testUser));
        when(applicationRepository.findByCandidateId(1L)).thenReturn(List.of(application));
        
        Project savedProject = new Project();
        savedProject.setTitle("My Test Project");
        savedProject.setRound(round);
        
        when(projectRepository.save(any(Project.class))).thenReturn(savedProject);
        
        MockMultipartFile doc = new MockMultipartFile("document", "doc.pdf", "application/pdf", "dummy content".getBytes());
        when(fileStorageService.store(doc, "documents")).thenReturn("path/to/doc.pdf");

        // Act
        Project result = projectService.submitProject(projectRequest, doc, null, "test@test.com");

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("My Test Project");
        verify(projectRepository).save(any(Project.class));
        verify(notificationService).createNotification(eq(testUser), anyString(), eq("SUCCESS"));
    }

    @Test
    void getMyProjects_ReturnsListOfProjects() {
        when(userRepository.findByEmail("test@test.com")).thenReturn(Optional.of(testUser));
        
        Project p1 = new Project();
        p1.setTitle("P1");
        when(projectRepository.findByOwnerId(1L)).thenReturn(List.of(p1));

        List<Project> results = projectService.getMyProjects("test@test.com");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getTitle()).isEqualTo("P1");
    }

    @Test
    void updateStatus_Success() {
        Project project = new Project();
        project.setId(10L);
        project.setTitle("Status Project");
        project.setOwner(testUser);
        
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(projectRepository.save(any(Project.class))).thenAnswer(i -> i.getArguments()[0]);

        Project updated = projectService.updateStatus(10L, ProjectStatus.ACCEPTED, "admin@test.com");

        assertThat(updated.getStatus()).isEqualTo(ProjectStatus.ACCEPTED);
        verify(notificationService).createNotification(eq(testUser), contains("accepté"), eq("INFO"));
    }
    
    @Test
    void deleteProject_Success() {
        Project project = new Project();
        project.setId(1L);
        
        when(projectRepository.findById(1L)).thenReturn(Optional.of(project));
        
        projectService.deleteProject(1L);
        
        verify(projectRepository).delete(project);
    }
}
