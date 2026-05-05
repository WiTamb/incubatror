package com.enicarthage.incubator.repository;

import com.enicarthage.incubator.model.Round;
import com.enicarthage.incubator.model.Session;
import com.enicarthage.incubator.model.SessionStatus;
import com.enicarthage.incubator.model.User;
import com.enicarthage.incubator.model.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class SessionRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private SessionRepository sessionRepository;

    @Test
    void shouldFindSessionByEvaluatorEmail() {
        // Given
        User evaluator = new User();
        evaluator.setEmail("evaluator@test.com");
        evaluator.setPassword("password");
        evaluator.setFirstName("Eval");
        evaluator.setLastName("User");
        evaluator.setRole(Role.EVALUATOR);
        evaluator = entityManager.persistAndFlush(evaluator);

        Session session1 = new Session();
        session1.setName("Session 1");
        session1.setStartDate(java.time.LocalDate.now());
        session1.setEndDate(java.time.LocalDate.now().plusDays(30));
        session1.setStatus(SessionStatus.OPEN);
        session1 = entityManager.persistAndFlush(session1);

        Round round = new Round();
        round.setName("Round 1");
        round.setSession(session1);
        round.setEvaluators(Set.of(evaluator));
        entityManager.persistAndFlush(round);
        
        Session session2 = new Session();
        session2.setName("Session 2");
        session2.setStartDate(java.time.LocalDate.now());
        session2.setEndDate(java.time.LocalDate.now().plusDays(30));
        session2.setStatus(SessionStatus.OPEN);
        entityManager.persistAndFlush(session2);

        // When
        List<Session> foundSessions = sessionRepository.findByEvaluatorEmail("evaluator@test.com");

        // Then
        assertThat(foundSessions).hasSize(1);
        assertThat(foundSessions.get(0).getName()).isEqualTo("Session 1");
    }
}
