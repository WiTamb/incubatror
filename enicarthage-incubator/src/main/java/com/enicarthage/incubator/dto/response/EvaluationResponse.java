package com.enicarthage.incubator.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class EvaluationResponse {
    private Long id;
    private Integer score;
    private String comment;
    private String recommendation;
    private LocalDateTime evaluatedAt;
    private String evaluatorName;
    private String evaluatorEmail;
    private Long roundId;
    private String roundName;
}
