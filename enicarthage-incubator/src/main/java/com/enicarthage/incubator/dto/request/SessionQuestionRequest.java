package com.enicarthage.incubator.dto.request;

import com.enicarthage.incubator.model.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SessionQuestionRequest {
    private Long id;

    @NotBlank(message = "Le libellé est obligatoire")
    private String label;

    @NotNull(message = "Le type est obligatoire")
    private QuestionType type;

    private String options; // comma-separated for RADIO/CHECKBOX

    private boolean required = true;

    private int orderIndex = 0;
}
