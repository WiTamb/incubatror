package com.enicarthage.incubator.config;

import com.enicarthage.incubator.model.*;
import com.enicarthage.incubator.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final RoundRepository roundRepository;
    private final SessionQuestionRepository questionRepository;
    private final ApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;
    private final QuestionnaireAnswerRepository answerRepository;
    private final EvaluationRepository evaluationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (sessionRepository.count() > 0) {
            log.info("ℹ️ Données de test déjà présentes. Suppression en cours...");
            answerRepository.deleteAll();
            evaluationRepository.deleteAll();
            projectRepository.deleteAll();
            applicationRepository.deleteAll();
            questionRepository.deleteAll();
            roundRepository.deleteAll();
            sessionRepository.deleteAll();
            // We do not delete users to avoid FK constraints with event_registrations, etc.
            // createUser will just fetch the existing users.
        }

        log.info("🌱 Initialisation du jeu de données complet et cohérent...");
        
        // 1. UTILISATEURS
        User admin = createUser("Admin", "Enicarthage", "admin@enicarthage.tn", Role.ADMIN, null);
        
        User evalTech = createUser("Sami", "Gharbi", "sami.tech@enicarthage.tn", Role.EVALUATOR, null);
        User evalBiz = createUser("Amira", "Trabelsi", "amira.biz@enicarthage.tn", Role.EVALUATOR, null);
        User evalGen = createUser("Karim", "Benali", "karim.gen@enicarthage.tn", Role.EVALUATOR, null);

        User cand1 = createUser("Youssef", "Karray", "youssef@enicarthage.tn", Role.STUDENT, "Génie Logiciel");
        User cand2 = createUser("Fatma", "Zahra", "fatma@enicarthage.tn", Role.STUDENT, "Génie Électrique");
        User cand3 = createUser("Ahmed", "Mansour", "ahmed@enicarthage.tn", Role.STUDENT, "Génie Industriel");
        User cand4 = createUser("Nour", "Bouzid", "nour@enicarthage.tn", Role.STUDENT, "Télécoms");
        User cand5 = createUser("Omar", "Jebali", "omar@enicarthage.tn", Role.STUDENT, "Génie Civil");
        User cand6 = createUser("Ines", "Gassoumi", "ines@enicarthage.tn", Role.STUDENT, "Mécatronique");
        User cand7 = createUser("Ali", "Trabelsi", "ali@enicarthage.tn", Role.STUDENT, "Génie Logiciel");
        User cand8 = createUser("Mariem", "Selmi", "mariem@enicarthage.tn", Role.STUDENT, "Réseaux");

        // Set d'évaluateurs
        Set<User> allEvals = Set.of(evalTech, evalBiz, evalGen);
        Set<User> techEvals = Set.of(evalTech, evalGen);

        // 2. SESSIONS & ROUNDS & QUESTIONS

        // --- SESSION 1: TERMINEE (CLOSED) ---
        Session closedSession = sessionRepository.save(Session.builder()
                .name("Bootcamp IA & Big Data 2024")
                .description("Un programme intensif pour les solutions basées sur l'Intelligence Artificielle.")
                .startDate(LocalDate.now().minusYears(1))
                .endDate(LocalDate.now().minusMonths(6))
                .status(SessionStatus.CLOSED).build());

        Round cRound1 = roundRepository.save(Round.builder().session(closedSession).name("Sélection sur Dossier")
                .orderIndex(1).status(RoundStatus.COMPLETED).evaluators(allEvals).passingCandidatesCount(5)
                .juryPresident(evalTech).build());
        Round cRound2 = roundRepository.save(Round.builder().session(closedSession).name("Pitch Final")
                .orderIndex(2).status(RoundStatus.COMPLETED).evaluators(allEvals).passingCandidatesCount(1)
                .juryPresident(evalBiz).build());

        addQuestions(cRound1, Arrays.asList(
                q("Nom de la solution IA", QuestionType.TEXT, true, 0, null),
                q("Cas d'usage principal", QuestionType.TEXTAREA, true, 1, null)
        ));

        addQuestions(cRound2, Arrays.asList(
                q("Lien de la présentation (Pitch Deck)", QuestionType.FILE, true, 0, null),
                q("Besoins de financement estimés", QuestionType.TEXT, true, 1, null)
        ));

        // --- SESSION 2: EN COURS (IN_PROGRESS) ---
        Session activeSession = sessionRepository.save(Session.builder()
                .name("Incubation GreenTech 2025")
                .description("Accompagnement des startups à impact environnemental et énergétique.")
                .startDate(LocalDate.now().minusMonths(2))
                .endDate(LocalDate.now().plusMonths(3))
                .status(SessionStatus.IN_PROGRESS).build());

        Round aRound1 = roundRepository.save(Round.builder().session(activeSession).name("Évaluation du Concept")
                .orderIndex(1).status(RoundStatus.COMPLETED).evaluators(allEvals).passingCandidatesCount(4)
                .juryPresident(evalGen).build());
        Round aRound2 = roundRepository.save(Round.builder().session(activeSession).name("Prototype Technique")
                .orderIndex(2).status(RoundStatus.ACTIVE).evaluators(techEvals).passingCandidatesCount(2)
                .juryPresident(evalTech).build());
        Round aRound3 = roundRepository.save(Round.builder().session(activeSession).name("Go To Market")
                .orderIndex(3).status(RoundStatus.UPCOMING).evaluators(Set.of(evalBiz)).passingCandidatesCount(1)
                .juryPresident(evalBiz).build());

        addQuestions(aRound1, Arrays.asList(
                q("Titre du projet GreenTech", QuestionType.TEXT, true, 0, null),
                q("Description de l'impact écologique", QuestionType.TEXTAREA, true, 1, null),
                q("Technologie clé", QuestionType.RADIO, true, 2, "IoT, Matériaux, Énergie renouvelable, Autre")
        ));
        
        addQuestions(aRound2, Arrays.asList(
                q("Lien Démo / Vidéo", QuestionType.VIDEO_URL, false, 0, null)
        ));
        
        addQuestions(aRound3, Arrays.asList(
                q("Stratégie d'acquisition client", QuestionType.TEXTAREA, true, 0, null),
                q("Canaux de distribution envisagés", QuestionType.CHECKBOX, true, 1, "B2B Direct, Partenariats, Réseaux Sociaux, Autre")
        ));

        // --- SESSION 3: OUVERTE (OPEN) ---
        Session openSession = sessionRepository.save(Session.builder()
                .name("FinTech Challenge Automne")
                .description("Postulez avec vos idées innovantes pour la finance de demain.")
                .startDate(LocalDate.now().minusDays(5))
                .endDate(LocalDate.now().plusMonths(2))
                .status(SessionStatus.OPEN).build());

        Round oRound1 = roundRepository.save(Round.builder().session(openSession).name("Phase d'Inscription")
                .orderIndex(1).status(RoundStatus.ACTIVE).evaluators(allEvals).passingCandidatesCount(10)
                .juryPresident(evalGen).build());

        addQuestions(oRound1, Arrays.asList(
                q("Nom de la startup FinTech", QuestionType.TEXT, true, 0, null),
                q("Problème résolu", QuestionType.TEXTAREA, true, 1, null),
                q("Marché ciblé", QuestionType.CHECKBOX, true, 2, "B2B, B2C, B2B2C, Institutionnel")
        ));


        // 3. CANDIDATURES ET PROJETS

        // ---- Candidats Session CLOSED ----
        // Youssef: Gagnant (COMPLETED)
        Application app1 = applicationRepository.save(Application.builder()
                .session(closedSession).candidate(cand1).currentRound(cRound2).status(ApplicationStatus.COMPLETED).build());
        Project proj1 = projectRepository.save(Project.builder()
                .title("DataMind AI").description("Analyse prédictive pour l'industrie 4.0.")
                .domain("IA & Industrie").githubUrl("https://github.com/youssef/datamind")
                .owner(cand1).round(cRound2).status(ProjectStatus.ACCEPTED).submittedAt(LocalDate.now().minusMonths(7).atStartOfDay()).build());
        
        evaluationRepository.save(Evaluation.builder()
                .application(app1).project(proj1).evaluator(evalTech).round(cRound1)
                .score(85).comment("Très bonne idée, équipe solide.").recommendation("Passe au round suivant.")
                .build());
        evaluationRepository.save(Evaluation.builder()
                .application(app1).project(proj1).evaluator(evalBiz).round(cRound2)
                .score(92).comment("Excellent business plan. Marché porteur.").recommendation("Accepter le projet en incubation.")
                .build());

        // Fatma: Eliminée au Round 2
        Application app2 = applicationRepository.save(Application.builder()
                .session(closedSession).candidate(cand2).currentRound(cRound2).status(ApplicationStatus.ELIMINATED_ROUND_2).build());
        Project proj2 = projectRepository.save(Project.builder()
                .title("ChatBot HR").description("Assistant RH virtuel pour le recrutement.")
                .domain("IA & RH").owner(cand2).round(cRound2).status(ProjectStatus.REJECTED).submittedAt(LocalDate.now().minusMonths(8).atStartOfDay()).build());
        
        evaluationRepository.save(Evaluation.builder()
                .application(app2).project(proj2).evaluator(evalGen).round(cRound1)
                .score(70).comment("Projet intéressant mais manque de détails techniques.").recommendation("Passe au round suivant avec réserve.")
                .build());
        evaluationRepository.save(Evaluation.builder()
                .application(app2).project(proj2).evaluator(evalTech).round(cRound2)
                .score(45).comment("L'architecture proposée n'est pas viable.").recommendation("Éliminer.")
                .build());

        // ---- Candidats Session IN_PROGRESS ----
        List<SessionQuestion> greenQs1 = questionRepository.findByRoundIdOrderByOrderIndexAsc(aRound1.getId());
        List<SessionQuestion> greenQs2 = questionRepository.findByRoundIdOrderByOrderIndexAsc(aRound2.getId());

        // Ahmed: Accepté au Round 2, Projet soumis, En cours de revue
        Application app3 = applicationRepository.save(Application.builder()
                .session(activeSession).candidate(cand3).currentRound(aRound2).status(ApplicationStatus.ACCEPTED_ROUND_2).build());
        answer(app3, greenQs1.get(0), "SolarFlow"); answer(app3, greenQs1.get(1), "Optimisation des panneaux solaires.");
        answer(app3, greenQs1.get(2), "Énergie renouvelable");
        // Also answered round 2 video
        answer(app3, greenQs2.get(0), "https://youtube.com/solarflow");
        Project proj3 = projectRepository.save(Project.builder()
                .title("SolarFlow").description("Tableau de bord de monitoring solaire.")
                .domain("Énergie").githubUrl("https://github.com/ahmed/solarflow")
                .owner(cand3).round(aRound2).status(ProjectStatus.UNDER_REVIEW).submittedAt(LocalDate.now().minusDays(2).atStartOfDay()).build());
        
        evaluationRepository.save(Evaluation.builder()
                .application(app3).project(proj3).evaluator(evalTech).round(aRound1)
                .score(80).comment("Bon potentiel technique, le MVP est clair.").recommendation("Accepter pour la phase de prototypage.")
                .build());

        // Nour: Accepté au Round 2, Projet soumis, Déjà accepté
        Application app4 = applicationRepository.save(Application.builder()
                .session(activeSession).candidate(cand4).currentRound(aRound2).status(ApplicationStatus.ACCEPTED_ROUND_2).build());
        answer(app4, greenQs1.get(0), "EcoTrack"); answer(app4, greenQs1.get(1), "Suivi de la consommation carbone personnelle.");
        answer(app4, greenQs1.get(2), "Autre");
        Project proj4 = projectRepository.save(Project.builder()
                .title("EcoTrack App").description("App mobile de tracking carbone.")
                .domain("Mobile & Écologie").owner(cand4).round(aRound2).status(ProjectStatus.ACCEPTED).submittedAt(LocalDate.now().minusDays(5).atStartOfDay()).build());
        
        evaluationRepository.save(Evaluation.builder()
                .application(app4).project(proj4).evaluator(evalBiz).round(aRound1)
                .score(88).comment("Business model très clair et acquisition utilisateur bien pensée.").recommendation("Accepter.")
                .build());

        // Omar: Accepté au Round 2, Projet NON encore soumis
        Application app5 = applicationRepository.save(Application.builder()
                .session(activeSession).candidate(cand5).currentRound(aRound2).status(ApplicationStatus.ACCEPTED_ROUND_2).build());
        answer(app5, greenQs1.get(0), "WindTech"); answer(app5, greenQs1.get(1), "Micro-éoliennes urbaines.");
        answer(app5, greenQs1.get(2), "Énergie renouvelable");

        // Ines: Eliminée au Round 1
        Application app6 = applicationRepository.save(Application.builder()
                .session(activeSession).candidate(cand6).currentRound(aRound1).status(ApplicationStatus.ELIMINATED_ROUND_1).build());
        answer(app6, greenQs1.get(0), "GreenPlast"); answer(app6, greenQs1.get(1), "Recyclage plastique.");
        
        // ---- Candidats Session OPEN ----
        List<SessionQuestion> finQs = questionRepository.findByRoundIdOrderByOrderIndexAsc(oRound1.getId());

        // Ali: En attente (vient de postuler)
        Application app7 = applicationRepository.save(Application.builder()
                .session(openSession).candidate(cand7).currentRound(null).status(ApplicationStatus.PENDING).build());
        answer(app7, finQs.get(0), "PaySmart"); answer(app7, finQs.get(1), "Paiement sans contact par QR Code innovant.");
        answer(app7, finQs.get(2), "B2C, B2B");

        // Mariem: Rejetée directement (dossier invalide)
        Application app8 = applicationRepository.save(Application.builder()
                .session(openSession).candidate(cand8).currentRound(null).status(ApplicationStatus.REJECTED).build());
        answer(app8, finQs.get(0), "Test App"); answer(app8, finQs.get(1), "Rien pour l'instant");

        log.info("✅ Jeu de données de test créé avec succès !");
        log.info("📧 Comptes de test:");
        log.info("   - Admin: admin@enicarthage.tn");
        log.info("   - Évaluateurs: sami.tech@enicarthage.tn, amira.biz@enicarthage.tn");
        log.info("   - Candidats: youssef@enicarthage.tn (Terminé), ahmed@enicarthage.tn (Round 2 actif), ali@enicarthage.tn (En attente)");
        log.info("🔑 Mot de passe pour tous: Admin@2024 / Eval@2024 / Student@2024");
    }

    private User createUser(String first, String last, String email, Role role, String specialty) {
        if (!userRepository.existsByEmail(email)) {
            String pwd = role == Role.ADMIN ? "Admin@2024" : (role == Role.EVALUATOR ? "Eval@2024" : "Student@2024");
            return userRepository.save(User.builder()
                    .firstName(first).lastName(last).email(email)
                    .password(passwordEncoder.encode(pwd))
                    .role(role).specialty(specialty).enabled(true).blocked(false).build());
        }
        return userRepository.findByEmail(email).orElseThrow();
    }

    private void answer(Application app, SessionQuestion question, String text) {
        answerRepository.save(QuestionnaireAnswer.builder()
                .application(app).question(question).answer(text).build());
    }

    private SessionQuestion q(String label, QuestionType type, boolean required, int idx, String options) {
        return SessionQuestion.builder()
                .label(label).type(type).required(required).orderIndex(idx).options(options).build();
    }

    private void addQuestions(Round round, List<SessionQuestion> questions) {
        questions.forEach(q -> q.setRound(round));
        questionRepository.saveAll(questions);
    }
}
