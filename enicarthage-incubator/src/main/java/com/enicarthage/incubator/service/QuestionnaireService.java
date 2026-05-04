package com.enicarthage.incubator.service;

import com.enicarthage.incubator.dto.request.QuestionnaireSubmitRequest;
import com.enicarthage.incubator.dto.request.SessionQuestionRequest;
import com.enicarthage.incubator.dto.response.SessionQuestionResponse;
import com.enicarthage.incubator.exception.ResourceNotFoundException;
import com.enicarthage.incubator.model.*;
import com.enicarthage.incubator.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionnaireService {

    private final RoundRepository roundRepository;
    private final SessionQuestionRepository questionRepository;
    private final ApplicationRepository applicationRepository;
    private final QuestionnaireAnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    // ── ADMIN ──────────────────────────────────────────────────────────────

    public List<SessionQuestionResponse> getQuestionnaire(Long roundId) {
        return questionRepository.findByRoundIdOrderByOrderIndexAsc(roundId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public List<SessionQuestionResponse> saveQuestionnaire(Long roundId, List<SessionQuestionRequest> requests) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round non trouvé"));

        List<SessionQuestion> existingQuestions = questionRepository.findByRoundIdOrderByOrderIndexAsc(roundId);

        int idx = 0;
        for (SessionQuestionRequest req : requests) {
            SessionQuestion q = existingQuestions.stream()
                    .filter(eq -> req.getId() != null && eq.getId().equals(req.getId()))
                    .findFirst()
                    .orElse(null);

            if (q != null) {
                // Update existing question
                q.setLabel(req.getLabel());
                q.setType(req.getType());
                q.setOptions(req.getOptions());
                q.setRequired(req.isRequired());
                q.setOrderIndex(idx++);
                questionRepository.save(q);
                existingQuestions.remove(q);
            } else {
                // Create new question
                SessionQuestion newQ = SessionQuestion.builder()
                        .round(round)
                        .label(req.getLabel())
                        .type(req.getType())
                        .options(req.getOptions())
                        .required(req.isRequired())
                        .orderIndex(idx++)
                        .build();
                questionRepository.save(newQ);
            }
        }

        // Delete any questions that were removed by the admin
        if (!existingQuestions.isEmpty()) {
            questionRepository.deleteAll(existingQuestions);
        }

        return getQuestionnaire(roundId);
    }

    // ── CANDIDATE ──────────────────────────────────────────────────────────

    @Transactional
    public void submitAnswers(Long roundId, QuestionnaireSubmitRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User candidate = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round non trouvé"));

        if (round.getStatus() != RoundStatus.UPCOMING) {
            throw new IllegalStateException("La soumission n'est plus possible pour ce round (Statut: " + round.getStatus() + ").");
        }

        Application app = applicationRepository
                .findBySessionIdAndCandidateId(round.getSession().getId(), candidate.getId())
                .orElseGet(() -> {
                    if (round.getOrderIndex() != 1) {
                        throw new IllegalStateException("Vous n'êtes pas inscrit à cette session.");
                    }
                    return applicationRepository.save(Application.builder()
                            .session(round.getSession())
                            .candidate(candidate)
                            .status(ApplicationStatus.PENDING)
                            .build());
                });

        if (app.getCurrentRound() != null && !app.getCurrentRound().getId().equals(roundId)) {
            throw new IllegalStateException("Vous n'êtes pas autorisé à soumettre pour ce round actuellement.");
        }

        // Delete old answers for this round only (preserve answers from other rounds)
        List<QuestionnaireAnswer> existing = answerRepository.findByApplicationId(app.getId()).stream()
                .filter(a -> a.getQuestion().getRound().getId().equals(roundId))
                .collect(Collectors.toList());
        answerRepository.deleteAll(existing);

        if (request.getAnswers() != null) {
            request.getAnswers().forEach((questionId, answerText) -> {
                questionRepository.findById(questionId).ifPresent(question -> {
                    QuestionnaireAnswer answer = QuestionnaireAnswer.builder()
                            .application(app)
                            .question(question)
                            .answer(answerText)
                            .build();
                    answerRepository.save(answer);
                });
            });
        }
    }

    public boolean hasAnswered(Long roundId) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User candidate = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        Round round = roundRepository.findById(roundId).orElseThrow();
        
        boolean answered = applicationRepository.findBySessionIdAndCandidateId(round.getSession().getId(), candidate.getId())
                .map(app -> {
                    List<QuestionnaireAnswer> answers = answerRepository.findByApplicationId(app.getId());
                    boolean found = answers.stream().anyMatch(a -> a.getQuestion().getRound().getId().equals(roundId));
                    System.out.println("DEBUG: Candidate " + email + " for round " + roundId + " hasAnswered=" + found);
                    return found;
                })
                .orElse(false);
        return answered;
    }

    public List<com.enicarthage.incubator.dto.response.QuestionnaireAnswerResponse> getAnswersForApplication(
            Long applicationId) {
        return answerRepository.findByApplicationId(applicationId).stream()
                .map(a -> com.enicarthage.incubator.dto.response.QuestionnaireAnswerResponse.builder()
                        .id(a.getId())
                        .applicationId(a.getApplication().getId())
                        .question(toResponse(a.getQuestion()))
                        .answer(a.getAnswer())
                        .roundName(a.getQuestion().getRound() != null ? a.getQuestion().getRound().getName() : "N/A")
                        .build())
                .collect(Collectors.toList());
    }

    public List<com.enicarthage.incubator.dto.response.QuestionnaireAnswerResponse> getAnswersForProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        if (project.getRound() == null || project.getRound().getSession() == null) return List.of();
        Application app = applicationRepository.findBySessionIdAndCandidateId(
                project.getRound().getSession().getId(), project.getOwner().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée pour ce projet"));
        return getAnswersForApplication(app.getId());
    }

    // ── MAPPER ─────────────────────────────────────────────────────────────

    private SessionQuestionResponse toResponse(SessionQuestion q) {
        return SessionQuestionResponse.builder()
                .id(q.getId())
                .roundId(q.getRound().getId())
                .label(q.getLabel())
                .type(q.getType())
                .options(q.getOptions())
                .required(q.isRequired())
                .orderIndex(q.getOrderIndex())
                .build();
    }
}
