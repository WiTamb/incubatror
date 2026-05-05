package com.enicarthage.incubator.controller;

import com.enicarthage.incubator.dto.request.SessionRequest;
import com.enicarthage.incubator.dto.response.SessionResponse;
import com.enicarthage.incubator.model.Role;
import com.enicarthage.incubator.model.User;
import com.enicarthage.incubator.repository.UserRepository;
import com.enicarthage.incubator.service.SessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SessionController.class)
@AutoConfigureMockMvc(addFilters = false)
class SessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SessionService sessionService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private com.enicarthage.incubator.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void shouldGetAllSessionsForAdmin() throws Exception {
        User admin = new User();
        admin.setEmail("admin@test.com");
        admin.setRole(Role.ADMIN);
        
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        SessionResponse session = SessionResponse.builder().id(1L).name("Session 1").build();
        when(sessionService.getAllSessions()).thenReturn(List.of(session));

        mockMvc.perform(get("/api/sessions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(1));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void shouldCreateSession() throws Exception {
        SessionRequest request = new SessionRequest();
        request.setName("New Session");
        request.setStartDate(java.time.LocalDate.now());
        request.setEndDate(java.time.LocalDate.now().plusDays(30));

        SessionResponse response = SessionResponse.builder().id(2L).name("New Session").build();

        when(sessionService.createSession(any(SessionRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(2));
    }
}
