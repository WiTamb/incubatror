package com.enicarthage.incubator.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionnaireAnswerResponse {
    private Long id;
    private Long applicationId;
    private SessionQuestionResponse question;
    private String answer;
    private String roundName;
}
