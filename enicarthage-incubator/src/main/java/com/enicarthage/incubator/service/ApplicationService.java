package com.enicarthage.incubator.service;

import com.enicarthage.incubator.dto.request.EvaluationRequest;
import com.enicarthage.incubator.dto.request.SelectionOverrideRequest;
import com.enicarthage.incubator.dto.response.ApplicationResponse;
import com.enicarthage.incubator.dto.response.EvaluationResponse;
import com.enicarthage.incubator.dto.response.RoundResultResponse;
import com.enicarthage.incubator.dto.response.UserResponse;
import com.enicarthage.incubator.exception.ResourceNotFoundException;
import com.enicarthage.incubator.model.*;
import com.enicarthage.incubator.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final EvaluationRepository evaluationRepository;
    private final SessionQuestionRepository questionRepository;
    private final QuestionnaireAnswerRepository answerRepository;
    private final RoundRepository roundRepository;
    private final RoundSelectionOverrideRepository overrideRepository;
    private final EmailService emailService;

    // ─── Read ─────────────────────────────────────────────────────────────────

    public List<ApplicationResponse> getMyApplications() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return applicationRepository.findByCandidateId(user.getId()).stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<ApplicationResponse> getSessionApplications(Long sessionId, Long roundId) {
        List<Application> apps = applicationRepository.findBySessionId(sessionId);

        if (roundId != null) {
            Session session = sessionRepository.findById(sessionId).orElse(null);
            boolean isRound1 = session != null && session.getRounds().stream()
                    .anyMatch(r -> r.getId().equals(roundId) && r.getOrderIndex() <= 1);
            final boolean includeNullRound = isRound1;

            apps = apps.stream().filter(app -> {
                if (app.getCurrentRound() != null && app.getCurrentRound().getId().equals(roundId)) return true;
                return includeNullRound && app.getCurrentRound() == null;
            }).collect(Collectors.toList());
        }
        return apps.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ─── Apply ────────────────────────────────────────────────────────────────

    @Transactional
    public ApplicationResponse applyToSession(Long sessionId) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        User candidate = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session non trouvée"));

        if (applicationRepository.findBySessionIdAndCandidateId(sessionId, candidate.getId()).isPresent()) {
            throw new IllegalStateException("Vous avez déjà postulé à cette session");
        }

        Application application = Application.builder()
                .session(session).candidate(candidate).status(ApplicationStatus.PENDING).build();
        return mapToResponse(applicationRepository.save(application));
    }

    // ─── Manual advance / reject ──────────────────────────────────────────────

    @Transactional
    public ApplicationResponse acceptToRound1(Long id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée"));
        Round round1 = app.getSession().getRounds().stream()
                .filter(r -> r.getOrderIndex() == 1).findFirst()
                .orElseThrow(() -> new IllegalStateException("Round 1 non défini"));
        app.setCurrentRound(round1);
        app.setStatus(ApplicationStatus.ACCEPTED_ROUND_1);
        return mapToResponse(applicationRepository.save(app));
    }

    @Transactional
    public ApplicationResponse advanceApplication(Long id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée"));
        if (app.getCurrentRound() == null) throw new IllegalStateException("Le candidat n'est pas dans un round");
        int nextIndex = app.getCurrentRound().getOrderIndex() + 1;
        Round nextRound = app.getSession().getRounds().stream()
                .filter(r -> r.getOrderIndex() == nextIndex).findFirst()
                .orElseThrow(() -> new IllegalStateException("Pas de round suivant"));
        app.setCurrentRound(nextRound);
        switch (nextIndex) {
            case 2 -> app.setStatus(ApplicationStatus.ACCEPTED_ROUND_2);
            case 3 -> app.setStatus(ApplicationStatus.ACCEPTED_ROUND_3);
            case 4 -> app.setStatus(ApplicationStatus.ACCEPTED_ROUND_4);
            case 5 -> app.setStatus(ApplicationStatus.ACCEPTED_ROUND_5);
            default -> app.setStatus(ApplicationStatus.COMPLETED);
        }
        return mapToResponse(applicationRepository.save(app));
    }

    @Transactional
    public ApplicationResponse rejectApplication(Long id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée"));
        app.setStatus(ApplicationStatus.REJECTED);
        app.setCurrentRound(null);
        return mapToResponse(applicationRepository.save(app));
    }

    @Transactional
    public ApplicationResponse eliminateApplication(Long id) {
        Application app = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée"));
        if (app.getCurrentRound() != null) {
            switch (app.getCurrentRound().getOrderIndex()) {
                case 1 -> app.setStatus(ApplicationStatus.ELIMINATED_ROUND_1);
                case 2 -> app.setStatus(ApplicationStatus.ELIMINATED_ROUND_2);
                case 3 -> app.setStatus(ApplicationStatus.ELIMINATED_ROUND_3);
                case 4 -> app.setStatus(ApplicationStatus.ELIMINATED_ROUND_4);
                case 5 -> app.setStatus(ApplicationStatus.ELIMINATED_ROUND_5);
            }
        } else {
            app.setStatus(ApplicationStatus.REJECTED);
        }
        return mapToResponse(applicationRepository.save(app));
    }

    // ─── Evaluation ───────────────────────────────────────────────────────────

    @Transactional
    public ApplicationResponse evaluateApplication(Long id, EvaluationRequest request) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Candidature introuvable"));

        String evaluatorEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User evaluator = userRepository.findByEmail(evaluatorEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Évaluateur introuvable"));

        // Project is now optional. We evaluate the Application and its Questionnaire Answers.
        // If no round is assigned to the application, default to the first round of the session
        Round roundToEvaluate = application.getCurrentRound();
        if (roundToEvaluate == null) {
            List<Round> sessionRounds = roundRepository.findBySessionIdOrderByOrderIndexAsc(application.getSession().getId());
            if (sessionRounds.isEmpty()) {
                throw new IllegalStateException("Aucun round n'est configuré pour cette session.");
            }
            roundToEvaluate = sessionRounds.get(0);
        }

        // Strict validation: check if the round is ACTIVE
        if (roundToEvaluate.getStatus() != RoundStatus.ACTIVE) {
            throw new IllegalStateException("L'évaluation n'est autorisée que lorsque le round est actif (EN COURS). Statut actuel: " + roundToEvaluate.getStatus());
        }

        Project project = projectRepository.findByOwnerId(application.getCandidate().getId()).stream()
                .filter(p -> (application.getCurrentRound() == null && p.getRound() == null) ||
                        (p.getRound() != null && application.getCurrentRound() != null &&
                                p.getRound().getId().equals(application.getCurrentRound().getId())))
                .findFirst()
                .orElse(null);


        // Check if evaluation already exists for this evaluator, application and round
        final Round finalRoundToEvaluate = roundToEvaluate;
        Evaluation evaluation = evaluationRepository.findByApplicationId(application.getId()).stream()
                .filter(e -> e.getEvaluator().getId().equals(evaluator.getId()) &&
                        e.getRound() != null && e.getRound().getId().equals(finalRoundToEvaluate.getId()))
                .findFirst()
                .orElse(null);

        if (evaluation == null) {
            evaluation = Evaluation.builder()
                    .application(application)
                    .project(project)
                    .evaluator(evaluator)
                    .round(roundToEvaluate)
                    .build();
        }

        evaluation.setScore(request.getScore());
        evaluation.setComment(request.getComment());
        evaluation.setRecommendation(request.getRecommendation());
        evaluation.setEvaluatedAt(java.time.LocalDateTime.now());
        
        evaluationRepository.save(evaluation);
        evaluationRepository.flush();
        System.out.println("DEBUG: Evaluation saved for app " + application.getId() + " - Score: " + evaluation.getScore());

        if (roundToEvaluate != null) {
            checkAndGenerateSelectionList(roundToEvaluate, application.getSession());
        }

        return mapToResponse(application);
    }

    // ─── Selection lifecycle ──────────────────────────────────────────────────

    /** Returns ranked selection list for a round. */
    public RoundResultResponse getSelectionList(Long roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round non trouvé"));

        // For Round 1, also include applications with null currentRound (PENDING/just accepted)
        boolean isRound1 = round.getOrderIndex() <= 1;
        List<Application> roundApps = applicationRepository.findBySessionId(round.getSession().getId()).stream()
                .filter(a -> {
                    if (a.getCurrentRound() != null && a.getCurrentRound().getId().equals(roundId)) return true;
                    // For Round 1, include apps with no round assigned (PENDING, ACCEPTED_ROUND_1)
                    if (isRound1 && a.getCurrentRound() == null) return true;
                    return false;
                })
                .collect(Collectors.toList());

        UserResponse jpDto = round.getJuryPresident() != null ? toUserResponse(round.getJuryPresident()) : null;

        int totalEvaluators = round.getEvaluators().size();
        boolean allEvaluated = totalEvaluators > 0 && !roundApps.isEmpty() && roundApps.stream().allMatch(app -> {
            long evalCount = evaluationRepository.findByApplicationId(app.getId()).stream()
                    .filter(e -> e.getRound() != null && e.getRound().getId().equals(roundId))
                    .count();
            return evalCount >= totalEvaluators;
        });

        return RoundResultResponse.builder()
                .roundId(round.getId())
                .roundName(round.getName())
                .passingCandidatesCount(round.getPassingCandidatesCount() != null ? round.getPassingCandidatesCount() : 0)
                .selectionValidated(round.isSelectionValidated())
                .selectionFinalized(round.isSelectionFinalized())
                .allEvaluated(allEvaluated)
                .totalEvaluators(totalEvaluators)
                .juryPresident(jpDto)
                .rankedCandidates(buildRankedList(round, roundApps))
                .build();
    }

    /** Admin overrides individual entries — each change requires a justification. */
    @Transactional
    public RoundResultResponse overrideSelection(Long roundId, SelectionOverrideRequest request) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round non trouvé"));

        if (round.isSelectionFinalized())
            throw new IllegalStateException("Liste finalisée — aucune modification possible.");

        String adminEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        for (SelectionOverrideRequest.CandidateDecision d : request.getDecisions()) {
            if (d.getJustification() == null || d.getJustification().isBlank())
                throw new IllegalStateException("Une justification est obligatoire pour chaque modification.");

            Application app = applicationRepository.findById(d.getApplicationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Candidature non trouvée : " + d.getApplicationId()));

            RoundSelectionOverride ov = overrideRepository
                    .findByRoundIdAndApplicationId(roundId, app.getId())
                    .orElse(RoundSelectionOverride.builder().round(round).application(app).build());

            ov.setAccepted(d.isAccepted());
            ov.setJustification(d.getJustification());
            ov.setModifiedBy(admin);
            ov.setModifiedAt(LocalDateTime.now());
            overrideRepository.save(ov);
        }

        round.setSelectionValidated(true);
        roundRepository.save(round);
        return getSelectionList(roundId);
    }

    /**
     * Jury President (or Admin) finalizes the list:
     * advances/eliminates candidates and sends emails.
     */
    @Transactional
    public RoundResultResponse finalizeSelection(Long roundId) {
        Round round = roundRepository.findById(roundId)
                .orElseThrow(() -> new ResourceNotFoundException("Round non trouvé"));

        if (round.isSelectionFinalized())
            throw new IllegalStateException("La liste est déjà finalisée.");

        String callerEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User caller = userRepository.findByEmail(callerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        boolean isAdmin = caller.getRole() == Role.ADMIN;
        boolean isJP = round.getJuryPresident() != null &&
                round.getJuryPresident().getId().equals(caller.getId());
        if (!isAdmin && !isJP)
            throw new IllegalStateException("Seul l'administrateur ou le président du jury peut finaliser.");

        // ── Block if evaluations are not complete ──
        int totalEvaluators = round.getEvaluators().size();
        boolean isRound1Final = round.getOrderIndex() <= 1;
        List<Application> roundApps = applicationRepository.findBySessionId(round.getSession().getId()).stream()
                .filter(a -> {
                    if (a.getCurrentRound() != null && a.getCurrentRound().getId().equals(roundId)) return true;
                    if (isRound1Final && a.getCurrentRound() == null) return true;
                    return false;
                })
                .collect(Collectors.toList());

        if (totalEvaluators > 0 && !roundApps.isEmpty()) {
            boolean allEvaluated = roundApps.stream().allMatch(app -> {
                long evalCount = evaluationRepository.findByApplicationId(app.getId()).stream()
                        .filter(e -> e.getRound() != null && e.getRound().getId().equals(roundId))
                        .count();
                return evalCount >= totalEvaluators;
            });
            if (!allEvaluated) {
                throw new IllegalStateException("Impossible de finaliser : toutes les évaluations n'ont pas encore été soumises par chaque évaluateur.");
            }
        }

        List<RoundResultResponse.CandidateRankEntry> ranked = buildRankedList(round, roundApps);

        Session session = round.getSession();
        int nextIdx = round.getOrderIndex() + 1;
        Round nextRound = session.getRounds().stream()
                .filter(r -> r.getOrderIndex() == nextIdx).findFirst().orElse(null);
        String nextRoundName = nextRound != null ? nextRound.getName() : "Fin du programme";

        for (RoundResultResponse.CandidateRankEntry entry : ranked) {
            Application app = applicationRepository.findById(entry.getApplicationId()).orElseThrow();
            double score = entry.getAverageScore() != null ? entry.getAverageScore() : 0.0;
            String name = app.getCandidate().getFirstName() + " " + app.getCandidate().getLastName();
            String email = app.getCandidate().getEmail();

            if (entry.isFinalAccepted()) {
                if (nextRound != null) {
                    app.setCurrentRound(nextRound);
                    switch (nextIdx) {
                        case 2 -> app.setStatus(ApplicationStatus.ACCEPTED_ROUND_2);
                        case 3 -> app.setStatus(ApplicationStatus.ACCEPTED_ROUND_3);
                        case 4 -> app.setStatus(ApplicationStatus.ACCEPTED_ROUND_4);
                        case 5 -> app.setStatus(ApplicationStatus.ACCEPTED_ROUND_5);
                        default -> app.setStatus(ApplicationStatus.COMPLETED);
                    }
                } else {
                    app.setStatus(ApplicationStatus.COMPLETED);
                }
                applicationRepository.save(app);
                emailService.sendAcceptanceEmail(email, name, round.getName(), score, nextRoundName);
            } else {
                switch (round.getOrderIndex()) {
                    case 1 -> app.setStatus(ApplicationStatus.ELIMINATED_ROUND_1);
                    case 2 -> app.setStatus(ApplicationStatus.ELIMINATED_ROUND_2);
                    case 3 -> app.setStatus(ApplicationStatus.ELIMINATED_ROUND_3);
                    case 4 -> app.setStatus(ApplicationStatus.ELIMINATED_ROUND_4);
                    case 5 -> app.setStatus(ApplicationStatus.ELIMINATED_ROUND_5);
                }
                app.setCurrentRound(null);
                applicationRepository.save(app);
                emailService.sendRejectionEmail(email, name, round.getName(), score);
            }
        }

        if (nextRound != null) {
            nextRound.setStatus(RoundStatus.UPCOMING);
            roundRepository.save(nextRound);
        }

        round.setStatus(RoundStatus.COMPLETED);
        round.setSelectionFinalized(true);
        roundRepository.save(round);
        return getSelectionList(roundId);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private void checkAndGenerateSelectionList(Round round, Session session) {
        if (round.getStatus() == RoundStatus.COMPLETED) return;
        int required = round.getEvaluators().size();
        if (required == 0) return;

        List<Application> roundApps = applicationRepository.findBySessionId(session.getId()).stream()
                .filter(a -> a.getCurrentRound() != null && a.getCurrentRound().getId().equals(round.getId()))
                .collect(Collectors.toList());
        if (roundApps.isEmpty()) return;

        boolean allDone = roundApps.stream().allMatch(app -> {
            return evaluationRepository.findByApplicationId(app.getId()).stream()
                    .filter(e -> e.getRound() != null && e.getRound().getId().equals(round.getId()))
                    .count() >= required;
        });

        if (allDone) {
            // Notify admin(s)
            userRepository.findByRole(Role.ADMIN).forEach(admin ->
                    emailService.sendSelectionReadyEmail(
                            admin.getEmail(),
                            admin.getFirstName() + " " + admin.getLastName(),
                            round.getName(), session.getName()));
            // Notify jury president
            if (round.getJuryPresident() != null) {
                User jp = round.getJuryPresident();
                emailService.sendSelectionReadyEmail(
                        jp.getEmail(),
                        jp.getFirstName() + " " + jp.getLastName(),
                        round.getName(), session.getName());
            }
        }
    }

    private List<RoundResultResponse.CandidateRankEntry> buildRankedList(Round round, List<Application> roundApps) {
        List<RoundSelectionOverride> overrides = overrideRepository.findByRoundId(round.getId());
        int passingCount = round.getPassingCandidatesCount() != null && round.getPassingCandidatesCount() > 0
                ? round.getPassingCandidatesCount() : roundApps.size();

        record AS(Application app, double score, int evalCount) {}
        List<AS> scores = roundApps.stream().map(app -> {
            List<Evaluation> evals = evaluationRepository.findByApplicationId(app.getId()).stream()
                    .filter(e -> e.getRound() != null && e.getRound().getId().equals(round.getId()))
                    .collect(Collectors.toList());
            double avg = 0.0;
            if (!evals.isEmpty()) avg = evals.stream().mapToDouble(Evaluation::getScore).average().orElse(0.0);
            return new AS(app, avg, evals.size());
        }).sorted((a, b) -> Double.compare(b.score(), a.score())).collect(Collectors.toList());

        List<RoundResultResponse.CandidateRankEntry> result = new ArrayList<>();
        for (int i = 0; i < scores.size(); i++) {
            AS as = scores.get(i);
            boolean autoAccepted = i < passingCount;
            final Long appId = as.app().getId();
            RoundSelectionOverride ov = overrides.stream()
                    .filter(o -> o.getApplication().getId().equals(appId)).findFirst().orElse(null);
            boolean finalAccepted = ov != null ? ov.isAccepted() : autoAccepted;

            result.add(RoundResultResponse.CandidateRankEntry.builder()
                    .applicationId(appId)
                    .candidateId(as.app().getCandidate().getId())
                    .candidateName(as.app().getCandidate().getFirstName() + " " + as.app().getCandidate().getLastName())
                    .candidateEmail(as.app().getCandidate().getEmail())
                    .averageScore(Math.round(as.score() * 10.0) / 10.0)
                    .evaluationCount(as.evalCount())
                    .rank(i + 1)
                    .autoAccepted(autoAccepted)
                    .finalAccepted(finalAccepted)
                    .overrideJustification(ov != null ? ov.getJustification() : null)
                    .overriddenBy(ov != null ? ov.getModifiedBy().getFirstName() + " " + ov.getModifiedBy().getLastName() : null)
                    .overriddenAt(ov != null ? ov.getModifiedAt() : null)
                    .build());
        }
        return result;
    }

    public ApplicationResponse mapToResponse(Application app) {
        List<EvaluationResponse> history = evaluationRepository.findByApplicationId(app.getId()).stream()
                .map(this::mapEvaluationToResponse)
                .collect(Collectors.toList());

        Double averageScore = null;
        if (app.getCurrentRound() != null) {
            List<Evaluation> evals = evaluationRepository.findByApplicationId(app.getId()).stream()
                    .filter(e -> e.getRound() != null && e.getRound().getId().equals(app.getCurrentRound().getId()))
                    .collect(Collectors.toList());
            if (!evals.isEmpty()) {
                averageScore = Math.round(evals.stream().mapToDouble(Evaluation::getScore).average().orElse(0.0) * 10.0) / 10.0;
            }
        }

        return ApplicationResponse.builder()
                .id(app.getId())
                .sessionId(app.getSession().getId())
                .sessionName(app.getSession().getName())
                .candidateId(app.getCandidate().getId())
                .candidateName(app.getCandidate().getFirstName() + " " + app.getCandidate().getLastName())
                .candidateEmail(app.getCandidate().getEmail())
                .currentRoundId(app.getCurrentRound() != null ? app.getCurrentRound().getId() : null)
                .currentRoundName(app.getCurrentRound() != null ? app.getCurrentRound().getName() : "Aucun")
                .currentRoundIndex(app.getCurrentRound() != null ? app.getCurrentRound().getOrderIndex() : 0)
                .status(app.getStatus())
                .averageScore(averageScore)
                .evaluationHistory(history)
                .appliedAt(app.getAppliedAt())
                .updatedAt(app.getUpdatedAt())
                .build();
    }

    private EvaluationResponse mapEvaluationToResponse(Evaluation e) {
        return EvaluationResponse.builder()
                .id(e.getId()).score(e.getScore()).comment(e.getComment())
                .recommendation(e.getRecommendation()).evaluatedAt(e.getEvaluatedAt())
                .evaluatorName(e.getEvaluator().getFirstName() + " " + e.getEvaluator().getLastName())
                .evaluatorEmail(e.getEvaluator().getEmail())
                .roundId(e.getRound() != null ? e.getRound().getId() : null)
                .roundName(e.getRound() != null ? e.getRound().getName() : "N/A")
                .build();
    }

    private UserResponse toUserResponse(User u) {
        return UserResponse.builder()
                .id(u.getId()).firstName(u.getFirstName()).lastName(u.getLastName())
                .email(u.getEmail()).role(u.getRole().name()).build();
    }
}
