package com.enicarthage.incubator.repository;

import com.enicarthage.incubator.model.Application;
import com.enicarthage.incubator.model.Evaluation;
import com.enicarthage.incubator.model.Project;
import com.enicarthage.incubator.model.Session;
import com.enicarthage.incubator.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class EvaluationRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private EvaluationRepository evaluationRepository;

    @Test
    void shouldFindAverageScoreByProjectId() {
        // Given
        User owner = new User();
        owner.setEmail("owner@test.com");
        owner.setPassword("pass");
        owner.setFirstName("O");
        owner.setLastName("W");
        owner.setRole(com.enicarthage.incubator.model.Role.STUDENT);
        owner = entityManager.persistAndFlush(owner);

        Project project = new Project();
        project.setTitle("Project X");
        project.setOwner(owner);
        project = entityManager.persistAndFlush(project);

        Session session = new Session();
        session.setName("Eval Session");
        session.setStartDate(java.time.LocalDate.now());
        session.setEndDate(java.time.LocalDate.now().plusDays(30));
        session = entityManager.persistAndFlush(session);

        Application application = new Application();
        application.setCandidate(owner);
        application.setSession(session);
        application = entityManager.persistAndFlush(application);

        Evaluation eval1 = new Evaluation();
        eval1.setProject(project);
        eval1.setApplication(application);
        eval1.setEvaluator(owner);
        eval1.setScore(80);
        entityManager.persist(eval1);

        Evaluation eval2 = new Evaluation();
        eval2.setProject(project);
        eval2.setApplication(application);
        eval2.setEvaluator(owner);
        eval2.setScore(90);
        entityManager.persist(eval2);

        entityManager.flush();

        // When
        Optional<Double> averageScore = evaluationRepository.findAverageScoreByProjectId(project.getId());

        // Then
        assertThat(averageScore).isPresent();
        assertThat(averageScore.get()).isEqualTo(85.0);
    }
}
