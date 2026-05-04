package com.enicarthage.incubator.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Represents the ranked selection list for a round, shown to Admin and Jury President.
 */
@Data
@Builder
public class RoundResultResponse {
    private Long roundId;
    private String roundName;
    private int passingCandidatesCount;
    private boolean selectionValidated;
    private boolean selectionFinalized;
    private boolean allEvaluated;  // true when every candidate has been evaluated by all assigned evaluators
    private int totalEvaluators;   // number of evaluators assigned to this round
    private UserResponse juryPresident;
    private List<CandidateRankEntry> rankedCandidates;

    @Data
    @Builder
    public static class CandidateRankEntry {
        private Long applicationId;
        private Long candidateId;
        private String candidateName;
        private String candidateEmail;
        private Double averageScore;
        private int evaluationCount;  // how many evaluators have scored this candidate
        private int rank;
        /** Auto-computed result (before any override) */
        private boolean autoAccepted;
        /** Final result after possible admin override */
        private boolean finalAccepted;
        /** Admin override justification if changed */
        private String overrideJustification;
        /** Name of admin who overrode */
        private String overriddenBy;
        private LocalDateTime overriddenAt;
    }
}
