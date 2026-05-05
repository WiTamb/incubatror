package com.enicarthage.incubator.controller;

import com.enicarthage.incubator.dto.request.ProjectRequest;
import com.enicarthage.incubator.model.Project;
import com.enicarthage.incubator.model.ProjectStatus;
import com.enicarthage.incubator.service.ProjectService;
import com.enicarthage.incubator.service.QuestionnaireService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProjectController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for simple unit testing
class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProjectService projectService;

    @MockBean
    private QuestionnaireService questionnaireService;

    @MockBean
    private com.enicarthage.incubator.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    @Test
    @WithMockUser(username = "candidate@test.com", roles = "CANDIDATE")
    void shouldGetMyProjects() throws Exception {
        Project project = new Project();
        project.setId(1L);
        project.setTitle("My Project");

        when(projectService.getMyProjects("candidate@test.com")).thenReturn(List.of(project));

        mockMvc.perform(get("/api/projects/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(1))
                .andExpect(jsonPath("$.data[0].title").value("My Project"));
    }

    @Test
    @WithMockUser(username = "candidate@test.com", roles = "CANDIDATE")
    void shouldSubmitProject() throws Exception {
        ProjectRequest request = new ProjectRequest();
        request.setTitle("New Project");
        
        String projectJson = objectMapper.writeValueAsString(request);
        MockMultipartFile projectPart = new MockMultipartFile("project", "", "application/json", projectJson.getBytes());

        Project savedProject = new Project();
        savedProject.setId(1L);
        savedProject.setTitle("New Project");

        when(projectService.submitProject(any(ProjectRequest.class), any(), any(), eq("candidate@test.com")))
                .thenReturn(savedProject);

        mockMvc.perform(multipart("/api/projects")
                        .file(projectPart))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void shouldUpdateStatus() throws Exception {
        Project project = new Project();
        project.setId(1L);
        project.setStatus(ProjectStatus.ACCEPTED);

        when(projectService.updateStatus(eq(1L), eq(ProjectStatus.ACCEPTED), eq("admin@test.com")))
                .thenReturn(project);

        mockMvc.perform(patch("/api/projects/1/status")
                        .param("status", "ACCEPTED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void shouldDeleteProject() throws Exception {
        mockMvc.perform(delete("/api/projects/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
