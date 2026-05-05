package com.enicarthage.incubator.controller;

import com.enicarthage.incubator.dto.request.EvaluationRequest;
import com.enicarthage.incubator.model.Evaluation;
import com.enicarthage.incubator.service.EvaluationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EvaluationController.class)
@AutoConfigureMockMvc(addFilters = false)
class EvaluationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EvaluationService evaluationService;

    @MockBean
    private com.enicarthage.incubator.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    @Test
    @WithMockUser(username = "evaluator@test.com", roles = "EVALUATOR")
    void shouldSubmitEvaluation() throws Exception {
        EvaluationRequest request = new EvaluationRequest();
        request.setApplicationId(1L);
        request.setScore(80);
        request.setComment("Comment");

        Evaluation evaluation = new Evaluation();
        evaluation.setId(10L);
        evaluation.setScore(80);

        when(evaluationService.evaluate(any(EvaluationRequest.class), eq("evaluator@test.com"))).thenReturn(evaluation);

        mockMvc.perform(post("/api/evaluations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(10));
    }

    @Test
    @WithMockUser(username = "admin@test.com", roles = "ADMIN")
    void shouldGetAverageScore() throws Exception {
        when(evaluationService.getAverageScore(1L)).thenReturn(85.5);

        mockMvc.perform(get("/api/evaluations/project/1/average"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(85.5));
    }
}
